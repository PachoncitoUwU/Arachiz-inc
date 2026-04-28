const prisma = require('../lib/prisma');
const { enviarAPapelera, crearHistorialCambio } = require('./papeleraController');

// RF06 - Crear materia
const createMateria = async (req, res) => {
  const { fichaId, nombre, tipo, instructorId: bodyInstructorId } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  if (!fichaId || !nombre) return res.status(400).json({ error: 'Faltan datos' });
  
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { instructores: true }
    });
    
    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }
    
    let instructorId;
    
    // Determinar el instructor según el tipo de usuario
    if (userType === 'instructor') {
      // El instructor crea la materia para sí mismo
      if (!ficha.instructores.some(i => i.instructorId === userId)) {
        return res.status(403).json({ error: 'No tienes permiso para agregar materias a esta ficha' });
      }
      instructorId = userId;
    } else if (userType === 'administrador') {
      // El admin debe especificar el instructor
      if (ficha.administradorId !== userId) {
        return res.status(403).json({ error: 'No tienes permiso sobre esta ficha' });
      }
      
      if (!bodyInstructorId) {
        return res.status(400).json({ error: 'Debes especificar el instructor a cargo' });
      }
      
      // Verificar que el instructor pertenece a la ficha
      if (!ficha.instructores.some(i => i.instructorId === bodyInstructorId)) {
        return res.status(400).json({ error: 'El instructor no pertenece a esta ficha' });
      }
      
      instructorId = bodyInstructorId;
    } else {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    const newMateria = await prisma.materia.create({
      data: {
        nombre,
        tipo: tipo || 'Técnica',
        ficha: { connect: { id: fichaId } },
        instructor: { connect: { id: instructorId } }
      },
      include: { 
        instructor: { select: { id: true, fullName: true } }, 
        ficha: { select: { id: true, numero: true, nombre: true } } 
      }
    });
    
    res.status(201).json({ message: 'Materia creada', materia: newMateria });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear materia: ' + err.message });
  }
};

// RF70 - Enviar materia a papelera
const deleteMateria = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  try {
    const materia = await prisma.materia.findUnique({
      where: { id },
      include: { 
        ficha: true,
        instructor: { select: { fullName: true } }
      }
    });
    
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    
    // Verificar permisos
    const isLider = materia.ficha.instructorAdminId === userId;
    const isCreator = materia.instructorId === userId;
    const isAdmin = userType === 'administrador' && materia.ficha.administradorId === userId;
    
    if (!isLider && !isCreator && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta materia' });
    }
    
    // Enviar a papelera antes de eliminar
    await enviarAPapelera(
      'materia',
      id,
      materia.fichaId,
      userId,
      userType,
      `Materia ${materia.nombre} eliminada por ${userType}`
    );
    
    // Eliminar materia
    await prisma.materia.delete({ where: { id } });
    
    // Registrar en historial
    await crearHistorialCambio(
      materia.fichaId,
      userId,
      'enviar_papelera',
      'materia',
      id,
      `Envió la materia ${materia.nombre} a la papelera`
    );
    
    res.json({ message: 'Materia enviada a la papelera exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar materia a papelera: ' + err.message });
  }
};

// Editar materia
const updateMateria = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo } = req.body;
  const userId = req.user.id;
  const userType = req.user.userType;
  
  if (!nombre || !tipo) {
    return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
  }
  
  try {
    const materia = await prisma.materia.findUnique({
      where: { id },
      include: { ficha: true }
    });
    
    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }
    
    // Verificar permisos
    const isLider = materia.ficha.instructorAdminId === userId;
    const isCreator = materia.instructorId === userId;
    const isAdmin = userType === 'administrador' && materia.ficha.administradorId === userId;
    
    if (!isLider && !isCreator && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta materia' });
    }
    
    const updatedMateria = await prisma.materia.update({
      where: { id },
      data: { nombre, tipo },
      include: {
        instructor: { select: { id: true, fullName: true } },
        ficha: { select: { numero: true } }
      }
    });
    
    res.json({ message: 'Materia actualizada', materia: updatedMateria });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar materia: ' + err.message });
  }
};

// RF71 - Materias por ficha
const getMateriasByFicha = async (req, res) => {
  const { fichaId } = req.params;
  try {
    const fichaMaterias = await prisma.materia.findMany({
      where: { fichaId },
      include: {
        instructor: { select: { id: true, fullName: true } },
        horarios: true,
        ficha: { select: { numero: true } },
        asistencias: { 
          where: { activa: true },
          select: { id: true, activa: true } 
        }
      }
    });
    res.json({ materias: fichaMaterias });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener materias: ' + err.message });
  }
};

// RF19 / RF47 - Materias del usuario
const getUserMaterias = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  try {
    if (userType === 'instructor') {
      const misMaterias = await prisma.materia.findMany({
        where: { instructorId: userId },
        include: {
          ficha: { select: { numero: true, id: true } },
          horarios: true,
          asistencias: { 
            where: { activa: true },
            select: { id: true, activa: true } 
          },
          _count: { select: { asistencias: true } }
        }
      });
      return res.json({ materias: misMaterias });
    } else {
      // Para aprendices: obtener todas las fichas en las que está inscrito
      const misFichas = await prisma.ficha.findMany({
        where: { aprendices: { some: { id: userId } } },
        select: { id: true }
      });
      
      if (misFichas.length === 0) return res.json({ materias: [] });
      
      const fichaIds = misFichas.map(f => f.id);
      
      // Obtener materias evitadas por el aprendiz
      const materiasEvitadas = await prisma.materiaEvitada.findMany({
        where: { aprendizId: userId },
        select: { materiaId: true }
      });
      
      const materiasEvitadasIds = materiasEvitadas.map(me => me.materiaId);
      
      // Obtener materias de todas las fichas, excluyendo las evitadas
      const misMaterias = await prisma.materia.findMany({
        where: { 
          fichaId: { in: fichaIds },
          id: { notIn: materiasEvitadasIds }
        },
        include: {
          instructor: { select: { fullName: true } },
          horarios: true,
          asistencias: {
            include: {
              registros: {
                where: { aprendizId: userId },
                select: { presente: true }
              }
            }
          }
        }
      });
      return res.json({ materias: misMaterias });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

module.exports = { createMateria, deleteMateria, updateMateria, getMateriasByFicha, getUserMaterias };
