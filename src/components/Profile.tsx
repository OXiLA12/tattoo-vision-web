import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';
import { User, CreditCard, LogOut, Coins, Loader2, Globe, ShieldCheck, Heart, Info, BookOpen, Settings, Zap, ArrowRight, BookImage } from 'lucide-react';
import PlanPricingModal from './PlanPricingModal';
import { usePayments } from '../hooks/usePayments';
import { useLanguage } from '../contexts/LanguageContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import ReferralModal from './ReferralModal';
import Onboarding from './Onboarding';

interface ProfileProps {
    onNavigate?: (page: 'analytics' | 'clippeurs' | 'legal' | 'library', section?: string) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
    const { user, profile, credits, signOut, resetPassword } = useAuth();
    const { isNative, restorePurchases } = usePayments();
    const { t, language, setLanguage } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [libraryCount, setLibraryCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (user) {
            loadProfileData();
        }
    }, [user]);

    const loadProfileData = async () => {
        if (!user) return;
        setLoading(true);

        const { count } = await supabase
            .from('tattoo_library')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id);

        setLibraryCount(count || 0);
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

    const handleManageSubscription = async () => {
        if (isNative) {
            try {
                const { Purchases } = await import('@revenuecat/purchases-capacitor');
                await (Purchases as any).presentCustomerCenter();
            } catch (e) {
                console.error(e);
                alert("Impossible d'ouvrir le gestionnaire d'abonnement. Veuillez vous rendre dans les réglages de votre téléphone.");
            }
        } else {
            try {
                setPortalLoading(true);
                const { data, error } = await invokeWithAuth('create-portal-session', {
                    body: { returnUrl: window.location.origin }
                });

                if (error) throw new Error(error.message);
                const responseData = data as any;
                if (responseData?.url) {
                    window.location.href = responseData.url;
                } else {
                    throw new Error("No URL returned from server");
                }
            } catch (err: any) {
                console.error("Portal error:", err);
                alert("Impossible d'ouvrir le portail Stripe. Raison : " + (err.message || 'Erreur inconnue'));
            } finally {
                setPortalLoading(false);
            }
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-[#0091FF] animate-spin" />
            </div>
        );
    }

    const isFrench = language === 'fr' || navigator.language.startsWith('fr');

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in pb-32 md:pb-12 min-h-[100dvh]">

            {/* --- HEADER HERO --- */}
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center gap-6">
                <div className="relative group">
                    <div className="absolute inset-0 bg-[#0091FF]/20 rounded-full blur-xl group-hover:bg-[#0091FF]/30 transition-all duration-500"></div>
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-[#27272a] flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
                        <User className="w-10 h-10 text-neutral-400" />
                    </div>
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                        {user.user_metadata?.full_name || t('auth_placeholder_name')}
                    </h1>
                    <p className="text-neutral-400 font-medium text-lg bg-neutral-900/50 inline-block px-4 py-1.5 rounded-full border border-neutral-800">
                        {user.email}
                    </p>
                </div>

                {/* Badges d'administration */}
                <div className="flex flex-wrap justify-center gap-3">
                    {user.email === 'kali.nzeutem@gmail.com' && (
                        <button
                            onClick={() => onNavigate?.('analytics')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold rounded-xl hover:bg-purple-500/20 transition-all shadow-lg"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            Admin
                        </button>
                    )}
                    {profile?.is_clippeur && (
                        <button
                            onClick={() => onNavigate?.('clippeurs' as any)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg"
                        >
                            <User className="w-5 h-5" />
                            Clippeur
                        </button>
                    )}
                </div>
            </div>

            {/* --- BENTO GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* 1. WALLET CARD (Grande carte premium) */}
                <div className="md:col-span-8 bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0091FF]/20 to-[#00DC82]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="bg-neutral-950 rounded-[22px] p-6 sm:p-8 relative h-full flex flex-col justify-between border border-neutral-800">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Coins className="w-4 h-4 text-yellow-500" />
                                    {t('profile_balance') || 'Vision Points'}
                                </h2>
                                <p className="text-neutral-500 text-sm max-w-[250px]">
                                    {isFrench ? 'Utilisez vos points pour des rendus réalistes HD' : 'Use your points for high-quality realistic renders.'}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                                <Zap className="w-6 h-6 text-yellow-500" />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
                            <div>
                                <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500 tracking-tighter">
                                    {credits}
                                </span>
                                <span className="text-xl font-bold text-neutral-600 ml-2">VP</span>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-black focus:outline-none hover:bg-neutral-200 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                                {isFrench ? 'Recharger' : 'Get More'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. STATS & QUICK LINKS */}
                <div className="md:col-span-4 flex flex-col gap-6">
                    {/* Library Stat */}
                    <button
                        onClick={() => onNavigate?.('library')}
                        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex-1 flex flex-col justify-center items-center hover:bg-neutral-800 transition-all hover:-translate-y-1 group"
                    >
                        <div className="w-12 h-12 bg-[#0091FF]/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <BookImage className="w-6 h-6 text-[#0091FF]" />
                        </div>
                        <span className="text-4xl font-black text-white mb-1">{libraryCount}</span>
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('nav_library') || 'Designs'}</span>
                    </button>

                    {/* Onboarding Trigger */}
                    <button
                        onClick={() => setShowOnboarding(true)}
                        className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between hover:bg-neutral-800 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-neutral-400" />
                            <span className="font-medium text-neutral-300">{isFrench ? 'Revoir le tutoriel' : 'View Tutorial'}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-600" />
                    </button>
                </div>
            </div>

            {/* --- SETTINGS SECTION --- */}
            <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-neutral-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neutral-400" />
                        {isFrench ? 'Paramètres du compte' : 'Account Settings'}
                    </h3>
                </div>

                <div className="divide-y divide-neutral-800/50">

                    {/* Language Settings */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-neutral-400" />
                            <span className="font-medium text-neutral-200">{t('profile_language') || 'Langue'}</span>
                        </div>
                        <div className="flex bg-neutral-950 rounded-xl p-1 border border-neutral-800">
                            <button
                                onClick={() => setLanguage('fr')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${language === 'fr' ? 'bg-[#0091FF] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                Français
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${language === 'en' ? 'bg-[#0091FF] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    {/* Subscription Management */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-neutral-400" />
                            <div>
                                <span className="font-medium text-neutral-200 block">{isFrench ? 'Abonnement' : 'Subscription'}</span>
                                {profile?.entitled && (
                                    <span className="text-[10px] uppercase tracking-widest text-[#00DC82] font-bold mt-1 block">Plan Actif</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isNative && (
                                <button
                                    onClick={async () => {
                                        try { await restorePurchases(); alert(isFrench ? 'Achats restaurés avec succès' : 'Purchases restored'); }
                                        catch (e) { alert(isFrench ? 'Échec de la restauration' : 'Failed to restore purchases'); }
                                    }}
                                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    Restaurer
                                </button>
                            )}
                            <button
                                onClick={handleManageSubscription}
                                disabled={portalLoading}
                                className="px-4 py-2.5 bg-neutral-950 border border-neutral-700 hover:border-neutral-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFrench ? 'Gérer / Résilier' : 'Manage / Cancel')}
                            </button>
                        </div>
                    </div>

                    {/* Security Reset */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                            <Heart className="w-5 h-5 text-neutral-400" />
                            <span className="font-medium text-neutral-200">{isFrench ? 'Sécurité' : 'Security'}</span>
                        </div>
                        <button
                            onClick={handleResetPassword}
                            disabled={resetSent}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${resetSent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-300'}`}
                        >
                            {resetSent ? (isFrench ? 'Email envoyé ✓' : 'Email Sent ✓') : (isFrench ? 'Réinitialiser le mot de passe' : 'Reset Password')}
                        </button>
                    </div>

                    {/* Disconnect */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-red-500/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-red-500/70" />
                            <span className="font-medium text-red-400">{t('profile_logout') || 'Déconnexion'}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-sm transition-colors"
                        >
                            Quitter
                        </button>
                    </div>
                </div>
            </div>

            {/* --- LEGAL FOOTER --- */}
            <div className="mt-12 text-center flex flex-col items-center">
                <div className="flex items-center gap-6 text-xs font-medium text-neutral-600 mb-4">
                    <button onClick={() => onNavigate?.('legal')} className="hover:text-neutral-300 transition-colors">CGU & Mentions Légales</button>
                    <div className="w-1 h-1 bg-neutral-700 rounded-full"></div>
                    <a href="mailto:kali.nzeutem@gmail.com" className="hover:text-neutral-300 transition-colors">Contact Support</a>
                </div>
                <div className="flex items-center gap-2 text-neutral-600 opacity-50 justify-center mb-1">
                    <Info className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-widest">Tattoo Vision V1.2</span>
                </div>
                <p className="text-[10px] text-neutral-700">Abonnements gérés et sécurisés par Stripe.</p>
            </div>

            {/* Modals */}
            {isModalOpen && <PlanPricingModal onClose={() => setIsModalOpen(false)} />}
            {showReferralModal && <ReferralModal onClose={() => setShowReferralModal(false)} />}
            {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
        </div>
    );
}
