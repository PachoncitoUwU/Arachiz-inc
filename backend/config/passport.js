const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

// ── Correo de bienvenida Google (fire-and-forget) ────────────────────────────
const sendGoogleWelcome = async (fullName, email) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;
  try {
    const templates = require('../utils/emailTemplates');
    const t = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
    });
    const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    await t.sendMail({
      from: `"Arachiz" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '¡Bienvenido a Arachiz! Tu cuenta está lista 🎉',
      html: templates.welcomeAprendiz(fullName, loginLink)
    });
    console.log(`[Passport] Correo de bienvenida enviado a ${email}`);
  } catch (err) {
    console.error('[Passport] Error enviando correo de bienvenida Google:', err.message);
  }
};

// Solo configurar Google OAuth si las credenciales están disponibles
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar usuario por email de Google
        let user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value }
        });

        if (user) {
          // Si el usuario existe pero no tiene avatar, o si queremos mantener la de Google
          if (!user.avatarUrl && profile.photos?.[0]?.value) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { avatarUrl: profile.photos[0].value }
            });
          }
          return done(null, user);
        }

        // Usuario no existe → crear nuevo y enviar correo de bienvenida
        user = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            fullName: profile.displayName,
            document: `GOOGLE-${profile.id}`, // Documento temporal
            password: '', // Sin contraseña para OAuth
            userType: 'aprendiz', // Por defecto aprendiz
            avatarUrl: profile.photos?.[0]?.value || null
          }
        });

        // Enviar correo de bienvenida al nuevo usuario de Google
        sendGoogleWelcome(user.fullName, user.email);

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
} else {
  console.log('⚠️  Google OAuth no configurado - Las credenciales no están disponibles');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
