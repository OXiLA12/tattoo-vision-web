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
    plan: 'free' | 'pro';
    free_trial_used: boolean;
    free_realistic_render_used: boolean;
    next_reset_at: string | null;
    is_admin: boolean;
    is_clippeur: boolean;
    entitled: boolean;
    subscription_status: string | null;
    trial_ends_at: string | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isEntitled: boolean;
    credits: number;
    loading: boolean;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; isAutoLoggedIn?: boolean }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshCredits: () => Promise<void>;
    resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    refreshPurchaseStatus: () => Promise<void>;
    // Legacy aliases
    hasPurchasedVP: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchCredits(session.user.id);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchCredits(session.user.id);
            } else {
                setProfile(null);
                setCredits(0);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (!error && data) setProfile(data as Profile);
    };

    const fetchCredits = async (userId: string) => {
        const { data } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', userId)
            .single();
        if (data) setCredits((data as any).credits ?? 0);
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    const refreshCredits = async () => {
        if (user) await fetchCredits(user.id);
    };

    const isEntitled = !!(profile?.is_admin || profile?.entitled);
    const hasPurchasedVP = isEntitled;

    const EMAIL_CONFIRM_REQUIRED = false;

    const signUp = async (email: string, password: string, fullName?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                ...(EMAIL_CONFIRM_REQUIRED ? { emailRedirectTo: `${window.location.origin}` } : {}),
            },
        });
        const isAutoLoggedIn = !EMAIL_CONFIRM_REQUIRED && !!data?.session;
        return { error, isAutoLoggedIn };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const resendVerification = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: { emailRedirectTo: `${window.location.origin}` },
        });
        return { error };
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        return { error };
    };

    const refreshPurchaseStatus = refreshProfile;

    const value = {
        user,
        session,
        profile,
        isEntitled,
        credits,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        refreshCredits,
        refreshPurchaseStatus,
        resendVerification,
        resetPassword,
        hasPurchasedVP,
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
