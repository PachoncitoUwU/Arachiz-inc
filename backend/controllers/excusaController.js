const prisma = require('../lib/prisma');
const { uploadToSupabase, isSupabaseConfigured } = require('../utils/supabaseStorage');

//mira

//holaaaa
// RF11/RF32/RF33 - Crear excusa
const createExcusa = async (req, res) => {
  const { motivo, descripcion, fechas } = req.body;
  const aprendizId = req.user.id;
  if (!motivo || !descripcion || !fechas) return res.status(400).json({ error: 'Faltan datos' });
  try {
    let archivoUrl = null;
    if (req.file) {
      if (!isSupabaseConfigured) {
        return res.status(500).json({ error: 'Faltan las variables SUPABASE_URL y SUPABASE_ANON_KEY en backend/.env para guardar archivos en la nube.' });
      }
      archivoUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, 'excusas');
    }
    // fechas puede venir como string JSON o array
    const fechasStr = typeof fechas === 'string' ? fechas : JSON.stringify(fechas);

    const newExcusa = await prisma.excusa.create({
      data: {
        motivo,
        descripcion,
        fechas: fechasStr,
        estado: 'Pendiente',
        archivoUrl,
        aprendiz: { connect: { id: aprendizId } }
      },
      include: { aprendiz: { select: { fullName: true } } }
    });
    res.status(201).json({ message: 'Excusa enviada', excusa: newExcusa });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar excusa: ' + err.message });
  }
};

// RF36 - Excusas del aprendiz
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

// RF12/RF54 - Todas las excusas (instructor)
const getAllExcusas = async (req, res) => {
  const instructorId = req.user.id;
  try {
    const misFichas = await prisma.ficha.findMany({
      where: { instructores: { some: { instructorId } } },
      include: { aprendices: { select: { id: true } } }
    });
    const aprendicesIds = [];
    misFichas.forEach(f => f.aprendices.forEach(a => {
      if (!aprendicesIds.includes(a.id)) aprendicesIds.push(a.id);
    }));
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

// RF12/RF35/RF53 - Responder excusa
const updateExcusaStatus = async (req, res) => {
  const { id } = req.params;
  const { estado, respuesta } = req.body;
  if (!['Aprobada', 'Rechazada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    const excusa = await prisma.excusa.update({
      where: { id },
      data: { estado, respuesta: respuesta || null, respondedAt: new Date() }
    });
    res.json({ message: `Excusa ${estado.toLowerCase()}`, excusa });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar excusa: ' + err.message });
  }
};

module.exports = { createExcusa, getUserExcusas, getAllExcusas, updateExcusaStatus };
