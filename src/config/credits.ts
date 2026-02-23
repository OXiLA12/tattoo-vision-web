export const VP_COSTS = {
    REALISTIC_RENDER: 500,
    TATTOO_GENERATION: 200,
    BACKGROUND_REMOVAL: 50,
    EXPORT_HD: 0,
} as const;

export const VP_PACKS = [
    {
        id: 'vp_unlock_single',
        stripeId: 'unlock_single_render',
        name: 'Single Unlock',
        credits: 600,
        price: 1.99,
        popular: false,
        identifier: 'com.tattoovision.vp.unlock_single',
    },
    {
        id: 'vp_pack_3000',
        stripeId: 'starter_pack_3000vp',
        name: 'Starter',
        credits: 3000,
        price: 4.99,
        popular: false,
        identifier: 'com.tattoovision.vp.3000',
    },
    {
        id: 'vp_pack_7000',
        stripeId: 'popular_pack_7000vp',
        name: 'Popular',
        credits: 7000,
        price: 9.99,
        popular: true,
        identifier: 'com.tattoovision.vp.7000',
    },
    {
        id: 'vp_pack_15000',
        stripeId: 'pro_pack_15000vp',
        name: 'Pro',
        credits: 15000,
        price: 19.99,
        popular: false,
        identifier: 'com.tattoovision.vp.15000',
    },
    {
        id: 'vp_pack_40000',
        stripeId: 'studio_pack_40000vp',
        name: 'Studio',
        credits: 40000,
        price: 39.99,
        popular: false,
        identifier: 'com.tattoovision.vp.40000',
    },
];
