# MANUAL TÉCNICO — ARACHIZ
## Sistema de Gestión de Asistencia | Ficha 3146013

**Versión:** 1.3.1  
**Stack:** Node.js + Express + React 19 + PostgreSQL (Supabase)  
**URL Producción:** https://arachiz.vercel.app

---

## 1. ARQUITECTURA DEL SISTEMA

### 1.1 Descripción General
Arachiz es una aplicación web full-stack con arquitectura cliente-servidor:

- **Frontend (SPA):** React 19 + Vite, desplegado en Vercel
- **Backend (API REST):** Node.js + Express, desplegado en Render
- **Base de datos:** PostgreSQL gestionada con Prisma ORM, alojada en Supabase
- **Almacenamiento:** Supabase Storage (archivos adjuntos, avatares)
- **WebSockets:** Socket.io para asistencia en tiempo real
- **Hardware IoT:** ESP8266 + Arduino (sensor AS608 + lector RC522)

### 1.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React | 19.2.4 |
| Build Tool | Vite | 6.x |
| CSS Framework | TailwindCSS | 3.x |
| Router | React Router DOM | 6.x |
| WebSockets Client | Socket.io-client | 4.x |
| Reconocimiento Facial | face-api.js | 0.22.x |
| Gráficos | Recharts | 2.x |
| Backend | Node.js | ≥18 |
| Framework API | Express | 4.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 15 |
| WebSockets Server | Socket.io | 4.x |
| Auth Tokens | jsonwebtoken | 9.x |
| Hash contraseñas | bcryptjs | 2.x |
| OAuth | Passport.js + Google | - |
| Email | Nodemailer | 6.x |
| Archivos | Multer + Supabase SDK | - |
| Export Excel | ExcelJS | 4.x |
| Microcontrolador | ESP8266 (NodeMCU) | - |
| Sensor Huella | AS608 | - |
| Lector NFC | RC522 MIFARE | - |

---

## 2. ESTRUCTURA DE ARCHIVOS

```
Arachiz-inc/
├── backend/
│   ├── config/
│   │   ├── passport.js          ← Configuración Google OAuth
│   │   └── supabase.js          ← Cliente Supabase
│   ├── controllers/
│   │   ├── authController.js    ← Registro, login, perfil
│   │   ├── faceController.js    ← Descriptores faciales
│   │   ├── fichaController.js   ← CRUD fichas
│   │   ├── materiaController.js ← CRUD materias
│   │   ├── horarioController.js ← CRUD horarios
│   │   ├── asistenciaController.js ← Sesiones de asistencia
│   │   ├── excusaController.js  ← Sistema de excusas
│   │   ├── exportController.js  ← Exportación Excel/CSV
│   │   ├── adminController.js   ← Funciones de administrador
│   │   └── gamesController.js   ← Puntuaciones y skins
│   ├── middlewares/
│   │   ├── authMiddleware.js    ← Validación JWT
│   │   └── uploadMiddleware.js  ← Multer (archivos)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── fichaRoutes.js
│   │   ├── materiaRoutes.js
│   │   ├── horarioRoutes.js
│   │   ├── asistenciaRoutes.js
│   │   ├── excusaRoutes.js
│   │   ├── exportRoutes.js
│   │   ├── admin.js
│   │   ├── gamesRoutes.js
│   │   ├── skinRoutes.js
│   │   ├── qrRoutes.js
│   │   ├── hardwareRoutes.js
│   │   └── serialRoutes.js
│   ├── prisma/
│   │   └── schema.prisma        ← Modelos de base de datos
│   ├── utils/
│   │   └── socket.js            ← Configuración Socket.io
│   └── server.js                ← Punto de entrada del servidor
│
├── frontend/
│   ├── public/
│   │   └── models/              ← Modelos face-api.js
│   ├── src/
│   │   ├── components/          ← Componentes reutilizables
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  ← Estado global de autenticación
│   │   │   └── SettingsContext.jsx ← Tema, idioma
│   │   ├── pages/
│   │   │   ├── auth/            ← Login, Register
│   │   │   ├── aprendiz/        ← Vistas del aprendiz
│   │   │   ├── instructor/      ← Vistas del instructor
│   │   │   └── admin/           ← Vistas del administrador
│   │   ├── services/
│   │   │   ├── api.js           ← Axios + interceptors JWT
│   │   │   └── socket.js        ← Socket.io client
│   │   └── App.jsx              ← Router principal
│   ├── vite.config.js           ← Configuración build + code splitting
│   └── vercel.json              ← Configuración Vercel + SPA rewrites
│
└── ArduinoEsclavo/
    └── ArduinoEsclavo.ino       ← Código ESP8266
```

---

## 3. BASE DE DATOS

### 3.1 Modelos Principales

| Modelo | Descripción |
|---|---|
| `User` | Usuarios del sistema (aprendiz, instructor, admin) |
| `Ficha` | Grupos de formación |
| `FichaInstructor` | Relación instructor ↔ ficha con roles |
| `Materia` | Asignaturas por ficha |
| `Horario` | Horario semanal por materia |
| `Asistencia` | Sesión de asistencia abierta por instructor |
| `RegistroAsistencia` | Registro individual de cada aprendiz en una sesión |
| `Excusa` | Justificaciones de ausencia |
| `SnakeSkin` | Skins disponibles en la tienda |
| `UserSkin` | Skins desbloqueadas por usuario |
| `SkinOrder` | Órdenes de compra |
| `Papelera` | Elementos eliminados con datos originales |
| `HistorialCambios` | Auditoría de cambios en el sistema |

### 3.2 Cómo ver la base de datos

```bash
cd backend
npx prisma studio
# Abre http://localhost:5555 con interfaz visual de la BD
```

### 3.3 Backup de la Base de Datos

**Opción 1 — Desde Supabase (recomendado):**
1. Entra a https://supabase.com → tu proyecto
2. Ve a **Settings → Database → Backups**
3. Supabase hace backups automáticos diarios (plan gratuito: 7 días)

**Opción 2 — Manual con pg_dump:**
```bash
pg_dump "postgresql://usuario:contraseña@host:5432/basedatos" > backup_$(date +%Y%m%d).sql
```

**Opción 3 — Exportar desde Prisma Studio:**
1. Abre Prisma Studio: `npx prisma studio`
2. Selecciona los registros que necesitas
3. Exporta como JSON desde la interfaz

> ⚠️ **Importante:** Nunca compartas el archivo `.env` — contiene credenciales de la base de datos.

---

## 4. API REST — ENDPOINTS PRINCIPALES

### Autenticación (`/api/auth`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión, retorna JWT | No |
| GET | `/api/auth/me` | Obtener perfil del usuario actual | JWT |
| PUT | `/api/auth/profile` | Actualizar perfil + avatar | JWT |
| PUT | `/api/auth/change-password` | Cambiar contraseña | JWT |

**Ejemplo de petición login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@sena.edu.co",
  "password": "micontraseña"
}

Respuesta 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234abc",
    "fullName": "Carlos García",
    "userType": "aprendiz",
    "email": "usuario@sena.edu.co"
  }
}
```

### Fichas (`/api/fichas`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/fichas` | Listar mis fichas | JWT |
| POST | `/api/fichas` | Crear nueva ficha | JWT (instructor) |
| GET | `/api/fichas/:id` | Detalle de una ficha | JWT |
| PUT | `/api/fichas/:id` | Editar ficha | JWT (admin ficha) |
| POST | `/api/fichas/join` | Unirse a ficha con código | JWT |

### Asistencia (`/api/asistencias`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/asistencias` | Crear sesión de asistencia | JWT (instructor) |
| GET | `/api/asistencias/activa/:materiaId` | Sesión activa de una materia | JWT |
| POST | `/api/asistencias/:id/registrar` | Registrar asistencia de aprendiz | JWT |
| PUT | `/api/asistencias/:id/cerrar` | Cerrar sesión de asistencia | JWT (instructor) |
| GET | `/api/asistencias/historial/:fichaId` | Historial de asistencias | JWT |

### Exportación (`/api/export`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/export/excel/:fichaId` | Exportar asistencias a Excel | JWT |
| GET | `/api/export/csv/:fichaId` | Exportar asistencias a CSV | JWT |

### Hardware IoT (`/api/hardware`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/hardware/nfc` | Registrar lectura NFC del ESP8266 | - |
| POST | `/api/hardware/huella` | Registrar lectura de huella | - |

---

## 5. WEBSOCKETS (SOCKET.IO)

### Eventos del servidor → cliente

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `nuevo-registro` | Un aprendiz marcó asistencia | `{ aprendizId, nombre, metodo, timestamp }` |
| `sesion-cerrada` | El instructor cerró la sesión | `{ asistenciaId }` |
| `aprendiz-conectado` | Aprendiz se une a la sala | `{ nombre }` |

### Eventos del cliente → servidor

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `join-sesion` | Unirse a sala de una asistencia | `{ asistenciaId, userId }` |
| `marcar-asistencia` | Marcar asistencia desde cliente | `{ asistenciaId, aprendizId, metodo }` |

---

## 6. HARDWARE IOT

### 6.1 Componentes
- **ESP8266 (NodeMCU):** Microcontrolador WiFi. Se conecta a la red local y envía datos al backend
- **Sensor AS608:** Sensor de huella dactilar. Capacidad: ~162 huellas
- **Módulo RC522:** Lector NFC para tarjetas MIFARE

### 6.2 Flujo del Hardware
```
1. Aprendiz acerca tarjeta NFC al RC522
2. ESP8266 lee el UID de la tarjeta
3. ESP8266 hace HTTP POST a: http://backend-url/api/hardware/nfc
   Body: { uid: "A1B2C3D4", sessionId: "activa" }
4. Backend identifica al aprendiz por el UID
5. Registra la asistencia y emite WebSocket
```

### 6.3 Configurar el ESP8266

Edita estas variables en `ArduinoEsclavo/ArduinoEsclavo.ino`:
```cpp
const char* ssid = "NOMBRE_WIFI";
const char* password = "CONTRASEÑA_WIFI";
const char* serverUrl = "https://tu-backend.render.com/api/hardware";
```

Ver documentación completa en [docs/CONFIGURACION_WIFI_ESP.md](CONFIGURACION_WIFI_ESP.md)

---

## 7. INSTALACIÓN Y CONFIGURACIÓN LOCAL

### Prerrequisitos
- Node.js ≥ 18
- npm ≥ 9
- Cuenta en Supabase (gratuita)
- Git

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/arachiz.git
cd arachiz
```

### Paso 2: Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales (ver sección variables de entorno)
npx prisma generate
npx prisma db push
```

### Paso 3: Configurar Frontend
```bash
cd ../frontend
npm install
# Crea frontend/.env con:
# VITE_API_URL=http://localhost:3000/api
# VITE_SOCKET_URL=http://localhost:3000
```

### Paso 4: Ejecutar en desarrollo
```bash
# Terminal 1:
cd backend && node server.js

# Terminal 2:
cd frontend && npm run dev
```

### Variables de entorno del Backend (`.env`)
```env
PORT=3000
JWT_SECRET=secreto_muy_largo_y_aleatorio
SESSION_SECRET=otro_secreto_para_sesiones

# Supabase
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJ...

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Opcional: Google OAuth
GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Opcional: Email
EMAIL_USER=tu@gmail.com
EMAIL_PASSWORD=app_password_de_gmail
```

---

## 8. DESPLIEGUE EN PRODUCCIÓN

### Frontend en Vercel
1. Importa el repositorio en https://vercel.com
2. En el proyecto, configura:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Agrega variables de entorno en Vercel:
   - `VITE_API_URL`: URL del backend en Render
   - `VITE_SOCKET_URL`: URL del backend en Render

### Backend en Render
1. Ve a https://render.com → New Web Service
2. Conecta tu repositorio
3. Configura:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node server.js`
4. Agrega todas las variables de entorno del `.env`

---

## 9. SEGURIDAD IMPLEMENTADA

| Medida | Implementación |
|---|---|
| Hash de contraseñas | bcryptjs con 10 rondas de salt |
| Tokens de autenticación | JWT con expiración de 8 horas |
| HTTPS en producción | Provisto por Vercel y Render |
| Protección CORS | Configurado para aceptar solo el dominio del frontend |
| Validación de archivos | Multer restringe tipos: PDF, JPG, PNG, DOC |
| Variables sensibles | En `.env`, excluido de Git con `.gitignore` |

---

## 10. SCRIPTS ÚTILES

| Comando | Descripción |
|---|---|
| `cd backend && node server.js` | Iniciar servidor de desarrollo |
| `cd frontend && npm run dev` | Iniciar frontend en desarrollo |
| `cd frontend && npm run build` | Generar build de producción |
| `cd backend && npx prisma studio` | Abrir interfaz visual de BD |
| `cd backend && npx prisma db push` | Sincronizar schema con BD |
| `cd backend && npx prisma migrate reset --force` | ⚠️ Resetear BD (borra datos) |

---

## 11. SOLUCIÓN DE PROBLEMAS

| Problema | Causa probable | Solución |
|---|---|---|
| "Cannot connect to database" | Variables de entorno incorrectas | Verifica `.env` → `DATABASE_URL` |
| "Token expired" | JWT vencido | El usuario debe hacer login de nuevo |
| Hardware ESP8266 no envía datos | WiFi incorrecto o backend offline | Verifica SSID/contraseña y URL del backend |
| El QR no escanea | Sesión de asistencia cerrada | Pedir al instructor que reinicie sesión |
| Vercel: 404 al recargar | Falta configuración SPA | Verifica `frontend/vercel.json` |

---

*Manual Técnico — Arachiz v1.3.1 — Ficha 3146013 — SENA*
