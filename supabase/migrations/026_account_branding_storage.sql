-- ============================================================
-- 026_account_branding_storage.sql
--
-- Public Supabase Storage bucket for account logos and favicons.
--
-- Path convention used by the app:
--   account-branding/account-<account_id>/<logo|favicon>-<timestamp>.<ext>
--
-- The bucket is public so unauthenticated surfaces such as login,
-- public legal pages and favicons can render images without signed
-- URLs. Writes remain restricted by RLS to admin/owner users of the
-- account encoded in the first path segment.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'account-branding',
  'account-branding',
  TRUE,
  1048576, -- 1 MB
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Account branding assets are publicly readable" ON storage.objects;
CREATE POLICY "Account branding assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'account-branding');

DROP POLICY IF EXISTS "Account admins can upload branding assets" ON storage.objects;
CREATE POLICY "Account admins can upload branding assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'account-branding'
    AND EXISTS (
      SELECT 1
        FROM public.profiles p
       WHERE p.user_id = auth.uid()
         AND p.account_role IN ('admin', 'owner')
         AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Account admins can update branding assets" ON storage.objects;
CREATE POLICY "Account admins can update branding assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'account-branding'
    AND EXISTS (
      SELECT 1
        FROM public.profiles p
       WHERE p.user_id = auth.uid()
         AND p.account_role IN ('admin', 'owner')
         AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'account-branding'
    AND EXISTS (
      SELECT 1
        FROM public.profiles p
       WHERE p.user_id = auth.uid()
         AND p.account_role IN ('admin', 'owner')
         AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Account admins can delete branding assets" ON storage.objects;
CREATE POLICY "Account admins can delete branding assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'account-branding'
    AND EXISTS (
      SELECT 1
        FROM public.profiles p
       WHERE p.user_id = auth.uid()
         AND p.account_role IN ('admin', 'owner')
         AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );
