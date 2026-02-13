# ⚠️ IMPORTANT : Développement iOS sur Windows

## 🖥️ Situation Actuelle

Vous êtes sur **Windows**, mais pour soumettre une app iOS à l'App Store, vous avez besoin d'un **Mac** avec **Xcode**.

---

## ✅ Ce Que Vous Avez Déjà Fait

1. ✅ Logo implanté (toutes les tailles générées)
2. ✅ Documents légaux créés
3. ✅ Site web légal prêt à déployer
4. ✅ Configuration Capacitor iOS
5. ✅ RevenueCat configuré dans le code

**Progression : 60% ✅**

---

## 🎯 Options pour Continuer

### **Option 1 : Utiliser Codemagic (RECOMMANDÉ - Sans Mac)**

**Avantages :**
- ✅ Pas besoin de Mac
- ✅ Build automatique dans le cloud
- ✅ Gratuit (500 min/mois)
- ✅ Upload automatique vers App Store

**Guide complet :** `docs/BUILD_IOS_WITHOUT_MAC.md`

**Étapes rapides :**
1. Créer un compte sur https://codemagic.io/
2. Connecter votre projet GitHub
3. Configurer les certificats Apple
4. Lancer le build
5. L'app sera uploadée automatiquement

**Coût :** Gratuit (ou 99$/mois si vous dépassez 500 min)

---

### **Option 2 : Louer un Mac dans le Cloud**

**MacinCloud** - https://www.macincloud.com/
- À partir de 30$/mois
- Mac accessible à distance
- Xcode préinstallé
- Parfait pour usage ponctuel

**MacStadium** - https://www.macstadium.com/
- À partir de 79$/mois
- Mac dédié
- Meilleures performances

---

### **Option 3 : Emprunter/Louer un Mac Physique**

Si vous connaissez quelqu'un avec un Mac :
1. Transférer votre projet (via USB ou GitHub)
2. Faire l'archive sur son Mac
3. Uploader vers App Store Connect
4. Continuer la soumission depuis Windows

**Temps nécessaire sur Mac :** 1-2 heures

---

### **Option 4 : Acheter un Mac (Long terme)**

Si vous prévoyez de développer régulièrement pour iOS :
- **Mac Mini M2** : À partir de 699€
- **MacBook Air M2** : À partir de 1199€

---

## 📋 Ce Que Vous Pouvez Faire MAINTENANT sur Windows

### 1. **Publier les Documents Légaux** (30 min)

```bash
# Le dossier legal-site/ est prêt
# Déployer sur Netlify
```

**Guide :** `docs/PUBLISH_LEGAL_DOCS.md`

**Résultat :** URLs pour App Store Connect

---

### 2. **Créer les Screenshots** (2h)

**Méthode sans Mac :**

**A. Utiliser des Templates**
- https://www.appstorescreenshot.com/
- https://www.mockuphone.com/

**B. Créer avec Figma/Canva**
1. Créer des frames aux bonnes dimensions :
   - 1290 x 2796 (iPhone 6.7")
   - 1242 x 2688 (iPhone 6.5")
2. Importer des captures de votre app web
3. Ajouter du texte marketing
4. Exporter en PNG

**C. Utiliser des Mockups**
- https://www.figma.com/ (templates gratuits)
- https://www.canva.com/ (templates iPhone)

---

### 3. **Configurer App Store Connect** (1h)

Tout se fait via le navigateur web :

1. **Créer l'application**
   - https://appstoreconnect.apple.com/
   - My Apps → + → New App

2. **Remplir les métadonnées**
   - Nom, description, keywords
   - Privacy Policy URL (après déploiement Netlify)
   - Support URL

3. **Créer les abonnements**
   - Plus : 9,99€/mois
   - Pro : 19,99€/mois
   - Studio : 39,99€/mois

**Guide :** `docs/ACTION_PLAN_APP_STORE.md` (Phase 4)

---

### 4. **Configurer RevenueCat** (30 min)

Via le dashboard web :

1. https://app.revenuecat.com/
2. Créer le projet
3. Ajouter l'app iOS
4. Créer les Products (mêmes IDs que App Store Connect)
5. Créer les Entitlements
6. Créer l'Offering

**Guide :** `docs/ACTION_PLAN_APP_STORE.md` (Phase 5)

---

### 5. **Créer le Compte de Test** (15 min)

Via Supabase Dashboard :

1. https://supabase.com/
2. Créer l'utilisateur : `appstore.review@tattoovision.com`
3. Assigner le plan Pro
4. Donner 15 000 Vision Points

**Guide :** `docs/QUICK_COMMANDS.md` (section Supabase)

---

## 🎯 Plan d'Action Recommandé

### **Aujourd'hui (Windows)**

```
[ ] 1. Publier legal-site/ sur Netlify (30 min)
[ ] 2. Créer les screenshots avec Figma (2h)
[ ] 3. Configurer App Store Connect (1h)
[ ] 4. Configurer RevenueCat (30 min)
[ ] 5. Créer le compte de test (15 min)
```

**Total : 4h15**

### **Ensuite (Avec Mac ou Codemagic)**

```
[ ] 6. Ajouter l'App Icon dans Xcode
[ ] 7. Archiver l'application
[ ] 8. Uploader vers App Store Connect
[ ] 9. Soumettre pour review
```

**Total : 1h30**

---

## 💰 Comparaison des Coûts

| Option | Coût | Temps | Difficulté |
|--------|------|-------|------------|
| **Codemagic** | Gratuit | 4h setup | ⭐⭐ Facile |
| **MacinCloud** | 30€/mois | 2h | ⭐⭐⭐ Moyen |
| **MacStadium** | 79€/mois | 2h | ⭐⭐⭐ Moyen |
| **Emprunter Mac** | Gratuit | 2h | ⭐ Très facile |
| **Acheter Mac Mini** | 699€ | 3h | ⭐⭐⭐⭐ Complexe |

**Recommandation :** **Codemagic** (gratuit et automatique)

---

## 📊 Progression Actuelle

```
✅ Configuration projet (100%)
✅ Logo implanté (100%)
✅ Documents légaux créés (100%)
⏳ Documents légaux publiés (0%)
⏳ Screenshots créés (0%)
⏳ App Store Connect configuré (0%)
⏳ RevenueCat configuré (0%)
⏳ Build iOS créé (0%)
⏳ Soumission (0%)

TOTAL : 40% ✅
```

---

## 🚀 Prochaine Étape Immédiate

### **1. Publier les Documents Légaux sur Netlify**

**Temps : 15 minutes**

1. Aller sur https://www.netlify.com/
2. Créer un compte gratuit
3. "Add new site" → "Deploy manually"
4. Glisser-déposer le dossier `legal-site`
5. Noter les URLs

**Guide détaillé :** `docs/PUBLISH_LEGAL_DOCS.md`

**Après ça, vous aurez :**
- ✅ Privacy Policy URL
- ✅ Terms of Service URL
- ✅ Support URL

Ces URLs sont **REQUISES** pour App Store Connect !

---

## 📞 Ressources

### Guides Disponibles

| Guide | Description |
|-------|-------------|
| `BUILD_IOS_WITHOUT_MAC.md` | Build iOS sans Mac (Codemagic) |
| `PUBLISH_LEGAL_DOCS.md` | Publier les documents légaux |
| `ACTION_PLAN_APP_STORE.md` | Plan complet de soumission |
| `QUICK_COMMANDS.md` | Commandes rapides |

### Liens Utiles

- [Codemagic](https://codemagic.io/) - Build iOS gratuit
- [Netlify](https://www.netlify.com/) - Hébergement gratuit
- [App Store Connect](https://appstoreconnect.apple.com/)
- [RevenueCat](https://app.revenuecat.com/)

---

## ✅ Checklist Finale

### Sur Windows (Maintenant)
```
[ ] Publier legal-site/ sur Netlify
[ ] Créer les screenshots
[ ] Configurer App Store Connect
[ ] Configurer RevenueCat
[ ] Créer le compte de test
```

### Avec Mac ou Codemagic (Ensuite)
```
[ ] Ajouter App Icon dans Xcode
[ ] Archiver l'app
[ ] Uploader vers App Store Connect
[ ] Soumettre pour review
```

---

**💡 Ne vous inquiétez pas ! Vous pouvez faire 80% du travail sur Windows. Seul le build final nécessite un Mac (ou Codemagic).**

**🎯 Commencez par publier les documents légaux sur Netlify - c'est rapide et essentiel !**
