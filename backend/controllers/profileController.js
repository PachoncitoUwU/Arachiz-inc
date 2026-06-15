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
      // totalAsistencias: cuenta directo en BD (O(1) en índice)
      totalAsistencias = await prisma.registroAsistencia.count({
        where: { aprendizId: userId, presente: true }
      });

      // 1. Estadísticas por materia: agrupar en BD con groupBy, evitando cargar miles de filas
      const [grupoPresentes, grupoAusentes] = await Promise.all([
        prisma.registroAsistencia.groupBy({
          by: ['asistenciaId'],
          where: { aprendizId: userId, presente: true },
          _count: { id: true }
        }),
        prisma.registroAsistencia.groupBy({
          by: ['asistenciaId'],
          where: { aprendizId: userId, presente: false },
          _count: { id: true }
        })
      ]);

      // Obtener los IDs únicos de asistencias para buscar su materia
      const asistenciaIds = [...new Set([
        ...grupoPresentes.map(g => g.asistenciaId),
        ...grupoAusentes.map(g => g.asistenciaId)
      ])];

      const asistencias = await prisma.asistencia.findMany({
        where: { id: { in: asistenciaIds } },
        select: { id: true, resultado: { select: { nombre: true, competencia: { select: { nombre: true } } } } }
      });
      const asistenciaMap = Object.fromEntries(asistencias.map(a => [a.id, a.resultado ? `${a.resultado.competencia.nombre} - ${a.resultado.nombre}` : 'Desconocida']));

      const materiaStats = {};
      grupoPresentes.forEach(g => {
        const mat = asistenciaMap[g.asistenciaId] || 'Desconocida';
        if (!materiaStats[mat]) materiaStats[mat] = { subject: mat, presentes: 0, ausencias: 0 };
        materiaStats[mat].presentes += g._count.id;
      });
      grupoAusentes.forEach(g => {
        const mat = asistenciaMap[g.asistenciaId] || 'Desconocida';
        if (!materiaStats[mat]) materiaStats[mat] = { subject: mat, presentes: 0, ausencias: 0 };
        materiaStats[mat].ausencias += g._count.id;
      });

      chartData = Object.values(materiaStats).map(st => ({
        subject: st.subject,
        percentage: (st.presentes + st.ausencias) > 0
          ? Math.round((st.presentes / (st.presentes + st.ausencias)) * 100)
          : 0,
        presentes: st.presentes,
        ausencias: st.ausencias
      }));

      // 2. Historial Reciente — solo los 10 últimos, con select mínimo
      const registrosRecientes = await prisma.registroAsistencia.findMany({
        where: { aprendizId: userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          timestamp: true,
          presente: true,
          tarde: true,
          justificado: true,
          metodo: true,
          asistencia: {
            select: { resultado: { select: { nombre: true, competencia: { select: { nombre: true } } } } }
          }
        }
      });

      recentHistory = registrosRecientes.map(r => ({
        id: r.id,
        type: 'asistencia',
        date: r.timestamp,
        title: r.presente ? (r.tarde ? 'Llegada Tarde' : 'Presente') : (r.justificado ? 'Falta Justificada' : 'Ausente'),
        description: r.asistencia?.resultado ? `${r.asistencia.resultado.competencia.nombre} - ${r.asistencia.resultado.nombre}` : 'Desconocida',
        status: r.presente ? (r.tarde ? 'warning' : 'success') : (r.justificado ? 'info' : 'danger')
      }));

    } else if (user.userType === 'instructor') {
      totalAsistencias = await prisma.asistencia.count({
        where: { instructorId: userId }
      });

      // Para el instructor, agrupar en BD para no descargar todas las sesiones
      const grupoResultados = await prisma.asistencia.groupBy({
        by: ['resultadoId'],
        where: { instructorId: userId },
        _count: { id: true }
      });

      const resultadoIds = grupoResultados.map(g => g.resultadoId);
      const resultados = await prisma.resultadoAprendizaje.findMany({
        where: { id: { in: resultadoIds } },
        select: { id: true, nombre: true, competencia: { select: { nombre: true } } }
      });
      const resultadoMap = Object.fromEntries(resultados.map(r => [r.id, `${r.competencia.nombre} - ${r.nombre}`]));

      chartData = grupoResultados.map(g => ({
        subject: resultadoMap[g.resultadoId] || 'Desconocida',
        clases: g._count.id
      }));

      // Historial Reciente de clases — solo los 10 últimos con select mínimo
      const clasesRecientes = await prisma.asistencia.findMany({
        where: { instructorId: userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          timestamp: true,
          resultado: { select: { nombre: true, competencia: { select: { nombre: true } } } }
        }
      });

      recentHistory = clasesRecientes.map(c => ({
        id: c.id,
        type: 'clase_creada',
        date: c.timestamp,
        title: 'Sesión Creada',
        description: c.resultado ? `${c.resultado.competencia.nombre} - ${c.resultado.nombre}` : 'Desconocida',
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
