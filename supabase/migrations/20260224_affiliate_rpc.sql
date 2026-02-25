-- RPC to get the clippeur leaderboard (publicly readable for the dashboard)
CREATE OR REPLACE FUNCTION public.get_clippeur_leaderboard()
RETURNS TABLE (
  clippeur_id UUID,
  full_name TEXT,
  total_earnings BIGINT,
  sales_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.clippeur_id,
    p.full_name,
    SUM(ae.earnings)::BIGINT as total_earnings,
    COUNT(ae.id)::BIGINT as sales_count
  FROM public.affiliate_earnings ae
  JOIN public.profiles p ON ae.clippeur_id = p.id
  GROUP BY ae.clippeur_id, p.full_name
  ORDER BY total_earnings DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get individual clippeur details (only for the calling clippeur)
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
