const prisma = require('../lib/prisma');
const { enviarAPapelera, crearHistorialCambio } = require('./papeleraController');

// =====================================================
// GESTIÓN DE FICHAS
// =====================================================

/**
 * Obtener todas las fichas del administrador
 */
const getFichasAdmin = async (req, res) => {
  try {
    const fichas = await prisma.ficha.findMany({
      where: { administradorId: req.user.id },
      include: {
        instructorAdmin: {
          select: { id: true, fullName: true, email: true }
        },
        administrador: {
          select: { id: true, fullName: true, email: true }
        },
        _count: {
          select: {
            aprendices: true,
            instructores: true,
            materias: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ fichas });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo fichas: ' + err.message });
  }
};

/**
 * Obtener detalle de una ficha específica
 */
const getFichaDetalle = async (req, res) => {
  try {
    const { fichaId } = req.params;

    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructorAdmin: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        },
        administrador: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        },
        aprendices: {
          select: {
            id: true,
            fullName: true,
            email: true,
            document: true,
            avatarUrl: true,
            createdAt: true,
            nfcUid: true,
            huellas: true,
            faceDescriptor: true
          }
        },
        instructores: {
          include: {
            instructor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        materias: {
          include: {
            instructor: {
              select: { id: true, fullName: true }
            },
            _count: {
              select: { asistencias: true }
            }
          }
        },
        horarios: {
          include: {
            materia: {
              select: { id: true, nombre: true }
            }
          }
        }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    // Cargar materias evitadas para cada aprendiz
    const aprendicesConMateriasEvitadas = await Promise.all(
      ficha.aprendices.map(async (aprendiz) => {
        const materiasEvitadas = await prisma.materiaEvitada.findMany({
          where: { 
            aprendizId: aprendiz.id,
            materia: {
              fichaId: fichaId
            }
          },
          include: {
            materia: {
              select: {
                id: true,
                nombre: true,
                tipo: true
              }
            }
          }
        });
        
        return {
          ...aprendiz,
          materiasEvitadas
        };
      })
    );

    // Reemplazar aprendices con los que tienen materias evitadas
    ficha.aprendices = aprendicesConMateriasEvitadas;

    res.json({ ficha });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo detalle: ' + err.message });
  }
};

/**
 * Cambiar el líder (instructorAdmin) de una ficha
 */
const cambiarLiderFicha = async (req, res) => {
  try {
    const { fichaId } = req.params;
    const { nuevoLiderId } = req.body;

    if (!nuevoLiderId) {
      return res.status(400).json({ error: 'ID del nuevo líder es requerido' });
    }

    // Verificar que el nuevo líder existe y es instructor
    const nuevoLider = await prisma.user.findUnique({
      where: { id: nuevoLiderId }
    });

    if (!nuevoLider) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (nuevoLider.userType !== 'instructor') {
      return res.status(400).json({ error: 'El nuevo líder debe ser un instructor' });
    }

    // Verificar que el instructor está en la ficha
    const fichaInstructor = await prisma.fichaInstructor.findUnique({
      where: {
        fichaId_instructorId: {
          fichaId,
          instructorId: nuevoLiderId
        }
      }
    });

    if (!fichaInstructor) {
      return res.status(400).json({ error: 'El instructor no pertenece a esta ficha' });
    }

    // Obtener datos anteriores para historial
    const fichaAnterior = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructorAdmin: { select: { fullName: true } }
      }
    });

    // Cambiar el líder
    const fichaActualizada = await prisma.ficha.update({
      where: { id: fichaId },
      data: { instructorAdminId: nuevoLiderId },
      include: {
        instructorAdmin: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        fichaId,
        usuarioId: req.user.id,
        tipoEvento: 'cambio_lider',
        entidad: 'ficha',
        entidadId: fichaId,
        descripcion: `Cambió el líder de la ficha de "${fichaAnterior.instructorAdmin.fullName}" a "${nuevoLider.fullName}"`,
        datosAnteriores: { instructorAdminId: fichaAnterior.instructorAdminId },
        datosNuevos: { instructorAdminId: nuevoLiderId }
      }
    });

    res.json({ 
      message: 'Líder de ficha actualizado correctamente',
      ficha: fichaActualizada 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error cambiando líder: ' + err.message });
  }
};

// =====================================================
// GESTIÓN DE MATERIAS
// =====================================================

/**
 * Cambiar el instructor a cargo de una materia
 */
const cambiarInstructorMateria = async (req, res) => {
  try {
    const { materiaId } = req.params;
    const { nuevoInstructorId } = req.body;

    if (!nuevoInstructorId) {
      return res.status(400).json({ error: 'ID del nuevo instructor es requerido' });
    }

    // Obtener la materia y verificar que pertenece a una ficha del admin
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
      include: {
        ficha: true,
        instructor: { select: { fullName: true } }
      }
    });

    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    if (materia.ficha.administradorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos sobre esta materia' });
    }

    // Verificar que el nuevo instructor existe y es instructor
    const nuevoInstructor = await prisma.user.findUnique({
      where: { id: nuevoInstructorId }
    });

    if (!nuevoInstructor || nuevoInstructor.userType !== 'instructor') {
      return res.status(400).json({ error: 'El nuevo instructor debe ser un usuario de tipo instructor' });
    }

    // Verificar que el instructor está en la ficha
    const fichaInstructor = await prisma.fichaInstructor.findUnique({
      where: {
        fichaId_instructorId: {
          fichaId: materia.fichaId,
          instructorId: nuevoInstructorId
        }
      }
    });

    if (!fichaInstructor) {
      return res.status(400).json({ error: 'El instructor no pertenece a esta ficha' });
    }

    // Cambiar el instructor
    const materiaActualizada = await prisma.materia.update({
      where: { id: materiaId },
      data: { instructorId: nuevoInstructorId },
      include: {
        instructor: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        fichaId: materia.fichaId,
        usuarioId: req.user.id,
        tipoEvento: 'cambio_instructor',
        entidad: 'materia',
        entidadId: materiaId,
        descripcion: `Cambió el instructor de la materia "${materia.nombre}" de "${materia.instructor.fullName}" a "${nuevoInstructor.fullName}"`,
        datosAnteriores: { instructorId: materia.instructorId },
        datosNuevos: { instructorId: nuevoInstructorId }
      }
    });

    res.json({ 
      message: 'Instructor de materia actualizado correctamente',
      materia: materiaActualizada 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error cambiando instructor: ' + err.message });
  }
};

// =====================================================
// GESTIÓN DE USUARIOS
// =====================================================

/**
 * Obtener todos los instructores de las fichas del administrador
 */
const getInstructores = async (req, res) => {
  try {
    const { fichaId } = req.query;

    let whereClause = {};

    if (fichaId) {
      // Verificar que la ficha pertenece al admin
      const ficha = await prisma.ficha.findUnique({
        where: { id: fichaId }
      });

      if (!ficha || ficha.administradorId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a esta ficha' });
      }

      whereClause = { fichaId };
    } else {
      // Obtener instructores de todas las fichas del admin
      const fichasAdmin = await prisma.ficha.findMany({
        where: { administradorId: req.user.id },
        select: { id: true }
      });

      whereClause = {
        fichaId: { in: fichasAdmin.map(f => f.id) }
      };
    }

    const instructores = await prisma.fichaInstructor.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            document: true,
            avatarUrl: true,
            createdAt: true
          }
        },
        ficha: {
          select: {
            id: true,
            numero: true,
            nombre: true
          }
        }
      }
    });

    res.json({ instructores });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo instructores: ' + err.message });
  }
};

/**
 * Obtener todos los aprendices de las fichas del administrador
 */
const getAprendices = async (req, res) => {
  try {
    const { fichaId } = req.query;

    if (fichaId) {
      // Verificar que la ficha pertenece al admin
      const ficha = await prisma.ficha.findUnique({
        where: { id: fichaId },
        include: {
          aprendices: {
            select: {
              id: true,
              fullName: true,
              email: true,
              document: true,
              avatarUrl: true,
              createdAt: true
            }
          }
        }
      });

      if (!ficha || ficha.administradorId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a esta ficha' });
      }

      return res.json({ aprendices: ficha.aprendices });
    }

    // Obtener aprendices de todas las fichas del admin
    const fichas = await prisma.ficha.findMany({
      where: { administradorId: req.user.id },
      include: {
        aprendices: {
          select: {
            id: true,
            fullName: true,
            email: true,
            document: true,
            avatarUrl: true,
            createdAt: true
          }
        }
      }
    });

    // Aplanar y eliminar duplicados
    const aprendicesMap = new Map();
    fichas.forEach(ficha => {
      ficha.aprendices.forEach(aprendiz => {
        if (!aprendicesMap.has(aprendiz.id)) {
          aprendicesMap.set(aprendiz.id, aprendiz);
        }
      });
    });

    const aprendices = Array.from(aprendicesMap.values());

    res.json({ aprendices });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo aprendices: ' + err.message });
  }
};

/**
 * Obtener todas las fichas en las que está inscrito un aprendiz
 */
const getFichasDeAprendiz = async (req, res) => {
  try {
    const { aprendizId } = req.params;

    // Obtener todas las fichas del aprendiz que pertenecen al admin
    const fichas = await prisma.ficha.findMany({
      where: {
        administradorId: req.user.id,
        aprendices: {
          some: { id: aprendizId }
        }
      },
      select: {
        id: true,
        numero: true,
        nombre: true,
        nivel: true,
        centro: true,
        jornada: true,
        createdAt: true
      }
    });

    res.json({ fichas });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo fichas del aprendiz: ' + err.message });
  }
};

/**
 * Obtener todas las fichas en las que está un instructor
 */
const getFichasDeInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Obtener todas las fichas del instructor que pertenecen al admin
    const fichasInstructor = await prisma.fichaInstructor.findMany({
      where: {
        instructorId,
        ficha: {
          administradorId: req.user.id
        }
      },
      include: {
        ficha: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            nivel: true,
            centro: true,
            jornada: true,
            createdAt: true
          }
        }
      }
    });

    const fichas = fichasInstructor.map(fi => fi.ficha);

    res.json({ fichas });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo fichas del instructor: ' + err.message });
  }
};

/**
 * Obtener conflictos de un instructor (para admin)
 */
const getConflictosDeInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Verificar que el instructor pertenece a alguna ficha del admin
    const fichasInstructor = await prisma.fichaInstructor.findFirst({
      where: {
        instructorId,
        ficha: {
          administradorId: req.user.id
        }
      }
    });

    if (!fichasInstructor) {
      return res.status(403).json({ error: 'No tienes acceso a este instructor' });
    }

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
    res.status(500).json({ error: 'Error obteniendo conflictos: ' + err.message });
  }
};

/**
 * Obtener horarios de un instructor específico (para admin)
 */
const getHorariosDeInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Verificar que el instructor pertenece a alguna ficha del admin
    const fichasInstructor = await prisma.fichaInstructor.findFirst({
      where: {
        instructorId,
        ficha: {
          administradorId: req.user.id
        }
      }
    });

    if (!fichasInstructor) {
      return res.status(403).json({ error: 'No tienes acceso a este instructor' });
    }

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
    res.status(500).json({ error: 'Error obteniendo horarios: ' + err.message });
  }
};

/**
 * Obtener materias de un instructor específico (para admin)
 */
const getMateriasDeInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Verificar que el instructor pertenece a alguna ficha del admin
    const fichasInstructor = await prisma.fichaInstructor.findFirst({
      where: {
        instructorId,
        ficha: {
          administradorId: req.user.id
        }
      }
    });

    if (!fichasInstructor) {
      return res.status(403).json({ error: 'No tienes acceso a este instructor' });
    }

    const materias = await prisma.materia.findMany({
      where: { instructorId },
      include: {
        instructor: { select: { id: true, fullName: true } },
        ficha: { select: { id: true, numero: true, nombre: true } },
        _count: { select: { asistencias: true } }
      }
    });

    res.json({ materias });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo materias: ' + err.message });
  }
};

/**
 * Crear una nueva ficha (solo administrador)
 */
const crearFicha = async (req, res) => {
  try {
    const { numero, nivel, centro, jornada, region, duracion, nombre } = req.body;

    if (!numero || !nivel || !centro || !jornada) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que no exista una ficha con ese número
    const fichaExistente = await prisma.ficha.findUnique({
      where: { numero }
    });

    if (fichaExistente) {
      return res.status(400).json({ error: 'Ya existe una ficha con ese número' });
    }

    // Generar código único
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Crear la ficha SIN líder (el admin no puede ser líder)
    const nuevaFicha = await prisma.ficha.create({
      data: {
        numero,
        nivel,
        centro,
        jornada,
        region: region || '',
        duracion: duracion || 0,
        nombre: nombre || 'Programa sin nombre',
        code,
        administradorId: req.user.id // El admin es el administrador
        // instructorAdminId se deja null hasta que se asigne un líder
      },
      include: {
        instructorAdmin: {
          select: { id: true, fullName: true, email: true }
        },
        administrador: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        fichaId: nuevaFicha.id,
        usuarioId: req.user.id,
        tipoEvento: 'crear',
        entidad: 'ficha',
        entidadId: nuevaFicha.id,
        descripcion: `Creó la ficha ${numero} - ${nombre}`
      }
    });

    res.status(201).json({ 
      message: 'Ficha creada exitosamente',
      ficha: nuevaFicha 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creando ficha: ' + err.message });
  }
};

/**
 * Unirse a una ficha existente usando código
 */
const unirseAFicha = async (req, res) => {
  try {
    const { code } = req.params;

    // Buscar la ficha por código
    const ficha = await prisma.ficha.findUnique({
      where: { code }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Código de ficha inválido' });
    }

    // Verificar si ya está asignado como administrador
    if (ficha.administradorId === req.user.id) {
      return res.status(400).json({ error: 'Ya eres administrador de esta ficha' });
    }

    // Asignar al administrador a la ficha
    const fichaActualizada = await prisma.ficha.update({
      where: { id: ficha.id },
      data: { administradorId: req.user.id }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        fichaId: ficha.id,
        usuarioId: req.user.id,
        tipoEvento: 'unirse',
        entidad: 'ficha',
        entidadId: ficha.id,
        descripcion: `Se unió como administrador a la ficha ${ficha.numero}`
      }
    });

    res.json({ 
      message: 'Te has unido a la ficha exitosamente',
      ficha: fichaActualizada 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error uniéndose a la ficha: ' + err.message });
  }
};

/**
 * Regenerar código de invitación de una ficha
 */
const regenerarCodigoFicha = async (req, res) => {
  try {
    const { fichaId } = req.params;

    // Verificar que la ficha existe y pertenece al admin
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.administradorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos sobre esta ficha' });
    }

    // Generar nuevo código
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Actualizar ficha
    const fichaActualizada = await prisma.ficha.update({
      where: { id: fichaId },
      data: { code: newCode }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        fichaId,
        usuarioId: req.user.id,
        tipoEvento: 'regenerar_codigo',
        entidad: 'ficha',
        entidadId: fichaId,
        descripcion: `Regeneró el código de invitación de la ficha ${ficha.numero}`,
        datosAnteriores: { code: ficha.code },
        datosNuevos: { code: newCode }
      }
    });

    res.json({ 
      message: 'Código regenerado exitosamente',
      ficha: fichaActualizada 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error regenerando código: ' + err.message });
  }
};

/**
 * Actualizar información de una ficha
 */
const actualizarFicha = async (req, res) => {
  try {
    const { fichaId } = req.params;
    const { numero, nombre, nivel, centro, jornada, region, duracion } = req.body;

    // Verificar que la ficha existe y pertenece al admin
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.administradorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos sobre esta ficha' });
    }

    // Si se está cambiando el número, verificar que no exista otra ficha con ese número
    if (numero && numero !== ficha.numero) {
      const fichaExistente = await prisma.ficha.findUnique({
        where: { numero }
      });

      if (fichaExistente) {
        return res.status(400).json({ error: 'Ya existe una ficha con ese número' });
      }
    }

    // Actualizar ficha
    const fichaActualizada = await prisma.ficha.update({
      where: { id: fichaId },
      data: {
        numero: numero || ficha.numero,
        nombre: nombre || ficha.nombre,
        nivel: nivel || ficha.nivel,
        centro: centro || ficha.centro,
        jornada: jornada || ficha.jornada,
        region: region !== undefined ? region : ficha.region,
        duracion: duracion !== undefined ? duracion : ficha.duracion
      }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        fichaId,
        usuarioId: req.user.id,
        tipoEvento: 'actualizar',
        entidad: 'ficha',
        entidadId: fichaId,
        descripcion: `Actualizó la información de la ficha ${ficha.numero}`,
        datosAnteriores: { numero: ficha.numero, nombre: ficha.nombre, nivel: ficha.nivel, centro: ficha.centro, jornada: ficha.jornada, region: ficha.region, duracion: ficha.duracion },
        datosNuevos: { numero, nombre, nivel, centro, jornada, region, duracion }
      }
    });

    res.json({ 
      message: 'Ficha actualizada exitosamente',
      ficha: fichaActualizada 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando ficha: ' + err.message });
  }
};

/**
 * Enviar un aprendiz a la papelera (removerlo de una ficha)
 */
const eliminarAprendizDeFicha = async (req, res) => {
  try {
    const { fichaId, aprendizId } = req.params;

    // Verificar que la ficha existe y pertenece al admin
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        aprendices: {
          where: { id: aprendizId },
          select: { id: true, fullName: true }
        }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.administradorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos sobre esta ficha' });
    }

    if (ficha.aprendices.length === 0) {
      return res.status(404).json({ error: 'El aprendiz no pertenece a esta ficha' });
    }

    const aprendiz = ficha.aprendices[0];

    // Enviar a papelera antes de eliminar
    await enviarAPapelera(
      'aprendiz',
      aprendizId,
      fichaId,
      req.user.id,
      req.user.userType,
      `Aprendiz removido de la ficha ${ficha.numero}`
    );

    // Remover aprendiz de la ficha
    await prisma.ficha.update({
      where: { id: fichaId },
      data: {
        aprendices: {
          disconnect: { id: aprendizId }
        }
      }
    });

    // Registrar en historial
    await crearHistorialCambio(
      fichaId,
      req.user.id,
      'enviar_papelera',
      'aprendiz',
      aprendizId,
      `Envió al aprendiz ${aprendiz.fullName} a la papelera (removido de ficha ${ficha.numero})`
    );

    res.json({ message: 'Aprendiz enviado a la papelera exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error enviando aprendiz a papelera: ' + err.message });
  }
};

/**
 * Enviar un instructor a la papelera (removerlo de una ficha)
 */
const eliminarInstructorDeFicha = async (req, res) => {
  try {
    const { fichaId, instructorId } = req.params;

    // Verificar que la ficha existe y pertenece al admin
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: {
          where: { instructorId },
          include: {
            instructor: {
              select: { id: true, fullName: true }
            }
          }
        }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.administradorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos sobre esta ficha' });
    }

    if (ficha.instructores.length === 0) {
      return res.status(404).json({ error: 'El instructor no pertenece a esta ficha' });
    }

    // No permitir eliminar al líder de la ficha
    if (ficha.instructorAdminId === instructorId) {
      return res.status(400).json({ error: 'No puedes eliminar al líder de la ficha. Primero cambia el líder.' });
    }

    const instructor = ficha.instructores[0].instructor;

    // Enviar a papelera antes de eliminar
    await enviarAPapelera(
      'instructor',
      instructorId,
      fichaId,
      req.user.id,
      req.user.userType,
      `Instructor removido de la ficha ${ficha.numero}`
    );

    // Remover instructor de la ficha
    await prisma.fichaInstructor.delete({
      where: {
        fichaId_instructorId: {
          fichaId,
          instructorId
        }
      }
    });

    // Registrar en historial
    await crearHistorialCambio(
      fichaId,
      req.user.id,
      'enviar_papelera',
      'instructor',
      instructorId,
      `Envió al instructor ${instructor.fullName} a la papelera (removido de ficha ${ficha.numero})`
    );

    res.json({ message: 'Instructor enviado a la papelera exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error enviando instructor a papelera: ' + err.message });
  }
};

/**
 * Salir de una ficha (cualquier rol)
 * La ficha se guarda en papelera como "ficha anterior"
 */
const salirDeFicha = async (req, res) => {
  try {
    const { fichaId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Verificar que la ficha existe
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: true,
        aprendices: { where: { id: userId }, select: { id: true, fullName: true } }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    let userFullName = '';
    let tipoSalida = '';

    if (userType === 'aprendiz') {
      // Verificar que el aprendiz está en la ficha
      if (ficha.aprendices.length === 0) {
        return res.status(404).json({ error: 'No perteneces a esta ficha' });
      }
      
      userFullName = ficha.aprendices[0].fullName;
      tipoSalida = 'aprendiz';

      // Enviar a papelera como "ficha anterior"
      await enviarAPapelera(
        'ficha_anterior',
        fichaId,
        fichaId,
        userId,
        userType,
        `Aprendiz ${userFullName} salió de la ficha ${ficha.numero}`
      );

      // Remover aprendiz de la ficha
      await prisma.ficha.update({
        where: { id: fichaId },
        data: {
          aprendices: {
            disconnect: { id: userId }
          }
        }
      });

    } else if (userType === 'instructor' || userType === 'administrador') {
      // Verificar que el instructor/admin está en la ficha
      const fichaInstructor = ficha.instructores.find(fi => fi.instructorId === userId);
      
      if (!fichaInstructor && ficha.administradorId !== userId) {
        return res.status(404).json({ error: 'No perteneces a esta ficha' });
      }

      // No permitir salir si es el líder de la ficha
      if (ficha.instructorAdminId === userId) {
        return res.status(400).json({ error: 'No puedes salir de una ficha donde eres líder. Primero cambia el líder o elimina la ficha.' });
      }

      // No permitir salir si es el administrador de la ficha
      if (ficha.administradorId === userId) {
        return res.status(400).json({ error: 'No puedes salir de una ficha donde eres administrador. Primero transfiere la administración.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true }
      });

      userFullName = user.fullName;
      tipoSalida = userType;

      // Enviar a papelera como "ficha anterior"
      await enviarAPapelera(
        'ficha_anterior',
        fichaId,
        fichaId,
        userId,
        userType,
        `${userType === 'instructor' ? 'Instructor' : 'Administrador'} ${userFullName} salió de la ficha ${ficha.numero}`
      );

      // Remover instructor de la ficha
      if (fichaInstructor) {
        await prisma.fichaInstructor.delete({
          where: {
            fichaId_instructorId: {
              fichaId,
              instructorId: userId
            }
          }
        });
      }
    }

    // Registrar en historial
    await crearHistorialCambio(
      fichaId,
      userId,
      'salir_ficha',
      'ficha_anterior',
      fichaId,
      `${tipoSalida === 'aprendiz' ? 'Aprendiz' : tipoSalida === 'instructor' ? 'Instructor' : 'Administrador'} ${userFullName} salió de la ficha ${ficha.numero}`
    );

    res.json({ message: 'Has salido de la ficha exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error saliendo de la ficha: ' + err.message });
  }
};

/**
 * Eliminar ficha completa (solo administrador)
 */
const eliminarFicha = async (req, res) => {
  try {
    const { fichaId } = req.params;
    const userId = req.user.id;

    // Verificar que la ficha existe y pertenece al admin
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        _count: {
          select: {
            aprendices: true,
            instructores: true,
            materias: true,
            horarios: true
          }
        }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.administradorId !== userId) {
      return res.status(403).json({ error: 'Solo el administrador puede eliminar la ficha' });
    }

    // Enviar a papelera antes de eliminar
    await enviarAPapelera(
      'ficha',
      fichaId,
      fichaId,
      userId,
      'administrador',
      `Ficha ${ficha.numero} eliminada con ${ficha._count.aprendices} aprendices, ${ficha._count.instructores} instructores, ${ficha._count.materias} materias`
    );

    // Eliminar ficha (esto eliminará en cascada todo lo relacionado)
    await prisma.ficha.delete({
      where: { id: fichaId }
    });

    // Registrar en historial (aunque la ficha ya no existe, se guarda en papelera)
    await crearHistorialCambio(
      fichaId,
      userId,
      'eliminar_ficha',
      'ficha',
      fichaId,
      `Eliminó la ficha ${ficha.numero} permanentemente`
    );

    res.json({ message: 'Ficha eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando ficha: ' + err.message });
  }
};
const getExcusasAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { 
      estado, 
      fichaId, 
      materiaId, 
      instructorId, 
      aprendizId,
      fechaDesde,
      fechaHasta,
      fechaJustificadaDesde,
      fechaJustificadaHasta
    } = req.query;

    // Obtener todas las fichas del admin
    const fichasAdmin = await prisma.ficha.findMany({
      where: { administradorId: adminId },
      select: { id: true }
    });

    const fichasIds = fichasAdmin.map(f => f.id);

    if (fichasIds.length === 0) {
      return res.json({ excusas: [] });
    }

    // Construir filtros
    const where = {
      materia: {
        fichaId: { in: fichasIds }
      }
    };

    // Filtro por estado
    if (estado && estado !== 'Todas') {
      where.estado = estado;
    }

    // Filtro por ficha
    if (fichaId && fichaId !== 'all') {
      where.materia.fichaId = fichaId;
    }

    // Filtro por materia
    if (materiaId && materiaId !== 'all') {
      where.materiaId = materiaId;
    }

    // Filtro por instructor
    if (instructorId && instructorId !== 'all') {
      where.materia.instructorId = instructorId;
    }

    // Filtro por aprendiz
    if (aprendizId && aprendizId !== 'all') {
      where.aprendizId = aprendizId;
    }

    // Filtro por fecha de envío
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.createdAt.lte = hasta;
      }
    }

    // Obtener excusas
    const excusas = await prisma.excusa.findMany({
      where,
      include: {
        aprendiz: {
          select: { 
            id: true,
            fullName: true, 
            document: true,
            avatarUrl: true 
          }
        },
        materia: {
          select: {
            id: true,
            nombre: true,
            instructor: {
              select: {
                id: true,
                fullName: true
              }
            },
            ficha: { 
              select: { 
                id: true,
                numero: true, 
                nombre: true 
              } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filtrar por fechas justificadas si es necesario
    let excusasFiltradas = excusas;
    if (fechaJustificadaDesde || fechaJustificadaHasta) {
      excusasFiltradas = excusas.filter(excusa => {
        try {
          const fechas = JSON.parse(excusa.fechas);
          return fechas.some(fecha => {
            const fechaDate = new Date(fecha);
            if (fechaJustificadaDesde && fechaDate < new Date(fechaJustificadaDesde)) return false;
            if (fechaJustificadaHasta && fechaDate > new Date(fechaJustificadaHasta)) return false;
            return true;
          });
        } catch {
          return false;
        }
      });
    }

    res.json({ excusas: excusasFiltradas });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo excusas: ' + err.message });
  }
};

/**
 * Obtener estadísticas de excusas
 */
const getEstadisticasExcusas = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { fichaId, aprendizId, instructorId, materiaId } = req.query;

    // Obtener todas las fichas del admin
    const fichasAdmin = await prisma.ficha.findMany({
      where: { administradorId: adminId },
      select: { id: true }
    });

    const fichasIds = fichasAdmin.map(f => f.id);

    if (fichasIds.length === 0) {
      return res.json({ 
        total: 0,
        pendientes: 0,
        aprobadas: 0,
        rechazadas: 0,
        porcentajeAprobacion: 0,
        porcentajeRechazo: 0,
        topAprendices: [],
        topMaterias: [],
        topInstructores: [],
        excusasPorMes: []
      });
    }

    // Construir filtros base
    const where = {
      materia: {
        fichaId: { in: fichasIds }
      }
    };

    // Aplicar filtros específicos
    if (fichaId && fichaId !== 'all') {
      where.materia.fichaId = fichaId;
    }

    if (aprendizId && aprendizId !== 'all') {
      where.aprendizId = aprendizId;
    }

    if (instructorId && instructorId !== 'all') {
      where.materia.instructorId = instructorId;
    }

    if (materiaId && materiaId !== 'all') {
      where.materiaId = materiaId;
    }

    // Obtener todas las excusas con filtros
    const excusas = await prisma.excusa.findMany({
      where,
      include: {
        aprendiz: {
          select: { id: true, fullName: true }
        },
        materia: {
          select: {
            id: true,
            nombre: true,
            instructor: {
              select: { id: true, fullName: true }
            }
          }
        }
      }
    });

    // Calcular estadísticas generales
    const total = excusas.length;
    const pendientes = excusas.filter(e => e.estado === 'Pendiente').length;
    const aprobadas = excusas.filter(e => e.estado === 'Aprobada').length;
    const rechazadas = excusas.filter(e => e.estado === 'Rechazada').length;
    
    const totalRespondidas = aprobadas + rechazadas;
    const porcentajeAprobacion = totalRespondidas > 0 ? ((aprobadas / totalRespondidas) * 100).toFixed(1) : 0;
    const porcentajeRechazo = totalRespondidas > 0 ? ((rechazadas / totalRespondidas) * 100).toFixed(1) : 0;

    // Top 5 aprendices con más excusas
    const aprendicesMap = {};
    excusas.forEach(e => {
      const key = e.aprendiz.id;
      if (!aprendicesMap[key]) {
        aprendicesMap[key] = {
          id: e.aprendiz.id,
          nombre: e.aprendiz.fullName,
          total: 0,
          aprobadas: 0,
          rechazadas: 0,
          pendientes: 0
        };
      }
      aprendicesMap[key].total++;
      if (e.estado === 'Aprobada') aprendicesMap[key].aprobadas++;
      if (e.estado === 'Rechazada') aprendicesMap[key].rechazadas++;
      if (e.estado === 'Pendiente') aprendicesMap[key].pendientes++;
    });

    const topAprendices = Object.values(aprendicesMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top 5 materias con más excusas
    const materiasMap = {};
    excusas.forEach(e => {
      const key = e.materia.id;
      if (!materiasMap[key]) {
        materiasMap[key] = {
          id: e.materia.id,
          nombre: e.materia.nombre,
          total: 0,
          aprobadas: 0,
          rechazadas: 0,
          pendientes: 0
        };
      }
      materiasMap[key].total++;
      if (e.estado === 'Aprobada') materiasMap[key].aprobadas++;
      if (e.estado === 'Rechazada') materiasMap[key].rechazadas++;
      if (e.estado === 'Pendiente') materiasMap[key].pendientes++;
    });

    const topMaterias = Object.values(materiasMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top 5 instructores con más excusas recibidas
    const instructoresMap = {};
    excusas.forEach(e => {
      const key = e.materia.instructor.id;
      if (!instructoresMap[key]) {
        instructoresMap[key] = {
          id: e.materia.instructor.id,
          nombre: e.materia.instructor.fullName,
          total: 0,
          aprobadas: 0,
          rechazadas: 0,
          pendientes: 0
        };
      }
      instructoresMap[key].total++;
      if (e.estado === 'Aprobada') instructoresMap[key].aprobadas++;
      if (e.estado === 'Rechazada') instructoresMap[key].rechazadas++;
      if (e.estado === 'Pendiente') instructoresMap[key].pendientes++;
    });

    const topInstructores = Object.values(instructoresMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Excusas por mes (últimos 6 meses)
    const excusasPorMes = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59);

      const excusasMes = excusas.filter(e => {
        const fechaExcusa = new Date(e.createdAt);
        return fechaExcusa >= inicioMes && fechaExcusa <= finMes;
      });

      excusasPorMes.push({
        mes: mesNombre,
        total: excusasMes.length,
        aprobadas: excusasMes.filter(e => e.estado === 'Aprobada').length,
        rechazadas: excusasMes.filter(e => e.estado === 'Rechazada').length,
        pendientes: excusasMes.filter(e => e.estado === 'Pendiente').length
      });
    }

    res.json({
      total,
      pendientes,
      aprobadas,
      rechazadas,
      porcentajeAprobacion: parseFloat(porcentajeAprobacion),
      porcentajeRechazo: parseFloat(porcentajeRechazo),
      topAprendices,
      topMaterias,
      topInstructores,
      excusasPorMes
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadísticas: ' + err.message });
  }
};

module.exports = {
  getFichasAdmin,
  getFichaDetalle,
  crearFicha,
  unirseAFicha,
  regenerarCodigoFicha,
  actualizarFicha,
  eliminarFicha,
  eliminarAprendizDeFicha,
  eliminarInstructorDeFicha,
  salirDeFicha,
  cambiarLiderFicha,
  cambiarInstructorMateria,
  getInstructores,
  getAprendices,
  getFichasDeAprendiz,
  getFichasDeInstructor,
  getConflictosDeInstructor,
  getHorariosDeInstructor,
  getMateriasDeInstructor,
  getExcusasAdmin,
  getEstadisticasExcusas
};
