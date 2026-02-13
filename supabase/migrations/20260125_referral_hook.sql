-- Update deduct_credits to trigger referral completion
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Credit usage'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  -- Check if enough credits
  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.user_credits
  SET credits = credits - p_amount
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'usage', p_description);

  -- CHECK FOR REFERRAL COMPLETION (Anti-Fraud)
  -- If this is the user's first real usage, complete their referral if pending
  PERFORM public.complete_referral_action(p_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
