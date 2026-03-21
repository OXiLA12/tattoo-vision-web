-- ============================================
-- CLIPPEUR / AFFILIATE EARNINGS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clippeur_id UUID REFERENCES public.profiles(id) NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount_total INTEGER NOT NULL,
  earnings INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own earnings
CREATE POLICY "Users can view their own clippeur earnings"
  ON public.affiliate_earnings FOR SELECT
  USING (auth.uid() = clippeur_id);

-- Allow seeing all earnings for the shared dashboard
-- Alternatively, allow everyone to see all for the shared leaderboard
CREATE POLICY "Anyone can view affiliate earnings for leaderboard"
  ON public.affiliate_earnings FOR SELECT
  USING (true);

-- Allow service role to insert
CREATE POLICY "Service role can insert earnings"
  ON public.affiliate_earnings FOR INSERT
  WITH CHECK (true);
