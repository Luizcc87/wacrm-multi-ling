"use client";

import { useAuth } from "@/hooks/use-auth";

/**
 * Returns the account's default ISO 4217 currency code and a
 * formatter function scoped to that currency.
 *
 * Falls back to "USD" while the profile is still loading or if the
 * account row pre-dates migration 021 and is missing the column.
 */
export function useCurrency() {
  const { account } = useAuth();
  const currency = account?.default_currency ?? "USD";

  function formatCurrency(value: number, overrideCurrency?: string): string {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: overrideCurrency ?? currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  return { currency, formatCurrency };
}
