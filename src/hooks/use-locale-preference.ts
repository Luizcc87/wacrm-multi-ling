'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

export function useLocalePreference() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('wacrm.locale');
      if (savedLocale && savedLocale !== currentLocale) {
        router.replace(pathname, { locale: savedLocale });
      } else if (!savedLocale) {
        localStorage.setItem('wacrm.locale', currentLocale);
      }
    } catch (err) {
      console.warn('[useLocalePreference] failed to sync locale preference:', err);
    }
  }, [currentLocale, router, pathname]);
}
