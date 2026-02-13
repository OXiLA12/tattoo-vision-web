# ✅ Implémentation RevenueCat iOS - Tattoo Vision

## 📊 Résumé de l'Implémentation

### ✅ Configuration Complète

Votre application est maintenant configurée avec un système d'abonnement hybride :

1. **Plans d'abonnement** : Débloquent l'accès aux fonctionnalités premium
2. **Vision Points** : Monnaie virtuelle pour utiliser les fonctionnalités IA

---

## 🎯 Modèle d'Abonnement Hybride

### Plans et Allocations

| Plan | Prix | Vision Points/mois | Accès Fonctionnalités |
|------|------|-------------------|----------------------|
| **Free** | Gratuit | 0 VP | ❌ Limité |
| **Plus** | 9,99€/mois | 3 000 VP | ✅ Toutes fonctionnalités |
| **Pro** | 19,99€/mois | 10 000 VP | ✅ Toutes fonctionnalités + Support prioritaire |
| **Studio** | 39,99€/mois | 50 000 VP | ✅ Toutes fonctionnalités + API Access |

### Coûts en Vision Points

| Action | Coût VP |
|--------|---------|
| **Génération IA de Tatouage** | 600 VP |
| **Rendu Réaliste** | 1 200 VP |
| **Suppression d'Arrière-plan** | 25 VP |
| **Extraction de Tatouage** | 10 VP |

### Exemples d'Utilisation

#### Plan Plus (3 000 VP/mois)
- ~5 générations IA (5 × 600 = 3 000 VP)
- ~2 rendus réalistes (2 × 1 200 = 2 400 VP)
- ~120 suppressions d'arrière-plan
- Ou un mix de toutes les actions

#### Plan Pro (10 000 VP/mois)
- ~16 générations IA
- ~8 rendus réalistes
- ~400 suppressions d'arrière-plan
- Ou un mix de toutes les actions

#### Plan Studio (50 000 VP/mois)
- ~83 générations IA
- ~41 rendus réalistes
- ~2 000 suppressions d'arrière-plan
- Ou un mix de toutes les actions

---

## 🔐 Gating des Fonctionnalités

### Fonctionnalités Nécessitant un Abonnement

Ces fonctionnalités nécessitent **n'importe quel plan payant** (Plus, Pro ou Studio) :

- ✅ **Import de tatouages personnalisés**
- ✅ **Upload d'images personnalisées**

**Utilisateurs Free** : ❌ Bloqués avec invitation à s'abonner

### Fonctionnalités Payables en Vision Points

Ces fonctionnalités sont **disponibles pour tous les utilisateurs** ayant un abonnement actif :

- ✅ **Génération IA de tatouage** (600 VP)
- ✅ **Rendu réaliste** (1 200 VP)
- ✅ **Suppression d'arrière-plan** (25 VP)
- ✅ **Extraction de tatouage** (10 VP)

**Vérification** : L'utilisateur doit avoir suffisamment de Vision Points pour effectuer l'action.

---

## 📱 Configuration RevenueCat

### Dashboard RevenueCat

#### Offering
- **ID** : `default`
- **Type** : Current Offering

#### Packages

| Package ID | Entitlement | Product ID Apple |
|-----------|-------------|------------------|
| `monthly_plus` | `plus` | `com.tattoovision.app.plus_monthly` |
| `monthly_pro` | `pro` | `com.tattoovision.app.pro2_monthly` |
| `monthly_studio` | `studio` | `com.tattoovision.app.studio1_monthly` |

#### Entitlements

- ✅ `plus` : Accès plan Plus
- ✅ `pro` : Accès plan Pro
- ✅ `studio` : Accès plan Studio

### App Store Connect

#### Produits In-App Purchase

Vous devez créer 3 **Auto-Renewable Subscriptions** :

1. **Plus Monthly**
   - Product ID : `com.tattoovision.app.plus_monthly`
   - Prix : 9,99€/mois
   - Groupe d'abonnement : `tattoo_vision_subscriptions`

2. **Pro Monthly**
   - Product ID : `com.tattoovision.app.pro2_monthly`
   - Prix : 19,99€/mois
   - Groupe d'abonnement : `tattoo_vision_subscriptions`

3. **Studio Monthly**
   - Product ID : `com.tattoovision.app.studio1_monthly`
   - Prix : 39,99€/mois
   - Groupe d'abonnement : `tattoo_vision_subscriptions`

**Important** : Tous les produits doivent être dans le même groupe d'abonnement pour permettre les upgrades/downgrades.

---

## 🏗️ Architecture de l'Application

### Fichiers Clés

#### Configuration
- `src/config/revenuecat.ts` : Configuration centralisée (entitlements, packages, coûts)

#### Hooks
- `src/hooks/usePayments.ts` : Hook pour gérer RevenueCat (achats, restauration, vérification)

#### Contextes
- `src/contexts/SubscriptionContext.tsx` : Contexte global pour l'état d'abonnement

#### Composants
- `src/components/Paywall.tsx` : Interface de sélection et d'achat de plans
- `src/components/PlanPricingModal.tsx` : Modal de tarification (legacy, peut être remplacé par Paywall)

#### Backend (Supabase)
- `supabase/functions/revenuecat-webhook/index.ts` : Webhook pour synchroniser les abonnements
- `supabase/subscription_update.sql` : Schéma de base de données

### Flux d'Utilisation

```
1. Utilisateur ouvre l'app
   ↓
2. RevenueCat s'initialise avec l'API Key iOS
   ↓
3. L'app récupère le CustomerInfo
   ↓
4. Vérification des entitlements actifs
   ↓
5. Détermination du plan (free/plus/pro/studio)
   ↓
6. Affichage de l'UI selon le plan
   ↓
7. Si action nécessite abonnement → Afficher Paywall
   ↓
8. Si action nécessite VP → Vérifier solde → Déduire VP
```

---

## 🔄 Gestion des Abonnements

### Achat Initial

```typescript
import { usePayments } from '../hooks/usePayments';

const { purchasePackage, packages } = usePayments();

// Trouver le package Pro
const proPkg = packages.find(p => p.identifier === 'monthly_pro');

// Acheter
if (proPkg) {
  await purchasePackage(proPkg);
}
```

### Restauration des Achats

```typescript
const { restorePurchases } = usePayments();

await restorePurchases();
```

### Vérification de l'Entitlement

```typescript
const { hasPlus, hasPro, hasStudio, activeEntitlement } = usePayments();

if (hasStudio) {
  // Utilisateur a Studio
} else if (hasPro) {
  // Utilisateur a Pro
} else if (hasPlus) {
  // Utilisateur a Plus
} else {
  // Utilisateur Free
}
```

### Upgrade/Downgrade

RevenueCat et Apple gèrent automatiquement les changements de plan :

- **Upgrade** (Plus → Pro) : Prise d'effet immédiate, crédit au prorata
- **Downgrade** (Pro → Plus) : Prise d'effet à la fin de la période en cours

---

## 🔔 Webhook RevenueCat

### Configuration

1. **URL du Webhook** : `https://[votre-projet].supabase.co/functions/v1/revenuecat-webhook`

2. **Authorization Header** : 
   ```
   Bearer [REVENUECAT_WEBHOOK_SECRET]
   ```

3. **Events à écouter** :
   - `INITIAL_PURCHASE` : Premier achat
   - `RENEWAL` : Renouvellement automatique
   - `CANCELLATION` : Annulation
   - `EXPIRATION` : Expiration
   - `PRODUCT_CHANGE` : Changement de plan

### Synchronisation avec Supabase

Le webhook met à jour automatiquement :

- `profiles.plan` : Plan actif de l'utilisateur
- `profiles.monthly_vision_points` : Allocation de VP selon le plan
- `profiles.next_reset_at` : Date du prochain reset de VP

---

## 🧪 Tests

### Test en Sandbox Apple

1. **Créer un compte Sandbox** dans App Store Connect
2. **Se déconnecter** de l'App Store sur l'appareil de test
3. **Lancer l'app** et tenter un achat
4. **Se connecter** avec le compte Sandbox quand demandé
5. **Vérifier** que l'achat fonctionne

### Tester les Renouvellements

En Sandbox, les renouvellements sont accélérés :

| Durée réelle | Durée Sandbox |
|--------------|---------------|
| 1 mois | 5 minutes |
| 1 an | 1 heure |

### Tester la Restauration

1. Acheter un abonnement
2. Désinstaller l'app
3. Réinstaller l'app
4. Cliquer sur "Restaurer les achats"
5. Vérifier que l'abonnement est restauré

---

## 🚀 Déploiement

### Checklist Pre-Production

- [ ] Produits créés dans App Store Connect
- [ ] Produits approuvés par Apple
- [ ] RevenueCat configuré avec les bons Product IDs
- [ ] Offering `default` créé avec les 3 packages
- [ ] Webhook configuré et testé
- [ ] Tests Sandbox réussis
- [ ] Clé API RevenueCat de production configurée

### Passage en Production

1. **Remplacer la clé API de test** par la clé de production :
   ```typescript
   // src/config/revenuecat.ts
   export const REVENUECAT_CONFIG = {
       IOS_API_KEY: 'appl_[VOTRE_CLE_PRODUCTION]',
       // ...
   }
   ```

2. **Build de production** :
   ```bash
   npm run build
   npx cap sync ios
   ```

3. **Archive Xcode** et upload vers App Store Connect

4. **Soumettre pour review** avec les informations d'abonnement

---

## 📊 Monitoring

### Dashboard RevenueCat

Surveillez :
- **MRR (Monthly Recurring Revenue)** : Revenu mensuel récurrent
- **Active Subscriptions** : Abonnements actifs
- **Churn Rate** : Taux d'annulation
- **Trial Conversions** : Conversions d'essai (si vous ajoutez des trials)

### Métriques Importantes

- **Conversion Rate** : % d'utilisateurs qui s'abonnent
- **ARPU** : Revenu moyen par utilisateur
- **LTV** : Valeur vie client
- **Retention** : Taux de rétention par cohorte

---

## 🛠️ Dépannage

### "No packages available"

**Cause** : Les produits ne sont pas configurés ou pas approuvés

**Solution** :
1. Vérifier que les produits existent dans App Store Connect
2. Vérifier que les Product IDs correspondent exactement
3. Attendre l'approbation Apple (peut prendre 24-48h)

### "Purchase failed"

**Cause** : Problème avec le compte Sandbox ou la configuration

**Solution** :
1. Vérifier que vous êtes connecté avec un compte Sandbox
2. Vérifier que le produit est disponible dans votre région
3. Vérifier les logs Xcode pour plus de détails

### "Entitlement not active"

**Cause** : Le webhook n'a pas synchronisé correctement

**Solution** :
1. Vérifier que le webhook est configuré
2. Vérifier les logs du webhook dans Supabase
3. Forcer une synchronisation avec `restorePurchases()`

### Vision Points ne se réinitialisent pas

**Cause** : La fonction de reset n'est pas appelée

**Solution** :
1. Vérifier que `next_reset_at` est défini dans `profiles`
2. Vérifier que la fonction `sync_user_plan_points` existe
3. Appeler manuellement la fonction si nécessaire

---

## 📝 Métadonnées Apple Manquantes

Pour soumettre votre app, vous devrez fournir pour **chaque abonnement** :

### Informations Requises

1. **Nom d'affichage** (Display Name)
   - Plus : "Tattoo Vision Plus"
   - Pro : "Tattoo Vision Pro"
   - Studio : "Tattoo Vision Studio"

2. **Description** (Description)
   - Expliquer ce que chaque plan offre
   - Mentionner les Vision Points
   - Lister les fonctionnalités clés

3. **Captures d'écran** (Screenshots)
   - Montrer l'interface du paywall
   - Montrer les fonctionnalités débloquées

4. **Politique de confidentialité** (Privacy Policy URL)
   - URL vers votre politique de confidentialité

5. **Conditions d'utilisation** (Terms of Use URL)
   - URL vers vos conditions d'utilisation

### Exemple de Description

**Plus** :
```
Débloquez toutes les fonctionnalités de Tattoo Vision avec 3 000 Vision Points par mois.

• Import de tatouages personnalisés
• Génération IA de tatouages (~5/mois)
• Rendu réaliste (~2/mois)
• Suppression d'arrière-plan illimitée
• Sauvegarde dans votre bibliothèque
• Export haute qualité

Renouvellement automatique. Annulez à tout moment.
```

---

## ✅ Résultat Final

Votre application dispose maintenant de :

✅ **Système d'abonnement iOS natif** via Apple In-App Purchase  
✅ **3 plans tarifaires** (Plus, Pro, Studio)  
✅ **Gestion automatique** des renouvellements et annulations  
✅ **Restauration des achats** fonctionnelle  
✅ **Synchronisation backend** via webhook RevenueCat  
✅ **Feature gating** basé sur les entitlements  
✅ **Vision Points** comme monnaie virtuelle  
✅ **UI/UX premium** avec le composant Paywall  

### Prochaines Étapes

1. **Tester en Sandbox** avec tous les scénarios
2. **Configurer les métadonnées** dans App Store Connect
3. **Soumettre pour review** Apple
4. **Monitorer les métriques** dans RevenueCat
5. **Optimiser la conversion** basé sur les données

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Documentation RevenueCat** : https://docs.revenuecat.com
2. **Support RevenueCat** : support@revenuecat.com
3. **Documentation Apple** : https://developer.apple.com/in-app-purchase/

---

**Dernière mise à jour** : 26 janvier 2026  
**Version** : 1.0.0
