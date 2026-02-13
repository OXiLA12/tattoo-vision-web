# 🍎 Configuration IAP - Solution Simplifiée

## 🎯 **Changement de Stratégie**

Le package `@capacitor-community/in-app-purchases` n'existe pas.

**2 Options :**

### **Option A : RevenueCat (RECOMMANDÉ)**

RevenueCat est le standard de l'industrie pour IAP.

**Avantages :**
- ✅ Gère IAP iOS + Android
- ✅ Analytics intégrés
- ✅ Webhooks automatiques
- ✅ Dashboard pour voir les revenus
- ✅ Gratuit jusqu'à $10k/mois

**Installation :**
```bash
npm install @revenuecat/purchases-capacitor
npx cap sync
```

### **Option B : Plugin Capacitor Natif**

Utiliser le plugin Capacitor officiel (plus complexe).

---

## 🚀 **Je Recommande RevenueCat**

**Pourquoi ?**
- Plus simple à implémenter
- Gère automatiquement la vérification des receipts
- Dashboard pour suivre les revenus
- Support iOS + Android + Web
- Utilisé par des milliers d'apps

---

## 📋 **Setup RevenueCat (30 min)**

### **Étape 1 : Créer un Compte**

1. **Aller sur** : https://www.revenuecat.com/
2. **Sign up** (gratuit)
3. **Créer un projet** : "Tattoo Vision"

### **Étape 2 : Configurer iOS**

**Dans RevenueCat Dashboard :**

1. **Project Settings** → **Apps**
2. **+ New App**
3. **Platform** : iOS
4. **App Name** : Tattoo Vision
5. **Bundle ID** : `com.votreentreprise.tattoo-vision`
6. **App Store Connect API Key** :
   - Aller sur App Store Connect
   - Users and Access → Keys → App Store Connect API
   - Generate new key
   - Upload dans RevenueCat

### **Étape 3 : Créer les Produits**

**Dans RevenueCat Dashboard :**

1. **Products** → **+ New**
2. **Identifier** : `plus_monthly`
3. **App Store Product ID** : `com.votreentreprise.tattoo_vision.plus_monthly`
4. **Type** : Subscription
5. **Duration** : 1 month

Répéter pour PRO et STUDIO.

### **Étape 4 : Créer les Offerings**

**Offerings = Groupes de produits à afficher**

1. **Offerings** → **+ New**
2. **Identifier** : `default`
3. **Add packages** :
   - PLUS (€4.99/month)
   - PRO (€9.99/month)
   - STUDIO (€19.99/month)

### **Étape 5 : Récupérer les Clés**

**Project Settings → API Keys :**

📝 **Noter :**
- **Public API Key** : `appl_xxx` (iOS)
- **Secret API Key** : `sk_xxx` (backend)

---

## 💻 **Code avec RevenueCat**

### **Installation :**

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync
```

### **Service IAP Simplifié :**

```typescript
// src/services/iap-revenuecat.ts
import Purchases, { LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export class IAPService {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized || Capacitor.getPlatform() !== 'ios') return;

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({
        apiKey: 'appl_YOUR_KEY_HERE', // ← Remplacer
      });

      this.initialized = true;
      console.log('✅ RevenueCat initialized');
    } catch (error) {
      console.error('❌ RevenueCat init failed:', error);
    }
  }

  static async getOfferings(): Promise<any> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  static async purchase(packageId: string): Promise<void> {
    try {
      const offerings = await this.getOfferings();
      const pkg = offerings?.availablePackages.find(
        (p: any) => p.identifier === packageId
      );

      if (!pkg) throw new Error('Package not found');

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      
      // Check if purchase was successful
      if (customerInfo.entitlements.active['premium']) {
        console.log('✅ Purchase successful!');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  static async restore(): Promise<void> {
    try {
      await Purchases.restorePurchases();
      console.log('✅ Purchases restored');
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  static async getCurrentPlan(): Promise<string | null> {
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      
      if (customerInfo.entitlements.active['studio']) return 'studio';
      if (customerInfo.entitlements.active['pro']) return 'pro';
      if (customerInfo.entitlements.active['plus']) return 'plus';
      
      return 'free';
    } catch (error) {
      console.error('Failed to get plan:', error);
      return null;
    }
  }
}
```

---

## 🎯 **Quelle Option Choisir ?**

### **Je Recommande : RevenueCat**

**Pourquoi ?**
- ✅ Plus simple (30 min vs 3 heures)
- ✅ Moins de code
- ✅ Dashboard analytics
- ✅ Gère automatiquement les webhooks
- ✅ Support iOS + Android
- ✅ Gratuit jusqu'à $10k/mois

**Inconvénient :**
- Service tiers (mais très fiable)

---

## 🤔 **Votre Décision ?**

**Option A : RevenueCat** (recommandé)
→ Je vous aide à configurer (30 min)

**Option B : IAP Natif**
→ Plus complexe, mais 100% contrôle (3h)

**Option C : Stripe uniquement**
→ Publier comme PWA (pas App Store)

---

**Que préférez-vous ?** 😊
