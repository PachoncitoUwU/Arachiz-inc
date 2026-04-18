# 💳 Cómo Configurar Mercado Pago

## ⚠️ Problema Actual

El error **"Sistema de pagos no configurado"** aparece porque las credenciales de Mercado Pago en el archivo `.env` están con valores de ejemplo.

**Archivo actual** (`backend/.env`):
```env
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token_here
MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key_here
```

---

## 🔧 Solución: Obtener Credenciales Reales

### Opción 1: Usar Credenciales de Prueba (Recomendado para desarrollo)

#### Paso 1: Crear cuenta en Mercado Pago Developers

1. Ve a: https://www.mercadopago.com.co/developers
2. Crea una cuenta o inicia sesión
3. Acepta los términos y condiciones

#### Paso 2: Obtener Credenciales de TEST

1. En el panel de Mercado Pago Developers, ve a:
   - **"Tus integraciones"** → **"Credenciales"**
   
2. Selecciona el modo **"Credenciales de prueba"**

3. Copia las credenciales:
   - **Access Token** (empieza con `TEST-`)
   - **Public Key** (empieza con `TEST-`)

#### Paso 3: Configurar en el proyecto

Edita el archivo `backend/.env` y reemplaza:

```env
# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**: 
- Reemplaza con tus credenciales reales de TEST
- NO uses las credenciales de ejemplo de arriba
- Las credenciales de TEST empiezan con `TEST-`

#### Paso 4: Reiniciar el servidor

```bash
cd backend
# Detén el servidor (Ctrl+C)
npm start
```

Deberías ver en la consola:
```
✅ Mercado Pago configurado correctamente
```

---

### Opción 2: Usar Credenciales de Producción (Para pagos reales)

⚠️ **Solo usa esto cuando estés listo para recibir pagos reales**

1. En Mercado Pago Developers, ve a **"Credenciales de producción"**
2. Copia las credenciales (empiezan con `APP_USR-`)
3. Configura en `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=APP_USR-abcdef12-3456-7890-abcd-ef1234567890
FRONTEND_URL=https://tu-dominio.com
BACKEND_URL=https://tu-api.com
```

---

## 🧪 Probar con Tarjetas de Prueba

Una vez configuradas las credenciales de TEST, puedes usar estas tarjetas:

### ✅ Para Aprobar Pagos:
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha de vencimiento: 11/25
Nombre: APRO
```

### ❌ Para Rechazar Pagos:
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha de vencimiento: 11/25
Nombre: OTHE
```

### ⏳ Para Pagos Pendientes:
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha de vencimiento: 11/25
Nombre: CONT
```

---

## 🔍 Verificar Configuración

### 1. Verificar archivo .env

```bash
cd backend
cat .env | grep MERCADOPAGO
```

Deberías ver:
```
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...
```

### 2. Verificar logs del servidor

Al iniciar el servidor (`npm start`), deberías ver:
```
✅ Mercado Pago configurado correctamente
```

Si ves:
```
⚠️  Mercado Pago no configurado. Configura MERCADOPAGO_ACCESS_TOKEN en .env
```

Significa que las credenciales no están configuradas correctamente.

### 3. Probar compra

1. Abre el juego Snake
2. Abre la tienda 🛍️
3. Selecciona una skin
4. Click en 💳 Comprar
5. Debería abrirse la ventana de Mercado Pago

---

## 🚨 Solución de Problemas

### Error: "Sistema de pagos no configurado"

**Causa**: Las credenciales no están configuradas o son inválidas

**Solución**:
1. Verifica que `MERCADOPAGO_ACCESS_TOKEN` en `.env` no sea `your_mercadopago_access_token_here`
2. Verifica que el token empiece con `TEST-` (para pruebas) o `APP_USR-` (para producción)
3. Reinicia el servidor después de editar `.env`

### Error: "Invalid credentials"

**Causa**: Las credenciales son incorrectas

**Solución**:
1. Ve a Mercado Pago Developers
2. Copia nuevamente las credenciales
3. Asegúrate de copiar el **Access Token** completo (es largo)
4. Reinicia el servidor

### El webhook no funciona

**Causa**: Mercado Pago no puede acceder a tu localhost

**Solución para desarrollo**:
1. Usa **ngrok** para exponer tu localhost:
```bash
ngrok http 3000
```

2. Copia la URL de ngrok (ej: `https://abc123.ngrok.io`)

3. Actualiza en `.env`:
```env
BACKEND_URL=https://abc123.ngrok.io
```

4. Reinicia el servidor

---

## 📋 Checklist de Configuración

- [ ] Cuenta creada en Mercado Pago Developers
- [ ] Credenciales de TEST obtenidas
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado en `.env`
- [ ] `MERCADOPAGO_PUBLIC_KEY` configurado en `.env`
- [ ] Servidor reiniciado
- [ ] Mensaje "✅ Mercado Pago configurado correctamente" visible
- [ ] Prueba de compra exitosa con tarjeta de prueba

---

## 🎯 Ejemplo Completo de .env

```env
PORT=3000
JWT_SECRET=supersecretarachiz

DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="eyJhbGc..."

# Mercado Pago - CREDENCIALES DE PRUEBA
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890

# URLs para desarrollo local
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

---

## 📞 Recursos Adicionales

- **Documentación oficial**: https://www.mercadopago.com.co/developers/es/docs
- **Credenciales**: https://www.mercadopago.com.co/developers/panel/credentials
- **Tarjetas de prueba**: https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/test-cards
- **Soporte**: https://www.mercadopago.com.co/developers/es/support

---

## ⚡ Inicio Rápido

Si solo quieres probar rápido:

1. **Obtén credenciales**:
   - Ve a: https://www.mercadopago.com.co/developers/panel/credentials
   - Copia el **Access Token de TEST**

2. **Configura**:
   ```bash
   cd backend
   nano .env  # o usa tu editor favorito
   ```
   
   Reemplaza:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=TU_TOKEN_AQUI
   ```

3. **Reinicia**:
   ```bash
   npm start
   ```

4. **Prueba**:
   - Abre la tienda
   - Compra una skin
   - Usa tarjeta: `5031 7557 3453 0604`, CVV: `123`, Nombre: `APRO`

---

🎉 **¡Listo! Ahora puedes procesar pagos de prueba.**

Para pagos reales, usa las credenciales de producción y configura el webhook correctamente.
