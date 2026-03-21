-- Extend subscription_status to support Stripe's past_due and unpaid statuses.
-- subscription_status is a TEXT column (not an enum), so we only need to
-- update/recreate the CHECK constraint to include the new values.

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_subscription_status_check
    CHECK (subscription_status IN ('none', 'trialing', 'active', 'canceled', 'past_due', 'unpaid'));
