import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, AlertTriangle, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { VP_PACKS } from '../config/credits';
import { useLanguage } from '../contexts/LanguageContext';
import { trackPaywallCTAClicked, trackPurchaseInitiated, trackPurchaseCompleted, trackPurchaseFailed } from '../lib/analytics';

interface ResultPaywallModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResultPaywallModal({ onClose, onSuccess }: ResultPaywallModalProps) {
    const { isNative, packages: nativePackages, purchasePackage } = usePayments();
    const { refreshPurchaseStatus } = useAuth();
    const { t } = useLanguage();

    const singleUnlock = VP_PACKS.find(p => p.id === 'vp_unlock_single')!;
    const starterPack = VP_PACKS.find(p => p.id === 'vp_pack_3000')!;
    const popularPack = VP_PACKS.find(p => p.id === 'vp_pack_7000')!;

    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(599); // 9 minutes 59 seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handlePurchase = async (pack: any) => {
        try {
            setLoading(pack.id);
            setError(null);

            // Track CTA click immediately (before async work)
            trackPaywallCTAClicked(pack.id, pack.price, pack.credits);

            const nativePkg = isNative
                ? nativePackages?.find(p => p.identifier.includes(pack.identifier) || p.product.identifier.includes(pack.identifier))
                : undefined;

            if (isNative && nativePkg) {
                trackPurchaseInitiated(pack.id, pack.price, pack.credits);
                const { success } = await purchasePackage(nativePkg);
                if (success) {
                    trackPurchaseCompleted(pack.id, pack.price, pack.credits);
                    await refreshPurchaseStatus();
                    onSuccess();
                } else {
                    trackPurchaseFailed(pack.id, 'Native purchase returned false');
                }
            } else {
                const { invokeWithAuth } = await import('../lib/invokeWithAuth');
                const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                    body: {
                        plan: (pack as any).stripeId || pack.id,
                        isConsumable: true,
                        amount: pack.price * 100,
                        credits: pack.credits,
                        returnUrl: `${window.location.origin}${window.location.pathname}`
                    },
                });
                if (invokeError) throw new Error(invokeError.message || 'Erreur de connexion');
                const responseData = data as any;
                if (responseData?.url) {
                    // Track purchase initiation just before leaving the page
                    trackPurchaseInitiated(pack.id, pack.price, pack.credits);
                    window.location.href = responseData.url;
                } else {
                    setError('Service de paiement temporairement indisponible.');
                }
            }
        } catch (err: any) {
            trackPurchaseFailed(pack.id, err.message || 'Unknown error');
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(null);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 isolate">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

            <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative w-full max-w-md bg-[#0a0a0a] rounded-t-[32px] md:rounded-[32px] border border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.15)] flex flex-col pt-8 pb-10 px-6 overflow-hidden"
            >
                {/* Urgent Header effect */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />

                <button onClick={onClose} className="absolute top-5 right-5 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors z-10">
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-6 mt-2 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Expiration dans {formatTime(timeLeft)}
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase italic">Ne perdez pas<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">votre création</span></h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mt-3 font-medium">
                        Sans sauvegarde, ce rendu ultra-réaliste sera <span className="text-red-400 font-bold">définitivement supprimé</span> dans quelques minutes.
                    </p>
                </div>

                {/* Features (Frustration/Fear focused) */}
                <div className="space-y-3 mb-6 relative z-10 bg-black/50 p-5 rounded-2xl border border-red-500/10 shadow-inner">
                    {[
                        { icon: <Lock className="w-4 h-4 text-orange-400" />, text: "Sécurisez & débloquez l'image 4K" },
                        { icon: <Sparkles className="w-4 h-4 text-[#00DC82]" />, text: "Droit d'utilisation à vie" },
                        { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, text: "Destruction si non sauvegardé" }
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3 text-white text-sm font-bold">
                            <div className="p-1.5 bg-red-500/5 rounded-lg border border-red-500/10 shrink-0">
                                {f.icon}
                            </div>
                            {f.text}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-xs font-bold tracking-wide animate-shake">{error}</div>}

                {/* CTAs */}
                <div className="space-y-4 relative z-10">
                    {/* Primary Single Unlock 2.99€ */}
                    <button onClick={() => handlePurchase(singleUnlock)} disabled={loading !== null}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(239,68,68,0.4)] hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-[0.98] border border-orange-400/50 relative overflow-hidden group">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="relative z-10 flex items-center gap-2">
                            {loading === singleUnlock.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <>SAUVEGARDER LE TATOUAGE</>}
                        </span>
                        <span className="relative z-10 text-[10px] opacity-90 font-bold bg-black/20 px-2 py-0.5 rounded-full mt-1">Paiement unique • {singleUnlock.price}€</span>
                    </button>

                    <div className="flex items-center gap-3 w-full">
                        <div className="h-[1px] bg-white/10 flex-1" />
                        <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">ou</span>
                        <div className="h-[1px] bg-white/10 flex-1" />
                    </div>

                    {/* Secondary Starter Pack */}
                    <button onClick={() => handlePurchase(starterPack)} disabled={loading !== null}
                        className="w-full py-3.5 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 hover:bg-white/10 rounded-[16px] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading === starterPack.id ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            <>Acheter un Pack de 10 Rendus <span className="text-[#00DC82]">({starterPack.price}€)</span></>}
                    </button>
                    <p className="text-center text-neutral-600 text-[9px] uppercase font-black tracking-widest mt-2 opacity-60">
                        Paiement 100% Sécurisé via Apple / Stripe
                    </p>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
