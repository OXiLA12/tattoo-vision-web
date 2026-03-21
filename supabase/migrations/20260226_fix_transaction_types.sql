-- Fix: Add subscription_start and subscription_renewal to valid transaction types
-- Also prevent duplicate trial subscriptions

DO $$
BEGIN
  ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

  ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN (
    'purchase',
    'usage',
    'bonus',
    'refund',
    'referral_reward',
    'referral_bonus',
    'debit_pending',
    'debit_success',
    'subscription_start',    -- Initial grant when a subscription (incl. trial) starts
    'subscription_renewal'   -- Recurring grant on each billing cycle
  ));

  RAISE NOTICE 'credit_transactions_type_check updated with subscription types';
END $$;
