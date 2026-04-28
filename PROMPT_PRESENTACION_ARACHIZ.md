# 📊 PROMPT PARA IA DE PRESENTACIONES - PROYECTO ARACHIZ

## 🎯 INSTRUCCIONES GENERALES
Crea una presentación profesional y moderna para el proyecto **Arachiz**, un sistema integral de gestión de asistencia y aprendizaje para el SENA. La presentación debe ser clara, visualmente atractiva y técnicamente precisa.

---

## 📑 CONTENIDO DE LA PRESENTACIÓN

### 1. PORTADA
**Título:** Arachiz - Sistema Integral de Gestión de Asistencia y Aprendizaje  
**Subtítulo:** Plataforma Web Progresiva para Instituciones Educativas  
**Versión:** 1.4.0  
**Fecha:** Abril 2026  
**Institución:** SENA (Servicio Nacional de Aprendizaje)

---

### 2. RESUMEN EJECUTIVO

**Descripción:**
Arachiz es una plataforma web progresiva (PWA) diseñada para modernizar y automatizar la gestión de asistencia en instituciones educativas, específicamente adaptada al modelo de formación del SENA. El sistema integra múltiples métodos de registro de asistencia (reconocimiento facial, NFC, QR, huella digital, manual) con funcionalidades de gestión académica, gamificación y análisis de datos.

**Puntos Clave:**
- Sistema multiplataforma (web, móvil, escritorio)
- Múltiples métodos de registro de asistencia inteligente
- Gestión completa de fichas, materias, instructores y aprendices
- Sistema de excusas y justificaciones digitales
- Gamificación con 7 juegos integrados y sistema de skins
- Arquitectura escalable y segura
- Interfaz moderna y responsive

**Impacto:**
- Reducción del 80% en tiempo de toma de asistencia
- Eliminación de registros en papel
- Trazabilidad completa de asistencias
- Mejora en la experiencia de aprendices e instructores
- Datos en tiempo real para toma de decisiones

---

### 3. ABSTRACT

**English Summary:**
Arachiz is a comprehensive Progressive Web Application (PWA) designed to revolutionize attendance management and academic administration in educational institutions. Built specifically for SENA's training model, the platform integrates multiple attendance registration methods including facial recognition, NFC, QR codes, fingerprint scanning, and manual entry. The system features complete academic management capabilities, a digital excuse system, gamification with 7 integrated games, and a skin marketplace. Developed using modern web technologies (React, Node.js, PostgreSQL), Arachiz provides a scalable, secure, and user-friendly solution that reduces attendance registration time by 80% while providing real-time analytics and complete traceability.

**Key Features:**
- Multi-method intelligent attendance system
- Complete academic management (fichas, materias, instructors, students)
- Digital excuse and justification workflow
- Gamification engine with virtual economy
- Real-time analytics and reporting
- Role-based access control (Administrator, Instructor, Student)
- Progressive Web App with offline capabilities

---

### 4. EL PROBLEMA

**Descripción del Problema:**

**Contexto:**
Las instituciones educativas, especialmente el SENA, enfrentan desafíos significativos en la gestión de asistencia y administración académica:

**Problemas Identificados:**

1. **Registro de Asistencia Ineficiente**
   - Métodos manuales consumen 10-15 minutos por clase
   - Registros en papel propensos a errores y pérdidas
   - Dificultad para verificar autenticidad
   - Imposibilidad de análisis en tiempo real

2. **Gestión Académica Fragmentada**
   - Sistemas desconectados para diferentes procesos
   - Falta de trazabilidad de cambios
   - Comunicación ineficiente entre instructores y aprendices
   - Dificultad para generar reportes consolidados

3. **Proceso de Excusas Obsoleto**
   - Excusas en papel difíciles de rastrear
   - Proceso de aprobación lento y manual
   - Sin historial digital de justificaciones
   - Falta de validación automática

4. **Falta de Engagement**
   - Baja motivación de aprendices
   - Ausencia de incentivos digitales
   - Experiencia de usuario poco atractiva

5. **Limitaciones Tecnológicas**
   - Dependencia de hardware específico
   - Falta de flexibilidad en métodos de registro
   - Sin capacidades offline
   - Interfaces poco intuitivas

**Impacto Cuantificado:**
- 15 minutos promedio por toma de asistencia manual
- 30% de errores en registros manuales
- 5-7 días para procesar excusas en papel
- Imposibilidad de análisis predictivo
- Costos elevados en papel y almacenamiento físico

---

### 5. OBJETIVO GENERAL

**Objetivo Principal:**
Desarrollar e implementar una plataforma web progresiva integral que automatice y optimice la gestión de asistencia, administración académica y engagement estudiantil en el SENA, mediante la integración de múltiples métodos de registro inteligente, gamificación y análisis de datos en tiempo real, reduciendo el tiempo de registro en un 80% y mejorando la trazabilidad y experiencia de usuario.

**Objetivos Específicos:**

1. **Automatización de Asistencia**
   - Implementar 5+ métodos de registro de asistencia
   - Reducir tiempo de registro de 15 min a 3 min
   - Lograr 99% de precisión en registros
   - Proporcionar trazabilidad completa

2. **Gestión Académica Integral**
   - Centralizar gestión de fichas, materias e instructores
   - Implementar sistema de roles y permisos
   - Proporcionar reportes y exportaciones automáticas
   - Mantener historial completo de cambios

3. **Digitalización de Procesos**
   - Eliminar uso de papel en excusas
   - Automatizar flujo de aprobación
   - Reducir tiempo de procesamiento a <24 horas
   - Proporcionar notificaciones en tiempo real

4. **Mejora de Engagement**
   - Implementar sistema de gamificación
   - Crear economía virtual con recompensas
   - Aumentar participación estudiantil en 40%
   - Mejorar satisfacción de usuarios

5. **Escalabilidad y Seguridad**
   - Soportar 10,000+ usuarios concurrentes
   - Garantizar 99.9% de disponibilidad
   - Cumplir con estándares de seguridad
   - Proporcionar capacidades offline

---

### 6. TECNOLOGÍAS, VERSIONES Y HERRAMIENTAS

**Stack Tecnológico Completo:**

#### **Frontend**
- **React** 19.2.4 - Framework principal de UI
- **React Router DOM** 7.13.1 - Navegación y routing
- **Vite** 6.0.0 - Build tool y dev server
- **Tailwind CSS** 3.4.19 - Framework de estilos
- **Framer Motion** 12.38.0 - Animaciones
- **Lucide React** 0.577.0 - Iconos
- **Face-api.js** 0.22.2 - Reconocimiento facial
- **jsQR** 1.4.0 - Lectura de códigos QR
- **Recharts** 3.8.0 - Gráficos y visualizaciones
- **Socket.io Client** 4.8.3 - Comunicación en tiempo real
- **@react-oauth/google** 0.13.5 - Autenticación con Google
- **jwt-decode** 4.0.0 - Decodificación de tokens
- **@dnd-kit** 6.3.1 - Drag and drop
- **Vite PWA Plugin** 0.21.1 - Progressive Web App

#### **Backend**
- **Node.js** - Runtime de JavaScript
- **Express** 5.2.1 - Framework web
- **Prisma** 5.22.0 - ORM y gestión de base de datos
- **PostgreSQL** - Base de datos principal (Supabase)
- **Socket.io** 4.8.3 - WebSockets para tiempo real
- **Passport.js** 0.7.0 - Autenticación
- **passport-google-oauth20** 2.0.0 - OAuth con Google
- **bcryptjs** 3.0.3 - Encriptación de contraseñas
- **jsonwebtoken** 9.0.3 - Generación y validación de JWT
- **Multer** 2.1.1 - Manejo de archivos
- **Nodemailer** 8.0.5 - Envío de emails
- **SerialPort** 13.0.0 - Comunicación con hardware
- **Axios** 1.15.2 - Cliente HTTP
- **ExcelJS** 4.4.0 - Generación de reportes Excel
- **Mercado Pago SDK** 2.0.15 - Integración de pagos
- **ePayco SDK** 1.4.4 - Pasarela de pagos alternativa
- **@supabase/supabase-js** 2.103.0 - Cliente de Supabase

#### **Base de Datos**
- **PostgreSQL** 15+ - Base de datos relacional
- **Supabase** - Backend as a Service
- **Prisma Client** - ORM type-safe

#### **Infraestructura y DevOps**
- **Supabase** - Hosting de base de datos y storage
- **GitHub Actions** - CI/CD automatizado
- **Git** - Control de versiones
- **npm** - Gestor de paquetes

#### **Hardware Integrado**
- **Lectores NFC** - Registro por tarjeta
- **Sensores de Huella Digital** - Biometría
- **Cámaras Web** - Reconocimiento facial
- **Arduino/ESP8266** - Controladores de hardware
- **Comunicación Serial** - Protocolo de comunicación

#### **APIs y Servicios Externos**
- **Google OAuth 2.0** - Autenticación social
- **Mercado Pago API** - Procesamiento de pagos
- **ePayco API** - Pagos alternativos
- **Web NFC API** - NFC en navegadores móviles
- **MediaDevices API** - Acceso a cámara
- **Service Worker API** - Funcionalidad offline

#### **Herramientas de Desarrollo**
- **ESLint** 9.39.4 - Linter de código
- **PostCSS** 8.5.8 - Procesador de CSS
- **Autoprefixer** 10.4.27 - Prefijos CSS automáticos
- **esbuild** 0.24.0 - Bundler ultra-rápido

#### **Testing y Calidad**
- **Prisma Studio** - Explorador de base de datos
- **Thunder Client / Postman** - Testing de APIs

---

### 7. ARQUITECTURA DEL SISTEMA

**Arquitectura General:**

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│  React PWA (Frontend)                                        │
│  ├─ Páginas (Instructor, Aprendiz, Admin)                   │
│  ├─ Componentes Reutilizables                               │
│  ├─ Context API (Estado Global)                             │
│  ├─ Service Worker (Offline)                                │
│  └─ Socket.io Client (Tiempo Real)                          │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE APLICACIÓN                        │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express (Backend)                                 │
│  ├─ Controladores (Lógica de Negocio)                       │
│  ├─ Rutas (Endpoints REST)                                  │
│  ├─ Middlewares (Auth, Roles, Upload)                       │
│  ├─ Socket.io Server (WebSockets)                           │
│  └─ Servicios (Email, Storage, Serial)                      │
└─────────────────────────────────────────────────────────────┘
                            ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                             │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase)                                       │
│  ├─ Usuarios (Aprendices, Instructores, Admins)            │
│  ├─ Fichas y Materias                                       │
│  ├─ Asistencias y Registros                                │
│  ├─ Excusas y Justificaciones                              │
│  ├─ Juegos y Skins                                          │
│  └─ Historial y Auditoría                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS                        │
├─────────────────────────────────────────────────────────────┤
│  ├─ Supabase Storage (Archivos)                            │
│  ├─ Google OAuth (Autenticación)                           │
│  ├─ Mercado Pago (Pagos)                                   │
│  ├─ Nodemailer (Emails)                                    │
│  └─ Hardware Serial (NFC, Huella)                          │
└─────────────────────────────────────────────────────────────┘
```

**Patrones de Arquitectura:**

1. **Arquitectura en Capas (Layered Architecture)**
   - Separación clara entre presentación, lógica y datos
   - Bajo acoplamiento entre capas
   - Alta cohesión dentro de cada capa

2. **Arquitectura Cliente-Servidor**
   - Cliente: React PWA (SPA)
   - Servidor: Node.js + Express (API REST)
   - Comunicación: HTTP/HTTPS + WebSockets

3. **Patrón MVC (Model-View-Controller)**
   - Model: Prisma Models + PostgreSQL
   - View: React Components
   - Controller: Express Controllers

4. **Patrón Repository**
   - Prisma como capa de abstracción de datos
   - Operaciones CRUD centralizadas

5. **Patrón Middleware**
   - Autenticación JWT
   - Validación de roles
   - Manejo de errores
   - Logging

**Componentes Principales:**

**Frontend:**
- **Router:** Gestión de rutas y navegación
- **Auth Context:** Estado de autenticación global
- **API Client:** Comunicación con backend
- **Socket Manager:** Eventos en tiempo real
- **Service Worker:** Cache y offline
- **Components:** UI reutilizables

**Backend:**
- **Server:** Express app principal
- **Controllers:** Lógica de negocio por módulo
- **Routes:** Definición de endpoints
- **Middlewares:** Interceptores de requests
- **Services:** Lógica compartida
- **Utils:** Funciones auxiliares

**Base de Datos:**
- **Schema:** Definición de modelos Prisma
- **Migrations:** Versionado de esquema
- **Seeds:** Datos iniciales
- **Indexes:** Optimización de consultas

**Flujo de Datos:**

```
Usuario → Frontend → API Request → Middleware → Controller 
→ Prisma → PostgreSQL → Response → Frontend → UI Update
```

**Seguridad:**
- Autenticación JWT con refresh tokens
- Encriptación bcrypt para contraseñas
- CORS configurado
- Validación de inputs
- SQL injection prevention (Prisma)
- XSS protection
- Rate limiting
- HTTPS obligatorio en producción

**Escalabilidad:**
- Arquitectura stateless
- Base de datos indexada
- Caching en frontend
- Lazy loading de componentes
- Code splitting
- Optimización de queries
- WebSockets para tiempo real

---

### 8. REQUISITOS FUNCIONALES

**RF-001: Gestión de Usuarios**
- El sistema debe permitir registro de usuarios con roles (Aprendiz, Instructor, Administrador)
- El sistema debe permitir autenticación con email/contraseña y Google OAuth
- El sistema debe permitir recuperación de contraseña por email
- El sistema debe permitir edición de perfil con foto

**RF-002: Gestión de Fichas**
- El sistema debe permitir crear fichas con información completa
- El sistema debe generar códigos únicos de invitación
- El sistema debe permitir asignar instructores y aprendices
- El sistema debe permitir gestión de horarios por ficha

**RF-003: Gestión de Materias**
- El sistema debe permitir crear materias asociadas a fichas
- El sistema debe permitir asignar instructores a materias
- El sistema debe permitir definir horarios por materia
- El sistema debe validar conflictos de horarios

**RF-004: Registro de Asistencia**
- El sistema debe soportar registro manual de asistencia
- El sistema debe soportar registro por reconocimiento facial
- El sistema debe soportar registro por código QR dinámico
- El sistema debe soportar registro por NFC/tarjeta
- El sistema debe soportar registro por huella digital
- El sistema debe prevenir registros duplicados
- El sistema debe registrar método y timestamp

**RF-005: Gestión de Excusas**
- El sistema debe permitir enviar excusas con archivos adjuntos
- El sistema debe validar que exista falta registrada
- El sistema debe permitir aprobar/rechazar excusas
- El sistema debe marcar asistencias como justificadas
- El sistema debe notificar cambios de estado

**RF-006: Reportes y Exportación**
- El sistema debe generar reportes de asistencia en Excel
- El sistema debe permitir filtrar por fecha, materia, ficha
- El sistema debe mostrar estadísticas visuales
- El sistema debe exportar datos consolidados

**RF-007: Gamificación**
- El sistema debe incluir 7 juegos (Snake, Flappy, Breakout, etc.)
- El sistema debe registrar puntuaciones
- El sistema debe mostrar rankings
- El sistema debe permitir comprar skins con dinero real

**RF-008: Sistema de Skins**
- El sistema debe mostrar tienda de skins
- El sistema debe integrar Mercado Pago para pagos
- El sistema debe desbloquear skins automáticamente
- El sistema debe permitir equipar/desequipar skins
- Instructores deben tener skins gratis

**RF-009: Administración**
- Administradores deben poder gestionar múltiples fichas
- Administradores deben poder modificar horarios
- Administradores deben poder enviar elementos a papelera
- Administradores deben poder generar reportes consolidados
- El sistema debe mantener historial de cambios

**RF-010: Comunicación en Tiempo Real**
- El sistema debe actualizar asistencias en tiempo real
- El sistema debe notificar cambios de estado
- El sistema debe sincronizar datos entre dispositivos

---

### 9. REQUISITOS NO FUNCIONALES

**RNF-001: Rendimiento**
- Tiempo de respuesta < 2 segundos para operaciones comunes
- Tiempo de carga inicial < 5 segundos
- Reconocimiento facial a 3 FPS mínimo
- Soporte para 10,000+ usuarios concurrentes
- Base de datos optimizada con índices

**RNF-002: Disponibilidad**
- Disponibilidad del 99.9% (menos de 9 horas de downtime/año)
- Capacidad offline para funciones críticas
- Service Worker para cache de recursos
- Recuperación automática de errores

**RNF-003: Seguridad**
- Encriptación de contraseñas con bcrypt
- Tokens JWT con expiración
- HTTPS obligatorio en producción
- Validación de inputs en frontend y backend
- Protección contra SQL injection (Prisma)
- Protección contra XSS
- Rate limiting en APIs
- Autenticación de dos factores (OAuth)

**RNF-004: Usabilidad**
- Interfaz intuitiva y moderna
- Responsive design (móvil, tablet, desktop)
- Accesibilidad WCAG 2.1 nivel AA
- Mensajes de error claros
- Feedback visual inmediato
- Onboarding para nuevos usuarios

**RNF-005: Escalabilidad**
- Arquitectura stateless
- Base de datos relacional escalable (PostgreSQL)
- Código modular y reutilizable
- Lazy loading de componentes
- Code splitting automático
- Optimización de imágenes

**RNF-006: Mantenibilidad**
- Código documentado
- Arquitectura en capas
- Separación de responsabilidades
- Versionado semántico
- Logs estructurados
- Tests automatizados (futuro)

**RNF-007: Portabilidad**
- Progressive Web App (PWA)
- Compatible con Chrome, Firefox, Safari, Edge
- Funciona en Windows, macOS, Linux
- Instalable en dispositivos móviles
- Funcionalidad offline

**RNF-008: Compatibilidad**
- Navegadores modernos (últimas 2 versiones)
- Dispositivos con cámara para facial
- Dispositivos con NFC para tarjetas
- Lectores de huella compatibles
- Resolución mínima 320px

**RNF-009: Cumplimiento**
- Protección de datos personales (GDPR-like)
- Consentimiento para uso de cámara
- Almacenamiento seguro de biometría
- Auditoría de cambios
- Trazabilidad completa

**RNF-010: Monitoreo**
- Logs de errores
- Métricas de uso
- Análisis de rendimiento
- Alertas automáticas
- Dashboard de administración

---

## 🎨 NOTAS ADICIONALES

**Tono de la Presentación:**
- Profesional pero accesible
- Enfocado en beneficios y resultados
- Respaldado con datos técnicos
- Orientado a stakeholders técnicos y no técnicos

**Elementos Visuales Sugeridos:**
- Diagramas de arquitectura
- Capturas de pantalla de la interfaz
- Gráficos de métricas de rendimiento
- Iconos para tecnologías
- Flujos de usuario
- Comparativas antes/después

**Audiencia:**
- Directivos del SENA
- Coordinadores académicos
- Instructores
- Personal técnico
- Inversionistas potenciales

---

**Versión del Documento:** 1.0  
**Fecha:** Abril 2026  
**Proyecto:** Arachiz v1.4.0
