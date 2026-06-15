const prisma = require('../lib/prisma');
const { enviarAPapelera, crearHistorialCambio } = require('./papeleraController');
const { detectarConflictos, crearConflicto } = require('../utils/horarioConflictos');

// Crear resultado de aprendizaje
const createResultado = async (req, res) => {
  const { competenciaId, nombre } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;

  if (!competenciaId || !nombre) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const competencia = await prisma.competencia.findUnique({
      where: { id: competenciaId },
      include: { ficha: { include: { instructores: true } } }
    });

    if (!competencia) {
      return res.status(404).json({ error: 'Competencia no encontrada' });
    }

    // Verificar permisos: instructor de la ficha o admin de la ficha
    let tienePermiso = false;
    if (userType === 'instructor') {
      tienePermiso = competencia.ficha.instructores.some(i => i.instructorId === userId);
    } else if (userType === 'administrador') {
      tienePermiso = competencia.ficha.administradorId === userId;
    }

    if (!tienePermiso) {
      return res.status(403).json({ error: 'No tienes permiso para agregar resultados a esta competencia' });
    }

    const newResultado = await prisma.resultadoAprendizaje.create({
      data: {
        nombre,
        competencia: { connect: { id: competenciaId } }
      },
      include: {
        competencia: { include: { ficha: { select: { id: true, numero: true, nombre: true } } } }
      }
    });

    // Registrar en historial
    await crearHistorialCambio(
      competencia.fichaId,
      userId,
      'resultado_creado',
      'resultado_aprendizaje',
      newResultado.id,
      `Creó el resultado de aprendizaje "${nombre}" en la competencia "${competencia.nombre}"`
    );

    res.status(201).json({ message: 'Resultado de aprendizaje creado', resultado: newResultado });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear resultado de aprendizaje: ' + err.message });
  }
};

// Editar resultado de aprendizaje
const updateResultado = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id },
      include: { competencia: { include: { ficha: true } } }
    });

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }

    // Verificar permisos: instructor a cargo, líder de la ficha, o administrador de la ficha
    const isCargo = resultado.instructorId === userId;
    const isLider = resultado.competencia.ficha.instructorAdminId === userId;
    const isAdmin = userType === 'administrador' && resultado.competencia.ficha.administradorId === userId;

    if (!isCargo && !isLider && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para editar este resultado' });
    }

    const updatedResultado = await prisma.resultadoAprendizaje.update({
      where: { id },
      data: { nombre },
      include: {
        instructor: { select: { id: true, fullName: true } },
        competencia: { select: { id: true, nombre: true } }
      }
    });

    // Registrar en historial
    await crearHistorialCambio(
      resultado.competencia.fichaId,
      userId,
      'resultado_actualizado',
      'resultado_aprendizaje',
      id,
      `Actualizó el resultado de aprendizaje a "${nombre}" (antes "${resultado.nombre}")`
    );

    res.json({ message: 'Resultado de aprendizaje actualizado', resultado: updatedResultado });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar resultado de aprendizaje: ' + err.message });
  }
};

// Eliminar resultado de aprendizaje (papelera + eliminar)
const deleteResultado = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.userType;

  try {
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id },
      include: { competencia: { include: { ficha: true } } }
    });

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }

    // Verificar permisos: instructor a cargo, líder de la ficha, o administrador de la ficha
    const isCargo = resultado.instructorId === userId;
    const isLider = resultado.competencia.ficha.instructorAdminId === userId;
    const isAdmin = userType === 'administrador' && resultado.competencia.ficha.administradorId === userId;

    if (!isCargo && !isLider && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este resultado' });
    }

    // Enviar a papelera
    await enviarAPapelera(
      'resultado_aprendizaje',
      id,
      resultado.competencia.fichaId,
      userId,
      userType,
      `Resultado de aprendizaje ${resultado.nombre} eliminado por ${userType}`
    );

    // Eliminar resultado
    await prisma.resultadoAprendizaje.delete({ where: { id } });

    // Registrar en historial
    await crearHistorialCambio(
      resultado.competencia.fichaId,
      userId,
      'enviar_papelera',
      'resultado_aprendizaje',
      id,
      `Envió el resultado de aprendizaje "${resultado.nombre}" a la papelera`
    );

    res.json({ message: 'Resultado de aprendizaje enviado a la papelera exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar resultado de aprendizaje a papelera: ' + err.message });
  }
};

// Tomar a cargo un resultado (para instructores)
const tomarResultado = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.userType;

  if (userType !== 'instructor') {
    return res.status(403).json({ error: 'Solo los instructores pueden tomar resultados' });
  }

  try {
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id },
      include: { competencia: { include: { ficha: true } } }
    });

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }

    // Verificar que el instructor pertenece a la ficha
    const fichaInstructor = await prisma.fichaInstructor.findUnique({
      where: {
        fichaId_instructorId: {
          fichaId: resultado.competencia.fichaId,
          instructorId: userId
        }
      }
    });

    if (!fichaInstructor) {
      return res.status(403).json({ error: 'No perteneces a esta ficha' });
    }

    // Verificar que el resultado no tiene instructor asignado
    if (resultado.instructorId) {
      return res.status(400).json({ error: 'Este resultado ya tiene un instructor asignado' });
    }

    // Detectar conflictos de horario
    const horariosResultado = await prisma.horario.findMany({
      where: { resultadoId: id },
      select: { dia: true, horaInicio: true, horaFin: true }
    });

    let todosLosConflictos = [];

    for (const horario of horariosResultado) {
      const conflictos = await detectarConflictos(
        userId,
        horario.dia,
        horario.horaInicio,
        horario.horaFin
      );

      if (conflictos.length > 0) {
        todosLosConflictos.push(...conflictos);
        await crearConflicto(userId, horario.dia, conflictos, userId);
      }
    }

    // Asignar el instructor
    const updatedResultado = await prisma.resultadoAprendizaje.update({
      where: { id },
      data: { instructorId: userId },
      include: {
        instructor: { select: { id: true, fullName: true } },
        competencia: { include: { ficha: { select: { numero: true } } } }
      }
    });

    // Registrar en historial
    await crearHistorialCambio(
      resultado.competencia.fichaId,
      userId,
      'instructor_resultado_tomado',
      'resultado_aprendizaje',
      id,
      `Tomó a cargo el resultado "${resultado.nombre}"${todosLosConflictos.length > 0 ? ` (generó ${todosLosConflictos.length} conflicto(s))` : ''}`
    );

    res.json({
      message: 'Resultado de aprendizaje tomado exitosamente',
      resultado: updatedResultado,
      conflictos: todosLosConflictos.length > 0 ? {
        count: todosLosConflictos.length,
        message: `Se generaron ${todosLosConflictos.length} conflicto(s) de horario.`,
        detalles: todosLosConflictos.map(c => ({
          dia: c.dia,
          resultado: c.resultado?.nombre,
          horario: `${c.horaInicio} - ${c.horaFin}`,
          ficha: c.ficha?.numero || c.resultado?.competencia?.ficha?.numero
        }))
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al tomar resultado de aprendizaje: ' + err.message });
  }
};

// Dejar de estar a cargo de un resultado (para instructores)
const dejarResultado = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.userType;

  if (userType !== 'instructor') {
    return res.status(403).json({ error: 'Solo los instructores pueden dejar resultados' });
  }

  try {
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id },
      include: { competencia: { include: { ficha: true } } }
    });

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }

    // Verificar que el instructor es quien está a cargo
    if (resultado.instructorId !== userId) {
      return res.status(403).json({ error: 'No estás a cargo de este resultado de aprendizaje' });
    }

    const updatedResultado = await prisma.resultadoAprendizaje.update({
      where: { id },
      data: { instructorId: null },
      include: {
        instructor: { select: { id: true, fullName: true } },
        competencia: { include: { ficha: { select: { numero: true } } } }
      }
    });

    // Registrar en historial
    await crearHistorialCambio(
      resultado.competencia.fichaId,
      userId,
      'instructor_resultado_dejado',
      'resultado_aprendizaje',
      id,
      `Dejó de estar a cargo del resultado "${resultado.nombre}"`
    );

    res.json({ message: 'Has dejado de estar a cargo del resultado de aprendizaje', resultado: updatedResultado });
  } catch (err) {
    res.status(500).json({ error: 'Error al dejar resultado de aprendizaje: ' + err.message });
  }
};

// Asignar instructor (para administradores)
const asignarInstructor = async (req, res) => {
  const { id } = req.params;
  const { instructorId } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;

  try {
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id },
      include: { competencia: { include: { ficha: true } } }
    });

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }

    // Verificar permisos: administrador de la ficha
    const isAdmin = userType === 'administrador' && resultado.competencia.ficha.administradorId === userId;
    if (!isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para asignar instructores a resultados de esta ficha' });
    }

    const targetInstructorId = instructorId === '' ? null : instructorId;
    let todosLosConflictos = [];

    if (targetInstructorId) {
      // Verificar que el instructor existe y es del tipo correcto
      const instructor = await prisma.user.findUnique({
        where: { id: targetInstructorId }
      });

      if (!instructor || instructor.userType !== 'instructor') {
        return res.status(400).json({ error: 'El instructor especificado no es válido' });
      }

      // Verificar que el instructor pertenece a la ficha
      const fichaInstructor = await prisma.fichaInstructor.findUnique({
        where: {
          fichaId_instructorId: {
            fichaId: resultado.competencia.fichaId,
            instructorId: targetInstructorId
          }
        }
      });

      if (!fichaInstructor) {
        return res.status(400).json({ error: 'El instructor no pertenece a esta ficha' });
      }

      // Detectar conflictos de horario
      const horariosResultado = await prisma.horario.findMany({
        where: { resultadoId: id },
        select: { dia: true, horaInicio: true, horaFin: true }
      });

      for (const horario of horariosResultado) {
        const conflictos = await detectarConflictos(
          targetInstructorId,
          horario.dia,
          horario.horaInicio,
          horario.horaFin
        );

        if (conflictos.length > 0) {
          todosLosConflictos.push(...conflictos);
          await crearConflicto(targetInstructorId, horario.dia, conflictos, userId);
        }
      }
    }

    const updatedResultado = await prisma.resultadoAprendizaje.update({
      where: { id },
      data: { instructorId: targetInstructorId },
      include: {
        instructor: { select: { id: true, fullName: true } },
        competencia: { include: { ficha: { select: { numero: true } } } }
      }
    });

    // Registrar en historial
    await crearHistorialCambio(
      resultado.competencia.fichaId,
      userId,
      'cambio_instructor',
      'resultado_aprendizaje',
      id,
      targetInstructorId
        ? `Asignó al instructor "${updatedResultado.instructor?.fullName}" al resultado "${resultado.nombre}"`
        : `Removió al instructor a cargo del resultado "${resultado.nombre}"`
    );

    res.json({
      message: 'Instructor asignado al resultado exitosamente',
      resultado: updatedResultado,
      conflictos: todosLosConflictos.length > 0 ? {
        count: todosLosConflictos.length,
        message: `Se detectaron ${todosLosConflictos.length} conflicto(s) de horario.`,
        detalles: todosLosConflictos.map(c => ({
          dia: c.dia,
          resultado: c.resultado?.nombre,
          horario: `${c.horaInicio} - ${c.horaFin}`,
          ficha: c.ficha?.numero || c.resultado?.competencia?.ficha?.numero
        }))
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al asignar instructor: ' + err.message });
  }
};

// Obtener resultados de aprendizaje por competencia
const getResultadosByCompetencia = async (req, res) => {
  const { competenciaId } = req.params;

  try {
    const resultados = await prisma.resultadoAprendizaje.findMany({
      where: { competenciaId },
      include: {
        instructor: { select: { id: true, fullName: true } },
        horarios: true,
        competencia: { select: { nombre: true, fichaId: true } }
      }
    });

    res.json({ resultados });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener resultados: ' + err.message });
  }
};

module.exports = {
  createResultado,
  updateResultado,
  deleteResultado,
  tomarResultado,
  dejarResultado,
  asignarInstructor,
  getResultadosByCompetencia
};
