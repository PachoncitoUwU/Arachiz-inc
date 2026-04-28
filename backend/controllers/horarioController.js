const prisma = require('../lib/prisma');
const { detectarConflictos, crearConflicto } = require('../utils/horarioConflictos');
const { enviarAPapelera, crearHistorialCambio } = require('./papeleraController');

// RF07/RF57 - Crear clase en horario
const createHorario = async (req, res) => {
  const { fichaId, materiaId, dia, horaInicio, horaFin } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;
  
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
    
    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }
    
    // Verificar permisos según el tipo de usuario
    if (userType === 'instructor') {
      // El instructor debe estar en la ficha
      if (!ficha.instructores.some(i => i.instructorId === userId)) {
        return res.status(403).json({ error: 'No tienes permiso' });
      }
      
      // Verificar que la materia pertenece al instructor
      const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
      if (!materia || materia.instructorId !== userId) {
        return res.status(403).json({ error: 'Solo puedes agregar horarios para tus propias materias' });
      }
    } else if (userType === 'administrador') {
      // El admin debe ser administrador de la ficha
      if (ficha.administradorId !== userId) {
        return res.status(403).json({ error: 'No tienes permiso sobre esta ficha' });
      }
    } else {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    // Obtener la materia para validar conflictos
    const materia = await prisma.materia.findUnique({ 
      where: { id: materiaId },
      select: { instructorId: true }
    });
    
    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }
    
    // Validar conflictos de horario para el instructor de la materia
    const conflictos = await prisma.horario.findMany({
      where: {
        dia,
        materia: { instructorId: materia.instructorId },
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
    
    // Si es instructor, bloquear si hay conflictos
    // Si es admin, permitir pero crear registro de conflicto
    if (conflictos.length > 0 && userType === 'instructor') {
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
    
    // Si es admin y hay conflictos, crear registro de conflicto
    if (conflictos.length > 0 && userType === 'administrador') {
      await crearConflicto(
        materia.instructorId,
        dia,
        conflictos,
        userId
      );
    }
    
    res.status(201).json({ 
      message: 'Clase agregada al horario', 
      horario,
      conflictos: conflictos.length > 0 && userType === 'administrador' ? {
        count: conflictos.length,
        message: `Se generaron ${conflictos.length} conflicto(s) de horario para el instructor`
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF58 - Enviar clase del horario a papelera
const deleteHorario = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  try {
    const horario = await prisma.horario.findUnique({
      where: { id },
      include: { 
        ficha: { include: { instructores: true } },
        materia: { 
          select: { 
            instructorId: true, 
            nombre: true,
            instructor: { select: { fullName: true } }
          } 
        }
      }
    });
    
    if (!horario) return res.status(404).json({ error: 'Clase no encontrada' });
    
    // Verificar permisos según el tipo de usuario
    if (userType === 'instructor') {
      // El instructor debe estar en la ficha
      if (!horario.ficha.instructores.some(i => i.instructorId === userId)) {
        return res.status(403).json({ error: 'No tienes permiso' });
      }
    } else if (userType === 'administrador') {
      // El admin debe ser administrador de la ficha
      if (horario.ficha.administradorId !== userId) {
        return res.status(403).json({ error: 'No tienes permiso sobre esta ficha' });
      }
    } else {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    const dia = horario.dia;
    const materiaInstructorId = horario.materia?.instructorId;
    
    // Enviar a papelera antes de eliminar
    await enviarAPapelera(
      'horario',
      id,
      horario.fichaId,
      userId,
      userType,
      `Horario ${dia} ${horario.horaInicio}-${horario.horaFin} de ${horario.materia?.nombre} eliminado`
    );
    
    await prisma.horario.delete({ where: { id } });
    
    // Verificar si se resolvieron conflictos en este día
    if (materiaInstructorId) {
      const conflictosRestantes = await detectarConflictos(
        materiaInstructorId,
        dia,
        '00:00',
        '23:59'
      );
      
      // Si no quedan conflictos, marcar como resueltos
      if (conflictosRestantes.length === 0) {
        await prisma.conflictoHorario.updateMany({
          where: {
            instructorId: materiaInstructorId,
            dia,
            resuelto: false
          },
          data: {
            resuelto: true,
            resolvedAt: new Date()
          }
        });
      }
    }
    
    // Registrar en historial
    await crearHistorialCambio(
      horario.fichaId,
      userId,
      'enviar_papelera',
      'horario',
      id,
      `Envió el horario ${dia} ${horario.horaInicio}-${horario.horaFin} de ${horario.materia?.nombre} a la papelera`
    );
    
    res.json({ message: 'Clase enviada a la papelera exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF21/RF92 - Horario de una ficha
const getHorarioByFicha = async (req, res) => {
  const { fichaId } = req.params;
  const userId = req.user?.id;
  const userType = req.user?.userType;
  
  try {
    let materiasEvitadasIds = [];
    
    // Si es un aprendiz, obtener sus materias evitadas
    if (userType === 'aprendiz' && userId) {
      const materiasEvitadas = await prisma.materiaEvitada.findMany({
        where: { aprendizId: userId },
        select: { materiaId: true }
      });
      materiasEvitadasIds = materiasEvitadas.map(me => me.materiaId);
    }
    
    const horarios = await prisma.horario.findMany({
      where: { 
        fichaId,
        ...(materiasEvitadasIds.length > 0 && { materiaId: { notIn: materiasEvitadasIds } })
      },
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
    
    // Verificar si se resolvieron conflictos
    const conflictosActuales = await detectarConflictos(
      instructorId,
      finalDia,
      finalHoraInicio,
      finalHoraFin,
      id
    );
    
    // Si no hay conflictos, marcar como resueltos los conflictos de este día
    if (conflictosActuales.length === 0) {
      await prisma.conflictoHorario.updateMany({
        where: {
          instructorId,
          dia: finalDia,
          resuelto: false
        },
        data: {
          resuelto: true,
          resolvedAt: new Date()
        }
      });
    }
    
    res.json({ message: 'Horario actualizado', horario: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { createHorario, deleteHorario, getHorarioByFicha, getMyHorarios, updateHorario };


// Actualizar horario por admin (permite conflictos)
const updateHorarioAdmin = async (req, res) => {
  const { id } = req.params;
  const { dia, horaInicio, horaFin } = req.body;
  const adminId = req.user.id;
  
  // Validar que horaFin sea mayor que horaInicio si ambos están presentes
  if (horaInicio && horaFin && horaFin <= horaInicio) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
  }
  
  try {
    const horario = await prisma.horario.findUnique({
      where: { id },
      include: { 
        ficha: true,
        materia: { 
          select: { 
            instructorId: true,
            instructor: { select: { fullName: true } }
          } 
        }
      }
    });
    
    if (!horario) return res.status(404).json({ error: 'Clase no encontrada' });
    
    // Verificar que el admin tiene acceso a esta ficha
    if (horario.ficha.administradorId !== adminId) {
      return res.status(403).json({ error: 'No tienes permiso sobre esta ficha' });
    }
    
    // Preparar datos para actualizar
    const finalDia = dia || horario.dia;
    const finalHoraInicio = horaInicio || horario.horaInicio;
    const finalHoraFin = horaFin || horario.horaFin;
    
    // Validar que la hora final sea mayor que la inicial
    if (finalHoraFin <= finalHoraInicio) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
    }
    
    // Detectar conflictos (pero NO bloquear la actualización)
    const conflictos = await detectarConflictos(
      horario.materia.instructorId,
      finalDia,
      finalHoraInicio,
      finalHoraFin,
      id
    );
    
    // Actualizar el horario
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
    
    // Si hay conflictos, crear registro de conflicto
    if (conflictos.length > 0) {
      await crearConflicto(
        horario.materia.instructorId,
        finalDia,
        conflictos,
        adminId
      );
    }
    
    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        fichaId: horario.fichaId,
        usuarioId: adminId,
        tipoEvento: 'editar_horario',
        entidad: 'horario',
        entidadId: id,
        descripcion: `Editó el horario de ${horario.materia.instructor.fullName} - ${updated.materia.nombre}`,
        datosAnteriores: { dia: horario.dia, horaInicio: horario.horaInicio, horaFin: horario.horaFin },
        datosNuevos: { dia: finalDia, horaInicio: finalHoraInicio, horaFin: finalHoraFin }
      }
    });
    
    res.json({ 
      message: 'Horario actualizado', 
      horario: updated,
      conflictos: conflictos.length > 0 ? {
        count: conflictos.length,
        message: `Se generaron ${conflictos.length} conflicto(s) de horario para el instructor`
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Obtener conflictos de un instructor
const getConflictosInstructor = async (req, res) => {
  const instructorId = req.user.id;
  
  try {
    const conflictos = await prisma.conflictoHorario.findMany({
      where: {
        instructorId,
        resuelto: false
      },
      include: {
        admin: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ conflictos });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Resolver conflicto (marcar como resuelto)
const resolverConflicto = async (req, res) => {
  const { id } = req.params;
  const instructorId = req.user.id;
  
  try {
    const conflicto = await prisma.conflictoHorario.findUnique({
      where: { id }
    });
    
    if (!conflicto) {
      return res.status(404).json({ error: 'Conflicto no encontrado' });
    }
    
    if (conflicto.instructorId !== instructorId) {
      return res.status(403).json({ error: 'No tienes permiso para resolver este conflicto' });
    }
    
    const updated = await prisma.conflictoHorario.update({
      where: { id },
      data: {
        resuelto: true,
        resolvedAt: new Date()
      }
    });
    
    res.json({ message: 'Conflicto resuelto', conflicto: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { 
  createHorario, 
  deleteHorario, 
  getHorarioByFicha, 
  getMyHorarios, 
  updateHorario,
  updateHorarioAdmin,
  getConflictosInstructor,
  resolverConflicto
};
