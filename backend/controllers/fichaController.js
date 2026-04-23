const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
      return res.status(403).json({ error: 'Solo el administrador puede editar la ficha' });
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
    if (numero) dataToUpdate.numero = numero.toString();
    if (nombre) dataToUpdate.nombre = nombre;
    if (nivel) dataToUpdate.nivel = nivel;
    if (centro) dataToUpdate.centro = centro;
    if (jornada) dataToUpdate.jornada = jornada;
    if (region) dataToUpdate.region = region;
    if (duracion) dataToUpdate.duracion = parseInt(duracion);
    
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
      return res.status(403).json({ error: 'Solo el administrador puede regenerar el código' });
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
    const userFichas = await prisma.ficha.findMany({
      where: userType === 'instructor'
        ? { instructores: { some: { instructorId: userId } } }
        : { aprendices: { some: { id: userId } } },
      include: {
        instructores: { include: { instructor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
        aprendices: { select: { id: true, fullName: true, document: true, email: true, avatarUrl: true, nfcUid: true, huellas: true, faceDescriptor: true } },
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
      const isAlreadyInOtherFicha = await prisma.ficha.findFirst({
        where: { aprendices: { some: { id: userId } } }
      });
      if (isAlreadyInOtherFicha) {
        return res.status(400).json({ error: 'Un aprendiz solo puede unirse a una ficha.' });
      }
      await prisma.ficha.update({
        where: { id: ficha.id },
        data: { aprendices: { connect: { id: userId } } }
      });
    } else {
      if (ficha.instructores.some(i => i.instructorId === userId)) {
        return res.status(400).json({ error: 'Ya estás en esta ficha como instructor.' });
      }
      await prisma.fichaInstructor.create({
        data: { fichaId: ficha.id, instructorId: userId, role: 'invitado' }
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

module.exports = {
  createFicha,
  updateFicha,
  regenerateCode,
  getUserFichas,
  getFichaById,
  joinFicha,
  removeAprendiz
};
