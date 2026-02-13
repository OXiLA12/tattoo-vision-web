# 🚀 Guide de Démarrage Rapide - RevenueCat iOS

## ✅ Ce qui est déjà fait

### Configuration RevenueCat
- ✅ 3 Produits Apple créés dans App Store Connect
- ✅ 1 Offering `default` configurée
- ✅ 3 Packages : `monthly_plus`, `monthly_pro`, `monthly_studio`
- ✅ 3 Entitlements : `plus`, `pro`, `studio`
- ✅ Chaque package lié à son entitlement

### Code Implémenté
- ✅ `SubscriptionContext` - Gestion globale des abonnements
- ✅ `usePayments` Hook - Interface RevenueCat SDK
- ✅ `Paywall` Component - Écran d'abonnement natif
- ✅ `featureGating` Utils - Contrôle d'accès aux fonctionnalités
- ✅ Webhook RevenueCat → Supabase

---

## 📋 Étapes Restantes

### 1. Vérifier la Configuration RevenueCat

```bash
# Connectez-vous sur https://app.revenuecat.com
```

**Vérifier :**
- [ ] L'offering `default` est marquée comme **"Current"**
- [ ] Les 3 packages sont visibles dans l'offering
- [ ] Chaque package est lié au bon entitlement :
  - `monthly_plus` → entitlement `plus`
  - `monthly_pro` → entitlement `pro`
  - `monthly_studio` → entitlement `studio`

### 2. Déployer le Webhook Supabase

```bash
# Dans le terminal, à la racine du projet
cd c:\Users\Kali\Desktop\tattoo-vision-updated\project

# Se connecter à Supabase
supabase login

# Déployer la fonction webhook
supabase functions deploy revenuecat-webhook --no-verify-jwt

# Créer un secret pour sécuriser le webhook
supabase secrets set REVENUECAT_WEBHOOK_SECRET="votre_secret_ultra_securise_123"
```

**Note :** Remplacez `votre_secret_ultra_securise_123` par une chaîne aléatoire sécurisée.

### 3. Configurer le Webhook dans RevenueCat

1. Allez sur https://app.revenuecat.com
2. **Integrations** → **Webhooks** → **+ Add Webhook**
3. **URL** : `https://[votre-projet].supabase.co/functions/v1/revenuecat-webhook`
4. **Authorization Header** :
   - Key : `Authorization`
   - Value : Le même secret que l'étape 2
5. **Events** : Sélectionnez tous :
   - ✅ INITIAL_PURCHASE
   - ✅ RENEWAL
   - ✅ CANCELLATION
   - ✅ EXPIRATION
   - ✅ PRODUCT_CHANGE
6. Cliquez sur **Save**
7. Cliquez sur **Send Test** pour tester

### 4. Tester sur iOS Simulator

```bash
# Ouvrir le projet iOS
npx cap sync ios
npx cap open ios
```

Dans Xcode :
1. Sélectionnez un simulateur (iPhone 15 Pro recommandé)
2. Cliquez sur **Run** (▶️)
3. Dans l'app, naviguez vers une fonctionnalité payante
4. Le Paywall devrait s'afficher automatiquement
5. Utilisez **Features → StoreKit → Manage Transactions** pour simuler un achat

### 5. Vérifier dans RevenueCat

1. Allez sur https://app.revenuecat.com
2. **Customers** → Recherchez votre utilisateur (ID Supabase)
3. Vérifiez que l'entitlement est actif
4. Vérifiez la date d'expiration

---

## 🎯 Utilisation dans le Code

### Exemple 1 : Vérifier l'Accès à une Fonctionnalité

```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

function MyFeature() {
  const { activeEntitlement, showPaywall } = useSubscription();
  
  const handleAction = () => {
    // Vérifier si l'utilisateur a au moins 'plus'
    if (!activeEntitlement) {
      showPaywall();
      return;
    }
    
    // Continuer avec l'action
    performAction();
  };
  
  return <button onClick={handleAction}>Action</button>;
}
```

### Exemple 2 : Gating Avancé avec requiresEntitlement

```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

function ProFeature() {
  const { requiresEntitlement } = useSubscription();
  
  const handleProAction = async () => {
    // Vérifie automatiquement et affiche le paywall si nécessaire
    const hasAccess = await requiresEntitlement('pro');
    
    if (hasAccess) {
      // L'utilisateur a 'pro' ou 'studio'
      await performProAction();
    }
    // Sinon, le paywall s'affiche automatiquement
  };
  
  return <button onClick={handleProAction}>Pro Action</button>;
}
```

### Exemple 3 : Afficher le Plan Actuel

```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

function ProfileScreen() {
  const { activeEntitlement, plan } = useSubscription();
  
  return (
    <div>
      <h2>Votre Plan</h2>
      <p>
        {activeEntitlement 
          ? `${activeEntitlement.toUpperCase()} (${plan})`
          : 'Free'}
      </p>
    </div>
  );
}
```

---

## 🔧 Métadonnées Apple Manquantes

### À Configurer dans App Store Connect

Pour chaque produit, allez sur https://appstoreconnect.apple.com :

#### 1. `com.tattoovision.app.plus_monthly`

**Français :**
- **Nom d'affichage** : Plus
- **Description** : Accédez à 6 000 Vision Points par mois et débloquez la génération AI illimitée, le rendu réaliste et toutes les fonctionnalités essentielles.

**Anglais :**
- **Display Name** : Plus
- **Description** : Get 6,000 Vision Points per month and unlock unlimited AI generation, realistic rendering, and all essential features.

#### 2. `com.tattoovision.app.pro2_monthly`

**Français :**
- **Nom d'affichage** : Pro
- **Description** : Accédez à 15 000 Vision Points par mois avec toutes les fonctionnalités avancées, le traitement prioritaire et une licence commerciale.

**Anglais :**
- **Display Name** : Pro
- **Description** : Get 15,000 Vision Points per month with all advanced features, priority processing, and commercial license.

#### 3. `com.tattoovision.app.studio1_monthly`

**Français :**
- **Nom d'affichage** : Studio
- **Description** : Accédez à 40 000 Vision Points par mois pour un usage professionnel intensif avec collaboration d'équipe et accès API.

**Anglais :**
- **Display Name** : Studio
- **Description** : Get 40,000 Vision Points per month for intensive professional use with team collaboration and API access.

### Autres Métadonnées Requises

- **Subscription Group** : "Tattoo Vision Subscriptions"
- **Subscription Duration** : 1 Month (pour tous)
- **Free Trial** : Optionnel (recommandé : 7 jours)
- **Introductory Offer** : Optionnel

---

## 🐛 Dépannage Rapide

### Problème : "No packages available"

```typescript
// Vérifier dans la console
console.log('Packages:', packages);
console.log('Initialized:', initialized);
```

**Solutions :**
1. Vérifier que l'offering est "Current" dans RevenueCat
2. Attendre 2-3h après création des produits Apple
3. Vérifier que les Product IDs correspondent exactement

### Problème : "Purchase failed"

**Solutions :**
1. Vérifier les logs Xcode
2. Tester avec un compte Sandbox différent
3. Vérifier que les produits sont "Ready to Submit" dans App Store Connect

### Problème : "Entitlement not unlocking"

```bash
# Vérifier les logs du webhook
supabase functions logs revenuecat-webhook --tail
```

**Solutions :**
1. Vérifier que le webhook est configuré
2. Vérifier que le secret correspond
3. Tester le webhook avec "Send Test" dans RevenueCat

---

## 📊 Prochaines Étapes

### Avant TestFlight
- [ ] Tester tous les plans (Plus, Pro, Studio)
- [ ] Tester la restauration des achats
- [ ] Tester le changement de plan (upgrade/downgrade)
- [ ] Vérifier que les Vision Points sont correctement attribués
- [ ] Vérifier que les fonctionnalités sont correctement débloquées

### Avant Production
- [ ] Compléter toutes les métadonnées Apple (FR + EN)
- [ ] Ajouter des screenshots du paywall
- [ ] Mettre à jour la politique de confidentialité
- [ ] Mettre à jour les conditions d'utilisation
- [ ] Configurer le support client
- [ ] Activer le monitoring RevenueCat

---

## 📞 Ressources

- **Documentation RevenueCat** : https://www.revenuecat.com/docs
- **Guide Complet** : `docs/REVENUECAT_IOS_IMPLEMENTATION.md`
- **Guide Setup** : `docs/REVENUECAT_SETUP_GUIDE_FR.md`

---

**Dernière mise à jour** : 26 janvier 2026
