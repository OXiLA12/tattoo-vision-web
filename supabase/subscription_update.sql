-- ============================================
-- SUBSCRIPTION AND POINTS SYSTEM UPDATE
-- ============================================

-- 1. Update profiles table with subscription info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro', 'studio')),
ADD COLUMN IF NOT EXISTS free_trial_used BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS next_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month');

-- 2. Update user_credits table (internally keep credits name, but semantic is Vision Points)
-- No changes needed to schema, but we'll ensure it exists
-- We might want to add a column for rollover_cap if we implement it

-- 3. Update handle_new_user to align with Subscription Model
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, free_trial_used, next_reset_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    'free', 
    FALSE, 
    (NOW() + INTERVAL '1 month')
  );
  
  -- FREE tier starts with 0 Vision Points
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to assign monthly points based on plan
CREATE OR REPLACE FUNCTION public.get_plan_allowance(p_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE 
    WHEN p_plan = 'plus' THEN 6000
    WHEN p_plan = 'pro' THEN 15000
    WHEN p_plan = 'studio' THEN 40000
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Function to reset/update points for a user (can be called on upgrade or monthly)
CREATE OR REPLACE FUNCTION public.sync_user_plan_points(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_plan TEXT;
  v_allowance INTEGER;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  v_allowance := public.get_plan_allowance(v_plan);
  
  UPDATE public.user_credits
  SET credits = v_allowance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log as bonus or reset
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, v_allowance, 'bonus', 'Monthly plan points allocation: ' || v_plan);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Updated initiate_credit_usage to handle Free Trial + Plan Gating
-- Costs:
-- AI Tattoo: 600
-- Realistic Render: 1200
-- Variation: 500
-- Background Removal: 250

CREATE OR REPLACE FUNCTION public.initiate_credit_usage(
  p_user_id UUID,
  p_amount INTEGER,
  p_request_id UUID,
  p_description TEXT DEFAULT 'Credit usage',
  p_feature TEXT DEFAULT NULL -- e.g., 'realistic_render', 'ai_creation', 'bg_removal'
)
RETURNS JSON AS $$
DECLARE
  v_current_credits INTEGER;
  v_plan TEXT;
  v_free_trial_used BOOLEAN;
  v_existing_record RECORD;
BEGIN
  -- 1. Check if this request_id already exists (Idempotency)
  SELECT * INTO v_existing_record 
  FROM public.credit_transactions 
  WHERE request_id = p_request_id;
  
  IF v_existing_record IS NOT NULL THEN
    RETURN json_build_object(
      'ok', true,
      'status', 'already_exists',
      'type', v_existing_record.type
    );
  END IF;

  -- 2. Get user status
  SELECT plan, free_trial_used INTO v_plan, v_free_trial_used
  FROM public.profiles
  WHERE id = p_user_id;

  -- 3. Handle Feature Gating for FREE tier
  IF v_plan = 'free' THEN
    -- Free tier can ONLY do 1 realistic render
    IF p_feature = 'realistic_render' THEN
      IF v_free_trial_used THEN
        RETURN json_build_object('ok', false, 'error', 'Free trial used. Upgrade to Plus to continue.');
      END IF;
      
      -- If it's the first time, we allow it with 0 credits
      -- We'll mark free_trial_used in confirm_credit_usage or here. Let's do it here or in confirm.
      -- Actually, better to do it here to prevent racing if they try 2 at once.
      UPDATE public.profiles SET free_trial_used = TRUE WHERE id = p_user_id;
      
      INSERT INTO public.credit_transactions (user_id, amount, type, description, request_id)
      VALUES (p_user_id, 0, 'debit_pending', 'Free Trial: ' || p_description, p_request_id);
      
      RETURN json_build_object('ok', true, 'status', 'initiated', 'trial', true);
    ELSE
      -- All other features are blocked for Free
      RETURN json_build_object('ok', false, 'error', 'This feature requires a Plus or Pro subscription.');
    END IF;
  END IF;

  -- 4. Check points for Paid plans
  SELECT credits INTO v_current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_credits < p_amount THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'Insufficient Vision Points. Points reset at the start of your next billing cycle.'
    );
  END IF;
  
  -- 5. Deduct points
  UPDATE public.user_credits
  SET credits = credits - p_amount
  WHERE user_id = p_user_id;
  
  -- 6. Log pending transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, request_id)
  VALUES (p_user_id, -p_amount, 'debit_pending', p_description, p_request_id);
  
  RETURN json_build_object(
    'ok', true,
    'status', 'initiated',
    'trial', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update refund logic to handle free trial reversal if needed
CREATE OR REPLACE FUNCTION public.refund_credit_usage(
  p_request_id UUID,
  p_description TEXT DEFAULT 'Refund'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount INTEGER;
  v_is_trial BOOLEAN;
BEGIN
  -- Get the original transaction
  SELECT user_id, ABS(amount), (description LIKE 'Free Trial%') INTO v_user_id, v_amount, v_is_trial
  FROM public.credit_transactions
  WHERE request_id = p_request_id AND type = 'debit_pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_is_trial THEN
    -- Reset free trial used flag
    UPDATE public.profiles SET free_trial_used = FALSE WHERE id = v_user_id;
  ELSE
    -- Add credits back
    UPDATE public.user_credits
    SET credits = credits + v_amount
    WHERE user_id = v_user_id;
  END IF;
  
  -- Mark as refunded
  UPDATE public.credit_transactions
  SET type = 'refund', 
      description = COALESCE(description, '') || ' (Refunded: ' || p_description || ')'
  WHERE request_id = p_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
