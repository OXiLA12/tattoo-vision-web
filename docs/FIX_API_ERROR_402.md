# 🔧 Fix API - Erreur 402 et Check Constraint

## 🎯 Problème Identifié

**Erreur 1 :** `402 Payment Required` - Pas assez de Vision Points  
**Erreur 2 :** `credit_transactions_type_check` - Types de transaction manquants

## ✅ Solution Rapide

### **Étape 1 : Corriger la Contrainte SQL**

1. **Aller sur Supabase Dashboard**
   - https://supabase.com/
   - Votre projet → SQL Editor

2. **Exécuter ce SQL :**

```sql
-- Fix credit_transactions_type_check constraint
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE public.credit_transactions 
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

  -- Add the updated constraint with ALL required types
  ALTER TABLE public.credit_transactions 
  ADD CONSTRAINT credit_transactions_type_check 
  CHECK (type IN (
    'purchase', 
    'usage', 
    'bonus', 
    'refund', 
    'referral_reward', 
    'referral_bonus',
    'debit_pending',    -- AJOUTÉ
    'debit_success'     -- AJOUTÉ
  ));

  RAISE NOTICE 'Constraint updated successfully';
END $$;
```

3. **Cliquer sur "Run"**

---

### **Étape 2 : Donner des Vision Points**

**Si vous n'avez pas de compte de test :**

```sql
-- Créer/Mettre à jour votre compte avec des points
UPDATE profiles
SET 
    plan = 'pro',
    vision_points = 15000,
    next_reset_at = NOW() + INTERVAL '1 month',
    free_realistic_render_used = false
WHERE email = 'VOTRE_EMAIL@example.com';

-- Vérifier
SELECT email, plan, vision_points FROM profiles WHERE email = 'VOTRE_EMAIL@example.com';
```

**Remplacez `VOTRE_EMAIL@example.com` par votre email !**

---

### **Étape 3 : Tester**

1. Retourner sur `http://localhost:5173`
2. Se connecter (si pas déjà connecté)
3. Essayer de générer un tatouage ou realistic render
4. **Ça devrait marcher ! ✅**

---

## 🎯 Explication du Problème

### **Pourquoi l'erreur 402 ?**

L'erreur 402 signifie "Payment Required" = pas assez de Vision Points.

**Vérification :**
- Plan gratuit = 0 Vision Points
- Realistic Render coûte 1,200 VP
- 0 < 1,200 → Erreur 402

**Solution :** Passer en plan Pro avec 15,000 VP

---

### **Pourquoi l'erreur check constraint ?**

La contrainte SQL `credit_transactions_type_check` n'autorisait que :
- `purchase`, `usage`, `bonus`, `refund`, `referral_reward`, `referral_bonus`

Mais le code utilise aussi :
- `debit_pending` (quand on initie l'utilisation)
- `debit_success` (quand on confirme)

**Solution :** Ajouter ces 2 types à la contrainte

---

## 📊 Vérifications Post-Fix

### **Test 1 : Contrainte SQL**

```sql
-- Vérifier que la contrainte est correcte
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'credit_transactions_type_check';
```

**Résultat attendu :** Doit inclure `debit_pending` et `debit_success`

---

### **Test 2 : Vision Points**

```sql
-- Vérifier vos points
SELECT 
    email, 
    plan, 
    vision_points,
    next_reset_at
FROM profiles 
WHERE email = 'VOTRE_EMAIL@example.com';
```

**Résultat attendu :**
```
plan: pro
vision_points: 15000
```

---

### **Test 3 : Fonctionnalité**

Dans la console du navigateur (F12) :

```javascript
// Test complet
const { data, error } = await window.supabase.functions.invoke('generate-realistic-render', {
  body: {
    request_id: crypto.randomUUID(),
    imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
});

console.log('Résultat:', data);
console.log('Erreur:', error);
```

**Si ça marche :** Vous verrez un résultat  
**Si erreur :** Regarder le message d'erreur

---

## ⚡ Commandes Rapides

### **SQL à Exécuter (Supabase SQL Editor)**

```sql
-- 1. Fix constraint
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check 
CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'referral_reward', 'referral_bonus', 'debit_pending', 'debit_success'));

-- 2. Donner des points (REMPLACER L'EMAIL !)
UPDATE profiles
SET plan = 'pro', vision_points = 15000, next_reset_at = NOW() + INTERVAL '1 month'
WHERE email = 'VOTRE_EMAIL@example.com';

-- 3. Vérifier
SELECT email, plan, vision_points FROM profiles WHERE email = 'VOTRE_EMAIL@example.com';
```

---

## 📸 Pour les Screenshots

Une fois que c'est fixé, vous pourrez :

1. ✅ Générer des tatouages avec l'IA
2. ✅ Créer des realistic renders
3. ✅ Prendre de VRAIS screenshots (pas de mockups nécessaires !)

**Temps estimé pour le fix : 5 minutes**

---

## 🆘 Si Ça Ne Marche Toujours Pas

### **Vérifier les Logs Supabase**

1. Supabase Dashboard → Edge Functions → Logs
2. Chercher `generate-realistic-render`
3. Regarder les erreurs

### **Vérifier la Session**

```javascript
// Dans la console
const { data } = await window.supabase.auth.getSession();
console.log('Connecté ?', data.session !== null);
console.log('Email:', data.session?.user?.email);
```

### **Vérifier les Points en Temps Réel**

```javascript
// Dans la console
const { data } = await window.supabase
  .from('profiles')
  .select('plan, vision_points')
  .single();
console.log('Plan:', data.plan);
console.log('Points:', data.vision_points);
```

---

**💡 Le fix SQL devrait résoudre le problème immédiatement ! Ensuite vous pourrez prendre de vrais screenshots de votre app qui fonctionne !**

**🎯 Priorité : Exécuter le SQL dans Supabase Dashboard → SQL Editor**
