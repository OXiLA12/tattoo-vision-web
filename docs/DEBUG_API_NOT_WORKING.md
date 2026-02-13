# 🔧 Diagnostic - Pourquoi les API ne fonctionnent pas

## ✅ Vérifications Effectuées

1. ✅ **Edge Functions déployées** : Toutes actives sur Supabase
2. ✅ **Secrets configurés** : GEMINI_API_KEY et REMOVEBG_API_KEY présents
3. ✅ **Code correct** : invokeWithAuth fonctionne correctement

## 🎯 Causes Possibles

### **Cause #1 : Utilisateur Non Connecté (PROBABLE)**

Les Edge Functions nécessitent un utilisateur authentifié.

**Test :**
1. Ouvrir `http://localhost:5173`
2. Ouvrir la console (F12)
3. Taper :
```javascript
const { data } = await window.supabase.auth.getSession();
console.log('Session:', data.session);
```

**Si `null` → Vous devez vous connecter !**

**Solution :**
```
1. Créer un compte dans l'app
2. Se connecter
3. Réessayer les fonctionnalités IA
```

---

### **Cause #2 : Plan Gratuit Sans Points**

Les utilisateurs gratuits ont 0 Vision Points.

**Test :**
1. Se connecter
2. Vérifier votre plan dans Profil/Paramètres
3. Vérifier vos Vision Points

**Si 0 points → Normal pour le plan gratuit !**

**Solution :**
```sql
-- Dans Supabase SQL Editor
UPDATE profiles
SET 
    plan = 'pro',
    vision_points = 15000
WHERE email = 'votre-email@example.com';
```

---

### **Cause #3 : Clés API Invalides**

Les clés Gemini ou remove.bg ont peut-être expiré.

**Test :**
1. Aller sur Supabase Dashboard
2. Edge Functions → Logs
3. Chercher les erreurs

**Si erreur "Invalid API key" → Clés expirées**

**Solution :**
```bash
# Mettre à jour les clés
npx supabase secrets set GEMINI_API_KEY=nouvelle_cle
npx supabase secrets set REMOVEBG_API_KEY=nouvelle_cle
```

---

### **Cause #4 : CORS ou Réseau**

Problème de connexion entre votre navigateur et Supabase.

**Test :**
1. Ouvrir la console (F12)
2. Onglet Network
3. Essayer de générer un tatouage
4. Regarder les requêtes vers `functions/v1/`

**Si erreur CORS ou 404 → Problème réseau**

**Solution :**
```
1. Vérifier que .env contient les bonnes URLs
2. Redémarrer le dev server (Ctrl+C puis npm run dev)
```

---

## 🚀 Guide de Diagnostic Rapide

### **Étape 1 : Vérifier la Connexion**

```javascript
// Dans la console du navigateur (F12)
const { data } = await window.supabase.auth.getSession();
console.log('Connecté ?', data.session !== null);
console.log('Email :', data.session?.user?.email);
```

**Résultat attendu :** `Connecté ? true`

**Si false :**
1. Créer un compte
2. Se connecter
3. Réessayer

---

### **Étape 2 : Vérifier le Plan et les Points**

```javascript
// Dans la console
const { data: profile } = await window.supabase
  .from('profiles')
  .select('plan, vision_points')
  .single();
console.log('Plan:', profile.plan);
console.log('Points:', profile.vision_points);
```

**Résultat attendu :** 
```
Plan: pro (ou plus/studio)
Points: > 0
```

**Si plan = 'free' ou points = 0 :**

Mettre à jour dans Supabase :
```sql
UPDATE profiles
SET 
    plan = 'pro',
    vision_points = 15000,
    next_reset_at = NOW() + INTERVAL '1 month'
WHERE id = auth.uid();
```

---

### **Étape 3 : Tester l'Edge Function Directement**

```javascript
// Dans la console
const { data, error } = await window.supabase.functions.invoke('generate-tattoo', {
  body: {
    prompt: 'Test dragon tattoo',
    style: 'traditional'
  }
});
console.log('Résultat:', data);
console.log('Erreur:', error);
```

**Si erreur :**
- Regarder le message d'erreur
- Vérifier les logs Supabase

---

## 📊 Checklist de Diagnostic

```
[ ] Utilisateur connecté ?
[ ] Plan != 'free' ?
[ ] Vision Points > 0 ?
[ ] Edge Functions déployées ?
[ ] Secrets configurés ?
[ ] Pas d'erreur dans les logs Supabase ?
```

---

## 🔧 Solutions Rapides

### **Solution 1 : Créer un Compte de Test avec Points**

```sql
-- Dans Supabase SQL Editor
-- 1. Créer un utilisateur via l'interface Auth
-- 2. Puis exécuter :

UPDATE profiles
SET 
    plan = 'pro',
    vision_points = 15000,
    next_reset_at = NOW() + INTERVAL '1 month',
    free_trial_used = false
WHERE email = 'test@example.com';
```

### **Solution 2 : Vérifier les Logs**

1. Aller sur https://supabase.com/
2. Votre projet → Edge Functions → Logs
3. Chercher les erreurs récentes
4. Regarder les messages d'erreur

### **Solution 3 : Redéployer les Edge Functions**

```bash
# Si les fonctions semblent cassées
npx supabase functions deploy generate-tattoo
npx supabase functions deploy generate-realistic-render
npx supabase functions deploy remove-background
```

---

## 🎯 Test Complet

Voici un script de test complet à exécuter dans la console :

```javascript
async function testApp() {
  console.log('=== TEST TATTOO VISION ===\n');
  
  // 1. Session
  const { data: session } = await window.supabase.auth.getSession();
  console.log('1. Connecté ?', session.session !== null);
  if (!session.session) {
    console.error('❌ Pas connecté ! Créez un compte et connectez-vous.');
    return;
  }
  console.log('   Email:', session.session.user.email);
  
  // 2. Profil
  const { data: profile } = await window.supabase
    .from('profiles')
    .select('plan, vision_points')
    .single();
  console.log('\n2. Plan:', profile?.plan || 'non défini');
  console.log('   Points:', profile?.vision_points || 0);
  
  if (profile?.plan === 'free' || !profile?.vision_points) {
    console.warn('⚠️ Plan gratuit ou pas de points !');
    console.log('   Solution : Mettre à jour le plan en SQL');
  }
  
  // 3. Test Edge Function
  console.log('\n3. Test Edge Function...');
  const { data, error } = await window.supabase.functions.invoke('generate-tattoo', {
    body: {
      prompt: 'Simple test dragon',
      style: 'traditional'
    }
  });
  
  if (error) {
    console.error('❌ Erreur:', error.message);
  } else {
    console.log('✅ Edge Function fonctionne !');
    console.log('   Résultat:', data);
  }
  
  console.log('\n=== FIN DU TEST ===');
}

// Exécuter le test
testApp();
```

---

## 💡 Prochaines Étapes

**Si le problème persiste après ces vérifications :**

1. Copier les messages d'erreur de la console
2. Vérifier les logs Supabase Edge Functions
3. Vérifier que les clés API sont valides :
   - Gemini : https://makersuite.google.com/app/apikey
   - Remove.bg : https://www.remove.bg/api

---

## 📞 Commandes Utiles

```bash
# Voir les Edge Functions
npx supabase functions list

# Voir les secrets
npx supabase secrets list

# Voir les logs en temps réel
npx supabase functions logs generate-tattoo --tail

# Redéployer une fonction
npx supabase functions deploy generate-tattoo
```

---

**💡 La cause la plus probable : Vous n'êtes pas connecté OU vous avez 0 Vision Points (plan gratuit).**

**🎯 Solution rapide : Créez un compte, connectez-vous, et mettez à jour votre plan en 'pro' avec 15 000 points dans Supabase !**
