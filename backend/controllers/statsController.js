const prisma = require('../lib/prisma');

const getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.user.id;

    // Obtener los resultados de aprendizaje del instructor
    const resultados = await prisma.resultadoAprendizaje.findMany({
      where: { instructorId },
      include: {
        competencia: {
          include: {
            ficha: {
              include: {
                aprendices: true
              }
            }
          }
        },
        asistencias: {
          include: {
            registros: true
          }
        }
      }
    });

    let totalAsistencias = 0;
    let totalAusencias = 0;
    let estudiantesEnRiesgo = [];

    // Lógica para riesgo de deserción:
    // Si un estudiante tiene > 3 inasistencias en la misma materia, se marca en riesgo.
    
    resultados.forEach(resultado => {
      const asistenciasSesiones = resultado.asistencias;
      const aprendices = resultado.competencia?.ficha?.aprendices || [];
      
      const faltasPorEstudiante = {};
      
      asistenciasSesiones.forEach(sesion => {
        const presentesIds = sesion.registros.filter(r => r.presente).map(r => r.aprendizId);
        
        aprendices.forEach(aprendiz => {
          if (!presentesIds.includes(aprendiz.id)) {
            // Faltó a esta sesión
            faltasPorEstudiante[aprendiz.id] = (faltasPorEstudiante[aprendiz.id] || 0) + 1;
            totalAusencias++;
          } else {
            totalAsistencias++;
          }
        });
      });

      aprendices.forEach(aprendiz => {
        const faltas = faltasPorEstudiante[aprendiz.id] || 0;
        if (faltas >= 3) {
          // Riesgo alto
          estudiantesEnRiesgo.push({
            id: aprendiz.id,
            fullName: aprendiz.fullName,
            materia: `${resultado.competencia?.nombre || 'Desconocida'} - ${resultado.nombre}`,
            faltas,
            riesgo: faltas >= 5 ? 'Crítico' : 'Alto'
          });
        }
      });
    });

    const asistenciaTotal = totalAsistencias + totalAusencias;
    const porcentajeAsistencia = asistenciaTotal > 0 ? Math.round((totalAsistencias / asistenciaTotal) * 100) : 100;

    res.json({
      porcentajeAsistencia,
      estudiantesEnRiesgo,
      totalMaterias: resultados.length
    });
  } catch (error) {
    console.error('Error getting instructor stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getInstructorStats
};
