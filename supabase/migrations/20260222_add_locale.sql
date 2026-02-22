-- Add locale column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';

-- Update handle_new_user to include locale
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    plan, 
    free_trial_used, 
    next_reset_at,
    locale
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    'free', 
    FALSE, 
    (NOW() + INTERVAL '1 month'),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  );
  
  -- FREE tier starts with 0 Vision Points
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;