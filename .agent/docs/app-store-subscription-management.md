# Gestion des Abonnements sur l'App Store - Guide Complet

## 🎯 Réponse Rapide

**NON, vous n'avez PAS besoin d'intégrer un système d'annulation dans votre application.**

Apple gère automatiquement TOUTE la gestion des abonnements (annulation, renouvellement, remboursements). Vous devez simplement fournir des **liens** vers ces fonctionnalités natives d'iOS.

---

## 📱 Comment ça Fonctionne

### 1. Gestion Automatique par Apple

Apple gère automatiquement :

✅ **Annulation d'abonnement**
- L'utilisateur peut annuler à tout moment
- Accessible via : Réglages → [Nom] → Abonnements
- Ou via l'App Store → Compte → Abonnements

✅ **Renouvellement automatique**
- Apple renouvelle automatiquement chaque mois
- Prélève le paiement sur le compte Apple

✅ **Notifications**
- Apple envoie des emails avant le renouvellement
- Notifications si le paiement échoue

✅ **Remboursements**
- Les utilisateurs peuvent demander des remboursements via reportaproblem.apple.com
- En Europe : droit de rétractation de 14 jours

✅ **Changement de plan**
- Upgrade/downgrade entre vos différents plans
- Prise d'effet immédiate ou au prochain cycle

---

## 🔧 Ce que VOUS Devez Implémenter

### Obligations Apple pour l'App Store

Apple **EXIGE** que votre application contienne :

#### 1. Bouton "Restore Purchases" (Restaurer les achats)

**Pourquoi ?** Permet aux utilisateurs de récupérer leurs abonnements sur un nouvel appareil.

**Implémentation dans Tattoo Vision :**
```typescript
// Dans Profile.tsx (ligne 112-124)
<button
    onClick={async () => {
        try {
            await restorePurchases();
            alert("Purchases restored successfully");
        } catch (e) {
            alert("Failed to restore purchases");
        }
    }}
>
    Restore Purchases
</button>
```

✅ **Statut :** Déjà implémenté correctement

---

#### 2. Bouton "Manage Subscription" (Gérer l'abonnement)

**Pourquoi ?** Permet aux utilisateurs d'accéder facilement à la gestion de leur abonnement (y compris l'annulation).

**Implémentation dans Tattoo Vision :**

**Option A : Via RevenueCat Customer Center (RECOMMANDÉ)**
```typescript
// Dans Profile.tsx (ligne 150-165)
<button
    onClick={() => {
        if (isNative) {
            if (profile?.plan === 'free') {
                presentPaywall();
            } else {
                presentCustomerCenter(); // ← Ouvre la gestion native
            }
        } else {
            setShowPaywall(true);
        }
    }}
>
    {profile?.plan === 'free' ? 'Upgrade to Plus' : 'Manage Subscription'}
</button>
```

**Option B : Lien direct vers les Réglages iOS**
```typescript
// Dans Paywall.tsx (ligne 248-261) - CORRIGÉ
<button
    onClick={() => {
        if (Capacitor.isNativePlatform()) {
            presentCustomerCenter(); // ← Méthode native
        } else {
            // Fallback pour le web
            window.open('https://apps.apple.com/account/subscriptions', '_blank');
        }
    }}
>
    Gérer mon abonnement
</button>
```

✅ **Statut :** Maintenant implémenté correctement

---

## 🎨 RevenueCat Customer Center

### Qu'est-ce que c'est ?

RevenueCat fournit un **écran natif de gestion d'abonnement** qui inclut :

- Informations sur l'abonnement actuel
- Date de renouvellement
- **Bouton pour annuler l'abonnement**
- Historique des achats
- Bouton pour restaurer les achats

### Comment ça fonctionne ?

```typescript
import { usePayments } from '../hooks/usePayments';

const { presentCustomerCenter } = usePayments();

// Ouvre l'écran de gestion
presentCustomerCenter();
```

Cet écran redirige automatiquement vers les **Réglages iOS** pour l'annulation.

---

## 📋 Checklist de Conformité App Store

### ✅ Éléments Obligatoires

- [x] **Bouton "Restore Purchases"** présent et fonctionnel
- [x] **Bouton "Manage Subscription"** présent et fonctionnel
- [x] **Lien vers Privacy Policy** dans l'app
- [x] **Lien vers Terms of Service** dans l'app
- [x] **Prix clairement affichés** avant l'achat
- [x] **Texte sur le renouvellement automatique** visible

### ✅ Textes Légaux Requis

Dans votre `Paywall.tsx`, vous avez déjà (ligne 238-243) :

```typescript
<p className="text-[#a1a1aa] text-xs text-center mb-4">
    Renouvellement automatique. Annulez à tout moment dans Réglages → Abonnements.
</p>
<p className="text-[#52525b] text-xs text-center mb-6">
    Les Vision Points se renouvellent mensuellement avec votre abonnement.
    Les VP non utilisés ne sont pas reportés au mois suivant.
</p>
```

✅ **Parfait !** C'est exactement ce qu'Apple demande.

---

## 🚫 Ce que Vous NE Devez PAS Faire

❌ **Ne créez PAS votre propre système d'annulation**
- Apple gère tout automatiquement
- Vous ne pouvez pas annuler un abonnement via l'API

❌ **N'utilisez PAS de liens web pour la gestion sur iOS**
- Utilisez toujours `presentCustomerCenter()` sur iOS
- Les liens web ne fonctionnent pas dans l'app native

❌ **Ne cachez PAS les boutons de gestion**
- Apple rejettera votre app si ces boutons sont difficiles à trouver

---

## 🔄 Flux d'Annulation pour l'Utilisateur

### Scénario : Un utilisateur veut annuler son abonnement

1. **L'utilisateur ouvre votre app**
2. **Va dans Profile ou Paywall**
3. **Clique sur "Gérer mon abonnement"**
4. **RevenueCat ouvre le Customer Center**
5. **L'utilisateur clique sur "Manage Subscription"**
6. **iOS ouvre les Réglages natifs**
7. **L'utilisateur clique sur "Annuler l'abonnement"**
8. **Apple confirme l'annulation**

### Que se passe-t-il après ?

- L'abonnement reste actif jusqu'à la fin de la période payée
- RevenueCat détecte automatiquement l'annulation
- Votre backend (Supabase) reçoit un webhook de RevenueCat
- Le plan de l'utilisateur passe à "free" à la fin de la période

---

## 🔔 Notifications d'Annulation

### Comment savoir qu'un utilisateur a annulé ?

RevenueCat envoie des **webhooks** à votre backend :

```typescript
// Événements RevenueCat
{
  "type": "CANCELLATION",
  "app_user_id": "user_123",
  "product_id": "com.tattoovision.app.plus.monthly",
  "cancellation_date": "2026-02-07T12:00:00Z",
  "expiration_date": "2026-03-07T12:00:00Z"
}
```

Vous devez configurer un **webhook endpoint** dans RevenueCat Dashboard pour recevoir ces notifications.

---

## 📊 Statistiques et Analytics

### Dans RevenueCat Dashboard

Vous pouvez voir :
- Nombre d'abonnements actifs
- Taux d'annulation (churn rate)
- Revenus mensuels récurrents (MRR)
- Raisons d'annulation (si configuré)

### Dans App Store Connect

Vous pouvez voir :
- Abonnements actifs par plan
- Taux de conversion
- Taux de renouvellement

---

## 🎯 Recommandations

### 1. Testez le Flux Complet

Avant de soumettre à l'App Store :

```bash
# 1. Build l'app en mode Release
npm run build
npx cap sync ios
npx cap open ios

# 2. Dans Xcode, testez avec un compte Sandbox
# 3. Achetez un abonnement
# 4. Testez "Manage Subscription"
# 5. Testez "Restore Purchases"
# 6. Annulez l'abonnement
# 7. Vérifiez que le plan revient à "free"
```

### 2. Ajoutez des Logs

Pour déboguer les problèmes d'abonnement :

```typescript
console.log('Current plan:', profile?.plan);
console.log('Subscription status:', customerInfo?.entitlements);
```

### 3. Gérez les Cas Limites

- Utilisateur annule puis réabonne
- Utilisateur change de plan
- Paiement échoué
- Remboursement demandé

---

## 📚 Ressources Officielles

- [Apple - Subscription Best Practices](https://developer.apple.com/app-store/subscriptions/)
- [RevenueCat - Customer Center](https://docs.revenuecat.com/docs/customer-center)
- [App Store Review Guidelines - 3.1.2](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)

---

## ✅ Résumé

### Ce qui est géré par Apple automatiquement :
- ✅ Annulation d'abonnement
- ✅ Renouvellement automatique
- ✅ Remboursements
- ✅ Notifications aux utilisateurs
- ✅ Gestion des paiements

### Ce que vous devez faire :
- ✅ Bouton "Restore Purchases" (déjà fait ✓)
- ✅ Bouton "Manage Subscription" (maintenant corrigé ✓)
- ✅ Texte légal sur le renouvellement (déjà fait ✓)
- ✅ Liens vers Privacy Policy et Terms (déjà fait ✓)

### Votre app est maintenant conforme ! 🎉

Vous pouvez procéder à la soumission sur l'App Store en suivant le workflow `/app-store-submission`.
