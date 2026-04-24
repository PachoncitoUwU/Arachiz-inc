# Guía para Resolver Conflictos en Pull Request

## Problema
La rama `danieljuegos` tiene conflictos con `main` en los archivos `package.json` de frontend y backend.

## Conflictos Identificados

### Frontend package.json

**Paquetes eliminados en danieljuegos:**
- `@react-oauth/google` (^0.13.5) - Usado para login con Google
- `jwt-decode` (^4.0.0) - Decodificación de JWT
- `@tailwindcss/forms` (^0.5.11) - Estilos para formularios
- `@tailwindcss/typography` (^0.5.19) - Estilos de tipografía
- `framer-motion` (^12.38.0) - Animaciones
- `tailwindcss-animate` (^1.0.7) - Animaciones de Tailwind

**Versiones diferentes:**
- `@vitejs/plugin-react`: main tiene ^5.0.0, danieljuegos tiene ^4.3.4
- `vite`: main tiene ^6.0.0, danieljuegos tiene ^6.3.5
- `vite-plugin-pwa`: main tiene ^0.21.1, danieljuegos tiene ^1.2.0

### Backend package.json

**Paquetes eliminados en danieljuegos:**
- `express-session` (^1.19.0) - Manejo de sesiones
- `nodemailer` (^8.0.5) - Envío de emails
- `passport` (^0.7.0) - Autenticación
- `passport-google-oauth20` (^2.0.0) - OAuth de Google

## Soluciones

### Opción 1: Mantener la versión de main (Recomendado)
Si las funcionalidades de Google OAuth, emails y animaciones son necesarias:

```bash
# Desde la rama danieljuegos
git checkout main -- frontend/package.json backend/package.json
git checkout main -- frontend/package-lock.json backend/package-lock.json
npm install --prefix frontend
npm install --prefix backend
git add .
git commit -m "fix: Resolver conflictos de package.json manteniendo dependencias de main"
```

### Opción 2: Mantener la versión de danieljuegos
Si se quiere una versión más ligera sin Google OAuth ni animaciones:

```bash
# Desde main, hacer merge de danieljuegos
git merge origin/danieljuegos
# Resolver conflictos manualmente en los archivos
# Luego:
git add .
git commit -m "fix: Resolver conflictos de package.json"
```

### Opción 3: Merge manual selectivo (Más control)

1. **Crear una rama temporal para resolver conflictos:**
```bash
git checkout -b fix-merge-conflicts
git merge origin/danieljuegos
```

2. **Editar manualmente los package.json** para incluir:
   - Todas las dependencias necesarias de ambas ramas
   - Las versiones más recientes compatibles

3. **Reinstalar dependencias:**
```bash
cd frontend
npm install
cd ../backend
npm install
cd ..
```

4. **Probar que todo funcione:**
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

5. **Commit y push:**
```bash
git add .
git commit -m "fix: Resolver conflictos de merge entre main y danieljuegos"
git push origin fix-merge-conflicts
```

## Recomendación Final

**Mantener las dependencias de main** porque incluyen:
- Autenticación con Google (importante para usuarios)
- Sistema de emails (recuperación de contraseña)
- Animaciones mejoradas (mejor UX)
- Versiones más estables de Vite y plugins

Los paquetes eliminados en danieljuegos pueden causar que funcionalidades importantes dejen de funcionar.

## Comandos Rápidos

### Para quien hace el PR desde danieljuegos:
```bash
git checkout danieljuegos
git fetch origin
git merge origin/main
# Resolver conflictos en package.json manteniendo las dependencias de main
npm install --prefix frontend
npm install --prefix backend
git add .
git commit -m "fix: Resolver conflictos de merge con main"
git push origin danieljuegos
```

### Para revisar el PR desde main:
```bash
git fetch origin
git checkout -b review-danieljuegos origin/danieljuegos
# Revisar cambios
# Si hay problemas, comentar en el PR
```
