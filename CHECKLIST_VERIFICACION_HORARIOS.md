# ✅ Checklist de Verificación - Sistema de Horarios

## 📋 Verificación Rápida (10 minutos)

### ✅ Funcionalidad Básica

- [ ] **Crear horario como Admin**
  - Ir a: Horarios → Ver por Ficha → Seleccionar Ficha → "Crear Materia"
  - Completar todos los campos y guardar
  - ✅ Debe crear exitosamente

- [ ] **Crear horario como Instructor**
  - Ir a: Mi Horario → Arrastrar materia al calendario
  - Completar horario y guardar
  - ✅ Debe crear exitosamente

- [ ] **Editar horario**
  - Activar "Modo Editar" → Clic en una clase
  - Cambiar día u horario → Guardar
  - ✅ Debe actualizar exitosamente

- [ ] **Mover horario (drag & drop)**
  - Arrastrar una clase a otro día
  - ✅ Debe aparecer spinner "Moviendo..."
  - ✅ Debe moverse exitosamente

- [ ] **Eliminar horario**
  - Activar "Enviar a Papelera" → Seleccionar clase
  - Confirmar eliminación
  - ✅ Debe eliminarse y enviarse a papelera

---

## ⚠️ Detección de Conflictos

### ✅ Conflictos en la Misma Ficha

- [ ] **Crear dos horarios solapados**
  - Crear materia A: Lunes 8:00-10:00
  - Crear materia B: Lunes 9:00-11:00 (mismo instructor)
  - ✅ Debe mostrar advertencia de conflicto
  - ✅ Ambas deben crearse exitosamente
  - ✅ Debe aparecer alerta de conflicto en Lunes

### ✅ Conflictos entre Fichas

- [ ] **Crear horarios en fichas diferentes**
  - Ficha 1: Materia A con Instructor X, Lunes 8:00-10:00
  - Ficha 2: Materia B con Instructor X, Lunes 9:00-11:00
  - ✅ Debe mostrar advertencia de conflicto
  - ✅ Ambas deben crearse exitosamente
  - ✅ Instructor X debe ver conflicto en su vista

### ✅ Conflicto al Asignar Instructor

- [ ] **Asignar instructor a materia con horarios**
  - Crear materia sin instructor con horario Martes 6:00-9:00
  - Asignar instructor que ya tiene clase Martes 8:00-10:00
  - ✅ Debe mostrar advertencia de conflicto
  - ✅ Debe asignarse exitosamente
  - ✅ Instructor debe ver conflicto en su vista

### ✅ Conflicto al Tomar Materia

- [ ] **Instructor toma materia con conflicto**
  - Materia sin instructor con horario Miércoles 10:00-12:00
  - Instructor ya tiene clase Miércoles 11:00-1:00
  - Intentar tomar la materia
  - ✅ Debe mostrar advertencia de conflicto
  - ✅ Debe permitir tomar la materia
  - ✅ Debe aparecer conflicto en Miércoles

### ✅ Conflicto al Editar Horario

- [ ] **Editar horario generando conflicto**
  - Tener dos materias en días diferentes
  - Editar una para que se solape con la otra
  - ✅ Debe mostrar advertencia de conflicto
  - ✅ Debe permitir la edición
  - ✅ Debe aparecer indicador de conflicto

### ✅ Conflicto al Mover Horario

- [ ] **Mover horario a día con conflicto**
  - Arrastrar materia del Jueves al Viernes (donde ya hay otra clase solapada)
  - ✅ Debe aparecer spinner
  - ✅ Debe moverse exitosamente
  - ✅ Debe mostrar advertencia de conflicto
  - ✅ Viernes debe tener borde rojo

---

## 🔄 Resolución de Conflictos

### ✅ Resolver Editando Horario

- [ ] **Editar horario para que no se solape**
  - Tener conflicto en Lunes (dos clases solapadas)
  - Editar una clase para que no se solape
  - ✅ Conflicto debe resolverse automáticamente
  - ✅ Borde rojo debe desaparecer
  - ✅ Contador de conflictos debe disminuir

### ✅ Resolver Moviendo Horario

- [ ] **Mover horario a otro día**
  - Tener conflicto en Martes
  - Arrastrar una clase a Miércoles
  - ✅ Conflicto debe resolverse automáticamente
  - ✅ Indicadores visuales deben actualizarse

### ✅ Resolver Eliminando Horario

- [ ] **Eliminar horario en conflicto**
  - Tener conflicto en Jueves
  - Eliminar una de las clases
  - ✅ Conflicto debe resolverse automáticamente
  - ✅ Alerta debe actualizarse o desaparecer

### ✅ Resolver Dejando Materia

- [ ] **Dejar materia que causa conflicto**
  - Instructor con conflicto
  - Dejar una de las materias en conflicto
  - ✅ Conflicto debe resolverse automáticamente

---

## 🎨 Indicadores Visuales

### ✅ Alerta de Conflictos

- [ ] **Alerta en la parte superior**
  - Tener al menos un conflicto
  - ✅ Debe aparecer alerta roja con contador
  - ✅ Debe mostrar lista de conflictos
  - ✅ Debe mostrar detalles (día, materias, horarios)

### ✅ Indicadores en Días

- [ ] **Borde rojo en días con conflictos**
  - Tener conflicto en un día específico
  - ✅ Columna del día debe tener borde rojo
  - ✅ Icono de alerta en encabezado del día

### ✅ Spinner de Carga

- [ ] **Spinner al mover horarios**
  - Arrastrar horario a otro día
  - ✅ Debe aparecer spinner en día de destino
  - ✅ Debe mostrar texto "Moviendo..."
  - ✅ Debe desaparecer al completar

### ✅ Toasts de Notificación

- [ ] **Toast de advertencia al generar conflicto**
  - Crear/editar horario con conflicto
  - ✅ Debe aparecer toast amarillo
  - ✅ Debe mostrar mensaje de advertencia

- [ ] **Toast de éxito al resolver conflicto**
  - Resolver un conflicto
  - ✅ Debe aparecer toast verde (opcional)

---

## 👥 Permisos y Roles

### ✅ Como Administrador

- [ ] **Crear horarios en cualquier ficha**
  - ✅ Puede crear en fichas que administra
  - ❌ No puede crear en fichas de otros admins

- [ ] **Editar horarios**
  - ✅ Puede editar horarios de sus fichas
  - ❌ No puede editar horarios de otras fichas

- [ ] **Asignar instructores**
  - ✅ Puede asignar cualquier instructor de la ficha
  - ✅ Detecta conflictos al asignar

- [ ] **Ver conflictos de instructores**
  - ✅ Puede ver conflictos de cualquier instructor de sus fichas

### ✅ Como Instructor

- [ ] **Crear horarios para sus materias**
  - ✅ Puede crear horarios para materias a su cargo
  - ❌ No puede crear para materias de otros instructores

- [ ] **Editar sus horarios**
  - ✅ Puede editar horarios de sus materias
  - ❌ No puede editar horarios de otros instructores

- [ ] **Tomar materias**
  - ✅ Puede tomar materias sin instructor de sus fichas
  - ✅ Detecta conflictos al tomar

- [ ] **Ver sus conflictos**
  - ✅ Ve todos sus conflictos en "Mi Horario"
  - ❌ No ve conflictos de otros instructores

---

## 🔍 Casos Extremos

### ✅ Múltiples Conflictos

- [ ] **Crear 3+ conflictos en el mismo día**
  - Crear 3 materias solapadas en Lunes
  - ✅ Debe detectar todos los conflictos
  - ✅ Contador debe mostrar número correcto
  - ✅ Alerta debe listar todos los conflictos

### ✅ Conflictos en Múltiples Días

- [ ] **Conflictos en diferentes días**
  - Crear conflictos en Lunes, Miércoles y Viernes
  - ✅ Todos los días deben tener borde rojo
  - ✅ Alerta debe mostrar todos los conflictos
  - ✅ Contador debe sumar todos

### ✅ Instructor con Múltiples Fichas

- [ ] **Instructor en 3+ fichas**
  - Asignar instructor a 3 fichas diferentes
  - Crear horarios en cada ficha
  - ✅ Debe detectar conflictos entre todas las fichas
  - ✅ Vista del instructor debe mostrar todas las materias

### ✅ Horarios Consecutivos

- [ ] **Horarios que terminan/empiezan al mismo tiempo**
  - Materia A: 8:00-10:00
  - Materia B: 10:00-12:00
  - ✅ NO debe detectar conflicto (son consecutivos)

### ✅ Horarios Idénticos

- [ ] **Dos horarios exactamente iguales**
  - Materia A: Lunes 8:00-10:00
  - Materia B: Lunes 8:00-10:00
  - ✅ Debe detectar conflicto
  - ✅ Debe permitir crear ambos

---

## 🐛 Verificación de Errores Corregidos

### ✅ Error 500 Corregido

- [ ] **Crear materia con conflicto entre fichas**
  - Ficha 1: Arduino con Instructor A, Lunes 8:00-11:00
  - Ficha 2: Emprendimiento con Instructor A, Lunes 10:00-1:00
  - ✅ NO debe generar error 500
  - ✅ Debe crear exitosamente con advertencia

### ✅ Conflictos No Detectados - Corregido

- [ ] **Asignar instructor a materia con horarios**
  - Materia sin instructor con horario existente
  - Asignar instructor que tiene conflicto
  - ✅ Debe detectar y notificar conflicto
  - ✅ Debe permitir asignación

### ✅ Instructores Bloqueados - Corregido

- [ ] **Instructor toma materia con conflicto**
  - Materia sin instructor con horario que genera conflicto
  - Instructor intenta tomar
  - ✅ NO debe bloquear la acción
  - ✅ Debe permitir tomar con advertencia

---

## 📱 Compatibilidad

### ✅ Navegadores

- [ ] **Chrome/Edge**
  - ✅ Drag & drop funciona
  - ✅ Spinner se muestra correctamente
  - ✅ Alertas se ven bien

- [ ] **Firefox**
  - ✅ Drag & drop funciona
  - ✅ Spinner se muestra correctamente
  - ✅ Alertas se ven bien

- [ ] **Safari** (si aplica)
  - ✅ Drag & drop funciona
  - ✅ Spinner se muestra correctamente
  - ✅ Alertas se ven bien

### ✅ Dispositivos

- [ ] **Desktop (1920x1080)**
  - ✅ Layout se ve correctamente
  - ✅ Drag & drop funciona

- [ ] **Tablet (768x1024)**
  - ✅ Layout responsive funciona
  - ✅ Drag & drop funciona

- [ ] **Mobile (375x667)**
  - ✅ Layout responsive funciona
  - ⚠️ Drag & drop puede ser difícil (esperado)

---

## 🔄 Flujos Completos

### ✅ Flujo 1: Admin Crea Conflicto

1. [ ] Admin crea Ficha 1 con Instructor A
2. [ ] Admin crea materia "Arduino" con horario Lunes 8:00-11:00
3. [ ] Admin crea materia "Matemáticas" sin instructor, horario Lunes 6:00-9:00
4. [ ] Admin asigna Instructor A a "Matemáticas"
5. [ ] ✅ Debe mostrar advertencia de conflicto
6. [ ] Instructor A ve conflicto en "Mi Horario"
7. [ ] ✅ Lunes tiene borde rojo
8. [ ] ✅ Alerta muestra "1 conflicto de horario"

### ✅ Flujo 2: Instructor Resuelve Conflicto

1. [ ] Instructor A tiene conflicto en Martes
2. [ ] Instructor activa "Modo Editar"
3. [ ] Instructor edita una materia para cambiar horario
4. [ ] ✅ Conflicto se resuelve automáticamente
5. [ ] ✅ Borde rojo desaparece
6. [ ] ✅ Alerta se actualiza o desaparece

### ✅ Flujo 3: Drag & Drop con Conflicto

1. [ ] Instructor tiene materias en Lunes y Miércoles
2. [ ] Instructor arrastra materia de Lunes a Miércoles (genera conflicto)
3. [ ] ✅ Aparece spinner en Miércoles
4. [ ] ✅ Materia se mueve exitosamente
5. [ ] ✅ Aparece toast de advertencia
6. [ ] ✅ Miércoles tiene borde rojo
7. [ ] ✅ Alerta se actualiza con nuevo conflicto

---

## 📊 Resumen de Verificación

### Funcionalidad Básica: __ / 5
- [ ] Crear horario
- [ ] Editar horario
- [ ] Mover horario
- [ ] Eliminar horario
- [ ] Ver horarios

### Detección de Conflictos: __ / 6
- [ ] Conflictos en misma ficha
- [ ] Conflictos entre fichas
- [ ] Conflicto al asignar instructor
- [ ] Conflicto al tomar materia
- [ ] Conflicto al editar
- [ ] Conflicto al mover

### Resolución de Conflictos: __ / 4
- [ ] Resolver editando
- [ ] Resolver moviendo
- [ ] Resolver eliminando
- [ ] Resolver dejando materia

### Indicadores Visuales: __ / 4
- [ ] Alerta de conflictos
- [ ] Borde rojo en días
- [ ] Spinner de carga
- [ ] Toasts de notificación

### Permisos: __ / 4
- [ ] Permisos de admin
- [ ] Permisos de instructor
- [ ] Restricciones correctas
- [ ] Detección en todas las operaciones

### Casos Extremos: __ / 5
- [ ] Múltiples conflictos
- [ ] Múltiples días
- [ ] Múltiples fichas
- [ ] Horarios consecutivos
- [ ] Horarios idénticos

### Errores Corregidos: __ / 3
- [ ] No error 500
- [ ] Conflictos detectados
- [ ] Instructores no bloqueados

---

## ✅ Criterios de Aceptación

### Mínimo para Producción:
- ✅ Funcionalidad Básica: 5/5
- ✅ Detección de Conflictos: 6/6
- ✅ Resolución de Conflictos: 4/4
- ✅ Errores Corregidos: 3/3

### Recomendado:
- ✅ Todo lo anterior +
- ✅ Indicadores Visuales: 4/4
- ✅ Permisos: 4/4
- ✅ Casos Extremos: 4/5

---

## 📝 Notas de Verificación

**Fecha de verificación:** _______________

**Verificado por:** _______________

**Navegador usado:** _______________

**Problemas encontrados:**
```
1. 
2. 
3. 
```

**Observaciones:**
```


```

**Estado final:** 
- [ ] ✅ Aprobado para producción
- [ ] ⚠️ Aprobado con observaciones
- [ ] ❌ Requiere correcciones

---

**Versión:** 2.0  
**Fecha:** Mayo 2026  
**Autor:** Sistema de Gestión de Horarios - Arachiz Inc.
