// The single subscription plan — "Pro" — gives unlimited access to all features.
export const SUBSCRIPTION_PLANS = [
    {
        id: 'pro',
        stripeId: 'pro',
        name: 'Pro',
        price: 9.99,
        priceLabel: '9,99€/sem.',
        billingLabel: 'par semaine',
        trialDays: 3,
        features: [
            'Rendus réalistes illimités',
            'Téléchargement HD sans watermark',
            'Génération de designs IA illimitée',
            'Suppression de fond',
            'Accès prioritaire aux nouvelles features',
        ],
        identifier: 'com.tattoovision.pro.weekly',
    },
];

// The only plan available
export const THE_PLAN = SUBSCRIPTION_PLANS[0];
