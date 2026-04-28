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
            instructor: { select: { fullName: true } },
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

    // Obtener fichas del admin
    const fichasAdmin = await prisma.ficha.findMany({
      where: { administradorId: adminId },
      select: { id: true }
    });

    const fichasIds = fichasAdmin.map(f => f.id);

    if (fichasIds.length === 0) {
      return res.json({ items: [] });
    }

    const where = {
      fichaId: { in: fichasIds }
    };

    if (tipo && tipo !== 'all') {
      where.tipoElemento = tipo;
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
        // Las fichas no se pueden recuperar automáticamente (requiere recreación manual)
        return res.status(400).json({ error: 'Las fichas eliminadas no se pueden recuperar automáticamente' });
        
      case 'materia':
        elementoRecuperado = await prisma.materia.create({
          data: {
            nombre: item.datosOriginales.nombre,
            tipo: item.datosOriginales.tipo,
            fichaId: item.fichaId,
            instructorId: item.elementoId // Asumiendo que elementoId es el instructorId
          }
        });
        break;
        
      case 'aprendiz':
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
        elementoRecuperado = await prisma.horario.create({
          data: {
            dia: item.datosOriginales.dia,
            horaInicio: item.datosOriginales.horaInicio,
            horaFin: item.datosOriginales.horaFin,
            fichaId: item.fichaId,
            materiaId: item.elementoId // Asumiendo que elementoId es materiaId
          }
        });
        break;
        
      case 'excusa':
        // Las excusas eliminadas no se pueden recuperar (son históricas)
        return res.status(400).json({ error: 'Las excusas eliminadas no se pueden recuperar' });
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