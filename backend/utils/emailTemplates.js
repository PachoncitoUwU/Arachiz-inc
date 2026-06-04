const fs = require('fs');
const path = require('path');

// Logo Arachiz en base64 (incrustado para que se vea en todos los clientes de correo)
// Busca el PNG en varias rutas posibles (local y producción)
let LOGO_B64 = '';
const logoPaths = [
  path.join(__dirname, '..', '..', 'frontend', 'public', 'ArachizLogoPNG.png'),
  path.join(__dirname, '..', 'public', 'ArachizLogoPNG.png'),
  path.join(__dirname, 'logo_b64_clean.txt'),
];
for (const logoPath of logoPaths) {
  try {
    if (logoPath.endsWith('.txt')) {
      LOGO_B64 = fs.readFileSync(logoPath, 'utf8').trim();
    } else {
      const bytes = fs.readFileSync(logoPath);
      LOGO_B64 = `data:image/png;base64,${bytes.toString('base64')}`;
    }
    if (LOGO_B64) break;
  } catch (e) {
    // Intentar siguiente ruta
  }
}

// ─── Colores oficiales Arachiz ───────────────────────────────────────────────
const COLOR = {
  blue:   '#4285F4',
  green:  '#34A853',
  red:    '#EA4335',
  yellow: '#FBBC05',
  dark:   '#1a1a2e',
  gray:   '#6b7280',
  lightBg:'#f4f7f6',
  white:  '#ffffff',
};

// ─── Header con logo real ────────────────────────────────────────────────────
const buildHeader = (accentColor = COLOR.blue) => `
  <div style="background: linear-gradient(135deg, ${accentColor} 0%, ${COLOR.green} 100%); padding: 36px 24px; text-align: center;">
    ${LOGO_B64
      ? `<img src="${LOGO_B64}" alt="Arachiz" style="height: 56px; object-fit: contain; filter: brightness(0) invert(1);" />`
      : `<span style="color:white;font-size:28px;font-weight:900;letter-spacing:2px;">ARACHIZ</span>`
    }
  </div>
  <div style="height: 4px; background: linear-gradient(90deg, ${COLOR.blue} 0%, ${COLOR.yellow} 33%, ${COLOR.green} 66%, ${COLOR.red} 100%);"></div>
`;

// ─── Template base ───────────────────────────────────────────────────────────
const getBaseTemplate = (title, content, actionButton = null, accentColor = COLOR.blue) => {
  const buttonHtml = actionButton ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${actionButton.url}"
         style="background: linear-gradient(135deg, ${accentColor}, ${COLOR.green});
                color: white; padding: 14px 36px; text-decoration: none;
                border-radius: 12px; display: inline-block; font-weight: 700;
                font-size: 15px; letter-spacing: 0.3px;
                box-shadow: 0 4px 14px rgba(66,133,244,0.35);">
        ${actionButton.text}
      </a>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Arachiz</title>
</head>
<body style="margin:0; padding:0; background-color:${COLOR.lightBg}; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.lightBg}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px; background:${COLOR.white}; border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.07);">

          <!-- HEADER -->
          <tr><td>${buildHeader(accentColor)}</td></tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 36px 32px; color:#1a1a1a; line-height:1.7; font-size:15px;">
              <h2 style="margin:0 0 20px; font-size:22px; font-weight:700; color:${COLOR.dark};">${title}</h2>
              ${content}
              ${buttonHtml}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height:1px; background: linear-gradient(90deg, ${COLOR.blue}22, ${COLOR.green}44, ${COLOR.blue}22);"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 32px; text-align:center; background:#f9fafb;">
              <p style="margin:0 0 6px; color:${COLOR.gray}; font-size:12px;">
                Este es un mensaje automático — por favor no respondas a este correo.
              </p>
              <p style="margin:0; color:#9ca3af; font-size:12px;">
                &copy; ${new Date().getFullYear()} <strong style="color:${COLOR.blue};">Arachiz Inc.</strong> — Sistema de Gestión de Asistencia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ─── Templates específicos ───────────────────────────────────────────────────
const templates = {

  // Recuperación de contraseña
  resetPassword: (name, resetLink) => getBaseTemplate(
    'Recuperación de Contraseña',
    `
    <p style="margin:0 0 16px;">Hola <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en Arachiz.
      Haz clic en el botón de abajo para crear una nueva contraseña.
    </p>
    <div style="background:#fff7ed; border-left:4px solid ${COLOR.yellow}; border-radius:8px; padding:14px 18px; margin:24px 0; font-size:13px; color:#92400e;">
      ⏱ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este mensaje.
    </div>
    <p style="font-size:13px; color:${COLOR.gray}; margin:0;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${resetLink}" style="color:${COLOR.blue}; word-break:break-all;">${resetLink}</a>
    </p>
    `,
    { text: '🔑 Restablecer Contraseña', url: resetLink },
    COLOR.red
  ),

  // Verificación de email (OTP registro)
  verifyEmail: (name, otpCode) => getBaseTemplate(
    'Verifica tu correo electrónico',
    `
    <p style="margin:0 0 16px;">Hola <strong>${name}</strong>,</p>
    <p style="margin:0 0 24px;">
      Gracias por registrarte en <strong>Arachiz</strong>. Ingresa el siguiente código
      para completar la verificación de tu correo:
    </p>

    <!-- OTP BOX -->
    <div style="background: linear-gradient(135deg, #f0f4ff, #e8f5e9);
                border: 2px solid ${COLOR.blue}33;
                border-radius: 16px; padding: 28px 20px;
                text-align: center; margin: 8px 0 28px;">
      <p style="margin:0 0 8px; font-size:12px; color:${COLOR.gray}; text-transform:uppercase; letter-spacing:2px;">Código de verificación</p>
      <div style="font-size: 42px; font-weight: 900; color: ${COLOR.dark};
                  letter-spacing: 14px; font-family: 'Courier New', monospace;">
        ${otpCode}
      </div>
    </div>

    <div style="background:#fef2f2; border-left:4px solid ${COLOR.red}; border-radius:8px; padding:12px 16px; font-size:13px; color:#991b1b; margin-bottom:8px;">
      ⏱ Este código expira en <strong>10 minutos</strong>. No lo compartas con nadie.
    </div>
    `,
    null,
    COLOR.green
  ),

  // Bienvenida (importación masiva de aprendices)
  welcomeImport: (name, document, tempPassword, loginLink) => getBaseTemplate(
    '¡Bienvenido a Arachiz!',
    `
    <p style="margin:0 0 16px;">Hola <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;">
      Tu instructor ha creado una cuenta para ti en la plataforma <strong>Arachiz</strong> —
      el sistema de gestión de asistencia de tu ficha.
    </p>

    <!-- CREDENTIALS BOX -->
    <div style="background: linear-gradient(135deg, #f0f4ff, #e8f5e9);
                border-radius:16px; padding:24px 20px; margin:24px 0;">
      <p style="margin:0 0 4px; font-size:11px; color:${COLOR.gray}; text-transform:uppercase; letter-spacing:1.5px;">Tus credenciales de acceso</p>
      <table style="width:100%; margin-top:12px; border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #e5e7eb; font-size:14px; color:${COLOR.gray}; width:40%;">
            👤 Documento
          </td>
          <td style="padding:8px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:700; color:${COLOR.dark};">
            ${document}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-size:14px; color:${COLOR.gray};">
            🔒 Contraseña temporal
          </td>
          <td style="padding:8px 0;">
            <span style="font-family:'Courier New',monospace; background:#e2e8f0; color:${COLOR.dark}; padding:4px 10px; border-radius:6px; font-size:15px; font-weight:700;">
              ${tempPassword}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#fff7ed; border-left:4px solid ${COLOR.yellow}; border-radius:8px; padding:12px 16px; font-size:13px; color:#92400e; margin-bottom:8px;">
      🔐 Por tu seguridad, <strong>cambia tu contraseña</strong> al iniciar sesión por primera vez.
    </div>
    `,
    { text: '🚀 Iniciar Sesión en Arachiz', url: loginLink },
    COLOR.green
  ),

};

module.exports = templates;
