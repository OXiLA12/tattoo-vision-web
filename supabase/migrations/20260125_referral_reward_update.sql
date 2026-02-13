-- FUNCTION: COMPLETE REFERRAL (Called when user takes action)
-- Updated: Awards different amounts based on user Plan (Pro vs Free)
CREATE OR REPLACE FUNCTION public.complete_referral_action(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  ref_record RECORD;
  referrer_profile RECORD;
  reward_amount INTEGER;
BEGIN
  -- Find pending referral
  SELECT * INTO ref_record FROM public.referrals 
  WHERE referred_user_id = target_user_id AND status = 'pending';

  IF ref_record IS NULL THEN
    RETURN; -- Nothing to do
  END IF;

  -- Get Referrer Profile to check Plan
  SELECT * INTO referrer_profile FROM public.profiles WHERE id = ref_record.referrer_id;

  -- Determine Reward Amount
  -- Pro logic: If referrer is PRO, they get 2600. Else, 1200.
  IF referrer_profile.plan = 'pro' OR referrer_profile.plan = 'studio' THEN 
      reward_amount := 2600;
  ELSE
      reward_amount := 1200;
  END IF;

  -- Update status
  UPDATE public.referrals 
  SET status = 'completed', completed_at = NOW() 
  WHERE id = ref_record.id;

  -- Award Referrer (The one who shared the code)
  PERFORM public.add_credits(ref_record.referrer_id, reward_amount, 'referral_reward', 'Referral Bonus for user ' || target_user_id);

  -- Award Referee (The new user) - SAME AMOUNT
  PERFORM public.add_credits(target_user_id, reward_amount, 'referral_bonus', 'Signup Referral Bonus');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
