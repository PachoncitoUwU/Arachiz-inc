const prisma = require('../lib/prisma');
const { detectarConflictos, crearConflicto } = require('../utils/horarioConflictos');
const { enviarAPapelera, crearHistorialCambio } = require('./papeleraController');

// RF07/RF57 - Crear clase en horario
const createHorario = async (req, res) => {
  const { fichaId, resultadoId, dia, horaInicio, horaFin } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  if (!fichaId || !resultadoId || !dia || !horaInicio || !horaFin) {
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
      
      // Verificar que el resultado de aprendizaje pertenece al instructor
      const resultado = await prisma.resultadoAprendizaje.findUnique({ where: { id: resultadoId } });
      if (!resultado || resultado.instructorId !== userId) {
        return res.status(403).json({ error: 'Solo puedes agregar horarios para tus propios resultados de aprendizaje' });
      }
    } else if (userType === 'administrador') {
      // El admin debe ser administrador de la ficha
      if (ficha.administradorId !== userId) {
        return res.status(403).json({ error: 'No tienes permiso sobre esta ficha' });
      }
    } else {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    // Obtener el resultado para validar conflictos
    const resultado = await prisma.resultadoAprendizaje.findUnique({ 
      where: { id: resultadoId },
      select: { instructorId: true }
    });
    
    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }
    
    let conflictos = [];
    
    if (resultado.instructorId) {
      // Validar conflictos de horario para el instructor (en TODAS las fichas)
      conflictos = await prisma.horario.findMany({
        where: {
          dia,
          resultado: { instructorId: resultado.instructorId },
          OR: [
            // Caso 1: El nuevo horario empieza durante una clase existente
            { AND: [{ horaInicio: { lte: horaInicio } }, { horaFin: { gt: horaInicio } }] },
            // Caso 2: El nuevo horario termina durante una clase existente
            { AND: [{ horaInicio: { lt: horaFin } }, { horaFin: { gte: horaFin } }] },
            // Caso 3: El nuevo horario envuelve completamente una clase existente
            { AND: [{ horaInicio: { gte: horaInicio } }, { horaFin: { lte: horaFin } }] }
          ]
        },
        include: { 
          resultado: { 
            select: { 
              nombre: true,
              competencia: {
                select: {
                  nombre: true,
                  ficha: { select: { numero: true, nombre: true } }
                }
              }
            } 
          },
          ficha: { select: { numero: true, nombre: true } }
        }
      });
      
      // Si es instructor, bloquear si hay conflictos
      if (conflictos.length > 0 && userType === 'instructor') {
        const conflictoInfo = conflictos[0];
        const fichaConflicto = conflictoInfo.ficha || conflictoInfo.resultado.competencia.ficha;
        return res.status(400).json({ 
          error: `Ya tienes una clase programada en ese horario: ${conflictoInfo.resultado.nombre} (${conflictoInfo.horaInicio} - ${conflictoInfo.horaFin}) en Ficha ${fichaConflicto.numero}` 
        });
      }
    }
    
    const horario = await prisma.horario.create({
      data: { fichaId, resultadoId, dia, horaInicio, horaFin },
      include: { 
        resultado: { 
          include: { 
            instructor: { select: { fullName: true } },
            competencia: {
              include: {
                ficha: { select: { numero: true, nombre: true } }
              }
            }
          } 
        },
        ficha: { select: { numero: true, nombre: true } }
      }
    });
    
    // Si es admin, hay conflictos y el resultado tiene instructor, crear registro de conflicto
    if (conflictos.length > 0 && userType === 'administrador' && resultado.instructorId) {
      await crearConflicto(
        resultado.instructorId,
        dia,
        conflictos,
        userId
      );
    }
    
    res.status(201).json({ 
      message: 'Clase agregada al horario', 
      horario,
      conflictos: conflictos.length > 0 && userType === 'administrador' && resultado.instructorId ? {
        count: conflictos.length,
        message: `Se generaron ${conflictos.length} conflicto(s) de horario para el instructor`
      } : null
    });
  } catch (err) {
    console.error('Error en createHorario:', err);
    res.status(500).json({ error: 'Error al crear horario: ' + err.message });
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
        resultado: { 
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
    const resultadoInstructorId = horario.resultado?.instructorId;
    
    // Enviar a papelera antes de eliminar
    await enviarAPapelera(
      'horario',
      id,
      horario.fichaId,
      userId,
      userType,
      `Horario ${dia} ${horario.horaInicio}-${horario.horaFin} de ${horario.resultado?.nombre} eliminado`
    );
    
    await prisma.horario.delete({ where: { id } });
    
    // Verificar si se resolvieron conflictos en este día
    if (resultadoInstructorId) {
      const conflictosRestantes = await detectarConflictos(
        resultadoInstructorId,
        dia,
        '00:00',
        '23:59'
      );
      
      // Si no quedan conflictos, marcar como resueltos
      if (conflictosRestantes.length === 0) {
        await prisma.conflictoHorario.updateMany({
          where: {
            instructorId: resultadoInstructorId,
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
      `Envió el horario ${dia} ${horario.horaInicio}-${horario.horaFin} de ${horario.resultado?.nombre} a la papelera`
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
    let resultadosEvitadosIds = [];
    
    // Si es un aprendiz, obtener sus resultados evitados
    if (userType === 'aprendiz' && userId) {
      const resultadosEvitados = await prisma.resultadoEvitado.findMany({
        where: { aprendizId: userId },
        select: { resultadoId: true }
      });
      resultadosEvitadosIds = resultadosEvitados.map(re => re.resultadoId);
    }
    
    const horarios = await prisma.horario.findMany({
      where: { 
        fichaId,
        ...(resultadosEvitadosIds.length > 0 && { resultadoId: { notIn: resultadosEvitadosIds } })
      },
      include: {
        resultado: {
          include: {
            instructor: { select: { fullName: true } },
            competencia: { select: { nombre: true } }
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

// Obtener todos los horarios del instructor actual
const getMyHorarios = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const horarios = await prisma.horario.findMany({
      where: {
        resultado: { instructorId }
      },
      include: {
        resultado: { 
          include: { 
            instructor: { select: { fullName: true } },
            competencia: {
              include: {
                ficha: { select: { numero: true, nombre: true } }
              }
            }
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
        resultado: { select: { instructorId: true } }
      }
    });
    if (!horario) return res.status(404).json({ error: 'Clase no encontrada' });
    if (!horario.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    // Solo el instructor del resultado puede editar el horario
    if (horario.resultado.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Solo puedes editar horarios de tus propios resultados de aprendizaje' });
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
        resultado: { instructorId },
        OR: [
          { AND: [{ horaInicio: { lte: finalHoraInicio } }, { horaFin: { gt: finalHoraInicio } }] },
          { AND: [{ horaInicio: { lt: finalHoraFin } }, { horaFin: { gte: finalHoraFin } }] },
          { AND: [{ horaInicio: { gte: finalHoraInicio } }, { horaFin: { lte: finalHoraFin } }] }
        ]
      },
      include: { 
        resultado: { 
          select: { 
            nombre: true,
            competencia: {
              select: {
                ficha: { select: { numero: true, nombre: true } }
              }
            }
          } 
        },
        ficha: { select: { numero: true, nombre: true } }
      }
    });
    
    // Actualizar el horario (permitir aunque haya conflictos)
    const updated = await prisma.horario.update({
      where: { id },
      data: {
        ...(dia && { dia }),
        ...(horaInicio && { horaInicio }),
        ...(horaFin && { horaFin }),
      },
      include: { 
        resultado: { 
          include: { 
            instructor: { select: { fullName: true } },
            competencia: {
              include: {
                ficha: { select: { numero: true, nombre: true } }
              }
            }
          } 
        },
        ficha: { select: { numero: true, nombre: true } }
      }
    });
    
    // Si hay conflictos, crear registro de conflicto
    if (conflictos.length > 0) {
      await crearConflicto(
        instructorId,
        finalDia,
        conflictos,
        instructorId // El instructor genera su propio conflicto
      );
    }
    
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
    
    res.json({ 
      message: 'Horario actualizado', 
      horario: updated,
      conflictos: conflictos.length > 0 ? {
        count: conflictos.length,
        message: `Se generaron ${conflictos.length} conflicto(s) de horario. Puedes resolverlos ajustando tus horarios.`,
        detalles: conflictos.map(c => ({
          dia: c.dia,
          resultado: c.resultado?.nombre,
          horario: `${c.horaInicio} - ${c.horaFin}`,
          ficha: c.ficha?.numero || c.resultado?.competencia?.ficha?.numero
        }))
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

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
        resultado: { 
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
    let conflictos = [];
    if (horario.resultado.instructorId) {
      conflictos = await detectarConflictos(
        horario.resultado.instructorId,
        finalDia,
        finalHoraInicio,
        finalHoraFin,
        id
      );
    }
    
    // Actualizar el horario
    const updated = await prisma.horario.update({
      where: { id },
      data: {
        ...(dia && { dia }),
        ...(horaInicio && { horaInicio }),
        ...(horaFin && { horaFin }),
      },
      include: { 
        resultado: { 
          include: { 
            instructor: { select: { fullName: true } },
            competencia: {
              include: {
                ficha: { select: { numero: true, nombre: true } }
              }
            }
          } 
        } 
      }
    });
    
    // Si hay conflictos, crear registro de conflicto
    if (conflictos.length > 0 && horario.resultado.instructorId) {
      await crearConflicto(
        horario.resultado.instructorId,
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
        descripcion: `Editó el horario de ${horario.resultado.instructor?.fullName || 'Sin instructor'} - ${updated.resultado.nombre}`,
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
