export const resetPasswordTemplate = (actionUrl: string) => ({
    subject: "Reset your Tattoo Vision password",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Tattoo Vision Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <!-- En-tête / Header -->
    <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Tattoo Vision</h1>
    </div>

    <!-- Contenu / Body -->
    <div style="padding: 40px 30px;">
      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Forgot your password?</h2>
      <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
        Don't worry! We received a request to reset the password for your Tattoo Vision account.
      </p>

      <!-- Bouton -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${actionUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
          Create a new password
        </a>
      </div>

      <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
        If you didn't make this request, your current password will remain unchanged.
      </p>
    </div>

    <!-- Pied de page / Footer -->
    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="margin: 0; color: #a3a3a3; font-size: 12px;">
        © 2026 Tattoo Vision. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>`
});
