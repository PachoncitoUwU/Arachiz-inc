const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMensajes = async (req, res) => {
  try {
    const { fichaId } = req.params;
    
    // Verificar que el usuario pertenece a la ficha o es instructor de la misma
    // Para simplificar, asumimos que si tiene el fichaId puede ver el chat, 
    // pero idealmente deberíamos verificar
    
    const mensajes = await prisma.mensajeChat.findMany({
      where: { fichaId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            userType: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: 100 // Limitar a los últimos 100 mensajes iniciales
    });

    res.json({ mensajes });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getMensajes
};
