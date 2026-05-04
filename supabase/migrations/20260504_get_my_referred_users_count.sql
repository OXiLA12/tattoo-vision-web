-- ============================================
-- RPC: get_my_referred_users_count
-- Returns count of users who signed up via the current user's referral link.
-- Uses SECURITY DEFINER to bypass RLS on profiles.referred_by.
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_referred_users_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.profiles
    WHERE referred_by = auth.uid()
  );
END;
$$;
