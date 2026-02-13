import { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, Sparkles, Zap, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { useAuth } from '../contexts/AuthContext';
import { usePayments } from '../hooks/usePayments';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { VP_PACKS } from '../config/credits';

interface PlanPricingModalProps {
    onClose: () => void;
}

export default function PlanPricingModal({ onClose }: PlanPricingModalProps) {
    const { profile } = useAuth();
    const { isNative, packages: nativePackages, purchasePackage } = usePayments();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Check for success/canceled params from Stripe redirect
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const hasSuccess = query.get('success');
        const hasCanceled = query.get('canceled');

        // Prevent infinite loop: check if we already processed this
        const alreadyProcessed = sessionStorage.getItem('payment_processed');

        if (hasSuccess && !alreadyProcessed) {
            sessionStorage.setItem('payment_processed', 'true');
            setPaymentSuccess(true);
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
                className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            >
                <div className="absolute inset-0" onClick={onClose} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                    className="relative bg-[#09090b] border border-[#27272a] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 pb-6 bg-[#09090b] z-10 text-center">
                        <div className="absolute top-6 right-6">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#27272a] rounded-lg transition-colors text-[#a1a1aa] hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center mb-2">
                            <div className="p-3 bg-blue-500/10 rounded-2xl mb-4">
                                <Coins className="w-8 h-8 text-[#0091FF]" />
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Buy Vision Points</h2>
                            <p className="text-[#a1a1aa] text-sm max-w-md mx-auto">
                                Purchase points to generate tattoos and realistic renders.
                                <br />One-time payment. No subscription.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {packs.map((pack, index) => {
                                const nativePkg = isNative ? getNativePackage(pack.identifier) : undefined;
                                const displayPrice = isNative && nativePkg
                                    ? nativePkg.product.priceString
                                    : `${pack.price}€`;

                                const canBuyNative = isNative && !!nativePkg;
                                const canBuyWeb = !isNative;
                                const isAvailable = canBuyNative || canBuyWeb;

                                return (
                                    <motion.div
                                        key={pack.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.4 }}
                                        className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-200 group ${pack.popular
                                            ? 'bg-[#18181b] border-[#0091FF] shadow-[0_0_30px_rgba(0,145,255,0.15)] ring-1 ring-[#0091FF]/50 scale-[1.02] z-10'
                                            : 'bg-[#09090b] border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b]/50'
                                            }`}
                                    >
                                        {pack.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0091FF] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                                                Most Popular
                                            </div>
                                        )}

                                        <div className="text-center mb-4 mt-2">
                                            <div className="text-2xl font-bold text-white font-mono tracking-tight group-hover:text-[#0091FF] transition-colors">{pack.credits.toLocaleString()}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Vision Points</div>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center justify-center gap-3 mb-6">
                                            <div className="w-full h-px bg-[#27272a]" />
                                            <ul className="text-xs text-[#a1a1aa] space-y-2 w-full px-2">
                                                <li className="flex justify-between">
                                                    <span>Realistic Renders</span>
                                                    <span className="text-white font-mono">~{Math.floor(pack.credits / 500)}</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span>Tattoo Gens</span>
                                                    <span className="text-white font-mono">~{Math.floor(pack.credits / 200)}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (isNative && nativePkg) {
                                                    handleNativePurchase(nativePkg);
                                                } else {
                                                    handlePurchase(pack.id, pack.price, pack.credits);
                                                }
                                            }}
                                            disabled={loading !== null || (!isAvailable && isNative)}
                                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${pack.popular
                                                ? 'bg-[#0091FF] text-white hover:bg-[#007AFF] shadow-lg shadow-blue-900/20'
                                                : 'bg-[#27272a] text-white hover:bg-[#3f3f46] border border-[#3f3f46]'
                                                }`}
                                        >
                                            {loading === (isNative && nativePkg ? nativePkg.identifier : pack.id) ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : (
                                                !isAvailable && isNative ? 'Unavailable' : `Buy for ${displayPrice}`
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-8 text-center text-[#52525b] text-xs max-w-lg mx-auto">
                            <p>Secure payment processing. Vision Points do not expire.</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
