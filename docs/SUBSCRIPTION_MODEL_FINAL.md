# 🎯 Modèle d'Abonnement Final - Tattoo Vision

## 📊 Modèle Hybride : Plan + Vision Points

### Restrictions de Plan

| Fonctionnalité | Free | Plus/Pro/Studio |
|----------------|------|-----------------|
| **Import de tatouages personnalisés** | ❌ Bloqué | ✅ Débloqué |
| **Bibliothèque officielle** | ✅ Accès | ✅ Accès |

### Utilisation des Fonctionnalités (Vision Points)

| Action | Coût | Qui peut l'utiliser ? |
|--------|------|----------------------|
| AI Tattoo Generation | 100 VP | Tous (si assez de points) |
| Realistic Render | 50 VP | Tous (si assez de points) |
| Background Removal | 25 VP | Tous (si assez de points) |
| Extract Tattoo | 10 VP | Tous (si assez de points) |

## 🔑 Règles Clés

### 1. Utilisateur Free
- ✅ Peut utiliser TOUTES les fonctionnalités (AI, Realistic Render, etc.)
- ✅ Peut utiliser la bibliothèque officielle de tatouages
- ❌ **NE PEUT PAS** importer ses propres tatouages
- 💰 Doit acheter des packs de Vision Points (0 VP/mois inclus)

### 2. Utilisateur Plus/Pro/Studio
- ✅ Peut utiliser TOUTES les fonctionnalités
- ✅ Peut utiliser la bibliothèque officielle
- ✅ **PEUT** importer ses propres tatouages
- 💰 Reçoit des Vision Points mensuels :
  - Plus : 6,000 VP/mois
  - Pro : 15,000 VP/mois
  - Studio : 40,000 VP/mois

## 🎨 Flux Utilisateur

### Scénario 1 : Utilisateur Free avec des points
```
1. Utilisateur Free a acheté 100 Vision Points
2. Veut générer un tatouage AI
3. ✅ Peut le faire (coûte 100 VP)
4. Veut importer son propre tatouage
5. ❌ Bloqué → Doit upgrader à Plus
```

### Scénario 2 : Utilisateur Plus sans points
```
1. Utilisateur Plus a utilisé tous ses 6,000 VP
2. Veut générer un tatouage AI
3. ❌ Bloqué → Doit attendre le reset mensuel ou acheter des points
4. Peut toujours importer ses propres tatouages (pas de coût)
```

### Scénario 3 : Utilisateur Free avec bibliothèque
```
1. Utilisateur Free sans points
2. Peut parcourir la bibliothèque officielle
3. Sélectionne un tatouage de la bibliothèque
4. ✅ Peut l'utiliser (pas de coût pour sélectionner)
5. Veut faire un Realistic Render
6. ❌ Bloqué → Doit acheter des points (50 VP nécessaires)
```

## 💡 Avantages du Modèle

### Pour les Utilisateurs Free
- Peuvent tester toutes les fonctionnalités en achetant quelques points
- Accès à la bibliothèque officielle gratuite
- Peuvent upgrader quand ils veulent leurs propres designs

### Pour les Abonnés
- Vision Points mensuels inclus
- Peuvent importer leurs propres tatouages
- Plus de flexibilité créative

### Pour le Business
- Conversion progressive : Free → Achète des points → Voit la valeur → Abonne
- Revenus récurrents (abonnements) + ponctuels (packs de points)
- Incitation claire à upgrader (import de tatouages personnalisés)

## 🔧 Implémentation Technique

### Vérifications Nécessaires

#### 1. Import de Tatouage
```typescript
// Vérifier le plan
if (userPlan === 'free') {
  showUpgradePrompt('Import de tatouages personnalisés nécessite Plus');
  return;
}
// Permettre l'import
```

#### 2. Utilisation de Fonctionnalité
```typescript
// Vérifier les Vision Points
if (visionPoints < ACTION_COSTS.AI_TATTOO_GENERATION) {
  showBuyPointsPrompt();
  return;
}
// Exécuter l'action et déduire les points
```

## 📋 Checklist d'Implémentation

### Frontend
- [ ] Bloquer l'import de tatouages pour Free
- [ ] Vérifier les Vision Points avant chaque action
- [ ] Afficher le solde de Vision Points
- [ ] Bouton "Buy Points" pour Free
- [ ] Bouton "Upgrade" pour débloquer l'import

### Backend
- [ ] Vérifier le plan dans l'upload de tatouages
- [ ] Vérifier les Vision Points avant chaque action
- [ ] Déduire les points après action réussie
- [ ] Reset mensuel des points pour abonnés

### UI/UX
- [ ] Message clair : "Free = Bibliothèque uniquement"
- [ ] Message clair : "Plus = Import + 6,000 VP/mois"
- [ ] Afficher le coût en VP pour chaque action
- [ ] Afficher le solde actuel de VP

## 🎯 Messages Marketing

### Paywall Free → Plus
```
Débloquez l'Import de Tatouages Personnalisés
+ 6,000 Vision Points mensuels

Actuellement : Bibliothèque officielle uniquement
Avec Plus : Importez vos propres designs
```

### Prompt "Pas Assez de Points"
```
Vous avez besoin de 100 Vision Points
Solde actuel : 25 VP

Options :
- Acheter un pack de points
- Upgrader à Plus (6,000 VP/mois)
```

### Prompt "Import Bloqué"
```
Import de tatouages personnalisés
Réservé aux abonnés Plus, Pro et Studio

Actuellement : Utilisez notre bibliothèque officielle
Avec Plus : Importez vos propres designs
```

---

**Date** : 26 janvier 2026  
**Modèle** : Hybride (Plan + Vision Points)  
**Statut** : Défini et prêt à implémenter
