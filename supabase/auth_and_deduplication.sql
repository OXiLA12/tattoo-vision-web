-- ============================================
-- AUTHORIZATION AND DEDUPLICATION SCHEMA
-- ============================================

-- 1. Ensure profiles has correct columns for gating
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS free_realistic_render_used BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Storage for personal tattoos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tattoos', 'tattoos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Allow public read, authenticated upload to own folder)
CREATE POLICY "Public Tattoos Access" ON storage.objects FOR SELECT USING (bucket_id = 'tattoos');
CREATE POLICY "Users can upload own tattoos" ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'tattoos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Update tattoo_library for deduplication and source tracking
ALTER TABLE public.tattoo_library 
ADD COLUMN IF NOT EXISTS hash TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'imported' CHECK (source IN ('predefined', 'generated', 'imported')),
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Unique constraint for deduplication (per user)
ALTER TABLE public.tattoo_library
DROP CONSTRAINT IF EXISTS tattoo_library_user_hash_unique;
ALTER TABLE public.tattoo_library
ADD CONSTRAINT tattoo_library_user_hash_unique UNIQUE (user_id, hash);

-- 4. Update tattoo_history for deduplication
ALTER TABLE public.tattoo_history
ADD COLUMN IF NOT EXISTS hash TEXT;

-- Unique constraint for history (per user)
ALTER TABLE public.tattoo_history
DROP CONSTRAINT IF EXISTS tattoo_history_user_hash_unique;
ALTER TABLE public.tattoo_history
ADD CONSTRAINT tattoo_history_user_hash_unique UNIQUE (user_id, hash);

-- 5. RPC: can_use_feature(p_user_id, p_feature)
-- Single source of truth for backend gating
CREATE OR REPLACE FUNCTION public.can_use_feature(p_user_id UUID, p_feature TEXT)
RETURNS JSON AS $$
DECLARE
    v_plan TEXT;
    v_trial_used BOOLEAN;
BEGIN
    SELECT plan, free_realistic_render_used INTO v_plan, v_trial_used FROM public.profiles WHERE id = p_user_id;

    -- FREE
    IF v_plan = 'free' THEN
        IF p_feature = 'REALISTIC_RENDER' THEN
            RETURN json_build_object('allowed', NOT v_trial_used, 'required_plan', 'PLUS');
        END IF;
        RETURN json_build_object('allowed', false, 'required_plan', 'PLUS');
    END IF;

    -- PLUS (quota-based or allowed)
    IF v_plan = 'plus' THEN
        RETURN json_build_object('allowed', true);
    END IF;

    -- PRO / STUDIO
    IF v_plan IN ('pro', 'studio') THEN
        RETURN json_build_object('allowed', true);
    END IF;

    RETURN json_build_object('allowed', false, 'required_plan', 'PLUS');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Updated RPC for Library Save (Upsert)
CREATE OR REPLACE FUNCTION public.save_to_library(
    p_user_id UUID,
    p_name TEXT,
    p_image_url TEXT,
    p_hash TEXT,
    p_source TEXT,
    p_prompt TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_id UUID;
    v_auth JSON;
BEGIN
    -- Auth check
    v_auth := public.can_use_feature(p_user_id, 'IMPORT_TATTOO');
    IF p_source = 'imported' AND NOT (v_auth->>'allowed')::boolean THEN
        RETURN json_build_object('ok', false, 'error', 'PLAN_RESTRICTED', 'requiredPlan', 'PLUS');
    END IF;

    INSERT INTO public.tattoo_library (user_id, name, image_url, hash, source, prompt)
    VALUES (p_user_id, p_name, p_image_url, p_hash, p_source, p_prompt)
    ON CONFLICT (user_id, hash) 
    DO UPDATE SET 
        updated_at = NOW(),
        name = EXCLUDED.name,
        prompt = COALESCE(EXCLUDED.prompt, public.tattoo_library.prompt)
    RETURNING id INTO v_id;

    RETURN json_build_object('ok', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Updated RPC for History Save (Upsert)
CREATE OR REPLACE FUNCTION public.save_to_history_v2(
    p_user_id UUID,
    p_body_image_url TEXT,
    p_tattoo_image_url TEXT,
    p_result_image_url TEXT,
    p_hash TEXT,
    p_is_realistic BOOLEAN,
    p_transform_data JSONB
)
RETURNS JSON AS $$
DECLARE
    v_plan TEXT;
BEGIN
    SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
    
    -- Free plan doesn't save history (as per rules)
    IF v_plan = 'free' THEN
        RETURN json_build_object('ok', true, 'status', 'skipped_free_tier');
    END IF;

    INSERT INTO public.tattoo_history (
        user_id, 
        body_image_url, 
        tattoo_image_url, 
        result_image_url, 
        hash, 
        is_realistic, 
        transform_data
    )
    VALUES (
        p_user_id, 
        p_body_image_url, 
        p_tattoo_image_url, 
        p_result_image_url, 
        p_hash, 
        p_is_realistic, 
        p_transform_data
    )
    ON CONFLICT (user_id, hash) 
    DO UPDATE SET 
        created_at = NOW(); -- Refresh to top
    
    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
