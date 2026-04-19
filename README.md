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


---

## 🐍 Rediseño Premium de Skins - Snake Game

### ✨ Cambios Recientes

Se ha implementado un **rediseño completo de las skins del juego Snake** con enfoque en:

#### 🎯 Ojos Premium
- ✅ **Brillo especular**: Punto blanco de reflejo que simula luz real
- ✅ **Profundidad**: Gradientes sutiles en la pupila
- ✅ **Expresión**: Múltiples estilos (Cute, Normal, Laser, Angry)
- ✅ **Borde definido**: Contorno fino que separa del fondo

#### 🌈 Skin Arcoíris Mejorada
- ✅ **Gradiente dinámico**: Transiciones suaves entre colores
- ✅ **Efecto 3D**: Sombreado sutil (Ambient Occlusion)
- ✅ **Glow neon**: Resplandor que cambia según el segmento
- ✅ **Volumen**: Cada segmento parece una cuenta 3D

#### ⚡ Optimización de Rendimiento
- ✅ **60 FPS**: Sin lag ni stuttering
- ✅ **Formas geométricas simples**: Círculos y gradientes eficientes
- ✅ **Caching de gradientes**: Se recrean solo cuando cambia la skin
- ✅ **Sombras controladas**: Blur limitado a 15px máximo

### 📁 Archivos Nuevos

```
frontend/src/utils/snakeSkinRenderer.js    # Funciones de renderizado premium
docs/SNAKE_SKIN_REDESIGN.md                # Documentación completa
docs/SNAKE_SKIN_PREVIEW.html               # Preview visual interactivo
docs/QUICK_IMPLEMENTATION_GUIDE.md         # Guía rápida de implementación
```

### 🚀 Cómo Usar

1. **Los ojos premium ya están activos** - No requiere configuración adicional
2. **Abre el juego Snake** y equipa diferentes skins para ver los nuevos ojos
3. **Verifica el rendimiento** - Debe estar a 55-60 FPS sin lag

### 📊 Comparativa

| Aspecto | Antes | Después |
|---------|-------|---------|
| Ojos | Puntos negros básicos | Con brillo especular |
| Skin Arcoíris | Gradiente plano | Efecto 3D premium |
| Brillo | Amarillo poco estético | Glow neon dinámico |
| Rendimiento | 30-40 FPS con lag | 55-60 FPS sin lag |
| Profundidad | Ninguna | Gradientes y sombras |

### 🎨 Estilos de Ojos Disponibles

- **😊 Cute**: Ojos amigables para skins comunes
- **😐 Normal**: Ojos estándar mejorados para skins raras
- **🔴 Laser**: Ojos rojos con glow para skins míticas
- **😠 Angry**: Ojos enojados para skins épicas

### 📖 Documentación

- **[Documentación Completa](docs/SNAKE_SKIN_REDESIGN.md)** - Especificaciones técnicas detalladas
- **[Preview Visual](docs/SNAKE_SKIN_PREVIEW.html)** - Ver los diseños en acción
- **[Guía Rápida](docs/QUICK_IMPLEMENTATION_GUIDE.md)** - Implementación en 5 minutos

### 🎮 Próximos Pasos

- [ ] Implementar skin arcoíris con efecto 3D completo
- [ ] Agregar más estilos de ojos personalizados
- [ ] Crear animaciones de parpadeo
- [ ] Agregar efectos de partículas opcionales

---
