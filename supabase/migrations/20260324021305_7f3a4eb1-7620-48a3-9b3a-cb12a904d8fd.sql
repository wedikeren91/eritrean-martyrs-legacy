
-- Allow org_admin (deputy) to soft-delete with their own rate limits (5/week, 15/month)
CREATE OR REPLACE FUNCTION public.check_delete_rate_limit(_admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _weekly  INT;
  _monthly INT;
  _is_founder BOOLEAN;
BEGIN
  _is_founder := public.is_founder();

  IF NOT _is_founder AND NOT public.has_role(_admin_id, 'org_admin') THEN
    RAISE EXCEPTION 'Only founder or deputy admin (org_admin) can delete records';
  END IF;

  _weekly  := public.count_admin_actions(_admin_id, 'delete', 7);
  _monthly := public.count_admin_actions(_admin_id, 'delete', 30);

  IF _is_founder THEN
    IF _weekly >= 10 THEN
      RAISE EXCEPTION 'Delete rate limit reached: max 10 deletions per 7 days (used %)', _weekly;
    END IF;
    IF _monthly >= 30 THEN
      RAISE EXCEPTION 'Delete rate limit reached: max 30 deletions per 30 days (used %)', _monthly;
    END IF;
  ELSE
    -- org_admin (deputy): 5/week, 15/month
    IF _weekly >= 5 THEN
      RAISE EXCEPTION 'Delete rate limit reached: max 5 deletions per 7 days for deputy admin (used %)', _weekly;
    END IF;
    IF _monthly >= 15 THEN
      RAISE EXCEPTION 'Delete rate limit reached: max 15 deletions per 30 days for deputy admin (used %)', _monthly;
    END IF;
  END IF;
END;
$$;
