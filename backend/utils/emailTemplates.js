// ─────────────────────────────────────────────────────────────────────────────
//  Arachiz — Email Templates
//  Colores Arachiz: Azul #4285F4 · Verde #34A853 · Amarillo #FBBC05 · Rojo #EA4335
//  Logo: Postimages CDN
// ─────────────────────────────────────────────────────────────────────────────

const LOGO_URL =
  'https://i.postimg.cc/gkCtrcKc/Arachiz-Logo-PNG.png';

// Ícono cuadrado de la PWA (la "A" de Arachiz que aparece en celulares)
const APP_ICON_URL =
  'https://i.postimg.cc/gkCtrcKc/Arachiz-Logo-PNG.png';

// Cuatro colores de la barra de marca Arachiz
const BRAND_BAR = `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td width="25%" height="4" style="background:#4285F4; line-height:4px; font-size:4px;">&nbsp;</td>
      <td width="25%" height="4" style="background:#34A853; line-height:4px; font-size:4px;">&nbsp;</td>
      <td width="25%" height="4" style="background:#FBBC05; line-height:4px; font-size:4px;">&nbsp;</td>
      <td width="25%" height="4" style="background:#EA4335; line-height:4px; font-size:4px;">&nbsp;</td>
    </tr>
  </table>`;

// ─── Plantilla base ───────────────────────────────────────────────────────────
const base = (content, accentHex = '#4285F4') => `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>Arachiz</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
    body{margin:0;padding:0;background:#F5F5F5;}
    @media only screen and (max-width:600px){
      .wrapper{width:100%!important;min-width:100%!important;}
      .inner{padding:28px 20px!important;}
      .btn-table{width:100%!important;}
      .btn-td{width:100%!important;text-align:center!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
       style="background:#F5F5F5;padding:40px 16px;">
  <tr><td align="center">

    <!-- Card -->
    <table class="wrapper" width="560" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#ffffff;border-radius:16px;overflow:hidden;
                  box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;width:100%;">

      <!-- ── TOP BRAND BAR ── -->
      <tr><td>${BRAND_BAR}</td></tr>

      <!-- ── HEADER ── -->
      <tr>
        <td align="center" style="padding:36px 32px 24px;background:#ffffff;">
          <img src="${LOGO_URL}"
               alt="Arachiz"
               width="140"
               style="height:auto;display:block;margin:0 auto;"/>
        </td>
      </tr>

      <!-- ── ACCENT LINE ── -->
      <tr>
        <td style="padding:0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td height="2" style="background:${accentHex};border-radius:2px;
                                    line-height:2px;font-size:2px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── CONTENT ── -->
      <tr>
        <td class="inner" style="padding:32px 40px 36px;color:#1a1a1a;
                                  font-size:15px;line-height:1.7;">
          ${content}
        </td>
      </tr>

      <!-- ── BOTTOM BRAND BAR ── -->
      <tr><td>${BRAND_BAR}</td></tr>

      <!-- ── FOOTER ── -->
      <tr>
        <td align="center" style="padding:20px 32px 28px;background:#F9FAFB;
                                   border-top:1px solid #E5E7EB;">
          <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;line-height:1.5;">
            Este es un mensaje automático — por favor no respondas a este correo.
          </p>
          <p style="margin:0;font-size:12px;color:#9CA3AF;">
            &copy; ${new Date().getFullYear()}&nbsp;
            <span style="color:#3b82f6;font-weight:600;">Arachiz Inc.</span>
            &nbsp;— Sistema de Gestión de Asistencia
          </p>
        </td>
      </tr>

    </table>
    <!-- /Card -->

  </td></tr>
</table>

</body>
</html>`;

// ─── Botón CTA ────────────────────────────────────────────────────────────────
const ctaButton = (text, url, color = '#3b82f6') => `
  <table class="btn-table" cellpadding="0" cellspacing="0" role="presentation"
         style="margin:32px auto 4px;">
    <tr>
      <td class="btn-td" align="center"
          style="background:${color};border-radius:10px;">
        <a href="${url}"
           style="display:inline-block;padding:14px 36px;color:#ffffff;
                  font-size:15px;font-weight:700;text-decoration:none;
                  letter-spacing:0.2px;white-space:nowrap;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;

// ─── Caja de datos (credenciales, etc.) ───────────────────────────────────────
const infoBox = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;
                margin:24px 0;overflow:hidden;">
    ${rows.map(([label, value]) => `
    <tr>
      <td style="padding:12px 20px;border-bottom:1px solid #E5E7EB;
                 font-size:13px;color:#6B7280;width:40%;vertical-align:middle;">
        ${label}
      </td>
      <td style="padding:12px 20px;border-bottom:1px solid #E5E7EB;
                 font-size:14px;font-weight:700;color:#111827;vertical-align:middle;">
        ${value}
      </td>
    </tr>`).join('')}
  </table>`;

// ─── Alerta inline ────────────────────────────────────────────────────────────
const alert = (text, color = '#eab308', bgColor = '#FFFBEB', textColor = '#92400E') => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="margin:20px 0;">
    <tr>
      <td style="border-left:4px solid ${color};background:${bgColor};
                 border-radius:0 10px 10px 0;padding:12px 16px;
                 font-size:13px;color:${textColor};line-height:1.5;">
        ${text}
      </td>
    </tr>
  </table>`;

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const templates = {

  // ── Verificación de email (OTP) ──────────────────────────────────────────
  verifyEmail: (name, otpCode) => base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
      Verifica tu correo
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;">
      Hola <strong style="color:#111827;">${name}</strong>, gracias por registrarte
      en <strong style="color:#4285F4;">Arachiz</strong>. Ingresa este código para
      completar tu registro:
    </p>

    <!-- OTP BOX -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center"
            style="background:#F8FAFC;border:2px dashed #CBD5E1;border-radius:14px;
                   padding:28px 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;
                    text-transform:uppercase;color:#9CA3AF;">
            Código de verificación
          </p>
          <p style="margin:0;font-size:46px;font-weight:900;letter-spacing:14px;
                    color:#111827;font-family:'Courier New',Courier,monospace;
                    line-height:1.1;">
            ${otpCode}
          </p>
        </td>
      </tr>
    </table>

    ${alert('⏱ Este código expira en <strong>10 minutos</strong>. No lo compartas con nadie.',
            '#ef4444', '#FEF2F2', '#991B1B')}
  `, '#22c55e'),

  // ── Recuperación de contraseña ───────────────────────────────────────────
  resetPassword: (name, resetLink) => base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
      Recupera tu contraseña
    </h2>
    <p style="margin:0 0 16px;color:#4B5563;">
      Hola <strong style="color:#111827;">${name}</strong>, recibimos una solicitud
      para restablecer la contraseña de tu cuenta en
      <strong style="color:#3b82f6;">Arachiz</strong>.
    </p>
    <p style="margin:0 0 8px;color:#4B5563;">
      Haz clic en el botón para crear una nueva contraseña:
    </p>

    ${ctaButton('🔑 Restablecer Contraseña', resetLink, '#ef4444')}

    ${alert('⏱ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este mensaje.',
            '#eab308', '#FFFBEB', '#92400E')}

    <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
      <a href="${resetLink}"
         style="color:#3b82f6;word-break:break-all;">${resetLink}</a>
    </p>
  `, '#ef4444'),

  // ── Bienvenida (importación masiva) ─────────────────────────────────────
  welcomeImport: (name, document, tempPassword, loginLink) => base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
      ¡Bienvenido a Arachiz! 🎉
    </h2>
    <p style="margin:0 0 20px;color:#4B5563;">
      Hola <strong style="color:#111827;">${name}</strong>, tu instructor ha creado
      una cuenta para ti en <strong style="color:#3b82f6;">Arachiz</strong>, el
      sistema de gestión de asistencia de tu ficha.
    </p>
    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6B7280;
              text-transform:uppercase;letter-spacing:1px;">
      Tus credenciales de acceso
    </p>

    ${infoBox([
      ['👤 Documento', document],
      ['🔒 Contraseña temporal',
       `<span style="font-family:'Courier New',Courier,monospace;
                     background:#E2E8F0;color:#111827;padding:3px 10px;
                     border-radius:6px;">${tempPassword}</span>`]
    ])}

    ${alert('🔐 Por tu seguridad, <strong>cambia tu contraseña</strong> al iniciar sesión por primera vez.',
            '#eab308', '#FFFBEB', '#92400E')}

    ${ctaButton('🚀 Iniciar Sesión en Arachiz', loginLink, '#22c55e')}
  `, '#22c55e'),

  // ── Bienvenida al registrarse (aprendiz) ─────────────────────────────────
  welcomeAprendiz: (name, loginLink) => base(`
    <!-- Hero visual -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:28px;">
      <tr>
        <td align="center"
            style="background:linear-gradient(135deg,#3b82f6 0%,#1e3a8a 100%);
                   border-radius:14px;padding:32px 20px;">
          <img src="${APP_ICON_URL}" alt="Arachiz" width="72"
               style="display:block;margin:0 auto 14px;border-radius:14px;
                      box-shadow:0 8px 24px rgba(0,0,0,0.25);"/>
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:3px;
                    text-transform:uppercase;color:#bfdbfe;">
            Sistema de Gestión Académica
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#111827;text-align:center;">
      ¡Tu cuenta está lista! 🎉
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;text-align:center;font-size:16px;line-height:1.7;">
      Hola <strong style="color:#111827;">${name}</strong>, ya formas parte de
      <strong style="color:#3b82f6;">Arachiz</strong>. Desde aquí podrás consultar
      tu asistencia, gestionar excusas y mucho más.
    </p>

    <!-- Qué puedo hacer -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:14px;
                  margin:0 0 28px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #E5E7EB;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;
                    text-transform:uppercase;color:#9CA3AF;">
            ¿Qué puedes hacer en Arachiz?
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-bottom:1px solid #E5E7EB;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">📋</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Consultar tu asistencia</strong> en tiempo real
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-bottom:1px solid #E5E7EB;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">📝</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Enviar excusas</strong> digitales con soporte fotográfico
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-bottom:1px solid #E5E7EB;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">🎮</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Juegos y gamificación</strong> integrados en tu plataforma
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">🤖</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Asistente IA</strong> para resolver tus dudas académicas
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('🚀 Ingresar a Arachiz', loginLink, '#3b82f6')}

    <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
      Si tienes problemas para ingresar, contacta a tu instructor.
    </p>
  `, '#3b82f6'),

  // ── Excusa aprobada / rechazada → al aprendiz ───────────────────────────
  excusaResuelta: (name, estado, materia, fechas, motivo, respuesta) => {
    const aprobada = estado === 'Aprobada';
    const accent = aprobada ? '#22c55e' : '#ef4444';
    const bgAlert = aprobada ? '#F0FDF4' : '#FEF2F2';
    const textAlert = aprobada ? '#14532D' : '#991B1B';
    const icon = aprobada ? '✅' : '❌';
    const label = aprobada ? 'APROBADA' : 'RECHAZADA';
    return base(`
    <!-- Estado badge -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:28px;">
      <tr>
        <td align="center"
            style="background:${accent};border-radius:14px;padding:28px 20px;">
          <img src="${APP_ICON_URL}" alt="Arachiz" width="60"
               style="display:block;margin:0 auto 12px;border-radius:12px;
                      box-shadow:0 6px 20px rgba(0,0,0,0.25);"/>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);
                       color:#fff;font-size:13px;font-weight:800;letter-spacing:2px;
                       text-transform:uppercase;padding:6px 18px;border-radius:9999px;">
            ${icon} EXCUSA ${label}
          </span>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#111827;text-align:center;">
      Tu excusa fue ${label.toLowerCase()}
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;text-align:center;font-size:15px;line-height:1.7;">
      Hola <strong style="color:#111827;">${name}</strong>, tu instructor revisó
      la excusa que enviaste para <strong style="color:#111827;">${materia}</strong>.
    </p>

    ${infoBox([
      ['📅 Fecha(s)', fechas],
      ['📋 Motivo enviado', motivo],
      ['📌 Estado', `<span style="background:${accent};color:#fff;padding:3px 12px;
                       border-radius:9999px;font-size:12px;font-weight:800;">
                       ${icon} ${label}</span>`]
    ])}

    ${respuesta ? alert(
        `💬 <strong>Respuesta del instructor:</strong> ${respuesta}`,
        accent, bgAlert, textAlert
      ) : ''}

    <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
      Puedes ver el historial completo de tus excusas en tu panel.
    </p>
  `, accent);
  },

  // ── Alerta de ausencias acumuladas ──────────────────────────────────────
  alertaAusencias: (name, materia, porcentaje, ausencias, totalSesiones, loginLink, esInstructor = false) => {
    const critico = porcentaje >= 30;
    const accent = critico ? '#ef4444' : '#eab308';
    const bgAlert = critico ? '#FEF2F2' : '#FFFBEB';
    const textAlert = critico ? '#991B1B' : '#92400E';
    const nivel = critico ? '🚨 NIVEL CRÍTICO' : '⚠️ NIVEL DE ALERTA';
    return base(`
    <!-- Hero alerta -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:28px;">
      <tr>
        <td align="center"
            style="background:linear-gradient(135deg,${accent} 0%,${critico ? '#7F1D1D' : '#78350F'} 100%);
                   border-radius:14px;padding:28px 20px;">
          <img src="${APP_ICON_URL}" alt="Arachiz" width="60"
               style="display:block;margin:0 auto 12px;border-radius:12px;
                      box-shadow:0 6px 20px rgba(0,0,0,0.25);"/>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);
                       color:#fff;font-size:12px;font-weight:800;letter-spacing:2px;
                       text-transform:uppercase;padding:6px 18px;border-radius:9999px;">
            ${nivel}
          </span>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#111827;text-align:center;">
      ${esInstructor ? 'Aprendiz con alto ausentismo' : 'Tus inasistencias están aumentando'}
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;text-align:center;font-size:15px;line-height:1.7;">
      ${esInstructor
        ? `<strong style="color:#111827;">${name}</strong> ha acumulado un <strong>${porcentaje}%</strong>
           de inasistencias en <strong>${materia}</strong>.`
        : `Hola <strong style="color:#111827;">${name}</strong>, tienes un <strong>${porcentaje}%</strong>
           de inasistencias en <strong>${materia}</strong>.`
      }
    </p>

    ${infoBox([
      ['📚 Materia / Resultado', materia],
      ['❌ Ausencias', `${ausencias} de ${totalSesiones} sesiones`],
      ['📊 Porcentaje de inasistencia', `<span style="font-size:18px;font-weight:900;color:${accent};">${porcentaje}%</span>`]
    ])}

    <!-- Barra de progreso visual -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:0 0 24px;">
      <tr>
        <td style="padding:0 0 8px;font-size:12px;font-weight:700;color:#6B7280;
                   text-transform:uppercase;letter-spacing:1px;">
          Nivel de inasistencia
        </td>
      </tr>
      <tr>
        <td style="background:#E5E7EB;border-radius:9999px;height:12px;overflow:hidden;">
          <div style="width:${Math.min(porcentaje, 100)}%;height:12px;background:${accent};
                      border-radius:9999px;"></div>
        </td>
      </tr>
    </table>

    ${alert(
      critico
        ? '🚨 <strong>Riesgo de reprobación:</strong> superar el 30% de inasistencias puede afectar tu habilitación para las competencias. Comunícate con tu instructor.'
        : '⚠️ <strong>Atención:</strong> si continúa esta tendencia podrías entrar en riesgo académico.',
      accent, bgAlert, textAlert
    )}

    ${ctaButton(esInstructor ? '📊 Ver Asistencia' : '📋 Ver mi Asistencia', loginLink, accent)}
  `, accent);
  },

  // ── Nueva excusa pendiente → al instructor ───────────────────────────────
  nuevaExcusaPendiente: (instructorName, aprendizName, materia, fechas, motivo, panelLink) => base(`
    <!-- Hero -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:28px;">
      <tr>
        <td align="center"
            style="background:linear-gradient(135deg,#3b82f6 0%,#1e3a8a 100%);
                   border-radius:14px;padding:28px 20px;">
          <img src="${APP_ICON_URL}" alt="Arachiz" width="60"
               style="display:block;margin:0 auto 12px;border-radius:12px;
                      box-shadow:0 6px 20px rgba(0,0,0,0.25);"/>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);
                       color:#fff;font-size:12px;font-weight:800;letter-spacing:2px;
                       text-transform:uppercase;padding:6px 18px;border-radius:9999px;">
            📝 NUEVA EXCUSA PENDIENTE
          </span>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#111827;text-align:center;">
      Tienes una excusa por revisar
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;text-align:center;font-size:15px;line-height:1.7;">
      Hola <strong style="color:#111827;">${instructorName}</strong>, un aprendiz
      ha enviado una excusa que requiere tu revisión.
    </p>

    ${infoBox([
      ['👤 Aprendiz', aprendizName],
      ['📚 Materia / Resultado', materia],
      ['📅 Fecha(s) solicitada(s)', fechas],
      ['📋 Motivo', motivo]
    ])}

    ${alert('⏳ Las excusas pendientes quedan visibles en tu panel hasta que las apruebes o rechaces.',
            '#3b82f6', '#EFF6FF', '#1E40AF')}

    ${ctaButton('📋 Revisar Excusa', panelLink, '#3b82f6')}
  `, '#3b82f6'),

  // ── Reporte exportado listo → al instructor ──────────────────────────────
  reporteListo: (instructorName, tipoReporte, fichaNumero, downloadLink) => base(`
    <!-- Hero -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:28px;">
      <tr>
        <td align="center"
            style="background:linear-gradient(135deg,#eab308 0%,#78350F 100%);
                   border-radius:14px;padding:28px 20px;">
          <img src="${APP_ICON_URL}" alt="Arachiz" width="60"
               style="display:block;margin:0 auto 12px;border-radius:12px;
                      box-shadow:0 6px 20px rgba(0,0,0,0.25);"/>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);
                       color:#fff;font-size:12px;font-weight:800;letter-spacing:2px;
                       text-transform:uppercase;padding:6px 18px;border-radius:9999px;">
            📊 REPORTE LISTO
          </span>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#111827;text-align:center;">
      Tu reporte está listo para descargar
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;text-align:center;font-size:15px;line-height:1.7;">
      Hola <strong style="color:#111827;">${instructorName}</strong>, el reporte
      que solicitaste ha sido generado exitosamente.
    </p>

    ${infoBox([
      ['📁 Tipo de reporte', tipoReporte],
      ['🗂️ Ficha', `N° ${fichaNumero}`],
      ['📅 Generado el', new Date().toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })]
    ])}

    ${alert('🔗 El enlace de descarga es válido por <strong>24 horas</strong>. Descárgalo antes de que expire.',
            '#eab308', '#FFFBEB', '#92400E')}

    ${ctaButton('⬇️ Descargar Reporte', downloadLink, '#eab308')}

    <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
      Si el botón no funciona, copia y pega este enlace:<br/>
      <a href="${downloadLink}" style="color:#3b82f6;word-break:break-all;">${downloadLink}</a>
    </p>
  `, '#eab308'),

  // ── Cambio de contraseña exitoso ─────────────────────────────────────────
  passwordCambiado: (name) => base(`
    <!-- Hero -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:28px;">
      <tr>
        <td align="center"
            style="background:linear-gradient(135deg,#22c55e 0%,#14532D 100%);
                   border-radius:14px;padding:28px 20px;">
          <img src="${APP_ICON_URL}" alt="Arachiz" width="60"
               style="display:block;margin:0 auto 12px;border-radius:12px;
                      box-shadow:0 6px 20px rgba(0,0,0,0.25);"/>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);
                       color:#fff;font-size:12px;font-weight:800;letter-spacing:2px;
                       text-transform:uppercase;padding:6px 18px;border-radius:9999px;">
            🔐 CONTRASEÑA ACTUALIZADA
          </span>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#111827;text-align:center;">
      Tu contraseña fue cambiada
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;text-align:center;font-size:15px;line-height:1.7;">
      Hola <strong style="color:#111827;">${name}</strong>, te confirmamos que
      la contraseña de tu cuenta en <strong style="color:#22c55e;">Arachiz</strong>
      fue actualizada exitosamente.
    </p>

    ${infoBox([
      ['📅 Fecha del cambio', new Date().toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric'
      })],
      ['⏰ Hora', new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit'
      })]
    ])}

    ${alert(
      '🚨 <strong>¿No fuiste tú?</strong> Si no realizaste este cambio, contacta de inmediato a tu instructor o administrador del sistema para proteger tu cuenta.',
      '#ef4444', '#FEF2F2', '#991B1B'
    )}

    <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
      Si tú realizaste este cambio, puedes ignorar este mensaje. Tu cuenta está segura.
    </p>
  `, '#22c55e'),

  // ── Bienvenida al registrarse (instructor) ───────────────────────────────
  welcomeInstructor: (name, loginLink) => base(`
    <!-- Hero visual -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:28px;">
      <tr>
        <td align="center"
            style="background:linear-gradient(135deg,#22c55e 0%,#14532D 100%);
                   border-radius:14px;padding:32px 20px;">
          <img src="${APP_ICON_URL}" alt="Arachiz" width="72"
               style="display:block;margin:0 auto 14px;border-radius:14px;
                      box-shadow:0 8px 24px rgba(0,0,0,0.25);"/>
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:3px;
                    text-transform:uppercase;color:#bbf7d0;">
            Panel de Gestión Docente
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#111827;text-align:center;">
      ¡Bienvenido, Instructor! 👨‍🏫
    </h2>
    <p style="margin:0 0 24px;color:#4B5563;text-align:center;font-size:16px;line-height:1.7;">
      Hola <strong style="color:#111827;">${name}</strong>, tu cuenta de instructor
      en <strong style="color:#22c55e;">Arachiz</strong> ha sido creada exitosamente.
      Ahora tienes acceso completo al panel de gestión de tu ficha.
    </p>

    <!-- Funcionalidades del instructor -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:14px;
                  margin:0 0 28px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #E5E7EB;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;
                    text-transform:uppercase;color:#9CA3AF;">
            Tu panel como instructor incluye
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-bottom:1px solid #E5E7EB;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">📊</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Control de asistencia</strong> con biometría, QR y NFC
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-bottom:1px solid #E5E7EB;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">👥</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Gestión de aprendices</strong> y fichas formativas
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-bottom:1px solid #E5E7EB;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">📈</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Reportes y estadísticas</strong> exportables
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-right:12px;font-size:20px;vertical-align:middle;">⏰</td>
              <td style="font-size:14px;color:#374151;vertical-align:middle;">
                <strong style="color:#111827;">Gestión de horarios</strong> y competencias por materia
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('🎓 Ir a mi Panel', loginLink, '#22c55e')}

    <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
      Si necesitas soporte técnico, contacta al administrador del sistema.
    </p>
  `, '#22c55e'),

};

module.exports = templates;
