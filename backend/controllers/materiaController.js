const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RF06 - Crear materia
const createMateria = async (req, res) => {
  const { fichaId, nombre, tipo } = req.body;
  const instructorId = req.user.id;
  if (!fichaId || !nombre) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { instructores: true }
    });
    if (!ficha || !ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'No tienes permiso para agregar materias a esta ficha' });
    }
    const newMateria = await prisma.materia.create({
      data: {
        nombre,
        tipo: tipo || 'Técnica',
        ficha: { connect: { id: fichaId } },
        instructor: { connect: { id: instructorId } }
      },
      include: { instructor: { select: { fullName: true } }, ficha: { select: { numero: true } } }
    });
    res.status(201).json({ message: 'Materia creada', materia: newMateria });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear materia: ' + err.message });
  }
};

// RF70 - Eliminar materia
const deleteMateria = async (req, res) => {
  const { id } = req.params;
  const instructorId = req.user.id;
  try {
    const materia = await prisma.materia.findUnique({
      where: { id },
      include: { ficha: true }
    });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    const isAdmin = materia.ficha.instructorAdminId === instructorId;
    const isCreator = materia.instructorId === instructorId;
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Solo el creador o admin puede eliminar esta materia' });
    }
    await prisma.materia.delete({ where: { id } });
    res.json({ message: 'Materia eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar materia: ' + err.message });
  }
};

// RF71 - Materias por ficha
const getMateriasByFicha = async (req, res) => {
  const { fichaId } = req.params;
  try {
    const fichaMaterias = await prisma.materia.findMany({
      where: { fichaId },
      include: {
        instructor: { select: { id: true, fullName: true } },
        asistencias: { select: { id: true, activa: true } }
      }
    });
    res.json({ materias: fichaMaterias });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener materias: ' + err.message });
  }
};

// RF19 / RF47 - Materias del usuario
const getUserMaterias = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  try {
    if (userType === 'instructor') {
      const misMaterias = await prisma.materia.findMany({
        where: { instructorId: userId },
        include: {
          ficha: { select: { numero: true, id: true } },
          asistencias: { select: { id: true, activa: true } },
          _count: { select: { asistencias: true } }
        }
      });
      return res.json({ materias: misMaterias });
    } else {
      const miFicha = await prisma.ficha.findFirst({
        where: { aprendices: { some: { id: userId } } }
      });
      if (!miFicha) return res.json({ materias: [] });
      const misMaterias = await prisma.materia.findMany({
        where: { fichaId: miFicha.id },
        include: {
          instructor: { select: { fullName: true } },
          asistencias: {
            include: {
              registros: { where: { aprendizId: userId } }
            }
          }
        }
      });
      return res.json({ materias: misMaterias });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

module.exports = { createMateria, deleteMateria, getMateriasByFicha, getUserMaterias };
