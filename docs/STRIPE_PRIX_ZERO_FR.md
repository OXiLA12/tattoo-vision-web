# ✅ Prix Stripe Modifiés à 0€

## 🎯 Modifications Effectuées

### 1. Affichage Frontend (Déjà fait)
✅ Tous les prix affichent **0€** dans l'interface

### 2. Prix Réels Stripe (Vient d'être fait)
✅ Tous les prix dans la fonction Edge sont maintenant à **0**

**Fichier modifié:** `supabase/functions/create-checkout-session/index.ts`

```typescript
const PLAN_DATA = {
    plus: { credits: 6000, price: 0, name: 'Plus Plan' },      // Avant: 999 ($9.99)
    pro: { credits: 15000, price: 0, name: 'Pro Plan' },       // Avant: 1999 ($19.99)
    studio: { credits: 40000, price: 0, name: 'Studio Plan' }, // Avant: 3999 ($39.99)
};
```

## 🚀 Déployer les Changements

Pour que les modifications prennent effet, vous devez **redéployer la fonction Edge**:

### Option 1: Via Supabase CLI (Recommandé)

```bash
# Dans le terminal, à la racine du projet
cd c:/Users/Kali/Desktop/tattoo-vision-updated/project

# Déployer la fonction
supabase functions deploy create-checkout-session
```

### Option 2: Via Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans `Edge Functions`
4. Trouvez `create-checkout-session`
5. Cliquez sur `Deploy` ou `Redeploy`

## 🧪 Tester le Checkout Gratuit

### Étape 1: Attendre le Déploiement
Après le déploiement, attendez **30 secondes à 1 minute**

### Étape 2: Tester l'Achat
1. **Rafraîchissez votre application**
2. **Cliquez sur un plan** (Plus, Pro ou Studio)
3. **Vous serez redirigé vers Stripe**
4. **Le montant devrait être 0.00€**

### Étape 3: Compléter le Checkout
Même à 0€, Stripe peut demander:
- Une carte de test (utilisez `4242 4242 4242 4242`)
- Date d'expiration future (ex: 12/34)
- CVC: n'importe quel 3 chiffres (ex: 123)

### Cartes de Test Stripe

| Carte | Numéro | Résultat |
|-------|--------|----------|
| **Succès** | 4242 4242 4242 4242 | ✅ Paiement réussi |
| **Échec** | 4000 0000 0000 0002 | ❌ Carte déclinée |
| **3D Secure** | 4000 0027 6000 3184 | 🔐 Authentification requise |

## ✅ Vérifier que ça Marche

Après avoir complété le checkout:

1. **Vous serez redirigé** vers votre app avec `?success=true`
2. **Votre plan devrait être mis à jour** dans votre profil
3. **Vos Vision Points devraient être ajoutés**

### Vérifier dans Supabase

1. Allez dans `Table Editor` → `profiles`
2. Trouvez votre utilisateur
3. Vérifiez que `plan` = `plus`, `pro` ou `studio`

4. Allez dans `Table Editor` → `user_credits`
5. Vérifiez que `credits` a été ajouté

## ⚠️ Important: Remettre les Vrais Prix

**Après avoir testé**, n'oubliez pas de remettre les vrais prix avant la production:

```typescript
const PLAN_DATA = {
    plus: { credits: 6000, price: 999, name: 'Plus Plan' },      // $9.99
    pro: { credits: 15000, price: 1999, name: 'Pro Plan' },      // $19.99
    studio: { credits: 40000, price: 3999, name: 'Studio Plan' }, // $39.99
};
```

Puis **redéployer** à nouveau.

## 📝 Checklist

- [x] Prix frontend modifiés à 0€
- [x] Prix backend modifiés à 0
- [ ] Fonction redéployée
- [ ] Attendu 1 minute
- [ ] Testé le checkout
- [ ] Vérifié que le plan est activé
- [ ] Vérifié que les points sont ajoutés

---

## 🚀 Prochaine Étape

**Déployez la fonction maintenant:**

```bash
supabase functions deploy create-checkout-session
```

Puis testez l'achat d'un plan! 🎉
