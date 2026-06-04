const getBaseTemplate = (title, content, actionButton = null) => {
  const buttonHtml = actionButton ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${actionButton.url}" style="background: #4285F4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(66, 133, 244, 0.2);">
        ${actionButton.text}
      </a>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); padding: 40px 20px; text-align: center; }
    .logo { color: white; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }
    .content { padding: 40px 30px; color: #333; line-height: 1.6; font-size: 16px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: bold; margin-top: 0; margin-bottom: 20px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .footer p { margin: 0 0 10px; color: #6b7280; font-size: 13px; }
    .footer a { color: #4285F4; text-decoration: none; }
    .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 8px; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">🥜 Arachiz</h1>
    </div>
    <div class="content">
      <h2 class="title">${title}</h2>
      ${content}
      ${buttonHtml}
    </div>
    <div class="footer">
      <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
      <p>&copy; ${new Date().getFullYear()} Arachiz Inc. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
};

const templates = {
  resetPassword: (name, resetLink) => {
    return getBaseTemplate(
      'Recuperación de Contraseña',
      `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Arachiz. Haz clic en el botón de abajo para crear una nueva contraseña.</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${resetLink}" style="color: #4285F4; word-break: break-all;">${resetLink}</a></p>
      <p style="color: #ef4444; font-size: 14px;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
      { text: 'Restablecer Contraseña', url: resetLink }
    );
  },

  verifyEmail: (name, otpCode) => {
    return getBaseTemplate(
      'Verifica tu correo electrónico',
      `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Gracias por registrarte en Arachiz. Para completar tu registro, por favor ingresa el siguiente código de verificación de 6 dígitos:</p>
      <div class="otp-box">${otpCode}</div>
      <p style="color: #ef4444; font-size: 14px;">Este código expirará en 10 minutos. No lo compartas con nadie.</p>
      `
    );
  },

  welcomeImport: (name, document, tempPassword, loginLink) => {
    return getBaseTemplate(
      '¡Bienvenido a Arachiz!',
      `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Tu instructor ha creado una cuenta para ti en la plataforma <strong>Arachiz</strong>.</p>
      <p>Aquí tienes tus credenciales de acceso temporal:</p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0 0 10px;"><strong>Usuario / Documento:</strong> ${document}</p>
        <p style="margin: 0;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</span></p>
      </div>
      <p style="color: #ef4444; font-size: 14px;">Por tu seguridad, te recomendamos cambiar tu contraseña una vez que inicies sesión.</p>
      `,
      { text: 'Iniciar Sesión', url: loginLink }
    );
  }
};

module.exports = templates;
