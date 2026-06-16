require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('./config/passport');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const fichaRoutes = require('./routes/fichaRoutes');
const competenciaRoutes = require('./routes/competenciaRoutes');
const resultadoRoutes = require('./routes/resultadoRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const excusaRoutes = require('./routes/excusaRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const exportRoutes = require('./routes/exportRoutes');
const importRoutes = require('./routes/importRoutes');
const serialRoutes = require('./routes/serialRoutes');
const snakeRoutes  = require('./routes/snakeRoutes');
const gamesRoutes  = require('./routes/gamesRoutes');
const skinRoutes   = require('./routes/skinRoutes');
const resultadoEvitadoRoutes = require('./routes/resultadoEvitadoRoutes');
const qrRoutes     = require('./routes/qrRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');
const respuestaRapidaRoutes = require('./routes/respuestaRapidaRoutes');
const adminRoutes = require('./routes/admin');
const superUserRoutes = require('./routes/superUserRoutes');
const profileRoutes = require('./routes/profileRoutes');
const pushRoutes = require('./routes/pushRoutes');
const statsRoutes = require('./routes/statsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const SerialService = require('./utils/serialService');
const { checkAndCloseExpiredSessions } = require('./controllers/asistenciaController');

const app = express();
const server = http.createServer(app);

// ── CORS: solo el dominio oficial ────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'https://arachiz.vercel.app'];

if (!allowedOrigins.includes('https://arachiz.vercel.app')) {
  allowedOrigins.push('https://arachiz.vercel.app');
}
if (!allowedOrigins.includes('http://localhost:5173')) {
  allowedOrigins.push('http://localhost:5173');
}

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});

const PORT = process.env.PORT || 3000;

// ── Compresión gzip/Brotli ────────────────────────────────────────────────────
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Rate limiting en auth ─────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // máx 20 intentos por IP en ese ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' }
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar sesiones para Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'arachiz-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Rutas de autenticación con Google
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generar JWT token
    const token = jwt.sign(
      { id: req.user.id, userType: req.user.userType, email: req.user.email, fullName: req.user.fullName, document: req.user.document },
      process.env.JWT_SECRET || 'supersecretarachiz',
      { expiresIn: '8h' }
    );
    
    // Redirigir al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

app.use('/api/auth', authRoutes);
app.use('/api/fichas', fichaRoutes);
app.use('/api/competencias', competenciaRoutes);
app.use('/api/resultados', resultadoRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/excusas', excusaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/serial', serialRoutes);
app.use('/api/snake',  snakeRoutes);
app.use('/api/games',  gamesRoutes);
app.use('/api/skins',  skinRoutes);
app.use('/api/resultados-evitados', resultadoEvitadoRoutes);
app.use('/api/qr',     qrRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/respuestas-rapidas', respuestaRapidaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-usuario', superUserRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

const serialService = new SerialService(io);
app.set('serialService', serialService);
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('joinSession', (sessionId) => {
    socket.join(`session_${sessionId}`);
  });
  socket.on('leaveSession', (sessionId) => {
    socket.leave(`session_${sessionId}`);
  });
  
  // Chat
  socket.on('joinChat', (fichaId) => {
    socket.join(`chat_${fichaId}`);
  });
  socket.on('leaveChat', (fichaId) => {
    socket.leave(`chat_${fichaId}`);
  });
  socket.on('sendMessage', async (data) => {
    // data: { fichaId, senderId, texto }
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const newMsg = await prisma.mensajeChat.create({
        data: {
          fichaId: data.fichaId,
          senderId: data.senderId,
          texto: data.texto
        },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true, userType: true } }
        }
      });
      io.to(`chat_${data.fichaId}`).emit('newMessage', newMsg);
    } catch (e) {
      console.error('Error saving chat message', e);
    }
  });

  socket.on('disconnect', () => {});
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

server.listen(PORT, () => {
  console.log(`Arachiz backend corriendo en http://localhost:${PORT}`);

  // ── Cierre automático de sesiones expiradas (cada 60s) ──────────────────
  setInterval(() => {
    checkAndCloseExpiredSessions(io, serialService).catch(err =>
      console.error('[AutoClose] Error inesperado:', err.message)
    );
  }, 60 * 1000);
  console.log('[AutoClose] Monitor de sesiones expiradas activo (cada 60s)');
});
