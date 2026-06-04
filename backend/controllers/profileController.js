const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar el usuario y contar algunas estadísticas (ej. rachaAsistencia)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        userType: true,
        avatarUrl: true,
        rachaAsistencia: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Contar el número de asistencias registradas (si es aprendiz)
    // O el número de asistencias creadas (si es instructor)
    let totalAsistencias = 0;
    
    if (user.userType === 'aprendiz') {
      totalAsistencias = await prisma.registroAsistencia.count({
        where: { aprendizId: userId, presente: true }
      });
    } else if (user.userType === 'instructor') {
      totalAsistencias = await prisma.asistencia.count({
        where: { instructorId: userId }
      });
    }

    res.json({
      ...user,
      totalAsistencias
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getProfileStats
};
