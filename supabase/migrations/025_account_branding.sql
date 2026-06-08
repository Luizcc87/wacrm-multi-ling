-- ============================================================
-- 025_account_branding.sql — White-label / brand identity per account
--
-- Adds an `account_branding` table so each account can customise
-- the app name, logo, favicon and accent colours shown in the UI.
-- Falls back to environment variables and then the built-in
-- defaults when no row exists.
--
-- RLS:
--   - Any account member may SELECT (to display branding).
--   - Only admin+ may INSERT / UPDATE / DELETE.
--
-- Notes:
--   - The table uses `account_id` as a PRIMARY KEY (one row per
--     account, upserted by the settings panel).
--   - Color columns carry a CHECK constraint that enforces the
--     `#rrggbb` hex format so invalid values are rejected at the
--     DB layer.
-- ============================================================

CREATE TABLE IF NOT EXISTS account_branding (
  account_id    uuid        PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  app_name      text        CHECK (char_length(app_name) <= 60),
  logo_url      text,
  favicon_url   text,
  primary_color text        CHECK (primary_color  ~ '^#[0-9a-fA-F]{6}$'),
  sidebar_color text        CHECK (sidebar_color  ~ '^#[0-9a-fA-F]{6}$'),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE account_branding ENABLE ROW LEVEL SECURITY;

-- Any member of the account can read its branding row.
-- The `profiles` table carries `account_id` + `user_id`, which is
-- exactly what is_account_member() uses internally.
CREATE POLICY "members read branding"
  ON account_branding
  FOR SELECT
  USING (
    account_id IN (
      SELECT p.account_id
        FROM profiles p
       WHERE p.user_id = auth.uid()
    )
  );

-- Only admin / owner may write.
CREATE POLICY "admin write branding"
  ON account_branding
  FOR ALL
  USING (
    account_id IN (
      SELECT p.account_id
        FROM profiles p
       WHERE p.user_id    = auth.uid()
         AND p.account_role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT p.account_id
        FROM profiles p
       WHERE p.user_id    = auth.uid()
         AND p.account_role IN ('admin', 'owner')
    )
  );
