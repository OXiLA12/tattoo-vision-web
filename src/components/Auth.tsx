import { useState } from 'react';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import BrandMark from './BrandMark';

interface AuthProps {
    onSuccess: (isNewUser?: boolean) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
    const { signUp, signIn, resendVerification } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [showVerificationMessage, setShowVerificationMessage] = useState(false);
    const { t, language, setLanguage } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName);
                if (error) throw error;
                setShowVerificationMessage(true);
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
                onSuccess(false);
            }
        } catch (err: any) {
            setError(err.message || t('auth_error_default'));
        } finally {
            setLoading(false);
        }
    };
    const handleResend = async () => {
        setResending(true);
        setError(null);
        try {
            const { error } = await resendVerification(email);
            if (error) throw error;
            setResendSuccess(true);
            setTimeout(() => setResendSuccess(false), 5000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Minimalist Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#0A0A0A] to-[#0A0A0A]" />

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    {language === 'fr' ? 'EN' : 'FR'}
                </button>
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-[380px]">
                {/* Brand Logo */}
                <div className="flex justify-center mb-12 opacity-0 animate-fade-up">
                    <BrandMark />
                </div>

                {/* Title */}
                <div className="text-center mb-10 opacity-0 animate-fade-up animation-delay-75">
                    <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
                        {showVerificationMessage ? t('auth_check_email_title') : (isSignUp ? t('auth_signup') : t('auth_welcome'))}
                    </h1>
                    <p className="text-neutral-400 text-sm">
                        {showVerificationMessage
                            ? t('auth_check_email_desc')
                            : (isSignUp ? t('auth_signup_desc') : t('auth_login_desc'))}
                    </p>
                </div>

                {/* Form */}
                <div className="opacity-0 animate-fade-up animation-delay-100">
                    {showVerificationMessage ? (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <Mail className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <button
                                onClick={() => setShowVerificationMessage(false)}
                                className="w-full flex justify-center py-2.5 px-4 border border-white/10 rounded-lg text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-all"
                            >
                                {t('auth_back_to_login')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Error message */}
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            <p className="text-red-500 text-xs font-medium">{error}</p>
                                        </div>
                                        {error.toLowerCase().includes('email not confirmed') && (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                disabled={resending}
                                                className="text-[10px] text-white/60 hover:text-white underline text-left animate-fade-in"
                                            >
                                                {resending ? t('gen_creating') : t('auth_resend_email')}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {resendSuccess && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 animate-fade-in">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <p className="text-emerald-500 text-xs font-medium">{t('auth_resend_success')}</p>
                                    </div>
                                )}

                                {/* Full Name (Sign Up only) */}
                                {isSignUp && (
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-medium text-neutral-400">
                                            {t('auth_full_name')}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2.5 bg-[#171717] border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                                                placeholder={t('auth_placeholder_name')}
                                                required={isSignUp}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-neutral-400">
                                        {t('auth_email')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-[#171717] border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                                            placeholder={t('auth_placeholder_email')}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-neutral-400">
                                        {t('auth_password')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-[#171717] border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <span>{isSignUp ? t('auth_signup') : t('auth_login')}</span>
                                    )}
                                </button>
                            </form>

                            {/* Toggle sign up/sign in */}
                            <div className="mt-8 text-center text-sm">
                                <span className="text-neutral-500">
                                    {isSignUp ? t('auth_have_account') : t('auth_no_account')}
                                </span>
                                <button
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError(null);
                                    }}
                                    className="font-medium text-white hover:underline transition-all ml-1"
                                >
                                    {isSignUp ? t('auth_login') : t('auth_signup')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
