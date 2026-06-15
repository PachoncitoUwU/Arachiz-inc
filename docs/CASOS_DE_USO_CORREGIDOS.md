# CASOS DE USO CORREGIDOS — ARACHIZ

---

## Caso de Uso 7: Detectar y Gestionar Conflictos de Horario

**Actor Primario:** Administrador (crea/edita horarios que pueden generar conflictos), Instructor (consulta y resuelve sus propios conflictos)

**Stakeholders e Interesados:**
- Instructor: saber si una nueva materia se superpone con otra ya asignada, antes de comprometerse.
- Administrador: visión centralizada de conflictos entre fichas para reasignaciones oportunas.
- Aprendices: el instructor debe estar disponible en los horarios establecidos; un conflicto no detectado afecta su formación.
- SENA: garantizar que ningún instructor tenga asignaciones simultáneas que impidan el servicio educativo.

**Precondiciones:**
- Materias con horarios registrados (día, hora inicio, hora fin).
- Usuario autenticado con rol instructor o administrador.
- Al menos un instructor asignado a las materias con horario superpuesto.

**Garantías (Postcondiciones):**
- Conflicto detectado → registrado con instructor afectado, día, descripción del cruce y array de IDs de horarios involucrados.
- Administrador notificado del conflicto en la respuesta JSON al crear/editar el horario.
- Conflicto marcable como resuelto manualmente tras acciones correctivas.
- Historial de conflictos disponible para auditoría.

**Flujo Principal:**

| Actor | Sistema |
|---|---|
| 1. Administrador asigna instructor a una materia con horario configurado, O crea/edita un horario para una materia existente. | |
| | 2. Compara horarios de la materia con los de todas las demás materias del mismo instructor **en TODAS sus fichas** (no solo en la ficha actual). |
| | 3. Detecta superposición en el mismo día y rango de horas (considera 3 casos: inicio durante clase existente, fin durante clase existente, o envuelve completamente una clase). |
| | 4. Crea registro de conflicto en tabla `ConflictoHorario` con campos: `instructorId`, `dia`, `descripcion` (texto legible del conflicto), `horarioIds` (JSON array con IDs de horarios en conflicto), `resuelto: false`, `creadoPor` (ID del admin), `createdAt`. Muestra alerta al administrador en la respuesta JSON con campo `conflictos: { count, message, detalles }`. |
| 5. Administrador revisa el conflicto y decide: reasignar instructor, editar horario o marcar como resuelto. | |
| | 6. Si el administrador marca como resuelto, actualiza estado del conflicto a `resuelto: true` con `resolvedAt` timestamp. |

**Flujos Alternativos:**

- **1.a. Instructor intenta crear horario con conflicto** → sistema **RECHAZA** la operación con error 400 y muestra el detalle de la superposición (materia, horario, ficha); instructor debe ajustar el horario o contactar al admin. El instructor **NO puede crear conflictos voluntariamente**.

- **5.a. Conflicto aceptable** (ej. solapamiento mínimo) → admin marca como resuelto manualmente usando el endpoint correspondiente.

- **5.b. Admin edita el horario para eliminar superposición** → sistema re-evalúa y **crea un nuevo conflicto si aún detecta superposición**. La resolución automática **NO existe al editar**. El admin debe marcar manualmente los conflictos antiguos como resueltos.

- **5.c. Admin elimina un horario conflictivo** → sistema verifica si quedan conflictos para ese instructor en ese día. Si ya no hay superposiciones, **marca automáticamente** todos los conflictos no resueltos de ese instructor en ese día como `resuelto: true` con `resolvedAt`.

- **2.a. Sin conflicto** → no se crea registro; asignación procede normalmente sin alertas.

- **1.b. Instructor consulta "Mi Horario"** → grilla semanal con bloques de todas sus materias en todas sus fichas. Los conflictos se muestran visualmente resaltados si el backend los retorna.

- **1.c. Instructor consulta sus conflictos** → endpoint `/horarios/conflictos` retorna todos los conflictos no resueltos del instructor, incluyendo descripción y nombre del admin que los creó.

**Requerimientos Especiales:**

- Detección automática en cada asignación de instructor a materia con horario, o creación/edición de horario, sin intervención manual.
- Conflicto = mismo instructor + mismo día + cualquier superposición de horas (parcial incluida).
- **Los conflictos se detectan en TODAS las fichas del instructor, no solo en la ficha donde se crea el horario.** Un instructor puede tener materias en varias fichas, y el conflicto cruza fronteras de ficha.
- Resolución manual registra quién resolvió (`creadoPor`) y cuándo (`resolvedAt`).
- Resolución automática solo ocurre al eliminar horarios que causaban el conflicto.

**Tecnologías:** 
- `backend/utils/horarioConflictos.js` (funciones `detectarConflictos`, `crearConflicto`, `resolverConflicto`)
- `backend/controllers/horarioController.js` (endpoints de creación/edición/eliminación de horarios)
- `backend/controllers/adminController.js` (endpoint de cambio de instructor)
- Modelo `ConflictoHorario` en Prisma (campos: `id`, `instructorId`, `dia`, `descripcion`, `horarioIds`, `resuelto`, `creadoPor`, `createdAt`, `resolvedAt`)
- Grilla semanal en `frontend/src/pages/instructor/Horario.jsx`
- PostgreSQL + Prisma

**Frecuencia:** Cada vez que se crea un horario, se edita un horario existente, o se asigna/cambia un instructor a una materia con horario.

---

## Caso de Uso 8: Registrar Asistencia por Reconocimiento Facial

**Actor Primario:** Instructor (opera el escáner), Aprendiz (se presenta ante la cámara)

**Stakeholders e Interesados:**
- Aprendiz: registrar asistencia sin tarjeta ni celular, solo mostrando su rostro al sistema.
- Instructor: método rápido y automático para registrar múltiples aprendices sin intervención manual repetitiva.
- Administrador: método biométrico adicional que refuerza la confiabilidad del sistema y reduce fraude.
- SENA: diversidad de métodos biométricos que dificultan la suplantación de identidad en el registro de asistencia.

**Precondiciones:**
- Aprendiz con descriptor facial registrado en el sistema (campo `faceDescriptor` en modelo User, tipo Float[128]).
- Sesión de asistencia activa para la materia.
- Instructor con acceso a la cámara desde su dispositivo o el dispositivo de la sala.
- Modelos de face-api.js cargados correctamente en el frontend (tiny_face_detector, face_landmark_68_tiny, face_recognition) desde `/public/models/`.
- Instructor ha activado el escáner facial desde el panel de asistencia activa (botón "Iniciar Escáner").

**Garantías (Postcondiciones):**
- Registro guardado con método "facial" y hora exacta (America/Bogota).
- Campo "tarde" calculado según umbral `llegadaTarde` de la sesión.
- Cooldown de 5 segundos por aprendiz evita registros duplicados accidentales.
- No se generan registros duplicados para la misma sesión (validado en backend).

**Flujo Principal:**

| Actor | Sistema |
|---|---|
| 1. Instructor abre el panel de asistencia facial durante una sesión activa y hace clic en "Iniciar Escáner". | |
| | 2. Activa la cámara y carga los modelos de face-api.js desde `/public/models/`. |
| | 3. Inicia ciclo de detección continuo (~3 detecciones/segundo con `inputSize: 160` para velocidad). |
| 4. Aprendiz se posiciona frente a la cámara. | |
| | 5. Detecta todos los rostros en tiempo real con el modelo `TinyFaceDetector` (configuración: `inputSize: 160`, `scoreThreshold: 0.4`). |
| | 6. Extrae el descriptor facial (vector Float[128]) de cada rostro detectado usando `faceRecognitionNet` y `faceLandmark68TinyNet`. |
| | 7. Compara cada descriptor con los descriptores almacenados de todos los aprendices de la ficha que tengan `faceDescriptor` registrado (usando distancia euclidiana). |
| | 8. Identifica al aprendiz con mayor similitud (distancia euclidiana < 0.55 = umbral). Muestra el nombre del aprendiz reconocido en overlay instantáneo sobre el video (fondo verde si es nuevo registro, azul si ya estaba registrado previamente). |
| | 9. Verifica que el aprendiz NO esté en cooldown (5 segundos desde último reconocimiento) y NO tenga registro previo en esta sesión (check en `registeredRef.current` en frontend). |
| | 10. Registra asistencia AUTOMÁTICAMENTE en segundo plano mediante POST a `/asistencias/facial-register` con `asistenciaId` y `aprendizId`, calcula tardanza según `llegadaTarde` de la sesión, actualiza contador en tiempo real y agrega a historial visible. |
| | 11. Backend valida duplicados: si el aprendiz ya tiene registro en esta sesión, retorna error sin crear nuevo registro. |

**Flujos Alternativos:**

- **7.a. Ningún descriptor supera el umbral de similitud (distancia >= 0.55)** → sistema no muestra nombre en overlay; ciclo continúa sin registrar nada; aprendiz puede reposicionarse o instructor puede registrarlo manualmente.

- **5.a. No se detecta ningún rostro en el encuadre** → sistema no muestra overlay ni registra; ciclo continúa; aprendiz debe reposicionarse frente a la cámara.

- **2.a. Modelos de face-api.js no cargan** (error de red o archivos faltantes en `/public/models/`) → sistema muestra error en UI y deshabilita el botón de escáner; instructor debe usar otro método de registro.

- **1.a. Enrolar descriptor facial de un aprendiz:** aprendiz accede a su perfil → modal "Registrar Cara" → sistema activa cámara → captura el rostro con `detectSingleFace` → extrae descriptor Float[128] → envía a `/auth/face-descriptor` → backend guarda en campo `faceDescriptor` del usuario.

- **1.b. Instructor enrolla descriptor facial de un aprendiz:** desde el detalle de aprendiz en ficha, instructor abre modal "Registrar Cara" → sistema activa cámara → captura y extrae descriptor → envía a `/auth/face-descriptor-for/:userId` → backend guarda en la cuenta del aprendiz.

- **7.b. Aprendiz reconocido ya tiene registro en la sesión** → frontend detecta ID en `registeredRef.current` y NO envía petición al backend; sistema muestra overlay azul con "Ya marcado" pero no incrementa contador; aprendiz entra en cooldown de 5 segundos.

- **10.a. Error en el backend al registrar** (ej. sesión cerrada, aprendiz no pertenece a la ficha) → sistema captura error, no incrementa contador, y continúa el ciclo sin mostrar alerta al instructor (modo silencioso para no interrumpir flujo).

- **1.c. Instructor detiene el escáner** → hace clic en botón "Detener" → sistema detiene el ciclo de detección (`clearTimeout`), libera la cámara (`stream.getTracks().forEach(t => t.stop())`), oculta el video y muestra contador final.

**Requerimientos Especiales:**

- **El sistema registra automáticamente sin intervención del instructor.** No hay confirmación manual. Usa cooldown de 5 segundos (`COOLDOWN_MS`) por aprendiz para evitar registros duplicados accidentales si la misma cara aparece en frames consecutivos. El instructor puede detener el escáner en cualquier momento con el botón "Detener".

- Los modelos de face-api.js deben estar disponibles localmente en `/public/models/` para funcionar sin conexión a internet. Los archivos requeridos son:
  - `tiny_face_detector_model-weights_manifest.json`
  - `tiny_face_detector_model-shard1`
  - `face_landmark_68_tiny_model-weights_manifest.json`
  - `face_landmark_68_tiny_model-shard1`
  - `face_recognition_model-weights_manifest.json`
  - `face_recognition_model-shard1` y `shard2`

- El descriptor facial debe almacenarse en el servidor (campo `faceDescriptor` en tabla User), no solo en el cliente, para garantizar persistencia.

- **La comparación de descriptores se realiza en el frontend para reducir latencia y mostrar nombres instantáneamente**, pero el registro final se valida en el backend para garantizar integridad (no duplicados, sesión activa, permisos).

- Umbral de similitud: distancia euclidiana < 0.55 = misma persona (configurado en `THRESHOLD` en `FacialScanner.jsx` y en `faceController.js`).

- El video muestra la cámara espejada (`transform: scaleX(-1)`) para que el aprendiz se vea como en un espejo y pueda posicionarse intuitivamente.

**Tecnologías:** 
- face-api.js (`TinyFaceDetector`, `FaceLandmark68TinyNet`, `FaceRecognitionNet`)
- `frontend/src/utils/faceApi.js` (funciones `loadFaceModels`, `detectAllFaceDescriptors`, `faceDistance`, `descriptorToArray`)
- `frontend/src/components/FacialScanner.jsx` (componente principal del escáner continuo)
- `frontend/src/components/FaceCapture.jsx` (componente para enrollar descriptor facial)
- `backend/controllers/faceController.js` (endpoints `/auth/face-descriptor`, `/auth/face-identify`, `/auth/face-descriptor-for/:userId`)
- `backend/controllers/asistenciaController.js` (endpoint `/asistencias/facial-register`)
- Campo `faceDescriptor` (Float[128]) en modelo User de Prisma
- PostgreSQL + Prisma

**Frecuencia:** Modo continuo mientras el escáner esté activo (~3 detecciones/segundo con `inputSize: 160`), registrando automáticamente cada rostro reconocido que supere el umbral de similitud (distancia euclidiana < 0.55) y no esté en cooldown ni previamente registrado en la sesión.

---

## Notas Adicionales

### Diferencias clave entre Caso 7 y versión original:
- ✅ El instructor **NO puede crear conflictos voluntariamente** — es bloqueado con error 400
- ✅ La resolución automática **solo ocurre al eliminar horarios**, no al editarlos
- ✅ Los conflictos se detectan **en todas las fichas del instructor**, no solo en la ficha actual
- ✅ Se especificó claramente la estructura de la tabla `ConflictoHorario` y el formato de respuesta JSON

### Diferencias clave entre Caso 8 y versión original:
- ❌ **NO hay confirmación manual del instructor** — el sistema registra automáticamente
- ✅ La comparación en frontend es **solo para mostrar nombres instantáneamente**; el backend valida duplicados
- ✅ El cooldown de 5 segundos **evita re-registros accidentales**, no espera confirmación
- ✅ Se especificó el modo continuo (~3 fps) y los parámetros exactos del modelo (`inputSize: 160`, `scoreThreshold: 0.4`)
- ✅ Se agregaron flujos alternativos para enrolamiento de descriptor facial (por el aprendiz o por el instructor)
- ✅ Se listaron los archivos de modelos requeridos en `/public/models/`

---

**Versión:** 1.0 (Corregida)  
**Fecha:** Diciembre 2024  
**Proyecto:** Arachiz — Sistema de Gestión de Asistencia SENA
