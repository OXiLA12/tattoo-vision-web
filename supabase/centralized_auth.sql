-- ============================================
-- CENTRALIZED AUTHORIZATION AND POINT SYSTEM
-- ============================================

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
  v_trial_used BOOLEAN;
  v_existing_record RECORD;
BEGIN
  -- 1. Idempotency Check
  SELECT * INTO v_existing_record FROM public.credit_transactions WHERE request_id = p_request_id;
  IF v_existing_record IS NOT NULL THEN
    RETURN json_build_object('ok', true, 'status', 'already_exists', 'type', v_existing_record.type);
  END IF;

  -- 2. Get User Plan and Status
  SELECT plan, free_realistic_render_used INTO v_plan, v_trial_used FROM public.profiles WHERE id = p_user_id;

  -- 3. PLAN-BASED AUTHORIZATION (Gating)
  -- This is the "Hard block" server-side
  
  -- Feature: AI Tattoo Generation
  IF p_feature = 'ai_creation' AND v_plan = 'free' THEN
    RETURN json_build_object(
      'ok', false, 
      'error', 'PLAN_RESTRICTED', 
      'feature', 'AI_TATTOO_GENERATION', 
      'requiredPlan', 'PLUS'
    );
  END IF;

  -- Feature: Realistic Render
  IF p_feature = 'realistic_render' AND v_plan = 'free' THEN
    IF v_trial_used THEN
      RETURN json_build_object(
        'ok', false, 
        'error', 'PLAN_RESTRICTED', 
        'feature', 'REALISTIC_RENDER', 
        'requiredPlan', 'PLUS'
      );
    END IF;
    
    -- First time allowed: Mark as used immediately to prevent racing
    UPDATE public.profiles SET free_realistic_render_used = TRUE WHERE id = p_user_id;
    
    INSERT INTO public.credit_transactions (user_id, amount, type, description, request_id)
    VALUES (p_user_id, 0, 'debit_pending', 'Free Trial: ' || p_description, p_request_id);
    
    RETURN json_build_object('ok', true, 'status', 'initiated', 'trial', true);
  END IF;

  -- Feature: Background Removal
  IF p_feature = 'bg_removal' AND v_plan = 'free' THEN
    RETURN json_build_object(
      'ok', false, 
      'error', 'PLAN_RESTRICTED', 
      'feature', 'REMOVE_BACKGROUND', 
      'requiredPlan', 'PLUS'
    );
  END IF;

  -- 4. POINTS CHECK (Only if plan check passed)
  SELECT credits INTO v_current_credits FROM public.user_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_current_credits < p_amount THEN
    RETURN json_build_object('ok', false, 'error', 'INSUFFICIENT_POINTS');
  END IF;
  
  -- 5. Deduct Points
  UPDATE public.user_credits SET credits = credits - p_amount WHERE user_id = p_user_id;
  
  -- 6. Log pending transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, request_id)
  VALUES (p_user_id, -p_amount, 'debit_pending', p_description, p_request_id);
  
  RETURN json_build_object('ok', true, 'status', 'initiated', 'trial', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
