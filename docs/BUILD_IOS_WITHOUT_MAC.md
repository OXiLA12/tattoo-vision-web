# Configuration Codemagic pour Build iOS sans Mac

## 🎯 Objectif

Builder et soumettre votre app iOS à l'App Store **sans avoir de Mac**, en utilisant Codemagic.

---

## 📋 Prérequis

1. ✅ Compte Apple Developer (99$/an)
2. ✅ Projet sur GitHub/GitLab/Bitbucket
3. ✅ Compte Codemagic (gratuit)

---

## 🚀 Étapes

### 1. Créer un Compte Codemagic

1. Aller sur https://codemagic.io/
2. S'inscrire avec GitHub/GitLab/Bitbucket
3. Gratuit : 500 minutes de build/mois

### 2. Connecter votre Projet

1. Dans Codemagic Dashboard → "Add application"
2. Sélectionner votre dépôt Git
3. Choisir "Capacitor" comme framework

### 3. Configurer les Certificats Apple

**Dans Codemagic :**
1. Settings → iOS code signing
2. Suivre l'assistant pour :
   - Connecter votre compte Apple Developer
   - Générer les certificats automatiquement
   - Créer les profils de provisionnement

### 4. Créer le Fichier de Configuration

Créer `codemagic.yaml` à la racine du projet :

\`\`\`yaml
workflows:
  ios-release:
    name: iOS Release
    max_build_duration: 60
    environment:
      groups:
        - app_store_credentials
      vars:
        XCODE_WORKSPACE: "ios/App/App.xcworkspace"
        XCODE_SCHEME: "App"
      node: latest
      xcode: 15.0
      cocoapods: default
    
    scripts:
      - name: Install dependencies
        script: |
          npm install
      
      - name: Build web app
        script: |
          npm run build
      
      - name: Sync Capacitor
        script: |
          npx cap sync ios
      
      - name: Set up code signing
        script: |
          keychain initialize
      
      - name: Build iOS app
        script: |
          xcode-project build-ipa \\
            --workspace "$XCODE_WORKSPACE" \\
            --scheme "$XCODE_SCHEME"
    
    artifacts:
      - build/ios/ipa/*.ipa
    
    publishing:
      app_store_connect:
        api_key: $APP_STORE_CONNECT_PRIVATE_KEY
        key_id: $APP_STORE_CONNECT_KEY_IDENTIFIER
        issuer_id: $APP_STORE_CONNECT_ISSUER_ID
        submit_to_testflight: true
\`\`\`

### 5. Configurer les Variables d'Environnement

Dans Codemagic → Settings → Environment variables :

\`\`\`
APP_STORE_CONNECT_PRIVATE_KEY: [Votre clé API]
APP_STORE_CONNECT_KEY_IDENTIFIER: [Votre Key ID]
APP_STORE_CONNECT_ISSUER_ID: [Votre Issuer ID]
\`\`\`

**Comment obtenir ces clés :**
1. App Store Connect → Users and Access → Keys
2. Créer une nouvelle clé API
3. Télécharger le fichier .p8
4. Copier les identifiants

### 6. Lancer le Build

1. Dans Codemagic → Start new build
2. Sélectionner la branche (main/master)
3. Cliquer sur "Start build"
4. Attendre 10-20 minutes

### 7. Vérifier le Build

1. Le build apparaîtra dans App Store Connect
2. Vous pourrez le sélectionner pour soumission
3. Continuer avec la soumission normale

---

## 💰 Coûts

**Codemagic Gratuit :**
- 500 minutes/mois
- 1 build iOS ≈ 15-20 minutes
- ≈ 25 builds/mois gratuits

**Si vous dépassez :**
- Plan Pro : 99$/mois (2500 minutes)
- Ou payer à l'usage : 0.038$/minute

---

## 🎯 Alternative : GitHub Actions

Si vous préférez GitHub Actions (gratuit pour projets publics) :

Créer `.github/workflows/ios-build.yml` :

\`\`\`yaml
name: iOS Build

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build web app
      run: npm run build
    
    - name: Sync Capacitor
      run: npx cap sync ios
    
    - name: Build iOS
      run: |
        cd ios/App
        xcodebuild -workspace App.xcworkspace \\
          -scheme App \\
          -configuration Release \\
          archive -archivePath App.xcarchive
    
    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: ios-build
        path: ios/App/App.xcarchive
\`\`\`

---

## ✅ Avantages de Codemagic

- ✅ Pas besoin de Mac
- ✅ Build automatique
- ✅ Upload automatique vers App Store
- ✅ Interface simple
- ✅ Support Capacitor natif

---

## 📞 Ressources

- [Codemagic Documentation](https://docs.codemagic.io/)
- [Capacitor + Codemagic Guide](https://docs.codemagic.io/yaml-quick-start/building-a-capacitor-app/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)

---

**💡 Avec Codemagic, vous pouvez soumettre votre app iOS à l'App Store entièrement depuis Windows !**
