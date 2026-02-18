import { useState } from 'react';
import { X, Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayments } from '../hooks/usePayments';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

interface PaywallProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLAN_DETAILS = {
    plus: {
        name: 'Plus',
        color: '#0091FF',
        gradient: 'from-blue-500 to-cyan-500',
        points: '6,000',
        popular: false,
        features: [
            '6,000 Vision Points/month',
            'All features unlocked',
            '~60 AI Generations',
            '~120 Realistic Renders',
            'Save to Library',
            'Export High Quality',
        ],
    },
    pro: {
        name: 'Pro',
        color: '#8B5CF6',
        gradient: 'from-purple-500 to-pink-500',
        points: '15,000',
        popular: true,
        features: [
            '15,000 Vision Points/month',
            'All features unlocked',
            '~150 AI Generations',
            '~300 Realistic Renders',
            'Best value for creators',
            'Priority support',
        ],
    },
    studio: {
        name: 'Studio',
        color: '#F59E0B',
        gradient: 'from-amber-500 to-orange-500',
        points: '40,000',
        popular: false,
        features: [
            '40,000 Vision Points/month',
            'All features unlocked',
            '~400 AI Generations',
            '~800 Realistic Renders',
            'For professional studios',
            'Premium support',
        ],
    },
};

export default function Paywall({ isOpen, onClose }: PaywallProps) {
    const { packages, purchasePackage, loading: paymentsLoading, presentCustomerCenter } = usePayments();
    const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Map packages to plan details
    const getPackageForPlan = (planId: keyof typeof PLAN_DETAILS) => {
        return packages.find(pkg =>
            pkg.identifier.toLowerCase().includes(planId)
        );
    };

    const handlePurchase = async (pkg: PurchasesPackage) => {
        try {
            setLoadingPackage(pkg.identifier);
            setError(null);

            const result = await purchasePackage(pkg);

            if (result.success) {
                // Success! Close the paywall
                onClose();
            } else if (!result.userCancelled) {
                throw new Error('Purchase failed');
            }
        } catch (err: any) {
            console.error('Purchase error:', err);
            setError(err.message || 'Failed to complete purchase');
        } finally {
            setLoadingPackage(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            >
                <div className="absolute inset-0" onClick={onClose} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                    className="relative bg-[#09090b] border border-[#27272a] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 pb-6 bg-gradient-to-b from-[#09090b] to-transparent">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-6 h-6 text-[#0091FF]" />
                                    <h2 className="text-3xl font-bold text-white tracking-tight">
                                        Vision Points Illimités?
                                    </h2>
                                </div>
                                <p className="text-[#a1a1aa] text-sm">
                                    Toutes les fonctionnalités débloquées - vous avez juste besoin de Vision Points
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#27272a] rounded-lg transition-colors text-[#a1a1aa] hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Info Banner */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-200 font-medium">Aucune restriction !</p>
                                <p className="text-xs text-blue-300/70 mt-1">
                                    Toutes les fonctionnalités sont accessibles à tous. Vous avez juste besoin de Vision Points pour les utiliser.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((planId, index) => {
                                const plan = PLAN_DETAILS[planId];
                                const pkg = getPackageForPlan(planId);
                                const isLoading = loadingPackage === pkg?.identifier;

                                return (
                                    <motion.div
                                        key={planId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.4 }}
                                        className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-200 ${plan.popular
                                            ? 'bg-[#18181b] border-[#8B5CF6] shadow-[0_0_30px_rgba(139,92,246,0.2)] scale-[1.05] z-10'
                                            : 'bg-[#09090b] border-[#27272a] hover:border-[#3f3f46]'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                                    Meilleure Offre
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                                        </div>

                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-white tracking-tight">
                                                    {pkg?.product.priceString || '—'}
                                                </span>
                                                <span className="text-[#a1a1aa] text-sm font-normal">/mois</span>
                                            </div>
                                            <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                                                <Zap className="w-4 h-4 text-blue-400 mr-2" />
                                                <span className="text-sm font-medium text-white">
                                                    {plan.points} Vision Points
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => pkg && handlePurchase(pkg)}
                                            disabled={!pkg || isLoading || paymentsLoading}
                                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all mb-6 ${plan.popular
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                                                : 'bg-[#27272a] text-white hover:bg-[#3f3f46] border border-[#3f3f46]'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : !pkg ? (
                                                'Chargement...'
                                            ) : (
                                                `S'abonner à ${plan.name}`
                                            )}
                                        </button>

                                        <div className="pt-6 border-t border-[#27272a] flex-1">
                                            <p className="text-[11px] font-medium text-white mb-4 uppercase tracking-wider opacity-80">
                                                Includes
                                            </p>
                                            <ul className="space-y-3">
                                                {plan.features.map((feature, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="flex items-start gap-3 text-[13px] text-[#a1a1aa] leading-snug"
                                                    >
                                                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5 opacity-80" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-10 pt-6 border-t border-[#27272a]">
                            {/* Legal Text */}
                            <p className="text-[#a1a1aa] text-xs text-center mb-4">
                                Renouvellement automatique. Annulez à tout moment dans Réglages → Abonnements.
                            </p>
                            <p className="text-[#52525b] text-xs text-center mb-6">
                                Les Vision Points se renouvellent mensuellement avec votre abonnement.
                                Les VP non utilisés ne sont pas reportés au mois suivant.
                            </p>

                            {/* Manage Subscription Button */}
                            <div className="flex justify-center mb-6">
                                <button
                                    onClick={() => {
                                        // Use native iOS subscription management on mobile
                                        if (Capacitor.isNativePlatform()) {
                                            presentCustomerCenter();
                                        } else {
                                            // Fallback to web URL for browser
                                            window.open('https://apps.apple.com/account/subscriptions', '_blank');
                                        }
                                    }}
                                    className="text-[#0091FF] hover:text-[#0077CC] text-sm font-medium transition-colors"
                                >
                                    Gérer mon abonnement
                                </button>
                            </div>

                            {/* Legal Links */}
                            <div className="flex justify-center gap-4 text-xs">
                                <a
                                    href="https://github.com/[votre-username]/tattoo-vision-legal/blob/main/privacy-policy.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                                >
                                    Politique de confidentialité
                                </a>
                                <span className="text-[#27272a]">•</span>
                                <a
                                    href="https://github.com/[votre-username]/tattoo-vision-legal/blob/main/terms-of-service.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                                >
                                    Conditions d'utilisation
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
