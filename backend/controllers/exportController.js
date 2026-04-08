const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const toCSV = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(','))
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
              where: { activa: false },
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

    const rows = [];

    for (const materia of ficha.materias) {
      for (const sesion of materia.asistencias) {
        const fecha = sesion.fecha;
        const hora  = new Date(sesion.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        // Aprendices que SÍ registraron
        for (const reg of sesion.registros) {
          rows.push({
            'Ficha':      ficha.numero,
            'Materia':    materia.nombre,
            'Fecha':      fecha,
            'Nombre':     reg.aprendiz.fullName,
            'Documento':  reg.aprendiz.document,
            'Estado':     reg.presente ? 'Presente' : 'Ausente',
            'Método':     reg.metodo || 'manual',
            'Hora':       hora,
          });
        }

        // Aprendices de la ficha que NO tienen registro → ausentes
        for (const aprendiz of ficha.aprendices) {
          const yaRegistrado = sesion.registros.some(r => r.aprendizId === aprendiz.id);
          if (!yaRegistrado) {
            rows.push({
              'Ficha':      ficha.numero,
              'Materia':    materia.nombre,
              'Fecha':      fecha,
              'Nombre':     aprendiz.fullName,
              'Documento':  aprendiz.document,
              'Estado':     'Ausente',
              'Método':     '-',
              'Hora':       '-',
            });
          }
        }
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No hay sesiones finalizadas para exportar' });
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

module.exports = { exportAsistenciaFicha };
