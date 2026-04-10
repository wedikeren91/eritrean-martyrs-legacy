
-- 1. Drop the overly permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Profiles publicly viewable (safe fields only)" ON public.profiles;

-- 2. Add trigger to prevent non-admins from self-modifying permissions
CREATE OR REPLACE FUNCTION public.protect_permissions_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If permissions changed and caller is not admin, revert it
  IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
    IF NOT public.is_admin() THEN
      NEW.permissions := OLD.permissions;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_permissions_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_permissions_column();

-- 3. Fix person-photos storage: remove anon write policies, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can upload person photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update person photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload person photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'person-photos');

CREATE POLICY "Authenticated users can update person photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'person-photos');
