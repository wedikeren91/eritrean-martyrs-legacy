
-- ============================================================
-- 1. TRIBUTE SYSTEM: add tribute_type column to tributes
-- ============================================================
ALTER TABLE public.tributes 
  ADD COLUMN IF NOT EXISTS tribute_type TEXT NOT NULL DEFAULT 'candle'
    CHECK (tribute_type IN ('flower', 'candle'));

-- ============================================================
-- 2. ADMIN ACTION LOG: track deletions/edits/approvals for rate limiting
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('delete', 'restore', 'edit', 'approve', 'reject')),
  target_id   UUID,
  note        TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view action log"
  ON public.admin_action_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins insert action log"
  ON public.admin_action_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================
-- 3. RATE LIMIT FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.count_admin_actions(
  _admin_id   UUID,
  _action     TEXT,
  _days       INT
) RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.admin_action_log
  WHERE admin_id = _admin_id
    AND action_type = _action
    AND created_at >= now() - (_days || ' days')::INTERVAL;
$$;

CREATE OR REPLACE FUNCTION public.check_delete_rate_limit(_admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _weekly  INT;
  _monthly INT;
BEGIN
  IF NOT public.is_founder() THEN
    RAISE EXCEPTION 'Only the founder can delete records';
  END IF;
  _weekly  := public.count_admin_actions(_admin_id, 'delete', 7);
  _monthly := public.count_admin_actions(_admin_id, 'delete', 30);
  IF _weekly >= 10 THEN
    RAISE EXCEPTION 'Delete rate limit reached: max 10 deletions per 7 days (used %)', _weekly;
  END IF;
  IF _monthly >= 30 THEN
    RAISE EXCEPTION 'Delete rate limit reached: max 30 deletions per 30 days (used %)', _monthly;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_edit_rate_limit(_admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _weekly  INT;
  _monthly INT;
BEGIN
  IF NOT public.is_founder() THEN
    RAISE EXCEPTION 'Only the founder can directly edit records';
  END IF;
  _weekly  := public.count_admin_actions(_admin_id, 'edit', 7);
  _monthly := public.count_admin_actions(_admin_id, 'edit', 30);
  IF _weekly >= 20 THEN
    RAISE EXCEPTION 'Edit rate limit reached: max 20 edits per 7 days (used %)', _weekly;
  END IF;
  IF _monthly >= 60 THEN
    RAISE EXCEPTION 'Edit rate limit reached: max 60 edits per 30 days (used %)', _monthly;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_approval_rate_limit(_admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _weekly  INT;
  _monthly INT;
BEGIN
  IF public.is_founder() THEN RETURN; END IF;
  IF NOT public.has_role(_admin_id, 'org_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  _weekly  := public.count_admin_actions(_admin_id, 'approve', 7);
  _monthly := public.count_admin_actions(_admin_id, 'approve', 30);
  IF _weekly >= 20 THEN
    RAISE EXCEPTION 'Approval rate limit reached: max 20 approvals per 7 days (used %)', _weekly;
  END IF;
  IF _monthly >= 60 THEN
    RAISE EXCEPTION 'Approval rate limit reached: max 60 approvals per 30 days (used %)', _monthly;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_person(_person_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _caller UUID := auth.uid();
BEGIN
  PERFORM public.check_delete_rate_limit(_caller);
  UPDATE public.persons SET deleted_at = now() WHERE id = _person_id AND deleted_at IS NULL;
  INSERT INTO public.admin_action_log (admin_id, action_type, target_id)
    VALUES (_caller, 'delete', _person_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_person(_person_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _caller UUID := auth.uid();
BEGIN
  IF NOT public.is_founder() THEN
    RAISE EXCEPTION 'Only founder can restore records';
  END IF;
  UPDATE public.persons SET deleted_at = NULL WHERE id = _person_id;
  INSERT INTO public.admin_action_log (admin_id, action_type, target_id, note)
    VALUES (_caller, 'restore', _person_id, 'restored');
END;
$$;

CREATE OR REPLACE FUNCTION public.log_edit_action(_person_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _caller UUID := auth.uid();
BEGIN
  PERFORM public.check_edit_rate_limit(_caller);
  INSERT INTO public.admin_action_log (admin_id, action_type, target_id)
    VALUES (_caller, 'edit', _person_id);
END;
$$;

-- ============================================================
-- 4. FIX: Drop user-facing badge self-insert policy (security fix)
-- ============================================================
DROP POLICY IF EXISTS "Badges inserted via system function only" ON public.user_badges;
