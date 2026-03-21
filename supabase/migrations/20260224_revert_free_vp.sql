CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, subscription_status, stripe_customer_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free',
    'active',
    NULL
  );

  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 500); -- REMIS À 500 VP GRATUITS !

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
