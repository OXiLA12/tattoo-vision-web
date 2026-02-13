-- ============================================
-- REFERRAL SYSTEM MIGRATION
-- ============================================

-- 1. ADD COLUMNS TO PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 2. CREATE REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES public.profiles(id) NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE, -- One referral per user
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR REFERRALS
CREATE POLICY "Users can view their own referrals (as referrer)"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- 4. FUNCTION: GENERATE REFERRAL CODE
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  collision BOOLEAN;
BEGIN
  -- Check if user already has a code
  SELECT referral_code INTO new_code FROM public.profiles WHERE id = auth.uid();
  IF new_code IS NOT NULL THEN
    RETURN new_code;
  END IF;

  LOOP
    -- Generate 8-char random string (uppercase alphanumeric)
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check collision
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO collision;
    EXIT WHEN NOT collision;
  END LOOP;

  -- Assign to user
  UPDATE public.profiles SET referral_code = new_code WHERE id = auth.uid();
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCTION: APPLY REFERRAL CODE (Called on Signup)
CREATE OR REPLACE FUNCTION public.apply_referral_code(code TEXT)
RETURNS JSONB AS $$
DECLARE
  referrer_uuid UUID;
  new_user_id UUID := auth.uid();
  existing_referer UUID;
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

  -- Update Profile
  UPDATE public.profiles SET referred_by = referrer_uuid WHERE id = new_user_id;

  -- Create Referral Record (Pending)
  INSERT INTO public.referrals (referrer_id, referred_user_id, status)
  VALUES (referrer_uuid, new_user_id, 'pending');

  RETURN jsonb_build_object('success', true, 'referrer_id', referrer_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION: COMPLETE REFERRAL (Called when user takes action)
-- This function awards credits to BOTH parties
CREATE OR REPLACE FUNCTION public.complete_referral_action(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  ref_record RECORD;
  reward_amount INTEGER := 200000; -- 200k tokens as per screenshot
BEGIN
  -- Find pending referral
  SELECT * INTO ref_record FROM public.referrals 
  WHERE referred_user_id = target_user_id AND status = 'pending';

  IF ref_record IS NULL THEN
    RETURN; -- Nothing to do
  END IF;

  -- Update status
  UPDATE public.referrals 
  SET status = 'completed', completed_at = NOW() 
  WHERE id = ref_record.id;

  -- Award Referrer (The one who shared the code)
  PERFORM public.add_credits(ref_record.referrer_id, reward_amount, 'referral_reward', 'Referral Bonus for user ' || target_user_id);

  -- Award Referee (The new user)
  PERFORM public.add_credits(target_user_id, reward_amount, 'referral_bonus', 'Signup Referral Bonus');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
