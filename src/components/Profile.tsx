import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, Loader2, Info, BookOpen, ArrowRight, BookImage, Sparkles, Zap, Trash2, CreditCard, LayoutDashboard, Globe, LogOut, ShieldCheck } from 'lucide-react';
import PlanPricingModal from './PlanPricingModal';
import CreditPackModal from './CreditPackModal';
import { usePayments } from '../hooks/usePayments';
import { useLanguage } from '../contexts/LanguageContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';
const PRIVACY_POLICY_URL = 'https://tattoovisionapp.com/privacy';
const TERMS_OF_USE_URL = 'https://tattoovisionapp.com/legal';
const openExternalUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
import Onboarding from './Onboarding';
import { MagicButton } from './ui/MagicButton';

const ADMIN_EMAIL = 'kali.nzeutem@gmail.com';

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
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (user) loadProfileData();
        else setLoading(false);
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

    const handleDeleteAccount = async () => {
        if (!user?.email) return;
        const confirmed = window.confirm(
            isFrench
                ? 'Supprimer définitivement votre compte et les données associées ? Cette action est irréversible.'
                : 'Permanently delete your account and associated data? This action cannot be undone.'
        );
        if (!confirmed) return;
        try {
            setDeleteLoading(true);
            const { error } = await supabase.rpc('delete_user_by_email', { p_email: user.email } as any);
            if (error) throw error;
            await signOut();
            alert(isFrench ? 'Votre compte a été supprimé.' : 'Your account has been deleted.');
        } catch (err: any) {
            console.error('Delete account error:', err);
            alert((isFrench ? 'Impossible de supprimer le compte. ' : 'Could not delete account. ') + (err.message || ''));
        } finally {
            setDeleteLoading(false);
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

    const isFrench = language === 'fr';

    return (
        <div className="relative max-w-xl mx-auto px-4 pt-28 md:pt-10 pb-36 md:pb-16 min-h-[100dvh] animate-fade-in">
            {/* Ambient Glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-[#0091FF]/4 rounded-full blur-[130px]" />
                <div className="absolute bottom-20 -right-20 w-[20rem] h-[20rem] bg-[#0055FF]/4 rounded-full blur-[100px]" />
            </div>

            <div className="relative flex flex-col gap-4 z-10">

                {/* Avatar + Name card */}
                <section className="rounded-[34px] bg-[linear-gradient(180deg,rgba(12,12,12,0.98),rgba(5,5,5,0.99))] border border-white/8 shadow-[0_28px_80px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="px-6 pt-7 pb-6 text-center">
                        <div className="w-24 h-24 rounded-full mx-auto bg-[linear-gradient(135deg,rgba(0,145,255,0.08),rgba(138,43,226,0.06))] border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(0,145,255,0.1),0_18px_40px_rgba(0,0,0,0.3)] mb-5">
                            <User className="w-10 h-10 text-white/60" />
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.05em] text-white break-words">
                                {user.user_metadata?.full_name || t('auth_placeholder_name')}
                            </h1>
                            {isEntitled && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] text-[#0091FF] bg-[#0091FF]/10 border border-[#0091FF]/20">
                                    Pro
                                </span>
                            )}
                        </div>
                        <p className="text-neutral-400 text-sm break-all max-w-[280px] mx-auto">{user.email}</p>

                        {/* Clippeur badge */}
                        {(profile as any)?.is_clippeur && (
                            <button
                                onClick={() => onNavigate?.('clippeurs' as any)}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/20 transition-all"
                            >
                                <User className="w-4 h-4" />
                                Clippeur
                            </button>
                        )}
                    </div>
                </section>

                {/* Subscription card */}
                <section className="relative rounded-[32px] bg-[#070709] border border-white/5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#0091FF]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#0091FF]/10 transition-colors duration-700" />

                    <div className="relative z-10 px-6 pt-6 pb-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] bg-gradient-to-r from-[#0091FF] to-[#0055FF] bg-clip-text text-transparent mb-2">
                            {isEntitled ? 'Tattoo Vision Pro' : (isFrench ? 'Abonnement' : 'Subscription')}
                        </p>
                        <h2 className="text-[32px] leading-[0.95] font-black tracking-[-0.05em] text-white mb-3">
                            {isEntitled
                                ? (isFrench ? 'Votre espace premium' : 'Your premium space')
                                : (isFrench ? 'Passez au niveau supérieur' : 'Upgrade your access')}
                        </h2>
                        <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
                            {isEntitled
                                ? (isFrench ? 'Abonnements gérés et sécurisés par Stripe.' : 'Subscriptions managed and secured by Stripe.')
                                : (isFrench ? "Débloquez l'expérience complète." : 'Unlock the full experience.')}
                        </p>
                    </div>

                    <div className="px-6 pb-6">
                        {isEntitled ? (
                            <>
                                <div className="rounded-[26px] bg-gradient-to-r from-[#0091FF]/8 to-[#0055FF]/8 border border-white/8 px-5 py-5 mb-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-[#0091FF]" />
                                        {isFrench ? 'Crédits disponibles' : 'Available credits'}
                                    </p>
                                    <p className="text-5xl font-black tracking-[-0.05em] text-white">{credits.toLocaleString()}</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <MagicButton onClick={() => setShowCreditPackModal(true)} className="w-full">
                                        {isFrench ? 'Acheter des crédits' : 'Buy credits'}
                                    </MagicButton>
                                    <button
                                        onClick={handleManageSubscription}
                                        disabled={portalLoading}
                                        className="w-full py-3.5 rounded-2xl bg-white/[0.05] text-white font-medium hover:bg-white/[0.08] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {portalLoading ? (isFrench ? 'Ouverture…' : 'Opening…') : (isFrench ? 'Gérer mon abonnement' : 'Manage subscription')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full py-3.5 rounded-2xl bg-[linear-gradient(135deg,#0091FF,#0055FF)] text-black font-black text-sm hover:opacity-90 hover:scale-[1.01] transition-all shadow-[0_10px_30px_rgba(0,145,255,0.2)] inline-flex items-center justify-center gap-2"
                                >
                                    {isFrench ? 'Passer Pro' : 'Go Pro'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                {isNative && (
                                    <button
                                        onClick={async () => {
                                            try { await restorePurchases(); alert(isFrench ? 'Achats restaurés avec succès' : 'Purchases restored'); }
                                            catch { alert(isFrench ? 'Échec de la restauration' : 'Failed to restore purchases'); }
                                        }}
                                        className="w-full py-3 rounded-2xl bg-white/[0.05] text-white text-sm font-medium hover:bg-white/[0.08] transition-colors"
                                    >
                                        {isFrench ? 'Restaurer les achats' : 'Restore purchases'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Stats grid */}
                <section className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onNavigate?.('library')}
                        className="rounded-[28px] bg-[linear-gradient(135deg,rgba(0,145,255,0.05),rgba(0,0,0,0.8))] border border-[#0091FF]/15 p-5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-[#0091FF]/30 transition-all"
                    >
                        <BookImage className="w-6 h-6 text-[#0091FF] mb-4" />
                        <p className="text-4xl font-black tracking-[-0.04em] text-white">{libraryCount}</p>
                        <p className="text-white/30 text-[11px] font-bold uppercase tracking-[0.18em] mt-2">{t('nav_library') || 'Designs'}</p>
                    </button>

                    <button
                        onClick={() => setShowOnboarding(true)}
                        className="rounded-[28px] bg-[linear-gradient(135deg,rgba(138,43,226,0.05),rgba(0,0,0,0.8))] border border-[#0055FF]/15 p-5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-[#0055FF]/30 transition-all"
                    >
                        <BookOpen className="w-6 h-6 text-[#0055FF] mb-4" />
                        <p className="text-white text-base font-bold leading-tight">{isFrench ? 'Revoir le tutoriel' : 'View tutorial'}</p>
                        <p className="text-white/30 text-[11px] mt-2 leading-relaxed">{isFrench ? 'Reprenez le flow.' : 'Replay the flow.'}</p>
                    </button>
                </section>

                {/* Admin button */}
                {user.email === ADMIN_EMAIL && (
                    <button
                        onClick={() => onNavigate?.('analytics')}
                        className="w-full rounded-[28px] bg-[linear-gradient(135deg,rgba(0,145,255,0.08),rgba(0,85,255,0.04))] border border-[#0091FF]/20 px-6 py-5 flex items-center gap-4 hover:border-[#0091FF]/40 hover:bg-[rgba(0,145,255,0.12)] transition-all shadow-[0_8px_30px_rgba(0,145,255,0.06)] group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-[#0091FF]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0091FF]/25 transition-colors">
                            <LayoutDashboard className="w-5 h-5 text-[#0091FF]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-bold text-sm">Dashboard Admin</p>
                            <p className="text-neutral-500 text-xs mt-0.5">{isFrench ? 'Stats, utilisateurs & actions' : 'Stats, users & actions'}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#0091FF]/50 group-hover:text-[#0091FF] group-hover:translate-x-0.5 transition-all" />
                    </button>
                )}

                {/* Account settings */}
                <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(12,12,12,0.98),rgba(5,5,5,0.99))] border border-white/8 shadow-[0_22px_60px_rgba(0,0,0,0.3)] overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5">
                        <h3 className="text-white text-lg font-black tracking-[-0.02em]">{isFrench ? 'Compte & préférences' : 'Account & preferences'}</h3>
                    </div>

                    <div className="divide-y divide-white/5">
                        {/* Language */}
                        <div className="px-6 py-5 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-neutral-400" />
                                <p className="text-white font-bold">{t('profile_language') || 'Langue'}</p>
                            </div>
                            <div className="flex gap-2 bg-black/30 rounded-full p-1 w-fit border border-white/8">
                                <button onClick={() => setLanguage('fr')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${language === 'fr' ? 'bg-[linear-gradient(135deg,#0091FF,#0055FF)] text-black' : 'text-white/40 hover:text-white'}`}>Français</button>
                                <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${language === 'en' ? 'bg-[linear-gradient(135deg,#0091FF,#0055FF)] text-black' : 'text-white/40 hover:text-white'}`}>English</button>
                            </div>
                        </div>

                        {/* Subscription */}
                        <div className="px-6 py-5 flex flex-col gap-4">
                            <div>
                                <p className="text-white font-semibold flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-neutral-400" />
                                    {isFrench ? 'Abonnement' : 'Subscription'}
                                </p>
                                <p className="text-neutral-500 text-sm mt-1">
                                    {isFrench ? 'Gérez votre abonnement depuis cet écran.' : 'Manage your subscription from this screen.'}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {isNative && isEntitled && (
                                    <button
                                        onClick={async () => {
                                            try { await restorePurchases(); alert(isFrench ? 'Achats restaurés avec succès' : 'Purchases restored'); }
                                            catch { alert(isFrench ? 'Échec de la restauration' : 'Failed to restore purchases'); }
                                        }}
                                        className="w-full py-3 rounded-2xl bg-white/[0.05] text-white text-sm font-medium hover:bg-white/[0.08] transition-colors"
                                    >
                                        {isFrench ? 'Restaurer les achats' : 'Restore purchases'}
                                    </button>
                                )}
                                <button
                                    onClick={isEntitled ? handleManageSubscription : () => setIsModalOpen(true)}
                                    disabled={portalLoading}
                                    className="w-full py-3 rounded-2xl bg-[linear-gradient(135deg,#0091FF,#0055FF)] text-black text-sm font-black hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_8px_24px_rgba(0,145,255,0.1)] flex items-center justify-center gap-2"
                                >
                                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {portalLoading ? (isFrench ? 'Ouverture…' : 'Opening…') : isEntitled ? (isFrench ? 'Gérer mon abonnement' : 'Manage subscription') : (isFrench ? 'Passer Pro' : 'Go Pro')}
                                </button>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="px-6 py-5 flex flex-col gap-4">
                            <div>
                                <p className="text-white font-semibold">{isFrench ? 'Sécurité' : 'Security'}</p>
                                <p className="text-neutral-500 text-sm mt-1">{isFrench ? 'Recevez un email pour réinitialiser votre mot de passe.' : 'Receive an email to reset your password.'}</p>
                            </div>
                            <button
                                onClick={handleResetPassword}
                                disabled={resetSent}
                                className={`w-full py-3 rounded-2xl text-sm font-medium transition-colors ${resetSent ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.05] text-white hover:bg-white/[0.08]'}`}
                            >
                                {resetSent ? (isFrench ? 'Email envoyé ✓' : 'Email sent ✓') : (isFrench ? 'Réinitialiser le mot de passe' : 'Reset password')}
                            </button>
                        </div>

                        {/* Account deletion */}
                        <div className="px-6 py-5 flex flex-col gap-4">
                            <div>
                                <p className="text-amber-300 font-semibold">{isFrench ? 'Suppression du compte' : 'Account deletion'}</p>
                                <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
                                    {isFrench
                                        ? "Suppression définitive du compte et des données associées."
                                        : 'Permanently delete your account and associated data.'}
                                </p>
                            </div>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="w-full py-3 rounded-2xl bg-amber-500/12 text-amber-300 text-sm font-semibold hover:bg-amber-500/18 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {isFrench ? 'Supprimer mon compte' : 'Delete my account'}
                            </button>
                        </div>

                        {/* Logout */}
                        <div className="px-6 py-5 flex flex-col gap-4">
                            <div>
                                <p className="text-red-400 font-semibold flex items-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    {t('profile_logout') || 'Déconnexion'}
                                </p>
                                <p className="text-neutral-500 text-sm mt-1">{isFrench ? 'Fermez votre session sur cet appareil.' : 'Sign out from this device.'}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full py-3 rounded-2xl bg-red-500/12 text-red-300 text-sm font-semibold hover:bg-red-500/18 transition-colors"
                            >
                                {isFrench ? 'Quitter' : 'Sign out'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-2 pb-2 text-center">
                    <div className="flex items-center justify-center gap-4 text-xs text-neutral-600 mb-4 flex-wrap">
                        <button onClick={() => onNavigate?.('legal')} className="hover:text-neutral-300 transition-colors">CGU & Mentions Légales</button>
                        <button onClick={() => onNavigate?.('support')} className="hover:text-neutral-300 transition-colors">Contact Support</button>
                        <button onClick={() => openExternalUrl(PRIVACY_POLICY_URL)} className="hover:text-neutral-300 transition-colors">Privacy Policy</button>
                        <button onClick={() => openExternalUrl(TERMS_OF_USE_URL)} className="hover:text-neutral-300 transition-colors">Terms of Use</button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-neutral-600/70 mb-1">
                        <Info className="w-3 h-3" />
                        <span className="text-[10px] uppercase tracking-[0.18em]">Tattoo Vision V1.2</span>
                    </div>
                    <p className="text-[10px] text-neutral-700 max-w-sm mx-auto leading-relaxed">
                        {isFrench
                            ? 'Abonnements gérés et sécurisés par Stripe.'
                            : 'Subscriptions managed and secured by Stripe.'}
                    </p>
                </footer>
            </div>

            {isModalOpen && <PlanPricingModal onClose={() => setIsModalOpen(false)} />}
            {showCreditPackModal && <CreditPackModal onClose={() => setShowCreditPackModal(false)} />}
            {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
        </div>
    );
}
