-- Update referral system to give 200 VP bonus only once

CREATE OR REPLACE FUNCTION public.redeem_invite_code(code TEXT)
RETURNS JSONB AS $$
DECLARE
  referrer_uuid UUID;
  new_user_id UUID := auth.uid();
  existing_referer UUID;
  reverse_referral UUID;
  reward_amount INTEGER := 200; -- FIX: 200 VP bonus
BEGIN
  -- Validate input
  IF code IS NULL OR code = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Code invalide');
  END IF;

  -- Get Referrer
  SELECT id INTO STRICT referrer_uuid FROM public.profiles WHERE referral_code = code;
  
  -- Prevent Self-Referral
  IF referrer_uuid = new_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Vous ne pouvez pas utiliser votre propre code');
  END IF;

  -- Prevent Double Referral (User already has a referrer)
  SELECT referred_by INTO existing_referer FROM public.profiles WHERE id = new_user_id;
  IF existing_referer IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Vous avez déjà utilisé un code de parrainage (1 seule fois possible)');
  END IF;

  -- CIRCULAR CHECK: Prevent A referring B then B referring A
  SELECT id INTO reverse_referral FROM public.referrals 
  WHERE referrer_id = new_user_id AND referred_user_id = referrer_uuid;

  IF reverse_referral IS NOT NULL THEN
     RETURN jsonb_build_object('success', false, 'message', 'Parrainage circulaire non autorisé');
  END IF;

  -- Update Profile
  UPDATE public.profiles SET referred_by = referrer_uuid WHERE id = new_user_id;

  -- Create Record
  INSERT INTO public.referrals (referrer_id, referred_user_id, status, completed_at)
  VALUES (referrer_uuid, new_user_id, 'completed', NOW());

  -- Award Credits (200 VP for both)
  PERFORM public.add_credits(referrer_uuid, reward_amount, 'referral_reward', 'Bonus Parrainage');
  PERFORM public.add_credits(new_user_id, reward_amount, 'referral_bonus', 'Code Parrainage Utilisé');

  RETURN jsonb_build_object('success', true, 'reward_amount', reward_amount);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Code introuvable');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
