# Correcciones en Juegos de la Plataforma

## Fecha: 27 de abril de 2026

---

## 1. ✅ Instructores Incluidos en el Ranking

### Problema:
Los instructores podían ver el ranking, pero no aparecían dentro de la lista. Solo se mostraban los aprendices.

### Causa:
Los endpoints de leaderboard filtraban usuarios únicamente por `fichasApr` (relación de aprendices), excluyendo a los instructores que tienen sus fichas en `fichasInst`.

### Solución Implementada:
- **Archivos modificados**: 
  - `backend/routes/snakeRoutes.js`
  - `backend/routes/gamesRoutes.js`

- **Cambios realizados**:
  1. Modificado el filtro `where` para incluir ambas relaciones
  2. Ahora usa operador `OR` para buscar en `fichasApr` y `fichasInst`
  3. Los instructores ahora aparecen en el ranking junto con los aprendices

### Código modificado:
```javascript
// Antes:
const where = fichaId 
  ? { user: { fichasApr: { some: { id: fichaId } } } } 
  : undefined;

// Después:
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

### Juegos afectados:
- ✅ El Gusanito (Snake)
- ✅ La Bolita (Breakout)
- ✅ El Maní (Flappy)
- ✅ Tower Stack
- ✅ Reaction Time
- ✅ Memory Flash
- ✅ Wordle

---

## 2. ✅ Botón de "El Maní" Corregido para iPhone

### Problema:
En iPhone, al mantener presionado el botón de control (🥜), iOS lo detectaba como texto y mostraba opciones como "Copiar" o "Buscar en Google".

### Causa:
Faltaban propiedades CSS específicas de WebKit para deshabilitar la selección de texto y el menú contextual en iOS.

### Solución Implementada:
- **Archivo modificado**: `frontend/src/pages/Configuracion.jsx`

- **Cambios realizados**:
  1. Agregadas propiedades CSS específicas para iOS:
     - `WebkitUserSelect: 'none'`
     - `WebkitTouchCallout: 'none'`
     - `WebkitTapHighlightColor: 'transparent'`
  2. Agregado `onContextMenu` para prevenir menú contextual
  3. Agregados eventos `onTouchStart` y `onTouchEnd` específicos para touch
  4. El emoji ahora está dentro de un `<span>` con `pointerEvents: 'none'`

### Código agregado:
```javascript
<button 
  onTouchStart={e=>{e.preventDefault();...}}
  onTouchEnd={e=>{e.preventDefault();...}}
  onContextMenu={e=>e.preventDefault()}
  style={{
    WebkitUserSelect: 'none',
    userSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitTapHighlightColor: 'transparent',
  }}>
  <span style={{
    pointerEvents: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  }}>🥜</span>
</button>
```

---

## 3. ✅ Emoji del Maní Mejorado en iPhone

### Problema:
El emoji del maní (🥜) no se visualizaba correctamente en iPhone - no se distinguía bien qué emoji era.

### Causa:
El tamaño de fuente era demasiado pequeño (28px) y faltaba el modificador `bold` para mejor renderizado en iOS.

### Solución Implementada:
- **Archivo modificado**: `frontend/src/pages/Configuracion.jsx`

- **Cambios realizados**:
  1. Aumentado el tamaño de fuente de 28px a 32px
  2. Agregado `bold` a la fuente para mejor renderizado
  3. Mantenida la fuente específica para emojis de Apple

### Código modificado:
```javascript
// Antes:
ctx.font = '28px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// Después:
ctx.font = 'bold 32px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
```

### Resultado:
- ✅ El emoji ahora se ve más grande y claro en iPhone
- ✅ Mejor contraste y definición
- ✅ Mantiene compatibilidad con otros dispositivos

---

## 4. ✅ Validación de Palabras Reales en Wordle

### Problema:
El juego Wordle aceptaba cualquier combinación de letras, incluso palabras sin sentido que no existen en español.

### Causa:
No había validación contra el diccionario de palabras válidas antes de aceptar un intento.

### Solución Implementada:
- **Archivo modificado**: `frontend/src/games/WordleGame.jsx`

- **Cambios realizados**:
  1. Agregada validación en la función `submit()`
  2. Verifica que la palabra ingresada existe en `WORD_LISTS[wordLength]`
  3. Si la palabra no es válida:
     - Activa animación de shake
     - Muestra mensaje temporal "❌ Palabra no válida"
     - No consume el intento
  4. Solo acepta palabras que están en el diccionario

### Código agregado:
```javascript
// Validar que la palabra existe en el diccionario
const validWords = WORD_LISTS[wordLength] || WORD_LISTS[5];
if (!validWords.includes(current)) {
  setShake(true);
  setTimeout(() => setShake(false), 500);
  // Mostrar mensaje de error temporal
  const errorMsg = document.createElement('div');
  errorMsg.textContent = '❌ Palabra no válida';
  errorMsg.style.cssText = '...';
  document.body.appendChild(errorMsg);
  setTimeout(() => errorMsg.remove(), 1500);
  return;
}
```

### Diccionarios disponibles:
- ✅ 4 letras: 60 palabras válidas
- ✅ 5 letras: 145 palabras válidas
- ✅ 6 letras: 75 palabras válidas

---

## Archivos Modificados

### Backend:
1. `backend/routes/snakeRoutes.js` - Leaderboards de Snake, Breakout y Flappy
2. `backend/routes/gamesRoutes.js` - Leaderboard genérico para todos los juegos

### Frontend:
1. `frontend/src/pages/Configuracion.jsx` - Botón y emoji de "El Maní"
2. `frontend/src/games/WordleGame.jsx` - Validación de palabras

---

## Pruebas Recomendadas

### Para Ranking de Instructores:
1. ✅ Iniciar sesión como instructor
2. ✅ Jugar cualquier juego y obtener puntuación
3. ✅ Verificar que el instructor aparece en el ranking
4. ✅ Confirmar que se mezcla correctamente con aprendices

### Para Botón de "El Maní" en iPhone:
1. ✅ Abrir el juego en iPhone
2. ✅ Mantener presionado el botón 🥜
3. ✅ Verificar que NO aparece menú de "Copiar" o "Buscar"
4. ✅ Confirmar que el botón funciona correctamente

### Para Emoji del Maní en iPhone:
1. ✅ Abrir el juego en iPhone
2. ✅ Verificar que el emoji 🥜 se ve claro y grande
3. ✅ Confirmar que se distingue bien durante el juego

### Para Validación de Wordle:
1. ✅ Abrir el juego Wordle
2. ✅ Intentar ingresar una palabra inventada (ej: "XYZQW")
3. ✅ Verificar que muestra "❌ Palabra no válida"
4. ✅ Confirmar que no consume el intento
5. ✅ Probar con palabra válida y verificar que funciona

---

## Notas Importantes

- ⚠️ **Compatibilidad iOS**: Los cambios en el botón son específicos para WebKit/Safari
- ✅ **Sin breaking changes**: Todas las correcciones son retrocompatibles
- ✅ **Rendimiento**: Sin impacto negativo en performance
- ✅ **Base de datos**: No se modificó el esquema, solo consultas

---

## Resumen

✅ **Instructores en ranking**: Ahora aparecen en todos los leaderboards
✅ **Botón de El Maní**: Funciona correctamente en iPhone sin menú contextual
✅ **Emoji del maní**: Se visualiza más grande y claro en iPhone
✅ **Wordle**: Solo acepta palabras reales del diccionario

Todas las correcciones fueron implementadas de manera cuidadosa, respetando el código existente y mejorando la experiencia de usuario.
