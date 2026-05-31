const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('[EmailService] EMAIL_USER o EMAIL_PASSWORD no configurados en .env. Los correos de asistencia no se enviarán.');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const sendAttendanceEmail = async (toEmail, studentName, className, status, timestamp, method) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const dateFormatted = new Date(timestamp).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeFormatted = new Date(timestamp).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit'
  });

  const isPresent = status.toLowerCase() === 'presente' || status.toLowerCase() === 'tarde';
  const isLate = status.toLowerCase() === 'tarde';
  
  const statusColor = isLate ? '#FBBC05' : isPresent ? '#34A853' : '#EA4335';
  const statusText = isLate ? 'LLEGADA TARDE' : isPresent ? 'PRESENTE' : 'AUSENTE';
  const statusIcon = isLate ? '⚠️' : isPresent ? '✅' : '❌';

  const mailOptions = {
    from: `"Arachiz Asistencia" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Reporte de Asistencia: ${statusText} - ${className}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        </style>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);">
          
          <!-- Encabezado con degradado Azul Premium Arachiz -->
          <div style="background: linear-gradient(135deg, #4285F4 0%, #1e3a8a 100%); padding: 40px 20px; text-align: center; border-bottom: 5px solid ${statusColor}; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.15); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
              <span style="font-size: 45px; display: block; line-height: 1;">🥜</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">ARACHIZ</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Sistema Inteligente de Asistencia</p>
          </div>
          
          <!-- Cuerpo del Correo -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 20px; text-align: center;">Hola, ${studentName} 👋</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center; margin-bottom: 35px;">
              Este es tu reporte de asistencia automático para la clase de <strong style="color: #1f2937;">${className}</strong>.
            </p>
            
            <!-- Tarjeta de Estado de Asistencia -->
            <div style="background-color: #f8fafc; border-radius: 16px; padding: 30px; border: 1px solid #f1f5f9; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); margin-bottom: 35px; position: relative;">
              <div style="text-align: center; margin-bottom: 25px;">
                <span style="font-size: 54px; display: block; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">${statusIcon}</span>
                <span style="background-color: ${statusColor}; color: white; padding: 10px 24px; border-radius: 9999px; font-weight: 800; font-size: 14px; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  ${statusText}
                </span>
              </div>
              
              <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f3f4f6;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0 12px; font-size: 15px;">
                  <tr>
                    <td style="color: #6b7280; font-weight: 600; text-align: left; padding: 0;">Materia / Ficha:</td>
                    <td style="text-align: right; color: #111827; font-weight: 800; padding: 0;">${className}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-weight: 600; text-align: left; padding: 0;">Fecha:</td>
                    <td style="text-align: right; color: #111827; font-weight: 800; padding: 0;">${dateFormatted}</td>
                  </tr>
                  ${isPresent ? `
                  <tr>
                    <td style="color: #6b7280; font-weight: 600; text-align: left; padding: 0;">Hora de Registro:</td>
                    <td style="text-align: right; color: #111827; font-weight: 800; padding: 0;">${timeFormatted}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-weight: 600; text-align: left; padding: 0;">Método usado:</td>
                    <td style="text-align: right; color: #111827; font-weight: 800; text-transform: uppercase; padding: 0;">
                      <span style="background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; font-size: 12px; letter-spacing: 0.5px;">${method}</span>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/aprendiz/asistencia" style="background-color: #4285F4; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 800; font-size: 15px; box-shadow: 0 4px 14px 0 rgba(66, 133, 244, 0.39); transition: transform 0.2s, box-shadow 0.2s;">
                👉 Acceder a mi Panel
              </a>
            </div>
          </div>
          
          <!-- Pie de página -->
          <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; font-weight: 600;">
              Desarrollado con ❤️ para la educación
            </p>
            <p style="margin: 0; font-size: 11px; color: #cbd5e1; line-height: 1.6;">
              Este es un correo automático generado por Arachiz.<br>Por favor, no respondas a este mensaje.<br>
              © ${new Date().getFullYear()} Arachiz Inc.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Notificación de asistencia enviada a ${toEmail}`);
  } catch (error) {
    console.error('[EmailService] Error enviando correo de asistencia:', error.message);
  }
};

module.exports = { sendAttendanceEmail };
