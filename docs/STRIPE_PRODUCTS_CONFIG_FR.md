# 💳 Configuration Stripe - Produits et Prix

## 🎯 Étapes pour Configurer Stripe

### 1. Créer les Produits dans Stripe Dashboard

Allez sur https://dashboard.stripe.com/products

#### Produit 1: Plus Plan
- **Nom:** Tattoo Vision - Plus Plan
- **Description:** 6,000 Vision Points per month + AI features
- **Prix:** 9.99 EUR / mois (récurrent)
- **Copier le Price ID:** `price_xxxxxxxxxxxxx`

#### Produit 2: Pro Plan
- **Nom:** Tattoo Vision - Pro Plan
- **Description:** 15,000 Vision Points per month + unlimited renders
- **Prix:** 19.99 EUR / mois (récurrent)
- **Copier le Price ID:** `price_xxxxxxxxxxxxx`

#### Produit 3: Studio Plan
- **Nom:** Tattoo Vision - Studio Plan
- **Description:** 40,000 Vision Points per month + HD exports
- **Prix:** 39.99 EUR / mois (récurrent)
- **Copier le Price ID:** `price_xxxxxxxxxxxxx`

---

## 🔧 Modifier la Fonction Edge

Une fois que vous avez créé les produits et récupéré les **Price IDs**, vous devez modifier:

`supabase/functions/create-checkout-session/index.ts`

### Option A: Utiliser les Price IDs (Recommandé)

Remplacez les lignes 96-100 par:

```typescript
// Define subscription Price IDs from Stripe
const PLAN_PRICE_IDS = {
  plus: 'price_xxxxxxxxxxxxx',    // Remplacez par votre Price ID
  pro: 'price_xxxxxxxxxxxxx',     // Remplacez par votre Price ID
  studio: 'price_xxxxxxxxxxxxx',  // Remplacez par votre Price ID
};
```

Puis modifiez la création de session (lignes 108-125):

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price: PLAN_PRICE_IDS[id], // Utiliser le Price ID
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${returnUrl}?canceled=true`,
  client_reference_id: user.id,
  metadata: {
    userId: user.id,
    plan: id,
    type: 'subscription'
  },
});
```

### Option B: Garder les Prix Dynamiques

Si vous préférez créer les prix dynamiquement (moins recommandé):

```typescript
const PLAN_DATA = {
  plus: { credits: 6000, price: 999, name: 'Plus Plan', mode: 'subscription' },     // 9.99 EUR
  pro: { credits: 15000, price: 1999, name: 'Pro Plan', mode: 'subscription' },     // 19.99 EUR
  studio: { credits: 40000, price: 3999, name: 'Studio Plan', mode: 'subscription' }, // 39.99 EUR
};
```

**Note:** Les prix sont en **centimes** (999 = 9.99 EUR)

---

## 🔐 Ajouter les Price IDs aux Secrets Supabase

### Via Dashboard:
1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. Ajoutez:
   - `STRIPE_PRICE_PLUS` = `price_xxxxxxxxxxxxx`
   - `STRIPE_PRICE_PRO` = `price_xxxxxxxxxxxxx`
   - `STRIPE_PRICE_STUDIO` = `price_xxxxxxxxxxxxx`

### Via CLI:
```bash
supabase secrets set STRIPE_PRICE_PLUS=price_xxxxxxxxxxxxx
supabase secrets set STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
supabase secrets set STRIPE_PRICE_STUDIO=price_xxxxxxxxxxxxx
```

Puis dans le code:
```typescript
const PLAN_PRICE_IDS = {
  plus: Deno.env.get("STRIPE_PRICE_PLUS") ?? "",
  pro: Deno.env.get("STRIPE_PRICE_PRO") ?? "",
  studio: Deno.env.get("STRIPE_PRICE_STUDIO") ?? "",
};
```

---

## 📝 Checklist

- [ ] Créer les 3 produits dans Stripe Dashboard
- [ ] Créer les prix récurrents (9.99€, 19.99€, 39.99€)
- [ ] Copier les Price IDs
- [ ] Modifier `create-checkout-session/index.ts`
- [ ] Ajouter les Price IDs aux secrets Supabase
- [ ] Redéployer la fonction
- [ ] Tester un achat

---

## 🧪 Test

1. Cliquez sur un plan dans votre app
2. Vérifiez que Stripe affiche le bon prix (9.99€, 19.99€ ou 39.99€)
3. Complétez l'achat avec une carte de test
4. Vérifiez que le webhook active le plan

---

## 💡 Recommandation

**Utilisez les Price IDs (Option A)** car:
- ✅ Plus facile à gérer dans Stripe Dashboard
- ✅ Vous pouvez changer les prix sans redéployer
- ✅ Meilleure traçabilité
- ✅ Support des coupons et promotions

---

**Créez les produits dans Stripe maintenant!** 🚀
