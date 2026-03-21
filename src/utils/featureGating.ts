/**
 * Feature Gating Utilities for Tattoo Vision
 * 
 * MODÈLE HYBRIDE :
 * 1. Restrictions de Plan : Import de tatouages personnalisés (nécessite Plus+)
 * 2. Vision Points : Utilisation des fonctionnalités (tous les utilisateurs)
 */

export type Plan = 'free' | 'plus' | 'pro' | 'studio';
export type EntitlementType = 'plus' | 'pro' | 'studio' | null;

/**
 * Features that require a paid plan (not just Vision Points)
 */
export const PLAN_RESTRICTED_FEATURES = {
    IMPORT_CUSTOM_TATTOO: 'plus', // Free users can only use official library
} as const;

export type PlanRestrictedFeature = keyof typeof PLAN_RESTRICTED_FEATURES;

/**
 * Vision Points allocation per plan (monthly)
 */
export const PLAN_POINTS: Record<Plan, number> = {
    free: 0,        // Doit acheter des packs de crédits
    plus: 6000,     // 6,000 VP/mois
    pro: 15000,     // 15,000 VP/mois
    studio: 40000,  // 40,000 VP/mois
};

/**
 * Vision Points cost per action
 * Toutes ces actions sont accessibles à TOUS les utilisateurs (Free inclus)
 * tant qu'ils ont assez de Vision Points
 */
export const ACTION_COSTS = {
    AI_TATTOO_GENERATION: 600,    // Génération de tatouage par IA
    REALISTIC_RENDER: 1200,        // Rendu réaliste sur le corps
    BACKGROUND_REMOVAL: 25,        // Suppression d'arrière-plan
    EXTRACT_TATTOO: 50,            // Extraction de tatouage
} as const;

export type ActionType = keyof typeof ACTION_COSTS;

/**
 * Plan hierarchy (utilisé pour les comparaisons)
 */
const PLAN_HIERARCHY: Record<string, number> = {
    free: 0,
    plus: 1,
    pro: 2,
    studio: 3,
};

/**
 * Check if user's plan allows a specific feature
 * Used for plan-gated features (like custom tattoo import)
 */
export function hasPlanAccess(
    userPlan: Plan | null,
    feature: PlanRestrictedFeature
): boolean {
    const requiredPlan = PLAN_RESTRICTED_FEATURES[feature];

    if (!requiredPlan) return true; // No plan requirement
    if (!userPlan || userPlan === 'free') return false;

    const userLevel = PLAN_HIERARCHY[userPlan] || 0;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;

    return userLevel >= requiredLevel;
}

/**
 * Check if user has enough Vision Points for an action
 * This is the check for feature USAGE (not access)
 */
export function hasEnoughPoints(
    currentPoints: number,
    action: ActionType
): boolean {
    const cost = ACTION_COSTS[action];
    return currentPoints >= cost;
}

/**
 * Get the cost of an action in Vision Points
 */
export function getActionCost(action: ActionType): number {
    return ACTION_COSTS[action];
}

/**
 * Calculate remaining points after an action
 */
export function calculateRemainingPoints(
    currentPoints: number,
    action: ActionType
): number {
    const cost = ACTION_COSTS[action];
    return Math.max(0, currentPoints - cost);
}

/**
 * Get a user-friendly message when user doesn't have enough points
 */
export function getInsufficientPointsMessage(
    action: ActionType,
    currentPoints: number
): string {
    const cost = ACTION_COSTS[action];
    const needed = cost - currentPoints;

    const actionNames: Record<ActionType, string> = {
        AI_TATTOO_GENERATION: 'AI Tattoo Generation',
        REALISTIC_RENDER: 'Realistic Render',
        BACKGROUND_REMOVAL: 'Background Removal',
        EXTRACT_TATTOO: 'Extract Tattoo',
    };

    return `${actionNames[action]} requires ${cost} Vision Points. You need ${needed} more points.`;
}

/**
 * Get a user-friendly message when user's plan doesn't allow a feature
 */
export function getPlanRestrictedMessage(feature: PlanRestrictedFeature): string {
    const requiredPlan = PLAN_RESTRICTED_FEATURES[feature];
    const planName = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

    const messages: Record<PlanRestrictedFeature, string> = {
        IMPORT_CUSTOM_TATTOO: `Import your own tattoos with ${planName}. Free users can use our official library.`,
    };

    return messages[feature] || `This feature requires ${planName} plan`;
}

/**
 * Check if a plan upgrade is needed
 */
export function needsUpgrade(
    currentPlan: Plan | null,
    targetPlan: Plan
): boolean {
    const currentLevel = PLAN_HIERARCHY[currentPlan || 'free'] || 0;
    const targetLevel = PLAN_HIERARCHY[targetPlan] || 0;

    return currentLevel < targetLevel;
}

/**
 * Get monthly Vision Points for a plan
 */
export function getPlanPoints(plan: Plan): number {
    return PLAN_POINTS[plan];
}

/**
 * Calculate how many times an action can be performed with current points
 */
export function getActionCount(
    currentPoints: number,
    action: ActionType
): number {
    const cost = ACTION_COSTS[action];
    return Math.floor(currentPoints / cost);
}

/**
 * Get recommended plan based on usage
 */
export function getRecommendedPlan(monthlyActions: {
    [K in ActionType]?: number;
}): Plan {
    let totalCost = 0;

    for (const [action, count] of Object.entries(monthlyActions)) {
        const cost = ACTION_COSTS[action as ActionType];
        totalCost += cost * (count as number);
    }

    if (totalCost === 0) return 'free';
    if (totalCost <= 6000) return 'plus';
    if (totalCost <= 15000) return 'pro';
    return 'studio';
}

/**
 * Format Vision Points for display
 */
export function formatPoints(points: number): string {
    if (points >= 1000) {
        return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
}

/**
 * Get upgrade message based on current plan
 */
export function getUpgradeMessage(currentPlan: Plan | null): string {
    const plan = currentPlan || 'free';

    const messages: Record<Plan, string> = {
        free: 'Upgrade to Plus: Import custom tattoos + 6,000 VP/month',
        plus: 'Upgrade to Pro: Get 15,000 VP/month',
        pro: 'Upgrade to Studio: Get 40,000 VP/month',
        studio: 'You have the highest plan!',
    };

    return messages[plan];
}

/**
 * Check if user can afford multiple actions
 */
export function canAffordActions(
    currentPoints: number,
    actions: Array<{ action: ActionType; count: number }>
): boolean {
    let totalCost = 0;

    for (const { action, count } of actions) {
        totalCost += ACTION_COSTS[action] * count;
    }

    return currentPoints >= totalCost;
}

/**
 * Calculate total cost for multiple actions
 */
export function calculateTotalCost(
    actions: Array<{ action: ActionType; count: number }>
): number {
    let totalCost = 0;

    for (const { action, count } of actions) {
        totalCost += ACTION_COSTS[action] * count;
    }

    return totalCost;
}

/**
 * Get plan benefits summary
 */
export function getPlanBenefits(plan: Plan): string[] {
    const benefits: Record<Plan, string[]> = {
        free: [
            'Access to official tattoo library',
            'All features available (with Vision Points)',
            'Buy Vision Points as needed',
        ],
        plus: [
            'Import your own tattoos',
            '6,000 Vision Points/month',
            'All features unlocked',
            '~60 AI Generations/month',
        ],
        pro: [
            'Import your own tattoos',
            '15,000 Vision Points/month',
            'All features unlocked',
            '~150 AI Generations/month',
            'Priority support',
        ],
        studio: [
            'Import your own tattoos',
            '40,000 Vision Points/month',
            'All features unlocked',
            '~400 AI Generations/month',
            'Premium support',
        ],
    };

    return benefits[plan];
}
