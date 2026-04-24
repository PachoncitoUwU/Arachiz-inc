const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generador para exportar Asistencias de la clase
function* generarFilasExportacion(ficha) {
  // Iteramos sobre las materias
  for (const materia of ficha.materias) {
    for (const asistencia of materia.asistencias) {
      for (const aprendiz of ficha.aprendices) {
        // Buscar el registro de ese aprendiz
        const registro = asistencia.registros.find(r => r.aprendizId === aprendiz.id);
        
        // Determinar asistencia y hora
        let status = 'No Asistió';
        let horaIngreso = 'N/A';
        let metodo = 'N/A';
        if (registro && registro.presente) {
          status = 'Asistió';
          if (registro.timestamp) {
            const fecha = new Date(registro.timestamp);
            horaIngreso = fecha.toLocaleTimeString('es-CO', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            });
          }
          metodo = registro.metodo || 'código';
        }

        yield {
          Clase: materia.nombre,
          'Fecha Sesión': asistencia.fecha,
          Nombre: aprendiz.fullName,
          Documento: aprendiz.document,
          Estado: status,
          'Hora Ingreso': horaIngreso,
          'Método': metodo
        };
      }
    }
  }
}

const toCSV = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return str.includes(';') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [
    headers.join(';'),
    ...rows.map(row => headers.map(h => escape(row[h])).join(';'))
  ].join('\r\n');
};

// GET /api/export/ficha/:fichaId/asistencia
const exportAsistenciaFicha = async (req, res) => {
  const { fichaId } = req.params;
  const instructorId = req.user.id;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: true,
        aprendices: {
          select: { id: true, fullName: true, document: true }
        },
        materias: {
          include: {
            asistencias: {
              orderBy: { timestamp: 'desc' },
              include: {
                registros: {
                  include: {
                    aprendiz: { select: { id: true, fullName: true, document: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    if (!ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    // Usar el generador para construir las filas iterativamente
    const rows = [...generarFilasExportacion(ficha)];

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No hay registros de asistencia para exportar en esta ficha.' });
    }

    const csv      = toCSV(rows);
    const filename = `Ficha${ficha.numero}_Asistencia_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para Excel con tildes
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar: ' + err.message });
  }
};

// GET /api/export/session/:sessionId
const exportSessionAsistencia = async (req, res) => {
  const { sessionId } = req.params;
  const instructorId = req.user.id;

  try {
    const asistencia = await prisma.asistencia.findUnique({
      where: { id: sessionId },
      include: {
        materia: {
          include: {
            ficha: {
              include: {
                instructores: true,
                aprendices: { select: { id: true, fullName: true, document: true } }
              }
            }
          }
        },
        registros: true
      }
    });

    if (!asistencia) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (!asistencia.materia.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const rows = asistencia.materia.ficha.aprendices.map(aprendiz => {
      const registro = asistencia.registros.find(r => r.aprendizId === aprendiz.id);
      let status = 'No Asistió';
      let horaIngreso = 'N/A';
      let metodo = 'N/A';
      if (registro && registro.presente) {
        status = 'Asistió';
        if (registro.timestamp) {
          const fecha = new Date(registro.timestamp);
          horaIngreso = fecha.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          });
        }
        metodo = registro.metodo || 'código';
      }
      return {
        Clase: asistencia.materia.nombre,
        'Fecha Sesión': asistencia.fecha,
        Nombre: aprendiz.fullName,
        Documento: aprendiz.document,
        Estado: status,
        'Hora Ingreso': horaIngreso,
        'Método': metodo
      };
    });

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No hay registros para exportar.' });
    }

    const csv = toCSV(rows);
    const filename = `Sesion_${asistencia.fecha}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar sesión: ' + err.message });
  }
};

module.exports = { exportAsistenciaFicha, exportSessionAsistencia };
