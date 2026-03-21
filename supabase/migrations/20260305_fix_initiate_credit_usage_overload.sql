-- ============================================================
-- FIX: Remove all overloaded versions of initiate_credit_usage
-- and replace with ONE canonical version using TEXT for request_id
-- This resolves: "Could not choose the best candidate function"
-- NOTE: request_id column is UUID in DB — we cast p_request_id::uuid in queries
--       'type' column tracks state (debit_pending/debit_success/refund)
-- ============================================================

-- Drop ALL overloaded versions (UUID and TEXT signatures)
DROP FUNCTION IF EXISTS public.initiate_credit_usage(UUID, INTEGER, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.initiate_credit_usage(UUID, INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS public.initiate_credit_usage(UUID, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.initiate_credit_usage(UUID, INTEGER, TEXT, TEXT);

-- Also drop confirm and refund to remove any UUID signature conflicts
DROP FUNCTION IF EXISTS public.confirm_credit_usage(UUID);
DROP FUNCTION IF EXISTS public.confirm_credit_usage(TEXT);
DROP FUNCTION IF EXISTS public.refund_credit_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS public.refund_credit_usage(TEXT, TEXT);

-- ── CANONICAL initiate_credit_usage (TEXT request_id, cast to UUID internally) ─
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
    v_credits  INTEGER;
    v_existing TEXT;
BEGIN
    -- Idempotency: check if request_id already processed
    SELECT type INTO v_existing
    FROM public.credit_transactions
    WHERE request_id = p_request_id::uuid
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
    INSERT INTO public.credit_transactions (user_id, amount, type, description, request_id)
    VALUES (p_user_id, -p_amount, 'debit_pending', p_description, p_request_id::uuid);

    RETURN jsonb_build_object('ok', true, 'status', 'reserved');
END;
$$;

-- ── CANONICAL confirm_credit_usage (TEXT request_id) ───────────────────────
CREATE OR REPLACE FUNCTION public.confirm_credit_usage(
    p_request_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.credit_transactions
    SET type = 'debit_success'
    WHERE request_id = p_request_id::uuid AND type = 'debit_pending';
END;
$$;

-- ── CANONICAL refund_credit_usage (TEXT request_id) ────────────────────────
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
    SELECT user_id, ABS(amount) INTO v_user_id, v_amount
    FROM public.credit_transactions
    WHERE request_id = p_request_id::uuid AND type = 'debit_pending'
    LIMIT 1;

    IF v_user_id IS NULL THEN RETURN; END IF;

    UPDATE public.user_credits
    SET credits = credits + v_amount, updated_at = NOW()
    WHERE user_id = v_user_id;

    UPDATE public.credit_transactions
    SET type = 'refund', description = p_description
    WHERE request_id = p_request_id::uuid AND type = 'debit_pending';
END;
$$;

DO $$
BEGIN
    RAISE NOTICE '✅ Fonctions credit_usage installées (TEXT→UUID cast, sans colonne status).';
END $$;
