import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_VERSION,
  LegalFooter,
  LegalLanguageSwitch,
  List,
  getLegalMetadata,
  getLegalTranslations,
  legalConfig,
} from '@/lib/legal';

export const metadata = getLegalMetadata(
  '/acceptable-use',
  'Acceptable Use Policy'
);

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AcceptableUsePage({ searchParams }: Props) {
  const { locale, t, common } = await getLegalTranslations(
    'legal.acceptableUse',
    await searchParams
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-200">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {LEGAL_VERSION} - {common('effectiveDate')}: {LEGAL_EFFECTIVE_DATE}
        </p>
        <LegalLanguageSwitch
          currentPath="/acceptable-use"
          locale={locale}
          labels={common.raw('languageSwitch')}
        />
      </header>

      <section className="space-y-8 text-sm leading-relaxed text-slate-300">
        <TextSection
          title={t('scope.title')}
          body={t('scope.body', {
            companyName: legalConfig.companyName,
            companyLegalName: legalConfig.companyLegalName,
            cnpj: legalConfig.cnpj,
          })}
          outro={t('scope.outro')}
        />
        <TextSection
          title={t('prohibited.title')}
          body={t('prohibited.body')}
          items={t.raw('prohibited.items')}
        />
        <TextSection
          title={t('consent.title')}
          body={t('consent.body')}
          items={t.raw('consent.items')}
        />
        <TextSection
          title={t('messaging.title')}
          items={t.raw('messaging.items')}
        />
        <TextSection
          title={t('technical.title')}
          items={t.raw('technical.items')}
        />
        <TextSection
          title={t('impersonation.title')}
          body={t('impersonation.body')}
        />

        <div>
          <h2 className="mb-2 text-base font-semibold text-white">
            {t('abuse.title')}
          </h2>
          <p>{t('abuse.body')}</p>
          <p className="mt-2">
            <strong>{common('email')}:</strong>{' '}
            <a
              href={`mailto:${legalConfig.abuseEmail}`}
              className="text-primary hover:underline"
            >
              {legalConfig.abuseEmail}
            </a>
          </p>
          <p className="mt-1">{t('abuse.response')}</p>
          <p className="mt-2">
            {t('abuse.meta')}{' '}
            <a
              href="https://www.facebook.com/help/contact/274459462613911"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              facebook.com/help/contact
            </a>
          </p>
        </div>

        <TextSection
          title={t('consequences.title')}
          body={t('consequences.body')}
          items={t.raw('consequences.items')}
        />
        <TextSection
          title={t('operator.title')}
          body={t('operator.body', {
            companyName: legalConfig.companyName,
            companyLegalName: legalConfig.companyLegalName,
          })}
        />
        <TextSection title={t('updates.title')} body={t('updates.body')} />
      </section>

      <LegalFooter
        current="acceptableUse"
        labels={common.raw('footer')}
        locale={locale}
      />
    </main>
  );
}

function TextSection({
  title,
  body,
  items,
  outro,
}: {
  title: string;
  body?: string;
  items?: string[];
  outro?: string;
}) {
  return (
    <div>
      <h2 className="mb-2 text-base font-semibold text-white">{title}</h2>
      {body && <p>{body}</p>}
      {items && <List items={items} />}
      {outro && <p className="mt-2">{outro}</p>}
    </div>
  );
}
