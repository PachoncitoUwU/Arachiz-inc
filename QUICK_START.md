# 🚀 Quick Start - Sistema de Skins para Snake

## ⚡ Instalación Rápida

### 1️⃣ Instalar Dependencias del Backend
```bash
cd backend
npm install
```

### 2️⃣ Configurar Mercado Pago
Edita `backend/.env` y agrega tus credenciales:
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-access-token-aqui
MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key-aqui
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

📖 **Ver guía completa**: [MERCADOPAGO_CONFIG.md](./MERCADOPAGO_CONFIG.md)

### 3️⃣ Ejecutar Setup Automático
```bash
cd backend
setup_skins.bat
```

O manualmente:
```bash
cd backend
npx prisma generate
node seed_skins.js
```

### 4️⃣ Iniciar Servidores

**Backend:**
```bash
cd backend
npm start
```

**Frontend (en otra terminal):**
```bash
cd frontend
npm run dev
```

### 5️⃣ ¡Jugar!
1. Abre http://localhost:5173
2. Inicia sesión
3. Ve a **Configuración**
4. Haz **7 clicks** en "Seguridad" para abrir Snake
5. Haz clic en **🛍️ Tienda**
6. ¡Compra y equipa skins épicas!

## 🎨 Skins Disponibles

| Rareza | Nombre | Precio | Efectos |
|--------|--------|--------|---------|
| 🟢 Común | Clásica Verde | GRATIS | Básica |
| 🔵 Común | Serpiente Azul | $2,000 | Sólida |
| 🔴 Común | Serpiente Roja | $2,000 | Sólida |
| 🟡 Común | Serpiente Dorada | $3,000 | Sólida |
| 💠 Rara | Neón Cibernético | $5,000 | Neón + Sparkles + Ojos Láser |
| 🎖️ Rara | Camuflaje Militar | $5,500 | Gradiente + Ojos Enojados |
| ❄️ Rara | Serpiente de Hielo | $6,000 | Hielo + Rastro Congelado |
| 🔥 Épica | Dragón de Fuego | $10,000 | Fuego + Rastro de Fuego |
| ⚙️ Épica | Serpiente Metálica | $10,000 | Metálico + Sparkles |
| 🌈 Épica | Arcoíris Místico | $12,000 | Arcoíris + Estrellas |
| 🌌 Legendaria | Galaxia Infinita | $20,000 | Galaxia + Estrellas |
| ⚡ Legendaria | Relámpago Divino | $22,000 | Neón + Relámpagos |
| 👻 Legendaria | Sombra Espectral | $25,000 | Gradiente + Sparkles |
| 🐍👑 Mítica | Quetzalcóatl | $50,000 | Arcoíris + Estrellas + Láser |

## 🧪 Probar con Tarjetas de Prueba

### ✅ Tarjeta que APRUEBA:
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: APRO
```

### ❌ Tarjeta que RECHAZA:
```
Número: 4509 9535 6623 3704
CVV: 123
Fecha: 11/25
Nombre: OTHE
```

## 📁 Estructura del Proyecto

```
backend/
├── controllers/
│   └── skinController.js      # Lógica de skins y pagos
├── routes/
│   └── skinRoutes.js          # Rutas de la API
├── prisma/
│   └── schema.prisma          # Modelos de BD (con skins)
├── seed_skins.js              # Seed de skins épicas
└── setup_skins.bat            # Script de instalación

frontend/
└── src/
    ├── components/
    │   └── SnakeShop.jsx      # Tienda de skins
    └── pages/
        └── Configuracion.jsx  # Juego Snake (modificado)
```

## 🔧 Comandos Útiles

### Ver la base de datos:
```bash
cd backend
npx prisma studio
```

### Resetear la base de datos:
```bash
cd backend
npx prisma migrate reset
node seed_skins.js
```

### Ver logs del servidor:
```bash
cd backend
npm start
# Los logs mostrarán las notificaciones de Mercado Pago
```

## 🐛 Problemas Comunes

### "Mercado Pago credentials not found"
→ Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté en `.env`
→ Reinicia el servidor

### "Skin not unlocked after payment"
→ Verifica que el webhook esté configurado
→ Usa ngrok para desarrollo local
→ Revisa los logs del servidor

### "Cannot find module 'mercadopago'"
→ Ejecuta `npm install` en backend

## 📚 Documentación Completa

- 📖 [SNAKE_SKINS_SETUP.md](./SNAKE_SKINS_SETUP.md) - Documentación técnica completa
- 💳 [MERCADOPAGO_CONFIG.md](./MERCADOPAGO_CONFIG.md) - Guía de configuración de Mercado Pago

## 🎉 ¡Listo!

Tu sistema de skins está funcionando. Los jugadores pueden:
- ✅ Ver todas las skins en la tienda
- ✅ Comprar skins con dinero real (Mercado Pago)
- ✅ Equipar y cambiar entre skins
- ✅ Disfrutar de efectos visuales épicos

**Rama actual**: `feature/snake-skins-shop`

Para mergear a main:
```bash
git checkout main
git merge feature/snake-skins-shop
```

---

**¿Necesitas ayuda?** Revisa la documentación completa o los logs del servidor.

🐍 ¡Que disfruten las skins legendarias! ✨
