import { NextResponse } from "next/server";

import { requireRole, toErrorResponse } from "@/lib/auth/account";

const BUCKET = "account-branding";
const MAX_FILE_SIZE_BYTES = 1024 * 1024;

const ASSET_CONFIG = {
  logo: {
    column: "logo_url",
    allowedTypes: new Set(["image/png", "image/jpeg", "image/webp"]),
    extensions: {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    },
  },
  favicon: {
    column: "favicon_url",
    allowedTypes: new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ]),
    extensions: {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/x-icon": "ico",
      "image/vnd.microsoft.icon": "ico",
    },
  },
} as const;

type AssetKind = keyof typeof ASSET_CONFIG;

function isAssetKind(value: FormDataEntryValue | null): value is AssetKind {
  return value === "logo" || value === "favicon";
}

function extractManagedPath(publicUrl: string | null | undefined, accountId: string) {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return path.startsWith(`account-${accountId}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireRole("admin");
    const formData = await request.formData();
    const type = formData.get("type");
    const file = formData.get("file");

    if (!isAssetKind(type)) {
      return NextResponse.json(
        { error: "Invalid asset type. Use logo or favicon." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File must be 1 MB or smaller" },
        { status: 400 },
      );
    }

    const config = ASSET_CONFIG[type];
    if (!config.allowedTypes.has(file.type as never)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 },
      );
    }

    const { data: currentBranding } = await ctx.supabase
      .from("account_branding")
      .select("logo_url, favicon_url")
      .eq("account_id", ctx.accountId)
      .maybeSingle();

    const extension =
      config.extensions[file.type as keyof typeof config.extensions];
    const path = `account-${ctx.accountId}/${type}-${Date.now()}.${extension}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await ctx.supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[POST /api/account/branding/assets] upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload branding asset" },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = ctx.supabase.storage.from(BUCKET).getPublicUrl(path);

    const column = config.column;
    const { data: branding, error: upsertError } = await ctx.supabase
      .from("account_branding")
      .upsert(
        {
          account_id: ctx.accountId,
          updated_at: new Date().toISOString(),
          [column]: publicUrl,
        },
        { onConflict: "account_id" },
      )
      .select(
        "account_id, app_name, logo_url, favicon_url, primary_color, sidebar_color, updated_at",
      )
      .single();

    if (upsertError) {
      console.error("[POST /api/account/branding/assets] upsert error:", upsertError);
      await ctx.supabase.storage.from(BUCKET).remove([path]);
      return NextResponse.json(
        { error: "Failed to save branding asset" },
        { status: 500 },
      );
    }

    const previousUrl =
      type === "logo" ? currentBranding?.logo_url : currentBranding?.favicon_url;
    const previousPath = extractManagedPath(previousUrl, ctx.accountId);
    if (previousPath && previousPath !== path) {
      await ctx.supabase.storage.from(BUCKET).remove([previousPath]);
    }

    return NextResponse.json({ branding, publicUrl });
  } catch (err) {
    return toErrorResponse(err);
  }
}
