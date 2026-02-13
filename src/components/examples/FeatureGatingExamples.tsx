/**
 * Example Component: Feature Gating with RevenueCat
 * 
 * This file demonstrates how to implement feature gating in your components.
 * Copy and adapt these patterns to your own components.
 */

import { useSubscription } from '../contexts/SubscriptionContext';
import { hasFeatureAccess, getUpgradeMessage, FEATURE_REQUIREMENTS } from '../utils/featureGating';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Sparkles } from 'lucide-react';

// ============================================================================
// EXAMPLE 1: Simple Feature Gate
// ============================================================================

/**
 * Basic feature gating - shows upgrade prompt if user doesn't have access
 */
export function SimpleFeatureGate() {
    const { activeEntitlement, showPaywall } = useSubscription();

    // Check if user has at least 'plus' entitlement
    const hasAccess = activeEntitlement !== null;

    if (!hasAccess) {
        return (
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl text-center">
                <Lock className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-300 mb-2">
                    Plus Required
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                    Upgrade to Plus to unlock this feature
                </p>
                <button
                    onClick={showPaywall}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                    Upgrade Now
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Your feature content here */}
            <h3 className="text-xl text-white">Feature Unlocked!</h3>
        </div>
    );
}

// ============================================================================
// EXAMPLE 2: Advanced Feature Gate with requiresEntitlement
// ============================================================================

/**
 * Advanced feature gating - automatically shows paywall when action is triggered
 */
export function AdvancedFeatureGate() {
    const { requiresEntitlement } = useSubscription();

    const handleProAction = async () => {
        // This will check if user has 'pro' or higher
        // If not, it will automatically show the paywall
        const hasAccess = await requiresEntitlement('pro');

        if (hasAccess) {
            // User has access, perform the action
            await performProAction();
        }
        // If no access, paywall is already shown
    };

    return (
        <button
            onClick={handleProAction}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
            Pro Feature
        </button>
    );
}

// ============================================================================
// EXAMPLE 3: Feature Gate with Plan-Based Logic
// ============================================================================

/**
 * Feature gating using plan from profile (for web/non-native)
 */
export function PlanBasedFeatureGate() {
    const { profile } = useAuth();
    const { showPaywall } = useSubscription();

    const userPlan = profile?.plan || 'free';
    const hasAccess = hasFeatureAccess(userPlan, 'AI_TATTOO_GENERATION');
    const upgradeMessage = getUpgradeMessage('AI_TATTOO_GENERATION');

    if (!hasAccess) {
        return (
            <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-1">
                            {upgradeMessage}
                        </h3>
                        <p className="text-sm text-neutral-400 mb-4">
                            Required plan: {FEATURE_REQUIREMENTS['AI_TATTOO_GENERATION'].toUpperCase()}
                        </p>
                        <button
                            onClick={showPaywall}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Upgrade to {FEATURE_REQUIREMENTS['AI_TATTOO_GENERATION'].charAt(0).toUpperCase() + FEATURE_REQUIREMENTS['AI_TATTOO_GENERATION'].slice(1)}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* AI Tattoo Generation UI */}
            <h3 className="text-xl text-white mb-4">AI Tattoo Generator</h3>
            {/* ... */}
        </div>
    );
}

// ============================================================================
// EXAMPLE 4: Conditional Rendering Based on Entitlement
// ============================================================================

/**
 * Show different UI based on user's entitlement level
 */
export function TieredFeatureDisplay() {
    const { activeEntitlement } = useSubscription();

    return (
        <div className="space-y-4">
            {/* Free features - always visible */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                <h4 className="text-white font-medium mb-2">Basic Features</h4>
                <p className="text-sm text-neutral-400">Available to everyone</p>
            </div>

            {/* Plus features */}
            {activeEntitlement && (
                <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Plus Features</h4>
                    <p className="text-sm text-neutral-400">AI Generation, Realistic Render, etc.</p>
                </div>
            )}

            {/* Pro features */}
            {(activeEntitlement === 'pro' || activeEntitlement === 'studio') && (
                <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Pro Features</h4>
                    <p className="text-sm text-neutral-400">Priority Processing, Commercial License, etc.</p>
                </div>
            )}

            {/* Studio features */}
            {activeEntitlement === 'studio' && (
                <div className="p-4 bg-amber-900/20 border border-amber-500/20 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Studio Features</h4>
                    <p className="text-sm text-neutral-400">Team Collaboration, API Access, etc.</p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// EXAMPLE 5: Feature Gate with Loading State
// ============================================================================

/**
 * Feature gating with loading state handling
 */
export function FeatureGateWithLoading() {
    const { activeEntitlement, isLoading, showPaywall } = useSubscription();

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const hasAccess = activeEntitlement !== null;

    if (!hasAccess) {
        return (
            <div className="p-6 text-center">
                <p className="text-neutral-400 mb-4">This feature requires a subscription</p>
                <button
                    onClick={showPaywall}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                    View Plans
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Feature content */}
        </div>
    );
}

// ============================================================================
// EXAMPLE 6: Inline Feature Gate (Button)
// ============================================================================

/**
 * Inline feature gating for buttons
 */
export function FeatureButton() {
    const { activeEntitlement, showPaywall } = useSubscription();

    const hasAccess = activeEntitlement !== null;

    const handleClick = () => {
        if (!hasAccess) {
            showPaywall();
            return;
        }

        // Perform action
        performAction();
    };

    return (
        <button
            onClick={handleClick}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${hasAccess
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
        >
            {hasAccess ? 'Generate Tattoo' : 'Unlock Feature'}
            {!hasAccess && <Lock className="w-4 h-4 inline ml-2" />}
        </button>
    );
}

// ============================================================================
// EXAMPLE 7: Feature Gate with Custom Message
// ============================================================================

/**
 * Feature gating with custom upgrade message per feature
 */
export function CustomMessageFeatureGate({ feature }: { feature: 'AI_TATTOO_GENERATION' | 'REALISTIC_RENDER' }) {
    const { profile } = useAuth();
    const { showPaywall } = useSubscription();

    const userPlan = profile?.plan || 'free';
    const hasAccess = hasFeatureAccess(userPlan, feature);
    const message = getUpgradeMessage(feature);

    if (!hasAccess) {
        return (
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl">
                <h3 className="text-lg font-medium text-white mb-2">{message}</h3>
                <button
                    onClick={showPaywall}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
                >
                    Upgrade Now
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Feature content */}
        </div>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function performAction() {
    console.log('Performing action...');
    // Your action logic here
}

async function performProAction() {
    console.log('Performing Pro action...');
    // Your Pro action logic here
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    SimpleFeatureGate,
    AdvancedFeatureGate,
    PlanBasedFeatureGate,
    TieredFeatureDisplay,
    FeatureGateWithLoading,
    FeatureButton,
    CustomMessageFeatureGate,
};
