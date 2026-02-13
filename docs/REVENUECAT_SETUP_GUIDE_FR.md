# Guide Complet de Configuration RevenueCat pour Tattoo Vision

## 📋 Prérequis

- [ ] Compte RevenueCat créé sur https://app.revenuecat.com
- [ ] Compte Apple Developer (pour iOS)
- [ ] Compte Google Play Console (pour Android)
- [ ] Accès à ton projet Supabase

---

## 🎯 Étape 1 : Configuration du Dashboard RevenueCat

### 1.1 Créer un Projet
1. Connecte-toi sur https://app.revenuecat.com
2. Clique sur **"Create New Project"**
3. Nom du projet : `Tattoo Vision`
4. Clique sur **"Create"**

### 1.2 Ajouter l'Application iOS
1. Dans ton projet, va dans **"Apps"** → **"+ New"**
2. Sélectionne **"iOS"**
3. **Bundle ID** : `com.tattoovision.app` (doit correspondre à `capacitor.config.ts`)
4. **App Name** : `Tattoo Vision`
5. **App Store Connect** :
   - Connecte ton compte Apple Developer
   - Ou entre manuellement le **Shared Secret** depuis App Store Connect
   - (Trouve-le dans App Store Connect → App → General → App Information → Shared Secret)
6. Clique sur **"Save"**

### 1.3 Ajouter l'Application Android
1. Dans **"Apps"** → **"+ New"**
2. Sélectionne **"Android"**
3. **Package Name** : `com.tattoovision.app`
4. **App Name** : `Tattoo Vision`
5. **Google Play Service Account** :
   - Télécharge le fichier JSON depuis Google Play Console
   - Upload-le dans RevenueCat
6. Clique sur **"Save"**

---

## 💰 Étape 2 : Créer les Produits

### 2.1 Créer les Produits dans App Store Connect (iOS)

1. Va sur https://appstoreconnect.apple.com
2. **My Apps** → Sélectionne ton app → **"In-App Purchases"**
3. Clique sur **"+"** pour créer chaque produit :

#### Abonnements (Auto-Renewable Subscriptions)
Crée un **Subscription Group** nommé "Tattoo Vision Pro"

| Product ID | Type | Price | Duration |
|------------|------|-------|----------|
| `plus_monthly` | Auto-Renewable | 9.99€ | 1 Month |
| `plus_yearly` | Auto-Renewable | 99.99€ | 1 Year |
| `pro_monthly` | Auto-Renewable | 19.99€ | 1 Month |
| `pro_yearly` | Auto-Renewable | 199.99€ | 1 Year |
| `studio_monthly` | Auto-Renewable | 39.99€ | 1 Month |
| `studio_yearly` | Auto-Renewable | 399.99€ | 1 Year |

#### Crédits (Consumables)
| Product ID | Type | Price |
|------------|------|-------|
| `credits_10` | Consumable | 5.00€ |
| `credits_50` | Consumable | 20.00€ |
| `credits_100` | Consumable | 35.00€ |

4. Pour chaque produit, remplis :
   - **Reference Name** : Nom descriptif (ex: "Plus Monthly")
   - **Product ID** : Utilise exactement les IDs ci-dessus
   - **Price** : Configure le prix
   - **Localization** : Ajoute français et anglais

### 2.2 Créer les Produits dans Google Play Console (Android)

1. Va sur https://play.google.com/console
2. Sélectionne ton app → **"Monetization"** → **"In-app products"**
3. Crée les mêmes produits avec les mêmes IDs
4. Configure les prix en EUR

---

## 🔗 Étape 3 : Configurer RevenueCat

### 3.1 Créer l'Entitlement
1. Dans RevenueCat, va dans **"Entitlements"** → **"+ New"**
2. **Identifier** : `Tattoo Vision Pro`
3. Clique sur **"Create"**

### 3.2 Créer les Produits dans RevenueCat
1. Va dans **"Products"** → **"+ New"**
2. Pour chaque produit créé dans App Store/Play Store :
   - **Identifier** : Utilise le même Product ID (ex: `plus_monthly`)
   - **Type** : Subscription ou Non-Consumable selon le cas
   - **App Store Product ID** : Sélectionne le produit iOS correspondant
   - **Play Store Product ID** : Sélectionne le produit Android correspondant
   - **Attach to Entitlement** : Sélectionne `Tattoo Vision Pro` (pour les abonnements uniquement)
3. Répète pour tous les produits

### 3.3 Créer une Offering
1. Va dans **"Offerings"** → **"+ New"**
2. **Identifier** : `default`
3. **Description** : `Default Offering`
4. Ajoute tous les packages :
   - Clique sur **"+ Add Package"**
   - **Identifier** : `plus_monthly`, `plus_yearly`, `pro_monthly`, `pro_yearly`, `studio_monthly`, `studio_yearly`
   - **Product** : Sélectionne le produit correspondant
   - Répète pour tous les produits
5. Clique sur **"Save"**
6. **Important** : Marque cette offering comme **"Current"**

### 3.4 Créer un Paywall (Optionnel mais Recommandé)
1. Va dans **"Paywalls"** → **"+ New"**
2. Choisis un template (ex: "Simple")
3. Personnalise :
   - **Title** : "Débloquez Tattoo Vision Pro"
   - **Subtitle** : "Créez des tatouages illimités avec l'IA"
   - **Call to Action** : "Commencer"
4. Associe l'offering `default`
5. Clique sur **"Save"** et marque comme **"Default"**

---

## 🔔 Étape 4 : Configurer le Webhook

### 4.1 Déployer la Fonction Edge Supabase
Ouvre un terminal dans ton projet et exécute :

```bash
# 1. Connecte-toi à Supabase
supabase login

# 2. Déploie la fonction webhook
supabase functions deploy revenuecat-webhook --no-verify-jwt

# 3. Crée un secret pour sécuriser le webhook
supabase secrets set REVENUECAT_WEBHOOK_SECRET="ton_secret_ultra_securise_123"
```

> **Note** : Remplace `ton_secret_ultra_securise_123` par une chaîne aléatoire sécurisée

### 4.2 Récupérer l'URL du Webhook
Après le déploiement, tu verras une URL comme :
```
https://abcdefgh.supabase.co/functions/v1/revenuecat-webhook
```

### 4.3 Configurer le Webhook dans RevenueCat
1. Dans RevenueCat, va dans **"Integrations"** → **"Webhooks"**
2. Clique sur **"+ Add Webhook"**
3. **URL** : Colle l'URL de ta fonction Supabase
4. **Authorization Header** :
   - Key : `Authorization`
   - Value : Le même secret que tu as défini (`ton_secret_ultra_securise_123`)
5. **Events** : Sélectionne tous les événements importants :
   - ✅ `INITIAL_PURCHASE`
   - ✅ `RENEWAL`
   - ✅ `CANCELLATION`
   - ✅ `EXPIRATION`
   - ✅ `PRODUCT_CHANGE`
6. Clique sur **"Save"**

### 4.4 Tester le Webhook
1. Dans RevenueCat, clique sur **"Send Test"** à côté de ton webhook
2. Vérifie les logs Supabase :
```bash
supabase functions logs revenuecat-webhook
```

---

## 🧪 Étape 5 : Tester l'Intégration

### 5.1 Test sur iOS Simulator
```bash
# Ouvre le projet iOS
npx cap open ios

# Dans Xcode :
# 1. Sélectionne un simulateur
# 2. Clique sur Run
# 3. Dans l'app, va dans Profile → Upgrade
# 4. Le Paywall RevenueCat devrait s'afficher
# 5. Utilise Features → StoreKit → Manage Transactions pour simuler un achat
```

### 5.2 Test sur Android Emulator
```bash
# Ouvre le projet Android
npx cap open android

# Dans Android Studio :
# 1. Lance un émulateur
# 2. Clique sur Run
# 3. Teste l'achat (nécessite un compte de test configuré dans Play Console)
```

### 5.3 Vérifier dans RevenueCat
1. Va dans **"Customers"** dans RevenueCat
2. Tu devrais voir ton utilisateur test apparaître
3. Vérifie que l'entitlement `Tattoo Vision Pro` est actif

---

## ✅ Checklist Finale

- [ ] Projet RevenueCat créé
- [ ] Apps iOS et Android ajoutées
- [ ] Tous les produits créés dans App Store Connect
- [ ] Tous les produits créés dans Google Play Console
- [ ] Entitlement `Tattoo Vision Pro` créé
- [ ] Tous les produits ajoutés dans RevenueCat
- [ ] Offering `default` créée et marquée comme Current
- [ ] Paywall créé et configuré
- [ ] Fonction webhook déployée sur Supabase
- [ ] Webhook configuré dans RevenueCat
- [ ] Test réussi sur iOS
- [ ] Test réussi sur Android

---

## 🆘 Dépannage

### Problème : "No products available"
- Vérifie que les Product IDs sont **exactement identiques** partout
- Attends 2-3 heures après création des produits (délai Apple/Google)
- Vérifie que l'offering est bien marquée comme "Current"

### Problème : "Webhook not receiving events"
- Vérifie l'URL du webhook (pas d'espace, HTTPS)
- Vérifie que le secret correspond exactement
- Regarde les logs : `supabase functions logs revenuecat-webhook`

### Problème : "Entitlement not unlocking"
- Vérifie que les produits sont bien attachés à l'entitlement
- Vérifie le webhook dans les logs Supabase
- Force un refresh : `Purchases.getCustomerInfo()`

---

## 📞 Support

- **RevenueCat Docs** : https://www.revenuecat.com/docs
- **Supabase Docs** : https://supabase.com/docs
- **Apple Docs** : https://developer.apple.com/in-app-purchase/

Bon courage ! 🚀
