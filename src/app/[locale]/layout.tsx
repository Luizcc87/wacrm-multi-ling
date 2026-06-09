import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/hooks/use-theme';
import { LocalePreferenceSync } from '@/components/layout/locale-preference-sync';
import { LegalIdentityProvider } from '@/components/auth/legal-identity-provider';
import { getBrandingEnv, resolveBranding } from '@/lib/branding';

export async function generateMetadata(): Promise<Metadata> {
  const env = getBrandingEnv();
  // Try to fetch the first account's branding if possible.
  // On the public layout (pre-auth) we don't have a session, so we
  // fall back gracefully to env vars / defaults without throwing.
  let appName = env.appName ?? 'WaCRM';
  let faviconUrl: string | null = null;

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.account_id) {
        const { data: brandingRow } = await supabase
          .from('account_branding')
          .select('app_name, favicon_url')
          .eq('account_id', profile.account_id)
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
            env
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
    description: 'Self-hostable CRM template for WhatsApp.',
    robots: { index: false, follow: false },
    icons: {
      icon: faviconUrl ? [{ url: faviconUrl }] : [{ url: '/icon' }],
    },
    formatDetection: { email: false, address: false, telephone: false },
  };
}

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
  const legalIdentity = {
    companyLegalName: process.env.NEXT_PUBLIC_LEGAL_COMPANY_LEGAL_NAME ?? '',
    cnpj: process.env.NEXT_PUBLIC_LEGAL_CNPJ ?? '',
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <LegalIdentityProvider value={legalIdentity}>
          <LocalePreferenceSync />
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgb(30 41 59)',
                border: '1px solid rgb(51 65 85)',
                color: 'white',
              },
            }}
          />
        </LegalIdentityProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
