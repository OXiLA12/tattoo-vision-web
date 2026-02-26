-- ============================================
-- AFFILIATE TRIAL TRACKING
-- Track when a referred user starts a free trial
-- ============================================

CREATE TABLE IF NOT EXISTS public.affiliate_trials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clippeur_id UUID REFERENCES public.profiles(id) NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  plan TEXT NOT NULL DEFAULT 'launch_weekly_trial',
  converted BOOLEAN DEFAULT FALSE,  -- true when they pay after trial
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.affiliate_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate trials"
  ON public.affiliate_trials FOR SELECT
  USING (auth.uid() = clippeur_id);

CREATE POLICY "Service role can insert affiliate trials"
  ON public.affiliate_trials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update affiliate trials"
  ON public.affiliate_trials FOR UPDATE
  USING (true);

-- ============================================
-- Update leaderboard to include trial count
-- ============================================
DROP FUNCTION IF EXISTS public.get_clippeur_leaderboard();
CREATE OR REPLACE FUNCTION public.get_clippeur_leaderboard()
RETURNS TABLE (
  clippeur_id UUID,
  full_name   TEXT,
  total_earnings BIGINT,
  sales_count    BIGINT,
  trials_count   BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as clippeur_id,
    p.full_name,
    COALESCE(SUM(ae.earnings), 0)::BIGINT as total_earnings,
    COUNT(DISTINCT ae.id)::BIGINT as sales_count,
    COUNT(DISTINCT at2.id)::BIGINT as trials_count
  FROM public.profiles p
  LEFT JOIN public.affiliate_earnings ae ON ae.clippeur_id = p.id
  LEFT JOIN public.affiliate_trials    at2 ON at2.clippeur_id = p.id
  WHERE p.is_clippeur = TRUE
  GROUP BY p.id, p.full_name
  ORDER BY total_earnings DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Update personal stats to include trial count
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_affiliate_stats()
RETURNS TABLE (
  total_earnings  BIGINT,
  sales_count     BIGINT,
  trials_count    BIGINT,
  converted_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(earnings) FROM public.affiliate_earnings WHERE clippeur_id = auth.uid()), 0)::BIGINT,
    (SELECT COUNT(*) FROM public.affiliate_earnings WHERE clippeur_id = auth.uid())::BIGINT,
    (SELECT COUNT(*) FROM public.affiliate_trials WHERE clippeur_id = auth.uid())::BIGINT,
    (SELECT COUNT(*) FROM public.affiliate_trials WHERE clippeur_id = auth.uid() AND converted = TRUE)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Keep the old get_my_affiliate_sales for backward compat
CREATE OR REPLACE FUNCTION public.get_my_affiliate_sales()
RETURNS TABLE (
  id UUID,
  amount_total INTEGER,
  earnings INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  buyer_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.amount_total,
    ae.earnings,
    ae.created_at,
    p.full_name as buyer_name
  FROM public.affiliate_earnings ae
  JOIN public.profiles p ON ae.buyer_id = p.id
  WHERE ae.clippeur_id = auth.uid()
  ORDER BY ae.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
