const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Configurar transporter de nodemailer
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Almacén temporal de tokens (en producción usar Redis)
const resetTokens = new Map();

// Solicitar recuperación de contraseña
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' });
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hora

    // Guardar token
    resetTokens.set(token, {
      userId: user.id,
      email: user.email,
      expires
    });

    // Limpiar token después de 1 hora
    setTimeout(() => {
      resetTokens.delete(token);
    }, 3600000);

    // Crear enlace de recuperación
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Enviar email
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de Contraseña - Arachiz',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #34A853 0%, #0F9D58 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🥜 Arachiz</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Recuperación de Contraseña</h2>
            <p style="color: #666; line-height: 1.6;">
              Hola <strong>${user.fullName}</strong>,
            </p>
            <p style="color: #666; line-height: 1.6;">
              Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #34A853; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este email.
            </p>
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetLink}" style="color: #4285F4;">${resetLink}</a>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' });
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// Verificar token de recuperación
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Token expirado' });
    }

    res.json({ valid: true, email: tokenData.email });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ error: 'Error al verificar token' });
  }
};

// Restablecer contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Token expirado' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: tokenData.userId },
      data: { password: hashedPassword }
    });

    // Eliminar token usado
    resetTokens.delete(token);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};
