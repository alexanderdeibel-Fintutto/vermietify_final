-- Add calibration_valid_until column to meters table
ALTER TABLE public.meters 
ADD COLUMN IF NOT EXISTS calibration_valid_until DATE;