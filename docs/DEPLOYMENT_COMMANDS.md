# 🚀 Commandes de Déploiement RevenueCat

## Prérequis

```bash
# Vérifier que Supabase CLI est installé
supabase --version

# Si non installé :
npm install -g supabase
```

---

## 1. Déploiement du Webhook

### Se connecter à Supabase

```bash
supabase login
```

### Déployer la fonction webhook

```bash
# Depuis la racine du projet
cd c:\Users\Kali\Desktop\tattoo-vision-updated\project

# Déployer
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

**Sortie attendue :**
```
Deploying function revenuecat-webhook...
Function URL: https://[votre-projet].supabase.co/functions/v1/revenuecat-webhook
```

### Créer le secret du webhook

```bash
# Remplacez par votre propre secret sécurisé
supabase secrets set REVENUECAT_WEBHOOK_SECRET="votre_secret_ultra_securise_123"
```

**⚠️ Important :** Notez bien ce secret, vous en aurez besoin pour configurer RevenueCat.

---

## 2. Vérifier le Déploiement

### Lister les fonctions déployées

```bash
supabase functions list
```

### Voir les logs en temps réel

```bash
supabase functions logs revenuecat-webhook --tail
```

### Tester le webhook localement (optionnel)

```bash
# Démarrer l'environnement local
supabase start

# Servir la fonction localement
supabase functions serve revenuecat-webhook

# Dans un autre terminal, tester avec curl
curl -X POST http://localhost:54321/functions/v1/revenuecat-webhook \
  -H "Authorization: votre_secret_ultra_securise_123" \
  -H "Content-Type: application/json" \
  -d '{"event": {"type": "TEST"}}'
```

---

## 3. Configuration RevenueCat

### Récupérer l'URL du webhook

Après le déploiement, l'URL sera :
```
https://[votre-projet-id].supabase.co/functions/v1/revenuecat-webhook
```

### Configurer dans RevenueCat Dashboard

1. Aller sur https://app.revenuecat.com
2. Sélectionner votre projet "Tattoo Vision"
3. **Integrations** → **Webhooks**
4. Cliquer sur **+ Add Webhook**
5. Remplir :
   - **URL** : L'URL du webhook ci-dessus
   - **Authorization Header** :
     - Key : `Authorization`
     - Value : Le secret défini à l'étape 1
6. **Events** : Sélectionner tous :
   - ✅ INITIAL_PURCHASE
   - ✅ RENEWAL
   - ✅ CANCELLATION
   - ✅ EXPIRATION
   - ✅ PRODUCT_CHANGE
   - ✅ NON_RENEWING_PURCHASE
7. Cliquer sur **Save**

### Tester le webhook

Dans RevenueCat Dashboard :
1. Aller dans **Integrations** → **Webhooks**
2. Trouver votre webhook
3. Cliquer sur **Send Test**
4. Vérifier les logs :

```bash
supabase functions logs revenuecat-webhook --tail
```

**Sortie attendue :**
```
Received event: TEST for user: test_user_id product: test_product
```

---

## 4. Synchronisation iOS

### Synchroniser Capacitor

```bash
# Synchroniser les assets et plugins
npx cap sync ios
```

### Ouvrir le projet iOS

```bash
npx cap open ios
```

---

## 5. Build et Test

### Build iOS (Xcode)

1. Ouvrir Xcode (via `npx cap open ios`)
2. Sélectionner un simulateur (ex: iPhone 15 Pro)
3. Product → Build (⌘B)
4. Product → Run (⌘R)

### Tester les achats sur simulateur

1. Dans l'app, naviguer vers une fonctionnalité payante
2. Le Paywall s'affiche
3. Dans Xcode : **Features** → **StoreKit** → **Manage Transactions**
4. Sélectionner un produit et approuver
5. Vérifier que l'entitlement est débloqué

### Vérifier dans RevenueCat

1. Aller sur https://app.revenuecat.com
2. **Customers** → Rechercher votre utilisateur
3. Vérifier l'entitlement actif

---

## 6. Commandes de Maintenance

### Voir tous les secrets

```bash
supabase secrets list
```

### Mettre à jour un secret

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET="nouveau_secret"
```

### Supprimer un secret

```bash
supabase secrets unset REVENUECAT_WEBHOOK_SECRET
```

### Redéployer après modification

```bash
# Après modification du code du webhook
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

### Voir l'historique des déploiements

```bash
supabase functions list
```

---

## 7. Déploiement TestFlight

### Préparer l'archive

Dans Xcode :
1. Product → Archive
2. Attendre la fin de l'archivage
3. Organizer s'ouvre automatiquement

### Uploader vers App Store Connect

1. Dans Organizer, sélectionner l'archive
2. Cliquer sur **Distribute App**
3. Sélectionner **App Store Connect**
4. Suivre les étapes
5. Uploader

### Configurer TestFlight

1. Aller sur https://appstoreconnect.apple.com
2. **My Apps** → Sélectionner votre app
3. **TestFlight** → Ajouter des testeurs
4. Distribuer le build

---

## 8. Monitoring

### Logs du webhook en temps réel

```bash
supabase functions logs revenuecat-webhook --tail
```

### Logs des dernières 24h

```bash
supabase functions logs revenuecat-webhook
```

### Filtrer les erreurs

```bash
supabase functions logs revenuecat-webhook | grep -i error
```

---

## 9. Rollback (si nécessaire)

### Revenir à une version précédente

```bash
# Lister les versions
supabase functions list

# Redéployer une version spécifique (si disponible)
# Note: Supabase ne garde pas l'historique des versions
# Il faut utiliser Git pour revenir en arrière

git checkout <commit-hash> -- supabase/functions/revenuecat-webhook
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

---

## 10. Variables d'Environnement

### Lister toutes les variables

```bash
supabase secrets list
```

### Ajouter d'autres secrets (si nécessaire)

```bash
# Exemple : ajouter une clé API
supabase secrets set GEMINI_API_KEY="votre_cle_api"
```

---

## ✅ Checklist de Déploiement

- [ ] Supabase CLI installé
- [ ] Connecté à Supabase (`supabase login`)
- [ ] Webhook déployé
- [ ] Secret configuré
- [ ] Webhook configuré dans RevenueCat
- [ ] Test webhook réussi
- [ ] Logs vérifiés
- [ ] iOS synchronisé (`npx cap sync ios`)
- [ ] Build iOS réussi
- [ ] Test sur simulateur réussi
- [ ] Vérification dans RevenueCat Dashboard

---

## 🆘 Dépannage

### Erreur : "Function not found"

```bash
# Vérifier que vous êtes dans le bon répertoire
pwd

# Vérifier que le fichier existe
ls supabase/functions/revenuecat-webhook/index.ts

# Redéployer
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

### Erreur : "Unauthorized"

```bash
# Vérifier que vous êtes connecté
supabase login

# Vérifier le projet
supabase projects list
```

### Erreur : "Secret not found"

```bash
# Lister les secrets
supabase secrets list

# Recréer le secret
supabase secrets set REVENUECAT_WEBHOOK_SECRET="votre_secret"
```

---

**Dernière mise à jour** : 26 janvier 2026
