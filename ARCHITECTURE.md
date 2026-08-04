# Arachiz-inc Project Architecture

Este documento describe la arquitectura técnica, las tecnologías utilizadas y la estructura de directorios del proyecto **Arachiz-inc**.

## 🚀 Tecnologías Utilizadas

El proyecto sigue una arquitectura Cliente-Servidor separando el Frontend y el Backend en dos directorios principales.

### Frontend (Cliente)
Aplicación de una sola página (SPA) construida para ser rápida, reactiva y moderna.
- **Librería Principal**: React (v19)
- **Empaquetador/Build Tool**: Vite (v6)
- **Estilos**: Tailwind CSS (v3.4) con animaciones (tailwindcss-animate, Framer Motion)
- **Enrutamiento**: React Router DOM (v7.13)
- **Iconografía**: Lucide React
- **Gráficos**: Recharts
- **Comunicación en Tiempo Real**: Socket.io-client
- **Otros**: Face-api.js (reconocimiento facial), JWT-decode.
- **Despliegue**: Vercel (Producción con soporte HTTPS obligatorio para Web Bluetooth API).

### Backend (Servidor)
API RESTful que maneja la lógica de negocio, persistencia de datos y autenticación.
- **Entorno de Ejecución**: Node.js
- **Framework Web**: Express (v5.2)
- **ORM (Mapeo Objeto-Relacional)**: Prisma (v5.22)
- **Base de Datos / Backend-as-a-Service**: Supabase
- **Autenticación**: JSON Web Tokens (JWT), Passport (OAuth20 con Google), bcryptjs para hashing de contraseñas.
- **Comunicación en Tiempo Real**: Socket.io
- **Manejo de Archivos**: Multer
- **Integraciones**: MercadoPago (pasarela de pagos), Nodemailer (envío de correos), Serialport (comunicación serial, p. ej. con Arduino).
- **Despliegue**: Render (Servicios de API en la nube).

---

## 📁 Estructura de Directorios

La estructura organizativa del proyecto separa claramente las responsabilidades del lado del cliente y del servidor.

### Raíz del Proyecto
```text
/
├── backend/            # Código fuente del servidor (API REST)
├── frontend/           # Código fuente de la aplicación cliente (React)
├── docs/               # Documentación general del proyecto
├── ArduinoEsclavo/     # Código relacionado con integración de hardware Arduino
├── docker-compose.yml  # Configuración de contenedores Docker
├── start.bat           # Script de inicio rápido para Windows
└── *.md                # Archivos de documentación y guías (README, CHECKLISTs, etc.)
```

### Frontend (`/frontend`)
La interfaz de usuario está altamente modularizada. Todo el código fuente reside en `/frontend/src`:

```text
/frontend/src/
├── assets/         # Recursos estáticos (imágenes, fuentes, iconos)
├── components/     # Componentes de UI reutilizables (Botones, Modales, Tarjetas)
├── config/         # Configuraciones de la aplicación (variables de entorno, versionado)
├── context/        # React Contexts para estado global (Auth, Theme, Settings)
├── games/          # Lógica y componentes de minijuegos o integraciones lúdicas
├── layouts/        # Componentes de diseño que envuelven las páginas (ej. MainLayout)
├── locales/        # Archivos de internacionalización y traducción
├── pages/          # Vistas completas agrupadas por roles (admin, instructor, aprendiz)
├── services/       # Funciones para consumir la API (ej. api.js con fetchApi)
├── styles/         # Archivos CSS globales
├── utils/          # Funciones auxiliares y formateadores
├── App.jsx         # Componente raíz y configuración de enrutador
├── main.jsx        # Punto de entrada de React al DOM
└── index.css       # Estilos globales de Tailwind
```

### Backend (`/backend`)
El servidor sigue un patrón MVC (Modelo-Vista-Controlador) adaptado para APIs.

```text
/backend/
├── config/         # Configuraciones del servidor (ej. base de datos, integraciones de terceros)
├── controllers/    # Lógica de negocio (manejadores de las rutas)
├── lib/            # Librerías personalizadas o integraciones externas
├── middlewares/    # Funciones intermedias (autenticación, validación de roles, manejo de errores)
├── migrations/     # Historial de cambios de la base de datos
├── models/         # (Opcional) Modelos adicionales si no se usa Prisma exclusivamente
├── prisma/         # Esquema de la base de datos (schema.prisma)
├── routes/         # Definición de endpoints de la API, vinculados a los controladores
├── uploads/        # Directorio temporal/persistente para archivos subidos por los usuarios
├── utils/          # Utilidades y helpers compartidos
└── server.js       # Punto de entrada de Express, inicio del servidor HTTP y Socket.io
```

---

## 📝 Resumen de Flujo de Datos

1. **Usuario interactúa** con vistas en `/frontend/src/pages/`.
2. Las páginas o componentes disparan llamadas a través de **servicios** (`/frontend/src/services/api.js`).
3. El **Backend** recibe la petición en una ruta definida en `/backend/routes/`.
4. La petición pasa por los **middlewares** (`/backend/middlewares/`) para autenticación.
5. El **Controlador** (`/backend/controllers/`) procesa la solicitud, usando **Prisma** (`/backend/prisma/`) para interactuar con **Supabase** (Base de datos).
6. La respuesta viaja de vuelta al Frontend, actualizando el **Estado Global** (en `/context/`) o el estado local del componente.

---

## 🔌 Integración y Diagnóstico de Hardware (ESP32 + Sensores)

El sistema cuenta con un módulo de integración física (caja de asistencia) que puede operar principalmente bajo las siguientes modalidades:
1. **Modo Bluetooth BLE (Inalámbrico con ESP32)**: Comunicación directa, segura y de baja latencia entre el navegador del usuario en producción (Frontend en Vercel sobre HTTPS) y el microcontrolador ESP32 mediante la Web Bluetooth API (`bleService`).
2. **Modo USB (Serie / Local)**: Comunicación directa mediante el puerto COM (`SerialPort` en Node.js) a 9600 baudios, útil para entornos locales o de respaldo.

### Características Clave del Subsistema de Hardware:
- **Emparejamiento BLE Directo (Web Bluetooth API)**: Permite a instructores y administradores conectar su portátil o dispositivo compatible (Chrome/Edge) a la Caja Arachiz de forma instantánea mediante Bluetooth Low Energy, eliminando la dependencia de routers o redes WiFi locales.
- **Autoconexión USB Inteligente (Respaldo)**: Al iniciar el backend local o consultar el estado de conexión, `SerialService` detecta automáticamente dispositivos compatibles conectados por USB (puertos Arduino, CH340, FTDI) y abre la conexión sin necesidad de configuración manual.
- **Sincronización y Control de Reposo**: Para evitar lecturas accidentales, sobrecalentamiento o ruidos, el hardware mantiene los sensores inactivos en reposo. Solo realiza escaneos cuando una sesión de clase está activa (`SESSION ON`), en procesos de enrolamiento de credenciales (`ENROLL <id>`), o durante las pruebas diagnósticas (`TEST_MODE_ON`).
- **Prueba Diagnóstica Integrada**: Permite a instructores y administradores validar de forma física e inalámbrica la salud del hardware desde la sección de Configuración (tanto en modo Bluetooth BLE como USB):
  - **Prueba NFC**: Verifica la lectura del lector PN532 (emite sonido al aproximar una tarjeta sin mostrar el código UID en pantalla).
  - **Prueba de Huella**: Detecta cualquier dedo sobre el cristal del lector AS608 y reporta su correcto escaneo de forma visual.
  - **Prueba de Audio**: Envía el comando `TEST_BUZZER` para validar la respuesta del zumbador físico en la caja de asistencia.

