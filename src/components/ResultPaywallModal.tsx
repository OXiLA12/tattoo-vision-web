import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Unlock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { VP_PACKS } from '../config/credits';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultPaywallModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResultPaywallModal({ onClose, onSuccess }: ResultPaywallModalProps) {
    const { isNative, packages: nativePackages, purchasePackage } = usePayments();
    const { refreshPurchaseStatus } = useAuth();
    const { t } = useLanguage();

    const starterPack = VP_PACKS.find(p => p.id === 'vp_pack_3000')!;
    const popularPack = VP_PACKS.find(p => p.id === 'vp_pack_7000')!;

    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async (pack: any) => {
        try {
            setLoading(pack.id);
            setError(null);

            const nativePkg = isNative ? nativePackages?.find(p => p.identifier.includes(pack.identifier) || p.product.identifier.includes(pack.identifier)) : undefined;

            if (isNative && nativePkg) {
                const { success } = await purchasePackage(nativePkg);
                if (success) {
                    await refreshPurchaseStatus();
                    onSuccess();
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
                    window.location.href = responseData.url;
                } else {
                    setError("Service de paiement temporairement indisponible.");
                }
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(null);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 isolate">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-md bg-[#0d0d0d] rounded-t-[32px] md:rounded-[32px] border-t md:border border-white/10 shadow-2xl flex flex-col pt-8 pb-10 px-6"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white bg-white/5 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0091FF] to-[#00DC82] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,145,255,0.3)]">
                        <Unlock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                        {t('paywall_unlock_title')}
                    </h2>
                    <p className="text-[#a1a1aa] text-sm">
                        {t('paywall_unlock_subtitle')}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 px-4 text-center text-red-400 text-xs font-bold uppercase tracking-widest">
                        {error}
                    </div>
                )}

                <div className="space-y-3 mb-8 px-4">
                    {[
                        t('paywall_feature_1'),
                        t('paywall_feature_2'),
                        t('paywall_feature_3'),
                        t('paywall_feature_4')
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-white text-sm font-medium">
                            <CheckCircle2 className="w-5 h-5 text-[#00DC82]" />
                            {feature}
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handlePurchase(starterPack)}
                        disabled={loading !== null}
                        className="w-full py-4 bg-[#0091FF] text-white rounded-[20px] text-sm font-black uppercase tracking-widest hover:bg-[#007AFF] shadow-[0_10px_30px_rgba(0,145,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading === starterPack.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('paywall_get_vp', { credits: starterPack.credits, price: starterPack.price })}
                    </button>

                    <button
                        onClick={() => handlePurchase(popularPack)}
                        disabled={loading !== null}
                        className="relative w-full py-4 bg-white/5 border border-white/10 text-white rounded-[20px] text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <div className="absolute -top-3 right-4 px-2 py-0.5 bg-[#00DC82] text-black text-[10px] font-black uppercase rounded-full">
                            {t('paywall_most_popular')}
                        </div>
                        {loading === popularPack.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('paywall_get_vp', { credits: popularPack.credits, price: popularPack.price })}
                    </button>
                </div>

                <p className="text-center text-neutral-500 text-xs mt-6">
                    {t('paywall_screenshots_note')}
                </p>
            </motion.div>
        </div>,
        document.body
    );
}
