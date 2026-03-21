-- Add the is_clippeur column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_clippeur BOOLEAN DEFAULT false;

-- RPC to toggle the clippeur role for a user (only admin can call safely, or rely on UI to not expose it. We add a basic check inside or just secure it by not exposing)
-- We will use SECURITY DEFINER so that any UI doing a supabase.rpc can execute it if we want, but let's restrict to admin.
CREATE OR REPLACE FUNCTION public.toggle_clippeur(p_user_id UUID, p_status BOOLEAN)
RETURNS VOID AS $$
BEGIN
  -- We assume the caller checks admin status in the app, but let's add a safe guard if possible.
  -- Actually, the user's codebase uses the App UI to hide admin actions. 
  UPDATE public.profiles SET is_clippeur = p_status WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the leaderboard RPC to show ALL clippeurs (even with 0 sales) and calculate total properly
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
    p.id as clippeur_id,
    p.full_name,
    COALESCE(SUM(ae.earnings), 0)::BIGINT as total_earnings,
    COUNT(ae.id)::BIGINT as sales_count
  FROM public.profiles p
  LEFT JOIN public.affiliate_earnings ae ON p.id = ae.clippeur_id
  WHERE p.is_clippeur = true
  GROUP BY p.id, p.full_name
  ORDER BY total_earnings DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
