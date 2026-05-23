const prisma = require('../lib/prisma');

// ePayco SDK para pagos en Colombia (PSE, Nequi, Tarjetas)
const epayco = require('epayco-sdk-node');

// Axios para llamadas HTTP a Wompi
const axios = require('axios');

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

// Verificar configuración de Wompi
const wompiConfigured = process.env.WOMPI_PUBLIC_KEY && 
                        process.env.WOMPI_PRIVATE_KEY && 
                        process.env.WOMPI_INTEGRITY_KEY &&
                        process.env.WOMPI_PUBLIC_KEY !== 'pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

if (wompiConfigured) {
  console.log('✅ Wompi configurado correctamente');
} else {
  console.warn('⚠️  Wompi no configurado. Configura WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY e WOMPI_INTEGRITY_KEY en .env');
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

// ===================================
// WOMPI - PAGOS
// ===================================

// Crear pago con Wompi (Donación)
// El backend genera la referencia + firma de integridad.
// El Widget de Wompi en el frontend maneja el checkout completo.
exports.createWompiPayment = async (req, res) => {
  const crypto = require('crypto');

  try {
    if (!wompiConfigured) {
      return res.status(503).json({ 
        error: 'Sistema de pagos Wompi no configurado. Contacta al administrador.' 
      });
    }

    const { amount } = req.body;

    // Validar monto mínimo (1000 COP)
    if (!amount || amount < 1000) {
      return res.status(400).json({ error: 'El monto mínimo es 1000 COP' });
    }

    // Referencia única para esta donación
    const reference = `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Wompi requiere firmar: reference + amount_in_cents + currency + integrity_key
    // Esto evita que alguien manipule el monto desde el cliente
    const amountInCents = amount * 100;
    const currency      = 'COP';
    const toSign        = `${reference}${amountInCents}${currency}${process.env.WOMPI_INTEGRITY_KEY}`;
    const integrityHash = crypto.createHash('sha256').update(toSign).digest('hex');

    // 1. Obtener un userId de respaldo si no está autenticado (donación de invitado)
    let targetUserId = req.user?.id;
    if (!targetUserId) {
      const defaultUser = await prisma.user.findFirst({
        where: { email: 'admin@arachiz.com' }
      }) || await prisma.user.findFirst();
      if (!defaultUser) {
        return res.status(500).json({ error: 'No se encontraron usuarios en la base de datos para asociar la transacción.' });
      }
      targetUserId = defaultUser.id;
    }

    // 2. Obtener la skin "Clásica" por defecto para asociar la transacción
    const classicSkin = await prisma.snakeSkin.findFirst({
      where: { name: 'Clásica' }
    }) || await prisma.snakeSkin.findFirst();
    if (!classicSkin) {
      return res.status(500).json({ error: 'No se encontraron skins en la base de datos para asociar la transacción.' });
    }

    // Guardar la donación en BD con estado pending
    await prisma.skinOrder.create({
      data: {
        userId:        targetUserId,
        amount:        amount,
        currency:      currency,
        status:        'pending',
        paymentMethod: 'wompi',
        preferenceId:  reference,
        skin: {
          connect: {
            id: classicSkin.id
          }
        }
      }
    });

    console.log(`💳 Donación Wompi iniciada: ${reference} — $${amount.toLocaleString('es-CO')} COP`);

    // Devolver al frontend todo lo que necesita para abrir el Widget
    res.json({
      reference,
      amountInCents,
      currency,
      integrityHash,
      publicKey:   process.env.WOMPI_PUBLIC_KEY,
      redirectUrl: `${process.env.FRONTEND_URL}/payment-status`,
    });

  } catch (error) {
    console.error('Error creating Wompi payment:', error);
    res.status(500).json({ error: `Error al crear el pago: ${error.message}` });
  }
};

// Webhook de Wompi (Confirmación de pago)
exports.handleWebhookWompi = async (req, res) => {
  const crypto = require('crypto');

  try {
    // ── 1. Verificar firma de integridad ──────────────────────────────────
    // Wompi envía: X-Wompi-Signature: <checksum>
    // El checksum se construye así:
    //   properties_concatenated + timestamp + integrity_key
    // donde properties_concatenated = los valores de los campos del evento
    // ordenados alfabéticamente y concatenados sin separador.
    //
    // Para simplificar en sandbox, si no hay header de firma lo aceptamos
    // pero lo logueamos como advertencia.
    const wompiSignature = req.headers['x-wompi-signature'];

    if (wompiSignature && process.env.WOMPI_INTEGRITY_KEY) {
      // Wompi envía el checksum como: <properties>.<timestamp>.<checksum>
      // Formato real: "properties=<...>,timestamp=<...>,checksum=<...>"
      // Extraemos el checksum y el timestamp del header
      const parts = {};
      wompiSignature.split(',').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) parts[key.trim()] = value.trim();
      });

      if (parts.checksum && parts.timestamp) {
        // Reconstruir el string a firmar
        // Wompi concatena: event + timestamp + integrity_key
        const toSign = `${JSON.stringify(req.body)}${parts.timestamp}${process.env.WOMPI_INTEGRITY_KEY}`;
        const expectedChecksum = crypto
          .createHash('sha256')
          .update(toSign)
          .digest('hex');

        if (expectedChecksum !== parts.checksum) {
          console.error('❌ Firma de Wompi inválida');
          console.error('   Esperado:', expectedChecksum);
          console.error('   Recibido:', parts.checksum);
          return res.status(401).json({ error: 'Firma inválida' });
        }
        console.log('✅ Firma de Wompi verificada');
      }
    } else {
      console.warn('⚠️  Webhook sin firma — aceptado en modo sandbox');
    }

    // ── 2. Parsear el evento ──────────────────────────────────────────────
    const { event, data, sent_at } = req.body;

    console.log('─────────────────────────────────────────');
    console.log('📥 Webhook Wompi recibido');
    console.log('   Evento   :', event);
    console.log('   Enviado  :', sent_at);
    console.log('─────────────────────────────────────────');

    // Solo procesamos actualizaciones de transacciones
    if (event !== 'transaction.updated') {
      console.log(`ℹ️  Evento ignorado: ${event}`);
      return res.status(200).json({ received: true, processed: false });
    }

    const transaction = data?.transaction;
    if (!transaction) {
      console.error('❌ Payload sin datos de transacción');
      return res.status(400).json({ error: 'Payload inválido' });
    }

    const {
      id: transactionId,
      reference,
      status,
      amount_in_cents,
      currency,
      payment_method_type,
      created_at: txCreatedAt,
    } = transaction;

    console.log('   TX ID    :', transactionId);
    console.log('   Referencia:', reference);
    console.log('   Estado   :', status);
    console.log('   Monto    :', amount_in_cents / 100, currency);
    console.log('   Método   :', payment_method_type);

    // ── 3. Buscar la donación en BD ───────────────────────────────────────
    const donation = await prisma.skinOrder.findFirst({
      where: { preferenceId: reference }
    });

    if (!donation) {
      // Puede ser una transacción de otro sistema — no es error crítico
      console.warn(`⚠️  Donación no encontrada para referencia: ${reference}`);
      return res.status(200).json({ received: true, processed: false, reason: 'reference_not_found' });
    }

    // Evitar reprocesar si ya está en estado final
    if (donation.status === 'approved' && status === 'APPROVED') {
      console.log('ℹ️  Donación ya estaba aprobada — ignorando duplicado');
      return res.status(200).json({ received: true, processed: false, reason: 'already_approved' });
    }

    // ── 4. Actualizar estado en BD ────────────────────────────────────────
    let newStatus;
    let approvedAt = null;

    switch (status) {
      case 'APPROVED':
        newStatus  = 'approved';
        approvedAt = new Date();
        break;
      case 'DECLINED':
      case 'VOIDED':
        newStatus = 'rejected';
        break;
      case 'PENDING':
      case 'PROCESSING':
        newStatus = 'pending';
        break;
      default:
        newStatus = 'pending';
    }

    await prisma.skinOrder.update({
      where: { id: donation.id },
      data: {
        status:      newStatus,
        externalId:  transactionId,
        ...(approvedAt && { approvedAt }),
      }
    });

    // ── 5. Log final ──────────────────────────────────────────────────────
    const emoji = { approved: '✅', rejected: '❌', pending: '⏳' }[newStatus] || '❓';
    console.log(`${emoji} Donación ${newStatus}: ${reference} — $${amount_in_cents / 100} COP`);
    console.log('─────────────────────────────────────────');

    res.status(200).json({ received: true, processed: true, status: newStatus });

  } catch (error) {
    console.error('❌ Error procesando webhook Wompi:', error.message);
    // Siempre responder 200 para que Wompi no reintente indefinidamente
    res.status(200).json({ received: true, processed: false, error: error.message });
  }
};
