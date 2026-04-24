const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        // Usuario existe, retornar
        return done(null, user);
      }

      // Usuario no existe, crear nuevo
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

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

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
