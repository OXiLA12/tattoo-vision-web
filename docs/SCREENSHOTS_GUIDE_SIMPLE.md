# 📸 Guide Screenshots App Store

## 🎯 Problème Actuel

Votre screenshot capture **tout l'écran** (navigateur + DevTools + barre des tâches).

**Apple veut :** Uniquement l'application, comme sur un vrai iPhone.

---

## ✅ Solution Rapide (3 Méthodes)

### **Méthode 1 : DevTools + Recadrage Manuel**

1. **Ouvrir DevTools** : `F12`
2. **Mode Device** : `Ctrl + Shift + M`
3. **Choisir** : "iPhone 14 Pro Max"
4. **Fermer DevTools** : `F12` (pour cacher la console)
5. **Screenshot** : `Win + Shift + S`
6. **Sélectionner** : UNIQUEMENT la zone du téléphone (pas le navigateur)
7. **Coller** : Dans Paint ou Photoshop
8. **Redimensionner** : 1290 x 2796 pixels

**Avantages :** ✅ Rapide, ✅ Pas besoin d'outils

---

### **Méthode 2 : Screenshot.rocks (RECOMMANDÉ)**

1. **Prendre screenshot** : `Win + Shift + S` (zone du téléphone uniquement)
2. **Aller sur** : https://screenshot.rocks/
3. **Upload** votre image
4. **Choisir** : "iPhone 14 Pro Max"
5. **Options** :
   - ✅ "Remove device frame" (juste l'écran)
   - OU garder le frame pour un look pro
6. **Download** : Taille parfaite pour App Store

**Avantages :** ✅ Automatique, ✅ Tailles exactes, ✅ Gratuit

---

### **Méthode 3 : iPhone Réel (Meilleur Qualité)**

**Si vous avez un iPhone :**

```bash
# 1. Build l'app
npm run build
npx cap sync ios
npx cap open ios

# 2. Dans Xcode, run sur votre iPhone
# 3. Prendre screenshots : Volume Up + Power Button
# 4. AirDrop vers PC
```

**Avantages :** ✅ Qualité native, ✅ Tailles parfaites

---

## 📐 Tailles Requises

Apple exige **2 tailles minimum** :

| Device | Résolution | Obligatoire |
|--------|------------|-------------|
| iPhone 6.7" (14 Pro Max) | 1290 x 2796 | ✅ OUI |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | ✅ OUI |

**Nombre de screenshots :** 3 à 10 par taille

---

## 🎨 Conseils pour de Beaux Screenshots

### **1. Choisir les Bonnes Pages**

**Recommandé (6 screenshots) :**
1. **Welcome/Onboarding** - Première impression
2. **Library** - Voir les designs
3. **Upload** - Uploader des images
4. **Editor** - Placer le tatouage
5. **Realistic Render** - Avant/Après (slider)
6. **Profile/Plans** - Fonctionnalités premium

### **2. Préparer les Données**

- ✅ Utiliser de **vraies images** (pas de placeholders)
- ✅ Choisir des **tatouages cool** (lion, dragon, fleurs)
- ✅ **Remplir** la library avec plusieurs designs
- ✅ **Pas d'erreurs** visibles

### **3. Optimiser l'Affichage**

```javascript
// Masquer les éléments de debug
localStorage.setItem('hasSeenRealisticGuide', 'true');
localStorage.setItem('hasSeenPhotoGuide', 'true');

// Simuler un utilisateur premium (pour montrer toutes les features)
// Modifier temporairement le plan dans DevTools
```

---

## 🛠️ Script Automatique

**Pour redimensionner vos screenshots :**

```bash
# 1. Installer sharp
npm install sharp

# 2. Créer le dossier
mkdir screenshots/raw

# 3. Mettre vos screenshots dans screenshots/raw/

# 4. Run le script
node scripts/resize-screenshots.js

# 5. Récupérer dans screenshots/app-store/
```

Le script crée automatiquement les 2 tailles requises !

---

## 📋 Checklist

**Avant de prendre les screenshots :**

- [ ] Mode Device activé (`Ctrl + Shift + M`)
- [ ] iPhone 14 Pro Max sélectionné
- [ ] DevTools fermés (`F12`)
- [ ] Données réelles (pas de placeholders)
- [ ] Pas d'erreurs visibles
- [ ] Guides/Modals fermés (sauf si vous voulez les montrer)

**Après avoir pris les screenshots :**

- [ ] Vérifier la taille : 1290 x 2796
- [ ] Vérifier le format : PNG ou JPG
- [ ] Vérifier la qualité : Pas de flou
- [ ] Nommer clairement : `01-welcome.png`, `02-library.png`, etc.

---

## 🎯 Workflow Complet

### **Étape 1 : Préparer l'App**

```bash
# Lancer l'app
npm run dev -- --host

# Ouvrir dans Chrome
# http://localhost:5173
```

### **Étape 2 : Configurer DevTools**

```
1. F12 (ouvrir DevTools)
2. Ctrl + Shift + M (mode device)
3. Choisir "iPhone 14 Pro Max"
4. Zoom: 100%
5. F12 (fermer DevTools pour cacher la console)
```

### **Étape 3 : Naviguer et Capturer**

```
Pour chaque page :
1. Naviguer vers la page
2. Attendre le chargement complet
3. Win + Shift + S
4. Sélectionner UNIQUEMENT la zone du téléphone
5. Coller dans Paint
6. Sauvegarder : screenshots/raw/01-page-name.png
```

### **Étape 4 : Redimensionner**

```bash
# Option A : Script automatique
node scripts/resize-screenshots.js

# Option B : Screenshot.rocks
# Upload sur https://screenshot.rocks/
# Choisir iPhone 14 Pro Max
# Download
```

### **Étape 5 : Vérifier**

```
Pour chaque screenshot :
- [ ] Taille : 1290 x 2796 ✅
- [ ] Format : PNG ✅
- [ ] Qualité : Nette ✅
- [ ] Contenu : Pertinent ✅
```

---

## 🚀 Prochaines Étapes

1. **Prendre 6 screenshots** (méthode ci-dessus)
2. **Redimensionner** aux bonnes tailles
3. **Uploader** sur App Store Connect
4. **Soumettre** l'app pour review

---

**🎉 Vous êtes prêt pour l'App Store !**
