# ✅ Checklist App Store - Tattoo Vision

## 🎯 ACTIONS PRIORITAIRES AVANT SOUMISSION

### 1. ⚠️ CRITIQUE - Permissions Info.plist

**Statut** : ❌ À FAIRE  
**Fichier** : `ios/App/App/Info.plist`

Vous devez ajouter les descriptions de permissions pour :

```xml
<!-- Accès à la bibliothèque photo -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Tattoo Vision a besoin d'accéder à vos photos pour visualiser des tatouages sur votre corps et sauvegarder vos créations.</string>

<!-- Accès à la caméra -->
<key>NSCameraUsageDescription</key>
<string>Tattoo Vision a besoin d'accéder à votre caméra pour prendre des photos et visualiser des tatouages en temps réel.</string>

<!-- Sauvegarde dans la bibliothèque -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Tattoo Vision a besoin de sauvegarder vos créations de tatouages dans votre bibliothèque photo.</string>
```

**Comment faire** :
1. Ouvrir `ios/App/App/Info.plist` dans Xcode
2. Ajouter ces clés avant la balise `</dict>` finale
3. Sauvegarder

---

### 2. ⚠️ CRITIQUE - Product IDs RevenueCat

**Statut** : ⚠️ À VÉRIFIER  
**Fichier** : `src/config/revenuecat.ts`

**Product IDs actuels** :
- Plus : `com.tattoovision.app.plus_monthly`
- Pro : `com.tattoovision.app.pro2_monthly`
- Studio : `com.tattoovision.app.studio1_monthly`

**Actions requises** :
1. ✅ Créer ces EXACT Product IDs dans App Store Connect
2. ✅ Les ajouter dans RevenueCat Dashboard
3. ✅ Vérifier que les IDs correspondent EXACTEMENT (attention aux underscores vs points)

**Recommandation** : Utilisez le format standard Apple :
- `com.tattoovision.app.plus.monthly`
- `com.tattoovision.app.pro.monthly`
- `com.tattoovision.app.studio.monthly`

---

### 3. ⚠️ CRITIQUE - Privacy Policy & Terms of Service

**Statut** : ✅ DOCUMENTS CRÉÉS  
**Fichiers** : 
- `legal/privacy-policy.md` ✅
- `legal/terms-of-service.md` ✅

**Actions requises** :
1. ❌ Publier ces documents sur un site web accessible publiquement
2. ❌ Obtenir les URLs publiques (ex: `https://tattoovision.com/privacy`)
3. ❌ Ajouter ces URLs dans App Store Connect

**Options de publication** :
- GitHub Pages (gratuit)
- Netlify/Vercel (gratuit)
- Votre propre site web

**IMPORTANT** : Apple REFUSE les apps sans Privacy Policy URL accessible !

---

### 4. ⚠️ CRITIQUE - App Icon 1024x1024

**Statut** : ⚠️ À VÉRIFIER  
**Fichier** : `public/logo-512.png` (existe mais taille incorrecte)

**Requis** :
- Taille : **1024x1024 pixels** (pas 512x512)
- Format : PNG
- Pas de transparence (canal alpha)
- Pas de coins arrondis (Apple les ajoute automatiquement)

**Actions** :
1. Créer une version 1024x1024 de votre logo
2. L'ajouter dans `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
3. Configurer dans Xcode

---

### 5. ⚠️ CRITIQUE - Screenshots App Store

**Statut** : ❌ À CRÉER

**Tailles requises** (minimum 3 screenshots par taille) :
- iPhone 6.7" (Pro Max) : 1290 x 2796 pixels
- iPhone 6.5" (11 Pro Max) : 1242 x 2688 pixels
- iPhone 5.5" (8 Plus) : 1242 x 2208 pixels

**Contenu suggéré** :
1. Écran d'accueil avec bibliothèque de tatouages
2. AI Studio - Génération de tatouage
3. Realistic Render - Visualisation sur le corps
4. Bibliothèque personnelle
5. Écran de sélection de plan

**Outils** :
- Simulateur iOS + `Cmd+S` pour screenshot
- Figma/Photoshop pour redimensionner
- [App Store Screenshot Generator](https://www.appstorescreenshot.com/)

---

### 6. ⚠️ CRITIQUE - Compte de Test

**Statut** : ❌ À CRÉER

**Actions** :
1. Créer un compte test dans votre app
2. Email : `appstore.review@tattoovision.com` (ou similaire)
3. Mot de passe : Sécurisé mais facile à communiquer
4. Assigner le plan **Pro** pour tester toutes les fonctionnalités
5. Ajouter des Vision Points (15 000)

**IMPORTANT** : Apple REJETTE si le compte ne fonctionne pas !

---

### 7. ⚠️ CRITIQUE - Support URL

**Statut** : ❌ À CRÉER

**Requis** : Une page web avec :
- Email de contact : `support@tattoovision.com`
- Formulaire de contact (optionnel)
- FAQ (optionnel)

**Options** :
- Page GitHub
- Page simple HTML hébergée
- Formulaire Google Forms

---

### 8. ✅ OPTIONNEL - Vérifications Techniques

**RevenueCat API Key** :
- iOS : `test_YayyfBpYgTiYMQCEpDGOjXgqdVS` ⚠️ (clé de TEST)
- **Action** : Remplacer par la clé de PRODUCTION avant soumission

**Bundle ID** :
- Actuel : `com.tattoovision.app` ✅
- **Vérifier** : Correspond au certificat Apple Developer

**App Name** :
- Actuel : `Tattoo Vision` ✅

---

## 📝 INFORMATIONS À PRÉPARER

### Métadonnées App Store

**Nom de l'app** : Tattoo Vision

**Sous-titre** (30 caractères max) :
```
Créez vos tatouages avec l'IA
```

**Description courte** (170 caractères max) :
```
Générez des tatouages uniques avec l'IA et visualisez-les sur votre corps en temps réel. Bibliothèque complète incluse.
```

**Mots-clés** (100 caractères max) :
```
tatouage,tattoo,IA,design,art,corps,visualisation,créateur,personnalisé
```

**Catégories** :
- Principale : **Lifestyle**
- Secondaire : **Graphics & Design**

**Age Rating** : **12+** (à cause du contenu tatouage)

---

### Contact Information

**Email de support** : `support@tattoovision.com`  
**Téléphone** : [Votre numéro avec indicatif pays]  
**Site web** : [Votre site web]

---

### Notes pour le Review

```
Bonjour l'équipe de review,

Tattoo Vision est une application de création et visualisation de tatouages par IA.

COMPTE DE TEST :
Email : appstore.review@tattoovision.com
Mot de passe : [VOTRE_MOT_DE_PASSE]
Plan : Pro (15 000 Vision Points)

COMMENT TESTER :
1. Connectez-vous avec le compte fourni
2. Allez dans "AI Studio" pour générer un tatouage
3. Utilisez "Realistic Render" pour visualiser sur une photo
4. Explorez la bibliothèque de tatouages

ABONNEMENTS :
Les abonnements sont gérés via RevenueCat et Apple IAP.
Vous pouvez tester les paywalls sans effectuer d'achat réel en mode sandbox.

AVERTISSEMENT :
Cette app est un outil de VISUALISATION uniquement. 
Nous ne fournissons pas de services de tatouage réels.

Merci !
```

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

### Phase 1 : Configuration Technique (1-2 jours)
1. ✅ Ajouter les permissions dans Info.plist
2. ✅ Créer l'App Icon 1024x1024
3. ✅ Vérifier/corriger les Product IDs RevenueCat
4. ✅ Remplacer la clé RevenueCat TEST par PRODUCTION

### Phase 2 : Contenu Web (1 jour)
5. ✅ Publier Privacy Policy en ligne
6. ✅ Publier Terms of Service en ligne
7. ✅ Créer une page Support
8. ✅ Obtenir les URLs publiques

### Phase 3 : Assets Visuels (2-3 jours)
9. ✅ Créer les screenshots (3 tailles x 5 screenshots = 15 images)
10. ✅ Optimiser les screenshots avec texte/annotations

### Phase 4 : App Store Connect (1 jour)
11. ✅ Créer l'app dans App Store Connect
12. ✅ Remplir toutes les métadonnées
13. ✅ Créer les 3 abonnements (Plus, Pro, Studio)
14. ✅ Configurer RevenueCat avec les Product IDs

### Phase 5 : Build & Test (1 jour)
15. ✅ Build de production (`npm run build`)
16. ✅ Sync Capacitor (`npx cap sync ios`)
17. ✅ Tester sur appareil réel
18. ✅ Créer le compte de test

### Phase 6 : Soumission (1 jour)
19. ✅ Archive dans Xcode
20. ✅ Upload vers App Store Connect
21. ✅ Remplir les informations de review
22. ✅ Soumettre pour review

**TOTAL ESTIMÉ** : 7-10 jours

---

## ⚠️ PIÈGES COURANTS À ÉVITER

### 1. Product IDs Incorrects
❌ **Erreur** : `com.tattoovision.app.plus_monthly`  
✅ **Correct** : `com.tattoovision.app.plus.monthly`

**Solution** : Vérifier que les IDs dans le code correspondent EXACTEMENT à ceux dans App Store Connect.

### 2. Privacy Policy Non Accessible
❌ **Erreur** : Lien vers un fichier local ou GitHub raw  
✅ **Correct** : URL publique avec HTML formaté

### 3. Screenshots Mauvaise Taille
❌ **Erreur** : 1080x1920 (taille Android)  
✅ **Correct** : 1290x2796 (iPhone 6.7")

### 4. Compte de Test Invalide
❌ **Erreur** : Compte sans Vision Points ou plan Free  
✅ **Correct** : Compte Pro avec 15 000 VP

### 5. Clé RevenueCat de Test
❌ **Erreur** : Laisser `test_YayyfBpYgTiYMQCEpDGOjXgqdVS`  
✅ **Correct** : Utiliser la clé de production

### 6. Permissions Manquantes
❌ **Erreur** : Pas de NSPhotoLibraryUsageDescription  
✅ **Correct** : Toutes les permissions avec descriptions claires

---

## 📞 RESSOURCES UTILES

- **App Store Connect** : https://appstoreconnect.apple.com
- **RevenueCat Dashboard** : https://app.revenuecat.com
- **Apple Developer** : https://developer.apple.com
- **Review Guidelines** : https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines** : https://developer.apple.com/design/human-interface-guidelines/

---

## 🎉 APRÈS APPROBATION

1. ✅ Surveiller les reviews et ratings
2. ✅ Répondre aux utilisateurs dans les 24h
3. ✅ Monitorer les crashs dans App Store Connect
4. ✅ Préparer la version 1.1 avec les feedbacks

---

**Dernière mise à jour** : 30 janvier 2026  
**Statut global** : 🟡 En préparation (7/8 étapes critiques à compléter)
