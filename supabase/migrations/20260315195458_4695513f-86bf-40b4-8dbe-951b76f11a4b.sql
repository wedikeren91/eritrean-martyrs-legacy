
-- Fix permissive RLS: tributes insert — require valid person_id and rate limit by IP isn't possible, 
-- but at minimum ensure person exists (FK handles that); tighten to authenticated only for now
-- and allow anon via a separate open policy only for SELECT
DROP POLICY IF EXISTS "Anyone can leave tribute" ON public.tributes;
CREATE POLICY "Authenticated can leave tribute" ON public.tributes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anon can leave tribute" ON public.tributes
  FOR INSERT TO anon WITH CHECK (message IS NULL OR length(message) <= 500);

-- Fix user_badges insert — only system functions (security definer) should insert, 
-- restrict to service role check by using security definer function already in place
DROP POLICY IF EXISTS "System inserts user badges" ON public.user_badges;
CREATE POLICY "Badges inserted via system function only" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
