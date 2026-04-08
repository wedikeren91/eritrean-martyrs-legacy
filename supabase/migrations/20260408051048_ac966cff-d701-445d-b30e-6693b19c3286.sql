
ALTER TABLE public.martyr_profiles ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Update the public SELECT policy to also require is_public = true
DROP POLICY IF EXISTS "Approved profiles publicly viewable" ON public.martyr_profiles;
CREATE POLICY "Approved profiles publicly viewable"
  ON public.martyr_profiles FOR SELECT TO public
  USING (status = 'Approved' AND is_public = true);
