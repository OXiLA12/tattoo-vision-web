import { AlertCircle, Lock, Coins, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureBlockedMessageProps {
    reason: 'PLAN_RESTRICTED' | 'INSUFFICIENT_POINTS' | 'TRIAL_USED';
    feature: string;
    requiredPlan?: string;
    requiredPoints?: number;
    currentPoints?: number;
    onUpgrade?: () => void;
    onBuyCredits?: () => void;
}

export default function FeatureBlockedMessage({
    reason,
    feature,
    requiredPlan,
    requiredPoints,
    currentPoints,
    onUpgrade,
    onBuyCredits,
}: FeatureBlockedMessageProps) {
    const getIcon = () => {
        switch (reason) {
            case 'PLAN_RESTRICTED':
            case 'TRIAL_USED':
                return <Lock className="w-6 h-6 text-amber-500" />;
            case 'INSUFFICIENT_POINTS':
                return <Coins className="w-6 h-6 text-blue-500" />;
            default:
                return <AlertCircle className="w-6 h-6 text-neutral-400" />;
        }
    };

    const getTitle = () => {
        switch (reason) {
            case 'PLAN_RESTRICTED':
                return 'Fonctionnalité Premium';
            case 'TRIAL_USED':
                return 'Essai Gratuit Utilisé';
            case 'INSUFFICIENT_POINTS':
                return 'Vision Points Insuffisants';
            default:
                return 'Accès Restreint';
        }
    };

    const getMessage = () => {
        switch (reason) {
            case 'PLAN_RESTRICTED':
                return (
                    <>
                        <p className="text-neutral-300 mb-2">
                            La fonctionnalité <strong>{feature}</strong> nécessite un plan <strong className="text-amber-400">{requiredPlan || 'Plus'}</strong> ou supérieur.
                        </p>
                        <p className="text-neutral-400 text-sm">
                            Passez à un plan supérieur pour débloquer cette fonctionnalité et bien plus encore!
                        </p>
                    </>
                );
            case 'TRIAL_USED':
                return (
                    <>
                        <p className="text-neutral-300 mb-2">
                            Vous avez déjà utilisé votre <strong>essai gratuit</strong> pour cette fonctionnalité.
                        </p>
                        <p className="text-neutral-400 text-sm">
                            Passez au plan <strong className="text-amber-400">{requiredPlan || 'Plus'}</strong> pour continuer à utiliser <strong>{feature}</strong>.
                        </p>
                    </>
                );
            case 'INSUFFICIENT_POINTS':
                return (
                    <>
                        <p className="text-neutral-300 mb-2">
                            Vous n'avez pas assez de Vision Points pour utiliser <strong>{feature}</strong>.
                        </p>
                        <div className="flex items-center gap-4 text-sm mt-3">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <span>Requis:</span>
                                <span className="text-red-400 font-bold">{requiredPoints} VP</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400">
                                <span>Disponible:</span>
                                <span className="text-blue-400 font-bold">{currentPoints} VP</span>
                            </div>
                        </div>
                        <p className="text-neutral-400 text-sm mt-3">
                            Passez à un plan supérieur pour obtenir plus de Vision Points chaque mois!
                        </p>
                    </>
                );
            default:
                return <p className="text-neutral-300">Cette fonctionnalité n'est pas disponible avec votre plan actuel.</p>;
        }
    };

    const getAction = () => {
        switch (reason) {
            case 'PLAN_RESTRICTED':
            case 'TRIAL_USED':
                return onUpgrade ? (
                    <button
                        onClick={onUpgrade}
                        className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                    >
                        <Zap className="w-5 h-5" />
                        Passer au Plan {requiredPlan || 'Plus'}
                    </button>
                ) : null;
            case 'INSUFFICIENT_POINTS':
                return (
                    <div className="flex gap-3">
                        {onBuyCredits && (
                            <button
                                onClick={onBuyCredits}
                                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Coins className="w-5 h-5" />
                                Acheter des Points
                            </button>
                        )}
                        {onUpgrade && (
                            <button
                                onClick={onUpgrade}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5" />
                                Upgrade
                            </button>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-3xl p-8 shadow-2xl max-w-lg mx-auto"
        >
            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center">
                    {getIcon()}
                </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-neutral-100 text-center mb-4">
                {getTitle()}
            </h3>

            {/* Message */}
            <div className="text-center mb-6">
                {getMessage()}
            </div>

            {/* Action */}
            {getAction()}
        </motion.div>
    );
}
