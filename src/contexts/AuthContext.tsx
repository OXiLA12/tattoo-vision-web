import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    marketing_source: string | null;
    referral_code: string | null;
    referred_by: string | null;
    plan: 'free' | 'plus' | 'pro' | 'studio';
    free_trial_used: boolean;
    free_realistic_render_used: boolean;
    next_reset_at: string | null;
    is_admin: boolean;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    credits: number;
    hasPurchasedVP: boolean;
    loading: boolean;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    refreshCredits: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    refreshPurchaseStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [hasPurchasedVP, setHasPurchasedVP] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchCredits(session.user.id);
                fetchProfile(session.user.id);
                fetchPurchaseStatus(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchCredits(session.user.id);
                fetchProfile(session.user.id);
                fetchPurchaseStatus(session.user.id);
            } else {
                setCredits(0);
                setProfile(null);
                setHasPurchasedVP(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchCredits = async (userId: string) => {
        const { data, error } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', userId)
            .single();

        if (!error && data) {
            setCredits((data as any).credits);
        }
    };

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data as Profile);
        }
    };

    const fetchPurchaseStatus = async (userId: string) => {
        // Check if admin
        const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (profileData?.is_admin) {
            setHasPurchasedVP(true);
            return;
        }

        // Otherwise check purchase transactions
        const { data, error } = await supabase
            .from('credit_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'purchase')
            .limit(1);

        if (!error && data && data.length > 0) {
            setHasPurchasedVP(true);
        } else {
            setHasPurchasedVP(false);
        }
    };

    const refreshCredits = async () => {
        if (user) {
            await fetchCredits(user.id);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const refreshPurchaseStatus = async () => {
        if (user) {
            await fetchPurchaseStatus(user.id);
        }
    };

    // ============================================================
    // EMAIL CONFIRMATION TEMPORARILY DISABLED
    // Reason: Resend email quota limit reached, low revenue phase.
    // To re-enable: Set EMAIL_CONFIRM_REQUIRED = true AND
    //   turn ON "Confirm email" in Supabase Dashboard →
    //   Authentication → Providers → Email.
    // All Resend functions are kept intact below.
    // ============================================================
    const EMAIL_CONFIRM_REQUIRED = false;

    const signUp = async (email: string, password: string, fullName?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                // Only set emailRedirectTo when confirmation is required
                ...(EMAIL_CONFIRM_REQUIRED ? { emailRedirectTo: `${window.location.origin}` } : {}),
            },
        });

        // When email confirmation is disabled in Supabase Dashboard,
        // data.session is available immediately → user is auto-logged in
        const isAutoLoggedIn = !EMAIL_CONFIRM_REQUIRED && !!data?.session;

        return { error, isAutoLoggedIn };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const resendVerification = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}`,
            },
        });
        return { error };
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        return { error };
    };

    const value = {
        user,
        session,
        profile,
        credits,
        hasPurchasedVP,
        loading,
        signUp,
        signIn,
        signOut,
        refreshCredits,
        refreshProfile,
        refreshPurchaseStatus,
        resendVerification,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
