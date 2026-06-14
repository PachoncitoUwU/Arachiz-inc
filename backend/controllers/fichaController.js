const prisma = require('../lib/prisma');
const { generarCodigoFicha } = require('../utils/generators');

// generateCode ahora usa el generador de generators.js
// Antes era: Math.random().toString(36).substring(2,8).toUpperCase()
// Ahora el generador evita caracteres confusos (O, 0, I, 1)

// RF04 - Crear ficha
const createFicha = async (req, res) => {
  const { numero, nombre, nivel, centro, jornada, region, duracion } = req.body;
  const instructorId = req.user.id;
  if (!numero || !nombre || !nivel || !centro || !jornada || !region || !duracion) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  if (nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del programa no puede estar vacío' });
  }
  if (duracion > 30) {
    return res.status(400).json({ error: 'La duración no puede ser mayor a 30 meses' });
  }
  try {
    // Verificar si ya existe una ficha con ese número
    const existingFicha = await prisma.ficha.findUnique({ where: { numero: numero.toString() } });
    if (existingFicha) {
      return res.status(400).json({ error: 'Ya existe una ficha con ese número' });
    }
    
    const code = generarCodigoFicha();
    const newFicha = await prisma.ficha.create({
      data: {
        numero, nombre, nivel, centro, jornada, region,
        duracion: parseInt(duracion),
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
        code,
        instructorAdmin: { connect: { id: instructorId } },
        instructores: {
          create: [{ instructorId, role: 'admin' }]
        }
      },
      include: {
        aprendices: true,
        instructores: { include: { instructor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } }
      }
    });
    res.status(201).json({ message: 'Ficha creada con éxito', ficha: newFicha });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear ficha: ' + err.message });
  }
};

// RF04 - Editar ficha (solo admin)
const updateFicha = async (req, res) => {
  const { id } = req.params;
  const { numero, nombre, nivel, centro, jornada, region, duracion } = req.body;
  const instructorId = req.user.id;
  
  if (nombre && nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del programa no puede estar vacío' });
  }
  
  if (duracion && duracion > 30) {
    return res.status(400).json({ error: 'La duración no puede ser mayor a 30 meses' });
  }
  
  try {
    const ficha = await prisma.ficha.findUnique({ where: { id } });
    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    if (ficha.instructorAdminId !== instructorId) {
      return res.status(403).json({ error: 'Solo el líder puede editar la ficha' });
    }
    
    // Si se está cambiando el número, verificar que no exista otra ficha con ese número
    if (numero && numero.toString() !== ficha.numero.toString()) {
      const existingFicha = await prisma.ficha.findUnique({ where: { numero: numero.toString() } });
      if (existingFicha) {
        return res.status(400).json({ error: 'Ya existe una ficha con ese número' });
      }
    }
    
    const dataToUpdate = {};
    
    // Agregar campos solo si tienen valor
    if (nombre) dataToUpdate.nombre = nombre;
    if (nivel) dataToUpdate.nivel = nivel;
    if (centro) dataToUpdate.centro = centro;
    if (jornada) dataToUpdate.jornada = jornada;
    if (region) dataToUpdate.region = region;
    if (duracion) dataToUpdate.duracion = parseInt(duracion);
    if (req.body.fechaInicio !== undefined) dataToUpdate.fechaInicio = req.body.fechaInicio ? new Date(req.body.fechaInicio) : null;
    if (req.body.fechaFin !== undefined) dataToUpdate.fechaFin = req.body.fechaFin ? new Date(req.body.fechaFin) : null;
    
    const updated = await prisma.ficha.update({
      where: { id },
      data: dataToUpdate,
      include: {
        aprendices: true,
        instructores: { include: { instructor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
        materias: true
      }
    });
    
    res.json({ message: 'Ficha actualizada', ficha: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar ficha: ' + err.message });
  }
};

// RF16 - Regenerar código
const regenerateCode = async (req, res) => {
  const { id } = req.params;
  const instructorId = req.user.id;
  try {
    const ficha = await prisma.ficha.findUnique({ where: { id } });
    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    if (ficha.instructorAdminId !== instructorId) {
      return res.status(403).json({ error: 'Solo el líder puede regenerar el código' });
    }
    const code = generarCodigoFicha();
    const updated = await prisma.ficha.update({ where: { id }, data: { code } });
    res.json({ message: 'Código regenerado', code: updated.code });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF72 - Fichas del usuario
const getUserFichas = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  try {
    let whereClause;
    
    if (userType === 'instructor') {
      whereClause = { instructores: { some: { instructorId: userId } } };
    } else if (userType === 'aprendiz') {
      whereClause = { aprendices: { some: { id: userId } } };
    } else if (userType === 'administrador') {
      whereClause = { administradorId: userId };
    }

    const userFichas = await prisma.ficha.findMany({
      where: whereClause,
      include: {
        instructorAdmin: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        },
        administrador: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        },
        instructores: { include: { instructor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
        aprendices: { select: { id: true } },
        materias: { include: { instructor: { select: { fullName: true } } } }
      }
    });
    res.json({ fichas: userFichas });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

// RF85 - Detalle de ficha
const getFichaById = async (req, res) => {
  const { id } = req.params;
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id },
      include: {
        instructorAdmin: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        },
        administrador: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        },
        instructores: { include: { instructor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
        aprendices: { 
          select: { 
            id: true, 
            fullName: true, 
            document: true, 
            email: true, 
            avatarUrl: true, 
            nfcUid: true, 
            huellas: true, 
            faceDescriptor: true,
            materiasEvitadas: {
              where: { materia: { fichaId: id } },
              include: { materia: true }
            }
          } 
        },
        materias: { 
          include: { 
            instructor: { select: { id: true, fullName: true } },
            horarios: true,
            ficha: { select: { numero: true } }
          } 
        },
        horarios: { include: { materia: { select: { nombre: true } } } }
      }
    });
    
    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json({ ficha });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF17 - Unirse a ficha
const joinFicha = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  const { code } = req.body;
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { code },
      include: {
        aprendices: true,
        instructores: true
      }
    });
    if (!ficha) return res.status(404).json({ error: 'Código de invitación inválido' });

    if (userType === 'aprendiz') {
      if (ficha.aprendices.some(a => a.id === userId)) {
        return res.status(400).json({ error: 'Ya estás en esta ficha' });
      }
      await prisma.ficha.update({
        where: { id: ficha.id },
        data: { aprendices: { connect: { id: userId } } }
      });
    } else if (userType === 'instructor') {
      if (ficha.instructores.some(i => i.instructorId === userId)) {
        return res.status(400).json({ error: 'Ya estás en esta ficha como instructor.' });
      }
      await prisma.fichaInstructor.create({
        data: { fichaId: ficha.id, instructorId: userId, role: 'invitado' }
      });
    } else if (userType === 'administrador') {
      if (ficha.administradorId === userId) {
        return res.status(400).json({ error: 'Ya eres administrador de esta ficha' });
      }
      if (ficha.administradorId) {
        return res.status(400).json({ error: 'Esta ficha ya tiene un administrador asignado' });
      }
      await prisma.ficha.update({
        where: { id: ficha.id },
        data: { administradorId: userId }
      });
    }
    res.json({ message: 'Te has unido a la ficha exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al unirse: ' + err.message });
  }
};

// RF05 - Eliminar aprendiz de ficha
const removeAprendiz = async (req, res) => {
  const { fichaId, aprendizId } = req.params;
  const instructorId = req.user.id;
  try {
    const ficha = await prisma.ficha.findUnique({ where: { id: fichaId } });
    if (!ficha || ficha.instructorAdminId !== instructorId) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    await prisma.ficha.update({
      where: { id: fichaId },
      data: { aprendices: { disconnect: { id: aprendizId } } }
    });
    res.json({ message: 'Aprendiz eliminado de la ficha' });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Obtener historial de cambios de una ficha (para instructores y aprendices)
const getHistorialFicha = async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user.id;
  const userType = req.user.userType;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id },
      include: {
        instructores: true,
        aprendices: { select: { id: true } }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    // Verificar que el usuario pertenece a la ficha
    let hasAccess = false;
    if (userType === 'instructor') {
      hasAccess = ficha.instructores.some(i => i.instructorId === userId);
    } else if (userType === 'aprendiz') {
      hasAccess = ficha.aprendices.some(a => a.id === userId);
    } else if (userType === 'administrador') {
      hasAccess = ficha.administradorId === userId;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes acceso a esta ficha' });
    }

    // Obtener historial de cambios
    const historial = await prisma.historialCambios.findMany({
      where: { fichaId: id },
      include: {
        usuario: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { fechaHora: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Contar total de registros
    const total = await prisma.historialCambios.count({
      where: { fichaId: id }
    });

    res.json({ 
      historial,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo historial: ' + err.message });
  }
};

module.exports = {
  createFicha,
  updateFicha,
  regenerateCode,
  getUserFichas,
  getFichaById,
  joinFicha,
  removeAprendiz,
  getHistorialFicha
};
