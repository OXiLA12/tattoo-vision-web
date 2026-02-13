-- FIX: Update credit_transactions check constraint to allow referral types
DO $$
BEGIN
  -- 1. Drop existing check constraint
  ALTER TABLE public.credit_transactions 
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

  -- 2. Add new constraint with all allowed types
  ALTER TABLE public.credit_transactions 
  ADD CONSTRAINT credit_transactions_type_check 
  CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'referral_reward', 'referral_bonus'));

END $$;
