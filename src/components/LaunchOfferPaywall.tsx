import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Zap, Loader2, Sparkles, Lock, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { track, trackPaywallCTAClicked, trackPurchaseInitiated, trackPurchaseCompleted, trackPurchaseFailed } from '../lib/analytics';

interface LaunchOfferPaywallProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function LaunchOfferPaywall({ onClose, onSuccess }: LaunchOfferPaywallProps) {
    const { isNative, packages: nativePackages, purchasePackage } = usePayments();
    const { refreshPurchaseStatus, refreshCredits, user } = useAuth();
    const { t } = useLanguage();

    const [loading, setLoading] = useState<'weekly' | 'lifetime' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHesitation, setShowHesitation] = useState(false);

    // Hesitation trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowHesitation(true);
        }, 8000); // 8 seconds
        return () => clearTimeout(timer);
    }, []);

    // Also track paywall_viewed on mount
    useEffect(() => {
        // Log custom event if needed
        if (user) {
            track('paywall_viewed', { paywall_type: 'result_paywall' });
        }
    }, [user]);

    const handlePurchase = async (type: 'weekly' | 'lifetime') => {
        try {
            setLoading(type);
            setError(null);

            // Trigger micro vibration
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }

            const packId = type === 'weekly' ? 'launch_weekly_trial' : 'launch_lifetime';
            const price = type === 'weekly' ? 6.99 : 14.99;
            const creditsGranted = type === 'weekly' ? 2500 : 5000000; // 5 renders max during trial, basically infinite for lifetime!

            trackPaywallCTAClicked(packId, price, creditsGranted);

            if (isNative) {
                trackPurchaseInitiated(packId, price, creditsGranted);
                const nativePkg = nativePackages?.find(p => p.identifier.includes(packId) || p.product.identifier.includes(packId));
                if (nativePkg) {
                    const { success } = await purchasePackage(nativePkg);
                    if (success) {
                        trackPurchaseCompleted(packId, price, creditsGranted);

                        if (user) {
                            track(type === 'weekly' ? 'trial_started' : 'lifetime_purchased');
                        }

                        await refreshPurchaseStatus();
                        await refreshCredits(); // Ensure credits are updated before proceeding!
                        onSuccess();
                    } else {
                        trackPurchaseFailed(packId, 'Native purchase returned false');
                    }
                } else {
                    setError('Produit non trouvé sur le store. Veuillez configurer RevenueCat.');
                    trackPurchaseFailed(packId, 'Product not found');
                }
            } else {
                const { invokeWithAuth } = await import('../lib/invokeWithAuth');
                // Track backend
                const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                    body: {
                        plan: packId, // Make sure your stripe has this ID or modify it
                        isConsumable: false,
                        amount: price * 100,
                        credits: creditsGranted,
                        returnUrl: `${window.location.origin}${window.location.pathname}`
                    },
                });
                if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');
                const responseData = data as any;
                if (responseData?.url) {
                    trackPurchaseInitiated(packId, price, creditsGranted);

                    if (user) {
                        track(type === 'weekly' ? 'trial_started' : 'lifetime_purchased');
                    }

                    window.location.href = responseData.url;
                } else {
                    setError('Service de paiement temporairement indisponible.');
                }
            }
        } catch (err: any) {
            trackPurchaseFailed(type, err.message || 'Unknown error');
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(null);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 isolate font-sans">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

            <motion.div
                initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="relative w-full max-w-md bg-[#0a0a0a] rounded-t-[32px] md:rounded-[32px] border-t md:border border-[#ffffff15] shadow-[0_-20px_60px_-15px_rgba(0,145,255,0.2)] flex flex-col pt-8 pb-10 px-6 overflow-hidden md:max-h-[90vh] md:overflow-y-auto"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 rounded-b-full bg-gradient-to-r from-[#0091FF] to-[#00DC82] opacity-100" />

                <button onClick={onClose} className="absolute top-5 right-5 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors z-10">
                    <X className="w-4 h-4" />
                </button>

                {/* Hesitation Popup */}
                <AnimatePresence>
                    {showHesitation && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] bg-gradient-to-r from-amber-500 to-orange-600 p-1 rounded-2xl z-20 shadow-2xl"
                        >
                            <div className="bg-[#111] px-4 py-3 rounded-xl flex items-center justify-between">
                                <span className="text-white text-xs font-bold leading-tight flex-1">
                                    Wait — Get <span className="text-amber-400">50% extra renders</span> if you start now.
                                </span>
                                <Zap className="w-5 h-5 text-amber-400 animate-pulse ml-2" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Section */}
                <div className="text-center mt-2 mb-6">
                    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Launch discount ends soon
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2 uppercase">
                        LIMITED LAUNCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0091FF] to-[#00DC82]">OFFER</span>
                    </h1>
                </div>

                {/* Main Highlight Card */}
                <div className="relative p-1 rounded-3xl bg-gradient-to-b from-[#ffffff10] to-transparent mb-6">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0091FF] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,145,255,0.4)]">
                        80% OFF TODAY
                    </div>

                    <div className="bg-[#111] rounded-[22px] p-6 pt-8 border border-white/5 relative overflow-hidden text-center flex flex-col items-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0091FF]/10 blur-[50px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00DC82]/10 blur-[50px] rounded-full" />

                        <div className="text-neutral-500 line-through font-medium text-lg mb-1">9,99€</div>
                        <div className="text-4xl font-black text-white mb-2 tracking-tight">3 DAYS FREE</div>
                        <div className="text-[#00DC82] font-semibold text-sm mb-4">Then 6,99€ / week</div>

                        <div className="flex flex-col gap-2 w-full mt-2 hidden">
                            {/* Decorative features text inside card removed to clean it up */}
                        </div>

                        {/* CTA Primary */}
                        <div className="w-full relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#0091FF] to-[#00DC82] rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse-glow"></div>
                            <button
                                onClick={() => handlePurchase('weekly')}
                                disabled={loading !== null}
                                className="relative w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-wide shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-70 active:scale-[0.98]"
                            >
                                {loading === 'weekly' ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-black" />
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            Start Free Trial <ChevronRight className="w-5 h-5 -ml-1 text-black" />
                                        </div>
                                        <span className="text-[9px] font-bold text-black/60 tracking-widest">Cancel anytime</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Features Checklist */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 px-2 mb-6">
                    {['Ultra-realistic renders', 'Watermark removal', 'High priority queue', 'HD Exports'].map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-neutral-300">
                            <div className="w-4 h-4 rounded-full bg-[#00DC82]/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-[#00DC82]" />
                            </div>
                            {t}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-4 text-center text-red-400 text-[10px] font-bold uppercase tracking-widest px-4">{error}</div>}

                {/* Secondary Option */}
                <div className="mt-auto">
                    <button
                        onClick={() => handlePurchase('lifetime')}
                        disabled={loading !== null}
                        className="w-full py-3.5 px-4 bg-[#1a1a1a] border border-white/5 hover:border-white/20 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-neutral-400" />
                            </div>
                            <div className="text-left leading-tight">
                                <div className="uppercase tracking-widest text-[10px] text-neutral-400">One-time payment</div>
                                <div>Lifetime Unlock</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-lg">14,99€</span>
                            {loading === 'lifetime' ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-600" />}
                        </div>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] text-neutral-600 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Secure Payment — Auto-renewable unless cancelled
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
