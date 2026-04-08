# Guía de Despliegue Online — Arachiz

Esta guía explica cómo poner Arachiz en internet de forma gratuita usando servicios en la nube.

---

## Arquitectura del despliegue

```
Frontend (React)  →  Vercel  (gratis)
Backend (Node.js) →  Render  (gratis)
Base de datos     →  Railway o PlanetScale (gratis)
```

> El SQLite local no sirve para producción porque Render borra los archivos al reiniciar. Hay que migrar a PostgreSQL.

---

## Paso 1 — Subir el código a GitHub

1. Crea una cuenta en [github.com](https://github.com) si no tienes una.
2. Crea un repositorio nuevo (puede ser privado).
3. En tu terminal, dentro de la carpeta raíz del proyecto:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/arachiz.git
git push -u origin main
```

> Reemplaza `TU_USUARIO/arachiz` con tu usuario y nombre de repo.

---

## Paso 2 — Migrar la base de datos a PostgreSQL (Railway)

SQLite solo funciona en local. Para producción usamos PostgreSQL gratis en Railway.

### 2.1 Crear la base de datos

1. Ve a [railway.app](https://railway.app) y crea una cuenta (gratis con GitHub).
2. Crea un nuevo proyecto → **Add a service** → **Database** → **PostgreSQL**.
3. Una vez creada, ve a la pestaña **Variables** y copia el valor de `DATABASE_URL`. Se ve así:
   ```
   postgresql://postgres:password@host.railway.app:5432/railway
   ```

### 2.2 Actualizar el schema de Prisma

En `backend/prisma/schema.prisma`, cambia el datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.3 Actualizar el `backend/.env`

```env
DATABASE_URL=postgresql://postgres:password@host.railway.app:5432/railway
JWT_SECRET=un_secreto_muy_largo_y_seguro
PORT=3000
```

### 2.4 Ejecutar la migración

```bash
cd backend
npx prisma migrate deploy
```

---

## Paso 3 — Desplegar el Backend en Render

1. Ve a [render.com](https://render.com) y crea una cuenta con GitHub.
2. Crea un nuevo servicio: **New** → **Web Service**.
3. Conecta tu repositorio de GitHub.
4. Configura el servicio:

| Campo | Valor |
|---|---|
| Name | arachiz-backend |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npx prisma migrate deploy` |
| Start Command | `node server.js` |

5. En la sección **Environment Variables**, agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La URL de Railway del paso 2 |
| `JWT_SECRET` | Un texto largo y aleatorio |
| `PORT` | `3000` |

6. Haz clic en **Create Web Service**.

Render te dará una URL como:
```
https://arachiz-backend.onrender.com
```

> El plan gratuito de Render "duerme" el servidor tras 15 min de inactividad. La primera petición tarda ~30 segundos en despertar. Para evitarlo puedes usar [UptimeRobot](https://uptimerobot.com) para hacer ping cada 10 minutos (gratis).

---

## Paso 4 — Desplegar el Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta con GitHub.
2. Haz clic en **Add New Project** y selecciona tu repositorio.
3. Configura el proyecto:

| Campo | Valor |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. En **Environment Variables**, agrega:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://arachiz-backend.onrender.com/api` |

5. Haz clic en **Deploy**.

Vercel te dará una URL como:
```
https://arachiz.vercel.app
```

---

## Paso 5 — Configurar CORS en el backend

Para que el frontend de Vercel pueda hablar con el backend de Render, actualiza el CORS en `backend/server.js`:

```js
app.use(cors({
  origin: [
    'https://arachiz.vercel.app',  // tu URL de Vercel
    'http://localhost:5173'         // desarrollo local
  ],
  credentials: true
}));
```

Haz commit y push. Render redesplegará automáticamente.

---

## Paso 6 — Configurar Socket.io para producción

En `backend/server.js`, actualiza el servidor de Socket.io:

```js
const io = new Server(server, {
  cors: {
    origin: [
      'https://arachiz.vercel.app',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST']
  }
});
```

---

## Resumen de URLs finales

| Servicio | URL |
|---|---|
| Frontend | `https://arachiz.vercel.app` |
| Backend API | `https://arachiz-backend.onrender.com/api` |
| Base de datos | Railway (solo acceso interno) |

---

## Flujo de actualizaciones

Cada vez que hagas cambios:

```bash
git add .
git commit -m "descripción del cambio"
git push
```

Vercel y Render detectan el push y redesplegan automáticamente en 1-2 minutos.

---

## Costos

Todo lo descrito es **100% gratuito** con los planes free de cada servicio:

| Servicio | Plan gratuito incluye |
|---|---|
| GitHub | Repositorios ilimitados |
| Vercel | Hosting frontend ilimitado |
| Render | 750 horas/mes de servidor web |
| Railway | $5 USD de crédito mensual (suficiente para una DB pequeña) |

> Railway requiere tarjeta de crédito para verificar la cuenta, pero no cobra si no superas el crédito gratuito.

---

## Alternativa 100% sin tarjeta

Si no quieres poner tarjeta en Railway, usa **Supabase** para la base de datos:

1. Ve a [supabase.com](https://supabase.com) → New Project.
2. Copia la **Connection string** (URI) desde Settings → Database.
3. Úsala como `DATABASE_URL` en Render.

Supabase ofrece PostgreSQL gratis sin tarjeta de crédito.
