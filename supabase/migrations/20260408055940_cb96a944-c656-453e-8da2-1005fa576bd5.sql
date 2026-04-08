
-- Add is_public column to persons table
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Sync is_public from martyr_profiles where records match
UPDATE public.persons p
SET is_public = mp.is_public
FROM public.martyr_profiles mp
WHERE lower(p.first_name) = lower(mp.first_name)
  AND lower(p.last_name) = lower(mp.last_name)
  AND mp.is_public = false;

-- Update the public RLS policy to also check is_public
DROP POLICY IF EXISTS "Persons publicly readable" ON public.persons;

CREATE POLICY "Persons publicly readable"
ON public.persons
FOR SELECT
TO public
USING (
  deleted_at IS NULL
  AND is_public = true
  AND (status IS NULL OR status <> ALL (ARRAY['Imprisoned'::text, 'Disappeared'::text]))
);
