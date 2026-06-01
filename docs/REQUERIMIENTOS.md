# REQUERIMIENTOS DEL SISTEMA — ARACHIZ
## Sistema de Gestión de Asistencia Inteligente | Ficha 3146013

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**URL del sistema:** https://arachiz.vercel.app

---

## 1. REQUERIMIENTOS FUNCIONALES

Los requerimientos funcionales describen **qué debe hacer** el sistema.

### RF-01 — Gestión de Usuarios y Autenticación

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-01.1 | El sistema debe permitir registrar nuevos usuarios con: nombre completo, documento de identidad, correo electrónico y contraseña | Alta |
| RF-01.2 | El sistema debe autenticar usuarios mediante usuario y contraseña, generando un token JWT con vigencia de 8 horas | Alta |
| RF-01.3 | El sistema debe soportar inicio de sesión con Google OAuth | Media |
| RF-01.4 | El sistema debe permitir recuperar la contraseña mediante correo electrónico | Alta |
| RF-01.5 | El sistema debe diferenciar 3 roles: Administrador, Instructor y Aprendiz | Alta |
| RF-01.6 | El sistema debe permitir actualizar perfil personal (nombre, avatar, contraseña) | Media |
| RF-01.7 | El sistema debe permitir guardar descriptor facial para reconocimiento biométrico | Media |

### RF-02 — Gestión de Fichas

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-02.1 | El instructor administrador debe poder crear fichas con: número, nombre del programa, nivel, centro, jornada, región y duración | Alta |
| RF-02.2 | El sistema debe generar un código único de invitación por ficha | Alta |
| RF-02.3 | El aprendiz debe poder unirse a una ficha usando el código de invitación | Alta |
| RF-02.4 | El instructor debe poder ver la lista de aprendices de su ficha | Alta |
| RF-02.5 | El administrador debe poder asignar instructores adicionales a una ficha | Media |
| RF-02.6 | El sistema debe permitir eliminar aprendices de una ficha | Media |

### RF-03 — Gestión de Materias y Horarios

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-03.1 | El instructor debe poder crear materias asociadas a una ficha | Alta |
| RF-03.2 | El sistema debe permitir asignar horarios semanales (día, hora inicio, hora fin) a cada materia | Alta |
| RF-03.3 | El instructor debe poder editar y eliminar materias | Alta |
| RF-03.4 | El sistema debe validar conflictos de horario entre materias del mismo instructor | Media |

### RF-04 — Módulo de Asistencia

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-04.1 | El instructor debe poder iniciar una sesión de asistencia para una materia | Alta |
| RF-04.2 | El sistema debe registrar la asistencia en tiempo real mediante WebSockets (Socket.io) | Alta |
| RF-04.3 | El aprendiz debe poder marcar asistencia mediante código QR | Alta |
| RF-04.4 | El aprendiz debe poder marcar asistencia mediante tarjeta NFC/RFID | Alta |
| RF-04.5 | El aprendiz debe poder marcar asistencia mediante huella dactilar (hardware AS608) | Alta |
| RF-04.6 | El aprendiz debe poder marcar asistencia mediante reconocimiento facial | Media |
| RF-04.7 | El sistema debe registrar automáticamente como ausente a los aprendices que no marquen al cerrar la sesión | Alta |
| RF-04.8 | El sistema debe marcar como "tarde" a los aprendices que lleguen después del tiempo configurado | Media |
| RF-04.9 | El instructor debe poder ver el historial completo de asistencias por materia | Alta |

### RF-05 — Sistema de Excusas

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-05.1 | El aprendiz debe poder enviar una excusa con: motivo, fechas y archivos adjuntos (PDF, JPG, PNG, DOC) | Alta |
| RF-05.2 | El instructor debe poder ver y responder excusas de sus aprendices | Alta |
| RF-05.3 | El sistema debe actualizar el estado de la asistencia a "justificado" al aprobar una excusa | Alta |
| RF-05.4 | El sistema debe notificar al aprendiz cuando su excusa sea respondida | Media |

### RF-06 — Reportes y Exportación

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-06.1 | El sistema debe mostrar estadísticas de asistencia (presentes, ausentes, tardanzas) por sesión | Alta |
| RF-06.2 | El instructor debe poder exportar el historial de asistencia a Excel (XLSX) | Alta |
| RF-06.3 | El instructor debe poder exportar el historial de asistencia a CSV | Alta |
| RF-06.4 | El sistema debe permitir generar una vista de impresión del reporte de asistencia | Media |
| RF-06.5 | El sistema debe ofrecer una plantilla Excel descargable para importación | Baja |

### RF-07 — Gamificación

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-07.1 | El sistema debe incluir mínimo 5 minijuegos accesibles para aprendices | Media |
| RF-07.2 | El sistema debe guardar puntuaciones (highscores) por juego y usuario | Media |
| RF-07.3 | El sistema debe mostrar un ranking global de puntuaciones | Media |
| RF-07.4 | El sistema debe incluir un sistema de skins desbloqueables con rareza | Baja |
| RF-07.5 | El sistema debe integrar pasarela de pagos (MercadoPago/Wompi) para compra de skins | Baja |

### RF-08 — Hardware IoT

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF-08.1 | El sistema debe comunicarse con el microcontrolador ESP8266 vía WiFi | Alta |
| RF-08.2 | El hardware debe leer huellas dactilares con el sensor AS608 | Alta |
| RF-08.3 | El hardware debe leer tarjetas NFC MIFARE RC522 | Alta |
| RF-08.4 | El sistema debe registrar y almacenar la UID de la tarjeta NFC de cada aprendiz | Alta |
| RF-08.5 | El sistema debe inscribir huellas dactilares y asociarlas al usuario | Alta |

---

## 2. REQUERIMIENTOS NO FUNCIONALES

Los requerimientos no funcionales describen **cómo debe comportarse** el sistema.

### RNF-01 — Rendimiento

| ID | Descripción |
|----|-------------|
| RNF-01.1 | El tiempo de respuesta de las peticiones de API debe ser menor a 2 segundos en condiciones normales |
| RNF-01.2 | El bundle inicial del frontend debe ser menor a 250KB (actualmente: 209KB ✅) |
| RNF-01.3 | El sistema debe soportar al menos 30 usuarios concurrentes en una sesión de asistencia |

### RNF-02 — Seguridad

| ID | Descripción |
|----|-------------|
| RNF-02.1 | Las contraseñas deben almacenarse con hash bcrypt (mínimo 10 rondas) |
| RNF-02.2 | Toda comunicación debe realizarse sobre HTTPS (provisto por Vercel/Render) |
| RNF-02.3 | Los tokens JWT deben expirar en 8 horas |
| RNF-02.4 | Los endpoints protegidos deben validar el token en cada petición |
| RNF-02.5 | Los archivos adjuntos deben almacenarse en Supabase Storage con URL firmada |

### RNF-03 — Usabilidad

| ID | Descripción |
|----|-------------|
| RNF-03.1 | La interfaz debe ser responsiva (funcionar en móvil, tablet y desktop) |
| RNF-03.2 | El sistema debe ofrecer modo oscuro y modo claro |
| RNF-03.3 | El tiempo de registro de asistencia por aprendiz no debe superar 5 segundos |
| RNF-03.4 | La aplicación debe funcionar como PWA (Progressive Web App) |

### RNF-04 — Disponibilidad

| ID | Descripción |
|----|-------------|
| RNF-04.1 | La URL pública debe estar disponible 24/7 (arachiz.vercel.app) |
| RNF-04.2 | La base de datos en Supabase debe tener backups automáticos |

### RNF-05 — Mantenibilidad

| ID | Descripción |
|----|-------------|
| RNF-05.1 | El código debe estar versionado en Git con commits descriptivos |
| RNF-05.2 | El backend debe seguir el patrón MVC (Modelo-Vista-Controlador) |
| RNF-05.3 | La base de datos debe gestionarse con un ORM (Prisma) para independencia de motor |

---

## 3. REQUERIMIENTOS DE INTERFAZ

### Pantallas requeridas por rol:

**Aprendiz:**
- Login / Registro
- Dashboard con estadísticas personales
- Escanear QR para asistencia
- Historial de asistencias
- Formulario de excusas
- Minijuegos y tienda de skins

**Instructor:**
- Dashboard con fichas activas
- Gestión de fichas, materias y horarios
- Iniciar/cerrar sesión de asistencia
- Panel de asistencia en tiempo real
- Gestión de excusas de aprendices
- Reportes y exportación

**Administrador:**
- Dashboard global
- Gestión de usuarios del sistema
- Visualización de todas las fichas
- Papelera de elementos eliminados
- Historial de cambios del sistema

---

## 4. CASOS DE USO PRINCIPALES

### CU-01: Registrar Asistencia con QR
```
Actor: Aprendiz
Precondición: Sesión de asistencia activa, aprendiz autenticado
Flujo principal:
  1. El instructor inicia sesión de asistencia
  2. El sistema genera código QR con ID de la sesión
  3. El aprendiz escanea el QR con su dispositivo
  4. El sistema valida el QR y registra la asistencia
  5. El instructor ve en tiempo real al aprendiz como "Presente"
Postcondición: Asistencia registrada con método "qr"
Flujo alternativo: QR expirado → Sistema muestra error, instructor regenera QR
```

### CU-02: Registrar Asistencia con NFC
```
Actor: Aprendiz (con tarjeta NFC registrada)
Precondición: Hardware ESP8266 conectado, sesión activa
Flujo principal:
  1. El aprendiz acerca su tarjeta NFC al lector
  2. El ESP8266 lee el UID y lo envía al backend via HTTP
  3. El backend identifica al aprendiz por el UID
  4. El sistema registra la asistencia con método "nfc"
  5. El instructor ve al aprendiz como "Presente" en tiempo real
Postcondición: Asistencia registrada
Flujo alternativo: UID no registrado → Sistema notifica al instructor
```

### CU-03: Enviar Excusa
```
Actor: Aprendiz
Precondición: Aprendiz autenticado con ausencia registrada
Flujo principal:
  1. El aprendiz accede a "Mis Excusas"
  2. Selecciona la materia y fechas de ausencia
  3. Escribe el motivo y adjunta archivos (opcional)
  4. Envía la excusa
  5. El instructor recibe notificación
  6. El instructor aprueba o rechaza la excusa
  7. El sistema actualiza el estado de asistencia
Postcondición: Excusa en estado "Aprobada" o "Rechazada"
```

---

*Documento generado para Ficha 3146013 — SENA | Arachiz v1.3.1*
