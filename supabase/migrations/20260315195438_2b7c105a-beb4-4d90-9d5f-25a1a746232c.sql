
-- ============================================================
-- HOREOS DIRECTORY v2 — FULL SCHEMA
-- ============================================================

-- ── 1. ENUMS ────────────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('user', 'contributor', 'org_admin', 'founder');
CREATE TYPE public.contribution_status AS ENUM ('pending', 'approved', 'rejected');

-- ── 2. TIMESTAMP HELPER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ── 3. ORGANIZATIONS ────────────────────────────────────────
CREATE TABLE public.organizations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL UNIQUE,
  country                TEXT,
  display_name           TEXT,
  logo_url               TEXT,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  subscription_status    TEXT DEFAULT 'trialing',
  subscription_plan      TEXT DEFAULT 'free',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 4. PROFILES ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT,
  avatar_url       TEXT,
  bio              TEXT,
  city             TEXT,
  state_province   TEXT,
  country          TEXT,
  phone            TEXT,
  relation         TEXT,
  organization_id  UUID REFERENCES public.organizations(id),
  public_name      BOOLEAN DEFAULT true,
  public_location  BOOLEAN DEFAULT true,
  public_email     BOOLEAN DEFAULT false,
  public_phone     BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 5. USER ROLES ───────────────────────────────────────────
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Auto-create default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Security definer helpers (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS BOOLEAN AS $$
  SELECT public.has_role(auth.uid(), 'founder');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'founder');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ── 6. PERSONS ──────────────────────────────────────────────
CREATE TABLE public.persons (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT UNIQUE NOT NULL,
  photo_url            TEXT,
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  known_as             TEXT,
  date_of_birth        TEXT,
  date_of_death        TEXT,
  city                 TEXT,
  region               TEXT,
  category             TEXT,
  status               TEXT,
  rank                 TEXT,
  role                 TEXT,
  bio                  TEXT,
  significance         TEXT,
  quote                TEXT,
  place_of_martyrdom   TEXT,
  battle               TEXT,
  organization_id      UUID REFERENCES public.organizations(id),
  submitted_by         UUID REFERENCES auth.users(id),
  approved_by          UUID REFERENCES auth.users(id),
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 7. BADGES ───────────────────────────────────────────────
CREATE TABLE public.badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '🏅',
  description TEXT,
  threshold   INTEGER NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- ── 8. USER_BADGES ──────────────────────────────────────────
CREATE TABLE public.user_badges (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES public.badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ── 9. BULK UPLOADS ─────────────────────────────────────────
CREATE TABLE public.bulk_uploads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  file_name       TEXT NOT NULL,
  total_rows      INTEGER DEFAULT 0,
  parsed_rows     INTEGER DEFAULT 0,
  error_rows      INTEGER DEFAULT 0,
  errors_json     JSONB,
  status          TEXT NOT NULL DEFAULT 'processing',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_uploads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_bulk_uploads_updated_at
  BEFORE UPDATE ON public.bulk_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 10. CONTRIBUTIONS ───────────────────────────────────────
CREATE TABLE public.contributions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  organization_id  UUID REFERENCES public.organizations(id),
  status           public.contribution_status NOT NULL DEFAULT 'pending',
  person_data      JSONB NOT NULL,
  source_type      TEXT NOT NULL DEFAULT 'form',
  bulk_upload_id   UUID REFERENCES public.bulk_uploads(id),
  reviewed_by      UUID REFERENCES auth.users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- ── 11. TRIBUTES ─────────────────────────────────────────────
CREATE TABLE public.tributes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),
  flower_count INTEGER DEFAULT 1,
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tributes ENABLE ROW LEVEL SECURITY;

-- ── 12. RLS POLICIES ─────────────────────────────────────────

-- organizations
CREATE POLICY "Orgs viewable by authenticated" ON public.organizations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Founder can manage orgs" ON public.organizations
  FOR ALL TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());

-- profiles
CREATE POLICY "Profiles publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Founder manages all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());

-- user_roles
CREATE POLICY "Users view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Founder view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_founder());
CREATE POLICY "Founder manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_founder()) WITH CHECK (public.is_founder());

-- persons
CREATE POLICY "Persons publicly readable" ON public.persons
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Admins insert persons" ON public.persons
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update persons" ON public.persons
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Only founder deletes persons" ON public.persons
  FOR DELETE TO authenticated USING (public.is_founder());

-- contributions
CREATE POLICY "Users view own contributions" ON public.contributions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "OrgAdmin views org contributions" ON public.contributions
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'org_admin') AND
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "Founder views all contributions" ON public.contributions
  FOR SELECT TO authenticated USING (public.is_founder());
CREATE POLICY "Authenticated submit contributions" ON public.contributions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update contribution status" ON public.contributions
  FOR UPDATE TO authenticated USING (public.is_admin());

-- bulk_uploads
CREATE POLICY "Users see own bulk uploads" ON public.bulk_uploads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Founder sees all bulk uploads" ON public.bulk_uploads
  FOR SELECT TO authenticated USING (public.is_founder());
CREATE POLICY "Authenticated insert bulk uploads" ON public.bulk_uploads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bulk uploads" ON public.bulk_uploads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- badges
CREATE POLICY "Badges publicly viewable" ON public.badges FOR SELECT USING (true);

-- user_badges
CREATE POLICY "User badges publicly viewable" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System inserts user badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (true);

-- tributes
CREATE POLICY "Tributes publicly readable" ON public.tributes FOR SELECT USING (true);
CREATE POLICY "Anyone can leave tribute" ON public.tributes FOR INSERT WITH CHECK (true);

-- ── 13. APPROVE CONTRIBUTION ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_contribution(_contribution_id UUID, _admin_id UUID)
RETURNS UUID AS $$
DECLARE
  _contrib     public.contributions%ROWTYPE;
  _person_data JSONB;
  _new_slug    TEXT;
  _person_id   UUID;
BEGIN
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
    _contrib.organization_id, _contrib.user_id, _admin_id
  ) RETURNING id INTO _person_id;

  UPDATE public.contributions
  SET status = 'approved', reviewed_by = _admin_id, reviewed_at = now()
  WHERE id = _contribution_id;

  PERFORM public.check_contributor_promotion(_contrib.user_id);
  PERFORM public.check_badge_awards(_contrib.user_id);

  RETURN _person_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 14. CONTRIBUTOR PROMOTION ────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_contributor_promotion(_user_id UUID)
RETURNS VOID AS $$
DECLARE
  _martyr_count INTEGER;
  _current_role public.app_role;
BEGIN
  SELECT role INTO _current_role FROM public.user_roles WHERE user_id = _user_id;
  IF _current_role != 'user' THEN RETURN; END IF;
  SELECT COUNT(*) INTO _martyr_count
  FROM public.contributions
  WHERE user_id = _user_id AND status = 'approved'
    AND (person_data->>'category') ILIKE '%martyr%';
  IF _martyr_count >= 5 THEN
    UPDATE public.user_roles SET role = 'contributor' WHERE user_id = _user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 15. BADGE AWARDS ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_badge_awards(_user_id UUID)
RETURNS VOID AS $$
DECLARE
  _total INTEGER;
  _badge RECORD;
BEGIN
  SELECT COUNT(*) INTO _total FROM public.contributions
  WHERE user_id = _user_id AND status = 'approved';
  FOR _badge IN
    SELECT id FROM public.badges WHERE threshold <= _total ORDER BY threshold
  LOOP
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (_user_id, _badge.id) ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 16. REJECT CONTRIBUTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_contribution(_contribution_id UUID, _admin_id UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.contributions
  SET status = 'rejected', reviewed_by = _admin_id,
      reviewed_at = now(), rejection_reason = _reason
  WHERE id = _contribution_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 17. SEED BADGES ──────────────────────────────────────────
INSERT INTO public.badges (name, emoji, description, threshold) VALUES
  ('Contributor',          '🌱', 'First approved contribution',           1),
  ('Verified Contributor', '✅', 'Awarded for 10 approved contributions',  10),
  ('Trusted Contributor',  '🥈', 'Awarded for 50 approved contributions',  50),
  ('Senior Archivist',     '💎', 'Awarded for 100 approved contributions', 100),
  ('Elder Keeper',         '🌟', 'Awarded for 300 approved contributions', 300),
  ('Legendary Guardian',   '🏆', 'Awarded for 500 approved contributions', 500);

-- ── 18. STORAGE BUCKET FOR PHOTOS ───────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('person-photos', 'person-photos', true)
  ON CONFLICT DO NOTHING;

CREATE POLICY "Person photos publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'person-photos');
CREATE POLICY "Authenticated can upload person photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'person-photos');
CREATE POLICY "Admins can delete person photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'person-photos' AND public.is_admin());
