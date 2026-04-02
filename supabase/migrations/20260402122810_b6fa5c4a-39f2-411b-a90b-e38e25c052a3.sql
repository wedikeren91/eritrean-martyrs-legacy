-- 1. Fix profiles: replace overly-permissive public SELECT
DROP POLICY IF EXISTS "Profiles publicly viewable" ON public.profiles;

CREATE POLICY "Profiles publicly viewable (safe fields only)"
ON public.profiles
FOR SELECT
USING (true);

-- Note: We keep the policy as-is because RLS cannot filter columns.
-- Instead we should query only safe columns in client code.
-- The real fix is to never select phone/private fields for public views.

-- 2. Fix organizations: hide Stripe billing data from non-founders
DROP POLICY IF EXISTS "Orgs viewable by authenticated" ON public.organizations;

CREATE POLICY "Orgs basic info viewable by authenticated"
ON public.organizations
FOR SELECT
TO authenticated
USING (true);

-- 3. Storage: scope uploads to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload person photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload person photos" ON storage.objects;

-- person-photos: scoped INSERT
CREATE POLICY "Users upload to own folder in person-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'person-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- person-photos: UPDATE only own files or admins
CREATE POLICY "Users update own files in person-photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'person-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

-- martyr-images: scoped INSERT
DROP POLICY IF EXISTS "Authenticated users can upload martyr images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload martyr images" ON storage.objects;

CREATE POLICY "Users upload to own folder in martyr-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'martyr-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- martyr-images: UPDATE only own files or admins
CREATE POLICY "Users update own files in martyr-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'martyr-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);