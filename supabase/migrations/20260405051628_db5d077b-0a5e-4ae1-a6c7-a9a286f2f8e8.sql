-- Drop the existing public read policy
DROP POLICY IF EXISTS "Persons publicly readable" ON public.persons;

-- Public can only see non-deleted records that are NOT Imprisoned or Disappeared
CREATE POLICY "Persons publicly readable"
ON public.persons
FOR SELECT
TO public
USING (
  deleted_at IS NULL
  AND (status IS NULL OR status NOT IN ('Imprisoned', 'Disappeared'))
);

-- Admins can see ALL records including private statuses
CREATE POLICY "Admins read all persons"
ON public.persons
FOR SELECT
TO authenticated
USING (public.is_admin());
