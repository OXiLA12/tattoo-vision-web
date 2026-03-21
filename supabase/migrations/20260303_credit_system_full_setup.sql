-- ============================================================
-- CREDIT SYSTEM FULL SETUP
-- Date: 2026-03-03
-- Creates: user_credits table, credit_transactions table (if not exists),
--          add_credits(), initiate_credit_usage(), confirm_credit_usage(),
--          refund_credit_usage() functions
-- Safe to run multiple times (IF NOT EXISTS + CREATE OR REPLACE)
-- ============================================================

-- 1. TABLE: user_credits
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    credits   INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- 2. TABLE: credit_transactions (idempotency + history)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount       INTEGER NOT NULL,
    type         TEXT NOT NULL,
    description  TEXT,
    request_id   TEXT,         -- for debit idempotency
    feature      TEXT,         -- for debit idempotency
    status       TEXT DEFAULT 'completed',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Add type constraint (drop first to allow re-run)
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
    'subscription_start',
    'subscription_renewal'
));

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_request_id ON public.credit_transactions(request_id);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 3. TABLE: processed_stripe_events (idempotency for webhooks)
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    event_id   TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FUNCTION: add_credits
--    Adds credits to a user (or creates their row) and logs the transaction.
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id    UUID,
    p_amount     INTEGER,
    p_type       TEXT DEFAULT 'bonus',
    p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Upsert user_credits row
    INSERT INTO public.user_credits (user_id, credits, updated_at)
    VALUES (p_user_id, GREATEST(0, p_amount), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        credits    = GREATEST(0, public.user_credits.credits + p_amount),
        updated_at = NOW();

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (p_user_id, p_amount, p_type, p_description);
END;
$$;

-- 5. FUNCTION: initiate_credit_usage
--    Atomically reserves credits for a feature (debit_pending).
--    Returns JSON: { ok, status, error }
DROP FUNCTION IF EXISTS public.initiate_credit_usage(UUID, INTEGER, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.initiate_credit_usage(
    p_user_id    UUID,
    p_amount     INTEGER,
    p_request_id TEXT,
    p_description TEXT DEFAULT NULL,
    p_feature    TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_credits INTEGER;
    v_existing TEXT;
BEGIN
    -- Idempotency: check if request_id already processed
    SELECT status INTO v_existing
    FROM public.credit_transactions
    WHERE request_id = p_request_id
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('ok', true, 'status', 'already_exists', 'type', v_existing);
    END IF;

    -- Check balance
    SELECT credits INTO v_credits
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_credits IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_POINTS', 'balance', 0);
    END IF;

    IF v_credits < p_amount THEN
        RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_POINTS', 'balance', v_credits);
    END IF;

    -- Reserve credits
    UPDATE public.user_credits
    SET credits = credits - p_amount, updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log pending transaction
    INSERT INTO public.credit_transactions (user_id, amount, type, description, request_id, feature, status)
    VALUES (p_user_id, -p_amount, 'debit_pending', p_description, p_request_id, p_feature, 'pending');

    RETURN jsonb_build_object('ok', true, 'status', 'reserved');
END;
$$;

-- 6. FUNCTION: confirm_credit_usage
--    Marks a pending debit as confirmed.
DROP FUNCTION IF EXISTS public.confirm_credit_usage(TEXT);
CREATE OR REPLACE FUNCTION public.confirm_credit_usage(
    p_request_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.credit_transactions
    SET type = 'debit_success', status = 'completed'
    WHERE request_id = p_request_id AND status = 'pending';
END;
$$;

-- 7. FUNCTION: refund_credit_usage
--    Refunds credits for a failed/cancelled debit and marks transaction as refunded.
DROP FUNCTION IF EXISTS public.refund_credit_usage(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.refund_credit_usage(
    p_request_id TEXT,
    p_description TEXT DEFAULT 'Refund'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_amount  INTEGER;
BEGIN
    -- Find the pending transaction
    SELECT user_id, ABS(amount) INTO v_user_id, v_amount
    FROM public.credit_transactions
    WHERE request_id = p_request_id AND status = 'pending'
    LIMIT 1;

    IF v_user_id IS NULL THEN RETURN; END IF;

    -- Restore credits
    UPDATE public.user_credits
    SET credits = credits + v_amount, updated_at = NOW()
    WHERE user_id = v_user_id;

    -- Mark as refunded
    UPDATE public.credit_transactions
    SET type = 'refund', status = 'refunded', description = p_description
    WHERE request_id = p_request_id AND status = 'pending';
END;
$$;

-- 8. Init credits for all existing Pro subscribers who have none
INSERT INTO public.user_credits (user_id, credits)
SELECT p.id, 2000
FROM public.profiles p
LEFT JOIN public.user_credits uc ON uc.user_id = p.id
WHERE p.entitled = true AND uc.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Credit system tables and functions created/updated successfully.';
END $$;
