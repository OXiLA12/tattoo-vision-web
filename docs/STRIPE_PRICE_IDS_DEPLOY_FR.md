# ✅ Stripe Price IDs Configurés!

## 🎯 Modifications Appliquées

La fonction `create-checkout-session` utilise maintenant les **Price IDs** de Stripe au lieu de créer les prix dynamiquement.

### Price IDs Configurés:

```typescript
const PLAN_PRICE_IDS = {
    plus: 'price_1StEXVEJuCXjTiQrWjZEOSYw',    // 9.99 EUR/mois
    pro: 'price_1StEY0EJuCXjTiQruod4ehPc',     // 19.99 EUR/mois
    studio: 'price_1StEaIEJuCXjTiQrftzwd5Z7',  // 39.99 EUR/mois
};
```

## ✅ Avantages de Cette Approche

1. **Gestion Centralisée**
   - Vous pouvez modifier les prix dans Stripe Dashboard
   - Pas besoin de redéployer la fonction pour changer un prix

2. **Flexibilité**
   - Support des coupons et promotions
   - Périodes d'essai gratuites
   - Changements de prix sans code

3. **Traçabilité**
   - Meilleure visibilité dans Stripe Dashboard
   - Rapports et analytics plus précis

4. **Sécurité**
   - Les prix sont validés par Stripe
   - Impossible de manipuler les montants

---

## 🚀 Déployer la Fonction

```bash
cd c:/Users/Kali/Desktop/tattoo-vision-updated/project
supabase functions deploy create-checkout-session
```

---

## 🧪 Tester le Checkout

### 1. Rafraîchir l'Application

Après le déploiement, rafraîchissez votre application (Ctrl+Shift+R)

### 2. Tester Chaque Plan

#### Test Plus (9.99€/mois):
1. Cliquez sur "Select Plus"
2. Vérifiez que Stripe affiche **9.99 EUR / month**
3. Utilisez une carte de test: `4242 4242 4242 4242`
4. Complétez le paiement

#### Test Pro (19.99€/mois):
1. Cliquez sur "Select Pro"
2. Vérifiez que Stripe affiche **19.99 EUR / month**
3. Testez avec la carte de test

#### Test Studio (39.99€/mois):
1. Cliquez sur "Select Studio"
2. Vérifiez que Stripe affiche **39.99 EUR / month**
3. Testez avec la carte de test

### 3. Vérifier Après Paiement

Après un paiement réussi:
- ✅ L'utilisateur est redirigé vers l'app avec `?success=true`
- ✅ Le webhook Stripe active le plan
- ✅ Le profil utilisateur est mis à jour
- ✅ Les Vision Points sont ajoutés

---

## 🔍 Vérifier dans Stripe Dashboard

1. **Allez sur** https://dashboard.stripe.com/payments
2. **Vérifiez** que le paiement apparaît
3. **Cliquez** sur le paiement pour voir les détails
4. **Vérifiez** les metadata:
   - `userId`: ID de l'utilisateur
   - `plan`: plus/pro/studio
   - `credits`: 6000/15000/40000
   - `type`: subscription

---

## 📊 Tableau Récapitulatif

| Plan | Price ID | Prix | Points | Mode |
|------|----------|------|--------|------|
| **Plus** | `price_1StEXVEJuCXjTiQrWjZEOSYw` | 9.99€/mois | 6,000 | Abonnement |
| **Pro** | `price_1StEY0EJuCXjTiQruod4ehPc` | 19.99€/mois | 15,000 | Abonnement |
| **Studio** | `price_1StEaIEJuCXjTiQrftzwd5Z7` | 39.99€/mois | 40,000 | Abonnement |

---

## 🔄 Modifier un Prix Plus Tard

Si vous voulez changer un prix:

1. **Allez dans Stripe Dashboard** → Products
2. **Cliquez sur le produit** (Plus, Pro ou Studio)
3. **Ajoutez un nouveau prix** (ex: 12.99€ au lieu de 9.99€)
4. **Copiez le nouveau Price ID**
5. **Modifiez** `create-checkout-session/index.ts`
6. **Redéployez** la fonction

---

## ⚠️ Important

**Ne supprimez PAS les anciens Price IDs dans Stripe!**

Les abonnements existants utilisent les anciens Price IDs. Si vous les supprimez, les renouvellements échoueront.

À la place:
- ✅ Créez un nouveau prix
- ✅ Marquez l'ancien comme "archived"
- ✅ Mettez à jour le code avec le nouveau Price ID

---

## 📝 Checklist Finale

- [x] Price IDs ajoutés dans le code
- [ ] Fonction redéployée
- [ ] Application rafraîchie
- [ ] Testé le checkout Plus
- [ ] Testé le checkout Pro
- [ ] Testé le checkout Studio
- [ ] Vérifié que le webhook fonctionne
- [ ] Vérifié que les plans sont activés
- [ ] Vérifié que les points sont ajoutés

---

**Redéployez maintenant et testez les paiements!** 💳🚀
