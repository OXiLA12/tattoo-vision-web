# Guide de Configuration : Resend avec Supabase Auth

Ce guide explique comment remplacer le système d'envoi d'emails par défaut de Supabase par **Resend**. Cela permet de contourner les limites d'envoi de Supabase, d'améliorer considérablement la délivrabilité de vos emails de vérification et de personnalisation.

Il existe **deux méthodes** pour configurer Resend avec Supabase. Nous recommandons la **Méthode 1 (SMTP)** car elle est la plus simple et la plus rapide à mettre en place.

---

## Prérequis

1. Un compte sur [Resend](https://resend.com)
2. Avoir ajouté et vérifié votre nom de domaine sur Resend (ex: `votredomaine.com`). C'est obligatoire pour garantir une bonne délivrabilité.
3. Avoir généré une clé d'API (API Key) sur Resend.

---

## Méthode 1 : Utiliser Resend via SMTP (Recommandé & Ultra-Rapide)

C'est la méthode la plus simple. Supabase se connecte à Resend via le protocole standard SMTP. Aucune ligne de code n'est à écrire.

### Étape 1 : Récupérer les informations SMTP de Resend
Dans le tableau de bord Resend :
1. Allez dans **API Keys**.
2. Créez une nouvelle clé d'API (avec les permissions par défaut) si vous n'en avez pas déjà une.
3. **Copiez cette clé** (elle ne s'affichera qu'une seule fois).

Les identifiants SMTP de Resend sont toujours les mêmes, seule la clé d'API change :
- **Host (Serveur)** : `smtp.resend.com`
- **Port** : `465`
- **Username (Utilisateur)** : `resend`
- **Password (Mot de passe)** : `votre_clé_api_resend_re-xxxx`

### Étape 2 : Configurer Supabase
Dans le tableau de bord Supabase :
1. Allez dans **Project Settings** (l'icône d'engrenage en bas à gauche de votre projet).
2. Cliquez sur **Authentication** puis sur **Emails**. (Ou Settings > Auth > Email Provider).
3. Activez **Enable Custom SMTP**.
4. Remplissez les champs avec les informations de Resend :
   - **Sender email** : L'adresse email avec laquelle vous voulez envoyer, ex: `contact@votredomaine.com` (le domaine doit être vérifié sur Resend !).
   - **Sender name** : Le nom de votre application (ex: `Tattoo Vision`).
   - **Host** : `smtp.resend.com`
   - **Port Number** : `465`
   - **Username** : `resend`
   - **Password** : *(collez votre clé d'API Resend ici)*
5. Enregistrez les modifications (Save).

### Étape 3 : Personnaliser les templates (Optionnel)
Toujours dans la section **Emails** de Supabase, vous pouvez modifier les templates textuels des emails envoyés (Confirmation signup, Password recovery, Magic Link...).
*Note : Si vous utilisez cette méthode, vous utilisez le moteur de template de Supabase, mais l'envoi est géré par la plateforme ultra-rapide de Resend de façon fiable.*

---

## Méthode 2 : Utiliser les Webhooks Auth / Edge Functions (Avancée)

Si vous voulez utiliser les templates de Resend (par exemple des emails créés avec React Email) et avoir un contrôle total sur l'envoi, vous pouvez utiliser les **Auth Hooks (Send Email Hook)** introduits plus récemment par Supabase.

### Comment ça marche ?
1. Allez dans Supabase **Auth** > **Hooks**.
2. Activez le **Send Email Hook**.
3. Pointez ce Hook vers une **Edge Function** Supabase.
4. Dans cette Edge Function (ex: `supabase/functions/resend-email`), vous recevrez toutes les infos formatées par Supabase (type d'email à envoyer, token, redirect_to, etc.).
5. Utilisez le SDK TypeScript de `resend` ou simplement un fetch dans la Edge Function pour envoyer un bel email personnalisé en HTML.

---

## ✅ Comment vérifier que ça marche ?

1. Essayez de vous inscrire avec une nouvelle adresse e-mail sur votre application ou demandez un lien magique.
2. Allez sur le tableau de bord **Resend**, dans la section **Emails**.
3. Vous devriez voir l'email de Supabase apparaître dans le journal d'envoi de Resend avec le statut `Delivered`.
4. Vous devriez recevoir l'email dans votre boîte de réception de test presque instantanément, et ce, sans tomber dans les spams !
