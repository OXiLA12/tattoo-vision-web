import { useState } from 'react';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { invokeWithAuth } from '../lib/invokeWithAuth';

interface CreditPurchaseModalProps {
    onClose: () => void;
}

const PACKAGES = [
    { id: 'small', credits: 10, price: 500, priceDisplay: '$5.00', name: 'Starter Pack', popular: false },
    { id: 'medium', credits: 50, price: 2000, priceDisplay: '$20.00', name: 'Creator Pack', popular: true },
    { id: 'large', credits: 100, price: 3500, priceDisplay: '$35.00', name: 'Pro Pack', popular: false },
];

export default function CreditPurchaseModal({ onClose }: CreditPurchaseModalProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async (packageId: string) => {
        try {
            setLoading(packageId);
            setError(null);

            const { data: sess } = await supabase.auth.getSession();
            console.log("session exists?", !!sess.session, "user?", sess.session?.user?.id);

            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: { packageId, returnUrl: window.location.origin },
            });

            if (invokeError) {
                console.log("invoke error", invokeError);
                throw new Error(invokeError.message || 'Failed to connect to checkout service');
            }

            if (data?.error) throw new Error(data.error);

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }

        } catch (err) {
            console.error('Purchase error:', err);
            setError(err instanceof Error ? err.message : 'Failed to initiate purchase');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-light text-neutral-100 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Purchase Credits
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PACKAGES.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`relative flex flex-col p-6 rounded-2xl border transition-all ${pkg.popular
                                    ? 'bg-neutral-800/50 border-amber-800/50 shadow-lg shadow-amber-900/10'
                                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                                    }`}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-full shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-4">
                                    <h3 className="text-lg font-medium text-neutral-200">{pkg.name}</h3>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-3xl font-bold text-white">{pkg.priceDisplay}</span>
                                    </div>
                                    <p className="text-neutral-400 text-sm mt-1">
                                        {(pkg.price / pkg.credits).toFixed(0)}¢ per credit
                                    </p>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-neutral-300">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>{pkg.credits} AI Generations</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-neutral-300">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Full Commercial Rights</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-neutral-300">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>High Priority Processing</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handlePurchase(pkg.id)}
                                    disabled={loading !== null}
                                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${pkg.popular
                                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20'
                                        : 'bg-white text-neutral-900 hover:bg-neutral-100'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading === pkg.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <span>Buy Now</span>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-neutral-500 text-sm mt-8">
                        Secure payment powered by Stripe. Credits never expire.
                    </p>
                </div>
            </div>
        </div>
    );
}
