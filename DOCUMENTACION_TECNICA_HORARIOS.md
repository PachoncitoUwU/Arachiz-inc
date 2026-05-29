# Documentación Técnica - Sistema de Horarios y Conflictos

## 📋 Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Modelos de Datos](#modelos-de-datos)
3. [API Endpoints](#api-endpoints)
4. [Lógica de Detección de Conflictos](#lógica-de-detección-de-conflictos)
5. [Componentes Frontend](#componentes-frontend)
6. [Flujos de Datos](#flujos-de-datos)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico:
- **Backend:** Node.js + Express + Prisma ORM
- **Base de Datos:** PostgreSQL
- **Frontend:** React + DnD Kit (drag & drop)
- **Autenticación:** JWT + Passport.js

### Estructura de Carpetas:
```
backend/
├── controllers/
│   ├── horarioController.js      # CRUD de horarios
│   ├── materiaController.js      # CRUD de materias
│   └── adminController.js        # Operaciones de admin
├── utils/
│   └── horarioConflictos.js      # Lógica de conflictos
├── routes/
│   ├── horarioRoutes.js
│   └── materiaRoutes.js
└── prisma/
    └── schema.prisma             # Esquema de BD

frontend/
├── pages/
│   ├── admin/
│   │   └── Horarios.jsx          # Vista admin
│   └── instructor/
│       └── Horario.jsx           # Vista instructor
└── components/
    ├── MateriaInfoModal.jsx      # Modal de materias
    └── ConflictosAlert.jsx       # Alerta de conflictos
```

---

## 💾 Modelos de Datos

### Modelo: Horario
```prisma
model Horario {
  id         String  @id @default(cuid())
  dia        String  // "Lunes", "Martes", etc.
  horaInicio String  // "08:00"
  horaFin    String  // "10:00"
  fichaId    String
  materiaId  String
  ficha      Ficha   @relation(fields: [fichaId], references: [id], onDelete: Cascade)
  materia    Materia @relation(fields: [materiaId], references: [id], onDelete: Cascade)
}
```

### Modelo: Materia
```prisma
model Materia {
  id               String             @id @default(cuid())
  nombre           String
  tipo             String             // "Técnica" | "Transversal"
  fichaId          String
  instructorId     String?            // Puede ser null
  horarios         Horario[]
  ficha            Ficha              @relation(fields: [fichaId], references: [id], onDelete: Cascade)
  instructor       User?              @relation("InstructorMaterias", fields: [instructorId], references: [id])
}
```

### Modelo: ConflictoHorario
```prisma
model ConflictoHorario {
  id           String    @id @default(cuid())
  instructorId String
  dia          String
  descripcion  String
  horarioIds   Json      // Array de IDs de horarios en conflicto
  resuelto     Boolean   @default(false)
  creadoPor    String?   // ID del usuario que causó el conflicto
  createdAt    DateTime  @default(now())
  resolvedAt   DateTime?
  instructor   User      @relation("ConflictosInstructor", fields: [instructorId], references: [id], onDelete: Cascade)
  admin        User?     @relation("ConflictosCreados", fields: [creadoPor], references: [id], onDelete: SetNull)

  @@index([instructorId])
  @@index([resuelto])
}
```

---

## 🔌 API Endpoints

### Horarios

#### `POST /api/horarios`
Crear nuevo horario.

**Request:**
```json
{
  "fichaId": "clxxx...",
  "materiaId": "clxxx...",
  "dia": "Lunes",
  "horaInicio": "08:00",
  "horaFin": "10:00"
}
```

**Response (éxito):**
```json
{
  "message": "Clase agregada al horario",
  "horario": { /* objeto horario */ },
  "conflictos": null
}
```

**Response (con conflictos):**
```json
{
  "message": "Clase agregada al horario",
  "horario": { /* objeto horario */ },
  "conflictos": {
    "count": 1,
    "message": "Se generaron 1 conflicto(s) de horario para el instructor"
  }
}
```

**Permisos:**
- Admin: Puede crear en cualquier ficha que administre
- Instructor: Solo puede crear para sus propias materias

**Validaciones:**
- ✅ Ficha existe
- ✅ Materia existe y pertenece a la ficha
- ✅ Usuario tiene permisos
- ✅ horaFin > horaInicio
- ✅ Detecta conflictos (no bloquea)

---

#### `PUT /api/horarios/:id`
Actualizar horario (instructor).

**Request:**
```json
{
  "dia": "Martes",
  "horaInicio": "09:00",
  "horaFin": "11:00"
}
```

**Response:**
```json
{
  "message": "Horario actualizado",
  "horario": { /* objeto horario */ },
  "conflictos": {
    "count": 1,
    "message": "Se generaron 1 conflicto(s) de horario...",
    "detalles": [
      {
        "dia": "Martes",
        "materia": "Arduino",
        "horario": "08:00 - 10:00",
        "ficha": "2695734"
      }
    ]
  }
}
```

**Permisos:**
- Solo el instructor de la materia puede editar

---

#### `PUT /api/horarios/admin/:id`
Actualizar horario (admin).

**Request:** Igual que PUT /api/horarios/:id

**Response:** Igual que PUT /api/horarios/:id

**Permisos:**
- Solo el admin de la ficha puede editar

---

#### `DELETE /api/horarios/:id`
Eliminar horario (enviar a papelera).

**Response:**
```json
{
  "message": "Clase enviada a la papelera exitosamente"
}
```

**Permisos:**
- Admin de la ficha
- Instructor de la materia

**Efectos secundarios:**
- Se envía a papelera (puede recuperarse)
- Se verifica si se resolvieron conflictos
- Se marca conflictos como resueltos si aplica

---

#### `GET /api/horarios/my-horarios`
Obtener todos los horarios del instructor actual.

**Response:**
```json
{
  "horarios": [
    {
      "id": "clxxx...",
      "dia": "Lunes",
      "horaInicio": "08:00",
      "horaFin": "10:00",
      "materia": {
        "nombre": "Arduino",
        "instructor": { "fullName": "Juan Pérez" },
        "ficha": { "numero": "2695734", "nombre": "ADSO" }
      }
    }
  ]
}
```

---

#### `GET /api/horarios/ficha/:fichaId`
Obtener horarios de una ficha.

**Response:**
```json
{
  "horarios": [ /* array de horarios */ ]
}
```

**Nota:** Si el usuario es aprendiz, excluye materias evitadas.

---

#### `GET /api/horarios/conflictos`
Obtener conflictos del instructor actual.

**Response:**
```json
{
  "conflictos": [
    {
      "id": "clxxx...",
      "dia": "Lunes",
      "descripcion": "Conflicto de horario: Arduino (8:00 - 11:00) en Ficha 2695734 y Matemáticas (6:00 - 9:00) en Ficha 2695734",
      "horarioIds": ["clxxx1", "clxxx2"],
      "resuelto": false,
      "createdAt": "2026-05-28T10:00:00.000Z",
      "admin": { "fullName": "Admin User" }
    }
  ]
}
```

---

#### `PUT /api/horarios/conflictos/:id/resolver`
Marcar conflicto como resuelto manualmente.

**Response:**
```json
{
  "message": "Conflicto resuelto",
  "conflicto": { /* objeto conflicto actualizado */ }
}
```

---

### Materias

#### `PUT /api/materias/:id`
Actualizar materia (incluye asignar instructor).

**Request:**
```json
{
  "nombre": "Matemáticas",
  "tipo": "Técnica",
  "instructorId": "clxxx..."  // Solo admin puede cambiar esto
}
```

**Response (con conflictos):**
```json
{
  "message": "Materia actualizada con conflictos de horario",
  "materia": { /* objeto materia */ },
  "conflictos": {
    "count": 2,
    "message": "Se detectaron 2 conflicto(s) de horario para el instructor asignado",
    "detalles": [
      {
        "dia": "Lunes",
        "materia": "Arduino",
        "horario": "08:00 - 11:00",
        "ficha": "2695734"
      }
    ]
  }
}
```

**Permisos:**
- Admin de la ficha
- Instructor creador de la materia (solo nombre y tipo)

**Validaciones:**
- ✅ Solo admin puede cambiar instructorId
- ✅ Instructor debe pertenecer a la ficha
- ✅ Detecta conflictos si la materia tiene horarios

---

#### `PUT /api/materias/:id/tomar`
Instructor toma materia sin instructor.

**Response:**
```json
{
  "message": "Materia tomada exitosamente",
  "materia": { /* objeto materia */ },
  "conflictos": {
    "count": 1,
    "message": "Se generaron 1 conflicto(s) de horario. Puedes resolverlos en tu pestaña de horarios.",
    "detalles": [ /* array de conflictos */ ]
  }
}
```

**Permisos:**
- Instructor debe pertenecer a la ficha
- Materia no debe tener instructor asignado

**Validaciones:**
- ✅ Detecta conflictos si la materia tiene horarios
- ✅ Permite tomar aunque haya conflictos

---

#### `PUT /api/materias/:id/dejar`
Instructor deja materia.

**Response:**
```json
{
  "message": "Has dejado de estar a cargo de la materia",
  "materia": { /* objeto materia */ }
}
```

**Permisos:**
- Solo el instructor a cargo puede dejar la materia

---

### Admin

#### `PUT /api/admin/materias/:materiaId/instructor`
Admin cambia instructor de una materia.

**Request:**
```json
{
  "nuevoInstructorId": "clxxx..."
}
```

**Response:**
```json
{
  "message": "Instructor de materia actualizado correctamente",
  "materia": { /* objeto materia */ },
  "conflictos": {
    "count": 1,
    "message": "Se generaron 1 conflicto(s) de horario para el instructor",
    "detalles": [
      {
        "dia": "Lunes",
        "horaInicio": "08:00",
        "horaFin": "11:00",
        "conflictos": 1
      }
    ]
  }
}
```

---

#### `GET /api/admin/instructores/:instructorId/horarios`
Obtener horarios de un instructor (vista admin).

**Response:**
```json
{
  "horarios": [ /* array de horarios */ ]
}
```

---

#### `GET /api/admin/instructores/:instructorId/conflictos`
Obtener conflictos de un instructor (vista admin).

**Response:**
```json
{
  "conflictos": [ /* array de conflictos */ ]
}
```

---

## 🔍 Lógica de Detección de Conflictos

### Archivo: `backend/utils/horarioConflictos.js`

#### Función: `detectarConflictos()`
```javascript
/**
 * Detecta conflictos de horario para un instructor en un día específico
 * @param {string} instructorId - ID del instructor
 * @param {string} dia - Día de la semana
 * @param {string} horaInicio - Hora de inicio (HH:MM)
 * @param {string} horaFin - Hora de fin (HH:MM)
 * @param {string} horarioIdExcluir - ID del horario a excluir (para ediciones)
 * @returns {Promise<Array>} - Array de horarios en conflicto
 */
async function detectarConflictos(instructorId, dia, horaInicio, horaFin, horarioIdExcluir = null)
```

**Lógica de Solapamiento:**
```javascript
// Caso 1: El nuevo horario empieza durante una clase existente
{ AND: [{ horaInicio: { lte: horaInicio } }, { horaFin: { gt: horaInicio } }] }

// Caso 2: El nuevo horario termina durante una clase existente
{ AND: [{ horaInicio: { lt: horaFin } }, { horaFin: { gte: horaFin } }] }

// Caso 3: El nuevo horario envuelve completamente una clase existente
{ AND: [{ horaInicio: { gte: horaInicio } }, { horaFin: { lte: horaFin } }] }
```

**Ejemplos de Solapamiento:**
```
Clase existente: 08:00 - 10:00

✅ Conflicto: 07:00 - 09:00  (Caso 1: empieza antes, termina durante)
✅ Conflicto: 09:00 - 11:00  (Caso 2: empieza durante, termina después)
✅ Conflicto: 08:30 - 09:30  (Caso 3: completamente dentro)
✅ Conflicto: 07:00 - 11:00  (Caso 3: envuelve completamente)
❌ No conflicto: 10:00 - 12:00  (empieza cuando termina la otra)
❌ No conflicto: 06:00 - 08:00  (termina cuando empieza la otra)
```

---

#### Función: `crearConflicto()`
```javascript
/**
 * Crea un registro de conflicto en la base de datos
 * @param {string} instructorId - ID del instructor
 * @param {string} dia - Día de la semana
 * @param {Array} horariosConflicto - Array de horarios en conflicto
 * @param {string} adminId - ID del admin que causó el conflicto
 * @returns {Promise<Object>} - Conflicto creado
 */
async function crearConflicto(instructorId, dia, horariosConflicto, adminId)
```

**Comportamiento:**
- Si ya existe un conflicto no resuelto para ese instructor en ese día, lo actualiza
- Si no existe, crea uno nuevo
- Genera descripción legible del conflicto
- Maneja errores sin bloquear la operación principal

---

#### Función: `generarDescripcionConflicto()`
```javascript
/**
 * Genera una descripción legible del conflicto
 * @param {Array} horariosConflicto - Array de horarios en conflicto
 * @returns {string} - Descripción del conflicto
 */
function generarDescripcionConflicto(horariosConflicto)
```

**Ejemplo de salida:**
```
"Conflicto de horario: Arduino (8:00 - 11:00) en Ficha 2695734 y Matemáticas (6:00 - 9:00) en Ficha 2695735"
```

---

## 🎨 Componentes Frontend

### Componente: `Horario.jsx` (Instructor)

**Ubicación:** `frontend/src/pages/instructor/Horario.jsx`

**Características:**
- Drag & drop con `@dnd-kit/core`
- Vista semanal con columnas por día
- Modos: Normal, Editar, Eliminar
- Spinner de carga al mover horarios
- Alerta de conflictos en tiempo real

**Estados principales:**
```javascript
const [horarios, setHorarios] = useState([]);
const [materias, setMaterias] = useState([]);
const [conflictos, setConflictos] = useState([]);
const [diasConConflicto, setDiasConConflicto] = useState([]);
const [movingHorarioId, setMovingHorarioId] = useState(null);
const [targetDia, setTargetDia] = useState(null);
const [modoEditar, setModoEditar] = useState(false);
const [modoEliminar, setModoEliminar] = useState(false);
```

**Funciones clave:**
```javascript
// Cargar datos
const loadData = async () => { /* ... */ };
const loadConflictos = async () => { /* ... */ };

// Drag & drop
const handleDragStart = ({ active }) => { /* ... */ };
const handleDragEnd = async ({ active, over }) => { /* ... */ };

// Edición
const handleOpenEdit = (horario) => { /* ... */ };
const handleUpdateHorario = async (e) => { /* ... */ };

// Eliminación
const toggleSeleccionHorario = (horarioId) => { /* ... */ };
const handleEliminarSeleccionados = async () => { /* ... */ };
```

---

### Componente: `Horarios.jsx` (Admin)

**Ubicación:** `frontend/src/pages/admin/Horarios.jsx`

**Características:**
- Vista por Ficha o por Instructor
- Crear materias con horarios
- Agregar materias existentes al horario
- Editar horarios
- Ver conflictos de instructores

**Estados principales:**
```javascript
const [viewMode, setViewMode] = useState('ficha'); // 'ficha' | 'instructor'
const [selectedFicha, setSelectedFicha] = useState(null);
const [selectedInstructor, setSelectedInstructor] = useState(null);
const [horarios, setHorarios] = useState([]);
const [materias, setMaterias] = useState([]);
const [conflictos, setConflictos] = useState([]);
```

---

### Componente: `MateriaInfoModal.jsx`

**Ubicación:** `frontend/src/components/MateriaInfoModal.jsx`

**Características:**
- Modal de información de materia
- Editar materia (nombre, tipo, instructor)
- Tomar/dejar materia (instructores)
- Evitar/volver a tomar materia (aprendices)

**Props:**
```javascript
{
  open: boolean,
  onClose: () => void,
  materia: Object,
  isCreatorOrAdmin: boolean,
  isAdmin: boolean,
  instructores: Array,
  currentUserId: string,
  onUpdate: () => void,
  onDelete: () => void,
  isAprendizView: boolean,
  isMateriaEvitada: boolean
}
```

---

### Componente: `ConflictosAlert.jsx`

**Ubicación:** `frontend/src/components/ConflictosAlert.jsx`

**Características:**
- Alerta de conflictos en la parte superior
- Muestra contador de conflictos
- Lista detallada de conflictos
- Botón para marcar como resuelto

**Props:**
```javascript
{
  userType: 'instructor' | 'administrador',
  onDismiss: (conflictos) => void
}
```

---

## 🔄 Flujos de Datos

### Flujo 1: Crear Horario con Conflicto

```
1. Usuario (Admin/Instructor) crea horario
   ↓
2. Frontend: POST /api/horarios
   ↓
3. Backend: horarioController.createHorario()
   ↓
4. Validar permisos y datos
   ↓
5. Obtener materia e instructorId
   ↓
6. detectarConflictos(instructorId, dia, horaInicio, horaFin)
   ↓
7. Crear horario en BD
   ↓
8. Si hay conflictos:
   - crearConflicto(instructorId, dia, conflictos, userId)
   ↓
9. Retornar horario + info de conflictos
   ↓
10. Frontend: Mostrar toast de advertencia
    ↓
11. Actualizar lista de horarios
    ↓
12. Recargar conflictos (si es instructor)
```

---

### Flujo 2: Mover Horario (Drag & Drop)

```
1. Instructor arrastra horario a otro día
   ↓
2. handleDragEnd({ active, over })
   ↓
3. Validar que over es un día válido
   ↓
4. Activar spinner: setMovingHorarioId(active.id), setTargetDia(over.id)
   ↓
5. Optimistic update: Actualizar estado local
   ↓
6. PUT /api/horarios/:id { dia: newDia }
   ↓
7. Backend: horarioController.updateHorario()
   ↓
8. detectarConflictos() para el nuevo día
   ↓
9. Si hay conflictos: crearConflicto()
   ↓
10. Retornar horario actualizado + conflictos
    ↓
11. Frontend: Mostrar toast (success o warning)
    ↓
12. loadConflictos() - Recargar lista de conflictos
    ↓
13. Desactivar spinner: setMovingHorarioId(null), setTargetDia(null)
```

---

### Flujo 3: Asignar Instructor a Materia

```
1. Admin edita materia y cambia instructor
   ↓
2. Frontend: PUT /api/materias/:id { instructorId }
   ↓
3. Backend: materiaController.updateMateria()
   ↓
4. Validar que solo admin puede cambiar instructor
   ↓
5. Verificar que instructor pertenece a la ficha
   ↓
6. Obtener horarios de la materia
   ↓
7. Para cada horario:
   - detectarConflictos(nuevoInstructorId, dia, horaInicio, horaFin)
   - Si hay conflictos: crearConflicto()
   ↓
8. Actualizar materia en BD
   ↓
9. Retornar materia + info de conflictos
   ↓
10. Frontend: Mostrar advertencia si hay conflictos
```

---

### Flujo 4: Resolver Conflicto Automáticamente

```
1. Instructor edita horario para que no se solape
   ↓
2. PUT /api/horarios/:id { horaInicio, horaFin }
   ↓
3. Backend: horarioController.updateHorario()
   ↓
4. Actualizar horario en BD
   ↓
5. detectarConflictos() con el nuevo horario
   ↓
6. Si NO hay conflictos:
   - Buscar conflictos no resueltos de ese instructor en ese día
   - Marcar como resueltos: resuelto = true, resolvedAt = now()
   ↓
7. Retornar horario actualizado
   ↓
8. Frontend: Actualizar lista de conflictos
   ↓
9. Remover indicadores visuales de conflicto
```

---

## 🧪 Testing

### Tests Unitarios Recomendados:

#### Backend:
```javascript
// horarioConflictos.test.js
describe('detectarConflictos', () => {
  test('detecta solapamiento al inicio', async () => {
    // Clase existente: 08:00 - 10:00
    // Nueva clase: 07:00 - 09:00
    // Debe detectar conflicto
  });

  test('detecta solapamiento al final', async () => {
    // Clase existente: 08:00 - 10:00
    // Nueva clase: 09:00 - 11:00
    // Debe detectar conflicto
  });

  test('detecta solapamiento completo', async () => {
    // Clase existente: 08:00 - 10:00
    // Nueva clase: 08:30 - 09:30
    // Debe detectar conflicto
  });

  test('no detecta conflicto cuando no se solapan', async () => {
    // Clase existente: 08:00 - 10:00
    // Nueva clase: 10:00 - 12:00
    // No debe detectar conflicto
  });

  test('detecta conflictos entre fichas diferentes', async () => {
    // Instructor A tiene clase en Ficha 1: Lunes 08:00 - 10:00
    // Se crea clase en Ficha 2: Lunes 09:00 - 11:00
    // Debe detectar conflicto
  });
});

describe('crearConflicto', () => {
  test('crea nuevo conflicto', async () => {
    // Debe crear registro en BD
  });

  test('actualiza conflicto existente', async () => {
    // Si ya existe conflicto no resuelto, debe actualizarlo
  });

  test('no bloquea operación si falla', async () => {
    // Si crearConflicto falla, no debe lanzar error
  });
});
```

#### Frontend:
```javascript
// Horario.test.jsx
describe('Horario Component', () => {
  test('muestra spinner al mover horario', async () => {
    // Simular drag & drop
    // Verificar que aparece spinner
  });

  test('muestra alerta de conflictos', async () => {
    // Cargar conflictos
    // Verificar que aparece alerta roja
  });

  test('actualiza conflictos después de mover', async () => {
    // Mover horario
    // Verificar que se llama loadConflictos()
  });
});
```

---

## 🔒 Seguridad

### Validaciones de Permisos:

#### Horarios:
- ✅ Admin solo puede editar horarios de sus fichas
- ✅ Instructor solo puede editar horarios de sus materias
- ✅ Instructor debe pertenecer a la ficha para crear horarios

#### Materias:
- ✅ Solo admin puede cambiar instructor de una materia
- ✅ Instructor solo puede tomar materias de fichas a las que pertenece
- ✅ Instructor solo puede dejar materias que está a cargo

### Validaciones de Datos:
- ✅ horaFin > horaInicio
- ✅ Día debe ser uno de los 6 días válidos
- ✅ Formato de hora: HH:MM
- ✅ IDs válidos (fichaId, materiaId, instructorId)

---

## 📊 Métricas y Monitoreo

### Logs Importantes:
```javascript
// En crearConflicto()
console.error('Error al crear conflicto:', error);

// En createHorario()
console.error('Error en createHorario:', err);
```

### Métricas Recomendadas:
- Número de conflictos generados por día
- Tiempo promedio de resolución de conflictos
- Número de horarios creados/editados por usuario
- Tasa de error en operaciones de horarios

---

## 🚀 Optimizaciones Futuras

### Performance:
1. **Caché de conflictos:** Cachear conflictos en Redis para reducir queries
2. **Paginación:** Paginar lista de horarios para fichas grandes
3. **Lazy loading:** Cargar horarios solo cuando se selecciona una ficha

### Funcionalidad:
1. **Sugerencias automáticas:** Sugerir horarios disponibles sin conflictos
2. **Notificaciones:** Email/push cuando se genera un conflicto
3. **Vista de calendario:** Vista mensual/anual para mejor visualización
4. **Comentarios en conflictos:** Permitir comunicación entre admin e instructor
5. **Historial de cambios:** Ver quién modificó qué y cuándo

### UX:
1. **Undo/Redo:** Deshacer cambios recientes
2. **Plantillas de horarios:** Guardar y reutilizar configuraciones
3. **Copiar horarios:** Copiar horarios de una semana a otra
4. **Exportar:** Exportar horarios a PDF/Excel

---

**Fecha de última actualización:** Mayo 2026
**Versión del sistema:** 2.0
**Autor:** Sistema de Gestión de Horarios - Arachiz Inc.
