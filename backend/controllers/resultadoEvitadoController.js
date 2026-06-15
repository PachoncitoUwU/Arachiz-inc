const prisma = require('../lib/prisma');
const { crearHistorialCambio } = require('./papeleraController');

// Obtener resultados evitados de un aprendiz en una ficha específica
const getResultadosEvitados = async (req, res) => {
  try {
    const { aprendizId, fichaId } = req.params;

    // Verificar que el aprendiz pertenece a la ficha
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: { aprendices: { where: { id: aprendizId } } }
    });

    if (!ficha || ficha.aprendices.length === 0) {
      return res.status(404).json({ error: 'Aprendiz no encontrado en esta ficha' });
    }

    // Obtener resultados evitados
    const resultadosEvitados = await prisma.resultadoEvitado.findMany({
      where: {
        aprendizId,
        resultado: { competencia: { fichaId } }
      },
      include: {
        resultado: {
          include: {
            competencia: { select: { nombre: true } },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });

    res.json({ resultadosEvitados });
  } catch (error) {
    console.error('Error al obtener resultados evitados:', error);
    res.status(500).json({ error: 'Error al obtener resultados evitados' });
  }
};

// Obtener resultados evitados del aprendiz autenticado
const getMyResultadosEvitados = async (req, res) => {
  try {
    const aprendizId = req.user.id;

    const resultadosEvitados = await prisma.resultadoEvitado.findMany({
      where: { aprendizId },
      include: {
        resultado: {
          include: {
            instructor: { select: { fullName: true } },
            competencia: {
              include: {
                ficha: { select: { numero: true, nombre: true } }
              }
            }
          }
        }
      }
    });

    res.json({ resultadosEvitados });
  } catch (error) {
    console.error('Error al obtener resultados evitados:', error);
    res.status(500).json({ error: 'Error al obtener resultados evitados' });
  }
};

// Actualizar resultados evitados de un aprendiz (por líder/admin)
const updateResultadosEvitados = async (req, res) => {
  try {
    const { aprendizId, fichaId } = req.params;
    const { resultadosEvitadosIds } = req.body;

    if (!Array.isArray(resultadosEvitadosIds)) {
      return res.status(400).json({ error: 'resultadosEvitadosIds debe ser un array' });
    }

    // Verificar ficha y aprendiz
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        aprendices: { where: { id: aprendizId } },
        competencias: { include: { resultados: true } }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.aprendices.length === 0) {
      return res.status(404).json({ error: 'Aprendiz no encontrado en esta ficha' });
    }

    // Verificar permisos
    const isLider = ficha.instructorAdminId === req.user.id;
    const isAdmin = req.user.userType === 'administrador' && ficha.administradorId === req.user.id;
    if (!isLider && !isAdmin) {
      return res.status(403).json({ error: 'Solo el líder o administrador de la ficha puede gestionar resultados evitados' });
    }

    const allResultsInFicha = ficha.competencias.flatMap(c => c.resultados);
    const totalResults = allResultsInFicha.length;

    // Validar que al menos un resultado quede activo
    if (resultadosEvitadosIds.length >= totalResults) {
      return res.status(400).json({ error: 'El aprendiz debe participar en al menos un resultado de aprendizaje' });
    }

    // Validar que todos los resultados pertenecen a la ficha
    const validResultIds = allResultsInFicha.map(r => r.id);
    const invalidIds = resultadosEvitadosIds.filter(id => !validResultIds.includes(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ error: 'Algunos resultados no pertenecen a esta ficha' });
    }

    // Eliminar actuales
    await prisma.resultadoEvitado.deleteMany({
      where: {
        aprendizId,
        resultado: { competencia: { fichaId } }
      }
    });

    // Crear nuevos
    if (resultadosEvitadosIds.length > 0) {
      await prisma.resultadoEvitado.createMany({
        data: resultadosEvitadosIds.map(resultadoId => ({
          aprendizId,
          resultadoId
        }))
      });
    }

    // Obtener actualizados
    const resultadosEvitados = await prisma.resultadoEvitado.findMany({
      where: {
        aprendizId,
        resultado: { competencia: { fichaId } }
      },
      include: {
        resultado: {
          include: {
            competencia: { select: { nombre: true } },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });

    res.json({
      message: 'Resultados evitados actualizados exitosamente',
      resultadosEvitados
    });
  } catch (error) {
    console.error('Error al actualizar resultados evitados:', error);
    res.status(500).json({ error: 'Error al actualizar resultados evitados' });
  }
};

// Evitar un resultado (aprendiz se evita a sí mismo)
const evitarResultado = async (req, res) => {
  try {
    const aprendizId = req.user.id;
    const { resultadoId } = req.params;

    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id: resultadoId },
      include: {
        competencia: {
          include: {
            ficha: {
              include: {
                aprendices: { where: { id: aprendizId } },
                competencias: { include: { resultados: true } }
              }
            }
          }
        }
      }
    });

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }

    if (resultado.competencia.ficha.aprendices.length === 0) {
      return res.status(403).json({ error: 'No perteneces a esta ficha' });
    }

    // Verificar que no está evitado ya
    const yaEvitado = await prisma.resultadoEvitado.findUnique({
      where: {
        aprendizId_resultadoId: {
          aprendizId,
          resultadoId
        }
      }
    });

    if (yaEvitado) {
      return res.status(400).json({ error: 'Ya has evitado este resultado de aprendizaje' });
    }

    // Contar cuántos resultados tiene evitados en esta ficha
    const resultadosEvitadosCount = await prisma.resultadoEvitado.count({
      where: {
        aprendizId,
        resultado: { competencia: { fichaId: resultado.competencia.fichaId } }
      }
    });

    const totalResults = resultado.competencia.ficha.competencias.flatMap(c => c.resultados).length;
    if (resultadosEvitadosCount + 1 >= totalResults) {
      return res.status(400).json({ error: 'Debes participar en al menos un resultado de aprendizaje' });
    }

    // Crear
    await prisma.resultadoEvitado.create({
      data: {
        aprendizId,
        resultadoId
      }
    });

    res.json({
      message: 'Resultado de aprendizaje evitado exitosamente',
      resultadoId
    });
  } catch (error) {
    console.error('Error al evitar resultado:', error);
    res.status(500).json({ error: 'Error al evitar resultado' });
  }
};

// Volver a tomar un resultado (aprendiz deja de evitarlo)
const volverATomarResultado = async (req, res) => {
  try {
    const aprendizId = req.user.id;
    const { resultadoId } = req.params;

    const resultadoEvitado = await prisma.resultadoEvitado.findUnique({
      where: {
        aprendizId_resultadoId: {
          aprendizId,
          resultadoId
        }
      },
      include: {
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: {
                    aprendices: { where: { id: aprendizId } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!resultadoEvitado) {
      return res.status(404).json({ error: 'No has evitado este resultado de aprendizaje' });
    }

    if (resultadoEvitado.resultado.competencia.ficha.aprendices.length === 0) {
      return res.status(403).json({ error: 'No perteneces a esta ficha' });
    }

    await prisma.resultadoEvitado.delete({
      where: { id: resultadoEvitado.id }
    });

    res.json({
      message: 'Ahora puedes tomar este resultado nuevamente',
      resultadoId
    });
  } catch (error) {
    console.error('Error al volver a tomar resultado:', error);
    res.status(500).json({ error: 'Error al volver a tomar resultado' });
  }
};

// Evitar una competencia completa (evita todos sus resultados)
const evitarCompetenciaCompleta = async (req, res) => {
  try {
    const aprendizId = req.user.id;
    const { competenciaId } = req.params;

    const competencia = await prisma.competencia.findUnique({
      where: { id: competenciaId },
      include: {
        resultados: true,
        ficha: {
          include: {
            aprendices: { where: { id: aprendizId } },
            competencias: { include: { resultados: true } }
          }
        }
      }
    });

    if (!competencia) {
      return res.status(404).json({ error: 'Competencia no encontrada' });
    }

    if (competencia.ficha.aprendices.length === 0) {
      return res.status(403).json({ error: 'No perteneces a esta ficha' });
    }

    if (competencia.resultados.length === 0) {
      return res.status(400).json({ error: 'Esta competencia no tiene resultados de aprendizaje' });
    }

    // Obtener resultados actualmente evitados en la ficha
    const avoidedResults = await prisma.resultadoEvitado.findMany({
      where: {
        aprendizId,
        resultado: { competencia: { fichaId: competencia.fichaId } }
      },
      select: { resultadoId: true }
    });

    const avoidedResultIds = avoidedResults.map(r => r.resultadoId);
    const competenciaResultIds = competencia.resultados.map(r => r.id);

    // Validar que al menos un resultado de la ficha quede activo
    const unionAvoided = new Set([...avoidedResultIds, ...competenciaResultIds]);
    const totalResults = competencia.ficha.competencias.flatMap(c => c.resultados).length;

    if (unionAvoided.size >= totalResults) {
      return res.status(400).json({ error: 'Debes participar en al menos un resultado de aprendizaje de la ficha' });
    }

    // Evitar todos los resultados que no estuvieran ya evitados
    const resultsToAvoid = competencia.resultados.filter(r => !avoidedResultIds.includes(r.id));
    if (resultsToAvoid.length > 0) {
      await prisma.resultadoEvitado.createMany({
        data: resultsToAvoid.map(r => ({
          aprendizId,
          resultadoId: r.id
        }))
      });
    }

    // Registrar en historial
    await crearHistorialCambio(
      competencia.fichaId,
      aprendizId,
      'competencia_evitada',
      'competencia',
      competenciaId,
      `Evitó la competencia completa "${competencia.nombre}"`
    );

    res.json({
      message: 'Competencia evitada exitosamente',
      competenciaId
    });
  } catch (error) {
    console.error('Error al evitar competencia completa:', error);
    res.status(500).json({ error: 'Error al evitar competencia completa' });
  }
};

module.exports = {
  getResultadosEvitados,
  getMyResultadosEvitados,
  updateResultadosEvitados,
  evitarResultado,
  volverATomarResultado,
  evitarCompetenciaCompleta
};
