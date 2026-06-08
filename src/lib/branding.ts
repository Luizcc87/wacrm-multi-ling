// ============================================================
// Branding resolution — white-label / brand identity feature.
//
// Resolution priority (highest to lowest):
//   1. Account row  (`account_branding` table)
//   2. Env vars     (`NEXT_PUBLIC_APP_*`)
//   3. DEFAULT_BRANDING (hard-coded fallback)
//
// This module is isomorphic — it runs in both client and server
// contexts. It does NOT import supabase or next/headers.
// ============================================================

import type { AccountBranding, BrandingEnv, ResolvedBranding } from "@/types/branding";

/** Hard-coded defaults used when neither the account row nor env
 *  vars supply a value. */
export const DEFAULT_BRANDING: ResolvedBranding = {
  appName: "WaCRM",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: null,
  sidebarColor: null,
};

/**
 * Read white-label env vars and return a `BrandingEnv` object.
 * Only defined (non-empty) values are included.
 *
 * Safe to call on both client and server — all vars are
 * `NEXT_PUBLIC_*` and therefore included in the client bundle.
 */
export function getBrandingEnv(): BrandingEnv {
  const env: BrandingEnv = {};

  const name = process.env.NEXT_PUBLIC_APP_NAME;
  if (name) env.appName = name;

  const logo = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  if (logo) env.logoUrl = logo;

  const favicon = process.env.NEXT_PUBLIC_APP_FAVICON_URL;
  if (favicon) env.faviconUrl = favicon;

  const primary = process.env.NEXT_PUBLIC_APP_PRIMARY_COLOR;
  if (primary) env.primaryColor = primary;

  const sidebar = process.env.NEXT_PUBLIC_SIDEBAR_COLOR;
  if (sidebar) env.sidebarColor = sidebar;

  return env;
}

/**
 * Merge account branding row + env vars into a fully-resolved
 * `ResolvedBranding` value.
 *
 * Each field uses: account ?? env ?? default.
 *
 * The `primary_color` / `sidebar_color` columns on the DB carry a
 * CHECK constraint that rejects invalid hex values, so if the DB
 * ever returns a value it is already valid. If the constraint
 * fires, the INSERT/UPDATE is rejected and the column stays null,
 * at which point the env/default fallback applies naturally.
 */
export function resolveBranding(
  account: AccountBranding | null,
  env: BrandingEnv,
): ResolvedBranding {
  return {
    appName:
      account?.app_name ??
      env.appName ??
      DEFAULT_BRANDING.appName,

    logoUrl:
      account?.logo_url ??
      env.logoUrl ??
      DEFAULT_BRANDING.logoUrl,

    faviconUrl:
      account?.favicon_url ??
      env.faviconUrl ??
      DEFAULT_BRANDING.faviconUrl,

    primaryColor:
      account?.primary_color ??
      env.primaryColor ??
      DEFAULT_BRANDING.primaryColor,

    sidebarColor:
      account?.sidebar_color ??
      env.sidebarColor ??
      DEFAULT_BRANDING.sidebarColor,
  };
}
