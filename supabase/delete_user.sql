CREATE OR REPLACE FUNCTION delete_user_by_email(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    IF v_user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_user_id;
    END IF;
END;
$$;
