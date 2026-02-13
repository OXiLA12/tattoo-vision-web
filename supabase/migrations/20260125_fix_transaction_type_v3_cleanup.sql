-- FIX: Clean up invalid transaction types BEFORE applying constraint
DO $$
BEGIN
   -- 1. Drop the constraint to allow us to fix data if needed (though we can update even with it present if we pick valid values, dropping it ensures we are clear)
  ALTER TABLE public.credit_transactions 
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

  -- 2. Identify and Fix invalid rows
  -- We set any type that IS NOT in our allowed list to 'bonus' (safest fallback)
  -- This fixes the "violated by some row" error.
  UPDATE public.credit_transactions
  SET type = 'bonus'
  WHERE type NOT IN ('purchase', 'usage', 'bonus', 'refund', 'referral_reward', 'referral_bonus');

  -- 3. Now we can safely add the constraint
  ALTER TABLE public.credit_transactions 
  ADD CONSTRAINT credit_transactions_type_check 
  CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'referral_reward', 'referral_bonus'));

END $$;
