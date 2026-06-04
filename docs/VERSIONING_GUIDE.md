# 📋 Guía de Versionado de Arachiz

## Descripción General

Arachiz ahora cuenta con un sistema de versionado integrado que permite a los usuarios ver el historial de cambios y mejoras del sistema. Cada rol (instructor, aprendiz, administrador) tiene su propia sección de configuración con acceso a las notas de actualización.

## 🎯 Características

### Para Usuarios (Instructor y Aprendiz)
- Botón interactivo "Arachiz Version X.X.X" al final de la página de configuración
- Al hacer clic, se abre un modal con todas las notas de actualización
- Historial completo de cambios organizados por versión
- Cada versión muestra:
  - Número de versión
  - Fecha de lanzamiento
  - Título descriptivo
  - Lista de cambios realizados
  - Indicador de "Última versión"

### Para Administrador
- Mismo sistema que usuarios, pero sin la sección de configuración específica del administrador
- Acceso a las mismas notas de actualización

## 📁 Archivos Creados

### 1. `frontend/src/config/version.js`
Archivo central que contiene:
- `VERSION`: Versión actual del sistema (ej: "1.4.220")
- `RELEASE_NOTES`: Array con todas las notas de actualización
- Funciones auxiliares para obtener notas por versión

**Estructura de una nota de actualización:**
```javascript
{
  version: '1.4.220',
  date: '2026-05-27',
  title: 'Perfiles y Configuración',
  changes: [
    'Cambio 1',
    'Cambio 2',
    'Cambio 3'
  ]
}
```

### 2. `frontend/src/components/ReleaseNotesModal.jsx`
Componente modal que muestra:
- Todas las notas de actualización
- Secciones expandibles por versión
- Diseño responsivo (desktop y móvil)
- Soporte para modo oscuro
- Indicador visual de la última versión

### 3. Actualizaciones en componentes de configuración
- `frontend/src/pages/Configuracion.jsx` (Instructor y Aprendiz)
- `frontend/src/pages/admin/Configuracion.jsx` (Administrador)

## 🔄 Cómo Actualizar la Versión

### Paso 1: Actualizar el número de versión
Edita `frontend/src/config/version.js`:

```javascript
export const VERSION = '1.4.221'; // Incrementa la versión
```

### Paso 2: Agregar notas de actualización
En el mismo archivo, agrega una nueva entrada al inicio del array `RELEASE_NOTES`:

```javascript
export const RELEASE_NOTES = [
  {
    version: '1.4.221',
    date: '2026-05-28',
    title: 'Título de la actualización',
    changes: [
      'Cambio 1 realizado',
      'Cambio 2 realizado',
      'Cambio 3 realizado'
    ]
  },
  // ... versiones anteriores
];
```

### Paso 3: Actualizar package.json
Actualiza la versión en ambos archivos:
- `frontend/package.json`
- `backend/package.json`

```json
{
  "version": "1.4.221"
}
```

### Paso 4: Compilar y desplegar
```bash
npm run build
```

## 📝 Ejemplo de Notas de Actualización

```javascript
{
  version: '1.4.221',
  date: '2026-05-28',
  title: 'Mejoras en Gestión de Fichas',
  changes: [
    'Nuevo sistema de filtrado avanzado en fichas',
    'Mejora de rendimiento en carga de datos',
    'Corrección de bug en regeneración de códigos',
    'Interfaz mejorada para dispositivos móviles',
    'Soporte para exportación a PDF'
  ]
}
```

## 🎨 Interfaz del Usuario

### Botón de Versión
- Ubicado al final de la página de configuración
- Diseño minimalista con logo de Arachiz
- Efecto hover para indicar interactividad
- Icono de información (ℹ️)

### Modal de Notas
- Encabezado con título y descripción
- Lista de versiones expandibles
- Cada versión muestra:
  - Número y título
  - Fecha formateada
  - Badge "Última" para la versión actual
  - Lista de cambios con checkmarks
- Botón de cierre

## 🌙 Soporte para Modo Oscuro

Todos los componentes soportan automáticamente:
- Tema claro (por defecto)
- Tema oscuro (cuando está activado)
- Transiciones suaves entre temas

## 📱 Responsividad

El modal se adapta automáticamente a:
- Pantallas de escritorio (ancho completo con máximo)
- Tablets (ancho reducido)
- Móviles (ancho completo con padding)

## 🔐 Seguridad

- Las notas de actualización son estáticas (no requieren API)
- No se almacenan datos sensibles
- Compatible con todas las versiones de navegadores modernos

## 📊 Versionado Semántico

Se recomienda seguir versionado semántico:
- **MAJOR.MINOR.PATCH** (ej: 1.4.220)
- MAJOR: Cambios incompatibles
- MINOR: Nuevas funcionalidades
- PATCH: Correcciones de bugs

## 🚀 Próximas Mejoras

Posibles mejoras futuras:
- [ ] Notificaciones automáticas de nuevas versiones
- [ ] Historial de cambios sincronizado con backend
- [ ] Changelog automático desde commits de Git
- [ ] Estadísticas de uso por versión
- [ ] Sistema de feedback sobre cambios

## ❓ Preguntas Frecuentes

**P: ¿Dónde se almacenan las notas de actualización?**
R: En `frontend/src/config/version.js` como un array estático.

**P: ¿Puedo agregar más de 3 versiones?**
R: Sí, simplemente agrega más objetos al array `RELEASE_NOTES`.

**P: ¿Cómo se ve en modo oscuro?**
R: El modal se adapta automáticamente con colores oscuros y contraste adecuado.

**P: ¿Es necesario actualizar el backend?**
R: No, el sistema de versionado es completamente del lado del cliente.

---

**Última actualización:** 27 de mayo de 2026
**Versión:** 1.4.220
