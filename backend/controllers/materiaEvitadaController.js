const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener materias evitadas de un aprendiz en una ficha específica
exports.getMateriasEvitadas = async (req, res) => {
  try {
    const { aprendizId, fichaId } = req.params;

    // Verificar que el aprendiz pertenece a la ficha
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { aprendices: { where: { id: aprendizId } } }
    });

    if (!ficha || ficha.aprendices.length === 0) {
      return res.status(404).json({ error: 'Aprendiz no encontrado en esta ficha' });
    }

    // Obtener materias evitadas
    const materiasEvitadas = await prisma.materiaEvitada.findMany({
      where: {
        aprendizId,
        materia: { fichaId }
      },
      include: {
        materia: {
          include: {
            instructor: { select: { fullName: true } }
          }
        }
      }
    });

    res.json({ materiasEvitadas });
  } catch (error) {
    console.error('Error al obtener materias evitadas:', error);
    res.status(500).json({ error: 'Error al obtener materias evitadas' });
  }
};

// Obtener materias evitadas del aprendiz autenticado (para vista de aprendiz)
exports.getMyMateriasEvitadas = async (req, res) => {
  try {
    const aprendizId = req.user.id;

    // Obtener todas las materias evitadas del aprendiz
    const materiasEvitadas = await prisma.materiaEvitada.findMany({
      where: { aprendizId },
      include: {
        materia: {
          include: {
            instructor: { select: { fullName: true } },
            ficha: { select: { numero: true, nombre: true } }
          }
        }
      }
    });

    res.json({ materiasEvitadas });
  } catch (error) {
    console.error('Error al obtener materias evitadas:', error);
    res.status(500).json({ error: 'Error al obtener materias evitadas' });
  }
};

// Actualizar materias evitadas de un aprendiz
exports.updateMateriasEvitadas = async (req, res) => {
  try {
    const { aprendizId, fichaId } = req.params;
    const { materiasEvitadasIds } = req.body; // Array de IDs de materias evitadas

    if (!Array.isArray(materiasEvitadasIds)) {
      return res.status(400).json({ error: 'materiasEvitadasIds debe ser un array' });
    }

    // Verificar que el usuario es admin de la ficha
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        aprendices: { where: { id: aprendizId } },
        materias: true,
        instructores: { where: { instructorId: req.user.id } }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.aprendices.length === 0) {
      return res.status(404).json({ error: 'Aprendiz no encontrado en esta ficha' });
    }

    // Verificar que el usuario es admin de la ficha
    const isAdmin = ficha.instructorAdminId === req.user.id;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Solo el admin de la ficha puede gestionar materias evitadas' });
    }

    // Validar que al menos una materia quede activa
    const totalMaterias = ficha.materias.length;
    if (materiasEvitadasIds.length >= totalMaterias) {
      return res.status(400).json({ error: 'El aprendiz debe participar en al menos una materia' });
    }

    // Validar que todas las materias pertenecen a la ficha
    const materiasValidas = ficha.materias.map(m => m.id);
    const materiasInvalidas = materiasEvitadasIds.filter(id => !materiasValidas.includes(id));
    if (materiasInvalidas.length > 0) {
      return res.status(400).json({ error: 'Algunas materias no pertenecen a esta ficha' });
    }

    // Eliminar todas las materias evitadas actuales de este aprendiz en esta ficha
    await prisma.materiaEvitada.deleteMany({
      where: {
        aprendizId,
        materia: { fichaId }
      }
    });

    // Crear las nuevas materias evitadas
    if (materiasEvitadasIds.length > 0) {
      await prisma.materiaEvitada.createMany({
        data: materiasEvitadasIds.map(materiaId => ({
          aprendizId,
          materiaId
        }))
      });
    }

    // Obtener las materias evitadas actualizadas
    const materiasEvitadas = await prisma.materiaEvitada.findMany({
      where: {
        aprendizId,
        materia: { fichaId }
      },
      include: {
        materia: {
          include: {
            instructor: { select: { fullName: true } }
          }
        }
      }
    });

    res.json({ 
      message: 'Materias evitadas actualizadas exitosamente',
      materiasEvitadas 
    });
  } catch (error) {
    console.error('Error al actualizar materias evitadas:', error);
    res.status(500).json({ error: 'Error al actualizar materias evitadas' });
  }
};
