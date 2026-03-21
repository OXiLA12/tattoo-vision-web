export type Plan = 'free' | 'plus' | 'pro' | 'studio';

export type Feature =
    | 'AI_TATTOO_GENERATION'
    | 'IMPORT_TATTOO'
    | 'REALISTIC_RENDER'
    | 'REMOVE_WATERMARK'
    | 'SAVE_HISTORY'
    | 'REMOVE_BACKGROUND'
    | 'HD_EXPORT';

interface AuthResponse {
    allowed: boolean;
    requiredPlan?: Plan;
}

// @ts-ignore
export function canUseFeature(_plan: Plan, _feature: Feature, _context?: { freeRealisticUsed?: boolean }): AuthResponse {
    // ALL PLANS (Free basically, since we use credits now)
    // We now allow access to features, but they will be gated by CREDIT COST at the point of use.
    return { allowed: true };
}
