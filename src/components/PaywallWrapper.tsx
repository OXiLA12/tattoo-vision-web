import { useSubscription } from '../contexts/SubscriptionContext';
import PlanPricingModal from './PlanPricingModal';
import { AnimatePresence } from 'framer-motion';

export default function PaywallWrapper() {
    const { isPaywallVisible, hidePaywall } = useSubscription();

    return (
        <AnimatePresence>
            {isPaywallVisible && (
                <PlanPricingModal onClose={hidePaywall} />
            )}
        </AnimatePresence>
    );
}
