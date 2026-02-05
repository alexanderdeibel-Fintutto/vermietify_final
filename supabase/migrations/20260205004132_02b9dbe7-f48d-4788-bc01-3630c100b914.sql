-- Add calibration_valid_until column to meters table
ALTER TABLE public.meters ADD COLUMN calibration_valid_until DATE;