# 🍎 Configuration In-App Purchase (IAP) - Guide Complet

## 🎯 **Ce que Vous Allez Faire**

1. ✅ Créer les produits IAP dans App Store Connect
2. ✅ Installer le plugin Capacitor
3. ✅ Implémenter le code IAP
4. ✅ Détecter la plateforme (iOS vs Web)
5. ✅ Créer l'Edge Function de vérification
6. ✅ Tester les achats

---

## 📋 **Étape 1 : Créer les Produits IAP**

### **A. App Store Connect**

1. **URL** : https://appstoreconnect.apple.com/
2. **My Apps** → Votre app
3. **Features** → **In-App Purchases** → **"+"**

### **B. Créer 3 Abonnements**

**PLUS :**
- Type : Auto-Renewable Subscription
- Product ID : `com.votreentreprise.tattoo_vision.plus_monthly`
- Group : `tattoo_vision_subscriptions` (nouveau)
- Duration : 1 month
- Price : €4.99

**PRO :**
- Product ID : `com.votreentreprise.tattoo_vision.pro_monthly`
- Group : `tattoo_vision_subscriptions` (même)
- Duration : 1 month
- Price : €9.99

**STUDIO :**
- Product ID : `com.votreentreprise.tattoo_vision.studio_monthly`
- Group : `tattoo_vision_subscriptions` (même)
- Duration : 1 month
- Price : €19.99

**📝 Noter vos Product IDs !**

---

## 📋 **Étape 2 : Installer le Plugin**

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

---

## 📋 **Étape 3 : Mettre à Jour le Code**

### **A. Fichier Créé**

✅ `src/services/iap.ts` - Service IAP

### **B. Mettre à Jour les Product IDs**

**Dans `src/services/iap.ts`, ligne 4-8 :**

```typescript
export const IAP_PRODUCTS = {
  PLUS: 'com.VOTRE-BUNDLE-ID.plus_monthly',    // ← REMPLACER
  PRO: 'com.VOTRE-BUNDLE-ID.pro_monthly',      // ← REMPLACER
  STUDIO: 'com.VOTRE-BUNDLE-ID.studio_monthly', // ← REMPLACER
};
```

**Remplacer par vos vrais Product IDs !**

---

### **C. Initialiser IAP au Démarrage**

**Fichier : `src/main.tsx`**

Ajouter après les imports :

```typescript
import { IAPService } from './services/iap';
import { Capacitor } from '@capacitor/core';

// Initialize IAP on iOS
if (Capacitor.getPlatform() === 'ios') {
  IAPService.initialize().catch(console.error);
}
```

---

### **D. Modifier PlanPricingModal**

**Fichier : `src/components/PlanPricingModal.tsx`**

Ajouter la détection de plateforme :

```typescript
import { Capacitor } from '@capacitor/core';
import { IAPService } from '../services/iap';

// ... dans le composant

const handleUpgrade = async (plan: string) => {
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  if (isIOS) {
    // Use IAP on iOS
    await handleIAPPurchase(plan);
  } else {
    // Use Stripe on Web
    await handleStripePurchase(plan);
  }
};

const handleIAPPurchase = async (plan: string) => {
  try {
    setLoading(true);
    
    // Get the product ID
    const productId = plan === 'plus' 
      ? IAPService.IAP_PRODUCTS.PLUS
      : plan === 'pro'
      ? IAPService.IAP_PRODUCTS.PRO
      : IAPService.IAP_PRODUCTS.STUDIO;
    
    // Purchase
    await IAPService.purchase(productId);
    
    // Success handled by IAP listeners
    onClose();
  } catch (error) {
    console.error('IAP purchase failed:', error);
    setError('Purchase failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handleStripePurchase = async (plan: string) => {
  // Votre code Stripe existant
  // ...
};
```

---

## 📋 **Étape 4 : Créer l'Edge Function de Vérification**

### **A. Créer le Fichier**

```bash
mkdir supabase/functions/verify-iap-purchase
```

**Fichier : `supabase/functions/verify-iap-purchase/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { receipt, productId } = await req.json();

    // Verify receipt with Apple
    const isValid = await verifyAppleReceipt(receipt);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid receipt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine plan from product ID
    const plan = productId.includes('plus') ? 'plus'
      : productId.includes('pro') ? 'pro'
      : productId.includes('studio') ? 'studio'
      : 'free';

    // Update user's plan in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Add Vision Points based on plan
    const points = plan === 'plus' ? 600
      : plan === 'pro' ? 1200
      : plan === 'studio' ? 2400
      : 0;

    await supabase.rpc('add_vision_points', {
      user_id: user.id,
      amount: points,
    });

    return new Response(
      JSON.stringify({ success: true, plan, points }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function verifyAppleReceipt(receipt: string): Promise<boolean> {
  // Use Apple's production or sandbox server
  const url = 'https://buy.itunes.apple.com/verifyReceipt'; // Production
  // const url = 'https://sandbox.itunes.apple.com/verifyReceipt'; // Sandbox for testing

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receipt,
      'password': Deno.env.get('APPLE_SHARED_SECRET'), // From App Store Connect
    }),
  });

  const data = await response.json();
  
  // Status 0 = valid
  // Status 21007 = sandbox receipt sent to production (retry with sandbox)
  if (data.status === 21007) {
    // Retry with sandbox
    const sandboxResponse = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': Deno.env.get('APPLE_SHARED_SECRET'),
      }),
    });
    const sandboxData = await sandboxResponse.json();
    return sandboxData.status === 0;
  }

  return data.status === 0;
}
```

---

### **B. Déployer la Fonction**

```bash
npx supabase functions deploy verify-iap-purchase
```

---

### **C. Ajouter le Shared Secret**

**App Store Connect :**
1. **My Apps** → Votre app
2. **Features** → **In-App Purchases**
3. **App-Specific Shared Secret** → **Generate**
4. **📝 Copier le secret**

**Supabase Dashboard :**
1. **Settings** → **Edge Functions** → **Secrets**
2. **+ New secret**
3. Name : `APPLE_SHARED_SECRET`
4. Value : Le secret copié
5. **Save**

---

## 📋 **Étape 5 : Tester les Achats**

### **A. Créer un Compte Sandbox**

**App Store Connect :**
1. **Users and Access** → **Sandbox Testers**
2. **"+"** → Create New Sandbox Tester
3. **Remplir** :
   - Email : test@example.com (fictif)
   - Password : TestPass123!
   - Country : France
4. **Save**

### **B. Tester sur iPhone**

**Sur votre iPhone (physique ou simulateur) :**

1. **Settings** → **App Store** → **Sandbox Account**
2. **Se connecter** avec le compte sandbox

**Dans votre app :**
1. Aller sur Profile → Plans
2. Cliquer "Upgrade" sur PLUS
3. **Vérifier** : Prix affiché (€4.99)
4. **Confirmer** l'achat
5. **Vérifier** : Plan mis à jour

**⚠️ Important :**
- Les achats sandbox sont GRATUITS
- Pas de vraie carte bancaire
- Seulement sur device/simulateur (pas sur web)

---

## 📋 **Étape 6 : Gérer les 2 Plateformes**

### **A. Créer un Service Unifié**

**Fichier : `src/services/payment.ts`**

```typescript
import { Capacitor } from '@capacitor/core';
import { IAPService } from './iap';
import { createCheckoutSession } from '../lib/stripe'; // Votre fonction Stripe existante

export class PaymentService {
  /**
   * Purchase a subscription (auto-detects platform)
   */
  static async subscribe(plan: 'plus' | 'pro' | 'studio'): Promise<void> {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'ios') {
      // Use IAP on iOS
      return this.subscribeIAP(plan);
    } else {
      // Use Stripe on Web/Android
      return this.subscribeStripe(plan);
    }
  }

  private static async subscribeIAP(plan: string): Promise<void> {
    const productId = plan === 'plus' 
      ? IAPService.IAP_PRODUCTS.PLUS
      : plan === 'pro'
      ? IAPService.IAP_PRODUCTS.PRO
      : IAPService.IAP_PRODUCTS.STUDIO;
    
    await IAPService.purchase(productId);
  }

  private static async subscribeStripe(plan: string): Promise<void> {
    // Votre logique Stripe existante
    await createCheckoutSession(plan);
  }

  /**
   * Manage subscription (portal)
   */
  static async manageSubscription(): Promise<void> {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'ios') {
      // Open iOS subscription management
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else {
      // Open Stripe portal
      // Votre logique existante
    }
  }

  /**
   * Check if platform supports IAP
   */
  static isIAP(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }
}
```

---

### **B. Utiliser dans les Composants**

**Partout où vous avez des achats, remplacer par :**

```typescript
import { PaymentService } from '../services/payment';

// Au lieu de appeler Stripe directement
const handleUpgrade = async (plan: string) => {
  try {
    await PaymentService.subscribe(plan);
  } catch (error) {
    console.error('Purchase failed:', error);
  }
};
```

---

## 📋 **Checklist Complète**

### **App Store Connect**

- [ ] App créée
- [ ] 3 produits IAP créés (PLUS, PRO, STUDIO)
- [ ] Product IDs notés
- [ ] Subscription Group configuré
- [ ] Shared Secret généré

### **Code**

- [ ] Plugin installé (`@capacitor-community/in-app-purchases`)
- [ ] `src/services/iap.ts` créé
- [ ] Product IDs mis à jour dans le code
- [ ] IAP initialisé dans `main.tsx`
- [ ] `PlanPricingModal` mis à jour
- [ ] Service unifié créé (`payment.ts`)

### **Backend**

- [ ] Edge Function `verify-iap-purchase` créée
- [ ] Fonction déployée
- [ ] `APPLE_SHARED_SECRET` ajouté dans Supabase

### **Tests**

- [ ] Compte sandbox créé
- [ ] Achat test réussi
- [ ] Plan mis à jour
- [ ] Vision Points ajoutés

---

## 🚀 **Prochaines Étapes**

**Maintenant que IAP est configuré :**

1. **Tester sur iOS** (device ou simulateur)
2. **Garder Stripe pour le web**
3. **Build l'app iOS**
4. **Soumettre à Apple**

---

## 📞 **Besoin d'Aide ?**

**Apple IAP Docs :**
- https://developer.apple.com/in-app-purchase/

**Plugin Capacitor :**
- https://github.com/Cap-go/capacitor-purchases

---

**Voulez-vous que je vous aide avec une étape spécifique ?** 😊
