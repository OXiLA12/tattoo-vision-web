import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Zap } from 'lucide-react';
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

        // Prevent infinite loop: check if we already processed this
        const alreadyProcessed = sessionStorage.getItem('payment_processed');

        if (hasSuccess && !alreadyProcessed) {
            sessionStorage.setItem('payment_processed', 'true');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Reload once to refresh credits
            setTimeout(() => {
                sessionStorage.removeItem('payment_processed');
                window.location.reload();
            }, 100);
        }

        if (hasCanceled) {
            setError("Payment was canceled. Please try again.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Filter packs if needed, or use all from config
    const packs = VP_PACKS as any[];

    const handlePurchase = async (packId: string, price: number, credits: number) => {
        try {
            setLoading(packId);
            setError(null);

            // Web Checkout (Stripe)
            // We pass the packId and price to the backend to create a checkout session
            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: {
                    plan: packId, // Using 'plan' param for backward compatibility or update backend to accept 'packId'
                    isConsumable: true,
                    amount: price * 100, // Amount in cents if dynamic, or backend lookup
                    credits: credits,
                    returnUrl: `${window.location.origin}${window.location.pathname}`
                },
            });

            if (invokeError) {
                console.error("invoke error", invokeError);
                throw new Error(invokeError.message || 'Failed to connect to checkout service');
            }

            const responseData = data as any;
            if (responseData?.error) throw new Error(responseData.error);

            if (responseData?.url) {
                window.location.href = responseData.url;
            } else {
                setError("Payment gateway integration in progress. Contact support to purchase manually.");
            }

        } catch (err) {
            console.error('Purchase error:', err);
            setError(err instanceof Error ? err.message : 'Failed to initiate purchase');
        } finally {
            setLoading(null);
        }
    };

    const handleNativePurchase = async (rcPackage: PurchasesPackage) => {
        try {
            setLoading(rcPackage.identifier);
            setError(null);

            const { success, userCancelled } = await purchasePackage(rcPackage);

            if (success) {
                alert("Purchase successful! Your Vision Points will be added shortly.");
                onClose();
            } else if (!userCancelled) {
                throw new Error("Purchase failed");
            }
        } catch (err: any) {
            console.error('Native Purchase error:', err);
            setError(err.message || 'Failed to complete purchase');
        } finally {
            setLoading(null);
        }
    };

    // Helper to find matching native package
    // We expect RC packages to have identifiers matching our pack IDs or similar logic
    const getNativePackage = (packId: string) => {
        if (!nativePackages) return undefined;
        // Logic: look for package identifier containing the pack ID (e.g. "com.tattoovision.vp.3000")
        // Or simply mapped by index/name if strictly defined
        return nativePackages.find(p => p.identifier.includes(packId) || p.product.identifier.includes(packId));
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Glass Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[42px] shadow-[0_32px_84px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Visual Accent - Top Beam */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#0091FF] to-transparent opacity-50" />

                {/* Header Section */}
                <div className="relative px-8 pt-10 pb-6 text-center border-b border-white/5">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0091FF]/10 rounded-full border border-[#0091FF]/20 text-[#0091FF] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Zap className="w-3 h-3" />
                        Pack Sélection
                    </div>

                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2 italic">
                        VISION <span className="text-[#0091FF] not-italic">POINTS</span>
                    </h2>
                    <p className="text-neutral-500 text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed max-w-[260px] mx-auto opacity-80">
                        {t('pricing_subtitle') || 'Choisissez votre puissance créative'}
                    </p>
                </div>

                {/* Packs Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4 custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-bold uppercase tracking-widest text-center flex items-center gap-2 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {packs.map((pack: any, index: number) => {
                        const nativePkg = isNative ? getNativePackage(pack.identifier) : undefined;
                        const displayPrice = isNative && nativePkg
                            ? nativePkg.product.priceString
                            : `${pack.price}€`;

                        const isAvailable = isNative ? !!nativePkg : true;

                        return (
                            <motion.div
                                key={pack.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group relative flex items-center justify-between p-5 rounded-[28px] border-2 transition-all active:scale-[0.98] ${pack.popular
                                    ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-[#0091FF] shadow-[0_12px_32px_rgba(0,145,255,0.15)]'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${pack.popular ? 'bg-[#0091FF] text-white' : 'bg-white/10 text-neutral-500'}`}>
                                            {pack.name}
                                        </span>
                                        {pack.popular && (
                                            <span className="text-[8px] font-black text-[#0091FF] uppercase tracking-widest">Recommandé</span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-white tracking-tighter italic">{pack.credits.toLocaleString()}</span>
                                        <span className="text-[#0091FF] font-black text-xs">VP</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 opacity-60">
                                        ~{Math.floor(pack.credits / 200)} Rendus Réalistes
                                    </div>
                                </div>

                                <button
                                    onClick={() => isNative && nativePkg ? handleNativePurchase(nativePkg) : handlePurchase(pack.id, pack.price, pack.credits)}
                                    disabled={loading !== null || (!isAvailable && isNative)}
                                    className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all ${pack.popular
                                        ? 'bg-[#0091FF] text-white shadow-lg shadow-blue-500/20'
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

                {/* Footer Info */}
                <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 text-center">
                    <div className="flex items-center justify-center gap-4 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1 opacity-60">
                        <span>Paiement Sécurisé</span>
                        <div className="w-1 h-1 bg-neutral-700 rounded-full" />
                        <span>Support 24/7</span>
                    </div>
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                        {t('pricing_no_expiry') || 'Les points n\'expirent jamais'}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
