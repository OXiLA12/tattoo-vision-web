import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { tiktokPixel } from '../utils/tiktokPixel';

interface PlanPricingModalProps {
    onClose: () => void;
}

export default function PlanPricingModal({ onClose }: PlanPricingModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartTrial = async () => {
        try {
            setLoading(true);
            setError(null);
            tiktokPixel.initiateCheckout({ content_id: 'pro', value: 9.99, currency: 'EUR' });
            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: { returnUrl: `${window.location.origin}${window.location.pathname}` }
            });
            if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');
            const res = data as any;
            if (res?.url) {
                window.location.href = res.url;
            } else if (res?.code === 'TRIAL_ALREADY_USED') {
                setError('Essai déjà utilisé.');
            } else {
                setError(res?.error || 'Service indisponible.');
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
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
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl hidden md:block"
                />
                <div className="absolute inset-0 bg-[#060912] md:hidden" />

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="relative z-10 w-full md:max-w-sm md:mx-4 md:mb-auto bg-[#060912] md:border md:border-[#0091FF]/20 md:rounded-[28px] overflow-hidden h-full md:h-auto flex flex-col"
                >
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#0091FF] to-transparent" />

                    <div className="flex-1 flex flex-col justify-between p-8 md:p-7 pb-10 md:pb-8">
                        <div className="flex justify-end mb-2">
                            <button onClick={onClose} className="p-2 text-neutral-600 hover:text-white transition-colors rounded-full hover:bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center gap-8">
                            <div className="text-center space-y-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0091FF]">Tattoo Vision Pro</p>
                                <div className="flex items-end justify-center gap-1">
                                    <span className="text-7xl font-black text-white tracking-tight">1,43€</span>
                                    <span className="text-neutral-500 text-base mb-2 font-medium">/jour</span>
                                </div>
                                <p className="text-neutral-600 text-sm">9,99 € / semaine · annulable à tout moment</p>
                            </div>

                            <div className="w-full py-3.5 px-5 rounded-2xl bg-[#0091FF]/8 border border-[#0091FF]/15 text-center">
                                <span className="text-base font-bold text-white">
                                    3 jours <span className="text-[#0091FF]">gratuits</span> pour commencer
                                </span>
                            </div>

                            <div className="w-full space-y-3">
                                {['Rendus réalistes illimités', 'Export HD sans watermark', 'Génération IA illimitée'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-2.5 text-sm text-neutral-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#0091FF] shrink-0" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-8">
                            {error && <p className="text-center text-red-400 text-xs">{error}</p>}

                            <button
                                onClick={handleStartTrial}
                                disabled={loading}
                                className="relative w-full py-5 rounded-[18px] font-black text-sm uppercase tracking-widest text-white overflow-hidden disabled:opacity-50 transition-all active:scale-[0.98]"
                                style={{ background: 'linear-gradient(130deg, #0050CC 0%, #0091FF 100%)' }}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                                />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Commencer gratuitement'}
                                </span>
                            </button>

                            <p className="text-center text-[10px] text-neutral-700 leading-relaxed">
                                Après 3 jours, 9,99€/sem prélevés automatiquement. Annulable avant la fin de l'essai.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
