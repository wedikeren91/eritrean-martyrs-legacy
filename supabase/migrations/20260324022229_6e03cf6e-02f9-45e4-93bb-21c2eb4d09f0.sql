
-- Create martyr_profiles table
CREATE TABLE public.martyr_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  affiliation TEXT NOT NULL CHECK (affiliation IN ('ELF', 'EPLF', 'Civilian')),
  birth_date DATE,
  death_date DATE,
  birth_city TEXT,
  birth_province TEXT,
  profile_picture_url TEXT,
  life_story TEXT,
  verification_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.martyr_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view Approved profiles
CREATE POLICY "Approved profiles publicly viewable"
  ON public.martyr_profiles FOR SELECT
  USING (status = 'Approved');

-- Admins can view all profiles (separate policy so both can coexist)
CREATE POLICY "Admins view all martyr profiles"
  ON public.martyr_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Authenticated users can submit profiles
CREATE POLICY "Authenticated users can submit profiles"
  ON public.martyr_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Admins can update profiles (inline editing + status changes)
CREATE POLICY "Admins can update martyr profiles"
  ON public.martyr_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Only founder can permanently delete profiles
CREATE POLICY "Only founder can permanently delete"
  ON public.martyr_profiles FOR DELETE
  TO authenticated
  USING (public.is_founder());

-- Trigger for updated_at
CREATE TRIGGER update_martyr_profiles_updated_at
  BEFORE UPDATE ON public.martyr_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for common queries
CREATE INDEX idx_martyr_profiles_status ON public.martyr_profiles(status);
CREATE INDEX idx_martyr_profiles_affiliation ON public.martyr_profiles(affiliation);
CREATE INDEX idx_martyr_profiles_name ON public.martyr_profiles(last_name, first_name);
