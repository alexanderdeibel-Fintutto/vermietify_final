-- Add theme_index column to companies for gradient color selection (0-5)
ALTER TABLE public.companies ADD COLUMN theme_index integer NOT NULL DEFAULT 0;

-- Set personal companies to index 0 (gold), business companies get sequential indices
-- This is just for new defaults, existing companies start at 0