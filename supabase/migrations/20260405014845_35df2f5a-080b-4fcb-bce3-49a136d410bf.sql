ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'Unknown';

COMMENT ON COLUMN public.persons.gender IS 'Male, Female, or Unknown';