import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getCreditTransactions } from '../utils/creditUtils';
import { Database } from '../types/database.types';
import { User, CreditCard, Clock, LogOut, Coins, Calendar, Loader2, Globe, KeyRound, Settings } from 'lucide-react';
import PlanPricingModal from './PlanPricingModal';
import { usePayments } from '../hooks/usePayments';
import { useLanguage } from '../contexts/LanguageContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';

type Transaction = Database['public']['Tables']['credit_transactions']['Row'];

interface ProfileProps {
    onNavigate?: (page: 'analytics') => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
    const { user, profile, credits, signOut, resetPassword } = useAuth();
    const { isNative, restorePurchases } = usePayments();
    const { t, language, setLanguage } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [itemsCount, setItemsCount] = useState({ history: 0, library: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadProfileData();
        }
    }, [user]);

    const loadProfileData = async () => {
        if (!user) return;
        setLoading(true);

        const [history, library, txnData] = await Promise.all([
            supabase.from('tattoo_history').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('tattoo_library').select('id', { count: 'exact' }).eq('user_id', user.id),
            getCreditTransactions(user.id)
        ]);

        setItemsCount({
            history: history.count || 0,
            library: library.count || 0
        });
        setTransactions(txnData || []);
        setLoading(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        try {
            const { error } = await resetPassword(user.email);
            if (error) throw error;
            setResetSent(true);
            setTimeout(() => setResetSent(false), 5000);
        } catch (err: any) {
            console.error('Error resetting password:', err);
            alert(err.message);
        }
    };

    if (!user) return null;

    const handleManageSubscription = async () => {
        if (isNative) {
            try {
                const { presentCustomerCenter } = await import('@revenuecat/purchases-capacitor');
                await presentCustomerCenter();
            } catch (e) {
                console.error(e);
                alert("Impossible d'ouvrir le gestionnaire d'abonnement. Veuillez vous rendre dans les réglages de votre téléphone.");
            }
        } else {
            // Web Stripe Portal
            try {
                setPortalLoading(true);
                const { data, error } = await invokeWithAuth('create-portal-session', {
                    body: { returnUrl: window.location.origin }
                });

                if (error) throw new Error(error.message);
                if (data?.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error("No URL returned from server");
                }
            } catch (err: any) {
                console.error("Portal error:", err);
                alert("Impossible d'ouvrir le portail Stripe. L'email ne correspond peut-être pas à un client existant.");
            } finally {
                setPortalLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-12 max-w-4xl mx-auto animate-fade-in pb-32 md:pb-12 min-h-[100dvh]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-light text-neutral-50 mb-2">{t('profile_title')}</h1>
                    <p className="text-neutral-400 font-light">{t('profile_subtitle')}</p>
                </div>

                <div className="flex gap-3">
                    {/* Admin Button - Only visible for admin */}
                    {user.email === 'kali.nzeutem@gmail.com' && (
                        <button
                            onClick={() => onNavigate?.('analytics')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Admin</span>
                        </button>
                    )}

                    {profile?.is_clippeur && (
                        <button
                            onClick={() => onNavigate?.('clippeurs')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-emerald-500/50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-8v4h8v-4zm-4-8a4 4 0 110 8 4 4 0 010-8z" />
                            </svg>
                            <span>Espace Clippeur</span>
                        </button>
                    )}

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-6 py-3 bg-neutral-900 border border-neutral-800 text-red-400 rounded-xl hover:bg-neutral-800 hover:text-red-300 transition-premium"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>{t('profile_logout')}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* User Info Card */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center">
                            <User className="w-8 h-8 text-neutral-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-medium text-neutral-100">{user.user_metadata.full_name || t('auth_placeholder_name')}</h2>
                            <p className="text-sm text-neutral-400">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-950/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-neutral-400" />
                                <span className="text-neutral-300">{t('history_title')}</span>
                            </div>
                            <span className="text-xl font-light text-neutral-100">{itemsCount.history}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-neutral-950/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-neutral-400" />
                                <span className="text-neutral-300">{t('nav_library')}</span>
                            </div>
                            <span className="text-xl font-light text-neutral-100">{itemsCount.library}</span>
                        </div>

                        {/* Language Selector */}
                        <div className="pt-4 mt-4 border-t border-neutral-800">
                            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" />
                                {t('profile_language')}
                            </h3>
                            <div className="flex gap-2 p-1 bg-neutral-950/50 rounded-xl border border-neutral-800">
                                <button
                                    onClick={() => setLanguage('fr')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${language === 'fr' ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    Français
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${language === 'en' ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    English
                                </button>
                            </div>
                        </div>

                        {/* Reset Password */}
                        <div className="pt-4 mt-4 border-t border-neutral-800">
                            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <KeyRound className="w-3.5 h-3.5" />
                                Sécurité
                            </h3>
                            <button
                                onClick={handleResetPassword}
                                className="w-full py-3 px-4 bg-neutral-950/50 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-sm font-medium text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                {resetSent ? (
                                    <span className="text-emerald-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        Email envoyé
                                    </span>
                                ) : (
                                    <span>Réinitialiser le mot de passe</span>
                                )}
                            </button>
                        </div>

                    </div>

                    {/* Account Actions & Credits Card */}
                    <div className="flex flex-col gap-6">
                        {/* Credits Card */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
                            <h3 className="text-lg font-medium text-neutral-100 mb-6 flex items-center gap-2">
                                <Coins className="w-5 h-5 text-yellow-500" />
                                {t('profile_balance')}
                            </h3>

                            <div className="text-center py-8">
                                <span className="text-6xl font-light text-neutral-50">{credits}</span>
                                <p className="text-neutral-400 mt-2">{t('profile_available')}</p>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-4 bg-gradient-to-r from-[#0091FF] to-[#00DC82] text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all transition-transform hover:-translate-y-0.5"
                            >
                                {t('profile_buy_more') || 'Acheter des points'}
                            </button>
                        </div>

                        {/* Subscription & Purchases Card */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
                            <h3 className="text-sm font-medium text-neutral-100 mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-neutral-400" />
                                Abonnements & Achats
                            </h3>

                            <div className="space-y-3">
                                <button
                                    onClick={handleManageSubscription}
                                    disabled={portalLoading}
                                    className="w-full py-3 px-4 bg-neutral-950/50 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-sm font-medium text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {portalLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Chargement...
                                        </>
                                    ) : (
                                        "Gérer mon abonnement"
                                    )}
                                </button>

                                {isNative && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await restorePurchases();
                                                alert(t('profile_restore_success'));
                                            } catch (e) {
                                                alert(t('profile_restore_failed'));
                                            }
                                        }}
                                        className="w-full py-3 px-4 bg-neutral-950/50 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-sm font-medium text-[#0091FF] transition-all flex items-center justify-center"
                                    >
                                        {t('profile_restore')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <h3 className="text-xl font-light text-neutral-50 mb-6">{t('history_title')}</h3>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">{t('history_empty')}</div>
                ) : (
                    <div className="divide-y divide-neutral-800">
                        {transactions.map((txn) => (
                            <div key={txn.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.amount > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                        <Coins className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-neutral-200 font-medium">{txn.description}</p>
                                        <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(txn.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-lg font-medium ${txn.amount > 0 ? 'text-green-400' : 'text-neutral-100'
                                    }`}>
                                    {txn.amount > 0 ? '+' : ''}{txn.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showPaywall && (
                <PlanPricingModal onClose={() => setShowPaywall(false)} />
            )}

            {isModalOpen && (
                <PlanPricingModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}
