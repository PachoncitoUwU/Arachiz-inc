const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
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

    // Estilos comunes para encabezados
    const headerStyle = (sheet) => {
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF34A853' } // Arachiz Green
      };
    };

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
    headerStyle(sheetInfo);

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
    headerStyle(sheetInstructores);

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
    headerStyle(sheetMaterias);

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
    headerStyle(sheetAprendices);

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
    headerStyle(sheetHorarios);

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

// GET /api/export/ficha/:fichaId/info/pdf
const exportFichaInfoPdf = async (req, res) => {
  const { fichaId } = req.params;
  const instructorId = req.user.id;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: { include: { instructor: { select: { fullName: true, email: true, document: true } } } },
        aprendices: { select: { fullName: true, document: true, email: true }, orderBy: { fullName: 'asc' } },
        materias: { include: { instructor: { select: { fullName: true } } }, orderBy: { nombre: 'asc' } }
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    if (!ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const filename = `Ficha${ficha.numero}_Info.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Branding Arachiz
    doc.rect(0, 0, doc.page.width, 80).fill('#34A853');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('Arachiz', 40, 25);
    doc.fontSize(12).font('Helvetica').text('Reporte de Ficha', 40, 55);

    doc.fillColor('black');
    doc.moveDown(4);

    // Información General
    doc.fontSize(16).font('Helvetica-Bold').text(`Ficha ${ficha.numero}`, { underline: true }).moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Programa: ${ficha.nombre || 'N/A'}`);
    doc.text(`Nivel: ${ficha.nivel} | Jornada: ${ficha.jornada}`);
    doc.text(`Centro: ${ficha.centro}`);
    doc.moveDown(2);

    // Tabla de Aprendices
    doc.fontSize(14).font('Helvetica-Bold').text('Lista de Aprendices').moveDown(0.5);
    const tableAprendices = {
      headers: ['Nombre Completo', 'Documento', 'Email'],
      rows: ficha.aprendices.map(a => [a.fullName, a.document, a.email])
    };
    await doc.table(tableAprendices, { 
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: (row, indexColumn, indexRow, rectRow) => doc.font("Helvetica").fontSize(10)
    });

    doc.moveDown(2);

    // Tabla de Materias
    doc.fontSize(14).font('Helvetica-Bold').text('Materias').moveDown(0.5);
    const tableMaterias = {
      headers: ['Nombre de Materia', 'Tipo', 'Instructor a cargo'],
      rows: ficha.materias.map(m => [m.nombre, m.tipo, m.instructor?.fullName || 'N/A'])
    };
    await doc.table(tableMaterias, { 
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: (row, indexColumn, indexRow, rectRow) => doc.font("Helvetica").fontSize(10)
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fillColor('gray').fontSize(8).text(
        `Generado por Arachiz el ${new Date().toLocaleString('es-CO')} | Página ${i + 1} de ${pages.count}`,
        0, doc.page.height - 30, { align: 'center' }
      );
      doc.page.margins.bottom = bottom;
    }

    doc.end();

  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Error al exportar PDF' });
  }
};

// GET /api/export/materia/:materiaId/rango?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
const exportAsistenciaRango = async (req, res) => {
  const { materiaId } = req.params;
  const { desde, hasta } = req.query;
  const instructorId = req.user.id;

  try {
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
      include: {
        ficha: {
          include: {
            instructores: true,
            aprendices: { select: { id: true, fullName: true, document: true } }
          }
        },
        asistencias: {
          where: {
            ...(desde || hasta ? {
              fecha: {
                ...(desde ? { gte: desde } : {}),
                ...(hasta ? { lte: hasta } : {})
              }
            } : {})
          },
          orderBy: { timestamp: 'asc' },
          include: {
            registros: true
          }
        }
      }
    });

    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    if (!materia.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const rows = [];
    for (const sesion of materia.asistencias) {
      for (const aprendiz of materia.ficha.aprendices) {
        const reg = sesion.registros.find(r => r.aprendizId === aprendiz.id);
        rows.push({
          Materia: materia.nombre,
          'Fecha Sesión': sesion.fecha,
          Nombre: aprendiz.fullName,
          Documento: aprendiz.document,
          Estado: reg?.presente ? (reg.tarde ? 'Tarde' : 'Presente') : 'Ausente',
          'Hora Ingreso': reg?.timestamp
            ? new Date(reg.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
            : 'N/A',
          Método: reg?.metodo || 'N/A'
        });
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No hay registros en ese rango de fechas.' });
    }

    const csv = toCSV(rows);
    const filename = `Asistencia_${materia.nombre}_${desde || 'inicio'}_${hasta || 'fin'}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar: ' + err.message });
  }
};

// GET /api/export/materia/:materiaId/consolidado
const exportReporteConsolidado = async (req, res) => {
  const { materiaId } = req.params;
  const instructorId = req.user.id;

  try {
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
      include: {
        ficha: {
          include: {
            instructores: true,
            aprendices: {
              select: { id: true, fullName: true, document: true },
              orderBy: { fullName: 'asc' }
            }
          }
        },
        asistencias: {
          where: { activa: false },
          orderBy: { timestamp: 'asc' },
          include: {
            registros: true
          }
        }
      }
    });

    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    if (!materia.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const totalSesiones = materia.asistencias.length;
    if (totalSesiones === 0) {
      return res.status(404).json({ error: 'No hay sesiones cerradas para generar el reporte.' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Arachiz';
    const sheet = workbook.addWorksheet('Reporte Consolidado');

    // Columnas: Nombre, Documento, luego una columna por sesión, luego Total, %
    const columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 }
    ];

    materia.asistencias.forEach((sesion, idx) => {
      columns.push({ header: sesion.fecha, key: `s${idx}`, width: 12 });
    });

    columns.push({ header: 'Presencias', key: 'total', width: 12 });
    columns.push({ header: '% Asistencia', key: 'porcentaje', width: 14 });
    columns.push({ header: 'Tardanzas', key: 'tardanzas', width: 12 });

    sheet.columns = columns;

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34A853' }
    };

    // Data rows
    materia.ficha.aprendices.forEach(aprendiz => {
      const rowData = {
        nombre: aprendiz.fullName,
        documento: aprendiz.document
      };

      let presencias = 0;
      let tardanzas = 0;

      materia.asistencias.forEach((sesion, idx) => {
        const reg = sesion.registros.find(r => r.aprendizId === aprendiz.id);
        if (reg?.presente) {
          presencias++;
          if (reg.tarde) {
            tardanzas++;
            rowData[`s${idx}`] = 'T'; // Tarde
          } else {
            rowData[`s${idx}`] = '✓';
          }
        } else {
          rowData[`s${idx}`] = '✗';
        }
      });

      rowData.total = presencias;
      rowData.porcentaje = `${Math.round((presencias / totalSesiones) * 100)}%`;
      rowData.tardanzas = tardanzas;

      const row = sheet.addRow(rowData);

      // Colorear % según riesgo
      const pct = (presencias / totalSesiones) * 100;
      const pctCell = row.getCell('porcentaje');
      if (pct < 60) {
        pctCell.font = { bold: true, color: { argb: 'FFEA4335' } }; // Rojo
      } else if (pct < 80) {
        pctCell.font = { bold: true, color: { argb: 'FFFBBC05' } }; // Amarillo
      } else {
        pctCell.font = { bold: true, color: { argb: 'FF34A853' } }; // Verde
      }
    });

    // Footer row with totals
    sheet.addRow({});
    sheet.addRow({
      nombre: 'TOTAL SESIONES',
      documento: totalSesiones.toString()
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Consolidado_${materia.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar consolidado: ' + err.message });
  }
};

module.exports = {
  exportAsistenciaFicha,
  exportSessionAsistencia,
  exportFichaInfo,
  exportFichaInfoPdf,
  exportAsistenciaRango,
  exportReporteConsolidado
};
