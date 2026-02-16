# 🚀 Checklist Passage en Production - Tattoo Vision

## ✅ État Actuel
- ✅ Application fonctionnelle en développement
- ✅ Paiements Stripe fonctionnent en mode test
- ✅ Dashboard admin opérationnel
- ✅ Déployé sur Vercel

---

## 📋 Checklist Production

### 1️⃣ Stripe - Passage en Mode Production

#### Étape 1.1 : Activer votre compte Stripe
- [ ] Aller sur [dashboard.stripe.com](https://dashboard.stripe.com)
- [ ] Compléter les informations de votre entreprise
- [ ] Vérifier votre identité (documents requis)
- [ ] Activer les paiements en production

#### Étape 1.2 : Récupérer les clés de production
- [ ] Aller dans **Developers → API Keys** sur Stripe Dashboard
- [ ] Basculer sur **Mode Production** (en haut à droite)
- [ ] Copier votre **Secret Key** (commence par `sk_live_...`)
- [ ] Copier votre **Webhook Signing Secret** pour production

#### Étape 1.3 : Configurer le webhook en production
1. Aller dans **Developers → Webhooks** (mode production)
2. Cliquer sur **Add endpoint**
3. URL : `https://zggkmqxnxtjizcygmyfj.supabase.co/functions/v1/stripe-webhook`
4. Sélectionner les événements :
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
5. Copier le **Webhook Signing Secret** (commence par `whsec_...`)

#### Étape 1.4 : Mettre à jour les secrets Supabase
```bash
# Se connecter à Supabase CLI
supabase login

# Définir les secrets de production
supabase secrets set STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_ICI
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI
```

**OU via le dashboard Supabase :**
1. Aller sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. **Settings → Edge Functions → Secrets**
4. Mettre à jour :
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → `whsec_...`

---

### 2️⃣ Prix et Produits Stripe

#### Vérifier que les Price IDs sont corrects
Dans `supabase/functions/create-checkout-session/index.ts` :

```typescript
const PLAN_PRICE_IDS = {
    plus: 'price_1StEXVEJuCXjTiQrWjZEOSYw',
    pro: 'price_1StEY0EJuCXjTiQruod4ehPc',
    studio: 'price_1StEaIEJuCXjTiQrftzwd5Z7',
};
```

- [ ] Vérifier que ces Price IDs existent dans votre compte Stripe en **mode production**
- [ ] Si ce n'est pas le cas, créer les produits en production et mettre à jour les IDs

#### Créer les produits en production (si nécessaire)
1. Aller sur Stripe Dashboard → **Products**
2. Basculer en **mode Production**
3. Créer les 3 plans :
   - **Plus Plan** : 9.99€/mois → récupérer le `price_id`
   - **Pro Plan** : 19.99€/mois → récupérer le `price_id`
   - **Studio Plan** : 39.99€/mois → récupérer le `price_id`
4. Mettre à jour les Price IDs dans le code

---

### 3️⃣ Variables d'Environnement Vercel

#### Mettre à jour les variables sur Vercel
- [ ] Aller sur [vercel.com](https://vercel.com)
- [ ] Sélectionner votre projet **tattoo-vision**
- [ ] **Settings → Environment Variables**
- [ ] Vérifier que ces variables sont définies :
  - `VITE_SUPABASE_URL` : `https://zggkmqxnxtjizcygmyfj.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` : (votre clé anon)

**Note** : Les clés Stripe sont dans Supabase Edge Functions, pas dans Vercel

---

### 4️⃣ Tests de Production

#### Étape 4.1 : Tester avec une vraie carte (mode production)
- [ ] Utiliser une vraie carte bancaire (ou carte de test Stripe si activé)
- [ ] Acheter un pack de crédits
- [ ] Vérifier que les crédits sont ajoutés au compte
- [ ] Vérifier la transaction dans Stripe Dashboard (production)

#### Étape 4.2 : Tester les abonnements
- [ ] S'abonner au plan Plus/Pro/Studio
- [ ] Vérifier que les crédits mensuels sont ajoutés
- [ ] Vérifier l'abonnement dans Stripe Dashboard

#### Étape 4.3 : Tester le webhook
- [ ] Vérifier dans **Stripe → Developers → Webhooks**
- [ ] Vérifier que les événements sont bien reçus (200 OK)
- [ ] Vérifier dans les logs Supabase :
  ```bash
  supabase functions logs stripe-webhook
  ```

---

### 5️⃣ Sécurité et Conformité

#### RGPD et Mentions Légales
- [ ] Vérifier que les pages légales sont accessibles :
  - `/legal/privacy-policy.html`
  - `/legal/terms-of-service.html`
- [ ] Ajouter un lien vers la politique de confidentialité dans le footer
- [ ] Ajouter un système de consentement cookies (si nécessaire)

#### Sécurité
- [ ] Vérifier que toutes les Edge Functions vérifient l'authentification
- [ ] S'assurer que les clés Stripe ne sont jamais exposées côté client
- [ ] Activer les logs Stripe en production

---

### 6️⃣ Monitoring et Analytics

#### Configurer le monitoring
- [ ] Dans Vercel : activer **Analytics** (si disponible)
- [ ] Dans Supabase : vérifier les **logs** des Edge Functions
- [ ] Dans Stripe : activer les **alertes email** pour :
  - Paiements échoués
  - Webhooks en erreur
  - Litiges (disputes)

---

### 7️⃣ Communication et Support

#### Préparer le support client
- [ ] Configurer un email de support (ex: support@tattoo-vision.com)
- [ ] Préparer une FAQ pour les utilisateurs
- [ ] Définir un processus de remboursement
- [ ] Ajouter le lien de support dans l'application

---

## 🔧 Commandes Utiles

### Vérifier les logs Supabase
```bash
# Logs de la fonction de checkout
supabase functions logs create-checkout-session

# Logs du webhook Stripe
supabase functions logs stripe-webhook
```

### Tester les Edge Functions localement
```bash
# Démarrer Supabase en local
supabase start

# Tester une fonction
supabase functions serve create-checkout-session --env-file .env
```

---

## ⚠️ Points d'Attention

### Différences Test vs Production

| Aspect | Mode Test | Mode Production |
|--------|-----------|-----------------|
| Clé Stripe | `sk_test_...` | `sk_live_...` |
| Webhook Secret | `whsec_test_...` | `whsec_live_...` |
| Cartes acceptées | Cartes de test Stripe | Vraies cartes bancaires |
| Argent réel | ❌ Non | ✅ OUI |
| Price IDs | Différents | Différents |

### Erreurs Courantes

1. **Webhook ne fonctionne pas**
   - Vérifier que l'URL du webhook est correcte
   - Vérifier que le Webhook Secret est à jour
   - Vérifier les logs dans Stripe

2. **Paiement échoue**
   - Vérifier que la clé Stripe est bien en production
   - Vérifier que les Price IDs existent en production
   - Vérifier les logs de la fonction Edge

3. **Crédits non ajoutés**
   - Vérifier que le webhook est bien configuré
   - Vérifier les logs du webhook
   - Vérifier la fonction `add_credits` dans Supabase

---

## 📞 Que Faire en Cas de Problème ?

### Si les paiements ne fonctionnent pas :
1. Vérifier les logs Stripe Dashboard → Events
2. Vérifier les logs Supabase Edge Functions
3. Tester avec le Stripe CLI en local :
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

### Si les webhooks échouent :
1. Aller sur Stripe → Webhooks → (votre webhook)
2. Cliquer sur "Recent deliveries"
3. Vérifier le code de réponse et les erreurs

---

## ✅ Checklist Finale

Avant de lancer en production :

- [ ] Compte Stripe activé et vérifié
- [ ] Clés Stripe de production configurées dans Supabase
- [ ] Webhook Stripe configuré en production
- [ ] Price IDs mis à jour (si nécessaire)
- [ ] Test de paiement réel réussi
- [ ] Dashboard admin accessible
- [ ] Mentions légales en place
- [ ] Email de support configuré
- [ ] Monitoring activé

---

## 🎉 Prêt à Lancer !

Une fois tous les points cochés, vous êtes prêt à lancer en production ! 🚀

Pour toute question, consultez la documentation Stripe : https://stripe.com/docs
