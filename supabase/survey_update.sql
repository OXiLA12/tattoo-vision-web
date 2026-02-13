-- ============================================
-- ONBOARDING SURVEY UPDATE
-- ============================================

-- 1. Add marketing_source column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS marketing_source TEXT;

-- 2. Update handle_new_user to give 0 credits initially
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- CHANGED: Give 0 credits initially instead of 10
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to submit survey and get bonus
CREATE OR REPLACE FUNCTION public.submit_onboarding_survey(
  p_source TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_has_credits BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  -- Update profile with source
  UPDATE public.profiles
  SET marketing_source = p_source
  WHERE id = v_user_id;
  
  -- Check if user already got the welcome bonus
  SELECT EXISTS (
    SELECT 1 FROM public.credit_transactions 
    WHERE user_id = v_user_id AND type = 'bonus' AND description = 'Welcome bonus'
  ) INTO v_has_credits;
  
  -- If not, give the 10 credits
  IF NOT v_has_credits THEN
    -- Add credits
    UPDATE public.user_credits
    SET credits = credits + 10
    WHERE user_id = v_user_id;
    
    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (v_user_id, 10, 'bonus', 'Welcome bonus');
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
