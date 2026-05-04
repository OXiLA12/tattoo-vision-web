-- Allow admins to read all tattoo_history rows (bypasses user-only RLS policy)
CREATE POLICY "Admins can view all history"
  ON public.tattoo_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
