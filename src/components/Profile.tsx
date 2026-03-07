import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, CreditCard, LogOut, Loader2, Globe, ShieldCheck, Heart, Info, BookOpen, Settings, ArrowRight, BookImage, Sparkles, Zap } from 'lucide-react';
import PlanPricingModal from './PlanPricingModal';
import CreditPackModal from './CreditPackModal';
import { usePayments } from '../hooks/usePayments';
import { useLanguage } from '../contexts/LanguageContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import Onboarding from './Onboarding';

interface ProfileProps {
    onNavigate?: (page: 'analytics' | 'clippeurs' | 'legal' | 'library' | 'support', section?: string) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
    const { user, profile, isEntitled, credits, signOut, resetPassword } = useAuth();
    const { isNative, restorePurchases } = usePayments();
    const { t, language, setLanguage } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [libraryCount, setLibraryCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showCreditPackModal, setShowCreditPackModal] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (user) loadProfileData();
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
        try { await signOut(); } catch (error) { console.error('Error signing out:', error); }
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

            {/* --- HEADER --- */}
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center gap-6">
                <div className="relative group">
                    <div className="absolute inset-0 bg-[#0091FF]/20 rounded-full blur-xl group-hover:bg-[#0091FF]/30 transition-all duration-500" />
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-[#27272a] flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
                        <User className="w-10 h-10 text-neutral-400" />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {user.user_metadata?.full_name || t('auth_placeholder_name')}
                        </h1>
                        {isEntitled && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border text-[#0091FF] border-[#0091FF]/40 bg-[#0091FF]/10">
                                Pro
                            </span>
                        )}
                    </div>
                    <p className="text-neutral-400 font-medium text-lg bg-neutral-900/50 inline-block px-4 py-1.5 rounded-full border border-neutral-800">
                        {user.email}
                    </p>
                </div>

                {/* Admin/Clippeur badges */}
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

            {/* --- STATUS CARD --- */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Pro Status or Upgrade CTA */}
                <div className="md:col-span-8 bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0091FF]/20 to-[#00DC82]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="bg-neutral-950 rounded-[22px] p-6 sm:p-8 relative h-full flex flex-col justify-between border border-neutral-800">
                        {isEntitled ? (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <Sparkles className="w-4 h-4 text-[#0091FF]" />
                                            Tattoo Vision Pro
                                        </h2>
                                        <p className="text-neutral-500 text-xs">
                                            {isFrench ? 'Accès illimité à toutes les fonctionnalités' : 'Unlimited access to all features'}
                                        </p>
                                    </div>
                                </div>

                                {/* Credit balance */}
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> Crédits disponibles
                                        </p>
                                        <p className="text-4xl font-black text-white tracking-tight">
                                            {credits.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button
                                            onClick={() => setShowCreditPackModal(true)}
                                            className="px-4 py-2 rounded-xl bg-[#0091FF]/10 border border-[#0091FF]/30 text-[#0091FF] font-bold text-xs hover:bg-[#0091FF]/20 transition-all flex items-center gap-1.5"
                                        >
                                            <Zap className="w-3.5 h-3.5" />
                                            {isFrench ? 'Acheter des crédits' : 'Buy credits'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">
                                            {isFrench ? 'Accès gratuit' : 'Free Access'}
                                        </h2>
                                        <p className="text-neutral-500 text-sm max-w-[250px]">
                                            {isFrench ? 'Passez Pro pour débloquer tout sans limite' : 'Go Pro to unlock everything unlimited'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-black flex items-center justify-center gap-2 uppercase tracking-wide active:scale-95 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #0091FF, #00DC82)' }}
                                >
                                    {isFrench ? 'Essai gratuit 3 jours' : '3-Day Free Trial'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Library Stat */}
                <div className="md:col-span-4 flex flex-col gap-6">
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

            {/* --- SETTINGS --- */}
            <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-neutral-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neutral-400" />
                        {isFrench ? 'Paramètres du compte' : 'Account Settings'}
                    </h3>
                </div>
                <div className="divide-y divide-neutral-800/50">

                    {/* Language */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-neutral-400" />
                            <span className="font-medium text-neutral-200">{t('profile_language') || 'Langue'}</span>
                        </div>
                        <div className="flex bg-neutral-950 rounded-xl p-1 border border-neutral-800">
                            <button onClick={() => setLanguage('fr')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${language === 'fr' ? 'bg-[#0091FF] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}>
                                Français
                            </button>
                            <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${language === 'en' ? 'bg-[#0091FF] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}>
                                English
                            </button>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-neutral-400" />
                            <div>
                                <span className="font-medium text-neutral-200 block">{isFrench ? 'Abonnement' : 'Subscription'}</span>
                                {isEntitled && (
                                    <span className="text-[10px] uppercase tracking-widest text-[#0091FF] font-bold mt-1 block">Pro · Actif</span>
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
                                onClick={isEntitled ? handleManageSubscription : () => setIsModalOpen(true)}
                                disabled={portalLoading}
                                className="px-4 py-2.5 bg-neutral-950 border border-neutral-700 hover:border-neutral-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEntitled ? (isFrench ? 'Gérer mon abonnement' : 'Manage Subscription') : (isFrench ? 'Passer Pro' : 'Go Pro')}
                            </button>
                        </div>
                    </div>

                    {/* Security */}
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

                    {/* Logout */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-red-500/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-red-500/70" />
                            <span className="font-medium text-red-400">{t('profile_logout') || 'Déconnexion'}</span>
                        </div>
                        <button onClick={handleSignOut} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-sm transition-colors">
                            Quitter
                        </button>
                    </div>
                </div>
            </div>

            {/* --- LEGAL FOOTER --- */}
            <div className="mt-12 text-center flex flex-col items-center">
                <div className="flex items-center gap-6 text-xs font-medium text-neutral-600 mb-4">
                    <button onClick={() => onNavigate?.('legal')} className="hover:text-neutral-300 transition-colors">CGU & Mentions Légales</button>
                    <div className="w-1 h-1 bg-neutral-700 rounded-full" />
                    <button onClick={() => onNavigate?.('support')} className="hover:text-neutral-300 transition-colors">Contact Support</button>
                </div>
                <div className="flex items-center gap-2 text-neutral-600 opacity-50 justify-center mb-1">
                    <Info className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-widest">Tattoo Vision V1.2</span>
                </div>
                <p className="text-[10px] text-neutral-700">Abonnements gérés et sécurisés par Stripe.</p>
            </div>

            {isModalOpen && <PlanPricingModal onClose={() => setIsModalOpen(false)} />}
            {showCreditPackModal && <CreditPackModal onClose={() => setShowCreditPackModal(false)} />}
            {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
        </div>
    );
}
