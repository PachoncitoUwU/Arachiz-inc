const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const templates = require('../utils/emailTemplates');

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
const otpTokens = new Map();

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

    if (user.document.startsWith('GOOGLE-') || !user.password) {
      return res.status(400).json({ 
        googleAuth: true, 
        error: 'Esta cuenta fue creada con Google. Inicia sesión con el botón "Continuar con Google".' 
      });
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
      from: `"Arachiz" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Arachiz',
      html: templates.resetPassword(user.fullName, resetLink)
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

// Enviar código OTP para verificación de email
exports.sendEmailOTP = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email || !fullName) return res.status(400).json({ error: 'Faltan datos requeridos' });

    // Validar que el email no exista ya
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El email ya está registrado' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutos

    otpTokens.set(email, { otp, expires });
    setTimeout(() => otpTokens.delete(email), 10 * 60 * 1000);

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Arachiz" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verifica tu correo electrónico - Arachiz',
      html: templates.verifyEmail(fullName, otp)
    });

    res.json({ message: 'Código enviado' });
  } catch (error) {
    console.error('Error enviando OTP:', error);
    res.status(500).json({ error: 'Error al enviar código' });
  }
};

// Confirmar código OTP
exports.confirmEmailOTP = async (req, res) => {
  const { email, otp } = req.body;
  const tokenData = otpTokens.get(email);

  if (!tokenData) return res.status(400).json({ error: 'Código expirado o no solicitado' });
  if (tokenData.otp !== otp) return res.status(400).json({ error: 'Código incorrecto' });
  if (Date.now() > tokenData.expires) {
    otpTokens.delete(email);
    return res.status(400).json({ error: 'Código expirado' });
  }

  otpTokens.delete(email); // Limpiar para que no se re-use
  res.json({ valid: true });
};
