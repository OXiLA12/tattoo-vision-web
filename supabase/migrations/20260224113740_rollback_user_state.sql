UPDATE public.profiles
SET plan = 'free'
WHERE email = 'moulagatur.mixture@gmail.com';

UPDATE public.user_credits
SET credits = 500
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'moulagatur.mixture@gmail.com'
);
