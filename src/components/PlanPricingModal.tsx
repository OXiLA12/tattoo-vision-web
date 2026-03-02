import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { usePayments } from '../hooks/usePayments';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { SUBSCRIPTION_PLANS } from '../config/credits';
import { useLanguage } from '../contexts/LanguageContext';
import { tiktokPixel } from '../utils/tiktokPixel';

interface PlanPricingModalProps {
    onClose: () => void;
}

export default function PlanPricingModal({ onClose }: PlanPricingModalProps) {
    const { isNative, packages: nativePackages, purchasePackage } = usePayments();
    const { t } = useLanguage();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check for success/canceled params from Stripe redirect
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const hasSuccess = query.get('success');
        const hasCanceled = query.get('canceled');
        const alreadyProcessed = sessionStorage.getItem('payment_processed');

        if (hasSuccess && !alreadyProcessed) {
            sessionStorage.setItem('payment_processed', 'true');
            // Hard to know the exact plan price here without saving it, but we can send a default or 0 if unknown
            // Let's do a generic purchase event
            tiktokPixel.purchase(6.99, 'EUR', 'subscription', 'plan');
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
                sessionStorage.removeItem('payment_processed');
                window.location.reload();
            }, 100);
        }

        if (hasCanceled) {
            setError("L'achat a été annulé.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleSubscribe = async (planId: string) => {
        try {
            setLoading(planId);
            setError(null);

            if (isNative) {
                const nativePkg = nativePackages?.find(
                    p => p.identifier.includes(planId) || p.product.identifier.includes(planId)
                );
                if (nativePkg) {
                    const { success } = await purchasePackage(nativePkg);
                    if (success) onClose();
                    return;
                }
            }

            // Find the plan price for tracking
            const planObject = SUBSCRIPTION_PLANS.find(p => p.id === planId);
            if (planObject) {
                tiktokPixel.initiateCheckout({
                    value: planObject.price,
                    currency: 'EUR',
                    content_id: planId
                });
            }

            // Web: Stripe Checkout
            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: {
                    plan: planId,
                    returnUrl: `${window.location.origin}${window.location.pathname}`
                },
            });

            if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');

            const responseData = data as any;
            if (responseData?.url) {
                window.location.href = responseData.url;
            } else {
                setError("Service de paiement temporairement indisponible.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setLoading(null);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 isolate">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 28, stiffness: 380 }}
                className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#0091FF]/8 blur-[100px] pointer-events-none" />

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-all z-50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="relative px-8 pt-10 pb-6 text-center border-b border-white/5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0091FF]/10 rounded-full border border-[#0091FF]/20 text-[#0091FF] text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3 h-3" />
                        Tattoo Vision Premium
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2 italic">
                        CHOISISSEZ VOTRE <span className="text-[#0091FF] not-italic">PLAN</span>
                    </h2>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
                        Rendus réalistes • Sans watermark • Annulable à tout moment
                    </p>
                </div>

                {/* Plans */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    {SUBSCRIPTION_PLANS.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + index * 0.07 }}
                            className={`relative rounded-[28px] border-2 overflow-hidden transition-all ${plan.popular
                                ? 'border-[#00DC82] shadow-[0_8px_32px_rgba(0,220,130,0.12)]'
                                : 'border-white/8 hover:border-white/15'
                                }`}
                            style={plan.popular ? { background: 'linear-gradient(135deg, #111 0%, #0a1a10 100%)' } : { background: 'rgba(255,255,255,0.025)' }}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />
                            )}
                            {plan.popular && (
                                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-black" style={{ background: plan.color }}>
                                    Populaire
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className="text-[9px] font-black tracking-[0.2em] uppercase mb-1 block" style={{ color: plan.color }}>
                                            Plan
                                        </span>
                                        <h3 className="text-2xl font-black text-white tracking-tight">{plan.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-white">{plan.price.toFixed(2).replace('.', ',')}€</span>
                                        <span className="block text-[10px] text-neutral-500 font-bold">{plan.billingLabel}</span>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 mb-5">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-sm text-neutral-300 font-medium">
                                            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
                                                <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={loading !== null}
                                    className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98] hover:opacity-90"
                                    style={plan.popular
                                        ? { background: `linear-gradient(135deg, ${plan.color}, #0091FF)`, color: '#000' }
                                        : { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
                                    }
                                >
                                    {loading === plan.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : (
                                        `Commencer avec ${plan.name}`
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-white/[0.02] border-t border-white/5">
                    <div className="flex items-center justify-center gap-6 mb-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Paiement sécurisé
                        </div>
                        <div className="w-1 h-1 bg-neutral-700 rounded-full" />
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                            <Zap className="w-3.5 h-3.5" />
                            Annulable à tout moment
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-neutral-600 font-bold uppercase tracking-widest">
                        Abonnement auto-renouvelable · Gérez depuis votre profil
                    </p>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
