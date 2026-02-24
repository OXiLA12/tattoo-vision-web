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
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0091FF] to-[#00DC82] rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(0,145,255,0.35)]">
                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Ready to see it for real?</h2>
                    <p className="text-neutral-400 text-sm leading-snug">Generate your ultra-realistic tattoo.</p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-7 px-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                    {['AI ultra realistic render', 'Skin blending technology', 'High resolution HD export', 'No watermark', 'Private & secure'].map((f, i) => (
                        <div key={i} className="flex items-center gap-3 text-white text-sm font-medium">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#00DC82]" />
                            {f}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-4 px-4 text-center text-red-400 text-xs font-bold uppercase tracking-widest">{error}</div>}

                {/* CTAs */}
                <div className="space-y-3">
                    {/* Primary 4.99€ (10 renders) */}
                    <button onClick={() => handlePurchase(starterPack)} disabled={loading !== null}
                        className="w-full py-4 bg-gradient-to-r from-[#0091FF] to-[#007AFF] text-white rounded-[20px] font-black uppercase tracking-wide shadow-[0_10px_30px_rgba(0,145,255,0.45)] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                        {loading === starterPack.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" />Generate my tattoo – €{starterPack.price}</>}
                    </button>

                    {/* Secondary 1.99€ (1 render) */}
                    <button onClick={() => handlePurchase(singleUnlock)} disabled={loading !== null}
                        className="w-full py-3 border border-white/10 text-neutral-400 hover:text-white hover:border-white/25 hover:bg-white/5 rounded-[16px] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading === singleUnlock.id ? <Loader2 className="w-4 h-4 animate-spin" /> : `Maybe later - 1 render (€${singleUnlock.price})`}
                    </button>
                </div>

                <p className="text-center text-neutral-600 text-xs mt-5">{t('paywall_screenshots_note')}</p>
            </motion.div>
        </div>,
        document.body
    );
}
