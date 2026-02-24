-- Remove the welcome bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'free');
  
  -- Starting balance: 0 VP (users must purchase or use free trial)
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 0);
  
  -- No credit_transactions insertion for welcome bonus anymore
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
