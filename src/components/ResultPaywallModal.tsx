import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '../config/credits';
import { trackPaywallCTAClicked, trackPurchaseInitiated, trackPurchaseCompleted, trackPurchaseFailed } from '../lib/analytics';

interface ResultPaywallModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResultPaywallModal({ onClose, onSuccess }: ResultPaywallModalProps) {
    const { isNative, packages: nativePackages, purchasePackage } = usePayments();
    const { refreshPurchaseStatus } = useAuth();



    const proplan = SUBSCRIPTION_PLANS.find(p => p.id === 'pro')!;
    const plusPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'plus')!;

    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(599);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSubscribe = async (plan: typeof proplan) => {
        try {
            setLoading(plan.id);
            setError(null);

            trackPaywallCTAClicked(plan.id, plan.price, plan.creditsPerMonth);

            const nativePkg = isNative
                ? nativePackages?.find(p => p.identifier.includes(plan.id) || p.product.identifier.includes(plan.id))
                : undefined;

            if (isNative && nativePkg) {
                trackPurchaseInitiated(plan.id, plan.price, plan.creditsPerMonth);
                const { success } = await purchasePackage(nativePkg);
                if (success) {
                    trackPurchaseCompleted(plan.id, plan.price, plan.creditsPerMonth);
                    await refreshPurchaseStatus();
                    onSuccess();
                } else {
                    trackPurchaseFailed(plan.id, 'Native purchase returned false');
                }
            } else {
                const { invokeWithAuth } = await import('../lib/invokeWithAuth');
                const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                    body: {
                        plan: plan.stripeId,
                        returnUrl: `${window.location.origin}${window.location.pathname}`
                    },
                });
                if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');
                const responseData = data as any;
                if (responseData?.url) {
                    trackPurchaseInitiated(plan.id, plan.price, plan.creditsPerMonth);
                    window.location.href = responseData.url;
                } else {
                    setError('Service de paiement temporairement indisponible.');
                }
            }
        } catch (err: any) {
            trackPurchaseFailed(plan.id, err.message || 'Unknown error');
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(null);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 isolate">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

            <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative z-10 w-full max-w-md bg-[#0a0a0a] rounded-t-[32px] md:rounded-[32px] border border-[#0091FF]/20 shadow-[0_0_80px_rgba(0,145,255,0.12)] flex flex-col pt-8 pb-10 px-6 overflow-hidden"
            >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0091FF] via-[#00DC82] to-[#0091FF] opacity-80" />

                <button onClick={onClose} className="absolute top-5 right-5 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors z-10">
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-6 mt-2 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0091FF]/10 border border-[#0091FF]/30 text-[#0091FF] text-xs font-black uppercase tracking-widest mb-4">
                        <Lock className="w-3.5 h-3.5" />
                        Rendu prêt · Débloquez-le
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase italic">
                        VOTRE TATOUAGE<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0091FF] to-[#00DC82]">VOUS ATTEND</span>
                    </h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mt-2 font-medium">
                        Abonnez-vous pour accéder à vos rendus sans watermark, en HD.
                    </p>
                </div>

                {/* Urgency timer */}
                <div className="flex items-center justify-center gap-2 mb-5 px-4 py-2.5 bg-white/3 border border-white/8 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0091FF] animate-pulse" />
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                        Rendu disponible encore <span className="text-white">{formatTime(timeLeft)}</span>
                    </span>
                </div>

                {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-xs font-bold tracking-wide">{error}</div>}

                {/* Plans CTAs */}
                <div className="space-y-3 relative z-10">
                    {/* Primary: Pro plan */}
                    <button
                        onClick={() => handleSubscribe(proplan)}
                        disabled={loading !== null}
                        className="w-full py-4 rounded-[20px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 disabled:opacity-50 active:scale-[0.98] relative overflow-hidden border border-[#00DC82]/40"
                        style={{ background: 'linear-gradient(135deg, #0091FF, #00DC82)' }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="relative z-10 flex items-center gap-2 text-black text-sm">
                            {loading === proplan.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <>✨ Plan Pro — {proplan.creditsPerMonth / 500} rendus/sem.</>}
                        </span>
                        <span className="relative z-10 text-[10px] text-black/70 font-bold bg-black/10 px-3 py-0.5 rounded-full">
                            {proplan.priceLabel} · Annulable à tout moment
                        </span>
                    </button>

                    <div className="flex items-center gap-3 w-full">
                        <div className="h-[1px] bg-white/8 flex-1" />
                        <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">ou</span>
                        <div className="h-[1px] bg-white/8 flex-1" />
                    </div>

                    {/* Secondary: Plus plan */}
                    <button
                        onClick={() => handleSubscribe(plusPlan)}
                        disabled={loading !== null}
                        className="w-full py-3.5 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 hover:bg-white/8 rounded-[16px] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading === plusPlan.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>Plan Plus — {plusPlan.creditsPerMonth / 500} rendus/sem. <span className="text-[#0091FF]">({plusPlan.priceLabel})</span></>
                        )}
                    </button>

                    <p className="text-center text-neutral-600 text-[9px] uppercase font-black tracking-widest mt-1 opacity-60">
                        Paiement 100% Sécurisé · Stripe
                    </p>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
