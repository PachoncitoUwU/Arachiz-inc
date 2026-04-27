const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
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

// GET /api/export/ficha/:fichaId/info
const exportFichaInfo = async (req, res) => {
  const { fichaId } = req.params;
  const instructorId = req.user.id;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: {
          include: {
            instructor: { select: { id: true, fullName: true, email: true, document: true } }
          }
        },
        aprendices: {
          select: { id: true, fullName: true, document: true, email: true },
          orderBy: { fullName: 'asc' }
        },
        materias: {
          include: {
            instructor: { select: { fullName: true } }
          },
          orderBy: { nombre: 'asc' }
        },
        horarios: {
          include: {
            materia: { select: { nombre: true } }
          },
          orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }]
        }
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    if (!ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    // Obtener materias evitadas por cada aprendiz
    const materiasEvitadasPorAprendiz = {};
    for (const aprendiz of ficha.aprendices) {
      const evitadas = await prisma.materiaEvitada.findMany({
        where: { aprendizId: aprendiz.id },
        include: { materia: { select: { nombre: true } } }
      });
      materiasEvitadasPorAprendiz[aprendiz.id] = evitadas.map(e => e.materia.nombre);
    }

    const fechaDescarga = new Date().toLocaleString('es-CO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Arachiz';
    workbook.created = new Date();

    // HOJA 1: INFORMACIÓN GENERAL
    const sheetInfo = workbook.addWorksheet('Información General');
    sheetInfo.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Valor', key: 'valor', width: 40 }
    ];
    sheetInfo.addRows([
      { campo: 'Fecha de Descarga', valor: fechaDescarga },
      { campo: 'Número de Ficha', valor: ficha.numero },
      { campo: 'Nombre del Programa', valor: ficha.nombre || 'N/A' },
      { campo: 'Nivel', valor: ficha.nivel },
      { campo: 'Jornada', valor: ficha.jornada },
      { campo: 'Centro de Formación', valor: ficha.centro },
      { campo: 'Región', valor: ficha.region || 'N/A' },
      { campo: 'Duración (meses)', valor: ficha.duracion || 'N/A' }
    ]);
    // Estilo para headers
    sheetInfo.getRow(1).font = { bold: true };
    sheetInfo.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // HOJA 2: INSTRUCTORES
    const sheetInstructores = workbook.addWorksheet('Instructores');
    sheetInstructores.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rol', key: 'rol', width: 15 }
    ];
    ficha.instructores.forEach(fi => {
      sheetInstructores.addRow({
        nombre: fi.instructor.fullName,
        documento: fi.instructor.document || 'N/A',
        email: fi.instructor.email,
        rol: fi.role === 'admin' ? 'Admin' : 'Instructor'
      });
    });
    sheetInstructores.getRow(1).font = { bold: true };
    sheetInstructores.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // HOJA 3: MATERIAS
    const sheetMaterias = workbook.addWorksheet('Materias');
    sheetMaterias.columns = [
      { header: 'Nombre', key: 'nombre', width: 35 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Instructor a cargo', key: 'instructor', width: 30 }
    ];
    ficha.materias.forEach(materia => {
      sheetMaterias.addRow({
        nombre: materia.nombre,
        tipo: materia.tipo,
        instructor: materia.instructor?.fullName || 'N/A'
      });
    });
    sheetMaterias.getRow(1).font = { bold: true };
    sheetMaterias.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // HOJA 4: APRENDICES
    const sheetAprendices = workbook.addWorksheet('Aprendices');
    sheetAprendices.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Materias Evitadas', key: 'evitadas', width: 40 }
    ];
    ficha.aprendices.forEach(aprendiz => {
      const evitadas = materiasEvitadasPorAprendiz[aprendiz.id] || [];
      sheetAprendices.addRow({
        nombre: aprendiz.fullName,
        documento: aprendiz.document,
        email: aprendiz.email,
        evitadas: evitadas.length > 0 ? evitadas.join(', ') : 'Ninguna'
      });
    });
    sheetAprendices.getRow(1).font = { bold: true };
    sheetAprendices.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // HOJA 5: HORARIOS
    const sheetHorarios = workbook.addWorksheet('Horarios');
    sheetHorarios.columns = [
      { header: 'Día', key: 'dia', width: 15 },
      { header: 'Materia', key: 'materia', width: 35 },
      { header: 'Hora Inicio', key: 'horaInicio', width: 15 },
      { header: 'Hora Fin', key: 'horaFin', width: 15 }
    ];
    ficha.horarios.forEach(horario => {
      sheetHorarios.addRow({
        dia: horario.dia,
        materia: horario.materia?.nombre || 'N/A',
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin
      });
    });
    sheetHorarios.getRow(1).font = { bold: true };
    sheetHorarios.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Ficha${ficha.numero}_Info_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar: ' + err.message });
  }
};

module.exports = { exportAsistenciaFicha, exportSessionAsistencia, exportFichaInfo };
