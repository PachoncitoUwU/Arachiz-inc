const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const createFicha = async (req, res) => {
  const { numero, nivel, centro, jornada } = req.body;
  const instructorId = req.user.id;

  if (!numero) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const code = generateCode();
    const newFicha = await prisma.ficha.create({
      data: {
        numero,
        nivel,
        centro,
        jornada,
        code,
        instructorAdmin: { connect: { id: instructorId } },
        instructores: { connect: [{ id: instructorId }] }
      },
      include: {
        aprendices: true,
        instructores: true
      }
    });

    res.status(201).json({ message: 'Ficha creada con éxito', ficha: newFicha });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear ficha: ' + err.message });
  }
};

const getUserFichas = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  
  try {
    const userFichas = await prisma.ficha.findMany({
      where: userType === 'instructor' 
        ? { instructores: { some: { id: userId } } }
        : { aprendices: { some: { id: userId } } },
      include: {
        instructores: true,
        aprendices: true
      }
    });

    res.json({ fichas: userFichas });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const joinFicha = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  const { code } = req.body;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { code },
      include: { aprendices: true, instructores: true }
    });

    if (!ficha) return res.status(404).json({ error: 'Código de invitación inválido' });

    if (userType === 'aprendiz' && ficha.aprendices.some(a => a.id === userId)) {
      return res.status(400).json({ error: 'Ya estás en esta ficha' });
    }
    
    // RF65: Restricción para aprendiz (solo 1 ficha)
    if (userType === 'aprendiz') {
      const isAlreadyInOtherFicha = await prisma.ficha.findFirst({
        where: { aprendices: { some: { id: userId } } }
      });
      if (isAlreadyInOtherFicha) return res.status(400).json({ error: 'Un aprendiz solo puede unirse a una ficha.'});
      
      await prisma.ficha.update({
        where: { id: ficha.id },
        data: { aprendices: { connect: { id: userId } } }
      });
    } else {
      // Es instructor
      if (ficha.instructores.some(i => i.id === userId)) return res.status(400).json({ error: 'Ya estás en esta ficha como instructor.'});
      
      await prisma.ficha.update({
        where: { id: ficha.id },
        data: { instructores: { connect: { id: userId } } }
      });
    }

    res.json({ message: 'Te has unido a la ficha exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al unirse: ' + err.message });
  }
};

module.exports = {
  createFicha,
  getUserFichas,
  joinFicha
};
