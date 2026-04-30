# Debug: Ranking de Instructores

## Fecha: 27 de abril de 2026

---

## Problema Reportado

Los instructores no aparecen en el ranking (top) de los juegos, aunque ya se corrigió el backend para incluirlos.

**Juegos afectados:**
- El Gusanito (Snake)
- La Bolita (Breakout)
- El Maní (Flappy)
- Revienta (Reaction Time)
- Wordle
- Memory Flash
- El Pastel (Tower Stack)

---

## Cambios Implementados

### 1. Corrección de Endpoints de Leaderboard

**Archivos modificados:**
- `backend/routes/snakeRoutes.js`
- `backend/routes/gamesRoutes.js`
- `backend/controllers/authController.js`

**Cambio principal:**
```javascript
// ANTES - Solo aprendices
const where = fichaId 
  ? { user: { fichasApr: { some: { id: fichaId } } } } 
  : undefined;

// DESPUÉS - Aprendices e instructores
const where = fichaId 
  ? { 
      user: { 
        OR: [
          { fichasApr: { some: { id: fichaId } } },
          { fichasInst: { some: { fichaId: fichaId } } }
        ]
      } 
    } 
  : undefined;
```

### 2. Logs de Debugging Agregados

Se agregaron logs detallados en todos los endpoints para facilitar el debugging:

**En `/auth/me`:**
```javascript
console.log('👤 User Profile:', { 
  userId, fullName, userType,
  fichasApr, fichasInst, finalFichaId 
});
```

**En leaderboards:**
```javascript
console.log('🔍 [GAME] Leaderboard Query:', { fichaId, where });
console.log('✅ [GAME] Scores Found:', scores.length, scores.map(...));
```

### 3. Corrección de Exportación Duplicada

Se eliminó un `module.exports` duplicado en `snakeRoutes.js` que podía causar problemas.

---

## Cómo Probar

### Paso 1: Verificar que el Instructor tiene fichaId

1. Iniciar sesión como instructor
2. Abrir DevTools del navegador (F12)
3. Ir a la pestaña "Network"
4. Recargar la página
5. Buscar la petición a `/api/auth/me`
6. Verificar que la respuesta incluye `fichaId` con un valor válido

**Respuesta esperada:**
```json
{
  "user": {
    "id": "...",
    "fullName": "Nombre Instructor",
    "userType": "instructor",
    "fichaId": "clxxx..." // ← Debe tener un valor
  }
}
```

### Paso 2: Verificar Logs del Backend

1. Abrir la terminal donde corre el backend
2. Iniciar sesión como instructor
3. Buscar el log: `👤 User Profile:`
4. Verificar que muestra:
   - `userType: 'instructor'`
   - `fichasInst: [{ fichaId: '...' }]`
   - `finalFichaId: '...'` (no null)

**Log esperado:**
```
👤 User Profile: {
  userId: 'clxxx...',
  fullName: 'Nombre Instructor',
  userType: 'instructor',
  fichasApr: [],
  fichasInst: [ { fichaId: 'clyyy...' } ],
  finalFichaId: 'clyyy...'
}
```

### Paso 3: Jugar y Verificar Score

1. Como instructor, jugar cualquier juego
2. Obtener una puntuación
3. Verificar en los logs del backend:
   - `✅ [GAME] Scores Found: X`
   - Debe incluir al instructor en la lista

### Paso 4: Verificar Ranking en el Frontend

1. Abrir el ranking del juego
2. Verificar que el instructor aparece en la lista
3. Verificar que su puntuación es correcta

---

## Posibles Problemas y Soluciones

### Problema 1: fichaId es null para el instructor

**Causa:** El instructor no está asociado a ninguna ficha en la tabla `FichaInstructor`.

**Solución:**
1. Verificar en la base de datos:
```sql
SELECT * FROM "FichaInstructor" WHERE "instructorId" = 'ID_DEL_INSTRUCTOR';
```

2. Si no hay registros, el instructor debe unirse a una ficha primero.

### Problema 2: El instructor aparece en los logs pero no en el ranking

**Causa:** El instructor no tiene puntuación guardada en la tabla del juego.

**Solución:**
1. Verificar en la base de datos:
```sql
SELECT * FROM "SnakeScore" WHERE "userId" = 'ID_DEL_INSTRUCTOR';
```

2. Jugar el juego para generar una puntuación.

### Problema 3: Error en la consulta de Prisma

**Causa:** La estructura de la consulta OR puede tener problemas de sintaxis.

**Solución:**
1. Revisar los logs de error en el backend
2. Verificar que la consulta se está construyendo correctamente
3. Probar la consulta directamente en Prisma Studio

---

## Verificación de la Base de Datos

### Verificar relación FichaInstructor

```sql
-- Ver todos los instructores y sus fichas
SELECT 
  u.id as instructor_id,
  u."fullName" as instructor_name,
  fi."fichaId",
  f.numero as ficha_numero
FROM "User" u
LEFT JOIN "FichaInstructor" fi ON u.id = fi."instructorId"
LEFT JOIN "Ficha" f ON fi."fichaId" = f.id
WHERE u."userType" = 'instructor';
```

### Verificar scores del instructor

```sql
-- Ver scores de un instructor específico
SELECT 
  u."fullName",
  u."userType",
  ss.score as snake_score,
  bs.score as breakout_score,
  fs.score as flappy_score
FROM "User" u
LEFT JOIN "SnakeScore" ss ON u.id = ss."userId"
LEFT JOIN "BreakoutScore" bs ON u.id = bs."userId"
LEFT JOIN "FlappyScore" fs ON u.id = fs."userId"
WHERE u.id = 'ID_DEL_INSTRUCTOR';
```

---

## Próximos Pasos

1. **Reiniciar el servidor backend** para que los cambios tomen efecto
2. **Limpiar caché del navegador** (Ctrl+Shift+Delete)
3. **Probar con un instructor que pertenezca a una ficha**
4. **Revisar los logs del backend** mientras se prueba
5. **Verificar la base de datos** si el problema persiste

---

## Comandos Útiles

### Reiniciar el backend
```bash
cd backend
npm run dev
```

### Ver logs en tiempo real
```bash
# Los logs aparecerán automáticamente en la terminal del backend
# Buscar por los emojis: 👤 🔍 ✅ ❌
```

### Limpiar localStorage del navegador
```javascript
// En la consola del navegador
localStorage.clear();
location.reload();
```

---

## Resumen de Cambios

✅ **Backend actualizado** - Incluye instructores en consultas OR
✅ **Logs agregados** - Para debugging detallado
✅ **Exportación corregida** - Eliminado module.exports duplicado
✅ **Endpoint /auth/me** - Devuelve fichaId para instructores

**El código está listo. Ahora necesita ser probado con un instructor real que pertenezca a una ficha.**
