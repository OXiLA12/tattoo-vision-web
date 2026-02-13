# 📚 Documentation RevenueCat - Tattoo Vision

Bienvenue dans la documentation complète de l'implémentation RevenueCat pour Tattoo Vision iOS.

---

## 📖 Guides Disponibles

### 🚀 Pour Commencer

1. **[REVENUECAT_QUICKSTART.md](./REVENUECAT_QUICKSTART.md)**
   - Guide de démarrage rapide
   - Étapes restantes à compléter
   - Exemples d'utilisation de base
   - **Commencez par ici !**

2. **[DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)**
   - Toutes les commandes de déploiement
   - Configuration du webhook
   - Build et test iOS
   - Monitoring et maintenance

### 📋 Documentation Complète

3. **[REVENUECAT_IOS_IMPLEMENTATION.md](./REVENUECAT_IOS_IMPLEMENTATION.md)**
   - Architecture détaillée
   - Flux utilisateur
   - Utilisation avancée
   - Tests et dépannage
   - Monitoring et métriques

4. **[REVENUECAT_IMPLEMENTATION_SUMMARY.md](./REVENUECAT_IMPLEMENTATION_SUMMARY.md)**
   - Résumé de tout ce qui a été implémenté
   - Matrice d'accès aux fonctionnalités
   - Métadonnées Apple requises
   - Checklist finale

5. **[REVENUECAT_SETUP_GUIDE_FR.md](./REVENUECAT_SETUP_GUIDE_FR.md)**
   - Guide de configuration initial RevenueCat
   - Création des produits Apple
   - Configuration des offerings
   - Setup du webhook

---

## 🎯 Parcours Recommandé

### Si vous débutez :

1. Lire **REVENUECAT_QUICKSTART.md**
2. Suivre **DEPLOYMENT_COMMANDS.md** pour déployer
3. Consulter **REVENUECAT_IMPLEMENTATION_SUMMARY.md** pour comprendre ce qui a été fait

### Si vous voulez comprendre en profondeur :

1. Lire **REVENUECAT_IOS_IMPLEMENTATION.md**
2. Consulter **REVENUECAT_SETUP_GUIDE_FR.md** pour la configuration
3. Utiliser **DEPLOYMENT_COMMANDS.md** comme référence

### Si vous cherchez une information spécifique :

- **Comment utiliser dans le code ?** → REVENUECAT_QUICKSTART.md (section "Utilisation dans le Code")
- **Quelles commandes exécuter ?** → DEPLOYMENT_COMMANDS.md
- **Qu'est-ce qui a été implémenté ?** → REVENUECAT_IMPLEMENTATION_SUMMARY.md
- **Comment tester ?** → REVENUECAT_IOS_IMPLEMENTATION.md (section "Tests")
- **Problème technique ?** → REVENUECAT_IOS_IMPLEMENTATION.md (section "Dépannage")

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         iOS App                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SubscriptionContext                         │  │
│  │  - Gère l'état global des abonnements                │  │
│  │  - Détecte l'entitlement actif                       │  │
│  │  - Affiche le paywall si nécessaire                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           usePayments Hook                            │  │
│  │  - Interface avec RevenueCat SDK                     │  │
│  │  - Récupère les packages                             │  │
│  │  - Gère les achats                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │   RevenueCat   │
                   │   (Offering)   │
                   └────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Apple StoreKit│
                   │  (IAP Purchase)│
                   └────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │   RevenueCat   │
                   │   (Webhook)    │
                   └────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │    Supabase    │
                   │  Edge Function │
                   └────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │    Supabase    │
                   │    Database    │
                   │  (profiles)    │
                   └────────────────┘
```

---

## 🔑 Concepts Clés

### Entitlements
Les entitlements sont les "droits" que l'utilisateur obtient après un achat :
- `plus` → Accès aux fonctionnalités Plus
- `pro` → Accès aux fonctionnalités Pro
- `studio` → Accès aux fonctionnalités Studio

### Packages
Les packages sont les produits que l'utilisateur peut acheter :
- `monthly_plus` → Abonnement Plus mensuel
- `monthly_pro` → Abonnement Pro mensuel
- `monthly_studio` → Abonnement Studio mensuel

### Offering
L'offering est un groupe de packages présentés ensemble :
- `default` → L'offering principale avec les 3 packages

### Vision Points
Monnaie virtuelle mensuelle incluse dans chaque plan :
- Free : 0 VP
- Plus : 6,000 VP/mois
- Pro : 15,000 VP/mois
- Studio : 40,000 VP/mois

---

## 📊 Matrice d'Accès

| Fonctionnalité | Free | Plus | Pro | Studio |
|----------------|------|------|-----|--------|
| AI Generation | ❌ | ✅ | ✅ | ✅ |
| Realistic Render | ❌ | ✅ | ✅ | ✅ |
| Background Removal | ❌ | ✅ | ✅ | ✅ |
| Save to Library | ❌ | ✅ | ✅ | ✅ |
| Commercial License | ❌ | ❌ | ✅ | ✅ |
| Team Collaboration | ❌ | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Fichiers Implémentés

### Frontend (React)
```
src/
├── contexts/
│   └── SubscriptionContext.tsx    # Contexte global d'abonnement
├── hooks/
│   └── usePayments.ts              # Hook RevenueCat
├── components/
│   ├── Paywall.tsx                 # Écran d'abonnement
│   └── PaywallWrapper.tsx          # Wrapper du paywall
└── utils/
    └── featureGating.ts            # Utilitaires de contrôle d'accès
```

### Backend (Supabase)
```
supabase/
└── functions/
    └── revenuecat-webhook/
        └── index.ts                # Webhook RevenueCat
```

### Documentation
```
docs/
├── README_REVENUECAT.md                        # Ce fichier
├── REVENUECAT_QUICKSTART.md                    # Guide rapide
├── REVENUECAT_IOS_IMPLEMENTATION.md            # Guide complet
├── REVENUECAT_IMPLEMENTATION_SUMMARY.md        # Résumé
├── REVENUECAT_SETUP_GUIDE_FR.md                # Setup initial
└── DEPLOYMENT_COMMANDS.md                      # Commandes
```

---

## ✅ Checklist de Déploiement

### Configuration RevenueCat
- [ ] Produits Apple créés dans App Store Connect
- [ ] Offering "default" créée et marquée "Current"
- [ ] 3 Packages configurés et liés aux entitlements
- [ ] Métadonnées Apple complétées (FR + EN)

### Déploiement Backend
- [ ] Webhook déployé sur Supabase
- [ ] Secret configuré
- [ ] Webhook configuré dans RevenueCat
- [ ] Test webhook réussi

### Tests
- [ ] Test sur simulateur iOS
- [ ] Test sur appareil réel (Sandbox)
- [ ] Vérification dans RevenueCat Dashboard
- [ ] Test de restauration des achats
- [ ] Test de changement de plan

### Production
- [ ] Build TestFlight
- [ ] Tests beta réussis
- [ ] Monitoring activé
- [ ] Support client préparé

---

## 🆘 Support

### Documentation Externe
- **RevenueCat Docs** : https://www.revenuecat.com/docs
- **Apple IAP Guide** : https://developer.apple.com/in-app-purchase/
- **Supabase Edge Functions** : https://supabase.com/docs/guides/functions

### Dépannage
Consultez la section "Dépannage" dans :
- **REVENUECAT_IOS_IMPLEMENTATION.md** pour les problèmes techniques
- **REVENUECAT_QUICKSTART.md** pour les problèmes courants

---

## 📞 Contact

Pour toute question sur l'implémentation, consultez d'abord cette documentation.

**Dernière mise à jour** : 26 janvier 2026
