const prisma = require('../lib/prisma');

// Obtener todas las notificaciones del usuario
const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limitar a las últimas 50 para rendimiento
    });
    
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener notificaciones: ' + err.message });
  }
};

// Marcar una notificación como leída
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Notificación no encontrada' });
    if (notification.userId !== userId) return res.status(403).json({ error: 'No autorizado' });

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({ message: 'Notificación marcada como leída', notification: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar notificación: ' + err.message });
  }
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar notificaciones: ' + err.message });
  }
};

// Eliminar una notificación
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Notificación no encontrada' });
    if (notification.userId !== userId) return res.status(403).json({ error: 'No autorizado' });

    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notificación eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar notificación: ' + err.message });
  }
};

// Crear una notificación (usualmente llamado internamente por otros controladores, no directamente por API)
const createNotification = async (userId, title, message, type = 'info') => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
  } catch (err) {
    console.error('Error creando notificación:', err);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
