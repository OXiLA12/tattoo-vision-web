export const VP_COSTS = {
    REALISTIC_RENDER: 500,
    TATTOO_GENERATION: 200,
    BACKGROUND_REMOVAL: 50,
    EXPORT_HD: 0,
} as const;

// Subscription plans — replace the old VP packs
export const SUBSCRIPTION_PLANS = [
    {
        id: 'plus',
        stripeId: 'plus',
        name: 'Plus',
        creditsPerMonth: 2500, // ~5 renders/month
        price: 6.99,
        priceLabel: '6,99€/sem.',
        billingLabel: 'par semaine',
        popular: false,
        color: '#0091FF',
        features: [
            '5 rendus réalistes / semaine',
            'Téléchargement HD sans watermark',
            'Génération de designs IA',
            'Suppression de fond',
        ],
        identifier: 'com.tattoovision.plus.weekly',
    },
    {
        id: 'pro',
        stripeId: 'pro',
        name: 'Pro',
        creditsPerMonth: 5000, // ~10 renders/month
        price: 9.99,
        priceLabel: '9,99€/sem.',
        billingLabel: 'par semaine',
        popular: true,
        color: '#00DC82',
        features: [
            '10 rendus réalistes / semaine',
            'Téléchargement HD sans watermark',
            'Génération de designs IA illimitée',
            'Suppression de fond',
            'Priorité de traitement',
        ],
        identifier: 'com.tattoovision.pro.weekly',
    },
    {
        id: 'studio',
        stripeId: 'studio',
        name: 'Studio',
        creditsPerMonth: 15000, // ~30 renders/month
        price: 19.99,
        priceLabel: '19,99€/sem.',
        billingLabel: 'par semaine',
        popular: false,
        color: '#a855f7',
        features: [
            '30 rendus réalistes / semaine',
            'Téléchargement HD sans watermark',
            'Génération de designs IA illimitée',
            'Suppression de fond',
            'Priorité maximale',
            'Accès anticipé aux nouvelles fonctionnalités',
        ],
        identifier: 'com.tattoovision.studio.weekly',
    },
];

// Keep VP_PACKS as alias for backward compat (used nowhere new)
export const VP_PACKS = SUBSCRIPTION_PLANS;
