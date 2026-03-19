const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RF07/RF57 - Crear clase en horario
const createHorario = async (req, res) => {
  const { fichaId, materiaId, dia, horaInicio, horaFin } = req.body;
  const instructorId = req.user.id;
  if (!fichaId || !materiaId || !dia || !horaInicio || !horaFin) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { instructores: true }
    });
    if (!ficha || !ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    const horario = await prisma.horario.create({
      data: { fichaId, materiaId, dia, horaInicio, horaFin },
      include: { materia: { include: { instructor: { select: { fullName: true } } } } }
    });
    res.status(201).json({ message: 'Clase agregada al horario', horario });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF58 - Eliminar clase del horario
const deleteHorario = async (req, res) => {
  const { id } = req.params;
  const instructorId = req.user.id;
  try {
    const horario = await prisma.horario.findUnique({
      where: { id },
      include: { ficha: { include: { instructores: true } } }
    });
    if (!horario) return res.status(404).json({ error: 'Clase no encontrada' });
    if (!horario.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    await prisma.horario.delete({ where: { id } });
    res.json({ message: 'Clase eliminada del horario' });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF21/RF92 - Horario de una ficha
const getHorarioByFicha = async (req, res) => {
  const { fichaId } = req.params;
  try {
    const horarios = await prisma.horario.findMany({
      where: { fichaId },
      include: {
        materia: { include: { instructor: { select: { fullName: true } } } }
      },
      orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }]
    });
    res.json({ horarios });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { createHorario, deleteHorario, getHorarioByFicha };
