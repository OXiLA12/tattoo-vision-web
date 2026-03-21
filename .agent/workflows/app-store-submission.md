---
description: Guide complet pour soumettre Tattoo Vision à l'App Store
---

# Guide de Soumission App Store - Tattoo Vision

## PHASE 1 : Préparation Technique

### 1. Build de Production

```bash
# 1. Nettoyer et installer les dépendances
npm install

# 2. Construire l'application pour production
npm run build

# 3. Synchroniser avec Capacitor
npx cap sync ios

# 4. Ouvrir le projet Xcode
npx cap open ios
```

### 2. Configuration Xcode (À faire dans Xcode)

**A. Identité de l'Application**
1. Ouvrir `App.xcodeproj` dans Xcode
2. Sélectionner le projet "App" dans le navigateur
3. Dans l'onglet "General" :
   - **Display Name** : Tattoo Vision
   - **Bundle Identifier** : com.tattoovision.app
   - **Version** : 1.0.0
   - **Build** : 1

**B. Signing & Capabilities**
1. Sélectionner votre équipe de développement Apple
2. Activer "Automatically manage signing"
3. Vérifier que le profil de provisionnement est créé

**C. Capabilities Requises**
- ✅ In-App Purchase (déjà configuré avec RevenueCat)
- ✅ Push Notifications (si vous en utilisez)

**D. Info.plist - Permissions**
Ajouter les descriptions pour :
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Tattoo Vision a besoin d'accéder à vos photos pour visualiser des tatouages sur votre corps et sauvegarder vos créations.</string>

<key>NSCameraUsageDescription</key>
<string>Tattoo Vision a besoin d'accéder à votre caméra pour prendre des photos et visualiser des tatouages en temps réel.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Tattoo Vision a besoin de sauvegarder vos créations de tatouages dans votre bibliothèque photo.</string>
```

### 3. Assets et Icônes

**A. App Icon**
- Taille requise : 1024x1024 pixels (sans transparence)
- Format : PNG
- Emplacement : `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**B. Screenshots Requis**
Pour chaque taille d'écran iPhone :
- **6.7" (iPhone 14 Pro Max)** : 1290 x 2796 pixels
- **6.5" (iPhone 11 Pro Max)** : 1242 x 2688 pixels
- **5.5" (iPhone 8 Plus)** : 1242 x 2208 pixels

Minimum 3-10 screenshots par taille.

### 4. Build et Archive

**Dans Xcode :**
1. Sélectionner "Any iOS Device (arm64)" comme destination
2. Menu : Product → Archive
3. Attendre la fin de l'archivage
4. Dans l'Organizer, cliquer sur "Distribute App"
5. Choisir "App Store Connect"
6. Suivre l'assistant de distribution

---

## PHASE 2 : Configuration App Store Connect

### 1. Créer l'Application

1. Aller sur [App Store Connect](https://appstoreconnect.apple.com)
2. Cliquer sur "My Apps" → "+" → "New App"
3. Remplir :
   - **Platform** : iOS
   - **Name** : Tattoo Vision
   - **Primary Language** : French (France)
   - **Bundle ID** : com.tattoovision.app
   - **SKU** : TATTOOVISION001 (identifiant unique)
   - **User Access** : Full Access

### 2. Informations de l'Application

**A. App Information**
- **Name** : Tattoo Vision
- **Subtitle** : Créez et visualisez vos tatouages avec l'IA
- **Category** :
  - Primary : Lifestyle
  - Secondary : Graphics & Design

**B. Pricing and Availability**
- **Price** : Free (avec achats intégrés)
- **Availability** : Tous les pays

### 3. Préparer les Métadonnées

**A. Description (4000 caractères max)**
```
Transformez vos idées en tatouages uniques avec l'intelligence artificielle !

🎨 CRÉEZ DES TATOUAGES UNIQUES
Décrivez votre tatouage idéal et laissez notre IA générer des designs personnalisés en quelques secondes.

📸 VISUALISEZ SUR VOTRE CORPS
Voyez exactement comment votre tatouage apparaîtra sur votre peau grâce à notre technologie de rendu réaliste.

📚 BIBLIOTHÈQUE COMPLÈTE
Accédez à des milliers de designs de tatouages professionnels dans tous les styles.

✨ FONCTIONNALITÉS PRINCIPALES
• Génération de tatouages par IA
• Rendu réaliste sur photo
• Extraction et nettoyage d'images
• Bibliothèque personnelle
• Import de vos propres designs

💎 PLANS D'ABONNEMENT
• GRATUIT : Accès à la bibliothèque
• PLUS (9,99€/mois) : 6 000 Vision Points
• PRO (19,99€/mois) : 15 000 Vision Points
• STUDIO (39,99€/mois) : 40 000 Vision Points

🔒 CONFIDENTIALITÉ
Vos données sont sécurisées et privées. Nous ne partageons jamais vos créations.

⚠️ AVERTISSEMENT
Tattoo Vision est un outil de visualisation. Consultez toujours un tatoueur professionnel avant de vous faire tatouer.
```

**B. Keywords (100 caractères max)**
```
tatouage,tattoo,IA,design,art,corps,visualisation,créateur,personnalisé
```

**C. Support URL**
```
https://votre-site.com/support
```

**D. Marketing URL (optionnel)**
```
https://votre-site.com
```

**E. Privacy Policy URL** ⚠️ REQUIS
```
https://votre-site.com/privacy-policy
```

### 4. Configurer les Achats Intégrés

**A. Créer les Abonnements**

1. Dans App Store Connect → Features → In-App Purchases
2. Créer un "Subscription Group" : "Tattoo Vision Subscriptions"
3. Créer 3 abonnements :

**Abonnement Plus**
- **Product ID** : `com.tattoovision.app.plus.monthly`
- **Reference Name** : Tattoo Vision Plus Monthly
- **Subscription Duration** : 1 Month
- **Price** : 9,99€
- **Display Name (FR)** : Plan Plus
- **Description (FR)** : 6 000 Vision Points par mois + toutes les fonctionnalités

**Abonnement Pro**
- **Product ID** : `com.tattoovision.app.pro.monthly`
- **Reference Name** : Tattoo Vision Pro Monthly
- **Subscription Duration** : 1 Month
- **Price** : 19,99€
- **Display Name (FR)** : Plan Pro
- **Description (FR)** : 15 000 Vision Points par mois + support prioritaire

**Abonnement Studio**
- **Product ID** : `com.tattoovision.app.studio.monthly`
- **Reference Name** : Tattoo Vision Studio Monthly
- **Subscription Duration** : 1 Month
- **Price** : 39,99€
- **Display Name (FR)** : Plan Studio
- **Description (FR)** : 40 000 Vision Points par mois + support premium

**B. Configurer RevenueCat**
1. Aller sur [RevenueCat Dashboard](https://app.revenuecat.com)
2. Ajouter les Product IDs créés ci-dessus
3. Configurer les entitlements correspondants

### 5. Age Rating

Répondre au questionnaire :
- **Cartoon or Fantasy Violence** : None
- **Realistic Violence** : None
- **Sexual Content or Nudity** : None (⚠️ Important pour tatouages)
- **Profanity or Crude Humor** : None
- **Alcohol, Tobacco, or Drug Use** : None
- **Mature/Suggestive Themes** : None
- **Horror/Fear Themes** : None
- **Gambling** : None
- **Unrestricted Web Access** : No
- **Contests** : No

**Rating attendu** : 12+ (à cause des tatouages)

---

## PHASE 3 : Soumission et Review

### 1. Version Information

**A. Version 1.0.0**
- **Copyright** : 2026 Tattoo Vision
- **What's New in This Version** :
```
Première version de Tattoo Vision !

✨ Créez des tatouages uniques avec l'IA
📸 Visualisez-les sur votre corps
📚 Explorez notre bibliothèque complète
💎 Choisissez votre plan d'abonnement
```

### 2. Build

1. Sélectionner le build uploadé depuis Xcode
2. Activer "Export Compliance" : Non (si pas de cryptographie autre que HTTPS)

### 3. App Review Information

**A. Contact Information**
- **First Name** : [Votre prénom]
- **Last Name** : [Votre nom]
- **Phone** : [Votre téléphone avec indicatif pays]
- **Email** : support@tattoovision.com

**B. Demo Account** ⚠️ IMPORTANT
Créer un compte de test avec :
- **Username** : appstore.review@tattoovision.com
- **Password** : [Mot de passe sécurisé]
- **Plan** : Pro (pour tester toutes les fonctionnalités)

**C. Notes pour le Review**
```
Bonjour l'équipe de review,

Tattoo Vision est une application de création et visualisation de tatouages par IA.

COMPTE DE TEST :
Email : appstore.review@tattoovision.com
Mot de passe : [votre_mot_de_passe]
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
Cette app est un outil de VISUALISATION uniquement. Nous ne fournissons pas de services de tatouage réels.

Merci !
```

### 4. Soumettre pour Review

1. Vérifier que tous les champs sont remplis
2. Cliquer sur "Add for Review"
3. Cliquer sur "Submit to App Review"

---

## PHASE 4 : Checklist Finale

### Avant Soumission

- [ ] Build de production créé et uploadé
- [ ] App Icon 1024x1024 ajouté
- [ ] Screenshots pour toutes les tailles d'écran
- [ ] Description et keywords optimisés
- [ ] Privacy Policy URL accessible publiquement
- [ ] Support URL fonctionnel
- [ ] Abonnements créés dans App Store Connect
- [ ] RevenueCat configuré avec les Product IDs
- [ ] Compte de test créé et vérifié
- [ ] Age rating complété
- [ ] Contact information remplie
- [ ] Notes de review détaillées

### Conformité App Store

- [ ] Pas de contenu offensant ou adulte
- [ ] Permissions clairement expliquées
- [ ] Fonctionnalités principales accessibles sans abonnement
- [ ] Prix clairement affichés
- [ ] Liens vers Privacy Policy et Terms dans l'app
- [ ] Bouton "Restore Purchases" présent
- [ ] Bouton "Manage Subscription" présent

**📌 Note Importante sur les Abonnements :**
Apple gère automatiquement TOUTES les annulations d'abonnement. Vous n'avez PAS besoin d'intégrer un système d'annulation dans votre app. Les boutons "Restore Purchases" et "Manage Subscription" sont suffisants et obligatoires. Voir `.agent/docs/app-store-subscription-management.md` pour plus de détails.

---

## PHASE 5 : Après Soumission

### Délais Attendus

- **Review initial** : 24-48 heures
- **Review complet** : 1-7 jours en moyenne

### Si Rejeté

1. Lire attentivement le message de rejet
2. Corriger les problèmes mentionnés
3. Répondre dans Resolution Center si besoin
4. Soumettre à nouveau

### Raisons Communes de Rejet

1. **Métadonnées incomplètes** : Vérifier tous les champs
2. **Screenshots non conformes** : Utiliser les bonnes dimensions
3. **Privacy Policy manquante** : Doit être accessible publiquement
4. **Compte de test invalide** : Vérifier qu'il fonctionne
5. **Fonctionnalités cassées** : Tester avant soumission
6. **Abonnements mal configurés** : Vérifier RevenueCat

### Une Fois Approuvé

1. L'app sera disponible sous 24h
2. Surveiller les reviews et ratings
3. Répondre aux utilisateurs
4. Préparer les mises à jour

---

## RESSOURCES

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Bonne chance avec votre soumission ! 🚀**
