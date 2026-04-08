
INSERT INTO public.persons (
  slug, first_name, last_name, gender, date_of_birth, date_of_death,
  city, region, category, bio, photo_url, status
)
SELECT
  lower(regexp_replace(
    concat_ws('-', mp.first_name, mp.last_name),
    '[^a-zA-Z0-9]+', '-', 'g'
  )) || '-' || substr(mp.id::text, 1, 8) AS slug,
  mp.first_name,
  mp.last_name,
  mp.gender,
  mp.birth_date::text,
  mp.death_date::text,
  mp.birth_city,
  mp.birth_province,
  mp.affiliation,
  mp.life_story,
  mp.profile_picture_url,
  COALESCE(NULLIF(mp.status, ''), 'Deceased')
FROM public.martyr_profiles mp
WHERE mp.status = 'Approved'
  AND mp.is_public = true
  AND NOT EXISTS (
    SELECT 1 FROM public.persons p
    WHERE lower(p.first_name) = lower(mp.first_name)
      AND lower(p.last_name) = lower(mp.last_name)
      AND p.deleted_at IS NULL
  );
