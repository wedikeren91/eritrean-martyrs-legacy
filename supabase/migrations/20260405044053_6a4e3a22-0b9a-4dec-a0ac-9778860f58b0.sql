-- Drop the broken INSERT policy
DROP POLICY IF EXISTS "Users upload to own folder in person-photos" ON storage.objects;

-- Recreate with admin override
CREATE POLICY "Users upload to own folder in person-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'person-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

-- Also fix UPDATE policy to use WITH CHECK as well
DROP POLICY IF EXISTS "Users update own files in person-photos" ON storage.objects;

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
)
WITH CHECK (
  bucket_id = 'person-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);