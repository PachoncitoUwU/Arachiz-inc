# 🕷️ Arachiz - Sistema de Gestión de Asistencia Académica

Arachiz es una plataforma profesional desarrollada para optimizar la gestión de asistencias y excusas en un entorno académico (basado en el contexto SENA). Ofrece roles separados para Instructores y Aprendices, facilitando el control en tiempo real y la evaluación de justificaciones de forma rápida e intuitiva.

## 🚀 Características Principales

### 🧑‍🏫 Módulo Instructor
- **Gestión de Fichas:** Creación de grupos académicos mediante códigos de invitación.
- **Control de Materias:** Asignación de materias a fichas específicas.
- **Asistencia en Tiempo Real:** Inicio y finalización de sesiones de asistencia, con monitoreo en vivo de los aprendices registrados.
- **Evaluación de Excusas:** Revisión, aprobación o rechazo de excusas médicas y otras justificaciones enviadas por los estudiantes, incluyendo la opción de dar respuesta directa.

### 🧑‍🎓 Módulo Aprendiz
- **Vinculación Sencilla:** Unión a una ficha a través de un código único proporcionado por el instructor.
- **Registro Rápido de Asistencia:** Marcado de presencia utilizando el código de sesión correspondiente a la materia activa.
- **Gestión de Excusas:** Plataforma para el envío de excusas categorizadas, adjuntando justificaciones y manteniendo un historial del estado (Pendiente, Aprobada, Rechazada).

### 🔒 Seguridad y Arquitectura
- **Autenticación con JWT:** Acceso seguro mediante _JSON Web Tokens_ y encriptación de contraseñas con `bcryptjs`.
- **RBAC (Role-Based Access Control):** Separación estricta de rutas, vistas y endpoints de API dependiendo del rol del usuario.
- **Diseño UI/UX:** Interfaz limpia siguiendo los parámetros de Google Material Design usando Tailwind CSS.

---

## 🛠️ Tecnologías Usadas

- **Frontend:** React.js, Vite, Tailwind CSS, React Router DOM, Lucide React (iconos).
- **Backend:** Node.js, Express.js, JWT, Bcryptjs.
- **Arquitectura Backend:** Patrón MVC (Model-View-Controller) modificado usando una "Base de datos en memoria" temporal lista para ser migrada a SQL/NoSQL.

---

## 📦 Instalación y Uso (Desarrollo Local)

Sigue estos pasos para ejecutar el proyecto en cualquier computadora:

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd arachiz
```

### 2. Configurar y Ejecutar el Backend
```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno (Opcional, pero recomendado)
# Crea un archivo .env en la carpeta /backend con la siguiente estructura:
# PORT=3000
# JWT_SECRET=supersecretarachiz

# Ejecutar el servidor en modo desarrollo
npm start
# O si prefieres node: node server.js
```
El backend se ejecutará en: `http://localhost:3000`

### 3. Configurar y Ejecutar el Frontend
Abre **una nueva terminal** en la raíz del proyecto.
```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crea un archivo .env en la carpeta /frontend con:
# VITE_API_URL=http://localhost:3000/api

# Ejecutar Vite
npm run dev
```
La aplicación web estará disponible típicamente en `http://localhost:5173` (revisa la consola de Vite).

---

## 📝 Notas para Producción
1. **Base de Datos:** El proyecto actual utiliza estructuras almacenadas en memoria (`/models/db.js`). Para paso a producción, se debe conectar a una base de datos real actualizando los controladores correspondientes.
2. **Seguridad:** Cambiar obligatoriamente el `JWT_SECRET` en producción y mantener las variables dentro de `.env` que no se exponen al repositorio.

---
_Desarrollado para optimizar el tiempo académico mediante la eficiencia tecnológica._
