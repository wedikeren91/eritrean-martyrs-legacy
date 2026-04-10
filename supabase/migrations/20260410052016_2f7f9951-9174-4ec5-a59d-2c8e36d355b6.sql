-- Fix user_badges: replace overly permissive public SELECT policy
DROP POLICY IF EXISTS "User badges publicly viewable" ON public.user_badges;

-- Users can view their own badges
CREATE POLICY "Users see own badges"
ON public.user_badges FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can view all badges (for leaderboard management)
CREATE POLICY "Admins see all badges"
ON public.user_badges FOR SELECT TO authenticated
USING (public.is_admin());