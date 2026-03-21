-- FIX: Prevent Circular Referrals (A -> B -> A)
CREATE OR REPLACE FUNCTION public.redeem_invite_code(code TEXT)
RETURNS JSONB AS $$
DECLARE
  referrer_uuid UUID;
  new_user_id UUID := auth.uid();
  existing_referer UUID;
  referrer_profile RECORD;
  reward_amount INTEGER;
  reverse_referral UUID; -- To check if A referred B (when B is trying to refer A)
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

  -- 1. Prevent Self-Referral
  IF referrer_uuid = new_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot refer yourself');
  END IF;

  -- 2. Prevent Double Referral (User already has a referrer)
  SELECT referred_by INTO existing_referer FROM public.profiles WHERE id = new_user_id;
  IF existing_referer IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already referred');
  END IF;

  -- 3. CIRCULAR CHECK (New): Check if I (new_user_id) already referred the person I am trying to claim code from (referrer_uuid)
  -- Logic: Check if there exists a referral where referrer_id = ME and referred_user_id = TARGET
  SELECT id INTO reverse_referral FROM public.referrals 
  WHERE referrer_id = new_user_id AND referred_user_id = referrer_uuid;

  IF reverse_referral IS NOT NULL THEN
     RETURN jsonb_build_object('success', false, 'message', 'Circular referral not allowed. You referred this user.');
  END IF;

  -- Update Profile
  UPDATE public.profiles SET referred_by = referrer_uuid WHERE id = new_user_id;

  -- Determine Reward
  SELECT * INTO referrer_profile FROM public.profiles WHERE id = referrer_uuid;
  
  IF referrer_profile.plan = 'pro' OR referrer_profile.plan = 'studio' THEN 
      reward_amount := 2600;
  ELSE
      reward_amount := 1200;
  END IF;

  -- Create Record
  INSERT INTO public.referrals (referrer_id, referred_user_id, status, completed_at)
  VALUES (referrer_uuid, new_user_id, 'completed', NOW());

  -- Award Credits
  PERFORM public.add_credits(referrer_uuid, reward_amount, 'referral_reward', 'Referral Bonus for user ' || new_user_id);
  PERFORM public.add_credits(new_user_id, reward_amount, 'referral_bonus', 'Redeemed Invite Code');

  RETURN jsonb_build_object('success', true, 'reward_amount', reward_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
