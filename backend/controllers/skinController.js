const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mercado Pago SDK v2
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Configurar cliente de Mercado Pago solo si hay access token
let client = null;
if (process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_ACCESS_TOKEN !== 'your_mercadopago_access_token_here') {
  client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
  });
  console.log('✅ Mercado Pago configurado correctamente');
} else {
  console.warn('⚠️  Mercado Pago no configurado. Configura MERCADOPAGO_ACCESS_TOKEN en .env');
}

// Obtener todas las skins disponibles
exports.getAllSkins = async (req, res) => {
  try {
    const skins = await prisma.snakeSkin.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { price: 'asc' }
      ]
    });
    res.json({ skins });
  } catch (error) {
    console.error('Error fetching skins:', error);
    res.status(500).json({ error: 'Error al obtener las skins' });
  }
};

// Obtener las skins del usuario autenticado
exports.getUserSkins = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userSkins = await prisma.userSkin.findMany({
      where: { userId },
      include: {
        skin: true
      }
    });
    
    res.json({ userSkins });
  } catch (error) {
    console.error('Error fetching user skins:', error);
    res.status(500).json({ error: 'Error al obtener tus skins' });
  }
};

// Equipar una skin
exports.equipSkin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skinId } = req.body;
    
    // Verificar que el usuario tiene esta skin
    const userSkin = await prisma.userSkin.findUnique({
      where: {
        userId_skinId: { userId, skinId }
      }
    });
    
    if (!userSkin) {
      return res.status(403).json({ error: 'No tienes esta skin desbloqueada' });
    }
    
    // Desequipar todas las skins del usuario
    await prisma.userSkin.updateMany({
      where: { userId },
      data: { equipped: false }
    });
    
    // Equipar la skin seleccionada
    await prisma.userSkin.update({
      where: {
        userId_skinId: { userId, skinId }
      },
      data: { equipped: true }
    });
    
    res.json({ message: 'Skin equipada exitosamente' });
  } catch (error) {
    console.error('Error equipping skin:', error);
    res.status(500).json({ error: 'Error al equipar la skin' });
  }
};

// Crear orden de compra (Mercado Pago)
exports.createOrder = async (req, res) => {
  try {
    // Verificar que Mercado Pago esté configurado
    if (!client) {
      return res.status(503).json({ 
        error: 'Sistema de pagos no configurado. Contacta al administrador.' 
      });
    }
    
    const userId = req.user.id;
    const { skinId } = req.body;
    
    // Verificar que la skin existe
    const skin = await prisma.snakeSkin.findUnique({
      where: { id: skinId }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin no encontrada' });
    }
    
    // Verificar que el usuario no tiene ya esta skin
    const existingUserSkin = await prisma.userSkin.findUnique({
      where: {
        userId_skinId: { userId, skinId }
      }
    });
    
    if (existingUserSkin) {
      return res.status(400).json({ error: 'Ya tienes esta skin' });
    }
    
    // Crear la orden en la base de datos
    const order = await prisma.skinOrder.create({
      data: {
        userId,
        skinId,
        amount: skin.price,
        currency: 'COP',
        status: 'pending',
        paymentMethod: 'mercadopago'
      }
    });
    
    // Crear preferencia de pago en Mercado Pago
    const preference = new Preference(client);
    
    const preferenceData = {
      items: [
        {
          title: `Snake Skin: ${skin.name}`,
          description: skin.description,
          picture_url: `${process.env.FRONTEND_URL}/snake-skin-${skin.rarity}.png`,
          category_id: 'game_items',
          quantity: 1,
          currency_id: 'COP',
          unit_price: skin.price
        }
      ],
      payer: {
        email: req.user.email,
        name: req.user.fullName
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/configuracion?payment=success`,
        failure: `${process.env.FRONTEND_URL}/configuracion?payment=failure`,
        pending: `${process.env.FRONTEND_URL}/configuracion?payment=pending`
      },
      auto_return: 'approved',
      external_reference: order.id,
      notification_url: `${process.env.BACKEND_URL}/api/skins/webhook`,
      statement_descriptor: 'ARACHIZ SNAKE SKIN'
    };
    
    const response = await preference.create({ body: preferenceData });
    
    // Actualizar la orden con el preferenceId
    await prisma.skinOrder.update({
      where: { id: order.id },
      data: { preferenceId: response.id }
    });
    
    res.json({
      orderId: order.id,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error al crear la orden de compra' });
  }
};

// Webhook de Mercado Pago (IPN)
exports.handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Solo procesar notificaciones de pago
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información del pago desde Mercado Pago
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });
      
      const externalReference = payment.external_reference;
      const status = payment.status;
      
      // Buscar la orden en nuestra base de datos
      const order = await prisma.skinOrder.findUnique({
        where: { id: externalReference }
      });
      
      if (!order) {
        console.error('Order not found:', externalReference);
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
      
      // Actualizar el estado de la orden
      if (status === 'approved') {
        await prisma.skinOrder.update({
          where: { id: order.id },
          data: {
            status: 'approved',
            externalId: paymentId.toString(),
            approvedAt: new Date()
          }
        });
        
        // Desbloquear la skin para el usuario
        await prisma.userSkin.create({
          data: {
            userId: order.userId,
            skinId: order.skinId,
            equipped: false
          }
        });
        
        console.log(`✅ Skin unlocked for user ${order.userId}`);
      } else if (status === 'rejected' || status === 'cancelled') {
        await prisma.skinOrder.update({
          where: { id: order.id },
          data: {
            status: status,
            externalId: paymentId.toString()
          }
        });
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};

// Verificar estado de una orden
exports.checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const order = await prisma.skinOrder.findFirst({
      where: {
        id: orderId,
        userId
      },
      include: {
        skin: true
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({ error: 'Error al verificar el estado de la orden' });
  }
};
