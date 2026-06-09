import { NextResponse } from "next/server";

import { getBrandingEnv, resolveBranding } from "@/lib/branding";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountBranding } from "@/types/branding";

export async function GET() {
  const env = getBrandingEnv();
  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json({ branding: resolveBranding(null, env) });
  }

  const { data, error } = await supabase
    .from("account_branding")
    .select("app_name, logo_url, favicon_url, primary_color, sidebar_color")
    .or(
      "app_name.not.is.null,logo_url.not.is.null,favicon_url.not.is.null,primary_color.not.is.null,sidebar_color.not.is.null",
    )
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !data?.[0]) {
    if (error) {
      console.error("[GET /api/public/branding] fallback lookup error:", error);
    }
    return NextResponse.json({ branding: resolveBranding(null, env) });
  }

  return NextResponse.json({
    branding: resolveBranding(data[0] as AccountBranding, env),
  });
}
