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

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middlewares Routes
app.use('/api/auth', authRoutes);
app.use('/api/fichas', fichaRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/excusas', excusaRoutes);

// Config Socket.io accessible in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket conectado:', socket.id);
  
  socket.on('joinSession', (sessionId) => {
    socket.join(`session_${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket desconectado:', socket.id);
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

server.listen(PORT, () => {
  console.log(`Backend de Arachiz ejecutándose en http://localhost:${PORT}`);
});
