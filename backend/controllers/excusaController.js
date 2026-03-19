const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createExcusa = async (req, res) => {
  const { tipo, descripcion, fecha } = req.body;
  const aprendizId = req.user.id;

  if (!tipo || !descripcion) return res.status(400).json({ error: 'Faltan datos' });

  try {
    // Si viene un archivo (para RF33 subida multer), se guarda la URL. (Pendiente implementación router)
    const archivoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newExcusa = await prisma.excusa.create({
      data: {
        tipo,
        descripcion,
        fecha: fecha || new Date().toISOString().split('T')[0],
        estado: 'Pendiente',
        archivoUrl,
        aprendiz: { connect: { id: aprendizId } }
      }
    });

    res.status(201).json({ message: 'Excusa enviada', excusa: newExcusa });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar excusa: ' + err.message });
  }
};

const getUserExcusas = async (req, res) => {
  const userId = req.user.id;
  try {
    const list = await prisma.excusa.findMany({
      where: { aprendizId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ excusas: list });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

const getAllExcusas = async (req, res) => {
  const instructorId = req.user.id;
  try {
    // RF12: Obtener excusas... Para MVP, instructor ve todas las excusas de las fichas a las que pertenece o globales. 
    // Usaremos obtener excusas de aprendices que estén en las fichas del instructor.
    const misFichas = await prisma.ficha.findMany({
      where: { instructores: { some: { id: instructorId } } },
      include: { aprendices: { select: { id: true } } }
    });

    // Aplanar los IDs de los aprendices de estas fichas
    const aprendicesIds = [];
    misFichas.forEach(f => {
      f.aprendices.forEach(a => {
        if (!aprendicesIds.includes(a.id)) aprendicesIds.push(a.id);
      });
    });

    const excusas = await prisma.excusa.findMany({
      where: { aprendizId: { in: aprendicesIds } },
      include: { aprendiz: { select: { fullName: true, document: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ excusas });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

const updateExcusaStatus = async (req, res) => {
  const { id } = req.params;
  const { estado, respuesta } = req.body;
  
  try {
    const excusa = await prisma.excusa.update({
      where: { id },
      data: {
        estado,
        respuesta: respuesta || undefined
      }
    });
    res.json({ message: `Excusa marcada como ${estado}`, excusa });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar excusa: ' + err.message });
  }
};

module.exports = {
  createExcusa,
  getUserExcusas,
  getAllExcusas,
  updateExcusaStatus
};
