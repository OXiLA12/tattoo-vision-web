/**
 * RevenueCat Types and Configuration
 * 
 * This file contains all TypeScript types and constants related to RevenueCat subscriptions.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Subscription plan types
 */
export type Plan = 'free' | 'plus' | 'pro' | 'studio';

/**
 * Entitlement types (what users get after purchase)
 */
export type EntitlementType = 'plus' | 'pro' | 'studio' | null;

/**
 * RevenueCat package identifiers
 */
export type PackageIdentifier = 'monthly_plus' | 'monthly_pro' | 'monthly_studio';

/**
 * Subscription status
 */
export type SubscriptionStatus =
    | 'active'
    | 'canceled'
    | 'expired'
    | 'grace_period'
    | 'trial'
    | 'none';

/**
 * Feature names that can be gated
 */
export type FeatureName =
    | 'AI_TATTOO_GENERATION'
    | 'REALISTIC_RENDER'
    | 'BACKGROUND_REMOVAL'
    | 'SAVE_TO_LIBRARY'
    | 'UNLIMITED_LIBRARY'
    | 'EXPORT_HIGH_QUALITY'
    | 'COMMERCIAL_LICENSE'
    | 'PRIORITY_PROCESSING'
    | 'ADVANCED_AI_MODELS'
    | 'TEAM_COLLABORATION'
    | 'API_ACCESS';

/**
 * Action types that cost Vision Points
 */
export type ActionType =
    | 'AI_TATTOO_GENERATION'
    | 'REALISTIC_RENDER'
    | 'BACKGROUND_REMOVAL'
    | 'EXTRACT_TATTOO';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * RevenueCat configuration
 */
export const REVENUECAT_CONFIG = {
    // API Keys (should be in environment variables in production)
    API_KEY_IOS: 'test_YayyfBpYgTiYMQCEpDGOjXgqdVS',
    API_KEY_ANDROID: 'goog_placeholder_key',

    // Offering ID
    OFFERING_ID: 'default',

    // Entitlement IDs
    ENTITLEMENTS: {
        PLUS: 'plus',
        PRO: 'pro',
        STUDIO: 'studio',
    } as const,

    // Package IDs
    PACKAGES: {
        MONTHLY_PLUS: 'monthly_plus',
        MONTHLY_PRO: 'monthly_pro',
        MONTHLY_STUDIO: 'monthly_studio',
    } as const,
} as const;

/**
 * Apple Product IDs
 */
export const APPLE_PRODUCT_IDS = {
    PLUS_MONTHLY: 'com.tattoovision.app.plus_monthly',
    PRO_MONTHLY: 'com.tattoovision.app.pro2_monthly',
    STUDIO_MONTHLY: 'com.tattoovision.app.studio1_monthly',
} as const;

/**
 * Plan details
 */
export const PLAN_DETAILS = {
    free: {
        name: 'Free',
        price: 0,
        visionPoints: 0,
        features: [
            'Limited access',
            '1 free realistic render',
        ],
    },
    plus: {
        name: 'Plus',
        price: 9.99,
        visionPoints: 6000,
        features: [
            '6,000 Vision Points/month',
            'AI Tattoo Generation',
            'Realistic Render',
            'Background Removal',
            'Save to Library',
            'Export High Quality',
        ],
    },
    pro: {
        name: 'Pro',
        price: 19.99,
        visionPoints: 15000,
        features: [
            '15,000 Vision Points/month',
            'Everything in Plus',
            'Priority Processing',
            'Advanced AI Models',
            'Unlimited Library',
            'Commercial License',
        ],
    },
    studio: {
        name: 'Studio',
        price: 39.99,
        visionPoints: 40000,
        features: [
            '40,000 Vision Points/month',
            'Everything in Pro',
            'Ultra-Fast Processing',
            'Premium AI Models',
            'Team Collaboration',
            'API Access',
        ],
    },
} as const;

/**
 * Vision Points allocation per plan
 */
export const PLAN_VISION_POINTS: Record<Plan, number> = {
    free: 0,
    plus: 6000,
    pro: 15000,
    studio: 40000,
};

/**
 * Vision Points cost per action
 */
export const ACTION_COSTS: Record<ActionType, number> = {
    AI_TATTOO_GENERATION: 600,
    REALISTIC_RENDER: 1200,
    BACKGROUND_REMOVAL: 25,
    EXTRACT_TATTOO: 50,
};

/**
 * Feature access requirements
 */
export const FEATURE_REQUIREMENTS: Record<FeatureName, Plan> = {
    AI_TATTOO_GENERATION: 'plus',
    REALISTIC_RENDER: 'plus',
    BACKGROUND_REMOVAL: 'plus',
    SAVE_TO_LIBRARY: 'plus',
    UNLIMITED_LIBRARY: 'pro',
    EXPORT_HIGH_QUALITY: 'plus',
    COMMERCIAL_LICENSE: 'pro',
    PRIORITY_PROCESSING: 'pro',
    ADVANCED_AI_MODELS: 'pro',
    TEAM_COLLABORATION: 'studio',
    API_ACCESS: 'studio',
};

/**
 * Plan hierarchy for comparison
 */
export const PLAN_HIERARCHY: Record<Plan, number> = {
    free: 0,
    plus: 1,
    pro: 2,
    studio: 3,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a plan is higher or equal to another
 */
export function isPlanHigherOrEqual(userPlan: Plan, requiredPlan: Plan): boolean {
    return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Get the highest entitlement from a list
 */
export function getHighestEntitlement(entitlements: EntitlementType[]): EntitlementType {
    const validEntitlements = entitlements.filter(e => e !== null) as Exclude<EntitlementType, null>[];

    if (validEntitlements.length === 0) return null;

    return validEntitlements.reduce((highest, current) => {
        const currentLevel = PLAN_HIERARCHY[current];
        const highestLevel = PLAN_HIERARCHY[highest];
        return currentLevel > highestLevel ? current : highest;
    });
}

/**
 * Convert entitlement to plan
 */
export function entitlementToPlan(entitlement: EntitlementType): Plan {
    return entitlement || 'free';
}

/**
 * Convert plan to entitlement
 */
export function planToEntitlement(plan: Plan): EntitlementType {
    return plan === 'free' ? null : plan;
}

/**
 * Get plan name for display
 */
export function getPlanDisplayName(plan: Plan): string {
    return PLAN_DETAILS[plan].name;
}

/**
 * Get plan price
 */
export function getPlanPrice(plan: Plan): number {
    return PLAN_DETAILS[plan].price;
}

/**
 * Get plan vision points
 */
export function getPlanVisionPoints(plan: Plan): number {
    return PLAN_DETAILS[plan].visionPoints;
}

/**
 * Check if user can afford an action
 */
export function canAffordAction(currentPoints: number, action: ActionType): boolean {
    return currentPoints >= ACTION_COSTS[action];
}

/**
 * Calculate points after action
 */
export function calculatePointsAfterAction(currentPoints: number, action: ActionType): number {
    return Math.max(0, currentPoints - ACTION_COSTS[action]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    REVENUECAT_CONFIG,
    APPLE_PRODUCT_IDS,
    PLAN_DETAILS,
    PLAN_VISION_POINTS,
    ACTION_COSTS,
    FEATURE_REQUIREMENTS,
    PLAN_HIERARCHY,
    isPlanHigherOrEqual,
    getHighestEntitlement,
    entitlementToPlan,
    planToEntitlement,
    getPlanDisplayName,
    getPlanPrice,
    getPlanVisionPoints,
    canAffordAction,
    calculatePointsAfterAction,
};
