-- Remove legacy profiles.role TEXT column.
-- Authorization uses profiles.account_role (account_role_enum) since migration 017.
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
