# Configuration Supabase - Instructions

## Étape 1: Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Notez votre **URL du projet** et votre **clé anonyme (anon key)**

## Étape 2: Configurer les Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

## Étape 3: Exécuter le Script SQL

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez tout le contenu du fichier `supabase/schema.sql`
4. Exécutez la requête (bouton RUN)
5. **Important** : Faites de même avec le fichier `supabase/survey_update.sql` pour activer le système de crédits par sondage.

Cela va créer :
- ✅ 5 tables (profiles, user_credits, credit_transactions, tattoo_history, tattoo_library)
- ✅ Politiques de sécurité (RLS)
- ✅ Triggers automatiques
- ✅ Fonctions pour gérer les crédits

## Étape 3.5: Déployer les Edge Functions

Pour que les actions IA (Génération, Suppression de fond) fonctionnent, vous devez déployer les fonctions vers votre projet Supabase :

1. Assurez-vous d'avoir le CLI Supabase installé (`npm install -g supabase`)
2. Connectez-vous : `supabase login`
3. Liez votre projet : `supabase link --project-ref votre_id_projet` (l'ID est dans l'URL de votre dashboard : `https://supabase.com/dashboard/project/votre_id_projet`)
4. Déployez toutes les fonctions :
   ```bash
   supabase functions deploy remove-background
   supabase functions deploy generate-tattoo
   supabase functions deploy generate-realistic-render
   ```

## Étape 4: Configurer l'Authentification

1. Dans Supabase, allez dans **Authentication** > **Providers**
2. Activez **Email** (déjà activé par défaut)
3. (Optionnel) Activez **Google** si vous voulez la connexion Google

## Étape 5: Tester

1. Redémarrez votre serveur de développement : `npm run dev`
2. Créez un compte
3. Vérifiez que vous recevez 10 crédits gratuits
4. Testez la génération réaliste (doit déduire 1 crédit)

## Étape 6: Configurer les Clés API (Gemini & Remove.bg)

Pour que les fonctionnalités de génération de tatouage et de suppression de fond fonctionnent, vous devez ajouter les clés API dans les secrets de Supabase.

1.  Obtenez vos clés API :
    *   **Google Gemini API Key** : [aistudio.google.com](https://aistudio.google.com/app/apikey)
    *   **Remove.bg API Key** : [remove.bg/api](https://www.remove.bg/api)
2.  Dans Supabase > Edge Functions > Secrets, ajoutez :
    *   `GEMINI_API_KEY`: Votre clé API Google Gemini.
    *   `REMOVEBG_API_KEY`: Votre clé API Remove.bg.

## Étape 7: Configuration Stripe (Paiements)

Pour activer l'achat de crédits :

1.  Créez un compte sur [stripe.com](https://stripe.com).
2.  Dans Supabase > Edge Functions > Secrets, ajoutez :
    *   `STRIPE_SECRET_KEY`: Votre clé secrète Stripe (commence par `sk_test_...` ou `sk_live_...`).
    *   `SUPABASE_SERVICE_ROLE_KEY`: Votre clé service role Supabase (pour le webhook).
3.  Déployez les fonctions :
    ```bash
    supabase functions deploy create-checkout-session --no-verify-jwt
    supabase functions deploy stripe-webhook --no-verify-jwt
    ```
4.  Dans Stripe Dashboard > Developers > Webhooks, ajoutez un endpoint :
    *   URL : `https://<votre-projet>.supabase.co/functions/v1/stripe-webhook`
    *   Events : `checkout.session.completed`
5.  Copiez le "Signing secret" du webhook (commence par `whsec_...`) et ajoutez-le dans Supabase Secrets :
    *   `STRIPE_WEBHOOK_SECRET`: Le secret de signature.

## Fonctionnalités Implémentées

### ✅ Authentification
- Inscription avec email/password
- Connexion
- Déconnexion
- Gestion de session
- 10 crédits gratuits à l'inscription

### ✅ Système de Crédits & Paiement
- Affichage des crédits partout
- Vérification avant chaque action IA
- Déduction automatique (1 crédit par action)
- ✅ Achat de crédits via Stripe
- ✅ Modal de sélection de packs
- ✅ Webhook de validation de paiement sécurisé

### ✅ Historique & Bibliothèque
- Sauvegarde automatique
- Historique des transactions
- Gestion de profil

### ✅ Sécurité
- Row Level Security (RLS) activé
- Chaque utilisateur ne voit que ses données
- Fonctions sécurisées pour les crédits
