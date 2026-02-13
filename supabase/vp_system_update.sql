-- Update the new user handler to give 1000 VP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'free');
  
  -- Give 1000 VP (Vision Points) on sign up
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 1000);
  
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 1000, 'bonus', 'Welcome Gift (1000 VP)');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users with a "Migration Bonus" if they have low credits (Optional, but good for testing)
-- This ensures you (the current user) have enough credits to test
-- Uncomment the next line if you want to run it manually in SQL Editor
-- UPDATE public.user_credits SET credits = GREATEST(credits, 1000) WHERE credits < 1000;
