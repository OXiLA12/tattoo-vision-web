# 🚀 Guide de Finalisation - RevenueCat iOS

## ✅ Ce qui est déjà fait

### Configuration du Code
- [x] Hook `usePayments` configuré avec les 3 entitlements
- [x] Composant `Paywall` prêt à afficher les packages RevenueCat
- [x] Contexte `SubscriptionContext` pour gérer l'état global
- [x] Fichier de configuration `revenuecat.ts` avec les bonnes valeurs
- [x] Utilitaires de feature gating implémentés
- [x] Vision Points : Plus 6000, Pro 15000, Studio 40000
- [x] Coûts : AI Gen 600 VP, Realistic Render 1200 VP

---

## 🎯 Ce qu'il reste à faire

### 1. App Store Connect (CRITIQUE)

#### Créer les Produits In-App Purchase

1. **Aller sur** : https://appstoreconnect.apple.com
2. **Sélectionner** : Votre app Tattoo Vision
3. **Aller dans** : Features → In-App Purchases
4. **Créer** un nouveau groupe d'abonnement :
   - Nom : `Tattoo Vision Subscriptions`
   - Reference Name : `tattoo_vision_subscriptions`

5. **Créer 3 abonnements auto-renouvelables** :

#### Abonnement 1 : Plus
```
Product ID: com.tattoovision.app.plus_monthly
Reference Name: Tattoo Vision Plus Monthly
Subscription Group: tattoo_vision_subscriptions
Duration: 1 Month
Price: 9,99€

Display Name (FR): Tattoo Vision Plus
Description (FR): 
Débloquez toutes les fonctionnalités de Tattoo Vision avec 6 000 Vision Points par mois.

• Import de tatouages personnalisés
• 6 000 Vision Points/mois
• ~10 générations IA de tatouages
• ~5 rendus réalistes
• Suppression d'arrière-plan illimitée
• Sauvegarde dans votre bibliothèque

Renouvellement automatique. Annulez à tout moment.
```

#### Abonnement 2 : Pro
```
Product ID: com.tattoovision.app.pro2_monthly
Reference Name: Tattoo Vision Pro Monthly
Subscription Group: tattoo_vision_subscriptions
Duration: 1 Month
Price: 19,99€

Display Name (FR): Tattoo Vision Pro
Description (FR):
Pour les créateurs passionnés. 15 000 Vision Points par mois.

• Tout de Plus
• 15 000 Vision Points/mois
• ~25 générations IA de tatouages
• ~12 rendus réalistes
• Support prioritaire
• Qualité d'image supérieure

Renouvellement automatique. Annulez à tout moment.
```

#### Abonnement 3 : Studio
```
Product ID: com.tattoovision.app.studio1_monthly
Reference Name: Tattoo Vision Studio Monthly
Subscription Group: tattoo_vision_subscriptions
Duration: 1 Month
Price: 39,99€

Display Name (FR): Tattoo Vision Studio
Description (FR):
Pour les professionnels. 40 000 Vision Points par mois.

• Tout de Pro
• 40 000 Vision Points/mois
• ~66 générations IA de tatouages
• ~33 rendus réalistes
• Support dédié 24/7
• Accès API
• Exports haute résolution

Renouvellement automatique. Annulez à tout moment.
```

6. **Soumettre** chaque produit pour review Apple
7. **Attendre** l'approbation (24-48h généralement)

---

### 2. RevenueCat Dashboard

#### Vérifier la Configuration

1. **Aller sur** : https://app.revenuecat.com
2. **Projet** : Tattoo Vision
3. **Vérifier** :
   - [x] Offering `default` existe
   - [x] 3 Packages créés : `monthly_plus`, `monthly_pro`, `monthly_studio`
   - [x] 3 Entitlements créés : `plus`, `pro`, `studio`
   - [x] Chaque package est lié au bon entitlement

#### Configurer le Webhook

1. **Aller dans** : Project Settings → Integrations → Webhooks
2. **Ajouter** un nouveau webhook :
   ```
   URL: https://[votre-projet-id].supabase.co/functions/v1/revenuecat-webhook
   Authorization: Bearer [REVENUECAT_WEBHOOK_SECRET]
   ```

3. **Sélectionner les événements** :
   - [x] `INITIAL_PURCHASE`
   - [x] `RENEWAL`
   - [x] `CANCELLATION`
   - [x] `EXPIRATION`
   - [x] `PRODUCT_CHANGE`

4. **Tester** le webhook avec le bouton "Send Test"

---

### 3. Supabase

#### Déployer le Webhook

```bash
# Depuis le dossier du projet
cd supabase/functions/revenuecat-webhook

# Déployer
supabase functions deploy revenuecat-webhook
```

#### Configurer le Secret

```bash
# Générer un secret fort
openssl rand -base64 32

# Configurer dans Supabase
supabase secrets set REVENUECAT_WEBHOOK_SECRET="[votre-secret-généré]"
```

#### Vérifier le Schéma

Assurez-vous que la table `profiles` a les colonnes :
- `plan` : TEXT (free, plus, pro, studio)
- `monthly_vision_points` : INTEGER
- `next_reset_at` : TIMESTAMP

---

### 4. Tests en Sandbox

#### Créer un Compte Sandbox

1. **Aller sur** : https://appstoreconnect.apple.com
2. **Users and Access** → **Sandbox Testers**
3. **Créer** un nouveau testeur :
   ```
   Email: test@tattoovision.com
   Password: [mot de passe fort]
   Country: France
   ```

#### Tester l'Achat

1. **Sur iPhone/iPad de test** :
   - Se déconnecter de l'App Store
   - Lancer l'app Tattoo Vision
   - Ouvrir le Paywall
   - Tenter un achat
   - Se connecter avec le compte Sandbox

2. **Vérifier** :
   - L'achat se complète sans erreur
   - L'entitlement est actif dans l'app
   - Les Vision Points sont attribués dans Supabase
   - Le webhook a bien été appelé

#### Tester la Restauration

1. Acheter un plan
2. Désinstaller l'app
3. Réinstaller l'app
4. Cliquer sur "Restaurer les achats"
5. Vérifier que le plan est restauré

---

### 5. Passage en Production

#### Remplacer la Clé API Test

Dans `src/config/revenuecat.ts` :

```typescript
export const REVENUECAT_CONFIG = {
    // AVANT (test)
    IOS_API_KEY: 'test_YayyfBpYgTiYMQCEpDGOjXgqdVS',
    
    // APRÈS (production)
    IOS_API_KEY: 'appl_[VOTRE_CLE_PRODUCTION]',
    
    // ...
}
```

**Où trouver la clé de production ?**
1. RevenueCat Dashboard
2. Project Settings → API Keys
3. Copier la clé "Apple App Store"

#### Build de Production

```bash
# Build l'app
npm run build

# Sync avec Capacitor
npx cap sync ios

# Ouvrir dans Xcode
npx cap open ios
```

#### Archive et Upload

1. Dans Xcode : Product → Archive
2. Attendre la fin de l'archive
3. Window → Organizer
4. Sélectionner l'archive
5. Cliquer sur "Distribute App"
6. Choisir "App Store Connect"
7. Suivre les étapes

---

## 🔍 Vérifications Finales

### Avant de Soumettre à Apple

- [ ] Les 3 produits In-App Purchase sont approuvés
- [ ] Le webhook RevenueCat fonctionne (test réussi)
- [ ] Les tests Sandbox sont tous passés
- [ ] La clé API de production est configurée
- [ ] L'app build sans erreur
- [ ] Les métadonnées sont complètes (screenshots, description, etc.)

### Checklist de Soumission

- [ ] App Icon (1024x1024)
- [ ] Screenshots (tous les formats requis)
- [ ] Description de l'app
- [ ] Mots-clés
- [ ] Politique de confidentialité (URL)
- [ ] Conditions d'utilisation (URL)
- [ ] Informations sur les abonnements
- [ ] Coordonnées de support

---

## 📞 Support

### Si vous rencontrez des problèmes

#### Problème : "No packages available"
**Solution** : Les produits ne sont pas encore approuvés par Apple. Attendez 24-48h.

#### Problème : "Purchase failed"
**Solution** : Vérifiez que vous êtes connecté avec un compte Sandbox, pas votre compte réel.

#### Problème : "Entitlement not active"
**Solution** : Le webhook n'a pas synchronisé. Vérifiez les logs Supabase et testez le webhook manuellement.

#### Problème : "Vision Points not updated"
**Solution** : Vérifiez que la fonction `sync_user_plan_points` existe dans Supabase et fonctionne.

---

## 🎯 Résumé

Vous avez maintenant :

✅ **Code prêt** : Tous les fichiers sont configurés avec les bonnes valeurs  
✅ **Architecture solide** : Modèle hybride Plans + Vision Points  
✅ **Documentation complète** : Guides et exemples  

**Il reste à faire** :
1. Créer les produits dans App Store Connect
2. Configurer le webhook RevenueCat
3. Tester en Sandbox
4. Passer en production
5. Soumettre à Apple

**Temps estimé** : 2-3 heures de configuration + 24-48h d'attente Apple

---

**Bon courage ! 🚀**
