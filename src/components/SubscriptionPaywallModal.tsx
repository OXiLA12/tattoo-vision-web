import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { invokeWithAuth } from '../lib/invokeWithAuth';

interface SubscriptionPaywallModalProps {
    onClose: () => void;
    backgroundImage?: string;
}

export default function SubscriptionPaywallModal({ onClose, backgroundImage }: SubscriptionPaywallModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartTrial = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                method: 'POST',
                body: {
                    plan: 'launch_weekly_trial',
                    returnUrl: `${window.location.origin}${window.location.pathname}`
                }
            });

            if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');

            const responseData = data as any;
            if (responseData?.url || responseData?.ok) {
                // Save context so Export.tsx can auto-trigger the render after Stripe redirect
                sessionStorage.setItem('tv_pending_render', 'true');
                window.location.href = responseData.url;
            } else if (responseData?.code === 'TRIAL_ALREADY_USED') {
                setError('Vous avez déjà utilisé votre essai gratuit.');
            } else if (responseData?.error) {
                console.error("DEBUG STRIPE ERROR:", responseData.error);
                alert("Stripe Error: " + responseData.error);
                setError(`Erreur: ${responseData.error}`);
            } else {
                setError('Service temporairement indisponible.');
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

            {/* 40% visible blurred background to create frustration */}
            {backgroundImage && (
                <div
                    className="absolute inset-0 z-0 opacity-40 blur-md grayscale-[30%] pointer-events-none transition-all duration-1000"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}

            <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative z-10 w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-xl rounded-t-[32px] md:rounded-[32px] border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.2)] flex flex-col pt-8 pb-10 px-6 overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-pulse" />

                <button onClick={onClose} className="absolute top-5 right-5 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors z-20">
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-6 mt-2 relative z-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                        Votre rendu réaliste est prêt 🔒
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase italic">
                        VOICI À QUOI VOTRE TATOUAGE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">RESSEMBLERA VRAIMENT</span>
                    </h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mt-3 font-medium">
                        Débloquez-le gratuitement pendant 3 jours.
                    </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8 relative z-10 bg-black/50 p-5 rounded-2xl border border-emerald-500/10 shadow-inner">
                    {[
                        { icon: "✔️", text: "Aperçu ultra réaliste sur votre peau" },
                        { icon: "✔️", text: "Téléchargement HD" },
                        { icon: "✔️", text: "Sans watermark" },
                        { icon: "✔️", text: "Annulation en 1 clic" }
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3 text-white text-sm font-bold">
                            <div className="p-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10 shrink-0 text-emerald-400 text-xs flex items-center justify-center w-6 h-6">
                                {f.icon}
                            </div>
                            {f.text}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-xs font-bold tracking-wide animate-shake">{error}</div>}

                {/* CTAs */}
                <div className="space-y-4 relative z-10">
                    <button onClick={handleStartTrial} disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-[0.98] border border-emerald-400/50 relative overflow-hidden group">
                        <span className="relative z-10 flex items-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>🔥 VOIR MON RENDU GRATUITEMENT</>}
                        </span>
                        <span className="relative z-10 text-[10px] opacity-90 font-bold bg-black/20 px-2 py-0.5 rounded-full mt-1">3 jours gratuits · puis 6,99€/semaine · annulation à tout moment</span>
                    </button>

                    {/* ── Mentions légales obligatoires (Directive EU 2011/83/UE) ── */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] text-neutral-500 leading-relaxed text-center">
                            Après 3 jours d'essai gratuit, votre abonnement sera automatiquement renouvelé au tarif de <strong className="text-neutral-400">6,99€/semaine</strong> sauf résiliation avant la fin de l'essai.
                            Vous pouvez résilier à tout moment depuis votre profil.
                        </p>
                        <p className="text-[10px] text-neutral-600 leading-relaxed text-center">
                            Conformément à l'art. L221-18 du Code de la consommation, vous disposez d'un droit de rétractation de 14 jours.
                            En démarrant l'essai et en accédant immédiatement au service, vous reconnaissez que ce droit sera perdu proportionnellement à l'utilisation.
                        </p>
                    </div>
                </div>

            </motion.div>
        </div>,
        document.body
    );
}
