import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { tiktokPixel } from '../utils/tiktokPixel';

interface SubscriptionPaywallModalProps {
    onClose: () => void;
    backgroundImage?: string;
    title?: string;
    subtitle?: string;
}

export default function SubscriptionPaywallModal({ onClose, backgroundImage, title, subtitle }: SubscriptionPaywallModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(599);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const handleStartTrial = async () => {
        try {
            setLoading(true);
            setError(null);

            tiktokPixel.initiateCheckout({ content_id: 'pro', value: 9.99, currency: 'EUR' });

            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: { returnUrl: `${window.location.origin}${window.location.pathname}` }
            });

            if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');

            const responseData = data as any;
            if (responseData?.url) {
                window.location.href = responseData.url;
            } else if (responseData?.code === 'TRIAL_ALREADY_USED') {
                setError('Vous avez déjà utilisé votre essai gratuit. Contactez le support si besoin.');
            } else {
                setError(responseData?.error || 'Service temporairement indisponible.');
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 isolate">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-0" />

            {backgroundImage && (
                <div
                    className="absolute inset-0 z-0 opacity-30 blur-xl pointer-events-none"
                    style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
            )}

            <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative z-10 w-full max-w-md bg-[#0a0a0a]/95 backdrop-blur-xl rounded-t-[32px] md:rounded-[32px] border border-[#0091FF]/30 shadow-[0_0_100px_rgba(0,145,255,0.15)] flex flex-col pt-8 pb-10 px-6 overflow-hidden"
            >
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0091FF] via-[#00DC82] to-[#0091FF]" />

                <button onClick={onClose} className="absolute top-5 right-5 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors z-20">
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-5 mt-2 relative z-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0091FF]/15 border border-[#0091FF]/30 text-[#0091FF] text-xs font-black uppercase tracking-widest mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Tattoo Vision Pro
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase italic">
                        {title || <>{`VISUALISE`}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0091FF] to-[#00DC82]">TON TATOUAGE</span></>}
                    </h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mt-2 font-medium">
                        {subtitle || '3 jours gratuits, puis seulement 9,99 €/semaine'}
                    </p>
                </div>

                {/* Urgency Timer */}
                <div className="flex items-center justify-center gap-2 mb-5 px-4 py-2.5 bg-white/3 border border-white/8 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00DC82] animate-pulse" />
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                        Offre expire dans <span className="text-white">{formatTime(timeLeft)}</span>
                    </span>
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-6 relative z-10">
                    {[
                        'Rendus réalistes illimités sur votre peau',
                        'Téléchargement HD sans watermark',
                        'Génération de designs IA illimitée',
                        'Suppression de fond automatique',
                        'Annulation en 1 clic depuis votre profil',
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-neutral-300 font-medium">
                            <div className="w-5 h-5 rounded-full bg-[#00DC82]/15 border border-[#00DC82]/30 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-[#00DC82]" />
                            </div>
                            {f}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-xs font-bold tracking-wide">{error}</div>}

                {/* CTA */}
                <div className="space-y-4 relative z-10">
                    <button
                        onClick={handleStartTrial}
                        disabled={loading}
                        className="w-full py-4 rounded-[20px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-[0.98] relative overflow-hidden border border-[#00DC82]/40"
                        style={{ background: 'linear-gradient(135deg, #0091FF, #00DC82)' }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        />
                        <span className="relative z-10 flex items-center gap-2 text-black text-sm">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>🔥 COMMENCER GRATUITEMENT</>}
                        </span>
                        <span className="relative z-10 text-[10px] text-black/70 font-bold bg-black/10 px-3 py-0.5 rounded-full">
                            3 jours gratuits · puis 9,99€/sem · annulable à tout moment
                        </span>
                    </button>

                    {/* Legal */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] text-neutral-500 leading-relaxed text-center">
                            Après 3 jours d'essai gratuit, <strong className="text-neutral-400">9,99€/semaine</strong> sauf résiliation avant la fin de l'essai.
                        </p>
                        <p className="text-[10px] text-neutral-600 leading-relaxed text-center">
                            Conformément à l'art. L221-18 du Code de la consommation, droit de rétractation de 14 jours.
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Paiement Stripe sécurisé
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
