# Guide de Débogage - Images Non Visibles dans l'Éditeur

## Étapes de Débogage

### 1. Ouvrir la Console du Navigateur

1. Ouvrez votre application: `http://localhost:5173`
2. Appuyez sur `F12` ou `Ctrl+Shift+I` pour ouvrir les DevTools
3. Allez dans l'onglet **Console**

### 2. Tester le Flux d'Upload

1. Sur la page d'accueil, cliquez sur "Get Started"
2. Uploadez une photo de corps
3. Uploadez un design de tattoo
4. Cliquez sur "Continue"

### 3. Vérifier les Messages dans la Console

Vous devriez voir ces messages:

✅ **Messages de Succès:**
```
✅ Body image loaded successfully
✅ Tattoo image loaded successfully
```

❌ **Messages d'Erreur Possibles:**
```
❌ Body image failed to load: data:image/jpeg;base64,...
❌ Tattoo image failed to load: data:image/jpeg;base64,...
```

### 4. Vérifier le Type d'URL

Dans la console, tapez:
```javascript
// Vérifier si les images sont des data URLs
console.log('Body URL type:', window.bodyImage?.url?.substring(0, 30));
console.log('Tattoo URL type:', window.tattooImage?.url?.substring(0, 30));
```

**Attendu:** Les URLs doivent commencer par `data:image/jpeg;base64,` ou `data:image/png;base64,`

**Problème:** Si elles commencent par `blob:http://localhost`, c'est le problème!

### 5. Vérifier l'Onglet Network

1. Allez dans l'onglet **Network** des DevTools
2. Uploadez les images
3. Cherchez des requêtes qui échouent (en rouge)

### 6. Vérifier l'Onglet Elements

1. Allez dans l'onglet **Elements**
2. Trouvez les éléments `<img>` dans l'éditeur
3. Vérifiez l'attribut `src`:
   - Clic droit sur `<img>`
   - Inspectez l'attribut `src`
   - Il devrait commencer par `data:image/`

## Problèmes Courants et Solutions

### Problème 1: Canvas Noir / Aucune Image

**Symptômes:**
- L'éditeur s'affiche mais le canvas est complètement noir
- Aucune image visible

**Causes Possibles:**
1. Les images ne sont pas converties en data URLs
2. Les blob URLs sont révoquées
3. Erreur de chargement d'image

**Solution:**
Vérifiez dans la console si vous voyez les messages d'erreur. Si oui, les images ne se chargent pas.

### Problème 2: Images Chargées mais Pas d'Interaction

**Symptômes:**
- Les images sont visibles
- Impossible de drag/scale/rotate

**Solution:**
Ce n'est pas lié au problème des blob URLs. Vérifiez les event handlers.

### Problème 3: Images Disparaissent Après Navigation

**Symptômes:**
- Images visibles initialement
- Disparaissent après retour en arrière puis en avant

**Cause:**
Blob URLs révoquées

**Solution:**
Nos modifications devraient résoudre ce problème. Vérifiez que les URLs sont bien des data URLs.

## Test Manuel Complet

### Test 1: Upload Direct
```
1. Page d'accueil → Get Started
2. Upload photo de corps
3. Upload tattoo
4. Continue → Éditeur
5. ✅ Les deux images doivent être visibles
```

### Test 2: Navigation
```
1. Dans l'éditeur avec images chargées
2. Cliquez "Back"
3. Cliquez "Continue"
4. ✅ Les images doivent toujours être visibles
```

### Test 3: History
```
1. Créez une composition et exportez
2. Allez dans History
3. Cliquez sur une création passée
4. ✅ Les images doivent se charger dans l'éditeur
```

### Test 4: Library
```
1. Allez dans Library
2. Sélectionnez un tattoo
3. ✅ Le tattoo doit se charger
```

## Informations à Collecter

Si le problème persiste, collectez ces informations:

### 1. Console Logs
Copiez tous les messages de la console, surtout:
- Messages d'erreur (en rouge)
- Warnings (en jaune)
- Nos messages de debug (✅ ou ❌)

### 2. Type d'URL
```javascript
// Dans la console
console.log('Body URL:', bodyImage?.url?.substring(0, 100));
console.log('Tattoo URL:', tattooImage?.url?.substring(0, 100));
```

### 3. État de l'Application
```javascript
// Dans la console
console.log('Body Image:', bodyImage);
console.log('Tattoo Image:', tattooImage);
console.log('Transform:', tattooTransform);
```

### 4. Screenshot
Prenez une capture d'écran de:
- L'éditeur (avec le canvas noir)
- La console avec les erreurs
- L'onglet Network

## Commandes de Debug Rapides

Ouvrez la console et collez ces commandes:

```javascript
// Vérifier si les images existent dans React state
// (Nécessite React DevTools)

// Vérifier manuellement le chargement d'une data URL
const testImg = new Image();
testImg.onload = () => console.log('✅ Test image loaded');
testImg.onerror = () => console.log('❌ Test image failed');
testImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Vérifier si le canvas fonctionne
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
console.log('Canvas context:', ctx ? '✅ OK' : '❌ Failed');
```

## Prochaines Étapes

1. **Suivez les étapes de débogage ci-dessus**
2. **Collectez les informations demandées**
3. **Partagez les résultats:**
   - Messages de console
   - Type d'URL (blob vs data)
   - Screenshots

Cela nous aidera à identifier précisément où se situe le problème!
