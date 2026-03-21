# 📄 Site Web des Documents Légaux - Tattoo Vision

Ce dossier contient le site web statique avec tous les documents légaux de Tattoo Vision, prêt à être déployé.

## 📁 Contenu

- **index.html** - Page d'accueil avec liens vers tous les documents
- **privacy.html** - Politique de confidentialité
- **terms.html** - Conditions d'utilisation
- **support.html** - Page de support et FAQ

## 🚀 Déploiement Rapide

### Option 1 : Netlify (Recommandé - Le plus simple)

1. Aller sur [Netlify](https://www.netlify.com/)
2. Créer un compte (gratuit)
3. Cliquer sur "Add new site" → "Deploy manually"
4. Glisser-déposer ce dossier `legal-site`
5. Votre site sera en ligne en quelques secondes !

**URL finale** : `https://tattoo-vision-legal.netlify.app`

Vous pouvez personnaliser le nom dans Site settings → Site details → Change site name.

### Option 2 : Vercel

1. Aller sur [Vercel](https://vercel.com/)
2. Créer un compte (gratuit)
3. Cliquer sur "Add New" → "Project"
4. Importer ce dossier
5. Déployer !

**URL finale** : `https://tattoo-vision-legal.vercel.app`

### Option 3 : GitHub Pages

1. Créer un nouveau dépôt GitHub (ex: `tattoo-vision-legal`)
2. Uploader le contenu de ce dossier
3. Aller dans Settings → Pages
4. Source : Deploy from a branch
5. Branch : main, Folder : / (root)
6. Save

**URL finale** : `https://[votre-username].github.io/tattoo-vision-legal/`

## 📋 URLs à Utiliser dans App Store Connect

Une fois déployé, utilisez ces URLs dans App Store Connect :

### Privacy Policy URL
```
https://[votre-site]/privacy.html
```

### Terms of Service URL (optionnel)
```
https://[votre-site]/terms.html
```

### Support URL
```
https://[votre-site]/support.html
```

## 🔄 Mise à Jour des Documents

Si vous modifiez les fichiers dans `legal/`, régénérez les HTML :

```bash
# Depuis la racine du projet
node scripts/convert-legal-docs.js
```

Puis redéployez le dossier `legal-site` sur votre hébergeur.

## ✅ Vérification

Avant de soumettre à Apple, vérifiez que :

- [ ] Les URLs sont accessibles publiquement (testez en navigation privée)
- [ ] Les pages se chargent correctement sur mobile
- [ ] Le contenu est lisible et bien formaté
- [ ] Les URLs utilisent HTTPS (pas HTTP)
- [ ] Tous les liens fonctionnent

## 🎨 Personnalisation

Les fichiers HTML utilisent un design moderne avec :
- Gradient violet/bleu (couleurs de Tattoo Vision)
- Responsive design (mobile-friendly)
- Typographie Apple-style
- Animations au survol

Vous pouvez modifier les couleurs dans les balises `<style>` de chaque fichier.

## 📞 Support

Pour toute question, contactez : support@tattoovision.com

---

**© 2026 Tattoo Vision. Tous droits réservés.**
