export const confirmAccountTemplate = (actionUrl: string) => ({
    subject: "Xác nhận tài khoản Tattoo Vision của bạn 🎉",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào mừng đến với Tattoo Vision</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <!-- En-tête / Header -->
    <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Tattoo Vision</h1>
    </div>

    <!-- Contenu / Body -->
    <div style="padding: 40px 30px;">
      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Chào mừng bạn!</h2>
      <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
        Chúng tôi rất vui khi có bạn đồng hành. Để bắt đầu hình dung những tác phẩm tương lai của bạn, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào nút dưới đây.
      </p>

      <!-- Bouton -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${actionUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
          Xác nhận email của tôi
        </a>
      </div>

      <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
        Nếu bạn chưa tạo tài khoản trên Tattoo Vision, bạn có thể bỏ qua email này.
      </p>
    </div>

    <!-- Pied de page / Footer -->
    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="margin: 0; color: #a3a3a3; font-size: 12px;">
        © 2026 Tattoo Vision. Đã đăng ký Bản quyền.
      </p>
    </div>
    
  </div>
</body>
</html>`
});
