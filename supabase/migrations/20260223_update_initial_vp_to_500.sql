-- Update the new user handler to give 500 VP instead of 1000
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'free');
  
  -- Give 500 VP (Vision Points) on sign up
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 500);
  
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 500, 'bonus', 'Welcome Gift (500 VP)');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
