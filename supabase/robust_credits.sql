-- ============================================
-- ROBUST IDEMPOTENT CREDIT SYSTEM
-- ============================================

-- 1. Add request_id to credit_transactions
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS request_id UUID UNIQUE;

-- 2. Update type constraint
ALTER TABLE public.credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_type_check 
CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'debit_pending', 'debit_success'));

-- 3. Create or replace the function to initiate credit usage
CREATE OR REPLACE FUNCTION public.initiate_credit_usage(
  p_user_id UUID,
  p_amount INTEGER,
  p_request_id UUID,
  p_description TEXT DEFAULT 'Credit usage'
)
RETURNS JSON AS $$
DECLARE
  current_credits INTEGER;
  existing_record RECORD;
BEGIN
  -- Check if this request_id already exists
  SELECT * INTO existing_record 
  FROM public.credit_transactions 
  WHERE request_id = p_request_id;
  
  IF existing_record IS NOT NULL THEN
    RETURN json_build_object(
      'ok', true,
      'status', 'already_exists',
      'type', existing_record.type
    );
  END IF;

  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock row
  
  -- Check if enough credits
  IF current_credits < p_amount THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'Insufficient credits'
    );
  END IF;
  
  -- Deduct credits
  UPDATE public.user_credits
  SET credits = credits - p_amount
  WHERE user_id = p_user_id;
  
  -- Log pending transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, request_id)
  VALUES (p_user_id, -p_amount, 'debit_pending', p_description, p_request_id);
  
  RETURN json_build_object(
    'ok', true,
    'status', 'initiated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to confirm successful usage
CREATE OR REPLACE FUNCTION public.confirm_credit_usage(
  p_request_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.credit_transactions
  SET type = 'debit_success'
  WHERE request_id = p_request_id AND type = 'debit_pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to refund credit usage
CREATE OR REPLACE FUNCTION public.refund_credit_usage(
  p_request_id UUID,
  p_description TEXT DEFAULT 'Refund'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount INTEGER;
BEGIN
  -- Get the original transaction
  SELECT user_id, ABS(amount) INTO v_user_id, v_amount
  FROM public.credit_transactions
  WHERE request_id = p_request_id AND type = 'debit_pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Add credits back
  UPDATE public.user_credits
  SET credits = credits + v_amount
  WHERE user_id = v_user_id;
  
  -- Mark as refunded
  UPDATE public.credit_transactions
  SET type = 'refund', 
      description = COALESCE(description, '') || ' (Refunded: ' || p_description || ')'
  WHERE request_id = p_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Cron-like job for cleanup (can be called via Edge Function or manually)
-- Find debit_pending > 5 minutes old and refund them
CREATE OR REPLACE FUNCTION public.cleanup_pending_credits()
RETURNS TABLE (request_id UUID, user_id UUID) AS $$
BEGIN
  -- This is a simplified version. In a real system you might want to call 
  -- refund_credit_usage for each row to ensure consistency.
  -- For now, we return them so the Edge Function can handle them or we do it here.
  
  -- Bulk refund
  UPDATE public.user_credits uc
  SET credits = uc.credits + ct.abs_amount
  FROM (
    SELECT credit_transactions.user_id, ABS(amount) as abs_amount, credit_transactions.request_id
    FROM public.credit_transactions
    WHERE type = 'debit_pending' 
    AND created_at < NOW() - INTERVAL '5 minutes'
  ) ct
  WHERE uc.user_id = ct.user_id;

  UPDATE public.credit_transactions
  SET type = 'refund', 
      description = COALESCE(description, '') || ' (Auto-Refunded after timeout)'
  WHERE type = 'debit_pending' 
  AND created_at < NOW() - INTERVAL '5 minutes'
  RETURNING request_id, user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
