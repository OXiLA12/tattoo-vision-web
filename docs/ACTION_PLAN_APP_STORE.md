# 🚀 Plan d'Action Complet - Soumission App Store

## ✅ CE QUI EST DÉJÀ FAIT

### 1. ✅ Configuration Technique
- [x] Capacitor configuré pour iOS
- [x] Bundle ID : `com.tattoovision.app`
- [x] App Name : `Tattoo Vision`
- [x] RevenueCat intégré
- [x] Permissions ajoutées dans Info.plist

### 2. ✅ Documents Légaux
- [x] Privacy Policy créée (`legal/privacy-policy.md`)
- [x] Terms of Service créés (`legal/terms-of-service.md`)
- [x] Site web légal généré (`legal-site/`)
- [x] Page de support créée

### 3. ✅ Système d'Abonnement
- [x] 3 plans définis (Plus, Pro, Studio)
- [x] Vision Points configurés
- [x] RevenueCat intégré

---

## 🎯 CE QU'IL RESTE À FAIRE

### PHASE 1 : Publication des Documents Légaux (1 heure)

#### Étape 1.1 : Déployer le site web légal

**Option recommandée : Netlify (le plus simple)**

1. Aller sur https://www.netlify.com/
2. Créer un compte gratuit
3. Cliquer sur "Add new site" → "Deploy manually"
4. Glisser-déposer le dossier `legal-site`
5. Attendre 30 secondes
6. Noter les URLs :
   - Privacy : `https://[votre-site].netlify.app/privacy.html`
   - Terms : `https://[votre-site].netlify.app/terms.html`
   - Support : `https://[votre-site].netlify.app/support.html`

**Alternative : GitHub Pages**
- Voir le guide dans `docs/PUBLISH_LEGAL_DOCS.md`

#### Étape 1.2 : Vérifier les URLs

- [ ] Ouvrir chaque URL en navigation privée
- [ ] Vérifier que le contenu s'affiche correctement
- [ ] Tester sur mobile (responsive)
- [ ] Vérifier que c'est bien HTTPS

---

### PHASE 2 : Créer l'App Icon 1024x1024 (30 minutes)

#### Étape 2.1 : Préparer l'icône

Votre logo actuel est en 512x512. Vous devez créer une version 1024x1024.

**Option 1 : Avec un outil en ligne**
1. Aller sur https://www.canva.com/ ou https://www.figma.com/
2. Créer un design 1024x1024 pixels
3. Importer votre logo actuel (`public/logo.png`)
4. Redimensionner à 1024x1024
5. Exporter en PNG (sans transparence)

**Option 2 : Avec Photoshop/GIMP**
1. Ouvrir `public/logo.png`
2. Image → Taille de l'image → 1024x1024
3. Aplatir l'image (supprimer la transparence)
4. Fond blanc ou couleur unie
5. Exporter en PNG

#### Étape 2.2 : Ajouter dans Xcode

1. Ouvrir le projet dans Xcode : `npx cap open ios`
2. Dans le navigateur, aller dans `App/Assets.xcassets/AppIcon.appiconset/`
3. Glisser-déposer l'icône 1024x1024 dans la case "App Store iOS 1024pt"
4. Sauvegarder

---

### PHASE 3 : Créer les Screenshots (2-3 heures)

#### Étape 3.1 : Prendre les screenshots

**Tailles requises :**
- iPhone 6.7" (Pro Max) : 1290 x 2796 pixels
- iPhone 6.5" (11 Pro Max) : 1242 x 2688 pixels

**Méthode :**

1. Lancer l'app dans le simulateur iOS :
   ```bash
   npx cap open ios
   # Dans Xcode, sélectionner iPhone 15 Pro Max
   # Lancer l'app (Cmd+R)
   ```

2. Naviguer vers chaque écran important :
   - Écran d'accueil / Bibliothèque
   - AI Studio (génération)
   - Realistic Render (visualisation)
   - Bibliothèque personnelle
   - Écran de sélection de plan

3. Prendre les screenshots : `Cmd+S` dans le simulateur

4. Les screenshots sont sauvegardés sur le Bureau

#### Étape 3.2 : Optimiser les screenshots (optionnel)

Ajoutez du texte marketing avec Figma/Canva :
- "Créez des tatouages uniques avec l'IA"
- "Visualisez sur votre corps en temps réel"
- "Bibliothèque complète incluse"

**Minimum requis :** 3 screenshots par taille
**Recommandé :** 5-10 screenshots

---

### PHASE 4 : Configuration App Store Connect (1 heure)

#### Étape 4.1 : Créer l'application

1. Aller sur https://appstoreconnect.apple.com/
2. Se connecter avec votre compte Apple Developer
3. Cliquer sur "My Apps" → "+" → "New App"
4. Remplir :
   - **Platform** : iOS
   - **Name** : Tattoo Vision
   - **Primary Language** : French (France)
   - **Bundle ID** : com.tattoovision.app
   - **SKU** : TATTOOVISION001
   - **User Access** : Full Access

#### Étape 4.2 : Remplir les métadonnées

**App Information :**
- **Name** : Tattoo Vision
- **Subtitle** : Créez vos tatouages avec l'IA
- **Privacy Policy URL** : [URL de votre site Netlify]/privacy.html
- **Category** : Lifestyle (Primary), Graphics & Design (Secondary)

**Pricing and Availability :**
- **Price** : Free
- **Availability** : Tous les pays

**App Privacy :**
- Répondre au questionnaire (voir guide détaillé dans `docs/APP_STORE_CHECKLIST.md`)

#### Étape 4.3 : Créer les abonnements

1. Dans App Store Connect → Features → In-App Purchases
2. Créer un "Subscription Group" : "Tattoo Vision Subscriptions"
3. Créer 3 abonnements :

**Plus :**
- Product ID : `com.tattoovision.app.plus.monthly`
- Price : 9,99€
- Duration : 1 Month

**Pro :**
- Product ID : `com.tattoovision.app.pro.monthly`
- Price : 19,99€
- Duration : 1 Month

**Studio :**
- Product ID : `com.tattoovision.app.studio.monthly`
- Price : 39,99€
- Duration : 1 Month

⚠️ **IMPORTANT** : Notez ces Product IDs, vous devrez les mettre dans RevenueCat !

---

### PHASE 5 : Configuration RevenueCat (30 minutes)

#### Étape 5.1 : Créer le projet RevenueCat

1. Aller sur https://app.revenuecat.com/
2. Créer un compte (gratuit jusqu'à 10k$/mois)
3. Créer un nouveau projet : "Tattoo Vision"

#### Étape 5.2 : Ajouter l'app iOS

1. Dans RevenueCat Dashboard → Apps → Add App
2. **App Name** : Tattoo Vision iOS
3. **Bundle ID** : com.tattoovision.app
4. **Platform** : iOS

#### Étape 5.3 : Configurer App Store Connect

1. Dans RevenueCat → Apps → Tattoo Vision iOS → App Store Connect
2. Suivre les instructions pour connecter votre compte Apple Developer
3. Cela permettra à RevenueCat de synchroniser les abonnements

#### Étape 5.4 : Créer les Products

1. Dans RevenueCat → Products
2. Créer 3 products avec les MÊMES Product IDs que dans App Store Connect :
   - `com.tattoovision.app.plus.monthly`
   - `com.tattoovision.app.pro.monthly`
   - `com.tattoovision.app.studio.monthly`

#### Étape 5.5 : Créer les Entitlements

1. Dans RevenueCat → Entitlements
2. Créer 3 entitlements :
   - **plus** → Lié au product Plus
   - **pro** → Lié au product Pro
   - **studio** → Lié au product Studio

#### Étape 5.6 : Créer l'Offering

1. Dans RevenueCat → Offerings
2. Créer un offering "default"
3. Ajouter les 3 packages :
   - **monthly_plus** → Product Plus
   - **monthly_pro** → Product Pro
   - **monthly_studio** → Product Studio

#### Étape 5.7 : Obtenir la clé API

1. Dans RevenueCat → API Keys
2. Copier la clé **iOS Production**
3. Remplacer dans `src/config/revenuecat.ts` :

```typescript
API_KEY_IOS: 'appl_VOTRE_CLE_PRODUCTION',
```

⚠️ **NE PAS** utiliser la clé de test en production !

---

### PHASE 6 : Créer le Compte de Test (15 minutes)

#### Étape 6.1 : Créer le compte dans votre app

1. Lancer l'app en mode développement
2. Créer un nouveau compte :
   - Email : `appstore.review@tattoovision.com`
   - Mot de passe : [Choisir un mot de passe sécurisé]

#### Étape 6.2 : Assigner le plan Pro

**Option 1 : Via Supabase Dashboard**
1. Aller sur https://supabase.com/
2. Ouvrir votre projet
3. Table Editor → profiles
4. Trouver l'utilisateur `appstore.review@tattoovision.com`
5. Modifier :
   - `plan` : `pro`
   - `vision_points` : `15000`
   - `next_reset_at` : [Date dans 1 mois]

**Option 2 : Via SQL**
```sql
UPDATE profiles
SET plan = 'pro',
    vision_points = 15000,
    next_reset_at = NOW() + INTERVAL '1 month'
WHERE email = 'appstore.review@tattoovision.com';
```

#### Étape 6.3 : Tester le compte

- [ ] Se connecter avec le compte
- [ ] Vérifier que le plan est "Pro"
- [ ] Vérifier que les Vision Points sont à 15 000
- [ ] Tester la génération IA
- [ ] Tester le realistic render

---

### PHASE 7 : Build et Archive (1 heure)

#### Étape 7.1 : Build de production

```bash
# Nettoyer
npm run build

# Synchroniser avec Capacitor
npx cap sync ios

# Ouvrir Xcode
npx cap open ios
```

#### Étape 7.2 : Configuration Xcode

1. Sélectionner le projet "App" dans le navigateur
2. Dans l'onglet "General" :
   - **Version** : 1.0.0
   - **Build** : 1

3. Dans l'onglet "Signing & Capabilities" :
   - Sélectionner votre équipe Apple Developer
   - Activer "Automatically manage signing"

#### Étape 7.3 : Archive

1. Dans Xcode, sélectionner "Any iOS Device (arm64)" comme destination
2. Menu : Product → Archive
3. Attendre la fin (5-10 minutes)

#### Étape 7.4 : Upload vers App Store Connect

1. Dans l'Organizer (s'ouvre automatiquement après l'archive)
2. Sélectionner votre archive
3. Cliquer sur "Distribute App"
4. Choisir "App Store Connect"
5. Suivre l'assistant :
   - Upload
   - Automatically manage signing
   - Upload

6. Attendre la fin de l'upload (10-30 minutes)

---

### PHASE 8 : Soumission pour Review (30 minutes)

#### Étape 8.1 : Attendre le traitement du build

Après l'upload, attendez 10-30 minutes que le build soit traité par Apple.

Vous recevrez un email : "Your build has been processed"

#### Étape 8.2 : Sélectionner le build

1. Dans App Store Connect → My Apps → Tattoo Vision
2. Aller dans la section "1.0.0 Prepare for Submission"
3. Cliquer sur "Build" → Sélectionner votre build

#### Étape 8.3 : Remplir les informations de version

**What's New in This Version :**
```
Première version de Tattoo Vision !

✨ Créez des tatouages uniques avec l'IA
📸 Visualisez-les sur votre corps en temps réel
📚 Explorez notre bibliothèque complète
💎 Choisissez votre plan d'abonnement
```

**Description :** (Copier depuis `docs/APP_STORE_CHECKLIST.md`)

**Keywords :**
```
tatouage,tattoo,IA,design,art,corps,visualisation,créateur,personnalisé
```

**Support URL :** `https://[votre-site]/support.html`

**Marketing URL :** (optionnel)

#### Étape 8.4 : Ajouter les screenshots

1. Cliquer sur "iPhone 6.7" Display"
2. Glisser-déposer vos 3-10 screenshots
3. Répéter pour "iPhone 6.5" Display"

#### Étape 8.5 : App Review Information

**Contact Information :**
- First Name : [Votre prénom]
- Last Name : [Votre nom]
- Phone : [Votre téléphone]
- Email : support@tattoovision.com

**Demo Account :**
- Username : appstore.review@tattoovision.com
- Password : [Votre mot de passe]

**Notes :**
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

#### Étape 8.6 : Soumettre !

1. Vérifier que tous les champs sont remplis (icône verte)
2. Cliquer sur "Add for Review"
3. Cliquer sur "Submit to App Review"
4. Confirmer

🎉 **C'est fait ! Votre app est en review !**

---

## 📊 Checklist Finale

### Documents Légaux
- [ ] Privacy Policy publiée en ligne
- [ ] Terms of Service publiés en ligne
- [ ] Support page publiée en ligne
- [ ] URLs testées et fonctionnelles

### Assets
- [ ] App Icon 1024x1024 créé et ajouté
- [ ] Screenshots iPhone 6.7" (minimum 3)
- [ ] Screenshots iPhone 6.5" (minimum 3)

### App Store Connect
- [ ] Application créée
- [ ] Métadonnées remplies
- [ ] Abonnements créés (Plus, Pro, Studio)
- [ ] Product IDs notés

### RevenueCat
- [ ] Projet créé
- [ ] App iOS ajoutée
- [ ] Products créés avec les bons IDs
- [ ] Entitlements configurés
- [ ] Offering "default" créé
- [ ] Clé API Production copiée dans le code

### Compte de Test
- [ ] Compte créé
- [ ] Plan Pro assigné
- [ ] 15 000 Vision Points
- [ ] Testé et fonctionnel

### Build
- [ ] Build de production créé
- [ ] Archivé dans Xcode
- [ ] Uploadé vers App Store Connect
- [ ] Build traité par Apple

### Soumission
- [ ] Build sélectionné
- [ ] Screenshots ajoutés
- [ ] Description remplie
- [ ] Compte de test fourni
- [ ] Notes de review écrites
- [ ] Soumis pour review

---

## ⏱️ Timeline Estimée

| Phase | Durée | Quand |
|-------|-------|-------|
| Publication documents légaux | 1h | Jour 1 |
| App Icon | 30min | Jour 1 |
| Screenshots | 2-3h | Jour 1-2 |
| App Store Connect setup | 1h | Jour 2 |
| RevenueCat setup | 30min | Jour 2 |
| Compte de test | 15min | Jour 2 |
| Build & Archive | 1h | Jour 3 |
| Soumission | 30min | Jour 3 |
| **TOTAL** | **7-8h** | **3 jours** |

**Review Apple** : 1-7 jours après soumission

---

## 🆘 Problèmes Courants

### "Product IDs don't match"
→ Vérifier que les IDs dans App Store Connect, RevenueCat et le code sont EXACTEMENT identiques

### "Privacy Policy URL not accessible"
→ Tester l'URL en navigation privée, vérifier que c'est HTTPS

### "Screenshots wrong size"
→ Utiliser EXACTEMENT 1290x2796 et 1242x2688 pixels

### "Demo account doesn't work"
→ Tester le compte avant de soumettre, vérifier le plan et les points

### "Build processing failed"
→ Vérifier les certificats dans Xcode, réessayer l'archive

---

## 📞 Ressources

- **Guide complet** : `docs/APP_STORE_CHECKLIST.md`
- **Publication légale** : `docs/PUBLISH_LEGAL_DOCS.md`
- **Workflow App Store** : `.agent/workflows/app-store-submission.md`
- **Site web légal** : `legal-site/`

---

## 🎉 Après Approbation

1. Surveiller les reviews
2. Répondre aux utilisateurs
3. Monitorer les crashs
4. Préparer la v1.1

---

**Bonne chance ! 🚀**

*Dernière mise à jour : 30 janvier 2026*
