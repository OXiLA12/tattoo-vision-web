# 🔧 Remove.bg - Erreur 401 Résolue

## 🎯 Problème Identifié

**Erreur:** `401 Unauthorized`

**Cause:** L'en-tête `Authorization` n'est pas correctement transmis à la fonction Edge.

Dans les logs, on voit que le JWT est présent mais la fonction retourne 401, ce qui signifie que `supabase.auth.getUser()` ne trouve pas l'utilisateur.

## ✅ Solution Simple

Le problème vient de la façon dont le client Supabase est créé dans la fonction Edge. Il faut utiliser le **Service Role Key** au lieu de l'Anon Key pour les opérations d'authentification.

### Modification à Faire

Dans `supabase/functions/remove-background/index.ts`, ligne 28-30:

**Avant:**
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader || "" } },
});
```

**Après:**
```typescript
// Pour vérifier l'auth, utiliser le service role
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: { headers: { Authorization: authHeader || "" } },
  auth: { persistSession: false }
});
```

## 🚀 Étapes pour Corriger

### 1. Modifier le Fichier

Ouvrez `supabase/functions/remove-background/index.ts` et modifiez les lignes 20-30:

```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const authHeader = req.headers.get("Authorization");
const REMOVEBG_API_KEY = Deno.env.get("REMOVEBG_API_KEY");

let requestId: string | null = null;
let creditsInitiated = false;

// Utiliser le service role pour l'authentification
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: { headers: { Authorization: authHeader || "" } },
  auth: { persistSession: false }
});
```

### 2. Redéployer

```bash
supabase functions deploy remove-background
```

### 3. Tester

1. Attendez 30 secondes
2. Rafraîchissez votre app
3. Testez "Remove Background"

## 🔍 Pourquoi Ça Marche

Le **Service Role Key** a les permissions nécessaires pour:
- Vérifier l'authentification des utilisateurs
- Accéder aux tables (profiles, user_credits)
- Exécuter les fonctions RPC

L'**Anon Key** est limitée et ne peut pas toujours vérifier correctement l'auth dans les Edge Functions.

## ⚠️ Alternative: Vérification Manuelle

Si vous ne voulez pas utiliser le Service Role Key, vous pouvez vérifier manuellement le JWT:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Créer un client admin
const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Extraire le token
const token = authHeader?.replace('Bearer ', '');
if (!token) {
  return new Response(JSON.stringify({ error: "No token" }), { status: 401 });
}

// Vérifier le token
const { data: { user }, error } = await admin.auth.getUser(token);
if (error || !user) {
  return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
}
```

## 📝 Checklist

- [ ] Modifier la fonction pour utiliser SUPABASE_SERVICE_ROLE_KEY
- [ ] Redéployer la fonction
- [ ] Attendre 30 secondes
- [ ] Tester remove background
- [ ] Vérifier que ça marche!

---

## 🎉 Résultat Attendu

Après cette modification, le remove background devrait fonctionner correctement! La fonction pourra:
1. ✅ Vérifier l'authentification
2. ✅ Débiter les 250 Vision Points
3. ✅ Appeler l'API remove.bg
4. ✅ Retourner l'image sans fond

**Faites la modification et testez!** 🚀
