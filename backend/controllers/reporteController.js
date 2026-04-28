const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');

/**
 * Generar reporte de una ficha individual
 */
const generarReporteFicha = async (req, res) => {
  try {
    const { fichaId } = req.params;
    const adminId = req.user.id;

    // Verificar que el admin tiene acceso a esta ficha
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructorAdmin: {
          select: { fullName: true, email: true }
        },
        administrador: {
          select: { fullName: true, email: true }
        },
        instructores: {
          include: {
            instructor: {
              select: { fullName: true, email: true, document: true }
            }
          }
        },
        aprendices: {
          select: {
            id: true,
            fullName: true,
            email: true,
            document: true,
            createdAt: true
          }
        },
        materias: {
          include: {
            instructor: {
              select: { fullName: true }
            },
            horarios: true,
            _count: {
              select: { asistencias: true }
            }
          }
        }
      }
    });

    if (!ficha) {
      return res.status(404).json({ error: 'Ficha no encontrada' });
    }

    if (ficha.administradorId !== adminId) {
      return res.status(403).json({ error: 'No tienes acceso a esta ficha' });
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Arachiz System';
    workbook.created = new Date();

    // Hoja 1: Información General
    const sheetInfo = workbook.addWorksheet('Información General');
    
    // Estilos
    const headerStyle = {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4285F4' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };

    const titleStyle = {
      font: { bold: true, size: 14 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    };

    // Información de la ficha
    sheetInfo.columns = [
      { key: 'campo', width: 25 },
      { key: 'valor', width: 50 }
    ];

    sheetInfo.addRow({ campo: 'INFORMACIÓN DE LA FICHA', valor: '' });
    sheetInfo.getRow(1).font = { bold: true, size: 16 };
    sheetInfo.mergeCells('A1:B1');

    sheetInfo.addRow({});
    sheetInfo.addRow({ campo: 'Fecha de Generación', valor: new Date().toLocaleString('es-CO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    }) });
    sheetInfo.addRow({ campo: 'Número de Ficha', valor: ficha.numero });
    sheetInfo.addRow({ campo: 'Nombre', valor: ficha.nombre });
    sheetInfo.addRow({ campo: 'Nivel', valor: ficha.nivel });
    sheetInfo.addRow({ campo: 'Centro', valor: ficha.centro });
    sheetInfo.addRow({ campo: 'Jornada', valor: ficha.jornada });
    sheetInfo.addRow({ campo: 'Región', valor: ficha.region });
    sheetInfo.addRow({ campo: 'Duración (meses)', valor: ficha.duracion });
    sheetInfo.addRow({ campo: 'Fecha de Creación', valor: ficha.createdAt.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) });
    
    sheetInfo.addRow({});
    sheetInfo.addRow({ campo: 'Líder de Ficha', valor: ficha.instructorAdmin.fullName });
    sheetInfo.addRow({ campo: 'Email Líder', valor: ficha.instructorAdmin.email });
    
    if (ficha.administrador) {
      sheetInfo.addRow({ campo: 'Administrador', valor: ficha.administrador.fullName });
      sheetInfo.addRow({ campo: 'Email Administrador', valor: ficha.administrador.email });
    }

    sheetInfo.addRow({});
    sheetInfo.addRow({ campo: 'ESTADÍSTICAS', valor: '' });
    sheetInfo.getRow(sheetInfo.lastRow.number).font = { bold: true, size: 14 };
    sheetInfo.mergeCells(`A${sheetInfo.lastRow.number}:B${sheetInfo.lastRow.number}`);

    sheetInfo.addRow({ campo: 'Total de Instructores', valor: ficha.instructores.length });
    sheetInfo.addRow({ campo: 'Total de Aprendices', valor: ficha.aprendices.length });
    sheetInfo.addRow({ campo: 'Total de Materias', valor: ficha.materias.length });

    // Hoja 2: Instructores
    const sheetInstructores = workbook.addWorksheet('Instructores');
    sheetInstructores.columns = [
      { header: 'Nombre Completo', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rol', key: 'rol', width: 15 }
    ];

    sheetInstructores.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    ficha.instructores.forEach(({ instructor, role }) => {
      sheetInstructores.addRow({
        nombre: instructor.fullName,
        documento: instructor.document,
        email: instructor.email,
        rol: role === 'lider' ? 'Líder' : 'Instructor'
      });
    });

    // Hoja 3: Aprendices
    const sheetAprendices = workbook.addWorksheet('Aprendices');
    sheetAprendices.columns = [
      { header: 'Nombre Completo', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Fecha de Inscripción', key: 'fecha', width: 20 }
    ];

    sheetAprendices.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    ficha.aprendices.forEach((aprendiz) => {
      sheetAprendices.addRow({
        nombre: aprendiz.fullName,
        documento: aprendiz.document,
        email: aprendiz.email,
        fecha: aprendiz.createdAt.toLocaleDateString('es-CO')
      });
    });

    // Hoja 4: Materias
    const sheetMaterias = workbook.addWorksheet('Materias');
    sheetMaterias.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Instructor', key: 'instructor', width: 30 },
      { header: 'Asistencias Tomadas', key: 'asistencias', width: 20 }
    ];

    sheetMaterias.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    ficha.materias.forEach((materia) => {
      sheetMaterias.addRow({
        nombre: materia.nombre,
        tipo: materia.tipo,
        instructor: materia.instructor.fullName,
        asistencias: materia._count.asistencias
      });
    });

    // Generar buffer y enviar
    const buffer = await workbook.xlsx.writeBuffer();
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreFicha = ficha.nombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Ficha${ficha.numero}_${nombreFicha}_${fecha}.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generando reporte:', err);
    res.status(500).json({ error: 'Error generando reporte: ' + err.message });
  }
};

/**
 * Generar reporte de asistencias de una materia
 */
const generarReporteMateria = async (req, res) => {
  try {
    const { materiaId } = req.params;
    const adminId = req.user.id;
    const { fechaDesde, fechaHasta } = req.query;

    // Obtener materia con todas las asistencias
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
      include: {
        ficha: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            administradorId: true,
            instructorAdmin: {
              select: { fullName: true }
            },
            aprendices: {
              select: {
                id: true,
                fullName: true,
                document: true
              },
              orderBy: { fullName: 'asc' }
            }
          }
        },
        instructor: {
          select: { fullName: true }
        },
        asistencias: {
          where: {
            ...(fechaDesde && { fecha: { gte: new Date(fechaDesde) } }),
            ...(fechaHasta && { fecha: { lte: new Date(fechaHasta) } })
          },
          include: {
            registros: {
              include: {
                aprendiz: {
                  select: {
                    id: true,
                    fullName: true,
                    document: true
                  }
                }
              }
            }
          },
          orderBy: { fecha: 'asc' }
        }
      }
    });

    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    if (materia.ficha.administradorId !== adminId) {
      return res.status(403).json({ error: 'No tienes acceso a esta materia' });
    }

    if (materia.asistencias.length === 0) {
      return res.status(404).json({ error: 'No hay asistencias registradas para esta materia' });
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Arachiz System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Asistencias');

    // Estilos
    const headerStyle = {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4285F4' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const titleStyle = {
      font: { bold: true, size: 16 },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };

    // Título principal
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'REPORTE DE ASISTENCIAS';
    sheet.getCell('A1').style = titleStyle;

    // Información general
    sheet.addRow([]);
    sheet.addRow(['Ficha:', `${materia.ficha.numero} - ${materia.ficha.nombre}`]);
    sheet.addRow(['Materia:', materia.nombre]);
    sheet.addRow(['Tipo:', materia.tipo]);
    sheet.addRow(['Instructor:', materia.instructor.fullName]);
    sheet.addRow(['Líder de Ficha:', materia.ficha.instructorAdmin.fullName]);
    sheet.addRow(['Total Asistencias:', materia.asistencias.length]);
    sheet.addRow(['Fecha de Generación:', new Date().toLocaleString('es-CO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    })]);
    sheet.addRow([]);

    // Crear columnas dinámicas: Aprendiz | Documento | Fecha1 | Fecha2 | ... | Total | %
    const fechas = materia.asistencias.map(a => {
      const fecha = new Date(a.fecha);
      return fecha.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'America/Bogota'
      });
    });

    const columns = [
      { header: 'Aprendiz', key: 'aprendiz', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 },
      ...fechas.map((fecha, idx) => ({
        header: fecha,
        key: `fecha_${idx}`,
        width: 12
      })),
      { header: 'Total Presentes', key: 'total', width: 15 },
      { header: '% Asistencia', key: 'porcentaje', width: 15 }
    ];

    // Agregar headers
    const headerRowNum = sheet.lastRow.number + 1;
    columns.forEach((col, idx) => {
      const cell = sheet.getRow(headerRowNum).getCell(idx + 1);
      cell.value = col.header;
      cell.style = headerStyle;
    });

    // Configurar anchos de columna
    sheet.columns = columns.map(col => ({ width: col.width }));

    // Agregar datos de cada aprendiz
    materia.ficha.aprendices.forEach((aprendiz) => {
      const row = {
        aprendiz: aprendiz.fullName,
        documento: aprendiz.document,
        total: 0
      };

      // Por cada fecha de asistencia, verificar si el aprendiz estuvo presente
      materia.asistencias.forEach((asistencia, idx) => {
        const registro = asistencia.registros.find(r => r.aprendizId === aprendiz.id);
        const presente = registro?.presente || false;
        row[`fecha_${idx}`] = presente ? '✓' : '✗';
        if (presente) row.total++;
      });

      row.porcentaje = materia.asistencias.length > 0 
        ? `${((row.total / materia.asistencias.length) * 100).toFixed(1)}%`
        : '0%';

      const newRow = sheet.addRow(row);
      
      // Aplicar estilos a la fila
      newRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Colorear ✓ y ✗
        if (cell.value === '✓') {
          cell.font = { color: { argb: 'FF34A853' }, bold: true, size: 12 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (cell.value === '✗') {
          cell.font = { color: { argb: 'FFEA4335' }, bold: true, size: 12 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    // Generar buffer y enviar
    const buffer = await workbook.xlsx.writeBuffer();
    
    const nombreMateria = materia.nombre.replace(/[^a-zA-Z0-9]/g, '_');
    const fecha = new Date().toISOString().split('T')[0];
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Asistencias_${nombreMateria}_Ficha${materia.ficha.numero}_${fecha}.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generando reporte:', err);
    res.status(500).json({ error: 'Error generando reporte: ' + err.message });
  }
};

/**
 * Generar reporte consolidado de todas las fichas del admin
 */
const generarReporteConsolidado = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Obtener todas las fichas del admin
    const fichas = await prisma.ficha.findMany({
      where: { administradorId: adminId },
      include: {
        instructorAdmin: {
          select: { fullName: true }
        },
        instructores: {
          include: {
            instructor: {
              select: { fullName: true, email: true }
            }
          }
        },
        aprendices: {
          select: {
            fullName: true,
            document: true,
            email: true
          }
        },
        materias: {
          include: {
            instructor: {
              select: { fullName: true }
            },
            _count: {
              select: { asistencias: true }
            }
          }
        }
      }
    });

    if (fichas.length === 0) {
      return res.status(404).json({ error: 'No tienes fichas asignadas' });
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Arachiz System';
    workbook.created = new Date();

    // Estilos
    const headerStyle = {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4285F4' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };

    // Hoja 1: Resumen General
    const sheetResumen = workbook.addWorksheet('Resumen General');
    sheetResumen.columns = [
      { header: 'Ficha', key: 'ficha', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Nivel', key: 'nivel', width: 20 },
      { header: 'Instructores', key: 'instructores', width: 15 },
      { header: 'Aprendices', key: 'aprendices', width: 15 },
      { header: 'Materias', key: 'materias', width: 15 }
    ];

    sheetResumen.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    fichas.forEach((ficha) => {
      sheetResumen.addRow({
        ficha: ficha.numero,
        nombre: ficha.nombre,
        nivel: ficha.nivel,
        instructores: ficha.instructores.length,
        aprendices: ficha.aprendices.length,
        materias: ficha.materias.length
      });
    });

    // Hoja 2: Todas las Materias
    const sheetMaterias = workbook.addWorksheet('Todas las Materias');
    sheetMaterias.columns = [
      { header: 'Ficha', key: 'ficha', width: 15 },
      { header: 'Materia', key: 'materia', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Instructor', key: 'instructor', width: 30 },
      { header: 'Asistencias', key: 'asistencias', width: 15 }
    ];

    sheetMaterias.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    fichas.forEach((ficha) => {
      ficha.materias.forEach((materia) => {
        sheetMaterias.addRow({
          ficha: ficha.numero,
          materia: materia.nombre,
          tipo: materia.tipo,
          instructor: materia.instructor.fullName,
          asistencias: materia._count.asistencias
        });
      });
    });

    // Hoja 3: Todos los Aprendices
    const sheetAprendices = workbook.addWorksheet('Todos los Aprendices');
    sheetAprendices.columns = [
      { header: 'Ficha', key: 'ficha', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'Email', key: 'email', width: 30 }
    ];

    sheetAprendices.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    fichas.forEach((ficha) => {
      ficha.aprendices.forEach((aprendiz) => {
        sheetAprendices.addRow({
          ficha: ficha.numero,
          nombre: aprendiz.fullName,
          documento: aprendiz.document,
          email: aprendiz.email
        });
      });
    });

    // Hoja 4: Todos los Instructores
    const sheetInstructores = workbook.addWorksheet('Todos los Instructores');
    sheetInstructores.columns = [
      { header: 'Ficha', key: 'ficha', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Email', key: 'email', width: 30 }
    ];

    sheetInstructores.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    fichas.forEach((ficha) => {
      ficha.instructores.forEach(({ instructor }) => {
        sheetInstructores.addRow({
          ficha: ficha.numero,
          nombre: instructor.fullName,
          email: instructor.email
        });
      });
    });

    // Generar buffer y enviar
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Consolidado_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generando reporte consolidado:', err);
    res.status(500).json({ error: 'Error generando reporte: ' + err.message });
  }
};

/**
 * Obtener estadísticas avanzadas de reportes
 */
const getEstadisticasReportes = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Obtener todas las fichas del admin con datos completos
    const fichas = await prisma.ficha.findMany({
      where: { administradorId: adminId },
      include: {
        aprendices: {
          select: { id: true, fullName: true }
        },
        materias: {
          include: {
            instructor: {
              select: { id: true, fullName: true }
            },
            asistencias: {
              include: {
                registros: {
                  select: {
                    aprendizId: true,
                    presente: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (fichas.length === 0) {
      return res.json({
        fichasStats: [],
        materiasStats: [],
        tendenciasAsistencia: [],
        comparativaFichas: [],
        aprendicesRiesgo: []
      });
    }

    // 1. Estadísticas por ficha
    const fichasStats = fichas.map(ficha => {
      const totalAprendices = ficha.aprendices.length;
      const totalMaterias = ficha.materias.length;
      
      let totalAsistencias = 0;
      let totalPresentes = 0;
      
      ficha.materias.forEach(materia => {
        materia.asistencias.forEach(asistencia => {
          totalAsistencias += asistencia.registros.length;
          totalPresentes += asistencia.registros.filter(r => r.presente).length;
        });
      });

      const porcentajeAsistencia = totalAsistencias > 0 ? 
        ((totalPresentes / totalAsistencias) * 100).toFixed(1) : 0;

      return {
        id: ficha.id,
        numero: ficha.numero,
        nombre: ficha.nombre,
        totalAprendices,
        totalMaterias,
        totalAsistencias: ficha.materias.reduce((sum, m) => sum + m.asistencias.length, 0),
        porcentajeAsistencia: parseFloat(porcentajeAsistencia)
      };
    });

    // 2. Estadísticas por materia (top 10 con mejor/peor asistencia)
    const materiasStats = [];
    fichas.forEach(ficha => {
      ficha.materias.forEach(materia => {
        let totalRegistros = 0;
        let totalPresentes = 0;
        
        materia.asistencias.forEach(asistencia => {
          totalRegistros += asistencia.registros.length;
          totalPresentes += asistencia.registros.filter(r => r.presente).length;
        });

        if (totalRegistros > 0) {
          materiasStats.push({
            id: materia.id,
            nombre: materia.nombre,
            tipo: materia.tipo,
            instructor: materia.instructor.fullName,
            fichaNumero: ficha.numero,
            totalAsistencias: materia.asistencias.length,
            porcentajeAsistencia: ((totalPresentes / totalRegistros) * 100).toFixed(1)
          });
        }
      });
    });

    // Ordenar materias por porcentaje de asistencia
    materiasStats.sort((a, b) => parseFloat(b.porcentajeAsistencia) - parseFloat(a.porcentajeAsistencia));

    // 3. Tendencias de asistencia (últimos 6 meses)
    const tendenciasAsistencia = [];
    const hoy = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesNombre = fecha.toLocaleDateString('es-CO', { 
        month: 'short', 
        year: 'numeric',
        timeZone: 'America/Bogota'
      });
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59);

      let totalRegistrosMes = 0;
      let totalPresentesMes = 0;

      fichas.forEach(ficha => {
        ficha.materias.forEach(materia => {
          materia.asistencias.forEach(asistencia => {
            const fechaAsistencia = new Date(asistencia.fecha);
            if (fechaAsistencia >= inicioMes && fechaAsistencia <= finMes) {
              totalRegistrosMes += asistencia.registros.length;
              totalPresentesMes += asistencia.registros.filter(r => r.presente).length;
            }
          });
        });
      });

      const porcentaje = totalRegistrosMes > 0 ? 
        ((totalPresentesMes / totalRegistrosMes) * 100).toFixed(1) : 0;

      tendenciasAsistencia.push({
        mes: mesNombre,
        totalAsistencias: Math.floor(totalRegistrosMes / fichas.reduce((sum, f) => sum + f.aprendices.length, 0) || 1),
        porcentajeAsistencia: parseFloat(porcentaje)
      });
    }

    // 4. Comparativa entre fichas
    const comparativaFichas = fichasStats.map(ficha => ({
      numero: ficha.numero,
      nombre: ficha.nombre.substring(0, 20),
      porcentajeAsistencia: ficha.porcentajeAsistencia,
      totalAprendices: ficha.totalAprendices,
      totalMaterias: ficha.totalMaterias
    }));

    // 5. Aprendices en riesgo (menos del 70% de asistencia)
    const aprendicesRiesgo = [];
    
    fichas.forEach(ficha => {
      ficha.aprendices.forEach(aprendiz => {
        let totalRegistrosAprendiz = 0;
        let totalPresentesAprendiz = 0;

        ficha.materias.forEach(materia => {
          materia.asistencias.forEach(asistencia => {
            const registro = asistencia.registros.find(r => r.aprendizId === aprendiz.id);
            if (registro) {
              totalRegistrosAprendiz++;
              if (registro.presente) totalPresentesAprendiz++;
            }
          });
        });

        if (totalRegistrosAprendiz > 0) {
          const porcentaje = (totalPresentesAprendiz / totalRegistrosAprendiz) * 100;
          if (porcentaje < 70) {
            aprendicesRiesgo.push({
              id: aprendiz.id,
              nombre: aprendiz.fullName,
              fichaNumero: ficha.numero,
              fichaId: ficha.id,
              porcentajeAsistencia: porcentaje.toFixed(1),
              totalAsistencias: totalRegistrosAprendiz,
              totalPresentes: totalPresentesAprendiz
            });
          }
        }
      });
    });

    // Ordenar aprendices en riesgo por menor porcentaje
    aprendicesRiesgo.sort((a, b) => parseFloat(a.porcentajeAsistencia) - parseFloat(b.porcentajeAsistencia));

    res.json({
      fichasStats,
      materiasStats: materiasStats.slice(0, 10), // Top 10
      tendenciasAsistencia,
      comparativaFichas,
      aprendicesRiesgo: aprendicesRiesgo.slice(0, 15) // Top 15 en riesgo
    });
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    res.status(500).json({ error: 'Error obteniendo estadísticas: ' + err.message });
  }
};

module.exports = {
  generarReporteFicha,
  generarReporteMateria,
  generarReporteConsolidado,
  getEstadisticasReportes
};
