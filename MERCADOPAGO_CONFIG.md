# 💳 Configuración de Mercado Pago

## 🚀 Pasos para Configurar Mercado Pago

### 1. Crear Cuenta de Desarrollador
1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.co/developers)
2. Inicia sesión o crea una cuenta
3. Acepta los términos y condiciones

### 2. Crear una Aplicación
1. Ve a **"Tus integraciones"** en el menú
2. Haz clic en **"Crear aplicación"**
3. Completa los datos:
   - **Nombre**: Arachiz Snake Skins
   - **Descripción**: Sistema de compra de skins para el juego Snake
   - **Modelo de integración**: Checkout Pro
   - **Productos**: Pagos online

### 3. Obtener Credenciales de TEST
1. En tu aplicación, ve a **"Credenciales"**
2. Selecciona **"Credenciales de prueba"**
3. Copia:
   - **Access Token** (comienza con `TEST-...`)
   - **Public Key** (comienza con `TEST-...`)

### 4. Configurar el .env
Edita `backend/.env` y agrega:

```env
# Mercado Pago Configuration (TEST)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

### 5. Configurar Webhook (Desarrollo Local)

Para que Mercado Pago pueda notificar a tu servidor local sobre pagos:

#### Opción A: Usar ngrok (Recomendado para desarrollo)
```bash
# Instalar ngrok
# Windows: Descargar de https://ngrok.com/download
# Mac: brew install ngrok
# Linux: snap install ngrok

# Exponer tu servidor local
ngrok http 3000

# Copiar la URL HTTPS que te da (ej: https://abc123.ngrok.io)
```

Luego actualiza tu `.env`:
```env
BACKEND_URL=https://abc123.ngrok.io
```

Y configura el webhook en Mercado Pago:
1. Ve a tu aplicación en Mercado Pago
2. **Notificaciones** → **Webhooks**
3. Agrega: `https://abc123.ngrok.io/api/skins/webhook`

#### Opción B: Usar un servidor de desarrollo público
Si tienes tu backend desplegado (Render, Railway, etc.):
```env
BACKEND_URL=https://tu-backend.onrender.com
```

### 6. Probar con Tarjetas de Prueba

Mercado Pago proporciona tarjetas de prueba:

#### Tarjetas que APRUEBAN el pago:
```
Mastercard: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: APRO
```

#### Tarjetas que RECHAZAN el pago:
```
Visa: 4509 9535 6623 3704
CVV: 123
Fecha: 11/25
Nombre: OTHE
```

### 7. Credenciales de PRODUCCIÓN

⚠️ **IMPORTANTE**: Solo usa credenciales de producción cuando estés listo para recibir pagos reales.

1. En Mercado Pago, ve a **"Credenciales de producción"**
2. Completa el formulario de activación
3. Espera la aprobación (puede tomar 1-2 días)
4. Una vez aprobado, copia las credenciales de producción
5. Actualiza tu `.env` en producción:

```env
# Mercado Pago Configuration (PRODUCTION)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=APP_USR-abcdef12-3456-7890-abcd-ef1234567890
FRONTEND_URL=https://tu-dominio.com
BACKEND_URL=https://tu-backend.com
```

## 🧪 Probar el Sistema

### 1. Iniciar el backend
```bash
cd backend
npm start
```

### 2. Iniciar el frontend
```bash
cd frontend
npm run dev
```

### 3. Probar una compra
1. Abre el juego Snake (7 clicks en "Seguridad")
2. Haz clic en **🛍️ Tienda**
3. Selecciona una skin
4. Haz clic en **💳 Comprar**
5. Usa una tarjeta de prueba
6. Completa el pago
7. La skin debería desbloquearse automáticamente

## 🔍 Verificar Pagos

### En Mercado Pago:
1. Ve a **"Actividad"** → **"Pagos"**
2. Verás todos los pagos de prueba

### En tu Base de Datos:
```bash
cd backend
npx prisma studio
```
- Revisa la tabla `SkinOrder` para ver las órdenes
- Revisa la tabla `UserSkin` para ver las skins desbloqueadas

## 🐛 Troubleshooting

### Error: "Invalid credentials"
- Verifica que copiaste correctamente el Access Token
- Asegúrate de usar credenciales de TEST para desarrollo
- Reinicia el servidor después de cambiar el `.env`

### El webhook no se ejecuta
- Verifica que ngrok esté corriendo
- Revisa que la URL del webhook esté correctamente configurada
- Mira los logs del servidor para ver si llega la notificación

### El pago se aprueba pero la skin no se desbloquea
- Revisa los logs del servidor
- Verifica que el webhook esté recibiendo la notificación
- Comprueba que el `external_reference` coincida con el `orderId`

## 📚 Recursos

- [Documentación de Mercado Pago](https://www.mercadopago.com.co/developers/es/docs)
- [Checkout Pro](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/landing)
- [Webhooks/IPN](https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks)
- [Tarjetas de Prueba](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/test-cards)

## 💡 Consejos

1. **Siempre usa credenciales de TEST en desarrollo**
2. **Nunca subas las credenciales a Git** (ya están en .gitignore)
3. **Usa ngrok para probar webhooks localmente**
4. **Revisa los logs del servidor para debugging**
5. **Prueba con diferentes tarjetas de prueba**

¡Listo para recibir pagos! 💰🐍
