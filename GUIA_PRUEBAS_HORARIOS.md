# Guía de Pruebas - Sistema de Horarios y Conflictos

## 📋 Índice
1. [Resumen de Cambios](#resumen-de-cambios)
2. [Escenarios de Prueba](#escenarios-de-prueba)
3. [Casos de Uso por Rol](#casos-de-uso-por-rol)
4. [Verificación de Conflictos](#verificación-de-conflictos)
5. [Resolución de Problemas](#resolución-de-problemas)

---

## 🔄 Resumen de Cambios

### Problemas Resueltos:
1. ✅ **Error 500 al crear materias con conflictos entre fichas** - Ahora se permite la creación con advertencia
2. ✅ **Conflictos no detectados al asignar instructor** - Ahora se detectan y notifican correctamente
3. ✅ **Falta de feedback visual al mover horarios** - Agregado spinner de carga
4. ✅ **Instructores bloqueados al generar conflictos** - Ahora pueden generar conflictos con advertencia

### Comportamiento Actual:
- **Todos los usuarios** (admin e instructores) pueden generar conflictos
- Los conflictos se **notifican pero no bloquean** las operaciones
- Los conflictos se **registran en la base de datos** y se muestran en la interfaz
- Los conflictos se **resuelven automáticamente** cuando se ajustan los horarios

---

## 🧪 Escenarios de Prueba

### Escenario 1: Conflicto al asignar instructor a materia existente
**Objetivo:** Verificar que se detectan conflictos cuando un admin asigna un instructor a una materia que ya tiene horarios.

**Pasos:**
1. Como **Admin**, ir a la vista de Horarios
2. Seleccionar "Ver por Ficha" → Elegir **Ficha 1**
3. Crear una materia **"Matemáticas"** sin instructor asignado
4. Agregar horario: **Lunes 6:00 AM - 9:00 AM**
5. Volver y seleccionar **Ficha 1** nuevamente
6. Crear otra materia **"Arduino"** con **Instructor A**
7. Agregar horario: **Lunes 8:00 AM - 11:00 AM**
8. Ir a la lista de materias de Ficha 1
9. Editar **"Matemáticas"** y asignar **Instructor A**

**Resultado Esperado:**
- ✅ La materia se asigna exitosamente
- ✅ Aparece advertencia: "Se detectaron conflictos de horario"
- ✅ El conflicto muestra: "Arduino (8:00 - 11:00) en Ficha 1"
- ✅ Al ver horarios del Instructor A, aparece alerta de conflicto en Lunes

---

### Escenario 2: Conflicto entre fichas diferentes
**Objetivo:** Verificar que se detectan conflictos cuando un instructor tiene horarios en diferentes fichas.

**Pasos:**
1. Como **Admin**, crear **Ficha 1** y **Ficha 2**
2. Agregar **Instructor A** a ambas fichas
3. En **Ficha 1**: Crear materia "Arduino" con Instructor A, horario **Lunes 8:00 AM - 11:00 AM**
4. En **Ficha 2**: Intentar crear materia "Emprendimiento" con Instructor A, horario **Lunes 10:00 AM - 1:00 PM**

**Resultado Esperado:**
- ✅ La materia se crea exitosamente (no error 500)
- ✅ Aparece advertencia de conflicto
- ✅ El conflicto indica: "Arduino (8:00 - 11:00) en Ficha 1"
- ✅ Al ver horarios del Instructor A, se muestran ambas materias con indicador de conflicto

---

### Escenario 3: Instructor toma materia con conflicto
**Objetivo:** Verificar que un instructor puede tomar una materia aunque genere conflictos.

**Pasos:**
1. Como **Admin**, crear materia **"Matemáticas"** sin instructor en Ficha 1
2. Agregar horario: **Martes 6:00 AM - 9:00 AM**
3. Como **Instructor A**, tener ya una materia con horario **Martes 8:00 AM - 10:00 AM**
4. Como **Instructor A**, ir a la lista de materias de Ficha 1
5. Hacer clic en "Matemáticas" → "Tomar a Cargo"

**Resultado Esperado:**
- ✅ La materia se asigna exitosamente
- ✅ Aparece advertencia: "Se generaron conflictos de horario. Puedes resolverlos en tu pestaña de horarios."
- ✅ En la vista de Horarios del instructor, aparece alerta de conflicto en Martes
- ✅ Ambas materias se muestran en el calendario con indicador visual

---

### Escenario 4: Mover horario con drag & drop
**Objetivo:** Verificar el spinner de carga y detección de conflictos al mover horarios.

**Pasos:**
1. Como **Instructor**, ir a "Mi Horario"
2. Tener al menos 2 materias con horarios en días diferentes
3. Arrastrar una materia del **Lunes** al **Martes** (donde ya hay otra clase)

**Resultado Esperado:**
- ✅ Aparece spinner "Moviendo..." en la columna de Martes
- ✅ La materia se mueve exitosamente
- ✅ Si hay conflicto, aparece toast de advertencia
- ✅ La columna de Martes muestra indicador de conflicto (borde rojo)
- ✅ Se recarga automáticamente la lista de conflictos

---

### Escenario 5: Editar horario generando conflicto
**Objetivo:** Verificar que un instructor puede editar horarios aunque genere conflictos.

**Pasos:**
1. Como **Instructor**, ir a "Mi Horario"
2. Activar "Modo Editar"
3. Hacer clic en una materia del **Miércoles 10:00 AM - 12:00 PM**
4. Cambiar el horario a **Miércoles 9:00 AM - 11:00 AM** (donde ya hay otra clase de 8:00 AM - 10:00 AM)
5. Guardar cambios

**Resultado Esperado:**
- ✅ El horario se actualiza exitosamente
- ✅ Aparece advertencia de conflicto
- ✅ La columna de Miércoles muestra indicador de conflicto
- ✅ Aparece alerta en la parte superior con detalles del conflicto

---

### Escenario 6: Resolver conflicto ajustando horarios
**Objetivo:** Verificar que los conflictos se resuelven automáticamente.

**Pasos:**
1. Como **Instructor**, tener un conflicto en Jueves (dos materias solapadas)
2. Activar "Modo Editar"
3. Editar una de las materias para que no se solape (ej: cambiar de 8:00-10:00 a 10:00-12:00)
4. Guardar cambios

**Resultado Esperado:**
- ✅ El horario se actualiza
- ✅ El indicador de conflicto desaparece de la columna de Jueves
- ✅ La alerta de conflictos se actualiza (disminuye el contador)
- ✅ Si era el único conflicto, la alerta desaparece completamente

---

### Escenario 7: Admin crea múltiples conflictos
**Objetivo:** Verificar que el admin puede forzar múltiples conflictos.

**Pasos:**
1. Como **Admin**, ir a "Gestión de Horarios" → "Ver por Instructor"
2. Seleccionar **Instructor A**
3. Crear 3 materias diferentes con horarios solapados en el mismo día:
   - Materia 1: Lunes 8:00 AM - 10:00 AM
   - Materia 2: Lunes 9:00 AM - 11:00 AM
   - Materia 3: Lunes 10:00 AM - 12:00 PM

**Resultado Esperado:**
- ✅ Todas las materias se crean exitosamente
- ✅ Aparecen advertencias en cada creación
- ✅ La alerta de conflictos muestra "3 conflicto(s) de horario"
- ✅ La columna de Lunes tiene borde rojo
- ✅ El instructor ve todos los conflictos en su vista

---

### Escenario 8: Eliminar horario que causa conflicto
**Objetivo:** Verificar que eliminar un horario puede resolver conflictos.

**Pasos:**
1. Como **Instructor**, tener un conflicto en Viernes
2. Activar "Enviar a Papelera"
3. Seleccionar una de las materias en conflicto
4. Confirmar eliminación

**Resultado Esperado:**
- ✅ El horario se elimina
- ✅ Si se resuelve el conflicto, el indicador desaparece
- ✅ La alerta de conflictos se actualiza
- ✅ El horario va a la papelera (puede recuperarse)

---

## 👥 Casos de Uso por Rol

### Como Administrador:

#### 1. Crear Materia con Horario
**Ruta:** Horarios → Ver por Ficha → Seleccionar Ficha → "Crear Materia"
- Completa: Nombre, Tipo, Instructor, Día, Hora Inicio, Hora Fin
- **Conflictos:** Se detectan y notifican, pero se permite crear

#### 2. Agregar Materia Existente al Horario
**Ruta:** Horarios → Ver por Ficha → Seleccionar Ficha → "Agregar Existente"
- Selecciona materia, día y horario
- **Conflictos:** Se detectan y notifican

#### 3. Asignar Instructor a Materia
**Ruta:** Fichas → Seleccionar Ficha → Materias → Editar Materia → Cambiar Instructor
- **Conflictos:** Se detectan si la materia tiene horarios

#### 4. Editar Horario
**Ruta:** Horarios → Ver por Ficha/Instructor → Modo Editar → Clic en clase
- **Conflictos:** Se detectan y notifican

#### 5. Ver Conflictos de Instructor
**Ruta:** Horarios → Ver por Instructor → Seleccionar Instructor
- Muestra alerta roja con todos los conflictos
- Días con conflictos tienen borde rojo

---

### Como Instructor:

#### 1. Tomar Materia sin Instructor
**Ruta:** Materias → Seleccionar Materia → "Tomar a Cargo"
- **Conflictos:** Se detectan si la materia tiene horarios, pero se permite tomar

#### 2. Crear Horario para Mi Materia
**Ruta:** Mi Horario → Arrastrar materia al calendario → Completar horario
- **Conflictos:** Se detectan y notifican

#### 3. Editar Mi Horario
**Ruta:** Mi Horario → Modo Editar → Clic en clase → Modificar
- **Conflictos:** Se detectan y notifican

#### 4. Mover Horario (Drag & Drop)
**Ruta:** Mi Horario → Arrastrar clase a otro día
- **Conflictos:** Se detectan automáticamente
- **Feedback:** Spinner mientras procesa

#### 5. Ver Mis Conflictos
**Ruta:** Mi Horario (alerta en la parte superior)
- Muestra todos los conflictos activos
- Días con conflictos tienen borde rojo

#### 6. Resolver Conflictos
**Opciones:**
- Editar horarios para que no se solapen
- Mover clases a otros días
- Eliminar horarios duplicados
- Dejar materias que causan conflictos

---

## ⚠️ Verificación de Conflictos

### Indicadores Visuales:

#### En la Vista de Horarios:
- 🔴 **Borde rojo** en columnas de días con conflictos
- ⚠️ **Icono de alerta** en el encabezado del día
- 🔔 **Alerta roja** en la parte superior con contador de conflictos

#### En las Notificaciones:
- ⚠️ **Toast amarillo** (warning) cuando se genera un conflicto
- ✅ **Toast verde** (success) cuando se resuelve un conflicto
- ❌ **Toast rojo** (error) solo para errores reales (no conflictos)

#### Durante Operaciones:
- 🔄 **Spinner** al mover horarios con drag & drop
- 💾 **"Guardando..."** al editar horarios
- ➕ **"Agregando..."** al crear horarios

---

## 🔧 Resolución de Problemas

### Problema: No veo los conflictos en mi horario
**Solución:**
1. Refresca la página (F5)
2. Verifica que estés viendo la ficha correcta (si tienes múltiples fichas)
3. Revisa la alerta en la parte superior de "Mi Horario"

### Problema: El spinner no desaparece al mover horarios
**Solución:**
1. Espera unos segundos (puede haber latencia de red)
2. Si persiste más de 10 segundos, refresca la página
3. Verifica tu conexión a internet

### Problema: No puedo crear un horario
**Solución:**
1. Verifica que la materia tenga un instructor asignado
2. Verifica que las horas sean válidas (hora fin > hora inicio)
3. Si hay conflictos, revisa el mensaje de advertencia (no es un error)

### Problema: Los conflictos no se resuelven automáticamente
**Solución:**
1. Verifica que realmente no haya solapamiento de horarios
2. Refresca la página para actualizar el estado
3. Revisa que el conflicto sea del mismo día que ajustaste

### Problema: Error 500 al crear horarios
**Solución:**
1. Este error ya fue corregido, actualiza el código
2. Verifica que el backend esté corriendo
3. Revisa los logs del servidor para más detalles

---

## 📊 Matriz de Pruebas

| Operación | Admin | Instructor | Detecta Conflictos | Permite Operación | Notifica |
|-----------|-------|------------|-------------------|-------------------|----------|
| Crear horario | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar horario | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mover horario (drag) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Asignar instructor | ✅ | ❌ | ✅ | ✅ | ✅ |
| Tomar materia | ❌ | ✅ | ✅ | ✅ | ✅ |
| Cambiar instructor | ✅ | ❌ | ✅ | ✅ | ✅ |
| Eliminar horario | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Checklist de Pruebas Completas

### Funcionalidad Básica:
- [ ] Crear materia con horario (admin)
- [ ] Agregar materia existente al horario (admin)
- [ ] Crear horario para mi materia (instructor)
- [ ] Editar horario (admin e instructor)
- [ ] Mover horario con drag & drop (instructor)
- [ ] Eliminar horario (admin e instructor)

### Detección de Conflictos:
- [ ] Conflicto en la misma ficha
- [ ] Conflicto entre fichas diferentes
- [ ] Conflicto al asignar instructor
- [ ] Conflicto al tomar materia
- [ ] Conflicto al editar horario
- [ ] Conflicto al mover horario

### Resolución de Conflictos:
- [ ] Editar horario para resolver conflicto
- [ ] Mover horario para resolver conflicto
- [ ] Eliminar horario para resolver conflicto
- [ ] Dejar materia para resolver conflicto
- [ ] Indicadores visuales se actualizan correctamente

### Feedback Visual:
- [ ] Spinner al mover horarios
- [ ] Alerta de conflictos en la parte superior
- [ ] Borde rojo en días con conflictos
- [ ] Toasts de advertencia al generar conflictos
- [ ] Toasts de éxito al resolver conflictos

### Casos Extremos:
- [ ] Múltiples conflictos en el mismo día
- [ ] Conflictos en múltiples días
- [ ] Crear conflicto y resolverlo inmediatamente
- [ ] Instructor con materias en 3+ fichas
- [ ] Horarios que se solapan parcialmente

---

## 📝 Notas Finales

### Comportamiento Esperado:
- **Los conflictos NO bloquean operaciones** - Son advertencias, no errores
- **Todos pueden generar conflictos** - Admin e instructores
- **Los conflictos se registran** - En la base de datos para seguimiento
- **Los conflictos se resuelven automáticamente** - Al ajustar horarios

### Mejores Prácticas:
1. **Como Admin:** Revisa los horarios del instructor antes de asignar materias
2. **Como Instructor:** Revisa tus conflictos regularmente en "Mi Horario"
3. **Resolución:** Ajusta horarios lo antes posible para evitar confusión
4. **Comunicación:** Los conflictos son visibles para facilitar la coordinación

### Próximos Pasos:
- Considera agregar notificaciones por email cuando se generan conflictos
- Implementar sugerencias automáticas de horarios disponibles
- Agregar vista de calendario mensual para mejor visualización
- Permitir comentarios en conflictos para coordinación entre admin e instructores

---

**Fecha de última actualización:** Mayo 2026
**Versión del sistema:** 2.0
**Autor:** Sistema de Gestión de Horarios - Arachiz Inc.
