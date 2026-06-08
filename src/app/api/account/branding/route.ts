// ============================================================
// PATCH /api/account/branding
//
// Upserts the `account_branding` row for the caller's account.
// Only admin+ may call this — enforced via requireRole("admin").
//
// Body (all fields optional, null clears the value):
//   app_name      string | null  — max 60 chars
//   logo_url      string | null  — must be a valid URL
//   favicon_url   string | null  — must be a valid URL
//   primary_color string | null  — #rrggbb hex
//   sidebar_color string | null  — #rrggbb hex
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole, toErrorResponse } from "@/lib/auth/account";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const brandingSchema = z.object({
  app_name: z.string().max(60).nullable().optional(),
  logo_url: z.string().url().refine(
    (val) => val.startsWith('https://') || val.startsWith('http://'),
    { message: 'URL must use http or https scheme' }
  ).nullable().optional(),
  favicon_url: z.string().url().refine(
    (val) => val.startsWith('https://') || val.startsWith('http://'),
    { message: 'URL must use http or https scheme' }
  ).nullable().optional(),
  primary_color: z
    .string()
    .regex(HEX_COLOR, "Must be a #rrggbb hex color")
    .nullable()
    .optional(),
  sidebar_color: z
    .string()
    .regex(HEX_COLOR, "Must be a #rrggbb hex color")
    .nullable()
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const ctx = await requireRole("admin");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = brandingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = {
      account_id: ctx.accountId,
      updated_at: new Date().toISOString(),
      ...parsed.data,
    };

    const { data, error } = await ctx.supabase
      .from("account_branding")
      .upsert(payload, { onConflict: "account_id" })
      .select(
        "account_id, app_name, logo_url, favicon_url, primary_color, sidebar_color, updated_at",
      )
      .single();

    if (error) {
      console.error("[PATCH /api/account/branding] upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save branding" },
        { status: 500 },
      );
    }

    return NextResponse.json({ branding: data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
