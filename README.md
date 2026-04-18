# Arachiz — Sistema de Gestión de Asistencia

Plataforma web para gestión de asistencia académica del SENA. Permite a instructores administrar fichas, materias, horarios y sesiones de asistencia; y a los aprendices registrar su asistencia y gestionar excusas.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS + Socket.io-client
- **Backend:** Node.js + Express + Prisma ORM + SQLite + Socket.io
- **Auth:** JWT + bcryptjs

## Instalación

El proyecto incluye comunicación Serial a Arduino para el uso de biometría en el aula.

### Límites de Lector de Huella
La placa backend (Supabase) aguanta miles de usuarios sin problemas, **sin embargo**, el esclavo Arduino usando el sensor de huella (usualmente AS608) tiene un límite físico incorporado según su fabricante (usualmente 162 huellas dactilares o hasta 300 modelos). Si necesitas más capacidad para una misma ficha o sede, recomendamos múltiples módulos, o escalar solamente con tecnología **NFC** (La lectura NFC con tarjetas Mifare no tiene límite de registros en Arachiz).
Adicionalmente, por cuestiones físicas del módulo biométrico económico (AS608), el láser se mantendrá encendido aunque detengamos el flujo de comprobación lógica; eso es normal del hardware, pero la placa principal (Arduino) ya no gasta memoria.

### Migración a otro PC
Si deseas correr este proyecto en otro computador, **no es necesario descargar configuraciones raras**. Simplemente debes arrastrar esta misma carpeta al nuevo PC y ejecutar las instrucciones de instalación `npm install` en el `backend` y `frontend`. Adicional, te sugiero que re-ejecutes `npx prisma db push` en el `backend` para que Prisma reconecte la base de datos central en la nube y construya la carpeta de clientes localmente.
### Requisitos
- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
node server.js
```

### Frontend

```bash

cd frontend
npm install
npm run dev
```

## Variables de entorno

### `backend/.env`
```
PORT=3000
JWT_SECRET=tu_secreto_seguro
```

### `frontend/.env` (opcional)
```
VITE_API_URL=http://localhost:3000/api
```

## Scripts

| Comando | Descripción |
|---|---|
| `node server.js` | Inicia el backend |
| `npm run dev` | Inicia el frontend en desarrollo |
| `npm run build` | Build de producción del frontend |
| `npx prisma studio` | Interfaz visual de la base de datos |
| `npx prisma migrate reset --force` | Resetea la base de datos |

## Roles

- **Instructor:** Crea fichas, materias, horarios, inicia sesiones de asistencia, evalúa excusas.
- **Aprendiz:** Se une a fichas, registra asistencia, envía excusas.

## Funcionalidades principales

- Autenticación con JWT (8h de sesión)
- Gestión completa de fichas con código de invitación
- Módulo de materias con control de permisos por rol
- Horario semanal configurable
- Sesiones de asistencia en tiempo real (Socket.io)
- Registro automático de ausencias al cerrar sesión
- Excusas con múltiples fechas y adjuntos (PDF, JPG, PNG, DOC)
- Historial completo de asistencias por aprendiz
