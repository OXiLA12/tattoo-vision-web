import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, Check, ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
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

            <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative z-10 w-full max-w-md bg-[#0a0a0a]/95 backdrop-blur-xl rounded-t-[32px] md:rounded-[32px] border border-[#0091FF]/30 shadow-[0_0_100px_rgba(0,145,255,0.15)] flex flex-col pt-8 pb-10 px-6 overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0091FF] via-[#00DC82] to-[#0091FF]" />

                <button onClick={onClose} className="absolute top-5 right-5 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors z-20">
                    <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-6 mt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0091FF]/15 border border-[#0091FF]/30 text-[#0091FF] text-xs font-black uppercase tracking-widest mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Tattoo Vision Pro
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">
                        ACCÈS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0091FF] to-[#00DC82]">ILLIMITÉ</span>
                    </h2>
                    <p className="text-neutral-400 text-sm">3 jours gratuits · puis 9,99€/semaine</p>
                </div>

                {/* Plan card */}
                <div className="mb-6 rounded-2xl border border-[#00DC82]/30 bg-gradient-to-br from-[#00DC82]/5 to-[#0091FF]/5 p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-black text-xl">Pro</span>
                                <span className="px-2 py-0.5 bg-[#00DC82]/15 text-[#00DC82] text-[9px] font-black uppercase tracking-widest rounded-full border border-[#00DC82]/30">
                                    Accès illimité
                                </span>
                            </div>
                            <span className="text-neutral-500 text-xs">Annulable à tout moment</span>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-white">9,99€</div>
                            <div className="text-[10px] text-neutral-500">par semaine</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {[
                            'Rendus réalistes illimités',
                            'Téléchargement HD sans watermark',
                            'Génération de designs IA illimitée',
                            'Suppression de fond automatique',
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                                <Check className="w-4 h-4 text-[#00DC82] shrink-0" />
                                {f}
                            </div>
                        ))}
                    </div>
                </div>

                {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-xs font-bold">{error}</div>}

                <button
                    onClick={handleStartTrial}
                    disabled={loading}
                    className="w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mb-3 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0091FF, #00DC82)' }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>🔥 COMMENCER GRATUITEMENT — 3 JOURS</>}
                    </span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" />
                    Paiement sécurisé · <Lock className="w-3 h-3" /> Stripe certifié
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
