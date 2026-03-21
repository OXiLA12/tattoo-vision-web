-- Fix credit_transactions_type_check constraint to include debit_pending and debit_success
-- Date: 2026-01-30

DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE public.credit_transactions 
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

  -- Add the updated constraint with all required types
  ALTER TABLE public.credit_transactions 
  ADD CONSTRAINT credit_transactions_type_check 
  CHECK (type IN (
    'purchase', 
    'usage', 
    'bonus', 
    'refund', 
    'referral_reward', 
    'referral_bonus',
    'debit_pending',    -- Added for initiate_credit_usage
    'debit_success'     -- Added for confirm_credit_usage
  ));

  RAISE NOTICE 'credit_transactions_type_check constraint updated successfully';
END $$;
