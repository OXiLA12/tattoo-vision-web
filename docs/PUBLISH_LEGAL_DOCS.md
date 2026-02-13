# Guide de Publication des Documents Légaux

## 🎯 Objectif

Publier vos documents `privacy-policy.md` et `terms-of-service.md` en ligne pour obtenir des URLs publiques requises par l'App Store.

---

## ✅ Option 1 : GitHub Pages (RECOMMANDÉ - Gratuit)

### Avantages
- ✅ Gratuit
- ✅ Facile à mettre à jour
- ✅ URLs propres
- ✅ Hébergement fiable

### Étapes

#### 1. Créer un dépôt GitHub

```bash
# Dans votre terminal
cd c:\Users\Kali\Desktop\tattoo-vision-updated\project

# Initialiser git si pas déjà fait
git init

# Créer un dépôt sur GitHub (via l'interface web)
# Nom suggéré : tattoo-vision-legal
```

#### 2. Créer la structure pour GitHub Pages

```bash
# Créer un dossier docs pour GitHub Pages
mkdir docs-web
cd docs-web

# Copier les fichiers légaux
cp ../legal/privacy-policy.md ./privacy.md
cp ../legal/terms-of-service.md ./terms.md
```

#### 3. Convertir Markdown en HTML

Créer `docs-web/index.html` :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tattoo Vision - Documents Légaux</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #6366f1; }
        a { color: #6366f1; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .container { padding: 40px 20px; }
        .links { display: flex; gap: 20px; margin-top: 30px; }
        .link-card {
            flex: 1;
            padding: 20px;
            border: 2px solid #6366f1;
            border-radius: 8px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Tattoo Vision</h1>
        <p>Documents légaux de l'application Tattoo Vision</p>
        
        <div class="links">
            <div class="link-card">
                <h2>Politique de Confidentialité</h2>
                <a href="privacy.html">Lire →</a>
            </div>
            <div class="link-card">
                <h2>Conditions d'Utilisation</h2>
                <a href="terms.html">Lire →</a>
            </div>
        </div>
    </div>
</body>
</html>
```

#### 4. Convertir les fichiers MD en HTML

Vous pouvez utiliser un outil en ligne comme :
- https://markdowntohtml.com/
- https://dillinger.io/

Ou utiliser pandoc :

```bash
# Installer pandoc (si pas déjà fait)
# Windows : choco install pandoc
# Ou télécharger depuis https://pandoc.org/installing.html

# Convertir les fichiers
pandoc privacy.md -f markdown -t html -s -o privacy.html --metadata title="Politique de Confidentialité - Tattoo Vision"
pandoc terms.md -f markdown -t html -s -o terms.html --metadata title="Conditions d'Utilisation - Tattoo Vision"
```

#### 5. Publier sur GitHub Pages

```bash
# Ajouter les fichiers
git add docs-web/
git commit -m "Add legal documents"
git push origin main

# Sur GitHub.com :
# 1. Aller dans Settings
# 2. Pages (dans le menu latéral)
# 3. Source : Deploy from a branch
# 4. Branch : main
# 5. Folder : /docs-web
# 6. Save
```

#### 6. Obtenir les URLs

Après quelques minutes, vos documents seront disponibles à :

```
https://[votre-username].github.io/tattoo-vision-legal/privacy.html
https://[votre-username].github.io/tattoo-vision-legal/terms.html
```

---

## ✅ Option 2 : Netlify (Gratuit, Plus Simple)

### Avantages
- ✅ Gratuit
- ✅ Très simple (drag & drop)
- ✅ URLs personnalisables
- ✅ HTTPS automatique

### Étapes

#### 1. Préparer les fichiers

Créer un dossier `legal-site` avec :

```
legal-site/
├── index.html
├── privacy.html
└── terms.html
```

#### 2. Aller sur Netlify

1. Aller sur https://www.netlify.com/
2. Créer un compte (gratuit)
3. Cliquer sur "Add new site" → "Deploy manually"
4. Glisser-déposer le dossier `legal-site`

#### 3. Obtenir les URLs

Netlify vous donnera une URL comme :
```
https://tattoo-vision-legal.netlify.app/privacy.html
https://tattoo-vision-legal.netlify.app/terms.html
```

Vous pouvez personnaliser le nom du site dans les paramètres.

---

## ✅ Option 3 : Vercel (Gratuit, Pour Développeurs)

### Avantages
- ✅ Gratuit
- ✅ Déploiement automatique depuis GitHub
- ✅ Très rapide
- ✅ URLs propres

### Étapes

1. Créer un compte sur https://vercel.com/
2. Connecter votre dépôt GitHub
3. Déployer automatiquement

URLs finales :
```
https://tattoo-vision-legal.vercel.app/privacy.html
https://tattoo-vision-legal.vercel.app/terms.html
```

---

## 📝 Template HTML Simple (Si vous voulez tout faire manuellement)

Créer `privacy.html` :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Politique de Confidentialité - Tattoo Vision</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        h2 { color: #4f46e5; margin-top: 30px; }
        h3 { color: #6366f1; }
        a { color: #6366f1; }
        .header { text-align: center; margin-bottom: 40px; }
        .last-updated { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Politique de Confidentialité</h1>
        <p class="last-updated">Dernière mise à jour : 27 janvier 2026</p>
    </div>

    <!-- Copier-coller le contenu de privacy-policy.md ici, converti en HTML -->
    
    <h2>1. Introduction</h2>
    <p>Tattoo Vision ("nous", "notre", "l'application") respecte votre vie privée...</p>
    
    <!-- etc. -->

</body>
</html>
```

---

## 🎯 URLs à Ajouter dans App Store Connect

Une fois publiés, ajoutez ces URLs dans App Store Connect :

### Privacy Policy URL
```
https://[votre-site]/privacy.html
```

### Terms of Service URL (optionnel mais recommandé)
```
https://[votre-site]/terms.html
```

### Support URL
```
https://[votre-site]/support.html
```

---

## ✅ Vérification Finale

Avant de soumettre à Apple, vérifiez que :

- [ ] Les URLs sont accessibles publiquement (testez en navigation privée)
- [ ] Les pages se chargent correctement sur mobile
- [ ] Le contenu est lisible et formaté correctement
- [ ] Les URLs utilisent HTTPS (pas HTTP)
- [ ] Les pages contiennent bien tout le contenu des fichiers MD

---

## 🚀 Commandes Rapides

### Convertir MD → HTML avec Pandoc

```bash
# Installer pandoc
choco install pandoc

# Convertir avec style
pandoc legal/privacy-policy.md -f markdown -t html -s -o privacy.html \
  --metadata title="Politique de Confidentialité - Tattoo Vision" \
  --css=style.css

pandoc legal/terms-of-service.md -f markdown -t html -s -o terms.html \
  --metadata title="Conditions d'Utilisation - Tattoo Vision" \
  --css=style.css
```

### Créer un fichier CSS (style.css)

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
    color: #333;
}

h1 {
    color: #6366f1;
    border-bottom: 2px solid #6366f1;
    padding-bottom: 10px;
}

h2 {
    color: #4f46e5;
    margin-top: 30px;
}

h3 {
    color: #6366f1;
}

a {
    color: #6366f1;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.last-updated {
    color: #666;
    font-style: italic;
    text-align: center;
}
```

---

## 📞 Besoin d'Aide ?

Si vous avez des questions, contactez-moi ou consultez :
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)

---

**Recommandation** : Utilisez **Netlify** pour la simplicité, ou **GitHub Pages** si vous voulez tout contrôler via Git.
