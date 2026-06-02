'use client';

import { useLocalePreference } from '@/hooks/use-locale-preference';

export function LocalePreferenceSync() {
  useLocalePreference();
  return null;
}
