
CREATE OR REPLACE FUNCTION public.check_delete_rate_limit(_admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _weekly  INT;
  _monthly INT;
BEGIN
  -- Founder has unlimited delete access
  IF public.is_founder() THEN RETURN; END IF;

  IF NOT public.has_role(_admin_id, 'org_admin') THEN
    RAISE EXCEPTION 'Only founder or deputy admin (org_admin) can delete records';
  END IF;

  _weekly  := public.count_admin_actions(_admin_id, 'delete', 7);
  _monthly := public.count_admin_actions(_admin_id, 'delete', 30);

  -- org_admin (deputy): 5/week, 15/month
  IF _weekly >= 5 THEN
    RAISE EXCEPTION 'Delete rate limit reached: max 5 deletions per 7 days for deputy admin (used %)', _weekly;
  END IF;
  IF _monthly >= 15 THEN
    RAISE EXCEPTION 'Delete rate limit reached: max 15 deletions per 30 days for deputy admin (used %)', _monthly;
  END IF;
END;
$$;
