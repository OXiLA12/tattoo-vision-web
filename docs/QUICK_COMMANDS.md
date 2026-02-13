# 🚀 Commandes Rapides - App Store Submission

## 📦 Build et Déploiement

### 1. Build de Production
```bash
# Nettoyer et installer les dépendances
npm install

# Build de production
npm run build

# Synchroniser avec Capacitor
npx cap sync ios

# Ouvrir dans Xcode
npx cap open ios
```

### 2. Régénérer les Documents Légaux HTML
```bash
# Convertir les MD en HTML
node scripts/convert-legal-docs.js

# Les fichiers sont générés dans legal-site/
```

### 3. Vérifier la Configuration
```bash
# Vérifier les Product IDs dans le code
grep -r "com.tattoovision.app" src/config/revenuecat.ts

# Vérifier le Bundle ID
grep -r "com.tattoovision.app" capacitor.config.ts
```

---

## 🔧 Xcode

### Archive pour App Store
```
1. Ouvrir Xcode : npx cap open ios
2. Sélectionner : Any iOS Device (arm64)
3. Menu : Product → Archive
4. Attendre la fin de l'archive
5. Dans Organizer : Distribute App → App Store Connect
```

### Vérifier la Version
```
1. Dans Xcode, sélectionner le projet "App"
2. General tab
3. Version : 1.0.0
4. Build : 1
```

---

## 🗄️ Supabase - Compte de Test

### Créer le Compte de Test via SQL
```sql
-- 1. Créer l'utilisateur (via l'interface Supabase Auth)
-- Email: appstore.review@tattoovision.com
-- Password: [votre mot de passe]

-- 2. Assigner le plan Pro et les points
UPDATE profiles
SET 
    plan = 'pro',
    vision_points = 15000,
    next_reset_at = NOW() + INTERVAL '1 month'
WHERE email = 'appstore.review@tattoovision.com';

-- 3. Vérifier
SELECT email, plan, vision_points, next_reset_at
FROM profiles
WHERE email = 'appstore.review@tattoovision.com';
```

### Vérifier les Vision Points
```sql
-- Voir tous les utilisateurs avec leurs points
SELECT 
    email,
    plan,
    vision_points,
    next_reset_at,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔑 RevenueCat

### Product IDs à Créer

Dans App Store Connect ET RevenueCat Dashboard :

```
Plus:   com.tattoovision.app.plus.monthly
Pro:    com.tattoovision.app.pro.monthly
Studio: com.tattoovision.app.studio.monthly
```

### Vérifier la Configuration RevenueCat

1. **Dashboard** : https://app.revenuecat.com/
2. **Apps** → Tattoo Vision iOS
3. **Products** → Vérifier les 3 Product IDs
4. **Entitlements** → Vérifier plus, pro, studio
5. **Offerings** → Vérifier "default" avec les 3 packages

---

## 🌐 Déploiement Netlify

### Méthode 1 : Interface Web (Recommandé)
```
1. Aller sur https://www.netlify.com/
2. Se connecter / Créer un compte
3. "Add new site" → "Deploy manually"
4. Glisser-déposer le dossier legal-site/
5. Attendre 30 secondes
6. Noter l'URL : https://[random-name].netlify.app
7. Site settings → Change site name → tattoo-vision-legal
8. Nouvelle URL : https://tattoo-vision-legal.netlify.app
```

### Méthode 2 : CLI Netlify
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
cd legal-site
netlify deploy --prod

# Suivre les instructions
# Site name: tattoo-vision-legal
# Publish directory: . (current directory)
```

### URLs Finales
```
Homepage:  https://tattoo-vision-legal.netlify.app/
Privacy:   https://tattoo-vision-legal.netlify.app/privacy.html
Terms:     https://tattoo-vision-legal.netlify.app/terms.html
Support:   https://tattoo-vision-legal.netlify.app/support.html
```

---

## 📸 Screenshots

### Tailles Requises
```
iPhone 6.7" (Pro Max):  1290 x 2796 pixels
iPhone 6.5" (11 Pro Max): 1242 x 2688 pixels
```

### Prendre les Screenshots
```bash
# 1. Ouvrir dans Xcode
npx cap open ios

# 2. Sélectionner le simulateur
# iPhone 15 Pro Max (pour 6.7")
# iPhone 11 Pro Max (pour 6.5")

# 3. Lancer l'app
# Cmd+R

# 4. Prendre les screenshots
# Cmd+S dans le simulateur

# 5. Les screenshots sont sur le Bureau
```

### Redimensionner (si nécessaire)
```bash
# Avec ImageMagick (si installé)
magick convert input.png -resize 1290x2796 output.png
magick convert input.png -resize 1242x2688 output.png
```

---

## 🎨 App Icon

### Créer l'Icône 1024x1024

**Option 1 : Canva**
```
1. Aller sur https://www.canva.com/
2. Créer un design personnalisé : 1024x1024
3. Uploader public/logo.png
4. Redimensionner pour remplir
5. Télécharger en PNG (sans transparence)
```

**Option 2 : Figma**
```
1. Créer un frame 1024x1024
2. Importer le logo
3. Exporter en PNG
```

**Option 3 : Photoshop/GIMP**
```
1. Ouvrir public/logo.png
2. Image → Taille de l'image → 1024x1024
3. Aplatir l'image (supprimer transparence)
4. Exporter en PNG
```

### Ajouter dans Xcode
```
1. npx cap open ios
2. Navigateur → App → Assets.xcassets → AppIcon.appiconset
3. Glisser-déposer l'icône 1024x1024 dans "App Store iOS 1024pt"
4. Sauvegarder
```

---

## ✅ Vérifications Avant Soumission

### Checklist Rapide
```bash
# 1. Vérifier que le build fonctionne
npm run build
npx cap sync ios

# 2. Vérifier les Product IDs
cat src/config/revenuecat.ts | grep "APPLE_PRODUCT_IDS"

# 3. Vérifier le Bundle ID
cat capacitor.config.ts | grep "appId"

# 4. Vérifier les permissions
cat ios/App/App/Info.plist | grep "UsageDescription"
```

### Tester l'App Localement
```bash
# Lancer le dev server
npm run dev

# Dans un autre terminal, ouvrir iOS
npx cap open ios

# Lancer sur simulateur (Cmd+R dans Xcode)
```

---

## 🔍 Debugging

### Voir les Logs iOS
```bash
# Dans Xcode, ouvrir la console
# View → Debug Area → Activate Console
# Ou : Cmd+Shift+Y
```

### Vérifier RevenueCat en Dev
```javascript
// Dans la console du navigateur (mode dev)
import Purchases from '@revenuecat/purchases-capacitor';

// Vérifier la configuration
Purchases.getCustomerInfo().then(info => {
  console.log('Customer Info:', info);
});
```

### Vérifier Supabase
```javascript
// Dans la console du navigateur
import { supabase } from './lib/supabase';

// Vérifier l'utilisateur actuel
supabase.auth.getUser().then(({ data }) => {
  console.log('Current user:', data);
});

// Vérifier le profil
supabase.from('profiles')
  .select('*')
  .single()
  .then(({ data }) => {
    console.log('Profile:', data);
  });
```

---

## 📝 Métadonnées App Store

### Description (Copier-Coller)
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

### Keywords (Copier-Coller)
```
tatouage,tattoo,IA,design,art,corps,visualisation,créateur,personnalisé
```

### What's New (Version 1.0.0)
```
Première version de Tattoo Vision !

✨ Créez des tatouages uniques avec l'IA
📸 Visualisez-les sur votre corps en temps réel
📚 Explorez notre bibliothèque complète
💎 Choisissez votre plan d'abonnement
```

---

## 🆘 Commandes de Dépannage

### Réinitialiser Capacitor
```bash
# Supprimer et recréer le dossier iOS
rm -rf ios
npx cap add ios
npx cap sync ios
```

### Nettoyer le Build
```bash
# Nettoyer le dossier dist
rm -rf dist

# Nettoyer node_modules
rm -rf node_modules
npm install

# Rebuild
npm run build
npx cap sync ios
```

### Réinitialiser Xcode
```bash
# Dans Xcode
# Product → Clean Build Folder (Cmd+Shift+K)
# Puis relancer l'archive
```

---

## 📚 Ressources

### Documentation
- [Capacitor iOS](https://capacitorjs.com/docs/ios)
- [RevenueCat](https://docs.revenuecat.com/)
- [App Store Connect](https://developer.apple.com/help/app-store-connect/)
- [Supabase](https://supabase.com/docs)

### Outils
- [App Store Screenshot Generator](https://www.appstorescreenshot.com/)
- [Netlify](https://www.netlify.com/)
- [Canva](https://www.canva.com/)

---

**💡 Astuce** : Gardez ce fichier ouvert pendant le processus de soumission !
