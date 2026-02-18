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
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col pt-[env(safe-area-inset-top,20px)] pb-[env(safe-area-inset-bottom,20px)] overflow-y-auto">
            {/* Header Area */}
            <div className="flex flex-col items-center px-6 py-10 text-center shrink-0">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-4 text-neutral-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-16 h-16 bg-[#0091FF]/20 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-[#0091FF]" />
                </div>

                <h2 className="text-3xl font-black text-white tracking-tighter mb-2">
                    Vision <span className="text-[#0091FF]">Points</span>
                </h2>
                <p className="text-neutral-400 text-sm max-w-xs font-light">
                    Choisissez votre pack pour débloquer toutes les fonctionnalités.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-6 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
                    {error}
                </div>
            )}

            {/* Cards List */}
            <div className="flex flex-col gap-4 px-6 pb-20">
                {packs.map((pack) => {
                    const nativePkg = isNative ? getNativePackage(pack.identifier) : undefined;
                    const displayPrice = isNative && nativePkg
                        ? nativePkg.product.priceString
                        : `${pack.price}€`;

                    const isAvailable = isNative ? !!nativePkg : true;

                    return (
                        <div
                            key={pack.id}
                            className={`relative flex flex-col p-6 rounded-3xl border ${pack.popular
                                ? 'bg-neutral-800 border-[#0091FF] shadow-lg'
                                : 'bg-neutral-900 border-white/5'
                                }`}
                        >
                            {pack.popular && (
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-[#0091FF] text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                                    Populaire
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-[#0091FF] uppercase mb-1">{pack.name}</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white">{pack.credits.toLocaleString()}</span>
                                        <span className="text-[#0091FF] font-bold text-xs">VP</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-neutral-400">~{Math.floor(pack.credits / 200)} Générations</div>
                                </div>
                            </div>

                            <button
                                onClick={() => isNative && nativePkg ? handleNativePurchase(nativePkg) : handlePurchase(pack.id, pack.price, pack.credits)}
                                disabled={loading !== null || (!isAvailable && isNative)}
                                className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center ${pack.popular
                                    ? 'bg-[#0091FF] text-white shadow-blue-600/20'
                                    : 'bg-white text-black'
                                    } disabled:opacity-50`}
                            >
                                {loading === (isNative && nativePkg ? nativePkg.identifier : pack.id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    displayPrice
                                )}
                            </button>
                        </div>
                    );
                })}

                <div className="mt-4 text-center text-neutral-500 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
                    Paiement unique sécurisé. <br />Les Points n'expirent jamais.
                </div>
            </div>
        </div>
    );
}
