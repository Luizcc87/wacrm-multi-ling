'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export function AuthLegalFooter({ className = '' }: { className?: string }) {
  const t = useTranslations('auth.legal');
  const locale = useLocale();
  const legalLangSuffix = locale === 'pt-BR' ? '?lang=pt-BR' : '';

  return (
    <footer className={`mt-6 text-center text-xs text-slate-500 ${className}`}>
      <p>
        {t('footerCopyright', {
          year: new Date().getFullYear(),
          companyLegalName:
            process.env.NEXT_PUBLIC_LEGAL_COMPANY_LEGAL_NAME ?? '',
          cnpj: process.env.NEXT_PUBLIC_LEGAL_CNPJ ?? '',
        })}
      </p>
      <p className="mt-1">
        <Link
          href={`/privacy${legalLangSuffix}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-300"
        >
          {t('privacyPolicy')}
        </Link>
        {' · '}
        <Link
          href={`/terms${legalLangSuffix}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-300"
        >
          {t('termsOfService')}
        </Link>
        {' · '}
        <Link
          href={`/acceptable-use${legalLangSuffix}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-300"
        >
          {t('acceptableUse')}
        </Link>
      </p>
    </footer>
  );
}
