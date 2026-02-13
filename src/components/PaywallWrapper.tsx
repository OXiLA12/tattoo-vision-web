import { useSubscription } from '../contexts/SubscriptionContext';
import PlanPricingModal from './PlanPricingModal';

export default function PaywallWrapper() {
    const { isPaywallVisible, hidePaywall } = useSubscription();

    if (!isPaywallVisible) return null;

    return <PlanPricingModal onClose={hidePaywall} />;
}
