
-- Fix remaining: tribute insert WITH CHECK (true) for authenticated — tighten it
DROP POLICY IF EXISTS "Authenticated can leave tribute" ON public.tributes;
CREATE POLICY "Authenticated can leave tribute" ON public.tributes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
