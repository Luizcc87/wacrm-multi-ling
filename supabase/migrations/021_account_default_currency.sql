-- ============================================================
-- 021_account_default_currency.sql
--
-- Adds `default_currency` to `accounts` so all members of an
-- account share a single default currency for deals and monetary
-- displays (dashboard, pipeline analytics, etc.).
--
-- The column is TEXT to remain compatible with ISO 4217 codes
-- (BRL, USD, EUR, …) without a rigid enum that would require
-- another migration every time a new code is needed.
--
-- Idempotent — safe to run multiple times.
-- ============================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'USD';

COMMENT ON COLUMN accounts.default_currency IS
  'ISO 4217 currency code used as default for new deals and monetary '
  'displays. Members see the same value; individual deals may still '
  'carry their own currency override.';
