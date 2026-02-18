import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { usePayments } from '../hooks/usePayments';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { VP_PACKS } from '../config/credits';

interface PlanPricingModalProps {
    onClose: () => void;
}

export default function PlanPricingModal({ onClose }: PlanPricingModalProps) {
    const { isNative, packages: nativePackages, purchasePackage } = usePayments();
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
    const packs = VP_PACKS;

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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-neutral-950/98 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 z-[1001]"
            >
                <div className="absolute inset-0" onClick={onClose} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                    className="relative bg-neutral-900 md:rounded-[2.5rem] border-t md:border border-white/10 shadow-[0_32px_128px_rgba(0,0,0,0.8)] w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 md:p-12 md:pb-8 flex flex-col items-center relative text-center">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 md:top-8 md:right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white group active:scale-90"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-[#0091FF]/10 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,145,255,0.2)]">
                            <Zap className="w-8 h-8 text-[#0091FF]" />
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">
                            Booster votre <span className="text-[#0091FF]">Vision</span>
                        </h2>
                        <p className="text-neutral-400 text-sm md:text-lg max-w-lg font-light leading-relaxed">
                            Choisissez le pack qui vous convient pour tester vos tatouages avec précision.
                        </p>
                    </div>

                    {/* error display */}
                    {error && (
                        <div className="mx-8 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Packs Grid */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-12 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6 max-w-sm md:max-w-none mx-auto lg:mx-0">
                            {packs.map((pack, index) => {
                                const nativePkg = isNative ? getNativePackage(pack.identifier) : undefined;
                                const displayPrice = isNative && nativePkg
                                    ? nativePkg.product.priceString
                                    : `${pack.price}€`;

                                const isAvailable = isNative ? !!nativePkg : true;

                                return (
                                    <motion.div
                                        key={pack.id}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                                        className={`group relative flex flex-col p-8 rounded-[2rem] border transition-all duration-500 mx-auto w-full ${pack.popular
                                            ? 'bg-neutral-800/50 border-[#0091FF] shadow-[0_20px_60px_rgba(0,145,255,0.15)] ring-1 ring-[#0091FF]/50 md:scale-[1.05] z-10'
                                            : 'bg-neutral-950/30 border-white/5 hover:border-white/10 hover:bg-neutral-800/30'
                                            }`}
                                    >
                                        {pack.popular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#0091FF] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl z-20 whitespace-nowrap">
                                                Le Plus Choisi
                                            </div>
                                        )}

                                        <div className="text-center mb-8">
                                            <div className="text-[10px] font-black text-[#0091FF] mb-3 uppercase tracking-[0.2em]">{pack.name}</div>
                                            <div className="flex items-baseline justify-center gap-1 mb-1">
                                                <span className="text-4xl md:text-5xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500">
                                                    {pack.credits.toLocaleString()}
                                                </span>
                                                <span className="text-[#0091FF] font-black text-sm">VP</span>
                                            </div>
                                            <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Vision Points</div>
                                        </div>

                                        <div className="flex-1 space-y-4 mb-8">
                                            <div className="h-px bg-white/5 w-full" />
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-neutral-400">Générations IA</span>
                                                    <span className="text-white font-black bg-white/5 py-1 px-2 rounded-lg">~{Math.floor(pack.credits / 200)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-neutral-400">Rendus Réalistes</span>
                                                    <span className="text-white font-black bg-white/5 py-1 px-2 rounded-lg">~{Math.floor(pack.credits / 500)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => isNative && nativePkg ? handleNativePurchase(nativePkg) : handlePurchase(pack.id, pack.price, pack.credits)}
                                            disabled={loading !== null || (!isAvailable && isNative)}
                                            className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center text-center px-4 ${pack.popular
                                                ? 'bg-[#0091FF] text-white shadow-lg shadow-blue-600/30 hover:bg-[#007AFF] hover:shadow-blue-600/50'
                                                : 'bg-white text-neutral-950 hover:bg-neutral-200'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <span className="w-full text-center">
                                                {loading === (isNative && nativePkg ? nativePkg.identifier : pack.id) ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                                ) : (
                                                    !isAvailable && isNative ? 'Indisponible' : displayPrice
                                                )}
                                            </span>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-12 text-center text-neutral-500 text-[10px] uppercase font-bold tracking-[0.25em] max-w-sm mx-auto leading-relaxed">
                            <p>Paiement unique sécurisé. <br />Les Points n'expirent jamais.</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
