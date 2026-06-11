const webpush = require('web-push');

// Configuración de VAPID keys para Web Push Notifications
// Estas llaves deben generarse una vez con `npx web-push generate-vapid-keys`
// y guardarse en el archivo .env

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:oficialarachiz@gmail.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);
} else {
  console.warn('⚠️ Faltan VAPID keys en .env. Las notificaciones Push no funcionarán correctamente.');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sendPushToUsers = async (userIds, payload) => {
  if (!userIds || userIds.length === 0) return;
  
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } }
    });

    const notifications = subscriptions.map(sub => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSub, JSON.stringify(payload)).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or invalid, remove from DB
          return prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        console.error('Error sending push to', sub.endpoint, err);
      });
    });

    await Promise.all(notifications);
  } catch (err) {
    console.error('Error in sendPushToUsers:', err);
  }
};

module.exports = {
  webpush,
  sendPushToUsers
};
