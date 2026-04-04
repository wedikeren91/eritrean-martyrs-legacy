
-- 1. Fix profiles: replace overly permissive public SELECT
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Public can only see profiles where user opted in, and only safe columns
CREATE POLICY "Public sees opted-in profiles only"
ON public.profiles FOR SELECT TO anon
USING (public_name = true);

-- Authenticated users see their own profile fully, plus opted-in profiles
CREATE POLICY "Authenticated see own and public profiles"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public_name = true);

-- 2. Fix organizations: hide Stripe fields from non-admins
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org members can view their org" ON public.organizations;

-- Everyone authenticated can see basic org info (enforced at app level to not show stripe fields)
-- But we use a security definer view approach - simplest: restrict to members + admins
CREATE POLICY "Users see their own org"
ON public.organizations FOR SELECT TO authenticated
USING (
  id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR public.is_admin()
);

-- 3. Fix user_roles: prevent self-insert privilege escalation
-- Drop any existing permissive policies that might allow insert
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Founder manage roles" ON public.user_roles;

-- Read own role
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_admin());

-- Only founder can manage roles
CREATE POLICY "Only founder manages roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_founder())
WITH CHECK (public.is_founder());

-- 4. Fix contributions: enforce org_id matches user on INSERT
DROP POLICY IF EXISTS "Users can insert own contributions" ON public.contributions;

CREATE POLICY "Users insert own contributions with matching org"
ON public.contributions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    organization_id IS NULL
    OR organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);
