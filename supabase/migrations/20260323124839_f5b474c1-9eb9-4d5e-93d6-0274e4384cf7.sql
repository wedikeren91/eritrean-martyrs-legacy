
-- Fix: approve_contribution — enforce is_admin(), derive admin ID from auth.uid()
CREATE OR REPLACE FUNCTION public.approve_contribution(_contribution_id uuid, _admin_id uuid DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller_id   UUID;
  _contrib     public.contributions%ROWTYPE;
  _person_data JSONB;
  _new_slug    TEXT;
  _person_id   UUID;
BEGIN
  -- Enforce: only admins (org_admin or founder) may call this
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Always use the authenticated caller as reviewer — ignore any client-supplied _admin_id
  _caller_id := auth.uid();

  SELECT * INTO _contrib FROM public.contributions
  WHERE id = _contribution_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribution not found or not pending';
  END IF;

  _person_data := _contrib.person_data;
  _new_slug := COALESCE(
    _person_data->>'slug',
    lower(regexp_replace(
      concat_ws('-', _person_data->>'first_name', _person_data->>'last_name'),
      '[^a-z0-9]+', '-', 'g'
    )) || '-' || substr(gen_random_uuid()::text, 1, 8)
  );

  INSERT INTO public.persons (
    slug, photo_url, first_name, last_name, known_as,
    date_of_birth, date_of_death, city, region, category, status,
    rank, role, bio, significance, quote, place_of_martyrdom, battle,
    organization_id, submitted_by, approved_by
  ) VALUES (
    _new_slug, _person_data->>'photo_url', _person_data->>'first_name',
    _person_data->>'last_name', _person_data->>'known_as',
    _person_data->>'date_of_birth', _person_data->>'date_of_death',
    _person_data->>'city', _person_data->>'region',
    _person_data->>'category', _person_data->>'status',
    _person_data->>'rank', _person_data->>'role',
    _person_data->>'bio', _person_data->>'significance',
    _person_data->>'quote', _person_data->>'place_of_martyrdom',
    _person_data->>'battle',
    _contrib.organization_id, _contrib.user_id, _caller_id
  ) RETURNING id INTO _person_id;

  UPDATE public.contributions
  SET status = 'approved', reviewed_by = _caller_id, reviewed_at = now()
  WHERE id = _contribution_id;

  PERFORM public.check_contributor_promotion(_contrib.user_id);
  PERFORM public.check_badge_awards(_contrib.user_id);

  RETURN _person_id;
END;
$function$;

-- Fix: reject_contribution — enforce is_admin(), derive admin ID from auth.uid()
CREATE OR REPLACE FUNCTION public.reject_contribution(_contribution_id uuid, _admin_id uuid DEFAULT NULL, _reason text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Enforce: only admins (org_admin or founder) may call this
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  UPDATE public.contributions
  SET status = 'rejected',
      reviewed_by  = auth.uid(),
      reviewed_at  = now(),
      rejection_reason = _reason
  WHERE id = _contribution_id AND status = 'pending';
END;
$function$;
