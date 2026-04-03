
-- 1. Fix profiles: revoke sensitive column access from anon role
REVOKE SELECT (phone, permissions) ON public.profiles FROM anon;

-- 2. Drop old unrestricted storage upload policies that bypass path-scoped ones
DROP POLICY IF EXISTS "Authenticated can upload person photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload martyr images" ON storage.objects;
