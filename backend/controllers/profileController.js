const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        userType: true,
        avatarUrl: true,
        rachaAsistencia: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let totalAsistencias = 0;
    let chartData = [];
    let recentHistory = [];
    
    if (user.userType === 'aprendiz') {
      totalAsistencias = await prisma.registroAsistencia.count({
        where: { aprendizId: userId, presente: true }
      });

      // 1. Estadísticas por materia (Chart Data)
      const todosLosRegistros = await prisma.registroAsistencia.findMany({
        where: { aprendizId: userId },
        include: {
          asistencia: {
            include: { materia: true }
          }
        }
      });

      // Agrupar por materia
      const materiaStats = {};
      todosLosRegistros.forEach(reg => {
        const mat = reg.asistencia.materia.nombre;
        if (!materiaStats[mat]) {
          materiaStats[mat] = { subject: mat, total: 0, presentes: 0 };
        }
        materiaStats[mat].total += 1;
        if (reg.presente) materiaStats[mat].presentes += 1;
      });

      chartData = Object.values(materiaStats).map(st => ({
        subject: st.subject,
        percentage: st.total > 0 ? Math.round((st.presentes / st.total) * 100) : 0,
        presentes: st.presentes,
        ausencias: st.total - st.presentes
      }));

      // 2. Historial Reciente
      const registrosRecientes = await prisma.registroAsistencia.findMany({
        where: { aprendizId: userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          asistencia: {
            include: { materia: true }
          }
        }
      });

      recentHistory = registrosRecientes.map(r => ({
        id: r.id,
        type: 'asistencia',
        date: r.timestamp,
        title: r.presente ? (r.tarde ? 'Llegada Tarde' : 'Presente') : (r.justificado ? 'Falta Justificada' : 'Ausente'),
        description: r.asistencia.materia.nombre,
        status: r.presente ? (r.tarde ? 'warning' : 'success') : (r.justificado ? 'info' : 'danger')
      }));

    } else if (user.userType === 'instructor') {
      totalAsistencias = await prisma.asistencia.count({
        where: { instructorId: userId }
      });

      // Para el instructor, mostrar clases impartidas por materia
      const asistenciasCreadas = await prisma.asistencia.findMany({
        where: { instructorId: userId },
        include: { materia: true }
      });

      const materiaStats = {};
      asistenciasCreadas.forEach(ast => {
        const mat = ast.materia.nombre;
        if (!materiaStats[mat]) {
          materiaStats[mat] = { subject: mat, clases: 0 };
        }
        materiaStats[mat].clases += 1;
      });

      chartData = Object.values(materiaStats).map(st => ({
        subject: st.subject,
        clases: st.clases
      }));

      // Historial Reciente de clases
      const clasesRecientes = await prisma.asistencia.findMany({
        where: { instructorId: userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: { materia: true }
      });

      recentHistory = clasesRecientes.map(c => ({
        id: c.id,
        type: 'clase_creada',
        date: c.timestamp,
        title: 'Sesión Creada',
        description: c.materia.nombre,
        status: 'success'
      }));
    }

    res.json({
      ...user,
      totalAsistencias,
      chartData,
      recentHistory
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getProfileStats
};
