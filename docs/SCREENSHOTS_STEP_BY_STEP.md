# 📸 Guide Étape par Étape - Screenshots App Store

## 🎯 Objectif

Créer **6 screenshots** professionnels pour l'App Store en **30 minutes**.

---

## 📋 Prérequis

✅ Votre app tourne sur `http://localhost:5173`  
✅ Vous êtes connecté avec un compte qui a des Vision Points  
✅ Chrome ou Edge installé  

---

## 🚀 ÉTAPE 1 : Préparer le Navigateur (2 min)

### **1.1 Ouvrir Chrome/Edge**

```
1. Ouvrir Chrome ou Edge
2. Aller sur http://localhost:5173
3. Se connecter si pas déjà connecté
```

### **1.2 Activer le Mode Mobile**

```
1. Appuyer sur F12 (ouvrir DevTools)
2. Appuyer sur Ctrl + Shift + M (Toggle device toolbar)
3. OU cliquer sur l'icône 📱 en haut à gauche des DevTools
```

### **1.3 Choisir la Taille iPhone**

```
1. En haut, sélectionner "Responsive"
2. Changer pour "iPhone 14 Pro Max" ou "iPhone 15 Pro Max"
3. Vérifier que les dimensions sont : 430 x 932
```

**💡 Astuce :** Si vous ne voyez pas iPhone 14 Pro Max, choisissez "Edit..." et ajoutez-le.

---

## 📸 ÉTAPE 2 : Prendre les 6 Screenshots (20 min)

### **Screenshot 1 : Bibliothèque de Tatouages** 📚

**Ce qu'on montre :** La variété de tatouages disponibles

**Actions :**
```
1. Naviguer vers "Library" (icône Grid en bas)
2. Attendre que les tatouages se chargent
3. Scroller un peu pour montrer la variété
4. Prendre le screenshot
```

**Comment prendre le screenshot :**
```
Méthode 1 (Recommandée) :
- Clic droit sur la page → "Capture screenshot" → "Capture full size screenshot"

Méthode 2 :
- Win + Shift + S (Outil Capture Windows)
- Sélectionner la zone du téléphone

Méthode 3 :
- DevTools → Menu (⋮) → "Capture screenshot"
```

**Sauvegarder :** `screenshots/01-library.png`

---

### **Screenshot 2 : AI Studio - Interface** ✨

**Ce qu'on montre :** L'interface de création IA

**Actions :**
```
1. Naviguer vers "AI Studio" (icône Sparkles en bas)
2. Dans le champ de description, taper un exemple :
   "Dragon japonais avec fleurs de cerisier, style traditionnel, noir et gris"
3. NE PAS cliquer sur Générer encore
4. Prendre le screenshot de l'interface
```

**Sauvegarder :** `screenshots/02-ai-studio.png`

---

### **Screenshot 3 : Résultat de Génération IA** 🎨

**Ce qu'on montre :** Un tatouage généré par l'IA

**Actions :**
```
1. Toujours dans AI Studio
2. Cliquer sur "Générer"
3. Attendre que le tatouage soit généré (10-30 secondes)
4. Prendre le screenshot du résultat
```

**💡 Si la génération échoue :**
- Essayer un autre prompt plus simple : "Simple dragon tattoo"
- Ou utiliser un tatouage de la bibliothèque et faire semblant que c'est généré

**Sauvegarder :** `screenshots/03-ai-generation.png`

---

### **Screenshot 4 : Upload Photo** 📷

**Ce qu'on montre :** L'interface pour uploader une photo de corps

**Actions :**
```
1. Naviguer vers "Create" (icône Home en bas)
2. Cliquer sur "Upload Body Photo" ou la zone de drop
3. Prendre le screenshot de l'interface d'upload
```

**OU si vous voulez montrer avec une photo :**
```
1. Uploader une photo de bras/jambe (chercher sur Unsplash.com)
2. Prendre le screenshot avec la photo uploadée
```

**Sauvegarder :** `screenshots/04-upload.png`

---

### **Screenshot 5 : Éditeur - Placement du Tatouage** 🎯

**Ce qu'on montre :** L'interface d'édition avec tatouage sur le corps

**Actions :**
```
1. Après avoir uploadé une photo de corps
2. Sélectionner un tatouage (de la bibliothèque ou généré)
3. L'éditeur s'ouvre automatiquement
4. Ajuster la position, taille, rotation du tatouage
5. Prendre le screenshot
```

**💡 Astuce :** Positionnez le tatouage de manière esthétique (sur le bras, l'épaule, etc.)

**Sauvegarder :** `screenshots/05-editor.png`

---

### **Screenshot 6 : Plans d'Abonnement** 💎

**Ce qu'on montre :** Les options d'abonnement

**Actions :**
```
1. Naviguer vers "Profile" (icône User en bas)
2. Scroller jusqu'à voir les plans (Plus, Pro, Studio)
3. OU essayer d'utiliser une fonctionnalité premium pour déclencher le paywall
4. Prendre le screenshot des plans
```

**Alternative :**
```
Si vous ne voyez pas les plans dans Profile :
1. Essayer de générer un tatouage sans points
2. Le paywall devrait apparaître
3. Prendre le screenshot
```

**Sauvegarder :** `screenshots/06-plans.png`

---

## 🎨 ÉTAPE 3 : Créer les Mockups iPhone (10 min)

Maintenant qu'on a les 6 screenshots, on va les mettre dans des mockups iPhone.

### **Option A : Mockuphone (Le Plus Rapide)** ⚡

**Temps : 5 minutes**

```
1. Aller sur https://mockuphone.com/
2. Choisir "iPhone 15 Pro Max" (ou 14 Pro Max)
3. Pour chaque screenshot :
   a. Cliquer sur "Choose File"
   b. Sélectionner le screenshot
   c. Attendre le rendu
   d. Clic droit → "Save image as..."
   e. Sauvegarder : screenshots/iphone-6.7/01-library.png
4. Répéter pour les 6 screenshots
```

**Résultat :** 6 images avec mockup iPhone

---

### **Option B : Figma (Plus Professionnel)** 🎨

**Temps : 15 minutes**

```
1. Aller sur https://www.figma.com/
2. Créer un compte gratuit
3. Créer un nouveau design
4. Créer un Frame : 1290 x 2796 (iPhone 6.7")
5. Chercher "iPhone mockup" dans Figma Community
6. Importer un template iPhone
7. Glisser vos screenshots dans les mockups
8. Exporter en PNG
```

**Avantage :** Vous pouvez ajouter du texte marketing, des effets, etc.

---

### **Option C : Pas de Mockup (Accepté par Apple)** ✅

**Temps : 0 minutes**

```
Vous pouvez uploader les screenshots SANS mockup iPhone !
Apple accepte les screenshots simples.

Il faut juste redimensionner aux bonnes tailles :
- 1290 x 2796 (iPhone 6.7")
- 1242 x 2688 (iPhone 6.5")
```

**Pour redimensionner :**
```
1. Aller sur https://www.iloveimg.com/resize-image
2. Uploader vos 6 screenshots
3. Redimensionner à 1290 x 2796
4. Télécharger
```

---

## 📐 ÉTAPE 4 : Redimensionner pour les 2 Tailles (5 min)

Apple exige 2 tailles d'iPhone :

### **Taille 1 : iPhone 6.7" (1290 x 2796)**

```
Déjà fait si vous avez utilisé Mockuphone ou Figma !
```

### **Taille 2 : iPhone 6.5" (1242 x 2688)**

**Méthode rapide :**
```
1. Aller sur https://www.iloveimg.com/resize-image
2. Uploader vos 6 screenshots (version 6.7")
3. Redimensionner à 1242 x 2688
4. Télécharger
5. Sauvegarder dans screenshots/iphone-6.5/
```

---

## 📁 ÉTAPE 5 : Organiser les Fichiers (2 min)

Votre dossier `screenshots/` devrait ressembler à ça :

```
screenshots/
├── iphone-6.7/
│   ├── 01-library.png
│   ├── 02-ai-studio.png
│   ├── 03-ai-generation.png
│   ├── 04-upload.png
│   ├── 05-editor.png
│   └── 06-plans.png
└── iphone-6.5/
    ├── 01-library.png
    ├── 02-ai-studio.png
    ├── 03-ai-generation.png
    ├── 04-upload.png
    ├── 05-editor.png
    └── 06-plans.png
```

**Total : 12 fichiers** (6 par taille)

---

## ✅ ÉTAPE 6 : Vérification Finale (2 min)

### **Checklist :**

```
[ ] 6 screenshots pour iPhone 6.7" (1290 x 2796)
[ ] 6 screenshots pour iPhone 6.5" (1242 x 2688)
[ ] Format PNG
[ ] Bonne qualité (pas de flou)
[ ] Pas de contenu offensant
[ ] Interface claire et lisible
[ ] Ordre logique (meilleur screenshot en premier)
```

### **Vérifier les Dimensions :**

```
Windows :
1. Clic droit sur l'image → Propriétés → Détails
2. Vérifier "Dimensions"

Ou en ligne :
1. https://www.metadata2go.com/
2. Uploader l'image
3. Voir les dimensions
```

---

## 🎯 Ordre Recommandé des Screenshots

L'ordre est important ! Apple affiche les screenshots dans l'ordre où vous les uploadez.

**Ordre optimal :**

```
1. 📚 Library - Montrer la variété de tatouages
2. ✨ AI Studio - Montrer la création IA
3. 🎨 Résultat IA - Montrer un tatouage généré
4. 🎯 Éditeur - Montrer le placement sur le corps
5. 📷 Upload - Montrer l'interface simple
6. 💎 Plans - Montrer les options d'abonnement
```

**Pourquoi cet ordre ?**
- Le **meilleur screenshot** (Library ou AI) en premier
- Montrer les **fonctionnalités principales** d'abord
- Les **plans** en dernier (moins sexy mais nécessaire)

---

## 💡 Astuces Pro

### **Pour de Meilleurs Screenshots :**

1. **Utilisez du Contenu Réel**
   - Vrais tatouages générés
   - Vraies photos de corps
   - Pas de placeholder

2. **Soignez l'Esthétique**
   - Interface propre
   - Pas d'erreurs visibles
   - Bonne luminosité

3. **Ajoutez du Texte Marketing** (Optionnel)
   ```
   Screenshot 1: "Thousands of Tattoo Designs"
   Screenshot 2: "Create with AI"
   Screenshot 3: "Unique Designs in Seconds"
   Screenshot 4: "Visualize on Your Body"
   Screenshot 5: "Perfect Placement"
   Screenshot 6: "Choose Your Plan"
   ```

4. **Testez sur Vrai Mobile**
   - Ouvrir l'app sur votre téléphone
   - Prendre des screenshots natifs
   - Meilleure qualité !

---

## 🆘 Problèmes Courants

### **"Mes screenshots sont flous"**

**Solution :**
```
1. Utiliser "Capture full size screenshot" dans DevTools
2. Ou augmenter le zoom à 100% avant de capturer
3. Exporter en PNG (pas JPG)
```

### **"Les dimensions ne sont pas exactes"**

**Solution :**
```
1. Utiliser https://www.iloveimg.com/resize-image
2. Choisir "Resize by pixels"
3. Entrer exactement 1290 x 2796
4. Cocher "Don't enlarge if smaller"
```

### **"Je n'ai pas de photo de corps"**

**Solution :**
```
1. Aller sur https://unsplash.com/
2. Chercher "arm" ou "leg" ou "back"
3. Télécharger une photo gratuite
4. Utiliser dans l'app
```

### **"La génération IA ne marche pas"**

**Solution :**
```
1. Vérifier que vous avez des Vision Points
2. Ou utiliser un tatouage de la bibliothèque
3. Faire semblant que c'est généré (pour le screenshot)
```

---

## ⏱️ Timeline Complète

| Étape | Durée | Total |
|-------|-------|-------|
| 1. Préparer navigateur | 2 min | 2 min |
| 2. Prendre 6 screenshots | 20 min | 22 min |
| 3. Créer mockups | 10 min | 32 min |
| 4. Redimensionner | 5 min | 37 min |
| 5. Organiser fichiers | 2 min | 39 min |
| 6. Vérification | 2 min | **41 min** |

**Total : ~40 minutes pour 12 screenshots professionnels**

---

## 🚀 Prochaines Étapes

Après avoir créé les screenshots :

```
1. ✅ Uploader dans App Store Connect
2. ✅ Configurer RevenueCat
3. ✅ Créer le compte de test
4. ✅ Builder avec Codemagic
5. ✅ Soumettre pour review
```

**Guide :** `docs/ACTION_PLAN_APP_STORE.md`

---

## 📞 Ressources

### **Outils Utilisés :**
- **Chrome DevTools** : Simulateur mobile
- **Mockuphone** : https://mockuphone.com/
- **Figma** : https://www.figma.com/
- **ILoveIMG** : https://www.iloveimg.com/
- **Unsplash** : https://unsplash.com/

### **Guides :**
- `docs/CREATE_SCREENSHOTS_GUIDE.md` - Guide complet
- `docs/SCREENSHOTS_WITHOUT_API.md` - Si les APIs ne marchent pas

---

**🎉 Vous êtes prêt ! Commencez par l'Étape 1 et suivez le guide pas à pas !**

**💡 Astuce : Faites une pause café entre chaque étape pour rester concentré !**
