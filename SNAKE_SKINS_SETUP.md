# 🐍 Sistema de Skins y Pagos para Snake

## 🎨 Características Implementadas

### 1. **Skins Épicas**
Se han creado 14 skins increíbles con diferentes rarezas:

#### Común (2,000 - 3,000 COP)
- 🟢 **Clásica Verde** - GRATIS (por defecto)
- 🔵 **Serpiente Azul** - Frescura vibrante
- 🔴 **Serpiente Roja** - Peligro y pasión
- 🟡 **Serpiente Dorada** - Brillo dorado

#### Rara (5,000 - 6,000 COP)
- 💠 **Neón Cibernético** - Líneas neón del futuro con ojos láser
- 🎖️ **Camuflaje Militar** - Sigilosa y táctica
- ❄️ **Serpiente de Hielo** - Rastro congelado

#### Épica (10,000 - 12,000 COP)
- 🔥 **Dragón de Fuego** - Escupe fuego y domina
- ⚙️ **Serpiente Metálica** - Forjada en acero
- 🌈 **Arcoíris Místico** - Todos los colores del universo

#### Legendaria (20,000 - 25,000 COP)
- 🌌 **Galaxia Infinita** - Cosmos con estrellas y nebulosas
- ⚡ **Relámpago Divino** - Electricidad pura
- 👻 **Sombra Espectral** - Entidad de otro plano

#### Mítica (50,000 COP)
- 🐍👑 **Dios Serpiente Azteca (Quetzalcóatl)** - Poder absoluto

### 2. **Efectos Visuales**
Cada skin incluye:
- **Patrones**: solid, gradient, neon, metallic, rainbow, galaxy, fire, ice
- **Efectos de rastro**: sparkles, fire, ice, lightning, stars
- **Estilos de ojos**: normal, laser, cute, angry
- **Colores personalizados** para cabeza y cuerpo

### 3. **Sistema de Pagos Real**
- Integración con **Mercado Pago**
- Checkout Pro para pagos seguros
- Webhook/IPN para confirmación automática
- Desbloqueo automático de skins tras pago exitoso

## 📦 Instalación

### 1. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
Edita `backend/.env` y agrega tus credenciales de Mercado Pago:

```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

**¿Cómo obtener las credenciales de Mercado Pago?**
1. Crea una cuenta en [Mercado Pago Developers](https://www.mercadopago.com.co/developers)
2. Ve a "Tus integraciones" → "Credenciales"
3. Copia el **Access Token** y **Public Key**
4. Para pruebas, usa las credenciales de **TEST**
5. Para producción, usa las credenciales de **PRODUCCIÓN**

### 3. Ejecutar migraciones de Prisma
```bash
cd backend
npx prisma migrate dev --name add_snake_skins
npx prisma generate
```

### 4. Seed de las skins épicas
```bash
cd backend
node seed_skins.js
```

### 5. Iniciar el backend
```bash
cd backend
npm start
```

### 6. Iniciar el frontend
```bash
cd frontend
npm run dev
```

## 🎮 Cómo Usar

### Para Jugadores:
1. Abre el juego Snake (7 clicks en "Seguridad" en Configuración)
2. Haz clic en el botón **🛍️ Tienda**
3. Explora las skins disponibles
4. Compra skins con dinero real (Mercado Pago)
5. Equipa tus skins favoritas
6. ¡Disfruta de los efectos visuales épicos!

### Para Desarrolladores:
- Las skins se almacenan en la tabla `SnakeSkin`
- Las compras se registran en `SkinOrder`
- Las skins desbloqueadas se guardan en `UserSkin`
- El webhook de Mercado Pago está en `/api/skins/webhook`

## 🔒 Seguridad

✅ **Implementado:**
- Autenticación requerida para todas las compras
- Validación de pagos en el backend (nunca en el frontend)
- Webhook seguro para confirmación de pagos
- Variables de entorno para credenciales sensibles
- No se procesan datos de tarjetas (Mercado Pago se encarga)

## 🚀 Endpoints de la API

### Públicos:
- `GET /api/skins/all` - Obtener todas las skins disponibles

### Protegidos (requieren token):
- `GET /api/skins/my-skins` - Obtener skins del usuario
- `POST /api/skins/equip` - Equipar una skin
- `POST /api/skins/create-order` - Crear orden de compra
- `GET /api/skins/order/:orderId` - Verificar estado de orden

### Webhook:
- `POST /api/skins/webhook` - Webhook de Mercado Pago (IPN)

## 🎨 Estructura de Datos

### SnakeSkin
```javascript
{
  id: string,
  name: string,
  description: string,
  price: float,
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic',
  headColor: string,
  bodyColor: string,
  pattern: string,
  trailEffect: string,
  eyeStyle: string,
  isDefault: boolean
}
```

### UserSkin
```javascript
{
  id: string,
  userId: string,
  skinId: string,
  equipped: boolean,
  unlockedAt: DateTime
}
```

### SkinOrder
```javascript
{
  id: string,
  userId: string,
  skinId: string,
  amount: float,
  currency: 'COP',
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  paymentMethod: string,
  externalId: string,
  preferenceId: string,
  createdAt: DateTime,
  approvedAt: DateTime
}
```

## 🐛 Troubleshooting

### Error: "Mercado Pago credentials not found"
- Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté en el `.env`
- Asegúrate de reiniciar el servidor después de editar `.env`

### Error: "Skin not unlocked after payment"
- Verifica que el webhook esté configurado correctamente
- Revisa los logs del servidor para ver si el webhook fue recibido
- Usa ngrok para exponer tu localhost si estás en desarrollo

### Las skins no se cargan
- Ejecuta `node seed_skins.js` para crear las skins
- Verifica que la migración de Prisma se haya ejecutado correctamente

## 📝 Notas de Desarrollo

- Esta implementación está en la rama `feature/snake-skins-shop`
- Para producción, configura un dominio real para el webhook
- Considera usar ngrok para pruebas locales del webhook
- Los precios están en pesos colombianos (COP)

## 🎉 ¡Listo!

El sistema de skins está completamente funcional. Los jugadores pueden:
- Ver todas las skins disponibles
- Comprar skins con dinero real
- Equipar y cambiar entre skins
- Disfrutar de efectos visuales épicos mientras juegan

¡Que disfruten las skins legendarias! 🐍✨
