DROP FUNCTION IF EXISTS public.set_person_photo(uuid, text);

CREATE OR REPLACE FUNCTION public.set_person_photo(_person_id uuid, _photo_url text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    UPDATE public.persons
    SET photo_url = _photo_url, updated_at = now()
    WHERE id = _person_id AND deleted_at IS NULL;
    RETURN 'approved';
  END IF;

  INSERT INTO public.photo_submissions (person_id, photo_url, submitted_by)
  VALUES (_person_id, _photo_url, auth.uid());

  RETURN 'pending';
END;
$$;