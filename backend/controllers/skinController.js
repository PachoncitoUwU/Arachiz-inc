const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } } });

// ePayco SDK para pagos en Colombia (PSE, Nequi, Tarjetas)
const epayco = require('epayco-sdk-node');

// Configurar cliente de ePayco
let epaycoClient = null;
if (process.env.EPAYCO_PUBLIC_KEY && process.env.EPAYCO_PRIVATE_KEY && 
    process.env.EPAYCO_PUBLIC_KEY !== 'your_epayco_public_key_here') {
  epaycoClient = epayco({
    apiKey: process.env.EPAYCO_PUBLIC_KEY,
    privateKey: process.env.EPAYCO_PRIVATE_KEY,
    lang: 'ES',
    test: process.env.EPAYCO_TEST === 'true'
  });
  console.log('✅ ePayco configurado correctamente');
} else {
  console.warn('⚠️  ePayco no configurado. Configura EPAYCO_PUBLIC_KEY y EPAYCO_PRIVATE_KEY en .env');
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
    const userType = req.user.userType;
    
    // Si es instructor, desbloquear todas las skins automáticamente si no las tiene
    if (userType === 'instructor') {
      const allSkins = await prisma.snakeSkin.findMany();
      const existingSkins = await prisma.userSkin.findMany({
        where: { userId }
      });
      
      // Si el instructor no tiene todas las skins, desbloquearlas
      if (existingSkins.length < allSkins.length) {
        const existingSkinIds = new Set(existingSkins.map(us => us.skinId));
        const skinsToUnlock = allSkins.filter(skin => !existingSkinIds.has(skin.id));
        
        if (skinsToUnlock.length > 0) {
          const userSkinsData = skinsToUnlock.map(skin => ({
            userId,
            skinId: skin.id,
            equipped: false
          }));
          
          await prisma.userSkin.createMany({
            data: userSkinsData,
            skipDuplicates: true
          });
          
          console.log(`✅ ${skinsToUnlock.length} skins desbloqueadas para instructor: ${req.user.fullName}`);
        }
      }
    }
    
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

// Desbloquear skin gratis (modo demo — sin pasarela de pago)
exports.unlockSkin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skinId } = req.body;

    const skin = await prisma.snakeSkin.findUnique({ where: { id: skinId } });
    if (!skin) return res.status(404).json({ error: 'Skin no encontrada' });

    await prisma.userSkin.upsert({
      where:  { userId_skinId: { userId, skinId } },
      update: {},
      create: { userId, skinId, equipped: false },
    });

    res.json({ success: true, message: `${skin.name} desbloqueada` });
  } catch (error) {
    console.error('Error unlocking skin:', error);
    res.status(500).json({ error: 'Error al desbloquear la skin' });
  }
};

// Crear orden de compra (ePayco)
exports.createOrder = async (req, res) => {
  try {
    // Verificar que ePayco esté configurado
    if (!epaycoClient) {
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
        paymentMethod: 'epayco'
      }
    });
    
    // Crear página de pago en ePayco
    const paymentData = {
      name: `Snake Skin: ${skin.name}`,
      description: skin.description,
      invoice: order.id,
      currency: 'cop',
      amount: skin.price.toString(),
      tax_base: '0',
      tax: '0',
      country: 'co',
      lang: 'es',
      external: 'false',
      extra1: userId,
      extra2: skinId,
      extra3: order.id,
      confirmation: `${process.env.BACKEND_URL}/api/skins/webhook-epayco`,
      response: `${process.env.FRONTEND_URL}/configuracion`,
      name_billing: req.user.fullName,
      email_billing: req.user.email,
      type_doc_billing: 'cc',
      mobilephone_billing: '',
      number_doc_billing: req.user.document || ''
    };
    
    const payment = await epaycoClient.pagos.create(paymentData);
    
    // Actualizar la orden con el ID de ePayco
    await prisma.skinOrder.update({
      where: { id: order.id },
      data: { 
        externalId: payment.data?.ref_payco || payment.ref_payco,
        preferenceId: payment.data?.ref_payco || payment.ref_payco
      }
    });
    
    res.json({
      orderId: order.id,
      paymentUrl: payment.data?.urlbanco || payment.urlbanco,
      reference: payment.data?.ref_payco || payment.ref_payco
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

// Webhook de ePayco (Confirmación de pago)
exports.handleWebhookEpayco = async (req, res) => {
  try {
    const {
      x_ref_payco,
      x_transaction_id,
      x_amount,
      x_currency_code,
      x_signature,
      x_approval_code,
      x_transaction_state,
      x_response,
      x_extra1, // userId
      x_extra2, // skinId
      x_extra3  // orderId
    } = req.body;
    
    console.log('📥 Webhook ePayco recibido:', req.body);
    
    // Verificar firma de seguridad
    const crypto = require('crypto');
    const signature = crypto
      .createHash('sha256')
      .update(
        `${process.env.EPAYCO_P_CUST_ID_CLIENTE}^${process.env.EPAYCO_PRIVATE_KEY}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`
      )
      .digest('hex');
    
    if (signature !== x_signature) {
      console.error('❌ Firma inválida');
      return res.status(400).json({ error: 'Firma inválida' });
    }
    
    const orderId = x_extra3;
    
    // Buscar la orden
    const order = await prisma.skinOrder.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      console.error('❌ Orden no encontrada:', orderId);
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // Procesar según el estado
    if (x_response === 'Aceptada' && x_transaction_state === 'Aceptada') {
      // Pago aprobado
      await prisma.skinOrder.update({
        where: { id: order.id },
        data: {
          status: 'approved',
          externalId: x_transaction_id,
          approvedAt: new Date()
        }
      });
      
      // Desbloquear la skin
      await prisma.userSkin.create({
        data: {
          userId: order.userId,
          skinId: order.skinId,
          equipped: false
        }
      });
      
      console.log(`✅ Skin desbloqueada para usuario ${order.userId}`);
    } else if (x_response === 'Rechazada' || x_response === 'Fallida') {
      // Pago rechazado
      await prisma.skinOrder.update({
        where: { id: order.id },
        data: {
          status: 'rejected',
          externalId: x_transaction_id
        }
      });
      
      console.log(`❌ Pago rechazado para orden ${order.id}`);
    } else if (x_response === 'Pendiente') {
      // Pago pendiente
      await prisma.skinOrder.update({
        where: { id: order.id },
        data: {
          status: 'pending',
          externalId: x_transaction_id
        }
      });
      
      console.log(`⏳ Pago pendiente para orden ${order.id}`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling ePayco webhook:', error);
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
