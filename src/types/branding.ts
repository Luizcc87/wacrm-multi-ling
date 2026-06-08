// ============================================================
// Branding types — white-label / brand identity feature.
//
// AccountBranding   — the raw DB row from `account_branding`.
// ResolvedBranding  — the merged result after applying env and
//                     hard-coded defaults, ready for the UI.
// BrandingEnv       — env-var fallbacks read by getBrandingEnv().
// ============================================================

/** Raw row from the `account_branding` table (all columns nullable). */
export interface AccountBranding {
  app_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  sidebar_color: string | null;
}

/**
 * Fully-resolved branding after merging:
 *   account row > environment variables > DEFAULT_BRANDING.
 *
 * `appName` is always a non-empty string; the rest may be null
 * (meaning "no custom value — use the CSS/theme default").
 */
export interface ResolvedBranding {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  sidebarColor: string | null;
}

/** Env-var fallbacks parsed from NEXT_PUBLIC_APP_* variables. */
export interface BrandingEnv {
  appName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  sidebarColor?: string;
}
