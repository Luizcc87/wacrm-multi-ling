import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/hooks/use-theme";
import { LocalePreferenceSync } from "@/components/layout/locale-preference-sync";
import { DEFAULT_THEME, STORAGE_KEY, THEME_IDS } from "@/lib/themes";
import { getBrandingEnv, resolveBranding } from "@/lib/branding";
import "../globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const env = getBrandingEnv();
  // Try to fetch the first account's branding if possible.
  // On the public layout (pre-auth) we don't have a session, so we
  // fall back gracefully to env vars / defaults without throwing.
  let appName = env.appName ?? "WaCRM";
  let faviconUrl: string | null = null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.account_id) {
        const { data: brandingRow } = await supabase
          .from("account_branding")
          .select("app_name, favicon_url")
          .eq("account_id", profile.account_id)
          .maybeSingle();

        if (brandingRow) {
          const resolved = resolveBranding(
            {
              app_name: brandingRow.app_name ?? null,
              logo_url: null,
              favicon_url: brandingRow.favicon_url ?? null,
              primary_color: null,
              sidebar_color: null,
            },
            env,
          );
          appName = resolved.appName;
          faviconUrl = resolved.faviconUrl;
        }
      }
    }
  } catch {
    // Non-critical — proceed with env / defaults.
  }

  return {
    title: { default: appName, template: `%s — ${appName}` },
    description: "Self-hostable CRM template for WhatsApp.",
    robots: { index: false, follow: false },
    icons: {
      icon: faviconUrl ? [{ url: faviconUrl }] : [{ url: "/icon" }],
    },
    formatDetection: { email: false, address: false, telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var STORAGE_KEY = ${JSON.stringify(STORAGE_KEY)};
    var DEFAULT = ${JSON.stringify(DEFAULT_THEME)};
    var ALLOWED = ${JSON.stringify(THEME_IDS)};
    var saved = localStorage.getItem(STORAGE_KEY);
    var theme = ALLOWED.indexOf(saved) !== -1 ? saved : DEFAULT;
    document.documentElement.dataset.theme = theme;
  } catch (_e) {
    document.documentElement.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
  }
})();
`;

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme={DEFAULT_THEME}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <LocalePreferenceSync />
            {children}
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: "rgb(30 41 59)",
                  border: "1px solid rgb(51 65 85)",
                  color: "white",
                },
              }}
            />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
