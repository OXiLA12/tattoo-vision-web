-- Update the new user handler to give 0 VP (no free realistic render)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'free');
  
  -- User starts with 0 VP to enforce payment before first render
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 0);
  
  -- We don't insert a 'bonus' transaction anymore
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove existing 500 VP bonuses from users who never purchased anything (optional, to force them to pay now)
UPDATE public.user_credits
SET credits = 0
WHERE credits = 500 
  AND user_id NOT IN (
    SELECT DISTINCT user_id FROM public.credit_transactions WHERE type = 'purchase'
  );
