# 📝 Sistema de Gestión de Excusas - Implementación Completa

## 🎯 Resumen

Se ha implementado un sistema completo de gestión de excusas que permite a los aprendices justificar sus faltas por materia y a los instructores aprobar o rechazar estas solicitudes.

---

## ✅ Cambios Realizados

### 1. **Base de Datos (Supabase)**

#### Tabla `Excusa` (Nueva estructura)
```sql
- id: TEXT (PK)
- fecha: DATE (fecha de la falta)
- motivo: TEXT (descripción de la excusa)
- archivoUrl: TEXT (URL del archivo adjunto)
- estado: TEXT (Pendiente/Aprobada/Rechazada)
- respuesta: TEXT (respuesta del instructor)
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
- respondedAt: TIMESTAMP
- aprendizId: TEXT (FK → User)
- materiaId: TEXT (FK → Materia)
- registroAsistenciaId: TEXT (FK → RegistroAsistencia)
```

#### Tabla `RegistroAsistencia` (Campo agregado)
```sql
- justificado: BOOLEAN (indica si la falta fue justificada)
```

**Características:**
- ✅ Una excusa por materia y fecha
- ✅ Relación con registro de asistencia específico
- ✅ Índices para optimizar consultas
- ✅ Constraint único para evitar duplicados

---

### 2. **Backend (Node.js + Prisma)**

#### Archivos Modificados/Creados:

**`backend/prisma/schema.prisma`**
- Actualizado modelo `Excusa` con nuevas relaciones
- Agregado campo `justificado` a `RegistroAsistencia`
- Agregada relación `excusas` en modelo `Materia`

**`backend/controllers/excusaController.js`** (NUEVO)
Funciones implementadas:
- `createExcusa`: Crear excusa con validaciones
- `getMyExcusas`: Obtener excusas del aprendiz
- `getExcusasInstructor`: Obtener excusas de materias del instructor
- `updateExcusaEstado`: Aprobar/rechazar excusa
- `updateExcusa`: Editar excusa pendiente
- `getMateriasConFaltas`: Obtener materias con faltas del aprendiz

**Validaciones implementadas:**
- ✅ Fecha no puede ser futura
- ✅ Debe haber clase ese día según horario
- ✅ No puede enviar excusa para materia que evita
- ✅ No puede duplicar excusa para misma materia y fecha
- ✅ Solo puede editar excusas pendientes
- ✅ Solo instructor de la materia puede responder

**`backend/routes/excusaRoutes.js`** (ACTUALIZADO)
- Rutas para aprendices: crear, listar, editar
- Rutas para instructores: listar, aprobar/rechazar
- Middleware de autenticación y roles

---

### 3. **Frontend (React)**

#### Archivos Creados:

**`frontend/src/pages/aprendiz/Excusas.jsx`** (NUEVO)

**Funcionalidades:**
- ✅ Formulario para enviar excusa
  - Selector de materia
  - Selector de fecha (máximo hoy)
  - Campo de motivo (textarea)
  - Subida de archivo (drag & drop)
  - Vista previa de archivo
- ✅ Historial de excusas
  - Filtros por estado
  - Filtros por rango de fechas
  - Tarjetas con información completa
  - Estados visuales (badges de colores)
- ✅ Editar excusa pendiente
  - Solo si no ha sido respondida
  - Cambiar motivo y archivo
- ✅ Ver detalle de excusa
  - Modal con información completa
  - Respuesta del instructor
  - Archivo adjunto

**`frontend/src/pages/instructor/Excusas.jsx`** (NUEVO)

**Funcionalidades:**
- ✅ Lista de excusas de todas las materias
  - Información del aprendiz
  - Materia y ficha
  - Fecha de falta
  - Motivo
  - Archivo adjunto
- ✅ Filtros avanzados
  - Por estado (Todas/Pendiente/Aprobada/Rechazada)
  - Por rango de fechas
  - Contador de excusas por estado
- ✅ Responder excusas
  - Respuestas rápidas predefinidas
  - Campo de comentario personalizado
  - Botones aprobar/rechazar
  - Vista previa de archivo adjunto
- ✅ Actualización automática
  - Al aprobar, marca registro como justificado
  - Actualiza contador en tiempo real

---

## 🔄 Flujo de Trabajo

### Aprendiz:
1. Entra a "Mis Excusas"
2. Click en "Nueva Excusa"
3. Selecciona materia
4. Selecciona fecha de la falta (pasada o hoy)
5. Escribe motivo detallado
6. Adjunta archivo (opcional)
7. Envía excusa
8. Ve estado en tiempo real
9. Puede editar si está pendiente
10. Recibe respuesta del instructor

### Instructor:
1. Entra a "Evaluación de Excusas"
2. Ve contador de pendientes
3. Filtra por estado o fecha
4. Click en excusa para ver detalle
5. Revisa motivo y archivo
6. Selecciona respuesta rápida o escribe personalizada
7. Aprueba o rechaza
8. Sistema actualiza automáticamente:
   - Estado de excusa
   - Registro de asistencia (si aprueba)
   - Contador de pendientes

---

## 📊 Características Técnicas

### Validaciones:
- ✅ Fecha obligatoria y no futura
- ✅ Motivo obligatorio
- ✅ Archivo opcional (máx 5MB)
- ✅ Formatos: PDF, JPG, PNG, DOC, DOCX
- ✅ Validación de día con clase
- ✅ Prevención de duplicados
- ✅ Verificación de permisos

### Seguridad:
- ✅ Autenticación requerida
- ✅ Roles verificados (aprendiz/instructor)
- ✅ Solo instructor de la materia puede responder
- ✅ Solo aprendiz dueño puede editar
- ✅ Archivos en Supabase Storage

### Performance:
- ✅ Índices en campos de búsqueda
- ✅ Consultas optimizadas con includes
- ✅ Filtros en backend
- ✅ Carga lazy de archivos

---

## 🚀 Próximos Pasos

### Para poner en funcionamiento:

1. **Verificar Base de Datos:**
   ```bash
   # El SQL ya fue ejecutado en Supabase
   # Verificar que las tablas existan correctamente
   ```

2. **Generar Cliente Prisma:**
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Reiniciar Backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Probar Funcionalidad:**
   - Login como aprendiz
   - Enviar excusa
   - Login como instructor
   - Aprobar/rechazar excusa
   - Verificar que registro se marca como justificado

---

## 📝 Notas Importantes

### Diferencias con Sistema Anterior:
- ❌ **Antes:** Excusas con múltiples fechas, sin relación con materias
- ✅ **Ahora:** Una excusa por materia y fecha, con validación de horarios

### Integración con Asistencia:
- Cuando se aprueba una excusa, el campo `justificado` del registro de asistencia se marca como `true`
- Esto permite diferenciar entre:
  - Falta sin justificar
  - Falta justificada (excusa aprobada)
  - Presente

### Respuestas Rápidas:
```javascript
const RESPUESTAS_RAPIDAS = [
  'Excusa aprobada. Por favor, ponte al día con las actividades pendientes.',
  'Excusa aprobada. Recuerda solicitar las guías a tus compañeros.',
  'Excusa rechazada. El motivo no constituye una justificación válida.',
  'Excusa rechazada. Se requiere documentación de respaldo.',
  'Excusa aprobada. Lamento lo sucedido. Ponte al día con las clases.',
];
```

---

## 🎨 Diseño Visual

### Colores:
- **Pendiente:** Amarillo (#ffc107)
- **Aprobada:** Verde (#28a745 / #34A853)
- **Rechazada:** Rojo (#dc3545 / #EA4335)
- **Botón Enviar:** Verde SENA (#39A900)
- **Principal:** Azul (#4285F4)

### Componentes:
- Badges de estado con iconos
- Tarjetas con hover effect
- Modales responsivos
- Drag & drop para archivos
- Vista previa de imágenes
- Filtros en tiempo real

---

## ✅ Checklist de Implementación

- [x] Actualizar schema de base de datos
- [x] Crear controlador de excusas
- [x] Actualizar rutas
- [x] Crear página de aprendiz
- [x] Crear página de instructor
- [x] Implementar validaciones
- [x] Integrar con sistema de asistencia
- [x] Agregar respuestas rápidas
- [x] Implementar filtros
- [x] Agregar edición de excusas
- [ ] Generar cliente Prisma (pendiente por permisos)
- [ ] Probar flujo completo
- [ ] Verificar integración con asistencia

---

## 🐛 Problemas Conocidos

1. **Prisma Generate:** Error de permisos en Windows
   - **Solución:** Cerrar servidor backend y ejecutar manualmente

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que el SQL se ejecutó correctamente en Supabase
2. Asegúrate de que Prisma generó el cliente
3. Revisa los logs del backend
4. Verifica que las rutas estén registradas en `server.js`

---

**Fecha de implementación:** 26 de Abril de 2026
**Estado:** ✅ Implementado (pendiente pruebas)
