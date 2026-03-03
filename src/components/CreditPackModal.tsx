import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { CREDIT_PACKS } from '../config/credits';
import { tiktokPixel } from '../utils/tiktokPixel';

interface CreditPackModalProps {
    onClose: () => void;
}

export default function CreditPackModal({ onClose }: CreditPackModalProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async (packId: string, price: number) => {
        try {
            setLoading(packId);
            setError(null);
            tiktokPixel.initiateCheckout({ content_id: packId, value: price, currency: 'EUR' });

            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: {
                    plan: packId,
                    returnUrl: `${window.location.origin}${window.location.pathname}`,
                }
            });

            if (invokeError) throw new Error(invokeError.message);
            const res = data as any;
            if (res?.url) {
                window.location.href = res.url;
            } else {
                setError(res?.error || 'Erreur, réessayez.');
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(null);
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center isolate">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative z-10 w-full max-w-sm mx-4 mb-0 md:mb-auto bg-[#060912] border border-[#0091FF]/20 rounded-t-[28px] md:rounded-[28px] overflow-hidden"
                >
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#0091FF] to-transparent" />

                    <div className="p-6 pb-8 flex flex-col gap-5">
                        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-neutral-600 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="text-center pt-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0091FF] mb-1">Crédits supplémentaires</p>
                            <p className="text-neutral-500 text-xs">Achat unique · Utilisables à tout moment</p>
                        </div>

                        <div className="space-y-3">
                            {CREDIT_PACKS.map((pack) => (
                                <motion.button
                                    key={pack.id}
                                    onClick={() => handlePurchase(pack.id, pack.price)}
                                    disabled={loading !== null}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative w-full flex items-center justify-between p-4 rounded-2xl border transition-all disabled:opacity-50 ${pack.popular
                                            ? 'bg-[#0091FF]/10 border-[#0091FF]/40 hover:bg-[#0091FF]/15'
                                            : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/60'
                                        }`}
                                >
                                    {pack.popular && (
                                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-[#0091FF] text-white text-[9px] font-black uppercase tracking-wider rounded-full">
                                            Populaire
                                        </span>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pack.popular ? 'bg-[#0091FF]/20' : 'bg-neutral-800'}`}>
                                            <Zap className={`w-4 h-4 ${pack.popular ? 'text-[#0091FF]' : 'text-neutral-400'}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-bold text-sm">{pack.name}</p>
                                            <p className="text-neutral-500 text-xs">{pack.credits.toLocaleString()} crédits</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {loading === pack.id
                                            ? <Loader2 className="w-4 h-4 animate-spin text-[#0091FF]" />
                                            : <span className={`font-black text-sm ${pack.popular ? 'text-[#0091FF]' : 'text-white'}`}>{pack.priceLabel}</span>
                                        }
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {error && <p className="text-center text-red-400 text-xs">{error}</p>}

                        <p className="text-center text-[10px] text-neutral-700">
                            Paiement sécurisé par Stripe · Crédits sans expiration
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
