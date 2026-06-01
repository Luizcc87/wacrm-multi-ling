'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTransition } from 'react';

const LOCALES = [
  { value: 'en', label: 'EN', flag: '🇺🇸' },
  { value: 'es', label: 'ES', flag: '🇪🇸' },
  { value: 'pt-BR', label: 'PT', flag: '🇧🇷' },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onLocaleChange(newLocale: string) {
    localStorage.setItem('wacrm.locale', newLocale);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {LOCALES.map((loc) => (
        <button
          key={loc.value}
          onClick={() => onLocaleChange(loc.value)}
          disabled={isPending}
          className={[
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            locale === loc.value
              ? 'bg-primary/10 text-primary'
              : 'text-slate-500 hover:text-slate-300',
          ].join(' ')}
          title={loc.label}
        >
          {loc.flag} {loc.label}
        </button>
      ))}
    </div>
  );
}
