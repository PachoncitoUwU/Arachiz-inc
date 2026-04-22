const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RF07/RF57 - Crear clase en horario
const createHorario = async (req, res) => {
  const { fichaId, materiaId, dia, horaInicio, horaFin } = req.body;
  const instructorId = req.user.id;
  if (!fichaId || !materiaId || !dia || !horaInicio || !horaFin) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  
  // Validar que horaFin sea mayor que horaInicio
  if (horaFin <= horaInicio) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
  }
  
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { instructores: true }
    });
    if (!ficha || !ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    // Verificar que la materia pertenece al instructor
    const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
    if (!materia || materia.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Solo puedes agregar horarios para tus propias materias' });
    }
    
    // Validar conflictos de horario para el instructor
    const conflictos = await prisma.horario.findMany({
      where: {
        dia,
        materia: { instructorId },
        OR: [
          // Caso 1: El nuevo horario empieza durante una clase existente
          { AND: [{ horaInicio: { lte: horaInicio } }, { horaFin: { gt: horaInicio } }] },
          // Caso 2: El nuevo horario termina durante una clase existente
          { AND: [{ horaInicio: { lt: horaFin } }, { horaFin: { gte: horaFin } }] },
          // Caso 3: El nuevo horario envuelve completamente una clase existente
          { AND: [{ horaInicio: { gte: horaInicio } }, { horaFin: { lte: horaFin } }] }
        ]
      },
      include: { materia: { select: { nombre: true } } }
    });
    
    if (conflictos.length > 0) {
      return res.status(400).json({ 
        error: `Ya tienes una clase programada en ese horario: ${conflictos[0].materia.nombre} (${conflictos[0].horaInicio} - ${conflictos[0].horaFin})` 
      });
    }
    
    const horario = await prisma.horario.create({
      data: { fichaId, materiaId, dia, horaInicio, horaFin },
      include: { 
        materia: { 
          include: { 
            instructor: { select: { fullName: true } },
            ficha: { select: { numero: true, nombre: true } }
          } 
        } 
      }
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

// Obtener todos los horarios del instructor actual
const getMyHorarios = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const horarios = await prisma.horario.findMany({
      where: {
        materia: { instructorId }
      },
      include: {
        materia: { 
          include: { 
            instructor: { select: { fullName: true } },
            ficha: { select: { numero: true, nombre: true } }
          } 
        }
      },
      orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }]
    });
    res.json({ horarios });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF57 - Actualizar día/hora (para drag & drop)
const updateHorario = async (req, res) => {
  const { id } = req.params;
  const { dia, horaInicio, horaFin } = req.body;
  const instructorId = req.user.id;
  
  // Validar que horaFin sea mayor que horaInicio si ambos están presentes
  if (horaInicio && horaFin && horaFin <= horaInicio) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
  }
  
  try {
    const horario = await prisma.horario.findUnique({
      where: { id },
      include: { 
        ficha: { include: { instructores: true } },
        materia: { select: { instructorId: true } }
      }
    });
    if (!horario) return res.status(404).json({ error: 'Clase no encontrada' });
    if (!horario.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    // Solo el instructor de la materia puede editar el horario
    if (horario.materia.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Solo puedes editar horarios de tus propias materias' });
    }
    
    // Preparar datos para actualizar
    const finalDia = dia || horario.dia;
    const finalHoraInicio = horaInicio || horario.horaInicio;
    const finalHoraFin = horaFin || horario.horaFin;
    
    // Validar que la hora final sea mayor que la inicial
    if (finalHoraFin <= finalHoraInicio) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
    }
    
    // Validar conflictos de horario para el instructor (excluyendo el horario actual)
    const conflictos = await prisma.horario.findMany({
      where: {
        id: { not: id },
        dia: finalDia,
        materia: { instructorId },
        OR: [
          { AND: [{ horaInicio: { lte: finalHoraInicio } }, { horaFin: { gt: finalHoraInicio } }] },
          { AND: [{ horaInicio: { lt: finalHoraFin } }, { horaFin: { gte: finalHoraFin } }] },
          { AND: [{ horaInicio: { gte: finalHoraInicio } }, { horaFin: { lte: finalHoraFin } }] }
        ]
      },
      include: { materia: { select: { nombre: true } } }
    });
    
    if (conflictos.length > 0) {
      return res.status(400).json({ 
        error: `Ya tienes una clase programada en ese horario: ${conflictos[0].materia.nombre} (${conflictos[0].horaInicio} - ${conflictos[0].horaFin})` 
      });
    }
    
    const updated = await prisma.horario.update({
      where: { id },
      data: {
        ...(dia && { dia }),
        ...(horaInicio && { horaInicio }),
        ...(horaFin && { horaFin }),
      },
      include: { 
        materia: { 
          include: { 
            instructor: { select: { fullName: true } },
            ficha: { select: { numero: true, nombre: true } }
          } 
        } 
      }
    });
    res.json({ message: 'Horario actualizado', horario: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { createHorario, deleteHorario, getHorarioByFicha, getMyHorarios, updateHorario };
