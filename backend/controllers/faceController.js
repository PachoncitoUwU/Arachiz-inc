const prisma = require('../lib/prisma');

/**
 * POST /auth/face-descriptor  (requiere auth)
 * Guarda el descriptor facial del usuario autenticado.
 * Body: { descriptor: number[] }
 */
const saveFaceDescriptor = async (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: 'Se requiere un descriptor facial válido (128 valores)' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { faceDescriptor: descriptor },
      select: { id: true, fullName: true }
    });
    res.json({ message: 'Descriptor facial guardado', user });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar descriptor: ' + err.message });
  }
};

/**
 * POST /auth/face-identify  (requiere auth — solo instructor)
 * Recibe un descriptor y busca quién es entre los aprendices de una ficha.
 * Body: { descriptor: number[], fichaId: string }
 * Retorna el aprendiz identificado o error si no hay match.
 */
const faceIdentify = async (req, res) => {
  const { descriptor, fichaId } = req.body;
  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: 'Descriptor inválido' });
  }
  if (!fichaId) {
    return res.status(400).json({ error: 'fichaId requerido' });
  }

  try {
    // Obtener todos los aprendices de la ficha que tienen descriptor facial
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        aprendices: {
          select: { id: true, fullName: true, document: true, faceDescriptor: true }
        }
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });

    const candidates = ficha.aprendices.filter(a => a.faceDescriptor && a.faceDescriptor.length === 128);
    if (candidates.length === 0) {
      return res.status(404).json({ error: 'Ningún aprendiz de esta ficha tiene rostro registrado' });
    }

    const incomingDesc = new Float32Array(descriptor);

    let best = null;
    let bestDist = Infinity;

    for (const candidate of candidates) {
      const knownDesc = new Float32Array(candidate.faceDescriptor);
      // Distancia euclidiana
      let sum = 0;
      for (let i = 0; i < 128; i++) {
        const d = incomingDesc[i] - knownDesc[i];
        sum += d * d;
      }
      const dist = Math.sqrt(sum);
      if (dist < bestDist) { bestDist = dist; best = candidate; }
    }

    const THRESHOLD = 0.55;
    if (bestDist > THRESHOLD || !best) {
      return res.status(404).json({ error: 'No se reconoció a ningún aprendiz', distance: bestDist });
    }

    res.json({
      message: 'Aprendiz identificado',
      userId: best.id,
      fullName: best.fullName,
      document: best.document,
      distance: bestDist
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en identificación: ' + err.message });
  }
};

/**
 * DELETE /auth/face-descriptor  (requiere auth)
 * Elimina el descriptor facial del usuario.
 */
const deleteFaceDescriptor = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { faceDescriptor: [] }
    });
    res.json({ message: 'Descriptor facial eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

/**
 * POST /auth/face-descriptor-for/:userId  (requiere auth — instructor)
 * El instructor guarda el descriptor facial de un aprendiz en su cuenta.
 * Body: { descriptor: number[] }
 */
const saveFaceDescriptorFor = async (req, res) => {
  const { userId } = req.params;
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: 'Descriptor facial inválido (se esperan 128 valores)' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { faceDescriptor: descriptor },
      select: { id: true, fullName: true }
    });
    res.json({ message: 'Descriptor facial guardado', user });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar descriptor: ' + err.message });
  }
};

/**
 * DELETE /auth/face-descriptor-for/:userId  (requiere auth — instructor)
 */
const deleteFaceDescriptorFor = async (req, res) => {
  const { userId } = req.params;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { faceDescriptor: [] }
    });
    res.json({ message: 'Descriptor facial eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { saveFaceDescriptor, faceIdentify, deleteFaceDescriptor, saveFaceDescriptorFor, deleteFaceDescriptorFor };
