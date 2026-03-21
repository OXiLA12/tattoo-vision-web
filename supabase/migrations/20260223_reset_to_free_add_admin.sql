-- ============================================
-- Reset all users to free + add is_admin flag
-- ============================================

-- 1. Add is_admin column to profiles (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Mark the admin account
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email = 'kali.nzeutem@gmail.com';

-- 3. Delete ALL purchase transactions EXCEPT for the admin
DELETE FROM public.credit_transactions
WHERE type = 'purchase'
AND user_id NOT IN (
    SELECT id FROM public.profiles WHERE is_admin = TRUE
);

-- Verification: Check the result
SELECT p.email, p.is_admin, uc.credits,
    (SELECT COUNT(*) FROM credit_transactions ct WHERE ct.user_id = p.id AND ct.type = 'purchase') as purchase_count
FROM profiles p
JOIN user_credits uc ON uc.user_id = p.id
ORDER BY p.is_admin DESC, p.created_at DESC;
