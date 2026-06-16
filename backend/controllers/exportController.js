const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const prisma = new PrismaClient();

// Generador para exportar Asistencias de la clase
function* generarFilasExportacion(ficha) {
  // Iteramos sobre las competencias
  for (const competencia of ficha.competencias || []) {
    for (const resultado of competencia.resultados || []) {
      for (const asistencia of resultado.asistencias || []) {
        for (const aprendiz of ficha.aprendices || []) {
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
            Competencia: competencia.nombre,
            Resultado: resultado.nombre,
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
        competencias: {
          include: {
            resultados: {
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
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: {
                    instructores: true,
                    aprendices: { select: { id: true, fullName: true, document: true } }
                  }
                }
              }
            }
          }
        },
        registros: true
      }
    });

    if (!asistencia) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (!asistencia.resultado.competencia.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const rows = asistencia.resultado.competencia.ficha.aprendices.map(aprendiz => {
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
        Clase: asistencia.resultado.nombre,
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
        competencias: {
          include: {
            resultados: {
              include: {
                instructor: { select: { fullName: true } }
              }
            }
          },
          orderBy: { nombre: 'asc' }
        },
        horarios: {
          include: {
            resultado: { select: { nombre: true } }
          },
          orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }]
        }
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    if (!ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    // Obtener resultados evitados por cada aprendiz
    const resultadosEvitadosPorAprendiz = {};
    for (const aprendiz of ficha.aprendices) {
      const evitadas = await prisma.resultadoEvitado.findMany({
        where: { aprendizId: aprendiz.id },
        include: { resultado: { select: { nombre: true } } }
      });
      resultadosEvitadosPorAprendiz[aprendiz.id] = evitadas.map(e => e.resultado.nombre);
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

    // HOJA 3: COMPETENCIAS Y RESULTADOS
    const sheetMaterias = workbook.addWorksheet('Competencias');
    sheetMaterias.columns = [
      { header: 'Competencia', key: 'competencia', width: 35 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Resultado de Aprendizaje', key: 'resultado', width: 35 },
      { header: 'Instructor a cargo', key: 'instructor', width: 30 }
    ];
    ficha.competencias.forEach(comp => {
      if (comp.resultados?.length > 0) {
        comp.resultados.forEach(res => {
          sheetMaterias.addRow({
            competencia: comp.nombre,
            tipo: comp.tipo,
            resultado: res.nombre,
            instructor: res.instructor?.fullName || 'N/A'
          });
        });
      } else {
        sheetMaterias.addRow({
          competencia: comp.nombre,
          tipo: comp.tipo,
          resultado: 'N/A',
          instructor: 'N/A'
        });
      }
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
      const evitadas = resultadosEvitadosPorAprendiz[aprendiz.id] || [];
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
        materia: horario.resultado?.nombre || 'N/A',
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
        competencias: {
          include: {
            resultados: {
              include: {
                instructor: { select: { fullName: true } }
              }
            }
          },
          orderBy: { nombre: 'asc' }
        }
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

    // Tabla de Resultados
    doc.fontSize(14).font('Helvetica-Bold').text('Resultados de Aprendizaje').moveDown(0.5);
    const rowsCompetencias = [];
    ficha.competencias.forEach(comp => {
      (comp.resultados || []).forEach(res => {
        rowsCompetencias.push([comp.nombre, comp.tipo, res.nombre, res.instructor?.fullName || 'N/A']);
      });
    });
    const tableMaterias = {
      headers: ['Competencia', 'Tipo', 'Resultado', 'Instructor a cargo'],
      rows: rowsCompetencias
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

// GET /api/export/resultado/:resultadoId/rango?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
const exportAsistenciaRango = async (req, res) => {
  const { resultadoId } = req.params;
  const { desde, hasta } = req.query;
  const instructorId = req.user.id;

  try {
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id: resultadoId },
      include: {
        competencia: {
          include: {
            ficha: {
              include: {
                instructores: true,
                aprendices: { select: { id: true, fullName: true, document: true } }
              }
            }
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

    if (!resultado) return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    if (!resultado.competencia.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const rows = [];
    for (const sesion of resultado.asistencias) {
      for (const aprendiz of resultado.competencia.ficha.aprendices) {
        const reg = sesion.registros.find(r => r.aprendizId === aprendiz.id);
        rows.push({
          Competencia: resultado.competencia.nombre,
          Resultado: resultado.nombre,
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
    const filename = `Asistencia_${resultado.nombre}_${desde || 'inicio'}_${hasta || 'fin'}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar: ' + err.message });
  }
};

// GET /api/export/resultado/:resultadoId/consolidado
const exportReporteConsolidado = async (req, res) => {
  const { resultadoId } = req.params;
  const instructorId = req.user.id;

  try {
    const resultado = await prisma.resultadoAprendizaje.findUnique({
      where: { id: resultadoId },
      include: {
        competencia: {
          include: {
            ficha: {
              include: {
                instructores: true,
                aprendices: {
                  select: { id: true, fullName: true, document: true },
                  orderBy: { fullName: 'asc' }
                }
              }
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

    if (!resultado) return res.status(404).json({ error: 'Resultado no encontrado' });
    if (!resultado.competencia.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const totalSesiones = resultado.asistencias.length;
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

    resultado.asistencias.forEach((sesion, idx) => {
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
    resultado.competencia.ficha.aprendices.forEach(aprendiz => {
      const rowData = {
        nombre: aprendiz.fullName,
        documento: aprendiz.document
      };

      let presencias = 0;
      let tardanzas = 0;

      resultado.asistencias.forEach((sesion, idx) => {
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
    const filename = `Consolidado_${resultado.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar consolidado: ' + err.message });
  }
};

// GET /api/export/competencia/:competenciaId/consolidado
const exportReporteCompetencia = async (req, res) => {
  const { competenciaId } = req.params;
  const instructorId = req.user.id;

  try {
    const competencia = await prisma.competencia.findUnique({
      where: { id: competenciaId },
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
        resultados: {
          where: { instructorId },
          include: {
            asistencias: {
              where: { activa: false },
              orderBy: { timestamp: 'asc' },
              include: {
                registros: true
              }
            }
          }
        }
      }
    });

    if (!competencia) return res.status(404).json({ error: 'Competencia no encontrada' });
    if (!competencia.ficha.instructores.some(i => i.instructorId === instructorId)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    if (competencia.resultados.length === 0) {
      return res.status(404).json({ error: 'No tienes resultados de aprendizaje en esta competencia.' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Arachiz';

    competencia.resultados.forEach((resultado) => {
      const sheetName = resultado.nombre.substring(0, 31).replace(/[\\/*?:[\]]/g, ''); // Nombres de hoja Excel limitados a 31 chars
      const sheet = workbook.addWorksheet(sheetName);
      
      const totalSesiones = resultado.asistencias.length;

      const columns = [
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Documento', key: 'documento', width: 15 }
      ];

      if (totalSesiones > 0) {
        resultado.asistencias.forEach((sesion, idx) => {
          columns.push({ header: sesion.fecha, key: `s${idx}`, width: 12 });
        });
      }

      columns.push({ header: 'Presencias', key: 'total', width: 12 });
      columns.push({ header: '% Asistencia', key: 'porcentaje', width: 14 });
      columns.push({ header: 'Tardanzas', key: 'tardanzas', width: 12 });

      sheet.columns = columns;

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34A853' }
      };

      competencia.ficha.aprendices.forEach(aprendiz => {
        const rowData = {
          nombre: aprendiz.fullName,
          documento: aprendiz.document
        };

        let presencias = 0;
        let tardanzas = 0;

        if (totalSesiones > 0) {
          resultado.asistencias.forEach((sesion, idx) => {
            const reg = sesion.registros.find(r => r.aprendizId === aprendiz.id);
            if (reg?.presente) {
              presencias++;
              if (reg.tarde) {
                tardanzas++;
                rowData[`s${idx}`] = 'T';
              } else {
                rowData[`s${idx}`] = '✓';
              }
            } else {
              rowData[`s${idx}`] = '✗';
            }
          });
        }

        rowData.total = presencias;
        rowData.porcentaje = totalSesiones > 0 ? `${Math.round((presencias / totalSesiones) * 100)}%` : '0%';
        rowData.tardanzas = tardanzas;

        const row = sheet.addRow(rowData);

        if (totalSesiones > 0) {
          const pct = (presencias / totalSesiones) * 100;
          const pctCell = row.getCell('porcentaje');
          if (pct < 60) {
            pctCell.font = { bold: true, color: { argb: 'FFEA4335' } };
          } else if (pct < 80) {
            pctCell.font = { bold: true, color: { argb: 'FFFBBC05' } };
          } else {
            pctCell.font = { bold: true, color: { argb: 'FF34A853' } };
          }
        }
      });

      sheet.addRow({});
      sheet.addRow({
        nombre: 'TOTAL SESIONES',
        documento: totalSesiones.toString()
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Reporte_${competencia.nombre.substring(0,20)}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar consolidado de competencia: ' + err.message });
  }
};

module.exports = {
  exportAsistenciaFicha,
  exportSessionAsistencia,
  exportFichaInfo,
  exportFichaInfoPdf,
  exportAsistenciaRango,
  exportReporteConsolidado,
  exportReporteCompetencia
};
