# 🥜 Arachiz - Sistema de Gestión de Asistencia Inteligente

Sistema completo de gestión de asistencia para el SENA con reconocimiento facial, QR, NFC, huella dactilar y gamificación.

![Version](https://img.shields.io/badge/version-1.3.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.4-61dafb.svg)

---

## ✨ Características Principales

### 📊 Gestión de Asistencia
- ✅ Registro de asistencia por múltiples métodos (QR, NFC, Huella, Facial)
- ✅ Sistema inteligente de excusas con archivos adjuntos
- ✅ Reportes y estadísticas en tiempo real
- ✅ Exportación a Excel
- ✅ Notificaciones en tiempo real con Socket.io

### 👥 Gestión de Usuarios
- ✅ Roles: Administrador, Instructor, Aprendiz
- ✅ Autenticación con JWT
- ✅ Login con Google OAuth
- ✅ Recuperación de contraseña por email
- ✅ Perfiles personalizables con avatares

### 🎮 Gamificación
- ✅ 7 minijuegos integrados (Snake, Flappy Bird, Breakout, Memory, etc.)
- ✅ Sistema de skins desbloqueables
- ✅ Rankings y puntuaciones
- ✅ Tienda de skins con pagos (MercadoPago/Wompi)

### 🔧 Hardware Integrado
- ✅ Soporte para ESP8266
- ✅ Lectores de huella dactilar
- ✅ Lectores NFC/RFID
- ✅ Cámaras para reconocimiento facial

### 📱 Interfaz Moderna
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Modo oscuro
- ✅ Animaciones fluidas
- ✅ PWA (Progressive Web App)

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18.0.0
- PostgreSQL (o cuenta de Supabase)
- Git

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/arachiz.git
cd arachiz

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### Configuración

1. **Backend**: Copia y configura las variables de entorno
```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales
```

2. **Frontend**: Copia y configura las variables de entorno
```bash
cd frontend
cp .env.example .env
# Edita .env con la URL de tu backend
```

3. **Base de datos**: Ejecuta las migraciones de Prisma
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Ejecutar en Desarrollo

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

Abre tu navegador en `http://localhost:5173`

---

## 📚 Documentación

- **[Guía de Inicio Rápido](docs/QUICK_START.md)** - Instalación y configuración detallada
- **[Configurar Google OAuth](docs/CONFIGURAR_GOOGLE_OAUTH.md)** - Login con Google
- **[Configurar Pagos](docs/CONFIGURAR_MERCADOPAGO.md)** - MercadoPago/Wompi
- **[Despliegue](docs/DEPLOY.md)** - Guía de despliegue a producción
- **[Sistema de Asistencia](docs/SISTEMA_ASISTENCIA_INTELIGENTE.md)** - Cómo funciona
- **[Hardware ESP8266](docs/CONFIGURACION_WIFI_ESP.md)** - Configurar hardware

Ver toda la documentación en [docs/](docs/)

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express** - Servidor API REST
- **Prisma** - ORM para PostgreSQL
- **Socket.io** - Comunicación en tiempo real
- **JWT** - Autenticación
- **Passport** - OAuth con Google
- **Nodemailer** - Envío de emails
- **Multer** - Carga de archivos

### Frontend
- **React 19** - Librería UI
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **React Router** - Navegación
- **Socket.io Client** - WebSockets
- **Face-api.js** - Reconocimiento facial
- **Recharts** - Gráficos

### Base de Datos
- **PostgreSQL** - Base de datos principal
- **Supabase** - Hosting de BD + Storage

### Hardware
- **ESP8266** - Microcontrolador WiFi
- **Arduino** - Sensores de huella y NFC

---

## 📁 Estructura del Proyecto

```
Arachiz-inc/
├── backend/                 # API Node.js
│   ├── config/             # Configuración (Passport, etc.)
│   ├── controllers/        # Controladores de rutas
│   ├── middlewares/        # Middlewares (auth, upload, etc.)
│   ├── models/             # Modelos de base de datos
│   ├── routes/             # Rutas de la API
│   ├── utils/              # Utilidades
│   ├── prisma/             # Schema y migraciones
│   ├── migrations/         # Migraciones SQL
│   └── server.js           # Punto de entrada
│
├── frontend/               # Aplicación React
│   ├── public/             # Archivos estáticos
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── context/        # Context API (Auth, Settings)
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── services/       # Servicios (API, Socket)
│   │   └── styles/         # Estilos globales
│   └── index.html
│
├── ArduinoEsclavo/         # Código para ESP8266
│   └── ArduinoEsclavo.ino
│
└── docs/                   # Documentación
```

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

```env
# Servidor
PORT=3000

# Seguridad
JWT_SECRET=tu_secreto_jwt
SESSION_SECRET=tu_secreto_session

# Base de datos
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email (opcional)
EMAIL_USER=...
EMAIL_PASSWORD=...
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## 🚢 Despliegue

### Render (Recomendado)

1. **Backend**: Conecta tu repositorio y configura las variables de entorno
2. **Frontend**: Build command: `npm run build`, Publish directory: `dist`
3. **Base de datos**: Usa Supabase o PostgreSQL de Render

Ver guía completa en [docs/DEPLOY.md](docs/DEPLOY.md)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autores

- **Equipo Arachiz** - *Desarrollo inicial*

---

## 🙏 Agradecimientos

- SENA por el apoyo al proyecto
- Comunidad de código abierto
- Todos los contribuidores

---

## 📞 Soporte

¿Tienes preguntas o problemas? 

- 📧 Email: soporte@arachiz.com
- 📖 Documentación: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/arachiz/issues)

---

<div align="center">
  <strong>Hecho con ❤️ por el equipo Arachiz</strong>
</div>
