ALTER TABLE public.martyr_profiles 
ADD COLUMN gender text NOT NULL DEFAULT 'Unknown';

COMMENT ON COLUMN public.martyr_profiles.gender IS 'Gender of the martyr: Male, Female, or Unknown';