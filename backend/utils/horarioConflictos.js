const prisma = require('../lib/prisma');

/**
 * Detecta conflictos de horario para un instructor en un día específico
 * @param {string} instructorId - ID del instructor
 * @param {string} dia - Día de la semana
 * @param {string} horaInicio - Hora de inicio (HH:MM)
 * @param {string} horaFin - Hora de fin (HH:MM)
 * @param {string} horarioIdExcluir - ID del horario a excluir (para ediciones)
 * @returns {Promise<Array>} - Array de horarios en conflicto
 */
async function detectarConflictos(instructorId, dia, horaInicio, horaFin, horarioIdExcluir = null) {
  const whereClause = {
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
  };

  if (horarioIdExcluir) {
    whereClause.id = { not: horarioIdExcluir };
  }

  const conflictos = await prisma.horario.findMany({
    where: whereClause,
    include: {
      materia: {
        select: {
          nombre: true,
          ficha: { select: { numero: true } }
        }
      }
    }
  });

  return conflictos;
}

/**
 * Crea un registro de conflicto en la base de datos
 * @param {string} instructorId - ID del instructor
 * @param {string} dia - Día de la semana
 * @param {Array} horariosConflicto - Array de horarios en conflicto
 * @param {string} adminId - ID del admin que causó el conflicto
 * @returns {Promise<Object>} - Conflicto creado
 */
async function crearConflicto(instructorId, dia, horariosConflicto, adminId) {
  try {
    // Verificar si ya existe un conflicto no resuelto para este instructor en este día
    const conflictoExistente = await prisma.conflictoHorario.findFirst({
      where: {
        instructorId,
        dia,
        resuelto: false
      }
    });

    if (conflictoExistente) {
      // Actualizar el conflicto existente
      return await prisma.conflictoHorario.update({
        where: { id: conflictoExistente.id },
        data: {
          horarioIds: horariosConflicto.map(h => h.id),
          descripcion: generarDescripcionConflicto(horariosConflicto),
          creadoPor: adminId,
          createdAt: new Date()
        }
      });
    }

    // Crear nuevo conflicto
    return await prisma.conflictoHorario.create({
      data: {
        instructorId,
        dia,
        horarioIds: horariosConflicto.map(h => h.id),
        descripcion: generarDescripcionConflicto(horariosConflicto),
        creadoPor: adminId
      }
    });
  } catch (error) {
    console.error('Error al crear conflicto:', error);
    // No lanzar el error para no bloquear la creación del horario
    return null;
  }
}

/**
 * Genera una descripción legible del conflicto
 * @param {Array} horariosConflicto - Array de horarios en conflicto
 * @returns {string} - Descripción del conflicto
 */
function generarDescripcionConflicto(horariosConflicto) {
  if (horariosConflicto.length === 0) return 'Sin conflictos';
  
  const descripciones = horariosConflicto.map(h => {
    const fichaInfo = h.ficha || h.materia?.ficha;
    const fichaNumero = fichaInfo?.numero || 'N/A';
    return `${h.materia.nombre} (${h.horaInicio} - ${h.horaFin}) en Ficha ${fichaNumero}`;
  });
  
  return `Conflicto de horario: ${descripciones.join(' y ')}`;
}

/**
 * Obtiene todos los conflictos no resueltos de un instructor
 * @param {string} instructorId - ID del instructor
 * @returns {Promise<Array>} - Array de conflictos
 */
async function obtenerConflictosInstructor(instructorId) {
  return await prisma.conflictoHorario.findMany({
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
}

/**
 * Marca un conflicto como resuelto
 * @param {string} conflictoId - ID del conflicto
 * @returns {Promise<Object>} - Conflicto actualizado
 */
async function resolverConflicto(conflictoId) {
  return await prisma.conflictoHorario.update({
    where: { id: conflictoId },
    data: {
      resuelto: true,
      resolvedAt: new Date()
    }
  });
}

/**
 * Verifica si un instructor tiene conflictos no resueltos
 * @param {string} instructorId - ID del instructor
 * @returns {Promise<boolean>} - true si tiene conflictos
 */
async function tieneConflictos(instructorId) {
  const count = await prisma.conflictoHorario.count({
    where: {
      instructorId,
      resuelto: false
    }
  });
  
  return count > 0;
}

module.exports = {
  detectarConflictos,
  crearConflicto,
  obtenerConflictosInstructor,
  resolverConflicto,
  tieneConflictos
};
