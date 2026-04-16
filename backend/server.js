require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const fichaRoutes = require('./routes/fichaRoutes');
const materiaRoutes = require('./routes/materiaRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const excusaRoutes = require('./routes/excusaRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const exportRoutes = require('./routes/exportRoutes');
const serialRoutes = require('./routes/serialRoutes');
const snakeRoutes  = require('./routes/snakeRoutes');
const gamesRoutes  = require('./routes/gamesRoutes');
const skinRoutes   = require('./routes/skinRoutes');
const SerialService = require('./utils/serialService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/fichas', fichaRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/excusas', excusaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/serial', serialRoutes);
app.use('/api/snake',  snakeRoutes);
app.use('/api/games',  gamesRoutes);
app.use('/api/skins',  skinRoutes);

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
});
