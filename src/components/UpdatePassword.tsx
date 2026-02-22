import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import BrandMark from './BrandMark';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function UpdatePassword({ onComplete }: { onComplete: () => void }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { t } = useLanguage();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError(t('auth_password_match_error') || 'Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            setError(t('auth_password_length_error') || 'Mot de passe trop court');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || t('auth_error_default'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#0A0A0A] to-[#0A0A0A]" />
                <div className="relative z-10 w-full max-w-[380px] bg-[#111] border border-white/5 rounded-2xl p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">{t('auth_password_updated') || 'Mot de passe mis à jour'}</h2>
                    <p className="text-neutral-400 text-sm mb-8">
                        {t('auth_password_updated_desc') || 'Votre mot de passe a été modifié avec succès.'}
                    </p>
                    <button
                        onClick={onComplete}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-black bg-white hover:bg-neutral-200 transition-colors"
                    >
                        {t('auth_back_to_login') || 'Retour à la connexion'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#0A0A0A] to-[#0A0A0A]" />

            <div className="relative z-10 w-full max-w-[380px]">
                <div className="flex justify-center mb-12">
                    <BrandMark />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
                        {t('auth_update_password') || 'Nouveau mot de passe'}
                    </h1>
                    <p className="text-neutral-400 text-sm">
                        {t('auth_update_password_desc') || 'Définissez votre nouveau mot de passe.'}
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-red-500 text-xs font-medium">{error}</p>
                        </div>
                    )}

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

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-neutral-400">
                            {t('auth_confirm_password') || 'Confirmer'}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 bg-[#171717] border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <span>{t('auth_update_password_btn') || 'Valider'}</span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onComplete}
                        className="w-full mt-4 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                        {t('auth_back_to_login') || 'Retour'}
                    </button>
                </form>
            </div>
        </div>
    );
}
