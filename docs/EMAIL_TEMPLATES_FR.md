# Modèles d'Emails Prêts à l'Emploi pour Supabase

Copiez-collez les codes ci-dessous dans la section **Authentication > Emails > Templates** de Supabase (en bas de la page).

Ces modèles utilisent du HTML et du CSS "inline" (car les clients mail comme Gmail, Outlook bloque souvent le CSS externe) pour un rendu professionnel, épuré et adapté aux mobiles (responsive).

---

## 1. Modèle pour le Magic Link (Connexion sans mot de passe)
*C'est le plus important si vous utilisez la méthode Magic Link par défaut.*

**Sujet (Subject) :**
`🔑 Votre lien de connexion sécurisé - Tattoo Vision`

**Corps du message (Message body) :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion Tattoo Vision</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <!-- En-tête / Header -->
    <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Tattoo Vision</h1>
    </div>

    <!-- Contenu / Body -->
    <div style="padding: 40px 30px;">
      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Se connecter</h2>
      <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
        Vous avez demandé à vous connecter. Cliquez sur le bouton ci-dessous pour accéder à votre espace Tattoo Vision en toute sécurité. 
      </p>

      <!-- Bouton -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
          Se connecter
        </a>
      </div>

      <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
        Ce lien expirera dans quelques minutes. Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet e-mail en toute sécurité.
      </p>
    </div>

    <!-- Pied de page / Footer -->
    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="margin: 0; color: #a3a3a3; font-size: 12px;">
        © 2026 Tattoo Vision. Tous droits réservés.
      </p>
    </div>
    
  </div>
</body>
</html>
```

---

## 2. Modèle pour la Confirmation d'Inscription (Confirm Signup)
*Si jamais un utilisateur crée un compte de manière classique (Email/Mot de passe).*

**Sujet (Subject) :**
`✨ Bienvenue sur Tattoo Vision - Confirmez votre adresse e-mail`

**Corps du message (Message body) :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Tattoo Vision</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <!-- En-tête / Header -->
    <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Tattoo Vision</h1>
    </div>

    <!-- Contenu / Body -->
    <div style="padding: 40px 30px;">
      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Bienvenue !</h2>
      <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
        Nous sommes ravis de vous compter parmi nous. Pour commencer à visualiser vos futures créations, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.
      </p>

      <!-- Bouton -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
          Confirmer mon e-mail
        </a>
      </div>

      <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
        Si vous n'avez pas créé de compte sur Tattoo Vision, veuillez ignorer cet e-mail.
      </p>
    </div>

    <!-- Pied de page / Footer -->
    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="margin: 0; color: #a3a3a3; font-size: 12px;">
        © 2026 Tattoo Vision. Tous droits réservés.
      </p>
    </div>
    
  </div>
</body>
</html>
```

---

## 3. Modèle pour la Réinitialisation de Mot de Passe (Reset Password)
*Si vous avez un formulaire "Mot de passe oublié" dans l'app.*

**Sujet (Subject) :**
`🔒 Réinitialisation de votre mot de passe - Tattoo Vision`

**Corps du message (Message body) :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation Tattoo Vision</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <!-- En-tête / Header -->
    <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Tattoo Vision</h1>
    </div>

    <!-- Contenu / Body -->
    <div style="padding: 40px 30px;">
      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Mot de passe oublié ?</h2>
      <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
        Pas de panique ! Nous avons reçu une demande pour réinitialiser le mot de passe de votre compte Tattoo Vision.
      </p>

      <!-- Bouton -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
          Créer un nouveau mot de passe
        </a>
      </div>

      <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
        Si vous n'avez pas fait cette demande, votre mot de passe actuel restera inchangé.
      </p>
    </div>

    <!-- Pied de page / Footer -->
    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="margin: 0; color: #a3a3a3; font-size: 12px;">
        © 2026 Tattoo Vision. Tous droits réservés.
      </p>
    </div>
    
  </div>
</body>
</html>
```

### Comment tester que c'est beau ?
Dès que vous avez collé un de ces codes HTML dans Supabase, cliquez vite sur **Save** tout en bas de la page, et relancez une inscription/connexion depuis votre app. Vous recevrez instantanément un bel e-mail !
