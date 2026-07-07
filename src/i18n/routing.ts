import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'pt-BR'],
  defaultLocale: (process.env.NEXT_PUBLIC_APP_LOCALE || 'pt-BR') as 'en' | 'es' | 'pt-BR',
  localePrefix: 'always',
});
