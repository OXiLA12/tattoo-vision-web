import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { CREDIT_PACKS } from '../config/credits';
import { tiktokPixel } from '../utils/tiktokPixel';

interface CreditPackModalProps {
    onClose: () => void;
}

const PACK_COLORS = {
    pack_starter: {
        bg: 'from-neutral-900 to-neutral-950',
        border: 'border-neutral-800',
        badge: null,
        accent: 'text-neutral-300',
        cta: 'bg-neutral-800 hover:bg-neutral-700 text-white',
    },
    pack_creator: {
        bg: 'from-[#001a3a] to-[#000d1f]',
        border: 'border-[#0091FF]/40',
        badge: 'Meilleure valeur',
        accent: 'text-[#0091FF]',
        cta: 'bg-[#0091FF] hover:bg-[#0080e0] text-white shadow-[0_0_20px_rgba(0,145,255,0.35)]',
    },
    pack_studio: {
        bg: 'from-[#0d0014] to-[#050008]',
        border: 'border-purple-500/30',
        badge: null,
        accent: 'text-purple-400',
        cta: 'bg-purple-600 hover:bg-purple-500 text-white',
    },
};

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
            <div className="fixed inset-0 z-[100000] flex flex-col md:items-center md:justify-center isolate">

                {/* Desktop backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl hidden md:block"
                />

                {/* Mobile: full screen. Desktop: centered card */}
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    className="relative z-10 flex flex-col
                               w-full h-full
                               md:h-auto md:max-w-md md:rounded-[32px] md:overflow-hidden
                               bg-[#040408]"
                >
                    {/* Top gradient line */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#0091FF]/60 to-transparent flex-shrink-0" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0091FF]">
                                Crédits supplémentaires
                            </p>
                            <h2 className="text-xl font-black text-white mt-0.5">
                                Recharger mon compte
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full
                                       bg-neutral-900 border border-neutral-800
                                       text-neutral-500 hover:text-white hover:bg-neutral-800
                                       transition-all active:scale-90"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Packs list */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                        {CREDIT_PACKS.map((pack, i) => {
                            const style = PACK_COLORS[pack.id as keyof typeof PACK_COLORS] ?? PACK_COLORS.pack_starter;
                            const isLoading = loading === pack.id;

                            return (
                                <motion.button
                                    key={pack.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    onClick={() => handlePurchase(pack.id, pack.price)}
                                    disabled={loading !== null}
                                    className={`relative w-full text-left rounded-2xl border p-5
                                                bg-gradient-to-br ${style.bg} ${style.border}
                                                transition-all duration-200
                                                hover:scale-[1.02] hover:shadow-lg
                                                active:scale-[0.98]
                                                disabled:opacity-50 disabled:pointer-events-none`}
                                >
                                    {/* Popular badge */}
                                    {style.badge && (
                                        <div className="absolute -top-3 left-4 flex items-center gap-1
                                                        px-3 py-1 rounded-full
                                                        bg-[#0091FF] text-white text-[10px] font-black uppercase tracking-wider">
                                            <Star className="w-2.5 h-2.5" fill="currentColor" />
                                            {style.badge}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left: name + credits */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${style.accent}`}>
                                                {pack.name}
                                            </p>
                                            <p className="text-2xl font-black text-white leading-none">
                                                {pack.credits.toLocaleString()}
                                                <span className="text-sm font-bold text-neutral-500 ml-1.5">crédits</span>
                                            </p>

                                        </div>

                                        {/* Right: price + arrow */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-xl font-black text-white">{pack.priceLabel}</p>
                                                <p className="text-[10px] text-neutral-600">paiement unique</p>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.cta}`}>
                                                {isLoading
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <ChevronRight className="w-4 h-4" />
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}

                        {error && (
                            <p className="text-center text-red-400 text-xs py-2">{error}</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 flex-shrink-0 border-t border-neutral-900">
                        <p className="text-center text-[11px] text-neutral-600 leading-relaxed">
                            Paiement sécurisé par Stripe · Crédits sans expiration · Achat unique
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
