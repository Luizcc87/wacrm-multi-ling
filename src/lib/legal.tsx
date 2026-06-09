import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const LEGAL_EFFECTIVE_DATE = '2026-06-09';
export const LEGAL_VERSION = 'v1.0';

export const legalConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
  companyName: process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME ?? 'wacrm',
  companyLegalName: process.env.NEXT_PUBLIC_LEGAL_COMPANY_LEGAL_NAME ?? '',
  cnpj: process.env.NEXT_PUBLIC_LEGAL_CNPJ ?? '',
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? '',
  abuseEmail:
    process.env.NEXT_PUBLIC_LEGAL_ABUSE_EMAIL ??
    process.env.NEXT_PUBLIC_LEGAL_EMAIL ??
    '',
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? '',
  dpoName: process.env.NEXT_PUBLIC_LEGAL_DPO_NAME ?? '',
  city: process.env.NEXT_PUBLIC_LEGAL_CITY ?? 'Brazil',
};

export function getLegalMetadata(path: string, title: string): Metadata {
  return {
    title: `${title} - ${legalConfig.companyName}`,
    robots: { index: true, follow: true },
    alternates: { canonical: `${legalConfig.appUrl}${path}` },
  };
}

export async function getLegalTranslations(
  namespace: string,
  searchParams?: Record<string, string | string[] | undefined>
) {
  const locale =
    searchParams?.lang === 'pt-BR' ? 'pt-BR' : routing.defaultLocale;

  return {
    locale,
    t: await getTranslations({ locale, namespace }),
    common: await getTranslations({ locale, namespace: 'legal.common' }),
  };
}

export function LegalFooter({
  current,
  labels,
  locale,
}: {
  current: 'privacy' | 'terms' | 'acceptableUse';
  labels: {
    privacyPolicy: string;
    termsOfService: string;
    acceptableUse: string;
  };
  locale: string;
}) {
  const legalLangSuffix = locale === 'pt-BR' ? '?lang=pt-BR' : '';

  return (
    <footer className="mt-16 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} {legalConfig.companyLegalName} · CNPJ{' '}
      {legalConfig.cnpj}
      {current !== 'privacy' && (
        <>
          {' · '}
          <Link
            href={`/privacy${legalLangSuffix}`}
            className="hover:text-slate-300"
          >
            {labels.privacyPolicy}
          </Link>
        </>
      )}
      {current !== 'terms' && (
        <>
          {' · '}
          <Link
            href={`/terms${legalLangSuffix}`}
            className="hover:text-slate-300"
          >
            {labels.termsOfService}
          </Link>
        </>
      )}
      {current !== 'acceptableUse' && (
        <>
          {' · '}
          <Link
            href={`/acceptable-use${legalLangSuffix}`}
            className="hover:text-slate-300"
          >
            {labels.acceptableUse}
          </Link>
        </>
      )}
    </footer>
  );
}

export function LegalLanguageSwitch({
  currentPath,
  locale,
  labels,
}: {
  currentPath: '/privacy' | '/terms' | '/acceptable-use';
  locale: string;
  labels: {
    viewInEnglish: string;
    viewInPortuguese: string;
  };
}) {
  const isPortuguese = locale === 'pt-BR';
  const href = isPortuguese ? currentPath : `${currentPath}?lang=pt-BR`;

  return (
    <div className="mt-4 text-sm text-slate-400">
      <Link href={href} className="text-primary hover:underline">
        {isPortuguese ? labels.viewInEnglish : labels.viewInPortuguese}
      </Link>
    </div>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
