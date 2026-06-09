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

export const metadata = getLegalMetadata('/terms', 'Terms of Service');

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TermsPage({ searchParams }: Props) {
  const { locale, t, common } = await getLegalTranslations(
    'legal.terms',
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
          currentPath="/terms"
          locale={locale}
          labels={common.raw('languageSwitch')}
        />
      </header>

      <section className="space-y-8 text-sm leading-relaxed text-slate-300">
        <TextSection
          title={t('acceptance.title')}
          body={t('acceptance.body', { companyName: legalConfig.companyName })}
        />

        <div>
          <h2 className="mb-2 text-base font-semibold text-white">
            {t('provider.title')}
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-40 py-1 text-slate-400">
                  {common('legalName')}
                </td>
                <td>{legalConfig.companyLegalName}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">{common('tradeName')}</td>
                <td>{legalConfig.companyName}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">CNPJ</td>
                <td>{legalConfig.cnpj}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">{common('email')}</td>
                <td>{legalConfig.email}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <TextSection
          title={t('service.title')}
          body={t('service.body', { companyName: legalConfig.companyName })}
          items={t.raw('service.items')}
          outro={t('service.outro', { companyName: legalConfig.companyName })}
        />
        <TextSection
          title={t('permitted.title')}
          body={t('permitted.body')}
          items={t.raw('permitted.items')}
        />
        <TextSection
          title={t('prohibited.title')}
          body={t('prohibited.body')}
          items={t.raw('prohibited.items')}
        />
        <TextSection
          title={t('responsibilities.title')}
          body={t('responsibilities.provider', {
            companyName: legalConfig.companyName,
          })}
          items={t.raw('responsibilities.providerItems')}
        />
        <TextSection
          body={t('responsibilities.customer')}
          items={t.raw('responsibilities.customerItems')}
        />
        <TextSection
          title={t('ip.title')}
          body={t('ip.body', { companyName: legalConfig.companyName })}
        />
        <TextSection
          title={t('termination.title')}
          body={t('termination.body', { companyName: legalConfig.companyName })}
          items={t.raw('termination.items')}
        />
        <TextSection
          title={t('liability.title')}
          body={t('liability.body', { companyName: legalConfig.companyName })}
          items={t.raw('liability.items')}
        />
        <TextSection
          title={t('law.title')}
          body={t('law.body', { city: legalConfig.city })}
        />
        <TextSection title={t('changes.title')} body={t('changes.body')} />

        <div>
          <h2 className="mb-2 text-base font-semibold text-white">
            {t('contact.title')}
          </h2>
          <p>
            {common('email')}: <strong>{legalConfig.email}</strong>
          </p>
        </div>
      </section>

      <LegalFooter
        current="terms"
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
  title?: string;
  body?: string;
  items?: string[];
  outro?: string;
}) {
  return (
    <div>
      {title && (
        <h2 className="mb-2 text-base font-semibold text-white">{title}</h2>
      )}
      {body && <p>{body}</p>}
      {items && <List items={items} />}
      {outro && <p className="mt-2">{outro}</p>}
    </div>
  );
}
