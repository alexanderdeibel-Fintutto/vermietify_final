
-- Add building assignment to bank_transactions
ALTER TABLE public.bank_transactions
ADD COLUMN matched_building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL;

-- Add index for building lookups
CREATE INDEX idx_bank_transactions_building ON public.bank_transactions(matched_building_id) WHERE matched_building_id IS NOT NULL;
