import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { tiktokPixel } from '../utils/tiktokPixel';

interface SubscriptionPaywallModalProps {
    onClose: () => void;
    backgroundImage?: string;
    title?: string;
    subtitle?: string;
}

export default function SubscriptionPaywallModal({ onClose, backgroundImage }: SubscriptionPaywallModalProps) {
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
                setError('Essai déjà utilisé. Contactez le support.');
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
            <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center isolate">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                />

                {/* Background tattoo blur */}
                {backgroundImage && (
                    <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px)' }}
                    />
                )}

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="relative z-10 w-full max-w-sm mx-4 mb-0 md:mb-auto bg-[#060912] border border-[#0091FF]/20 rounded-t-[28px] md:rounded-[28px] overflow-hidden"
                >
                    {/* Top blue accent */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#0091FF] to-transparent" />

                    <div className="p-7 pb-8 flex flex-col gap-6">
                        {/* Close */}
                        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-neutral-600 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>

                        {/* Price hero */}
                        <div className="text-center pt-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0091FF] mb-3">Tattoo Vision Pro</p>
                            <div className="flex items-end justify-center gap-1 mb-1">
                                <span className="text-6xl font-black text-white tracking-tight">1,43€</span>
                                <span className="text-neutral-500 text-sm mb-2 font-medium">/jour</span>
                            </div>
                            <p className="text-neutral-600 text-xs">9,99 € / semaine · annulable à tout moment</p>
                        </div>

                        {/* Trial badge */}
                        <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0091FF]/8 border border-[#0091FF]/15">
                            <span className="text-sm font-bold text-white">
                                3 jours <span className="text-[#0091FF]">gratuits</span> pour commencer
                            </span>
                        </div>

                        {/* Features — ultra minimal */}
                        <div className="space-y-2">
                            {['Rendus réalistes illimités', 'Export HD sans watermark', 'Génération IA illimitée'].map((f, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-sm text-neutral-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0091FF] shrink-0" />
                                    {f}
                                </div>
                            ))}
                        </div>

                        {error && (
                            <p className="text-center text-red-400 text-xs font-medium">{error}</p>
                        )}

                        {/* CTA */}
                        <button
                            onClick={handleStartTrial}
                            disabled={loading}
                            className="relative w-full py-4 rounded-[16px] font-black text-sm uppercase tracking-widest text-white overflow-hidden disabled:opacity-50 transition-all active:scale-[0.98]"
                            style={{ background: 'linear-gradient(130deg, #0050CC 0%, #0091FF 100%)' }}
                        >
                            {/* Shimmer */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                            />
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : 'Commencer gratuitement'}
                            </span>
                        </button>

                        {/* Legal */}
                        <p className="text-center text-[10px] text-neutral-700 leading-relaxed">
                            Après 3 jours, 9,99€/sem prélevés automatiquement. Annulable à tout moment avant la fin de l'essai.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
