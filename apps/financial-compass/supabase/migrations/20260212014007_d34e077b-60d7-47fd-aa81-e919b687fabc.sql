-- Add building column to transactions for property management assignment
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS building text;

-- Add index for filtering by building
CREATE INDEX IF NOT EXISTS idx_transactions_building ON public.transactions (building) WHERE building IS NOT NULL;