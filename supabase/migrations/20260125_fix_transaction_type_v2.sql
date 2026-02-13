-- FIX: Update credit_transactions check constraint safely
DO $$
BEGIN
  -- 1. Drop existing check constraint
  ALTER TABLE public.credit_transactions 
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

  -- 2. Update any potentially rogue "unknown" types if strictly necessary (Optional safeguard)
  -- UPDATE public.credit_transactions SET type = 'bonus' WHERE type NOT IN ('purchase', 'usage', 'bonus', 'refund', 'referral_reward', 'referral_bonus');

  -- 3. Add new constraint with NOT VALID to bypass initial check of existing rows
  ALTER TABLE public.credit_transactions 
  ADD CONSTRAINT credit_transactions_type_check 
  CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'referral_reward', 'referral_bonus'))
  NOT VALID;

  -- 4. Validate it for future rows
  ALTER TABLE public.credit_transactions VALIDATE CONSTRAINT credit_transactions_type_check;

END $$;
