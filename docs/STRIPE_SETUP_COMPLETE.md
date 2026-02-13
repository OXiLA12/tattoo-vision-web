# 💳 Configuration Complète du Système de Paiement Stripe

## 🎯 **Vue d'Ensemble**

Vous allez configurer :
1. ✅ Compte Stripe
2. ✅ Produits et Prix
3. ✅ Webhooks
4. ✅ Clés API
5. ✅ Test des paiements

**Temps estimé : 30-45 minutes**

---

## 📋 **Étape 1 : Créer un Compte Stripe**

### **A. S'inscrire sur Stripe**

1. **Aller sur** : https://stripe.com/
2. **Cliquer** : "Start now" ou "Sign up"
3. **Remplir** :
   - Email
   - Nom complet
   - Pays : France
   - Mot de passe
4. **Vérifier** votre email

### **B. Activer votre Compte**

**Stripe vous demandera :**
- Informations sur votre entreprise
- Numéro SIRET (si entreprise)
- Coordonnées bancaires (pour recevoir les paiements)
- Pièce d'identité

**⚠️ Important :**
- Vous pouvez tester SANS activer le compte
- Pour recevoir de vrais paiements, vous devez activer

---

## 📋 **Étape 2 : Créer les Produits**

### **A. Aller dans Products**

1. **Dashboard Stripe** : https://dashboard.stripe.com/
2. **Menu** : Products → **+ Add product**

### **B. Créer le Plan PLUS**

**Informations du produit :**
- **Name** : `Tattoo Vision Plus`
- **Description** : `Unlimited realistic renders, 600 Vision Points/month`
- **Image** : Upload un logo (optionnel)

**Pricing :**
- **Pricing model** : Standard pricing
- **Price** : `4.99` EUR
- **Billing period** : Monthly
- **Price description** : `Plus Plan - Monthly`

**Cliquer** : "Save product"

**📝 Noter le Price ID** : `price_xxxxxxxxxxxxx`

---

### **C. Créer le Plan PRO**

**Répéter pour PRO :**
- **Name** : `Tattoo Vision Pro`
- **Description** : `All Plus features + AI generation, 1,200 Vision Points/month`
- **Price** : `9.99` EUR
- **Billing period** : Monthly

**📝 Noter le Price ID** : `price_xxxxxxxxxxxxx`

---

### **D. Créer le Plan STUDIO**

**Répéter pour STUDIO :**
- **Name** : `Tattoo Vision Studio`
- **Description** : `All Pro features + priority support, 2,400 Vision Points/month`
- **Price** : `19.99` EUR
- **Billing period** : Monthly

**📝 Noter le Price ID** : `price_xxxxxxxxxxxxx`

---

## 📋 **Étape 3 : Configurer les Webhooks**

### **A. Pourquoi les Webhooks ?**

Les webhooks permettent à Stripe de notifier votre app quand :
- ✅ Un paiement réussit
- ✅ Un abonnement est créé
- ✅ Un abonnement est annulé
- ✅ Un paiement échoue

### **B. Créer le Webhook**

1. **Dashboard Stripe** → **Developers** → **Webhooks**
2. **Cliquer** : "+ Add endpoint"

**Endpoint URL :**
```
https://votre-projet-id.supabase.co/functions/v1/stripe-webhook
```

**⚠️ Remplacer** `votre-projet-id` par votre vrai Project ID Supabase

**Events to send :**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**Cliquer** : "Add endpoint"

### **C. Récupérer le Webhook Secret**

**Après création :**
1. Cliquer sur votre webhook
2. **Signing secret** : `whsec_xxxxxxxxxxxxx`
3. **📝 Noter ce secret** (vous en aurez besoin)

---

## 📋 **Étape 4 : Récupérer les Clés API**

### **A. Clés de Test**

**Pour tester sans vrais paiements :**

1. **Dashboard** → **Developers** → **API keys**
2. **Mode** : Basculer sur "Test mode" (toggle en haut)
3. **Récupérer** :
   - **Publishable key** : `pk_test_xxxxxxxxxxxxx`
   - **Secret key** : `sk_test_xxxxxxxxxxxxx` (cliquer "Reveal")

**📝 Noter ces clés**

### **B. Clés de Production**

**Pour vrais paiements (après activation du compte) :**

1. **Mode** : Basculer sur "Live mode"
2. **Récupérer** :
   - **Publishable key** : `pk_live_xxxxxxxxxxxxx`
   - **Secret key** : `sk_live_xxxxxxxxxxxxx`

**📝 Noter ces clés**

---

## 📋 **Étape 5 : Configurer Supabase**

### **A. Ajouter les Secrets Supabase**

**Aller sur Supabase Dashboard :**
1. https://supabase.com/dashboard/project/votre-projet-id
2. **Settings** → **Edge Functions** → **Secrets**

**Ajouter ces secrets :**

```bash
# Clés Stripe TEST
STRIPE_SECRET_KEY_TEST=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxxxxxxxxxxxx

# Price IDs TEST
STRIPE_PRICE_PLUS_TEST=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_TEST=price_xxxxxxxxxxxxx
STRIPE_PRICE_STUDIO_TEST=price_xxxxxxxxxxxxx

# Clés Stripe PRODUCTION (quand prêt)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Price IDs PRODUCTION
STRIPE_PRICE_PLUS=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_STUDIO=price_xxxxxxxxxxxxx
```

**Comment ajouter :**
1. Cliquer "+ New secret"
2. Name : `STRIPE_SECRET_KEY_TEST`
3. Value : `sk_test_xxxxxxxxxxxxx`
4. Cliquer "Save"
5. Répéter pour chaque secret

---

### **B. Mettre à Jour .env Local**

**Fichier `.env` (pour développement local) :**

```bash
# Stripe TEST Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Price IDs TEST
VITE_STRIPE_PRICE_PLUS=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_STUDIO=price_xxxxxxxxxxxxx
```

**⚠️ Important :**
- Les clés `VITE_` sont exposées au frontend
- Ne JAMAIS mettre `STRIPE_SECRET_KEY` dans `.env` (seulement dans Supabase Secrets)

---

## 📋 **Étape 6 : Déployer les Edge Functions**

### **A. Vérifier les Edge Functions**

**Vous devriez avoir ces fonctions :**

```
supabase/functions/
├── create-checkout-session/
│   └── index.ts
├── create-portal-session/
│   └── index.ts
└── stripe-webhook/
    └── index.ts
```

### **B. Déployer**

```bash
# Se connecter à Supabase
npx supabase login

# Déployer toutes les fonctions
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-portal-session
npx supabase functions deploy stripe-webhook

# Vérifier le déploiement
npx supabase functions list
```

**Vous devriez voir :**
```
✓ create-checkout-session
✓ create-portal-session
✓ stripe-webhook
```

---

## 📋 **Étape 7 : Tester le Système de Paiement**

### **A. Cartes de Test Stripe**

**Pour tester les paiements :**

| Carte | Numéro | Résultat |
|-------|--------|----------|
| **Succès** | `4242 4242 4242 4242` | ✅ Paiement réussi |
| **Échec** | `4000 0000 0000 0002` | ❌ Carte refusée |
| **3D Secure** | `4000 0027 6000 3184` | 🔐 Authentification requise |

**Autres infos (peu importe) :**
- **Date** : N'importe quelle date future (ex: 12/34)
- **CVC** : N'importe quel 3 chiffres (ex: 123)
- **Code postal** : N'importe lequel (ex: 75001)

### **B. Tester l'Abonnement**

**Dans votre app :**

1. **Se connecter** (ou créer un compte)
2. **Aller sur** : Profile → Plans
3. **Cliquer** : "Upgrade Plan" sur PLUS
4. **Remplir** :
   - Email : votre@email.com
   - Carte : `4242 4242 4242 4242`
   - Date : `12/34`
   - CVC : `123`
5. **Cliquer** : "Subscribe"

**Vérifier :**
- ✅ Redirection vers success page
- ✅ Plan mis à jour dans l'app
- ✅ Vision Points ajoutés
- ✅ Abonnement visible dans Stripe Dashboard

### **C. Tester le Portal**

**Dans votre app :**

1. **Profile** → **Manage Subscription**
2. **Vérifier** : Redirection vers Stripe Customer Portal
3. **Tester** :
   - Voir l'abonnement actuel
   - Changer de plan
   - Annuler l'abonnement
   - Mettre à jour la carte

---

## 📋 **Étape 8 : Vérifier les Webhooks**

### **A. Dashboard Stripe**

1. **Developers** → **Webhooks**
2. **Cliquer** sur votre webhook
3. **Onglet** : "Events"

**Vous devriez voir :**
- ✅ `checkout.session.completed` (quand paiement réussi)
- ✅ `customer.subscription.created` (quand abonnement créé)
- ✅ Status : "Succeeded" (200 OK)

### **B. Si Webhook Échoue**

**Vérifier :**
1. **URL correcte** : `https://xxx.supabase.co/functions/v1/stripe-webhook`
2. **Fonction déployée** : `npx supabase functions list`
3. **Secret correct** : Dans Supabase Secrets
4. **Logs** : Supabase Dashboard → Edge Functions → Logs

---

## 📋 **Étape 9 : Passer en Production**

### **A. Activer le Compte Stripe**

**Avant de recevoir de vrais paiements :**

1. **Dashboard Stripe** → **Activate your account**
2. **Remplir** :
   - Informations entreprise
   - SIRET (si applicable)
   - Coordonnées bancaires
   - Pièce d'identité
3. **Attendre validation** (1-3 jours)

### **B. Créer les Produits en Live**

**Répéter l'Étape 2 en mode "Live" :**
1. Basculer sur "Live mode"
2. Créer PLUS, PRO, STUDIO
3. Noter les nouveaux Price IDs

### **C. Créer le Webhook en Live**

**Répéter l'Étape 3 en mode "Live" :**
1. Créer un nouveau webhook
2. Même URL
3. Mêmes events
4. Noter le nouveau Webhook Secret

### **D. Mettre à Jour les Secrets**

**Supabase Secrets :**
```bash
# Remplacer les valeurs PRODUCTION
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRICE_PLUS=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_STUDIO=price_xxxxxxxxxxxxx
```

### **E. Mettre à Jour .env**

**Fichier `.env.production` :**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PLUS=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_STUDIO=price_xxxxxxxxxxxxx
```

---

## 📋 **Checklist Complète**

### **Configuration Stripe**

- [ ] Compte Stripe créé
- [ ] Compte activé (pour production)
- [ ] Produit PLUS créé (test + live)
- [ ] Produit PRO créé (test + live)
- [ ] Produit STUDIO créé (test + live)
- [ ] Webhook créé (test + live)
- [ ] Clés API récupérées (test + live)

### **Configuration Supabase**

- [ ] Secrets ajoutés (test)
- [ ] Secrets ajoutés (production)
- [ ] Edge Functions déployées
- [ ] Webhook URL configurée

### **Configuration App**

- [ ] `.env` mis à jour
- [ ] `.env.production` créé
- [ ] Price IDs corrects dans le code

### **Tests**

- [ ] Paiement test réussi
- [ ] Plan mis à jour
- [ ] Vision Points ajoutés
- [ ] Portal fonctionne
- [ ] Webhooks reçus
- [ ] Annulation fonctionne

---

## 🔧 **Fichiers à Vérifier**

### **1. `.env`**

```bash
# Stripe TEST
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PLUS=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_STUDIO=price_xxxxxxxxxxxxx

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### **2. Supabase Secrets**

**Vérifier dans Dashboard → Settings → Edge Functions → Secrets :**
- `STRIPE_SECRET_KEY_TEST`
- `STRIPE_PUBLISHABLE_KEY_TEST`
- `STRIPE_WEBHOOK_SECRET_TEST`
- `STRIPE_PRICE_PLUS_TEST`
- `STRIPE_PRICE_PRO_TEST`
- `STRIPE_PRICE_STUDIO_TEST`

---

## 🚨 **Problèmes Courants**

### **1. "Webhook Failed"**

**Vérifier :**
- URL correcte dans Stripe
- Fonction déployée
- Secret correct
- Logs Supabase

### **2. "Payment Failed"**

**Vérifier :**
- Clé publishable correcte
- Price ID correct
- Carte de test valide

### **3. "Plan Not Updated"**

**Vérifier :**
- Webhook reçu
- Logs de la fonction webhook
- Database : table `profiles`

---

## 📞 **Support**

**Stripe Support :**
- https://support.stripe.com/

**Stripe Docs :**
- https://stripe.com/docs

**Supabase Docs :**
- https://supabase.com/docs/guides/functions

---

## 🎯 **Prochaine Action**

**Commençons maintenant :**

1. **Créer compte Stripe** (si pas déjà fait)
2. **Créer les 3 produits** (PLUS, PRO, STUDIO)
3. **Noter les Price IDs**
4. **Configurer le webhook**
5. **Ajouter les secrets Supabase**

**Voulez-vous que je vous guide étape par étape ?** 😊

**Où en êtes-vous ?**
- Compte Stripe créé ?
- Produits créés ?
- Besoin d'aide pour une étape spécifique ?
