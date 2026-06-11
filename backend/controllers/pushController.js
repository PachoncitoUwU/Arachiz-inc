const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { webpush } = require('../utils/webPush');

// Guardar subscripción
const subscribe = async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id; // Asumimos que la ruta usa middleware authMiddleware

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }

  try {
    // Buscar si ya existe la misma suscripción (por endpoint)
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    });

    if (existing) {
      // Actualizar si es necesario o simplemente retornar éxito
      if (existing.userId !== userId) {
        await prisma.pushSubscription.update({
          where: { endpoint: subscription.endpoint },
          data: { userId }
        });
      }
      return res.status(200).json({ message: 'Suscripción actualizada' });
    }

    // Crear nueva suscripción
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    // Enviar una notificación de prueba de bienvenida
    const payload = JSON.stringify({
      title: '¡Notificaciones activadas!',
      body: 'Recibirás avisos importantes de Arachiz por este medio.',
      icon: '/mi-logo.png'
    });

    // Fire and forget (no bloquea la respuesta)
    webpush.sendNotification(subscription, payload).catch(err => console.error('Error enviando push test', err));

    res.status(201).json({ message: 'Suscripción guardada exitosamente' });
  } catch (error) {
    console.error('Error al guardar suscripción push:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar subscripción
const unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    res.status(200).json({ message: 'Suscripción eliminada' });
  } catch (error) {
    // Si no la encuentra, ignoramos
    res.status(200).json({ message: 'Suscripción eliminada o no existía' });
  }
};

module.exports = {
  subscribe,
  unsubscribe
};
