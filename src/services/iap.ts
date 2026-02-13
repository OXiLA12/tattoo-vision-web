# 🍎 Configuration In - App Purchase(IAP) pour iOS

## 🎯 ** Vue d'Ensemble**

Vous allez configurer:
1. ✅ Produits IAP dans App Store Connect
2. ✅ Plugin Capacitor pour IAP
3. ✅ Code pour gérer les achats
4. ✅ Détection de plateforme(iOS = IAP, Web = Stripe)
5. ✅ Validation des achats côté serveur

    ** Temps estimé: 2 - 3 heures **

        ---

## 📋 ** Étape 1 : Créer les Produits IAP **

### ** A.Aller sur App Store Connect **

    1. ** URL ** : https://appstoreconnect.apple.com/
2. ** My Apps ** → Sélectionner votre app(ou créer si pas encore fait)
3. ** Features ** → ** In - App Purchases **
    4. ** Cliquer ** : "+"(Create)

---

### ** B.Créer le Plan PLUS **

** Type de produit:**
    - Sélectionner : ** Auto - Renewable Subscription **

** Reference Name:**
    ```
Tattoo Vision Plus Monthly
```

    ** Product ID:**
        ```
com.votreentreprise.tattoo_vision.plus_monthly
```

        **⚠️ Important:**
            - Utiliser votre vrai Bundle ID
                - Le Product ID doit être unique
                    - Pas d'espaces, utiliser underscore `_`

                        ** Subscription Group:**
                            - Créer un nouveau groupe: `tattoo_vision_subscriptions`

                                ** Subscription Duration:**
                                    - 1 month

                                        ** Price :**
                                            - Sélectionner : €4.99 EUR
                                                - Apple ajustera automatiquement pour les autres pays

                                                    ** Localizations :**
- ** Display Name ** : `Plus Plan`
    - ** Description ** : `Unlimited realistic renders, 600 Vision Points per month`

        ** Review Information:**
- ** Screenshot ** : Upload un screenshot de l'app
    - ** Review Notes ** : `Monthly subscription for Plus features`

        ** Cliquer ** : "Save"

---

### ** C.Créer le Plan PRO **

** Répéter pour PRO:**
- ** Reference Name ** : `Tattoo Vision Pro Monthly`
    - ** Product ID ** : `com.votreentreprise.tattoo_vision.pro_monthly`
        - ** Subscription Group ** : `tattoo_vision_subscriptions`(même groupe)
            - ** Duration ** : 1 month
                - ** Price ** : €9.99 EUR
                    - ** Display Name ** : `Pro Plan`
                        - ** Description ** : `All Plus features + AI generation, 1,200 Vision Points per month`

---

### ** D.Créer le Plan STUDIO **

** Répéter pour STUDIO:**
- ** Reference Name ** : `Tattoo Vision Studio Monthly`
    - ** Product ID ** : `com.votreentreprise.tattoo_vision.studio_monthly`
        - ** Subscription Group ** : `tattoo_vision_subscriptions`
            - ** Duration ** : 1 month
                - ** Price ** : €19.99 EUR
                    - ** Display Name ** : `Studio Plan`
                        - ** Description ** : `All Pro features + priority support, 2,400 Vision Points per month`

---

### ** E.Configurer le Subscription Group **

    1. ** Cliquer ** sur le groupe`tattoo_vision_subscriptions`
2. ** Subscription Ranking ** :
- Drag & drop pour ordonner:
1. STUDIO(€19.99) - Highest
2. PRO(€9.99) - Middle
3. PLUS(€4.99) - Lowest

    ** Pourquoi ?** Apple utilise ce ranking pour les upgrades / downgrades.

---

## 📋 ** Étape 2 : Installer le Plugin Capacitor **

### ** A.Installer @capacitor-community /in -app - purchases **

    ```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

---

### ** B.Configurer iOS(dans Xcode) **

** Après`npx cap open ios` :**

    1. ** Sélectionner le projet ** (icône bleue)
2. ** Target ** → Votre app
3. ** Signing & Capabilities **
    4. ** Cliquer ** : "+ Capability"
5. ** Chercher ** : "In-App Purchase"
6. ** Ajouter ** : In - App Purchase capability

---

## 📋 ** Étape 3 : Créer le Service IAP **

### ** A.Créer le fichier de service **

    <function_calls>
    <invoke name="write_to_file" >
        <parameter name="CodeContent" >import { InAppPurchase2 } from '@capacitor-community/in-app-purchases';
import { Capacitor } from '@capacitor/core';

// Product IDs (remplacer par vos vrais IDs)
export const IAP_PRODUCTS = {
    PLUS: 'com.votreentreprise.tattoo_vision.plus_monthly',
    PRO: 'com.votreentreprise.tattoo_vision.pro_monthly',
    STUDIO: 'com.votreentreprise.tattoo_vision.studio_monthly',
};

// Map IAP products to plan names
export const IAP_TO_PLAN: Record<string, string> = {
    [IAP_PRODUCTS.PLUS]: 'plus',
    [IAP_PRODUCTS.PRO]: 'pro',
    [IAP_PRODUCTS.STUDIO]: 'studio',
};

export class IAPService {
    private static initialized = false;

    /**
     * Initialize IAP (call once at app start)
     */
    static async initialize(): Promise<void> {
        if (this.initialized) return;

        // Only initialize on iOS
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
            console.log('⚠️ IAP: Not on iOS, skipping initialization');
            return;
        }

        try {
            console.log('🍎 IAP: Initializing...');

            // Register products
            await InAppPurchase2.register([
                {
                    id: IAP_PRODUCTS.PLUS,
                    type: InAppPurchase2.ProductType.PAID_SUBSCRIPTION,
                },
                {
                    id: IAP_PRODUCTS.PRO,
                    type: InAppPurchase2.ProductType.PAID_SUBSCRIPTION,
                },
                {
                    id: IAP_PRODUCTS.STUDIO,
                    type: InAppPurchase2.ProductType.PAID_SUBSCRIPTION,
                },
            ]);

            // Set up event listeners
            this.setupListeners();

            // Refresh store
            await InAppPurchase2.refresh();

            this.initialized = true;
            console.log('✅ IAP: Initialized successfully');
        } catch (error) {
            console.error('❌ IAP: Initialization failed', error);
            throw error;
        }
    }

    /**
     * Set up purchase event listeners
     */
    private static setupListeners(): void {
        // When a product is approved
        InAppPurchase2.when().approved(async (product) => {
            console.log('✅ IAP: Product approved', product);

            // Verify the purchase on your server
            await this.verifyPurchase(product);

            // Finish the transaction
            await product.finish();
        });

        // When a product is verified
        InAppPurchase2.when().verified(async (product) => {
            console.log('✅ IAP: Product verified', product);
        });

        // When a product is owned (active subscription)
        InAppPurchase2.when().owned((product) => {
            console.log('✅ IAP: Product owned', product);
        });

        // When a purchase is cancelled
        InAppPurchase2.when().cancelled((product) => {
            console.log('⚠️ IAP: Purchase cancelled', product);
        });

        // When an error occurs
        InAppPurchase2.error((error) => {
            console.error('❌ IAP: Error', error);
        });
    }

    /**
     * Get available products with prices
     */
    static async getProducts(): Promise<any[]> {
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
            return [];
        }

        try {
            const products = await InAppPurchase2.getProducts([
                IAP_PRODUCTS.PLUS,
                IAP_PRODUCTS.PRO,
                IAP_PRODUCTS.STUDIO,
            ]);

            console.log('📦 IAP: Products loaded', products);
            return products;
        } catch (error) {
            console.error('❌ IAP: Failed to load products', error);
            return [];
        }
    }

    /**
     * Purchase a subscription
     */
    static async purchase(productId: string): Promise<void> {
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
            throw new Error('IAP only available on iOS');
        }

        try {
            console.log('🛒 IAP: Purchasing', productId);
            await InAppPurchase2.order(productId);
        } catch (error) {
            console.error('❌ IAP: Purchase failed', error);
            throw error;
        }
    }

    /**
     * Restore purchases
     */
    static async restore(): Promise<void> {
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
            throw new Error('IAP only available on iOS');
        }

        try {
            console.log('🔄 IAP: Restoring purchases...');
            await InAppPurchase2.refresh();
            console.log('✅ IAP: Purchases restored');
        } catch (error) {
            console.error('❌ IAP: Restore failed', error);
            throw error;
        }
    }

    /**
     * Verify purchase on server
     */
    private static async verifyPurchase(product: any): Promise<void> {
        try {
            console.log('🔐 IAP: Verifying purchase on server...');

            // Get the receipt
            const receipt = product.transaction?.appStoreReceipt;
            if (!receipt) {
                throw new Error('No receipt found');
            }

            // Call your Supabase Edge Function to verify
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-iap-purchase`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                        receipt,
                        productId: product.id,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Verification failed');
            }

            const data = await response.json();
            console.log('✅ IAP: Purchase verified', data);
        } catch (error) {
            console.error('❌ IAP: Verification failed', error);
            throw error;
        }
    }

    /**
     * Check if user has active subscription
     */
    static async hasActiveSubscription(): Promise<boolean> {
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
            return false;
        }

        try {
            const products = await this.getProducts();
            return products.some(p => p.owned);
        } catch (error) {
            console.error('❌ IAP: Failed to check subscription', error);
            return false;
        }
    }

    /**
     * Get current subscription plan
     */
    static async getCurrentPlan(): Promise<string | null> {
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
            return null;
        }

        try {
            const products = await this.getProducts();
            const ownedProduct = products.find(p => p.owned);

            if (ownedProduct) {
                return IAP_TO_PLAN[ownedProduct.id] || null;
            }

            return null;
        } catch (error) {
            console.error('❌ IAP: Failed to get current plan', error);
            return null;
        }
    }
}
