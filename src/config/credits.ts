// Subscription plan — Pro access + 2000 credits/week
export const SUBSCRIPTION_PLANS = [
    {
        id: 'pro',
        stripeId: 'pro',
        name: 'Pro',
        price: 9.99,
        priceLabel: '9,99€/sem.',
        billingLabel: 'par semaine',
        trialDays: 3,
        creditsPerWeek: 2000,
        features: [
            'Rendus réalistes HD illimités',
            'Suppression de fond',
            'Génération IA illimitée',
            'Accès prioritaire aux nouvelles features',
        ],
        identifier: 'com.tattoovision.pro.weekly',
    },
];

export const THE_PLAN = SUBSCRIPTION_PLANS[0];

// One-time credit packs (extra renders on top of subscription)
export const CREDIT_PACKS = [
    {
        id: 'pack_starter',
        name: 'Starter',
        credits: 2000,
        price: 9.99,
        priceLabel: '9,99€',
        renders: 4,
        popular: false,
    },
    {
        id: 'pack_creator',
        name: 'Creator',
        credits: 6000,
        price: 24.99,
        priceLabel: '24,99€',
        renders: 12,
        popular: true,
    },
    {
        id: 'pack_studio',
        name: 'Studio',
        credits: 15000,
        price: 49.99,
        priceLabel: '49,99€',
        renders: 30,
        popular: false,
    },
];

// Cost per feature in credits
export const CREDIT_COSTS = {
    realisticRender: 500,
};
