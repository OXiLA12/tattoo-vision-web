# 🪄 AI Design Extractor - Guide de Fonctionnalité

## ✨ Nouvelle Feature "Extraction Vectorielle"

Nous avons ajouté une fonctionnalité puissante permettant de transformer une photo (ex: un vieux tatouage ou un croquis sur papier) en un fichier vectoriel propre, prêt à l'emploi.

### 🛠️ Comment ça marche ?

1.  **Upload** : L'utilisateur charge une photo (JPG/PNG).
2.  **Edge Function** : L'image est envoyée à `supabase/functions/extract-design`.
3.  **Gemini AI** : Le modèle Gemini 1.5 Flash Vision analyse l'image et recrée le design en code SVG (Vector), en ignorant la peau et le fond.
4.  **Résultat** : Un fichier SVG parfait, fond transparent, lignes nettes.

### 🔒 Restrictions

*   Accessible uniquement aux plans **Plus** ou supérieurs.
*   Protégé par le contexte Auth.

### 🚀 Configuration Requise

Pour que cela fonctionne, assurez-vous que votre projet Supabase a la variable d'environnement :
`GEMINI_API_KEY`

Si vous testez en local :
1.  Ajoutez `GEMINI_API_KEY=votre_clé` dans votre fichier `.env` ou `.env.local` de Supabase.
2.  Redémarrez les edge functions si nécessaire.

---

**C'est une utilisation très innovante de Gemini qui remplace des outils complexes de vectorisation !**
