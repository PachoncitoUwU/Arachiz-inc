const prisma = require('../lib/prisma');

/**
 * Crear registro en historial de cambios
 */
const crearHistorialCambio = async (fichaId, usuarioId, tipoEvento, entidad, entidadId, descripcion, datosAnteriores = null, datosNuevos = null) => {
  try {
    await prisma.historialCambios.create({
      data: {
        fichaId,
        usuarioId,
        tipoEvento,
        entidad,
        entidadId,
        descripcion,
        datosAnteriores,
        datosNuevos
      }
    });
  } catch (err) {
    console.error('Error creando historial de cambio:', err);
  }
};

/**
 * Enviar elemento a la papelera
 */
const enviarAPapelera = async (tipoElemento, elementoId, fichaId, eliminadoPor, rolEliminador, razonEliminacion = null) => {
  try {
    // Obtener datos originales según el tipo
    let datosOriginales = {};
    
    switch (tipoElemento) {
      case 'ficha':
        const ficha = await prisma.ficha.findUnique({
          where: { id: elementoId },
          include: {
            instructorAdmin: { select: { fullName: true } },
            administrador: { select: { fullName: true } },
            _count: {
              select: {
                aprendices: true,
                materias: true,
                instructores: true
              }
            }
          }
        });
        datosOriginales = {
          numero: ficha.numero,
          nombre: ficha.nombre,
          nivel: ficha.nivel,
          centro: ficha.centro,
          jornada: ficha.jornada,
          region: ficha.region,
          duracion: ficha.duracion,
          lider: ficha.instructorAdmin.fullName,
          administrador: ficha.administrador?.fullName,
          contadores: ficha._count
        };
        break;
        
      case 'materia':
        const materia = await prisma.materia.findUnique({
          where: { id: elementoId },
          include: {
            instructor: { select: { id: true, fullName: true } },
            ficha: { select: { numero: true, nombre: true } },
            _count: {
              select: {
                horarios: true,
                asistencias: true
              }
            }
          }
        });
        datosOriginales = {
          nombre: materia.nombre,
          tipo: materia.tipo,
          instructorId: materia.instructorId, // Necesario para recuperación
          instructor: materia.instructor.fullName,
          ficha: `${materia.ficha.numero} - ${materia.ficha.nombre}`,
          contadores: materia._count
        };
        break;
        
      case 'aprendiz':
        const aprendiz = await prisma.user.findUnique({
          where: { id: elementoId },
          select: {
            fullName: true,
            document: true,
            email: true,
            createdAt: true
          }
        });
        datosOriginales = {
          fullName: aprendiz.fullName,
          document: aprendiz.document,
          email: aprendiz.email,
          fechaInscripcion: aprendiz.createdAt
        };
        break;
        
      case 'instructor':
        const instructor = await prisma.user.findUnique({
          where: { id: elementoId },
          select: {
            fullName: true,
            document: true,
            email: true
          }
        });
        datosOriginales = {
          fullName: instructor.fullName,
          document: instructor.document,
          email: instructor.email
        };
        break;
        
      case 'horario':
        const horario = await prisma.horario.findUnique({
          where: { id: elementoId },
          include: {
            materia: {
              select: {
                id: true,
                nombre: true,
                instructor: { select: { fullName: true } }
              }
            }
          }
        });
        datosOriginales = {
          dia: horario.dia,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          materiaId: horario.materiaId, // Necesario para recuperación
          materia: horario.materia.nombre,
          instructor: horario.materia.instructor.fullName
        };
        break;
        
      case 'excusa':
        const excusa = await prisma.excusa.findUnique({
          where: { id: elementoId },
          include: {
            aprendiz: { select: { fullName: true, document: true } },
            materia: { select: { nombre: true } }
          }
        });
        datosOriginales = {
          fechas: excusa.fechas,
          motivo: excusa.motivo,
          estado: excusa.estado,
          aprendiz: excusa.aprendiz.fullName,
          documento: excusa.aprendiz.document,
          materia: excusa.materia.nombre,
          createdAt: excusa.createdAt
        };
        break;
    }

    // Crear registro en papelera
    const papeleraItem = await prisma.papelera.create({
      data: {
        tipoElemento,
        elementoId,
        fichaId,
        eliminadoPor,
        rolEliminador,
        datosOriginales,
        razonEliminacion
      }
    });

    return papeleraItem;
  } catch (err) {
    throw new Error('Error enviando a papelera: ' + err.message);
  }
};

/**
 * Obtener elementos de la papelera
 */
const getPapelera = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { tipo } = req.query;

    // Obtener todas las fichas del admin (incluyendo las que ya no administra pero eliminó)
    const fichasAdmin = await prisma.ficha.findMany({
      where: { administradorId: adminId },
      select: { id: true }
    });

    const fichasIds = fichasAdmin.map(f => f.id);

    let where = {};
    
    if (tipo === 'ficha' || tipo === 'ficha_anterior') {
      // Para fichas eliminadas, buscar por quien las eliminó
      where = {
        tipoElemento: tipo,
        eliminadoPor: adminId
      };
    } else if (tipo && tipo !== 'all') {
      // Para un tipo específico de elemento
      where = {
        tipoElemento: tipo,
        OR: [
          { fichaId: { in: fichasIds } }, // Elementos de sus fichas actuales
          { eliminadoPor: adminId } // O elementos que él eliminó
        ]
      };
    } else {
      // Para todos los elementos
      where = {
        OR: [
          { fichaId: { in: fichasIds } }, // Elementos de sus fichas actuales
          { eliminadoPor: adminId } // O elementos que él eliminó
        ]
      };
    }

    const items = await prisma.papelera.findMany({
      where,
      include: {
        usuario: {
          select: {
            fullName: true,
            userType: true
          }
        },
        ficha: {
          select: {
            numero: true,
            nombre: true
          }
        }
      },
      orderBy: { fechaEliminacion: 'desc' }
    });

    res.json({ items });
  } catch (err) {
    console.error('Error obteniendo papelera:', err);
    res.status(500).json({ error: 'Error obteniendo papelera: ' + err.message });
  }
};

/**
 * Recuperar elemento de la papelera
 */
const recuperarElemento = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    const item = await prisma.papelera.findUnique({
      where: { id },
      include: {
        ficha: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Elemento no encontrado en papelera' });
    }

    // Verificar permisos de recuperación
    const puedeRecuperar = verificarPermisosRecuperacion(item, userId, userType, item.ficha);
    if (!puedeRecuperar) {
      return res.status(403).json({ error: 'No tienes permisos para recuperar este elemento' });
    }

    // Recuperar según el tipo
    let elementoRecuperado = null;
    
    switch (item.tipoElemento) {
      case 'ficha':
        // Las fichas eliminadas no se pueden recuperar automáticamente
        return res.status(400).json({ error: 'Las fichas eliminadas no se pueden recuperar automáticamente' });
        
      case 'ficha_anterior':
        // Las fichas anteriores tampoco se pueden recuperar automáticamente
        return res.status(400).json({ error: 'Las fichas anteriores no se pueden recuperar automáticamente. El usuario debe volver a unirse a la ficha.' });
        
      case 'materia':
        // Verificar que la ficha aún existe
        if (!item.ficha) {
          return res.status(400).json({ error: 'No se puede recuperar la materia: la ficha ya no existe' });
        }
        
        // Para materias, necesitamos el instructorId de los datos originales
        const instructorId = item.datosOriginales?.instructorId;
        if (!instructorId) {
          return res.status(400).json({ error: 'No se puede recuperar la materia: falta información del instructor' });
        }
        
        // Verificar que el instructor aún existe y está en la ficha
        const instructor = await prisma.user.findUnique({
          where: { id: instructorId }
        });
        
        if (!instructor) {
          return res.status(400).json({ error: 'No se puede recuperar la materia: el instructor ya no existe' });
        }
        
        const fichaInstructor = await prisma.fichaInstructor.findUnique({
          where: {
            fichaId_instructorId: {
              fichaId: item.fichaId,
              instructorId: instructorId
            }
          }
        });
        
        if (!fichaInstructor) {
          return res.status(400).json({ error: 'No se puede recuperar la materia: el instructor ya no pertenece a la ficha' });
        }
        
        elementoRecuperado = await prisma.materia.create({
          data: {
            nombre: item.datosOriginales.nombre,
            tipo: item.datosOriginales.tipo,
            fichaId: item.fichaId,
            instructorId: instructorId
          }
        });
        break;
        
      case 'aprendiz':
        // Verificar que la ficha aún existe
        if (!item.ficha) {
          return res.status(400).json({ error: 'No se puede recuperar el aprendiz: la ficha ya no existe' });
        }
        
        // Verificar que el aprendiz aún existe
        const aprendiz = await prisma.user.findUnique({
          where: { id: item.elementoId }
        });
        
        if (!aprendiz) {
          return res.status(400).json({ error: 'No se puede recuperar el aprendiz: el usuario ya no existe' });
        }
        
        // Reconectar aprendiz a la ficha
        await prisma.ficha.update({
          where: { id: item.fichaId },
          data: {
            aprendices: {
              connect: { id: item.elementoId }
            }
          }
        });
        elementoRecuperado = { id: item.elementoId, tipo: 'aprendiz' };
        break;
        
      case 'instructor':
        // Verificar que la ficha aún existe
        if (!item.ficha) {
          return res.status(400).json({ error: 'No se puede recuperar el instructor: la ficha ya no existe' });
        }
        
        // Verificar que el instructor aún existe
        const instructorUsuario = await prisma.user.findUnique({
          where: { id: item.elementoId }
        });
        
        if (!instructorUsuario) {
          return res.status(400).json({ error: 'No se puede recuperar el instructor: el usuario ya no existe' });
        }
        
        // Verificar que no esté ya en la ficha
        const yaEnFicha = await prisma.fichaInstructor.findUnique({
          where: {
            fichaId_instructorId: {
              fichaId: item.fichaId,
              instructorId: item.elementoId
            }
          }
        });
        
        if (yaEnFicha) {
          return res.status(400).json({ error: 'El instructor ya está en la ficha' });
        }
        
        // Reconectar instructor a la ficha
        await prisma.fichaInstructor.create({
          data: {
            fichaId: item.fichaId,
            instructorId: item.elementoId,
            role: 'instructor'
          }
        });
        elementoRecuperado = { id: item.elementoId, tipo: 'instructor' };
        break;
        
      case 'horario':
        // Verificar que la ficha aún existe
        if (!item.ficha) {
          return res.status(400).json({ error: 'No se puede recuperar el horario: la ficha ya no existe' });
        }
        
        // Para horarios, necesitamos la materiaId de los datos originales
        const materiaId = item.datosOriginales?.materiaId;
        if (!materiaId) {
          return res.status(400).json({ error: 'No se puede recuperar el horario: falta información de la materia' });
        }
        
        // Verificar que la materia aún existe
        const materia = await prisma.materia.findUnique({
          where: { id: materiaId }
        });
        
        if (!materia) {
          return res.status(400).json({ error: 'No se puede recuperar el horario: la materia ya no existe' });
        }
        
        elementoRecuperado = await prisma.horario.create({
          data: {
            dia: item.datosOriginales.dia,
            horaInicio: item.datosOriginales.horaInicio,
            horaFin: item.datosOriginales.horaFin,
            fichaId: item.fichaId,
            materiaId: materiaId
          }
        });
        break;
        
      case 'excusa':
        // Las excusas eliminadas no se pueden recuperar (son históricas)
        return res.status(400).json({ error: 'Las excusas eliminadas no se pueden recuperar' });
        
      default:
        return res.status(400).json({ error: 'Tipo de elemento no soportado para recuperación' });
    }

    // Eliminar de papelera
    await prisma.papelera.delete({
      where: { id }
    });

    // Registrar en historial
    await crearHistorialCambio(item.fichaId, userId, 'recuperar', item.tipoElemento, item.elementoId, `Recuperó ${item.tipoElemento} de la papelera`);

    res.json({ 
      message: 'Elemento recuperado exitosamente',
      elemento: elementoRecuperado 
    });
  } catch (err) {
    console.error('Error recuperando elemento:', err);
    res.status(500).json({ error: 'Error recuperando elemento: ' + err.message });
  }
};

/**
 * Eliminar permanentemente de la papelera
 */
const eliminarPermanentemente = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    const item = await prisma.papelera.findUnique({
      where: { id },
      include: {
        ficha: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Elemento no encontrado en papelera' });
    }

    // Solo administradores pueden eliminar permanentemente
    if (userType !== 'administrador' || item.ficha.administradorId !== userId) {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar permanentemente' });
    }

    // Eliminar de papelera
    await prisma.papelera.delete({
      where: { id }
    });

    // Registrar en historial
    await crearHistorialCambio(item.fichaId, userId, 'eliminar_permanente', item.tipoElemento, item.elementoId, `Eliminó permanentemente ${item.tipoElemento} de la papelera`);

    res.json({ message: 'Elemento eliminado permanentemente' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando permanentemente: ' + err.message });
  }
};

/**
 * Verificar permisos de recuperación
 */
const verificarPermisosRecuperacion = (item, userId, userType, ficha) => {
  // Administrador puede recuperar todo de sus fichas
  if (userType === 'administrador' && ficha.administradorId === userId) {
    return true;
  }

  // Líder puede recuperar lo que él eliminó o lo que eliminaron instructores de su ficha
  if (userType === 'instructor' && ficha.instructorAdminId === userId) {
    return item.rolEliminador === 'administrador' || 
           item.rolEliminador === 'instructor' || 
           item.eliminadoPor === userId;
  }

  // Instructor solo puede recuperar lo que él mismo eliminó
  if (userType === 'instructor' && item.eliminadoPor === userId) {
    return true;
  }

  return false;
};

module.exports = {
  enviarAPapelera,
  getPapelera,
  recuperarElemento,
  eliminarPermanentemente,
  crearHistorialCambio
};