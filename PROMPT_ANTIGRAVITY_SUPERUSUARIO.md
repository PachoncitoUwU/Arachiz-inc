# 🚀 PROMPT PARA ANTIGRAVITY - IMPLEMENTACIÓN ROL SUPER USUARIO

## CONTEXTO DEL PROYECTO

Sistema: **Arachiz** - Sistema de gestión de asistencia para el SENA
Stack: Node.js + Express + React 19 + PostgreSQL (Supabase) + Prisma ORM
Roles actuales: Aprendiz, Instructor, Administrador

## OBJETIVO

Implementar un nuevo rol llamado **"Super Usuario"** con acceso omnipresente a TODA la plataforma. Este rol puede gestionar la base de datos desde la interfaz, editar cualquier usuario, ver todas las fichas sin restricciones, y tener control total del sistema.

## CARACTERÍSTICAS DEL SUPER USUARIO

### Alcance
- Acceso TOTAL a toda la plataforma (sin restricciones de fichas)
- Puede ver, crear, editar y eliminar cualquier registro de cualquier tabla
- Puede gestionar usuarios (cambiar tipos, resetear contraseñas, habilitar/deshabilitar)
- Puede ver todas las fichas, materias, asistencias sin restricciones
- NO puede crear nuevas tablas (eso es trabajo de desarrolladores con Prisma)
- NO puede tomar asistencia (no es instructor)
- NO puede jugar juegos (no es aprendiz)

### Primer Super Usuario
Ya existe en la base de datos:
- Email: superadmin@arachiz.com
- Contraseña: Admin123!
- userType: 'super_usuario'
- ID: superuser_001

## FASE 1: BASE DE DATOS (Prisma Schema)

### 1.1. Crear tabla SuperUserAuditLog en schema.prisma
```prisma
model SuperUserAuditLog {
  id                String   @id @default(cuid())
  superUserId       String
  accion            String
  entidad           String
  entidadId         String?
  descripcion       String
  datosAnteriores   Json?
  datosNuevos       Json?
  ipAddress         String?
  fechaHora         DateTime @default(now())
  navegador         String?
  
  superUser         User     @relation("SuperUserLogs", fields: [superUserId], references: [id], onDelete: Cascade)
  
  @@index([superUserId])
  @@index([fechaHora])
  @@index([entidad])
}
```

### 1.2. Actualizar modelo User en schema.prisma
Agregar la relación en el modelo User:
```prisma
model User {
  // ... campos existentes ...
  superUserLogs     SuperUserAuditLog[]  @relation("SuperUserLogs")
}
```

### 1.3. Ejecutar migración
Después de modificar schema.prisma, ejecutar:
```bash
npx prisma migrate dev --name add_superuser_audit_log
npx prisma generate
```

## FASE 2: BACKEND

### 2.1. Crear middleware: middlewares/superUserMiddleware.js
```javascript
const jwt = require('jsonwebtoken');

const superUserMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretarachiz');
    
    if (verified.userType !== 'super_usuario') {
      return res.status(403).json({ error: 'Acceso denegado. Solo Super Usuarios.' });
    }
    
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = superUserMiddleware;
```

### 2.2. Crear controlador: controllers/superUserController.js

Este controlador debe incluir:

**A. DASHBOARD SIMPLIFICADO**
- `getDashboard` - Estadísticas básicas:
  - Total usuarios (por tipo)
  - Total fichas
  - Total asistencias hoy
  - Total excusas pendientes
  - Gráfico: asistencias últimos 7 días

**B. GESTIÓN DE USUARIOS OMNIPRESENTE**
- `getAllUsers` - Todos los usuarios con filtros (por tipo, ficha, estado)
- `getUserDetail` - Detalle completo de un usuario
- `updateUser` - Editar nombre, email, document, avatarUrl
- `changeUserType` - Cambiar entre aprendiz/instructor/administrador/super_usuario
- `resetUserPassword` - Generar contraseña temporal y enviar por email
- `toggleUserStatus` - Habilitar/deshabilitar usuario (soft delete)
- `deleteUserPermanently` - Eliminar con confirmación
- `getUserHistory` - Historial completo del usuario

**C. GESTIÓN DE FICHAS GLOBAL**
- `getAllFichas` - Todas las fichas sin restricciones
- `getFichaDetail` - Detalle completo de cualquier ficha
- `createFicha` - Crear nueva ficha
- `updateFicha` - Editar cualquier ficha
- `deleteFicha` - Soft delete
- `deleteFichaPermanently` - Eliminar permanentemente

**D. GESTIÓN DE MATERIAS GLOBAL**
- `getAllMaterias` - Todas las materias de todas las fichas
- `getMateriaDetail` - Detalle de una materia
- `createMateria` - Crear materia
- `updateMateria` - Editar materia
- `changeInstructorMateria` - Cambiar instructor asignado
- `deleteMateria` - Soft delete
- `deleteMateriaPermanently` - Eliminar permanentemente

**E. VISOR DE BASE DE DATOS**
- `getAllTables` - Listar todas las tablas disponibles
- `getTableData` - Obtener registros de una tabla (paginado)
- `createRecord` - Crear registro en cualquier tabla
- `updateRecord` - Editar registro de cualquier tabla
- `deleteRecord` - Eliminar registro con confirmación
- `exportTableToExcel` - Exportar tabla a XLSX

**F. GESTIÓN DE EXCUSAS GLOBAL**
- `getAllExcusas` - Todas las excusas (filtros: pendientes, aprobadas, rechazadas)
- `approveExcusa` - Aprobar excusa
- `rejectExcusa` - Rechazar excusa
- `deleteExcusa` - Eliminar excusa

**G. BACKUP MANUAL**
- `createBackup` - Exportar datos críticos a JSON:
  - Usuarios
  - Fichas
  - Materias
  - Asistencias
  - Formato JSON descargable

**H. LOGS DE AUDITORÍA**
- `getLogs` - Ver logs con filtros (usuario, acción, entidad, fecha)
- `getLogDetail` - Detalle de un log (diff de cambios)

**I. GESTIÓN DE SUPER USUARIOS**
- `getAllSuperUsers` - Listar Super Usuarios
- `createSuperUser` - Crear nuevo Super Usuario (genera password temporal)
- `toggleSuperUserStatus` - Habilitar/deshabilitar Super Usuario
- `resetSuperUserPassword` - Resetear contraseña

**J. ESTADÍSTICAS SIMPLIFICADAS**
- `getStatistics` - Métricas clave simplificadas:
  - Usuarios activos hoy
  - Asistencias registradas hoy
  - Fichas activas vs inactivas
  - Instructores activos (última semana)
  - Gráficos: Asistencias por día (30 días), Usuarios por tipo, Excusas por estado

**IMPORTANTE:** Cada función DEBE registrar la acción en SuperUserAuditLog automáticamente:
```javascript
await prisma.superUserAuditLog.create({
  data: {
    superUserId: req.user.id,
    accion: 'editar', // crear, editar, eliminar, resetear_password, etc.
    entidad: 'User', // User, Ficha, Materia, etc.
    entidadId: userId,
    descripcion: 'Editó el nombre del usuario Juan Pérez',
    datosAnteriores: { fullName: 'Juan' },
    datosNuevos: { fullName: 'Juan Pérez' },
    ipAddress: req.ip,
    navegador: req.headers['user-agent']
  }
});
```

### 2.3. Crear rutas: routes/superUserRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const superUserMiddleware = require('../middlewares/superUserMiddleware');
const superUserController = require('../controllers/superUserController');

// Aplicar middleware a todas las rutas
router.use(superUserMiddleware);

// Dashboard
router.get('/dashboard', superUserController.getDashboard);

// Usuarios
router.get('/usuarios', superUserController.getAllUsers);
router.get('/usuarios/:id', superUserController.getUserDetail);
router.put('/usuarios/:id', superUserController.updateUser);
router.put('/usuarios/:id/tipo', superUserController.changeUserType);
router.post('/usuarios/:id/resetear-password', superUserController.resetUserPassword);
router.put('/usuarios/:id/toggle-status', superUserController.toggleUserStatus);
router.delete('/usuarios/:id', superUserController.deleteUserPermanently);
router.get('/usuarios/:id/historial', superUserController.getUserHistory);

// Fichas
router.get('/fichas', superUserController.getAllFichas);
router.get('/fichas/:id', superUserController.getFichaDetail);
router.post('/fichas', superUserController.createFicha);
router.put('/fichas/:id', superUserController.updateFicha);
router.delete('/fichas/:id', superUserController.deleteFicha);
router.delete('/fichas/:id/permanente', superUserController.deleteFichaPermanently);

// Materias
router.get('/materias', superUserController.getAllMaterias);
router.get('/materias/:id', superUserController.getMateriaDetail);
router.post('/materias', superUserController.createMateria);
router.put('/materias/:id', superUserController.updateMateria);
router.put('/materias/:id/instructor', superUserController.changeInstructorMateria);
router.delete('/materias/:id', superUserController.deleteMateria);
router.delete('/materias/:id/permanente', superUserController.deleteMateriaPermanently);

// Visor de BD
router.get('/database/tables', superUserController.getAllTables);
router.get('/database/tables/:tableName', superUserController.getTableData);
router.post('/database/tables/:tableName', superUserController.createRecord);
router.put('/database/tables/:tableName/:id', superUserController.updateRecord);
router.delete('/database/tables/:tableName/:id', superUserController.deleteRecord);
router.get('/database/tables/:tableName/export', superUserController.exportTableToExcel);

// Excusas
router.get('/excusas', superUserController.getAllExcusas);
router.post('/excusas/:id/aprobar', superUserController.approveExcusa);
router.post('/excusas/:id/rechazar', superUserController.rejectExcusa);
router.delete('/excusas/:id', superUserController.deleteExcusa);

// Backup
router.post('/backup', superUserController.createBackup);

// Logs
router.get('/logs', superUserController.getLogs);
router.get('/logs/:id', superUserController.getLogDetail);

// Super Usuarios
router.get('/super-usuarios', superUserController.getAllSuperUsers);
router.post('/super-usuarios', superUserController.createSuperUser);
router.put('/super-usuarios/:id/toggle-status', superUserController.toggleSuperUserStatus);
router.post('/super-usuarios/:id/resetear-password', superUserController.resetSuperUserPassword);

// Estadísticas
router.get('/estadisticas', superUserController.getStatistics);

module.exports = router;
```

### 2.4. Registrar rutas en server.js

Agregar después de las otras rutas:
```javascript
const superUserRoutes = require('./routes/superUserRoutes');
app.use('/api/super-usuario', superUserRoutes);
```

## FASE 3: FRONTEND

### 3.1. Actualizar App.jsx

Agregar rutas de Super Usuario:
```javascript
import SuperDashboard from './pages/superuser/Dashboard';
import SuperUsuarios from './pages/superuser/Usuarios';
import SuperFichas from './pages/superuser/Fichas';
import SuperMaterias from './pages/superuser/Materias';
import SuperDatabase from './pages/superuser/Database';
import SuperExcusas from './pages/superuser/Excusas';
import SuperBackup from './pages/superuser/Backup';
import SuperLogs from './pages/superuser/Logs';
import SuperEstadisticas from './pages/superuser/Estadisticas';

// Dentro de <Routes>:
<Route path="/super-usuario" element={<MainLayout allowedRoles={['super_usuario']} />}>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<SuperDashboard />} />
  <Route path="usuarios" element={<SuperUsuarios />} />
  <Route path="fichas" element={<SuperFichas />} />
  <Route path="materias" element={<SuperMaterias />} />
  <Route path="database" element={<SuperDatabase />} />
  <Route path="excusas" element={<SuperExcusas />} />
  <Route path="backup" element={<SuperBackup />} />
  <Route path="logs" element={<SuperLogs />} />
  <Route path="estadisticas" element={<SuperEstadisticas />} />
  <Route path="configuracion" element={<Configuracion />} />
</Route>
```

### 3.2. Estructura de carpetas del frontend

Crear carpeta: `frontend/src/pages/superuser/`

Páginas a crear:

**A. Dashboard.jsx**
- Métricas básicas (usuarios totales, fichas, asistencias hoy, excusas pendientes)
- Gráfico simple de asistencias últimos 7 días
- Cards con totales por tipo de usuario

**B. Usuarios.jsx**
- Tabla con TODOS los usuarios
- Columnas: ID | Nombre | Email | Tipo | Fichas | Último acceso | Estado | Acciones
- Filtros: Por tipo (aprendiz, instructor, admin, super_usuario), por ficha, por estado
- Búsqueda por nombre, email o documento
- Acciones:
  - Ver perfil completo (modal)
  - Editar (modal con formulario)
  - Resetear contraseña (confirmación)
  - Cambiar tipo (dropdown)
  - Habilitar/Deshabilitar (toggle)
  - Eliminar permanentemente (confirmación estilo GitHub: escribir "eliminar usuario [NOMBRE]")

**C. Fichas.jsx**
- Tabla con TODAS las fichas
- Columnas: Número | Nombre | Centro | Jornada | Admin | Aprendices | Materias | Estado | Acciones
- Sin restricciones de "mis fichas"
- Acciones:
  - Ver detalle (modal o página)
  - Editar (modal)
  - Cambiar admin
  - Cambiar líder
  - Eliminar (soft)
  - Eliminar permanentemente (confirmación)

**D. Materias.jsx**
- Tabla con TODAS las materias
- Columnas: Nombre | Tipo | Ficha | Instructor | Horarios | Asistencias | Acciones
- Filtros por ficha, tipo
- Acciones:
  - Editar
  - Cambiar instructor
  - Ver asistencias
  - Eliminar

**E. Database.jsx**
- **Vista principal:** Lista de todas las tablas
  - User, Ficha, Materia, Horario, Asistencia, RegistroAsistencia, Excusa, SnakeSkin, UserSkin, etc.
- **Al hacer clic en una tabla:**
  - Ver registros en tabla paginada
  - Filtrar por columnas
  - Botón "Crear Registro" (abre modal con formulario)
  - Botón "Editar" por fila (abre modal)
  - Botón "Eliminar" por fila (confirmación)
  - Botón "Exportar a Excel"

**F. Excusas.jsx**
- Pestañas: Todas | Pendientes | Aprobadas | Rechazadas
- Filtros: Por ficha, materia, aprendiz, rango de fechas
- Acciones:
  - Ver detalle
  - Aprobar
  - Rechazar (con motivo)
  - Eliminar

**G. Backup.jsx**
- Botón "Crear Backup Ahora"
- Descarga archivo JSON con:
  - Todos los usuarios
  - Todas las fichas
  - Todas las materias
  - Todas las asistencias
- Mensaje de progreso al generar

**H. Logs.jsx**
- Tabla: Fecha/Hora | Super Usuario | Acción | Entidad | Descripción | IP | Detalles
- Filtros:
  - Por Super Usuario
  - Por acción (crear, editar, eliminar, etc.)
  - Por entidad (User, Ficha, Materia, etc.)
  - Por rango de fechas
- Al hacer clic en "Detalles":
  - Modal mostrando:
    - Datos antes del cambio (JSON formateado)
    - Datos después del cambio (JSON formateado)
    - Diff visual (qué cambió)

**I. Estadisticas.jsx**
- Métricas clave:
  - Usuarios activos hoy
  - Asistencias registradas hoy
  - Fichas activas vs inactivas
  - Instructores activos (última semana)
- Gráficos:
  - Asistencias por día (últimos 30 días) - Line chart
  - Usuarios por tipo - Pie chart
  - Excusas por estado - Bar chart

### 3.3. Componentes reutilizables

Crear en `frontend/src/components/superuser/`:

**A. ConfirmationModal.jsx**
- Modal para confirmaciones estilo GitHub
- Props: `isOpen`, `title`, `message`, `confirmText`, `onConfirm`, `onCancel`
- Debe incluir:
  - Input para escribir texto de confirmación
  - Botón deshabilitado hasta que coincida el texto

**B. UserDetailModal.jsx**
- Modal para ver perfil completo de usuario
- Muestra todos los datos, fichas, historial

**C. EditUserModal.jsx**
- Modal con formulario para editar usuario
- Campos: fullName, email, document, avatarUrl

**D. DatabaseTableViewer.jsx**
- Componente para mostrar registros de una tabla
- Props: `tableName`
- Incluye paginación, filtros, acciones

**E. LogDetailModal.jsx**
- Modal para ver detalle de un log
- Muestra diff de cambios en formato visual

### 3.4. Servicio de API

Crear `frontend/src/services/superUserApi.js`:

```javascript
import api from './api';

export const superUserApi = {
  // Dashboard
  getDashboard: () => api.get('/super-usuario/dashboard'),
  
  // Usuarios
  getAllUsers: (filters) => api.get('/super-usuario/usuarios', { params: filters }),
  getUserDetail: (id) => api.get(`/super-usuario/usuarios/${id}`),
  updateUser: (id, data) => api.put(`/super-usuario/usuarios/${id}`, data),
  changeUserType: (id, userType) => api.put(`/super-usuario/usuarios/${id}/tipo`, { userType }),
  resetUserPassword: (id) => api.post(`/super-usuario/usuarios/${id}/resetear-password`),
  toggleUserStatus: (id) => api.put(`/super-usuario/usuarios/${id}/toggle-status`),
  deleteUserPermanently: (id) => api.delete(`/super-usuario/usuarios/${id}`),
  getUserHistory: (id) => api.get(`/super-usuario/usuarios/${id}/historial`),
  
  // Fichas
  getAllFichas: () => api.get('/super-usuario/fichas'),
  getFichaDetail: (id) => api.get(`/super-usuario/fichas/${id}`),
  createFicha: (data) => api.post('/super-usuario/fichas', data),
  updateFicha: (id, data) => api.put(`/super-usuario/fichas/${id}`, data),
  deleteFicha: (id) => api.delete(`/super-usuario/fichas/${id}`),
  deleteFichaPermanently: (id) => api.delete(`/super-usuario/fichas/${id}/permanente`),
  
  // Materias
  getAllMaterias: () => api.get('/super-usuario/materias'),
  getMateriaDetail: (id) => api.get(`/super-usuario/materias/${id}`),
  createMateria: (data) => api.post('/super-usuario/materias', data),
  updateMateria: (id, data) => api.put(`/super-usuario/materias/${id}`, data),
  changeInstructorMateria: (id, instructorId) => api.put(`/super-usuario/materias/${id}/instructor`, { nuevoInstructorId: instructorId }),
  deleteMateria: (id) => api.delete(`/super-usuario/materias/${id}`),
  deleteMateriaPermanently: (id) => api.delete(`/super-usuario/materias/${id}/permanente`),
  
  // Database
  getAllTables: () => api.get('/super-usuario/database/tables'),
  getTableData: (tableName, page, limit) => api.get(`/super-usuario/database/tables/${tableName}`, { params: { page, limit } }),
  createRecord: (tableName, data) => api.post(`/super-usuario/database/tables/${tableName}`, data),
  updateRecord: (tableName, id, data) => api.put(`/super-usuario/database/tables/${tableName}/${id}`, data),
  deleteRecord: (tableName, id) => api.delete(`/super-usuario/database/tables/${tableName}/${id}`),
  exportTableToExcel: (tableName) => api.get(`/super-usuario/database/tables/${tableName}/export`, { responseType: 'blob' }),
  
  // Excusas
  getAllExcusas: (filters) => api.get('/super-usuario/excusas', { params: filters }),
  approveExcusa: (id, respuesta) => api.post(`/super-usuario/excusas/${id}/aprobar`, { respuesta }),
  rejectExcusa: (id, respuesta) => api.post(`/super-usuario/excusas/${id}/rechazar`, { respuesta }),
  deleteExcusa: (id) => api.delete(`/super-usuario/excusas/${id}`),
  
  // Backup
  createBackup: () => api.post('/super-usuario/backup', {}, { responseType: 'blob' }),
  
  // Logs
  getLogs: (filters) => api.get('/super-usuario/logs', { params: filters }),
  getLogDetail: (id) => api.get(`/super-usuario/logs/${id}`),
  
  // Super Usuarios
  getAllSuperUsers: () => api.get('/super-usuario/super-usuarios'),
  createSuperUser: (data) => api.post('/super-usuario/super-usuarios', data),
  toggleSuperUserStatus: (id) => api.put(`/super-usuario/super-usuarios/${id}/toggle-status`),
  resetSuperUserPassword: (id) => api.post(`/super-usuario/super-usuarios/${id}/resetear-password`),
  
  // Estadísticas
  getStatistics: () => api.get('/super-usuario/estadisticas'),
};
```

### 3.5. Menú lateral para Super Usuario

En `frontend/src/layouts/MainLayout.jsx`, agregar caso para 'super_usuario':

```javascript
if (user.userType === 'super_usuario') {
  menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/super-usuario/dashboard' },
    { icon: '👥', label: 'Usuarios', path: '/super-usuario/usuarios' },
    { icon: '📚', label: 'Fichas', path: '/super-usuario/fichas' },
    { icon: '📖', label: 'Materias', path: '/super-usuario/materias' },
    { icon: '🗄️', label: 'Base de Datos', path: '/super-usuario/database' },
    { icon: '📝', label: 'Excusas', path: '/super-usuario/excusas' },
    { icon: '💾', label: 'Backup', path: '/super-usuario/backup' },
    { icon: '📜', label: 'Logs', path: '/super-usuario/logs' },
    { icon: '📊', label: 'Estadísticas', path: '/super-usuario/estadisticas' },
    { icon: '⚙️', label: 'Configuración', path: '/super-usuario/configuracion' },
  ];
}
```

## FASE 4: SEGURIDAD

### 4.1. Confirmaciones para acciones destructivas

**IMPORTANTE:** Todas las acciones de eliminación permanente DEBEN tener confirmación estilo GitHub.

Ejemplo para eliminar usuario:
```javascript
// Modal de confirmación
<ConfirmationModal
  isOpen={showDeleteModal}
  title="⚠️ Eliminar permanentemente a este usuario"
  message="Esta acción NO SE PUEDE DESHACER. Para confirmar, escribe: eliminar usuario [NOMBRE_COMPLETO]"
  confirmText={`eliminar usuario ${userToDelete.fullName}`}
  onConfirm={handleDeleteConfirmed}
  onCancel={() => setShowDeleteModal(false)}
/>
```

### 4.2. Logs automáticos

**CRÍTICO:** TODAS las funciones del controlador superUserController.js DEBEN registrar en SuperUserAuditLog.

Usar un helper:
```javascript
async function registrarLog(req, accion, entidad, entidadId, descripcion, datosAnteriores, datosNuevos) {
  await prisma.superUserAuditLog.create({
    data: {
      superUserId: req.user.id,
      accion,
      entidad,
      entidadId,
      descripcion,
      datosAnteriores,
      datosNuevos,
      ipAddress: req.ip || req.connection.remoteAddress,
      navegador: req.headers['user-agent']
    }
  });
}
```

## FASE 5: TESTING Y VERIFICACIÓN

Después de implementar, verificar:

1. ✅ Login con superadmin@arachiz.com funciona
2. ✅ Solo usuarios con userType='super_usuario' pueden acceder
3. ✅ Dashboard muestra métricas correctas
4. ✅ Se pueden ver TODOS los usuarios sin restricciones
5. ✅ Se pueden editar usuarios
6. ✅ Se pueden resetear contraseñas
7. ✅ Se pueden habilitar/deshabilitar usuarios
8. ✅ Se pueden ver TODAS las fichas sin restricciones
9. ✅ Visor de BD muestra todas las tablas
10. ✅ Se pueden crear/editar/eliminar registros en BD
11. ✅ Backup genera y descarga JSON correctamente
12. ✅ Logs se registran AUTOMÁTICAMENTE en cada acción
13. ✅ Confirmaciones de eliminación funcionan (estilo GitHub)
14. ✅ Se pueden crear nuevos Super Usuarios
15. ✅ Exportación a Excel funciona

## NOTAS IMPORTANTES

1. **NO implementar 2FA ahora** - Se implementará más adelante
2. **NO permitir crear tablas nuevas** - Solo gestionar registros
3. **Logs son críticos** - Registrar TODO automáticamente
4. **Confirmaciones son obligatorias** - Para acciones destructivas
5. **Seguir patrones del proyecto** - Usar misma estructura de código que adminController.js
6. **Usar Prisma para todo** - No SQL directo
7. **Manejo de errores consistente** - try/catch en todas las funciones
8. **Validaciones en backend** - No confiar solo en frontend

## CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos
- [ ] Agregar modelo SuperUserAuditLog a schema.prisma
- [ ] Agregar relación en modelo User
- [ ] Ejecutar migración: `npx prisma migrate dev --name add_superuser_audit_log`
- [ ] Ejecutar: `npx prisma generate`

### Backend
- [ ] Crear middlewares/superUserMiddleware.js
- [ ] Crear controllers/superUserController.js con TODAS las funciones
- [ ] Crear routes/superUserRoutes.js
- [ ] Registrar rutas en server.js
- [ ] Implementar helper para logs automáticos
- [ ] Implementar función de backup (export a JSON)
- [ ] Implementar función de export a Excel

### Frontend
- [ ] Actualizar App.jsx con rutas de Super Usuario
- [ ] Crear carpeta pages/superuser/
- [ ] Crear Dashboard.jsx
- [ ] Crear Usuarios.jsx
- [ ] Crear Fichas.jsx
- [ ] Crear Materias.jsx
- [ ] Crear Database.jsx
- [ ] Crear Excusas.jsx
- [ ] Crear Backup.jsx
- [ ] Crear Logs.jsx
- [ ] Crear Estadisticas.jsx
- [ ] Crear ConfirmationModal.jsx
- [ ] Crear UserDetailModal.jsx
- [ ] Crear EditUserModal.jsx
- [ ] Crear DatabaseTableViewer.jsx
- [ ] Crear LogDetailModal.jsx
- [ ] Crear services/superUserApi.js
- [ ] Actualizar MainLayout.jsx con menú de Super Usuario

### Testing
- [ ] Probar login
- [ ] Probar acceso (solo super_usuario)
- [ ] Probar dashboard
- [ ] Probar gestión de usuarios
- [ ] Probar gestión de fichas
- [ ] Probar gestión de materias
- [ ] Probar visor de BD
- [ ] Probar excusas
- [ ] Probar backup
- [ ] Probar logs (que se registren automáticamente)
- [ ] Probar confirmaciones de eliminación
- [ ] Probar creación de Super Usuarios
- [ ] Probar export a Excel

---

**FIN DEL PROMPT**

Este prompt contiene TODA la información necesaria para implementar el rol de Super Usuario de principio a fin, siguiendo los patrones del proyecto Arachiz.
