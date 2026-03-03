-- ============================================================
-- SYNC ACTIVE SUBSCRIBERS
-- Date: 2026-03-03
-- Purpose: Fix profiles of users who have a Stripe subscription
--          recorded but whose entitled flag is not set correctly.
--          Also ensures every Pro user has at least 2000 credits.
-- ============================================================

-- 1. Update profiles: mark as Pro + entitled if they have a stripe_subscription_id
--    and are not already correctly set.
--    We do NOT override users who were explicitly set to plan='free' via a
--    subscription.deleted webhook (those have stripe_subscription_id cleared or
--    entitled already false by the webhook).
UPDATE public.profiles
SET
    entitled              = true,
    plan                  = 'pro',
    free_trial_used       = true,
    subscription_status   = COALESCE(NULLIF(subscription_status, ''), 'active')
WHERE
    stripe_subscription_id IS NOT NULL
    AND stripe_subscription_id != ''
    AND (entitled = false OR entitled IS NULL OR plan = 'free')
    -- Exclude users who the webhook explicitly cancelled (sub status = cancelled/deleted)
    AND subscription_status NOT IN ('canceled', 'cancelled', 'unpaid', 'incomplete_expired');

-- 2. Ensure every entitled user has a row in user_credits
INSERT INTO public.user_credits (user_id, credits)
SELECT
    p.id,
    2000
FROM public.profiles p
LEFT JOIN public.user_credits uc ON uc.user_id = p.id
WHERE
    p.entitled = true
    AND uc.user_id IS NULL  -- no credits row yet
ON CONFLICT (user_id) DO NOTHING;

-- 3. If they have a credits row but still at 0, give them the initial 2000
UPDATE public.user_credits uc
SET credits = 2000
FROM public.profiles p
WHERE
    uc.user_id = p.id
    AND p.entitled = true
    AND uc.credits = 0;

-- 4. Also log a credit transaction for each grant so history is complete
-- (only for rows that don't already have a subscription_start transaction)
INSERT INTO public.credit_transactions (user_id, amount, type, description, created_at)
SELECT
    uc.user_id,
    2000,
    'subscription_start',
    'Sync initial credits — abonné actif',
    NOW()
FROM public.user_credits uc
JOIN public.profiles p ON p.id = uc.user_id
WHERE
    p.entitled = true
    AND NOT EXISTS (
        SELECT 1 FROM public.credit_transactions ct
        WHERE ct.user_id = uc.user_id
          AND ct.type = 'subscription_start'
    );

-- Done
DO $$
BEGIN
    RAISE NOTICE 'Migration 20260303_sync_active_subscribers completed.';
END $$;
