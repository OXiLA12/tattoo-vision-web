# 🔧 Configuration Remove.bg - Guide de Résolution

## 🎯 Problème Identifié

**Erreur:** `500 Internal Server Error` de la fonction `remove-background`

**Cause:** La clé API remove.bg n'est pas configurée ou est invalide dans Supabase.

## ✅ Solution: Configurer la Clé API

### Étape 1: Obtenir une Clé API Remove.bg

1. **Allez sur** https://www.remove.bg/api
2. **Créez un compte** (gratuit)
3. **Obtenez votre clé API** dans le dashboard
4. **Copiez la clé** (format: `xxxxxxxxxxxxx`)

### Étape 2: Configurer dans Supabase

#### Option A: Via Supabase Dashboard (Recommandé)

1. **Allez sur** https://supabase.com/dashboard
2. **Sélectionnez votre projet** "Tattoo Vision"
3. **Allez dans** `Settings` → `Edge Functions`
4. **Cliquez sur** `Manage secrets`
5. **Ajoutez un nouveau secret:**
   - **Nom:** `REMOVEBG_API_KEY`
   - **Valeur:** Votre clé API remove.bg
6. **Sauvegardez**

#### Option B: Via CLI Supabase

```bash
# Dans le terminal
supabase secrets set REMOVEBG_API_KEY=votre_cle_api_ici
```

### Étape 3: Redéployer la Fonction (si nécessaire)

```bash
# Redéployer la fonction remove-background
supabase functions deploy remove-background
```

## 🧪 Tester Après Configuration

1. **Attendez 1-2 minutes** que le secret soit propagé
2. **Rafraîchissez votre application**
3. **Essayez à nouveau** "Remove Background"
4. **Vérifiez la console** - l'erreur devrait disparaître

## 🔍 Vérifier que la Clé est Configurée

### Via Supabase Dashboard

1. `Settings` → `Edge Functions` → `Secrets`
2. Vous devriez voir `REMOVEBG_API_KEY` dans la liste

### Via les Logs de la Fonction

Si la clé n'est pas configurée, vous verrez dans les logs Supabase:
```json
{
  "error": "SERVER_MISCONFIG",
  "details": "RemoveBG API Key missing"
}
```

## ⚠️ Alternative: Désactiver Temporairement

Si vous voulez tester l'application **sans** remove.bg pour l'instant:

### Option 1: Masquer le Bouton

Dans `src/components/ImageUpload.tsx`, commentez le bouton:

```tsx
{/* Temporairement désactivé
{tattooImage && !isLoadingTattoo && (
  <button onClick={handleRemoveBackground}>
    Remove Background
  </button>
)}
*/}
```

### Option 2: Afficher un Message

Modifiez `handleRemoveBackground` pour afficher un message:

```tsx
const handleRemoveBackground = async () => {
  setError('Background removal is temporarily unavailable. Please configure remove.bg API key.');
  return;
  // ... reste du code
};
```

## 📊 Plans Remove.bg

Remove.bg offre plusieurs plans:

| Plan | Crédits/mois | Prix |
|------|--------------|------|
| **Free** | 50 | 0€ |
| **Subscription** | 500 | 9$/mois |
| **Pay as you go** | À l'unité | 0.20$/image |

**Pour les tests:** Le plan gratuit (50 crédits) est suffisant.

## 🔐 Sécurité

**Important:** 
- ✅ La clé API doit être dans Supabase (côté serveur)
- ❌ Ne JAMAIS mettre la clé dans le code frontend
- ❌ Ne JAMAIS commit la clé dans Git

## 📝 Checklist de Configuration

- [ ] Compte remove.bg créé
- [ ] Clé API obtenue
- [ ] Clé ajoutée dans Supabase secrets
- [ ] Fonction redéployée (si nécessaire)
- [ ] Attendu 1-2 minutes
- [ ] Testé à nouveau

---

## 🚀 Prochaines Étapes

1. **Configurez la clé API** en suivant les étapes ci-dessus
2. **Testez à nouveau** le remove background
3. **Si ça ne marche toujours pas**, partagez-moi les nouveaux logs

Ou si vous préférez **tester le reste de l'application d'abord**, désactivez temporairement cette fonctionnalité et on la configurera plus tard.

**Que préférez-vous faire?** 🤔
