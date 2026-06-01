# DIAGRAMAS DEL SISTEMA — ARACHIZ
## Ficha 3146013 | Sistema de Gestión de Asistencia

---

## 1. DIAGRAMA DE ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│  ┌──────────────────┐        ┌────────────────────────────┐ │
│  │  Navegador Web   │        │   Hardware IoT             │ │
│  │  React 19 + Vite │        │  ┌──────────┐ ┌─────────┐ │ │
│  │  Tailwind CSS    │        │  │ ESP8266  │ │Arduino  │ │ │
│  │  Socket.io Client│        │  │(WiFi)    │ │+ AS608  │ │ │
│  └────────┬─────────┘        │  │          │ │+ RC522  │ │ │
│           │HTTPS             │  └────┬─────┘ └─────────┘ │ │
└───────────┼──────────────────│───────┼────────────────────┘─┘
            │                  │       │HTTP POST
            ▼                  └───────┤
┌─────────────────────────────────────▼──────────────────────┐
│                    SERVIDOR BACKEND                          │
│              Node.js + Express + Socket.io                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐ │
│  │ Auth API │ │Asistencia│ │ Fichas   │ │  Games API    │ │
│  │ JWT+     │ │   API    │ │Materias  │ │  Skins API    │ │
│  │ Google   │ │WebSocket │ │Horarios  │ │  Export API   │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘ │
│                         │                                    │
│                    Prisma ORM                                │
└─────────────────────────┼──────────────────────────────────┘
                          │
         ┌────────────────┼───────────────────┐
         ▼                ▼                   ▼
┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ PostgreSQL  │  │Supabase Storage │  │  Supabase Auth  │
│ (Supabase)  │  │  (Archivos/     │  │   (Backup)      │
│  Base de    │  │   Avatares)     │  │                 │
│   Datos     │  └─────────────────┘  └─────────────────┘
└─────────────┘

DESPLIEGUE:
  Frontend → Vercel (arachiz.vercel.app)
  Backend  → Render
  BD       → Supabase
```

---

## 2. DIAGRAMA ENTIDAD-RELACIÓN (Base de Datos)

```
┌─────────────────┐     ┌───────────────────┐     ┌──────────────┐
│      USER       │     │       FICHA        │     │   MATERIA    │
│─────────────────│     │───────────────────│     │──────────────│
│ id (PK)         │◄────┤ instructorAdminId │     │ id (PK)      │
│ userType        │     │ administradorId   │─────►│ nombre       │
│ fullName        │     │───────────────────│     │ tipo         │
│ document        │     │ id (PK)           │     │ fichaId (FK) │
│ email           │     │ numero            │     │ instructorId │
│ password        │     │ nombre            │──┐  └──────┬───────┘
│ avatarUrl       │     │ nivel             │  │         │
│ nfcUid          │     │ centro            │  │  ┌──────▼───────┐
│ huellas[]       │     │ jornada           │  │  │   HORARIO    │
│ faceDescriptor[]│     │ code (único)      │  │  │──────────────│
└──────┬──────────┘     └───────────────────┘  │  │ id (PK)      │
       │                        │               │  │ dia          │
       │        ┌───────────────┘               │  │ horaInicio   │
       │        ▼                               │  │ horaFin      │
       │  ┌─────────────┐                       │  │ fichaId (FK) │
       │  │  FICHA_INS  │                       │  │ materiaId FK │
       │  │─────────────│                       │  └──────────────┘
       │  │ id (PK)     │                       │
       │  │ role        │                       │  ┌──────────────┐
       │  │ fichaId(FK) │                       └─►│  ASISTENCIA  │
       │  │ instrId(FK) │                          │──────────────│
       │  └─────────────┘                          │ id (PK)      │
       │                                           │ fecha        │
       │                              ┌────────────│ activa       │
       │                              │            │ instructorId │
       │                              │            │ materiaId FK │
       │                              │            │ llegadaTarde │
       │                              │            │ duracion     │
       │                              │            └──────────────┘
       │                              ▼
       │                    ┌──────────────────┐
       │                    │REGISTRO_ASISTENCIA│
       │                    │──────────────────│
       └───────────────────►│ id (PK)          │
                            │ aprendizId (FK)  │
                            │ asistenciaId(FK) │
                            │ presente         │
                            │ metodo           │◄──┐
                            │ tarde            │   │
                            │ justificado      │   │
                            └─────────┬────────┘   │
                                      │            │
                              ┌───────▼────────┐   │
                              │    EXCUSA      │   │
                              │────────────────│   │
                              │ id (PK)        │   │
                              │ motivo         │   │
                              │ fechas         │   │
                              │ estado         │   │
                              │ archivosUrls   │   │
                              │ aprendizId FK  │   │
                              │ materiaId FK   │   │
                              │ registroId FK  │───┘
                              └────────────────┘
```

---

## 3. DIAGRAMA DE FLUJO — REGISTRO DE ASISTENCIA

```
INSTRUCTOR                  SISTEMA                    APRENDIZ
    │                          │                           │
    ├──[Iniciar sesión]────────►│                           │
    │                          ├──Crea sesión Asistencia   │
    │                          ├──Genera QR único          │
    │◄─[QR + panel tiempo real]─┤                           │
    │                          │                           │
    │                          │◄───────[Escanea QR]───────┤
    │                          │  ó [Acerca tarjeta NFC]   │
    │                          │  ó [Pone huella]          │
    │                          │  ó [Mira cámara]          │
    │                          │                           │
    │                          ├──Valida identidad         │
    │                          ├──Registra asistencia      │
    │◄─[WebSocket: nuevo pres]──┤                           │
    │  (nombre aparece en lista)│◄────[Confirmación]────────┤
    │                          │                           │
    ├──[Cerrar sesión]─────────►│                           │
    │                          ├──Marca ausentes automáticos
    │                          ├──Guarda historial         │
    │◄─[Resumen: X presentes]───┤                           │
```

---

## 4. DIAGRAMA DE FLUJO — SISTEMA DE EXCUSAS

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   APRENDIZ  │     │   SISTEMA   │     │  INSTRUCTOR  │
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                   │
       ├──[Ver ausencias]──►│                   │
       │◄─[Lista ausencias]─┤                   │
       │                   │                   │
       ├──[Crear excusa]───►│                   │
       │  motivo + fechas   │                   │
       │  + archivos        │                   │
       │                   ├──Guarda excusa     │
       │                   ├──Notifica──────────►│
       │                   │                   │
       │                   │◄──[Ver excusas]───┤
       │                   │──[Lista excusas]──►│
       │                   │◄──[Aprobar/Rechazar]│
       │                   │                   │
       │                   ├──Actualiza estado  │
       │                   │  (Justificado)     │
       │◄──[Notificación]───┤                   │
```

---

## 5. DIAGRAMA DE COMPONENTES — FRONTEND

```
src/
├── App.jsx                    ← Router principal + Auth Guard
│
├── context/
│   ├── AuthContext.jsx         ← Estado de usuario + JWT
│   └── SettingsContext.jsx     ← Tema (dark/light), idioma
│
├── pages/
│   ├── auth/
│   │   ├── Login.jsx           ← Formulario de acceso
│   │   └── Register.jsx        ← Registro de usuario
│   │
│   ├── aprendiz/
│   │   ├── Dashboard.jsx       ← Estadísticas personales
│   │   ├── Asistencia.jsx      ← QR scanner
│   │   ├── Historial.jsx       ← Mis asistencias
│   │   └── Excusas.jsx         ← Mis excusas
│   │
│   ├── instructor/
│   │   ├── Dashboard.jsx       ← Panel fichas
│   │   ├── GestionFicha.jsx    ← CRUD materias/horarios
│   │   ├── SesionAsistencia.jsx← Tiempo real
│   │   ├── Reportes.jsx        ← Estadísticas + Export
│   │   └── Excusas.jsx         ← Gestión excusas
│   │
│   └── admin/
│       ├── Dashboard.jsx       ← Panel global
│       ├── Usuarios.jsx        ← Gestión usuarios
│       └── Fichas.jsx          ← Vista todas las fichas
│
├── components/
│   ├── QRScanner.jsx           ← Cámara + lectura QR
│   ├── FaceRecognition.jsx     ← face-api.js
│   ├── ReporteTable.jsx        ← Tabla con export
│   └── Layout/Navbar/Sidebar
│
└── services/
    ├── api.js                  ← Axios + interceptors
    └── socket.js               ← Socket.io client
```

---

## 6. DIAGRAMA DE DESPLIEGUE

```
┌────────────────────────────────────────────────────────────┐
│                     PRODUCCIÓN                              │
│                                                             │
│  ┌───────────────────┐         ┌──────────────────────┐   │
│  │     VERCEL        │         │       RENDER          │   │
│  │─────────────────  │         │──────────────────────│   │
│  │ arachiz.vercel.app│◄───────►│ arachiz-back.render  │   │
│  │                   │  HTTPS  │ .com                 │   │
│  │ React Build (dist)│         │ Node.js + Express    │   │
│  │ CDN Global        │         │ Socket.io            │   │
│  │ Cache 1 año       │         │ Puerto 3000          │   │
│  └───────────────────┘         └──────────┬───────────┘   │
│           ▲                               │               │
│           │                               ▼               │
│    Usuario (cualquier                ┌─────────────┐      │
│    dispositivo)                      │  SUPABASE   │      │
│                                      │─────────────│      │
│  ┌──────────────────┐               │ PostgreSQL  │      │
│  │  Hardware Físico │               │ Storage     │      │
│  │  (Aula SENA)     │               │ Auth        │      │
│  │  ESP8266 ────────┼──────────────►│             │      │
│  │  + Sensor Huella │  HTTP/POST    └─────────────┘      │
│  │  + Lector NFC    │                                    │
│  └──────────────────┘                                    │
└────────────────────────────────────────────────────────────┘
```

---

## 7. DIAGRAMA DE ROLES Y PERMISOS

```
┌──────────────────────────────────────────────────────────┐
│                    ROLES DEL SISTEMA                      │
├──────────────┬──────────────────┬────────────────────────┤
│ ADMINISTRADOR│    INSTRUCTOR    │       APRENDIZ         │
├──────────────┼──────────────────┼────────────────────────┤
│ ✅ Gestionar │ ✅ Crear fichas  │ ✅ Unirse a ficha      │
│    usuarios  │ ✅ Crear materias│ ✅ Marcar asistencia   │
│ ✅ Ver todas │ ✅ Config horarios│ ✅ Ver mi historial   │
│    las fichas│ ✅ Iniciar sesión│ ✅ Enviar excusas      │
│ ✅ Papelera  │    asistencia    │ ✅ Jugar minijuegos    │
│ ✅ Historial │ ✅ Gestionar     │ ✅ Comprar skins       │
│    cambios   │    excusas       │ ✅ Ver rankings        │
│ ✅ Asignar   │ ✅ Exportar      │                        │
│    instructores│   reportes     │                        │
│              │ ✅ Ver aprendices│                        │
└──────────────┴──────────────────┴────────────────────────┘
```

---

*Diagramas del sistema Arachiz — Ficha 3146013 — SENA*
