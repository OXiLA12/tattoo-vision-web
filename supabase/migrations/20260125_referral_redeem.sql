-- FUNCTION: REDEEM INVITE CODE (Immediate Reward)
-- Similar to apply_referral_code, but AWARDs immediately if successful.
CREATE OR REPLACE FUNCTION public.redeem_invite_code(code TEXT)
RETURNS JSONB AS $$
DECLARE
  referrer_uuid UUID;
  new_user_id UUID := auth.uid();
  existing_referer UUID;
  referrer_profile RECORD;
  reward_amount INTEGER;
BEGIN
  -- Validate input
  IF code IS NULL OR code = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid code');
  END IF;

  -- Get Referrer
  SELECT id INTO referrer_uuid FROM public.profiles WHERE referral_code = code;
  
  IF referrer_uuid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Code not found');
  END IF;

  -- Prevent self-referral
  IF referrer_uuid = new_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot refer yourself');
  END IF;

  -- Check if already referred
  SELECT referred_by INTO existing_referer FROM public.profiles WHERE id = new_user_id;
  IF existing_referer IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already referred');
  END IF;

  -- Update Profile with Referrer
  UPDATE public.profiles SET referred_by = referrer_uuid WHERE id = new_user_id;

  -- Determine Reward Amount (Based on Referrer's plan)
  SELECT * INTO referrer_profile FROM public.profiles WHERE id = referrer_uuid;
  
  IF referrer_profile.plan = 'pro' OR referrer_profile.plan = 'studio' THEN 
      reward_amount := 2600;
  ELSE
      reward_amount := 1200;
  END IF;

  -- Create Referral Record (COMPLETED immediately)
  INSERT INTO public.referrals (referrer_id, referred_user_id, status, completed_at)
  VALUES (referrer_uuid, new_user_id, 'completed', NOW());

  -- Award Referrer
  PERFORM public.add_credits(referrer_uuid, reward_amount, 'referral_reward', 'Referral Bonus for user ' || new_user_id);

  -- Award Referee (Current User)
  PERFORM public.add_credits(new_user_id, reward_amount, 'referral_bonus', 'Redeemed Invite Code');

  RETURN jsonb_build_object('success', true, 'reward_amount', reward_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
