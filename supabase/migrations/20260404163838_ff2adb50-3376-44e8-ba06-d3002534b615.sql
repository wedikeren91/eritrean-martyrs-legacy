
-- Drop the old broad org policy that still exists
DROP POLICY IF EXISTS "Orgs basic info viewable by authenticated" ON public.organizations;

-- Column-level security for phone: only owner can see their own phone
-- We revoke column access then re-grant only to the row owner via a view isn't possible with RLS alone,
-- so we revoke SELECT on phone from authenticated and create a security definer function instead
REVOKE SELECT (phone) ON public.profiles FROM authenticated;
REVOKE SELECT (phone) ON public.profiles FROM anon;

-- Also revoke permissions column
REVOKE SELECT (permissions) ON public.profiles FROM authenticated;
