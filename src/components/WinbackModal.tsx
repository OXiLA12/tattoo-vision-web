import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { tiktokPixel } from '../utils/tiktokPixel';

interface WinbackModalProps {
    onClose: () => void;
}

export default function WinbackModal({ onClose }: WinbackModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClaim = async () => {
        try {
            setLoading(true);
            setError(null);
            tiktokPixel.initiateCheckout({ content_id: 'pro_retention', value: 7.99, currency: 'EUR' });

            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: {
                    plan: 'retention',
                    returnUrl: `${window.location.origin}${window.location.pathname}`,
                }
            });

            if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');
            const res = data as any;

            if (res?.url) {
                sessionStorage.setItem('tv_pending_render', 'true');
                window.location.href = res.url;
            } else {
                setError(res?.error || 'Service indisponible, réessayez.');
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[200000] flex items-end md:items-center justify-center isolate">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, y: 80, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 80, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="relative z-10 w-full max-w-sm mx-4 mb-0 md:mb-auto bg-[#060912] border border-[#0091FF]/25 rounded-t-[28px] md:rounded-[28px] overflow-hidden shadow-[0_0_80px_rgba(0,145,255,0.12)]"
                >
                    {/* Top accent */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#0091FF] to-transparent" />

                    <div className="p-7 pb-8 flex flex-col gap-5">
                        {/* Close */}
                        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-neutral-700 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>

                        {/* Urgency badge */}
                        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-red-500/10 border border-red-500/20 w-fit mx-auto">
                            <Timer className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                                Offre unique — disparaît si vous fermez
                            </span>
                        </div>

                        {/* Headline */}
                        <div className="text-center">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0091FF] mb-3">
                                Offre spéciale · Tattoo Vision Pro
                            </p>

                            {/* Price display */}
                            <div className="flex items-center justify-center gap-4 mb-1">
                                {/* Crossed out original */}
                                <div className="relative">
                                    <span className="text-3xl font-black text-neutral-600">9,99€</span>
                                    <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                                        <div className="w-full h-0.5 bg-red-500/60 rotate-[-8deg]" />
                                    </div>
                                </div>

                                {/* Arrow */}
                                <span className="text-neutral-600 text-lg">→</span>

                                {/* New price */}
                                <div className="flex items-end gap-1">
                                    <span className="text-5xl font-black text-white tracking-tight">7,99€</span>
                                    <span className="text-neutral-500 text-sm mb-1 font-medium">/sem</span>
                                </div>
                            </div>

                            {/* Daily price */}
                            <p className="text-[#0091FF] font-black text-sm">
                                soit <span className="text-white">1,14€/jour</span>
                            </p>

                            {/* Discount badge */}
                            <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-[#0091FF]/10 border border-[#0091FF]/20">
                                <span className="text-[11px] font-black text-[#0091FF] uppercase tracking-wider">
                                    −20% par rapport au tarif normal
                                </span>
                            </div>
                        </div>

                        {/* Features — très minimal */}
                        <div className="space-y-1.5">
                            {['Rendus réalistes illimités', 'Export HD sans watermark', 'Génération IA illimitée'].map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-neutral-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0091FF] shrink-0" />
                                    {f}
                                </div>
                            ))}
                        </div>

                        {error && <p className="text-center text-red-400 text-xs font-medium">{error}</p>}

                        {/* CTA */}
                        <button
                            onClick={handleClaim}
                            disabled={loading}
                            className="relative w-full py-4 rounded-[16px] font-black text-sm uppercase tracking-widest text-white overflow-hidden disabled:opacity-50 transition-all active:scale-[0.98]"
                            style={{ background: 'linear-gradient(130deg, #0050CC 0%, #0091FF 100%)' }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : 'Profiter de l\'offre — 7,99€/sem'}
                            </span>
                        </button>

                        {/* Decline */}
                        <button
                            onClick={onClose}
                            className="text-center text-xs text-neutral-700 hover:text-neutral-500 transition-colors underline underline-offset-2"
                        >
                            Non merci, je préfère payer 9,99€
                        </button>

                        {/* Legal */}
                        <p className="text-center text-[10px] text-neutral-800 leading-relaxed">
                            7,99€/sem prélevés immédiatement. Annulable à tout moment.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
