const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createMateria = async (req, res) => {
  const { fichaId, nombre, tipo } = req.body;
  const instructorId = req.user.id;

  if (!fichaId || !nombre) return res.status(400).json({ error: 'Faltan datos' });

  try {
    // Verificar que la ficha existe y el instructor pertenece a ella
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { instructores: true }
    });

    if (!ficha || !ficha.instructores.some(i => i.id === instructorId)) {
      return res.status(403).json({ error: 'No tienes permiso para agregar materias a esta ficha' });
    }

    const newMateria = await prisma.materia.create({
      data: {
        nombre,
        tipo: tipo || 'Técnica',
        ficha: { connect: { id: fichaId } },
        instructor: { connect: { id: instructorId } }
      }
    });

    res.status(201).json({ message: 'Materia creada', materia: newMateria });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear materia: ' + err.message });
  }
};

const getMateriasByFicha = async (req, res) => {
  const { fichaId } = req.params;
  try {
    const fichaMaterias = await prisma.materia.findMany({
      where: { fichaId },
      include: { instructor: { select: { fullName: true } } }
    });
    res.json({ materias: fichaMaterias });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener materias: ' + err.message });
  }
};

const getUserMaterias = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;

  try {
    if (userType === 'instructor') {
      const misMaterias = await prisma.materia.findMany({
        where: { instructorId: userId },
        include: { ficha: { select: { numero: true } } }
      });
      return res.json({ materias: misMaterias });
    } else {
      // Aprendiz: ver materias de SU ficha
      const miFicha = await prisma.ficha.findFirst({
        where: { aprendices: { some: { id: userId } } }
      });
      if (!miFicha) return res.json({ materias: [] });
      
      const misMaterias = await prisma.materia.findMany({
        where: { fichaId: miFicha.id },
        include: { instructor: { select: { fullName: true } } }
      });
      return res.json({ materias: misMaterias });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

module.exports = {
  createMateria,
  getMateriasByFicha,
  getUserMaterias
};
