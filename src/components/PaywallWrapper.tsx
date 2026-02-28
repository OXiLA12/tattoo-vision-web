import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import PlanPricingModal from './PlanPricingModal';
import LaunchOfferPaywall from './LaunchOfferPaywall';
import { AnimatePresence } from 'framer-motion';

export default function PaywallWrapper() {
    const { isPaywallVisible, hidePaywall } = useSubscription();
    const { profile } = useAuth();

    // S'il a déjà utilisé son trial, il atterrit sur la carte normale. 
    // Sinon, on lui affiche l'offre agressive "3 jours gratuits".
    const hasUsedTrial = profile?.free_trial_used === true;

    return (
        <AnimatePresence>
            {isPaywallVisible && (
                hasUsedTrial ? (
                    <PlanPricingModal onClose={hidePaywall} />
                ) : (
                    <LaunchOfferPaywall onClose={hidePaywall} onSuccess={hidePaywall} />
                )
            )}
        </AnimatePresence>
    );
}
