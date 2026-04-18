# 🔧 Solución: Error "Sistema de pagos no configurado"

## ❌ Problema

Cuando intentas comprar una skin, aparece el error:
```
Sistema de pagos no configurado. Contacta al administrador.
```

## ✅ Causa

Las credenciales de Mercado Pago en `backend/.env` están con valores de ejemplo:
```env
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token_here
MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key_here
```

---

## 🚀 Solución Rápida (5 minutos)

### Paso 1: Obtener Credenciales de Mercado Pago

1. **Abre tu navegador** y ve a:
   ```
   https://www.mercadopago.com.co/developers/panel/credentials
   ```

2. **Inicia sesión** o crea una cuenta (es gratis)

3. **Selecciona "Credenciales de prueba"** (para desarrollo)

4. **Copia las credenciales**:
   - **Access Token** (empieza con `TEST-`)
   - **Public Key** (empieza con `TEST-`)

### Paso 2: Configurar en el Proyecto

1. **Abre el archivo** `backend/.env`

2. **Reemplaza las líneas**:
   ```env
   # ANTES (valores de ejemplo):
   MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token_here
   MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key_here
   
   # DESPUÉS (tus credenciales reales):
   MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
   MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890
   ```

3. **Guarda el archivo**

### Paso 3: Reiniciar el Servidor

```bash
cd backend
# Detén el servidor (Ctrl+C si está corriendo)
npm start
```

**Deberías ver**:
```
✅ Mercado Pago configurado correctamente
```

### Paso 4: Probar

1. Abre el juego Snake
2. Abre la tienda 🛍️
3. Selecciona una skin
4. Click en 💳 Comprar
5. Usa la tarjeta de prueba:
   - **Número**: `5031 7557 3453 0604`
   - **CVV**: `123`
   - **Fecha**: `11/25`
   - **Nombre**: `APRO`

---

## 🔍 Verificar Configuración

Ejecuta este comando para verificar si está bien configurado:

```bash
cd backend
node check_mercadopago.js
```

**Si está bien configurado**, verás:
```
✅ CONFIGURACIÓN COMPLETA
🎉 Mercado Pago está configurado correctamente!
```

**Si hay problemas**, verás:
```
❌ CONFIGURACIÓN INCOMPLETA
📝 Pasos para configurar: ...
```

---

## 📸 Capturas de Pantalla (Guía Visual)

### 1. Ir a Mercado Pago Developers
![Paso 1](https://www.mercadopago.com.co/developers/panel/credentials)

### 2. Seleccionar "Credenciales de prueba"
- Verás dos pestañas: "Producción" y "Prueba"
- Selecciona **"Prueba"**

### 3. Copiar las credenciales
- **Access Token**: Es un texto largo que empieza con `TEST-`
- **Public Key**: Es un texto más corto que también empieza con `TEST-`

### 4. Pegar en .env
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-[tu-token-aquí]
MERCADOPAGO_PUBLIC_KEY=TEST-[tu-key-aquí]
```

---

## 🎯 Ejemplo Real de .env

```env
PORT=3000
JWT_SECRET=supersecretarachiz

DATABASE_URL="postgresql://postgres.vfvhkzfoadbkofpkswbd:2209092212345644@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.vfvhkzfoadbkofpkswbd:2209092212345644@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

SUPABASE_URL="https://vfvhkzfoadbkofpkswbd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdmhremZvYWRia29mcGtzd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzc5NDIsImV4cCI6MjA5MTYxMzk0Mn0.6oXzsfJVxTyiFGh75EplQyTrkzLpBcgfdkbCPjFCL9g"

VITE_SOCKET_URL=https://bakendarachizpriv.onrender.com

# Mercado Pago - REEMPLAZA CON TUS CREDENCIALES REALES
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

---

## 🧪 Tarjetas de Prueba

Una vez configurado, usa estas tarjetas para probar:

### ✅ Aprobar Pago
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: APRO
```

### ❌ Rechazar Pago
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: OTHE
```

### ⏳ Pago Pendiente
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: CONT
```

---

## 🚨 Problemas Comunes

### "No puedo encontrar las credenciales"

1. Ve a: https://www.mercadopago.com.co/developers
2. Click en "Tus integraciones"
3. Click en "Credenciales"
4. Selecciona la pestaña "Credenciales de prueba"

### "El servidor no muestra el mensaje de éxito"

1. Verifica que guardaste el archivo `.env`
2. Reinicia el servidor completamente:
   ```bash
   # Detén el servidor (Ctrl+C)
   cd backend
   npm start
   ```

### "Sigue sin funcionar"

1. Ejecuta el script de verificación:
   ```bash
   cd backend
   node check_mercadopago.js
   ```

2. Verifica que el token empiece con `TEST-`

3. Verifica que no haya espacios al inicio o final del token

---

## 📞 Ayuda Adicional

- **Documentación completa**: Ver `CONFIGURAR_MERCADOPAGO.md`
- **Script de verificación**: `backend/check_mercadopago.js`
- **Soporte Mercado Pago**: https://www.mercadopago.com.co/developers/es/support

---

## ✅ Checklist

- [ ] Cuenta creada en Mercado Pago Developers
- [ ] Credenciales de TEST copiadas
- [ ] Archivo `backend/.env` editado
- [ ] Credenciales pegadas (empiezan con `TEST-`)
- [ ] Archivo guardado
- [ ] Servidor reiniciado
- [ ] Mensaje "✅ Mercado Pago configurado correctamente" visible
- [ ] Prueba de compra exitosa

---

🎉 **¡Una vez completado, podrás procesar pagos de prueba!**

Para pagos reales en producción, usa las "Credenciales de producción" en lugar de las de prueba.
