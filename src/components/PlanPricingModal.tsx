import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { usePayments } from '../hooks/usePayments';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { VP_PACKS } from '../config/credits';
import { useLanguage } from '../contexts/LanguageContext';

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

    const packs = VP_PACKS as any[];

    const handlePurchase = async (packId: string, price: number, credits: number, stripeId?: string) => {
        try {
            setLoading(packId);
            setError(null);

            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: {
                    plan: stripeId || packId,
                    isConsumable: true,
                    amount: price * 100,
                    credits: credits,
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

    const handleNativePurchase = async (rcPackage: PurchasesPackage) => {
        try {
            setLoading(rcPackage.identifier);
            setError(null);
            const { success, userCancelled } = await purchasePackage(rcPackage);
            if (success) onClose();
        } catch (err: any) {
            setError(err.message || 'Erreur d\'achat');
        } finally {
            setLoading(null);
        }
    };

    const getNativePackage = (packId: string) => {
        if (!nativePackages) return undefined;
        return nativePackages.find(p => p.identifier.includes(packId) || p.product.identifier.includes(packId));
    };

    const modalContent = (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 isolate">
            {/* Fixed Backdrop - Direct CSS to avoid any interference */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Floating Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 30 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Interior Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#0091FF]/10 blur-[80px] pointer-events-none" />

                {/* Compact Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-8 p-3 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-all z-50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="relative px-8 pt-12 pb-6 text-center border-b border-white/5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0091FF]/10 rounded-full border border-[#0091FF]/20 text-[#0091FF] text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3 h-3" />
                        Store Officiel
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
                        VISION <span className="text-[#0091FF] not-italic">POINTS</span>
                    </h2>
                    <p className="text-neutral-500 text-[11px] font-bold uppercase tracking-[0.1em] max-w-[280px] mx-auto opacity-70">
                        {t('pricing_subtitle') || 'Débloquez toutes les fonctionnalités IA'}
                    </p>
                </div>

                {/* Packs List - High Performance Scrolling */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    {packs.map((pack, index) => {
                        const nativePkg = isNative ? getNativePackage(pack.identifier) : undefined;
                        const displayPrice = isNative && nativePkg
                            ? nativePkg.product.priceString
                            : `${pack.price}€`;

                        const isAvailable = isNative ? !!nativePkg : true;

                        return (
                            <motion.div
                                key={pack.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                className={`group relative flex items-center justify-between p-5 rounded-[32px] border-2 transition-all active:scale-[0.97] ${pack.popular
                                    ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-[#0091FF] shadow-[0_12px_40px_rgba(0,145,255,0.15)]'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.06]'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full ${pack.popular ? 'bg-[#0091FF] text-white' : 'bg-white/10 text-neutral-500'}`}>
                                            {pack.name}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-white tracking-tighter italic">{pack.credits.toLocaleString()}</span>
                                        <span className="text-[#0091FF] font-black text-xs">VP</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => isNative && nativePkg ? handleNativePurchase(nativePkg) : handlePurchase(pack.id, pack.price, pack.credits, pack.stripeId)}
                                    disabled={loading !== null || (!isAvailable && isNative)}
                                    className={`px-7 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${pack.popular
                                        ? 'bg-white text-black shadow-lg shadow-white/10'
                                        : 'bg-white text-black hover:bg-neutral-200'
                                        } disabled:opacity-50 min-w-[100px]`}
                                >
                                    {loading === (isNative && nativePkg ? nativePkg.identifier : pack.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : (
                                        displayPrice
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Trust Footer */}
                <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5">
                    <div className="flex items-center justify-center gap-6 mb-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-neutral-500 uppercase tracking-widest opacity-60">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Sécurisé
                        </div>
                        <div className="w-1.5 h-1.5 bg-neutral-800 rounded-full" />
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-neutral-500 uppercase tracking-widest opacity-60">
                            <Zap className="w-3.5 h-3.5" />
                            Instantané
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-neutral-600 font-bold uppercase tracking-widest">
                        {t('pricing_no_expiry') || 'Les points n\'expirent jamais'}
                    </p>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
