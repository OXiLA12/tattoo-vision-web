import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Zap, Loader2, Sparkles } from 'lucide-react';
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                className="relative w-full max-w-md bg-[#0d0d0d] rounded-t-[32px] md:rounded-[32px] border-t md:border border-white/10 shadow-2xl flex flex-col pt-8 pb-10 px-6 overflow-hidden"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 rounded-full bg-gradient-to-r from-[#0091FF] via-[#00DC82] to-[#0091FF] opacity-80" />

                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-7">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00DC82] to-[#0091FF] rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(0,220,130,0.35)]">
                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Résultat Prêt !</h2>
                    <p className="text-neutral-400 text-sm leading-snug">Débloquez votre tatouage ultra-réaliste.</p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-7 px-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                    {['Rendu IA ultra-réaliste HD', 'Intégration parfaite à la peau', 'Exportation Haute Résolution', 'Sans filigrane & 100% net', 'Privé & Sécurisé'].map((f, i) => (
                        <div key={i} className="flex items-center gap-3 text-white text-sm font-medium">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#00DC82]" />
                            {f}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-4 px-4 text-center text-red-400 text-xs font-bold uppercase tracking-widest">{error}</div>}

                {/* CTAs */}
                <div className="space-y-4">
                    {/* Primary Single Unlock 1.99€ */}
                    <button onClick={() => handlePurchase(singleUnlock)} disabled={loading !== null}
                        className="w-full py-4 bg-gradient-to-r from-[#00DC82] to-[#10B981] text-black rounded-[20px] font-black uppercase tracking-wide shadow-[0_10px_30px_rgba(0,220,130,0.3)] hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 active:scale-[0.98] border border-[#00DC82]/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10 flex items-center gap-2">
                            {loading === singleUnlock.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 flex-shrink-0" /> Débloquer le rendu HD</>}
                        </span>
                        <span className="relative z-10 text-[10px] opacity-80 font-bold lowercase">paiement unique de {singleUnlock.price}€</span>
                    </button>

                    <div className="flex items-center gap-3 w-full">
                        <div className="h-[1px] bg-white/10 flex-1" />
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">ou</span>
                        <div className="h-[1px] bg-white/10 flex-1" />
                    </div>

                    {/* Secondary Starter Pack 4.99€ */}
                    <button onClick={() => handlePurchase(starterPack)} disabled={loading !== null}
                        className="w-full py-3.5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 hover:bg-white/5 rounded-[16px] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading === starterPack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pack 10 Rendus pour ${starterPack.price}€`}
                    </button>
                </div>

                <p className="text-center text-neutral-600 text-xs mt-6">{t('paywall_screenshots_note')}</p>
            </motion.div>
        </div>,
        document.body
    );
}
