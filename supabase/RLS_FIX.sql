-- ==============================================================================
-- FIX: Update Access Policy for Tattoo Library
-- ==============================================================================
-- This script modifies the security rules (RLS) to allow EVERYONE to see 
-- "Official" (predefined) tattoos, while still keeping personal tattoos private.

-- 1. Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own library" ON public.tattoo_library;

-- 2. Create the new inclusive policy
CREATE POLICY "Users can view own library and official items"
  ON public.tattoo_library FOR SELECT
  USING (
    -- User can see their own items
    auth.uid() = user_id
    OR
    -- OR anyone can see official/predefined items
    source = 'predefined'
  );

-- 3. Verify it's enabled
ALTER TABLE public.tattoo_library ENABLE ROW LEVEL SECURITY;
