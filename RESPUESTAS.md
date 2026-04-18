# 📝 Respuestas a tus Preguntas

## 1. 🎮 ¿Dónde salen las palabras del Wordle?

Las palabras del Wordle están definidas en el archivo:

**📁 Ubicación**: `frontend/src/games/WordleGame.jsx`

**📍 Líneas**: 6-26

### Lista de Palabras (WORD_LIST)

```javascript
const WORD_LIST = [
  'FICHA', 'SABER', 'MUNDO', 'LUGAR', 'TIEMPO', 'FORMA', 'PARTE', 'GRUPO', 'PUNTO', 'ORDEN',
  'CAMPO', 'MEDIO', 'NIVEL', 'VALOR', 'FUERZA', 'CLASE', 'CURSO', 'GRADO', 'MARCO', 'PAPEL',
  'PLANO', 'RADIO', 'RANGO', 'RITMO', 'SALUD', 'SIGNO', 'TAREA', 'TEXTO', 'VISTA', 'VUELO',
  'AGUA', 'AIRE', 'AMOR', 'ARTE', 'BIEN', 'CASA', 'DATO', 'EDAD', 'FASE', 'GATO', 'HORA',
  'IDEA', 'LADO', 'MESA', 'NOTA', 'OBRA', 'PASO', 'PESO', 'PLAN', 'RAMA', 'SALA', 'TEMA',
  'TIPO', 'VIDA', 'ZONA', 'ABRIL', 'ACTOR', 'ALBUM', 'ANGEL', 'ARENA', 'AUDIO', 'BAILE',
  'BANCO', 'BARCO', 'BARRO', 'BEBER', 'BELLO', 'BESAR', 'BLANCO', 'BORDE', 'BRAZO', 'BREVE',
  'BUENO', 'CABLE', 'CAMPO', 'CARNE', 'CARTA', 'CERRO', 'CHICO', 'CIELO', 'CINCO', 'CLIMA',
  'COLOR', 'CREER', 'CRUEL', 'CUERO', 'DANZA', 'DEBER', 'DECIR', 'DIENTE', 'DOLOR', 'DULCE',
  'DURAR', 'ENERO', 'ERROR', 'ESTAR', 'FALTA', 'FECHA', 'FELIZ', 'FINAL', 'FLOR', 'FONDO',
  'FORMA', 'FRUTA', 'FUEGO', 'GENTE', 'GOLPE', 'GRANO', 'GRAVE', 'GRUPO', 'GUSTO', 'HACER',
  'HACIA', 'HECHO', 'HIELO', 'HOMBRE', 'HONOR', 'HOTEL', 'HUESO', 'HUMOR', 'IGUAL', 'IMAGEN',
  'JUNTO', 'LARGO', 'LECHE', 'LETRA', 'LIBRO', 'LIGHT', 'LINEA', 'LLAMA', 'LLENO', 'LUGAR',
  'MADRE', 'MAYOR', 'MEDIO', 'MENOR', 'METAL', 'METRO', 'MIEDO', 'MOVER', 'MUCHO', 'MUNDO',
  'MUSICA', 'NACER', 'NEGRO', 'NIVEL', 'NOCHE', 'NORTE', 'NUEVO', 'OCEAN', 'ORDEN', 'PADRE',
  'PAPEL', 'PARTE', 'PASAR', 'PEACE', 'PECHO', 'PERRO', 'PIANO', 'PIEZA', 'PLATA', 'PLAZA',
  'PODER', 'PUNTO', 'QUESO', 'RADIO', 'RAPIDO', 'REINO', 'RESTO', 'RITMO', 'ROBOT', 'SALIR',
  'SALUD', 'SANTO', 'SERIO', 'SIGLO', 'SOBRE', 'SOLAR', 'SUELO', 'SUEÑO', 'TABLA', 'TANTO',
  'TARDE', 'TECHO', 'TEXTO', 'TIERRA', 'TOTAL', 'TRAJE', 'TRATO', 'TURNO', 'ULTIMO', 'UNION',
  'VERDE', 'VIAJE', 'VIENTO', 'VISTA', 'VIVIR', 'VUELO', 'ZEBRA', 'ZORRO'
];
```

### 📊 Estadísticas:
- **Total de palabras**: ~200 palabras
- **Longitud**: 5 letras cada una
- **Idioma**: Español
- **Categorías**: Palabras comunes y sustantivos

### 🔄 Cómo funciona:

1. **Palabra del día**: Se genera una palabra diferente para cada usuario cada día
2. **Algoritmo**: Usa un hash basado en el ID del usuario + fecha
3. **Función**: `getDailyWord(userId, date)` (línea 29)

```javascript
const getDailyWord = (userId, date) => {
  const seed = `${userId}-${date}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % WORD_LIST.length;
  return WORD_LIST[index];
};
```

### ✏️ Cómo agregar más palabras:

1. Abre el archivo: `frontend/src/games/WordleGame.jsx`
2. Busca la constante `WORD_LIST` (línea 6)
3. Agrega tus palabras de 5 letras en mayúsculas
4. Ejemplo:
```javascript
const WORD_LIST = [
  'FICHA', 'SABER', 'MUNDO', // ... palabras existentes
  'NUEVA', 'EXTRA', 'BONUS'  // ← Tus nuevas palabras aquí
];
```

### 🎯 Cómo acceder al juego:

1. Ve a **Configuración**
2. Haz **7 clicks rápidos** en el texto "El correo no puede modificarse"
3. Se abrirá el juego Wordle

---

## 2. 💳 Pagos Reales Habilitados

He revertido los cambios para que **todos los usuarios (incluyendo instructores) puedan pagar de verdad**.

### ✅ Cambios Realizados:

#### Backend (`backend/controllers/skinController.js`):
- ✅ **Eliminado** el bloqueo de compras para instructores
- ✅ **Restaurado** el flujo normal de pagos con Mercado Pago
- ✅ Todos los usuarios pueden crear órdenes de compra

#### Frontend (`frontend/src/components/SnakeShop.jsx`):
- ✅ **Eliminado** el mensaje "Acceso VIP" para instructores
- ✅ **Restaurado** el botón "💳 Comprar" para todos
- ✅ Los precios se muestran normalmente

### 🎁 Beneficios para Instructores:

Los instructores **siguen teniendo ventajas**:

1. ✅ **Desbloqueo automático al registrarse**: Reciben todas las skins gratis
2. ✅ **Desbloqueo automático al abrir la tienda**: Si les falta alguna skin, se desbloquea
3. ✅ **Pueden comprar si quieren**: Aunque ya tienen las skins, pueden hacer pagos de prueba

### 💰 Sistema de Pagos:

#### Configuración de Mercado Pago:

**Archivo**: `backend/.env`

```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

#### Flujo de Pago:

```
1. Usuario hace clic en "💳 Comprar"
   ↓
2. Backend crea una orden en la BD
   ↓
3. Backend crea preferencia en Mercado Pago
   ↓
4. Se abre ventana de Mercado Pago
   ↓
5. Usuario completa el pago
   ↓
6. Mercado Pago envía webhook al backend
   ↓
7. Backend valida el pago
   ↓
8. Backend desbloquea la skin
   ↓
9. ¡Usuario puede usar la skin!
```

#### Tarjetas de Prueba (Mercado Pago):

**Para aprobar pagos**:
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: APRO
```

**Para rechazar pagos**:
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: OTHE
```

### 🔧 Cómo Probar:

1. **Iniciar servidores**:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

2. **Abrir el juego**:
   - Ve a http://localhost:5173
   - Inicia sesión
   - Ve a Configuración
   - Haz 7 clicks en "Seguridad"
   - Se abre Snake

3. **Abrir la tienda**:
   - Click en 🛍️ Tienda
   - Selecciona una skin
   - Click en 💳 Comprar

4. **Completar el pago**:
   - Se abre Mercado Pago
   - Usa la tarjeta de prueba
   - Completa el pago

5. **Verificar**:
   - La skin se desbloquea automáticamente
   - Puedes equiparla

### 📊 Precios de las Skins:

| Rareza | Precio | Skins |
|--------|--------|-------|
| Común | $0 - $3,000 | 4 skins |
| Rara | $5,000 - $6,000 | 3 skins |
| Épica | $10,000 - $12,000 | 3 skins |
| Legendaria | $20,000 - $25,000 | 3 skins |
| Mítica | $50,000 | 1 skin |

**Total**: 14 skins - Valor: $175,500 COP

---

## 📝 Resumen

### ✅ Wordle:
- **Ubicación**: `frontend/src/games/WordleGame.jsx` (líneas 6-26)
- **Total palabras**: ~200 palabras de 5 letras
- **Acceso**: 7 clicks en "El correo no puede modificarse" en Configuración

### ✅ Pagos:
- **Estado**: Habilitados para todos los usuarios
- **Instructores**: Tienen skins gratis automáticamente, pero pueden comprar si quieren
- **Aprendices**: Deben comprar las skins de pago
- **Pasarela**: Mercado Pago (configurado en `.env`)

---

🎮 **¡Todo listo para usar!** ✨
