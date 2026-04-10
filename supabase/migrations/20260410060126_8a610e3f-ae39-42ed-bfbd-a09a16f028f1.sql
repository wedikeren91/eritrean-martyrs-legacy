-- Function to allow anyone to set a person's photo_url (only that column)
CREATE OR REPLACE FUNCTION public.set_person_photo(_person_id uuid, _photo_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.persons
  SET photo_url = _photo_url, updated_at = now()
  WHERE id = _person_id AND deleted_at IS NULL;
END;
$$;

-- Allow anonymous users to upload to person-photos bucket
CREATE POLICY "Anyone can upload person photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'person-photos');

-- Allow anonymous users to update (replace) person photos
CREATE POLICY "Anyone can update person photos"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'person-photos');