export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    marketing_source: string | null;
                    plan: 'free' | 'plus' | 'pro' | 'studio';
                    free_trial_used: boolean;
                    free_realistic_render_used: boolean;
                    next_reset_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    marketing_source?: string | null;
                    plan?: 'free' | 'plus' | 'pro' | 'studio';
                    free_trial_used?: boolean;
                    free_realistic_render_used?: boolean;
                    next_reset_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    marketing_source?: string | null;
                    plan?: 'free' | 'plus' | 'pro' | 'studio';
                    free_trial_used?: boolean;
                    free_realistic_render_used?: boolean;
                    next_reset_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            user_credits: {
                Row: {
                    id: string;
                    user_id: string;
                    credits: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    credits?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    credits?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            credit_transactions: {
                Row: {
                    id: string;
                    user_id: string;
                    amount: number;
                    type: 'purchase' | 'usage' | 'bonus' | 'refund';
                    description: string | null;
                    request_id?: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    amount: number;
                    type: 'purchase' | 'usage' | 'bonus' | 'refund';
                    description?: string | null;
                    request_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    amount?: number;
                    type?: 'purchase' | 'usage' | 'bonus' | 'refund';
                    description?: string | null;
                    request_id?: string | null;
                    created_at?: string;
                };
            };
            tattoo_history: {
                Row: {
                    id: string;
                    user_id: string;
                    body_image_url: string;
                    tattoo_image_url: string;
                    result_image_url: string;
                    hash: string | null;
                    is_realistic: boolean;
                    transform_data: Record<string, any> | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    body_image_url: string;
                    tattoo_image_url: string;
                    result_image_url: string;
                    hash?: string | null;
                    is_realistic?: boolean;
                    transform_data?: Record<string, any> | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    body_image_url?: string;
                    tattoo_image_url?: string;
                    result_image_url?: string;
                    hash?: string | null;
                    is_realistic?: boolean;
                    transform_data?: Record<string, any> | null;
                    created_at?: string;
                };
            };
            tattoo_library: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    image_url: string;
                    source: 'predefined' | 'generated' | 'imported';
                    hash: string | null;
                    prompt: string | null;
                    tags: string[];
                    category: string | null;
                    is_favorite: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    image_url: string;
                    source?: 'predefined' | 'generated' | 'imported';
                    hash?: string | null;
                    prompt?: string | null;
                    tags?: string[];
                    category?: string | null;
                    is_favorite?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    image_url?: string;
                    source?: 'predefined' | 'generated' | 'imported';
                    hash?: string | null;
                    prompt?: string | null;
                    tags?: string[];
                    category?: string | null;
                    is_favorite?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Functions: {
            submit_onboarding_survey: {
                Args: { p_source: string };
                Returns: boolean;
            };
            initiate_credit_usage: {
                Args: {
                    p_user_id: string;
                    p_amount: number;
                    p_request_id: string;
                    p_description?: string;
                    p_feature?: string;
                };
                Returns: any;
            };
            confirm_credit_usage: {
                Args: { p_request_id: string };
                Returns: boolean;
            };
            refund_credit_usage: {
                Args: {
                    p_request_id: string;
                    p_description?: string;
                };
                Returns: boolean;
            };
            save_to_library: {
                Args: {
                    p_user_id: string;
                    p_name: string;
                    p_image_url: string;
                    p_hash: string;
                    p_source: string;
                    p_prompt?: string;
                };
                Returns: any;
            };
            save_to_history_v2: {
                Args: {
                    p_user_id: string;
                    p_body_image_url: string;
                    p_tattoo_image_url: string;
                    p_result_image_url: string;
                    p_hash: string;
                    p_is_realistic: boolean;
                    p_transform_data: any;
                };
                Returns: any;
            };
            can_use_feature: {
                Args: {
                    p_user_id: string;
                    p_feature: string;
                };
                Returns: any;
            };
        };
    };
}
