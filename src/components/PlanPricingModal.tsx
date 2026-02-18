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
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col" style={{ backgroundColor: '#000000' }}>
            {/* Header - Fixed Height */}
            <div className="relative flex flex-col items-center px-6 pt-12 pb-6 text-center border-b border-white/5 bg-black">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white z-50 rounded-full bg-white/5"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-16 h-16 bg-[#0091FF]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#0091FF]/20 shadow-[0_0_20px_rgba(0,145,255,0.1)]">
                    <Zap className="w-8 h-8 text-[#0091FF]" />
                </div>

                <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">
                    Vision <span className="text-[#0091FF]">Points</span>
                </h2>
                <p className="text-neutral-500 text-xs max-w-xs font-medium uppercase tracking-wider">
                    {t('pricing_subtitle') || 'Choisissez votre pack de points'}
                </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center flex items-center gap-2 justify-center">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Cards List */}
                <div className="flex flex-col gap-4 max-w-md mx-auto">
                    {packs.map((pack) => {
                        const nativePkg = isNative ? getNativePackage(pack.identifier) : undefined;
                        const displayPrice = isNative && nativePkg
                            ? nativePkg.product.priceString
                            : `${pack.price}€`;

                        const isAvailable = isNative ? !!nativePkg : true;

                        return (
                            <div
                                key={pack.id}
                                className={`relative flex flex-col p-6 rounded-[32px] border-2 transition-all ${pack.popular
                                    ? 'bg-neutral-900 border-[#0091FF] shadow-[0_20px_40px_rgba(0,145,255,0.1)]'
                                    : 'bg-neutral-900/50 border-white/5'
                                    }`}
                            >
                                {pack.popular && (
                                    <div className="absolute -top-3 left-8 px-4 py-1.5 bg-[#0091FF] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                        {t('pricing_popular') || 'Populaire'}
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <div className="text-[10px] font-black text-[#0091FF] uppercase tracking-[0.2em] mb-2">{pack.name}</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white tracking-tight">{pack.credits.toLocaleString()}</span>
                                            <span className="text-[#0091FF] font-black text-sm tracking-tighter">VP</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                        <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">
                                            ~{Math.floor(pack.credits / 200)}<br />Générations
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => isNative && nativePkg ? handleNativePurchase(nativePkg) : handlePurchase(pack.id, pack.price, pack.credits)}
                                    disabled={loading !== null || (!isAvailable && isNative)}
                                    className={`w-full py-5 rounded-[20px] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center transition-all active:scale-95 ${pack.popular
                                        ? 'bg-[#0091FF] text-white shadow-[0_10px_20px_rgba(0,145,255,0.3)] hover:bg-[#007AFF]'
                                        : 'bg-white text-black hover:bg-neutral-200'
                                        } disabled:opacity-50`}
                                >
                                    {loading === (isNative && nativePkg ? nativePkg.identifier : pack.id) ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        displayPrice
                                    )}
                                </button>
                            </div>
                        );
                    })}

                    <div className="mt-8 text-center text-neutral-500 text-[10px] uppercase font-bold tracking-[0.2em] leading-relaxed opacity-60">
                        {t('pricing_secure') || 'Paiement unique sécurisé'} <br />
                        {t('pricing_no_expiry') || 'Les Vision Points n\'expirent jamais'}
                    </div>
                </div>
            </div>

            {/* Safe Area Spacer */}
            <div className="h-[env(safe-area-inset-bottom,20px)] bg-black" />
        </div>
    );
}
