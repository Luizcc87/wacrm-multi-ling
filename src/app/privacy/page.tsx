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

export const metadata = getLegalMetadata('/privacy', 'Privacy Policy');

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PrivacyPage({ searchParams }: Props) {
  const { locale, t, common } = await getLegalTranslations(
    'legal.privacy',
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
          currentPath="/privacy"
          locale={locale}
          labels={common.raw('languageSwitch')}
        />
      </header>

      <section className="space-y-8 text-sm leading-relaxed text-slate-300">
        <div>
          <h2 className="mb-2 text-base font-semibold text-white">
            {t('controller.title')}
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
                <td className="py-1 text-slate-400">{common('address')}</td>
                <td>{legalConfig.address}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">{common('email')}</td>
                <td>{legalConfig.email}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PolicySection
          title={t('dataCollected.title')}
          intro={t('dataCollected.intro')}
          items={t.raw('dataCollected.items')}
        />
        <PolicySection title={t('use.title')} items={t.raw('use.items')} />
        <p className="font-medium text-white">{t('use.noAiAds')}</p>
        <PolicySection
          title={t('sharing.title')}
          intro={t('sharing.intro')}
          items={t.raw('sharing.items')}
          outro={t('sharing.outro')}
        />
        <PolicySection
          title={t('international.title')}
          intro={t('international.body')}
        />
        <PolicySection
          title={t('retention.title')}
          items={t.raw('retention.items')}
        />
        <PolicySection
          title={t('rights.title')}
          intro={t('rights.intro')}
          items={t.raw('rights.items')}
          outro={t('rights.outro', { email: legalConfig.email })}
        />

        <div>
          <h2 className="mb-2 text-base font-semibold text-white">
            {t('dpo.title')}
          </h2>
          <p>
            <strong>{legalConfig.dpoName}</strong>
            <br />
            {legalConfig.email}
          </p>
          <p className="mt-2 text-slate-400">
            {t('dpo.anpd')}{' '}
            <a
              href="https://www.gov.br/anpd"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              gov.br/anpd
            </a>
          </p>
        </div>

        <PolicySection
          title={t('security.title')}
          items={t.raw('security.items')}
        />
        <PolicySection title={t('updates.title')} intro={t('updates.body')} />

        <div>
          <h2 className="mb-2 text-base font-semibold text-white">
            {t('contact.title')}
          </h2>
          <p>
            {common('email')}: <strong>{legalConfig.email}</strong>
            <br />
            Website:{' '}
            <a
              href={legalConfig.appUrl}
              className="text-primary hover:underline"
            >
              {legalConfig.appUrl}
            </a>
          </p>
        </div>
      </section>

      <LegalFooter
        current="privacy"
        labels={common.raw('footer')}
        locale={locale}
      />
    </main>
  );
}

function PolicySection({
  title,
  intro,
  items,
  outro,
}: {
  title: string;
  intro?: string;
  items?: string[];
  outro?: string;
}) {
  return (
    <div>
      <h2 className="mb-2 text-base font-semibold text-white">{title}</h2>
      {intro && <p>{intro}</p>}
      {items && <List items={items} />}
      {outro && <p className="mt-2">{outro}</p>}
    </div>
  );
}
