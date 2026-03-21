-- ============================================
-- LIBRARY AND HISTORY DEDUPLICATION SCHEMA
-- ============================================

-- 1. Create Storage Bucket for Tattoos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tattoos', 'tattoos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'tattoos');
CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tattoos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Update tattoo_library with hash and source
ALTER TABLE public.tattoo_library 
ADD COLUMN IF NOT EXISTS hash TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'imported' CHECK (source IN ('predefined', 'generated', 'imported')),
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Add unique constraint for library (user_id, hash)
-- Note: We only deduplicate based on hash for the same user
ALTER TABLE public.tattoo_library
ADD CONSTRAINT tattoo_library_user_hash_unique UNIQUE (user_id, hash);

-- 3. Update tattoo_history with hash
ALTER TABLE public.tattoo_history
ADD COLUMN IF NOT EXISTS hash TEXT;

-- Add unique constraint for history (user_id, hash)
ALTER TABLE public.tattoo_history
ADD CONSTRAINT tattoo_history_user_hash_unique UNIQUE (user_id, hash);

-- 4. Function to save to library with UPSERT logic
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
BEGIN
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

-- 5. Function to save to history with UPSERT logic
CREATE OR REPLACE FUNCTION public.save_to_history_v2(
    p_user_id UUID,
    p_body_image_url TEXT,
    p_tattoo_image_url TEXT,
    p_result_image_url TEXT,
    p_hash TEXT,
    p_is_realistic BOOLEAN,
    p_transform_data JSONB
)
RETURNS VOID AS $$
BEGIN
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
        created_at = NOW(); -- Refresh timestamp to bring to top
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
