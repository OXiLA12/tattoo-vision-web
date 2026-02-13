export const VP_COSTS = {
    REALISTIC_RENDER: 500,
    TATTOO_GENERATION: 200,
    BACKGROUND_REMOVAL: 50, // Optional cost
    EXPORT_HD: 0, // Free for now?
} as const;

export const VP_PACKS = [
    {
        id: 'starter_pack_3000vp',
        name: 'Starter Pack',
        credits: 3000,
        price: 4.99,
        popular: false,
        identifier: 'com.tattoovision.vp.3000', // Example IAP ID
    },
    {
        id: 'popular_pack_7000vp',
        name: 'Popular Pack',
        credits: 7000,
        price: 9.99,
        popular: true,
        identifier: 'com.tattoovision.vp.7000',
    },
    {
        id: 'pro_pack_15000vp',
        name: 'Pro Pack',
        credits: 15000,
        price: 19.99,
        popular: false,
        identifier: 'com.tattoovision.vp.15000',
    },
    {
        id: 'studio_pack_40000vp',
        name: 'Studio Pack',
        credits: 40000,
        price: 39.99,
        popular: false,
        identifier: 'com.tattoovision.vp.40000',
    },
];
