# 🔒 Sécurité Remove Background - Guide de Correction

## ⚠️ Problème Actuel

Vous avez désactivé **"Verify JWT with legacy secret"**, ce qui signifie:

❌ **Aucune vérification d'authentification automatique**
❌ N'importe qui peut appeler la fonction
❌ Risque d'abus et de vol de crédits
❌ Pas de protection des données utilisateur

## ✅ Solution: Vérification Manuelle Sécurisée

### Option 1: Réactiver la Vérification JWT (Recommandé)

1. **Allez dans Supabase Dashboard**
2. **Edge Functions** → `remove-background` → **Settings**
3. **Cochez** "Verify JWT with legacy secret"
4. **Save changes**

C'est la solution la plus simple et la plus sûre!

### Option 2: Ajouter une Vérification Manuelle

Si vous ne pouvez pas réactiver l'option, modifiez la fonction pour vérifier manuellement:

**Dans `supabase/functions/remove-background/index.ts`, lignes 35-58:**

Remplacez:
```typescript
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (!authHeader && !user) {
  // ...
}
```

Par:
```typescript
// SECURITY: Verify Authorization header is present
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  console.error("401: Missing or invalid Authorization header");
  return new Response(
    JSON.stringify({ ok: false, error: "MISSING_AUTH" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Extract token
const token = authHeader.replace('Bearer ', '');

// Verify user with explicit token
const { data: { user }, error: userError } = await supabase.auth.getUser(token);

if (userError || !user) {
  console.error("401: Token verification failed");
  return new Response(
    JSON.stringify({ ok: false, error: "UNAUTHORIZED" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

console.log("✅ Auth verified for user:", user.id);
```

## 🔐 Couches de Sécurité

Avec ces modifications, la fonction aura:

1. ✅ **Vérification du header Authorization**
2. ✅ **Extraction et validation du token JWT**
3. ✅ **Vérification de l'utilisateur via Supabase**
4. ✅ **Vérification du plan utilisateur**
5. ✅ **Vérification des Vision Points**
6. ✅ **Débit atomique des points**

## 🧪 Tester la Sécurité

### Test 1: Sans Token
```bash
curl -X POST https://zggkmqxnxtjizcygmyfj.supabase.co/functions/v1/remove-background
```
**Attendu:** 401 Unauthorized

### Test 2: Avec Token Invalide
```bash
curl -X POST https://zggkmqxnxtjizcygmyfj.supabase.co/functions/v1/remove-background \
  -H "Authorization: Bearer invalid_token"
```
**Attendu:** 401 Unauthorized

### Test 3: Avec Token Valide
Via votre application (avec un vrai utilisateur connecté)
**Attendu:** 200 OK (ou 402 si pas assez de points)

## 📝 Recommandation

**Je recommande fortement de réactiver "Verify JWT with legacy secret"** dans les paramètres de la fonction. C'est:
- ✅ Plus simple
- ✅ Plus sûr
- ✅ Maintenu par Supabase
- ✅ Pas besoin de code supplémentaire

## 🚀 Actions à Faire

1. **Réactivez** "Verify JWT with legacy secret" dans Supabase Dashboard
2. **Redéployez** la fonction (si vous avez fait des modifications)
3. **Testez** que ça marche toujours
4. **Vérifiez** que les appels non authentifiés sont rejetés

---

## ⚠️ Important

**Ne laissez JAMAIS une fonction Edge sans vérification d'authentification en production!**

Cela pourrait:
- Coûter très cher (abus de l'API remove.bg)
- Exposer les données de vos utilisateurs
- Permettre le vol de Vision Points
- Créer des failles de sécurité

**Réactivez la vérification JWT maintenant!** 🔒
