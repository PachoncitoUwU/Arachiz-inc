const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const templates = require('../utils/emailTemplates');
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const getCellValueText = (cell) => {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'object') {
    if (cell.value.result !== undefined && cell.value.result !== null) {
      return cell.value.result.toString().trim();
    }
    if (cell.value.richText) {
      return cell.value.richText.map(t => t.text).join('').trim();
    }
    if (cell.value.text) {
      return cell.value.text.toString().trim();
    }
    return cell.value.toString().trim();
  }
  return cell.value.toString().trim();
};

const importAprendices = async (req, res) => {
  const { fichaId } = req.params;
  const instructorId = req.user.id;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: true,
        aprendices: { select: { id: true, document: true, email: true } }
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });

    const isAdmin = req.user.userType === 'administrador';
    const isLider = ficha.instructorAdminId === instructorId || 
                    ficha.instructores.some(i => i.instructorId === instructorId && i.role === 'admin');

    if (!isLider && !isAdmin) {
      return res.status(403).json({ error: 'Solo el administrador o instructor líder pueden importar aprendices' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const workbook = new ExcelJS.Workbook();
    if (req.file.originalname.endsWith('.csv')) {
      const { Readable } = require('stream');
      const stream = new Readable();
      stream.push(req.file.buffer);
      stream.push(null);
      await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(400).json({ error: 'El archivo está vacío' });

    let headers = [];
    let nameIdx = -1, docIdx = -1, emailIdx = -1;
    let headerRowIdx = -1;

    for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
      worksheet.getRow(r).eachCell((cell, colNumber) => {
        const val = getCellValueText(cell).toLowerCase();
        if (val.includes('nombre')) nameIdx = colNumber;
        if (val.includes('documento') || val.includes('identificación')) docIdx = colNumber;
        if (val.includes('correo') || val.includes('email')) emailIdx = colNumber;
      });

      if (nameIdx !== -1 && docIdx !== -1 && emailIdx !== -1) {
        headerRowIdx = r;
        break;
      } else {
        // Reset if not a complete header row
        nameIdx = -1; docIdx = -1; emailIdx = -1;
      }
    }

    console.log('[importAprendices] Headers detectados en fila:', headerRowIdx, { nameIdx, docIdx, emailIdx });

    if (nameIdx === -1 || docIdx === -1 || emailIdx === -1) {
      console.log('[importAprendices] Error de columnas. Faltan requeridas.');
      return res.status(400).json({ error: 'El archivo debe contener columnas: Nombre, Documento y Email. Asegúrate de usar la plantilla descargada.' });
    }

    const resultados = { creados: 0, unidos: 0, errores: [], filas: 0 };
    const transporter = createTransporter();

    for (let i = headerRowIdx + 1; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row.hasValues) continue;
      
      resultados.filas++;

      const fullName = getCellValueText(row.getCell(nameIdx));
      const document = getCellValueText(row.getCell(docIdx));
      const email = getCellValueText(row.getCell(emailIdx)).toLowerCase();

      if (!fullName || !document || !email) {
        resultados.errores.push(`Fila ${i}: Datos incompletos`);
        continue;
      }

      if (ficha.aprendices.some(a => a.document === document || a.email === email)) {
        resultados.errores.push(`Fila ${i}: ${fullName} ya pertenece a esta ficha`);
        continue;
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ document }, { email }] }
      });

      if (existingUser) {
        if (existingUser.userType !== 'aprendiz') {
          resultados.errores.push(`Fila ${i}: ${email} ya está registrado como ${existingUser.userType} y no puede unirse como aprendiz`);
          continue;
        }

        if (existingUser.document !== document || existingUser.email !== email) {
          resultados.errores.push(`Fila ${i}: Hay un conflicto con el email o documento de ${fullName}. Verifica que correspondan al mismo usuario.`);
          continue;
        }

        await prisma.ficha.update({
          where: { id: fichaId },
          data: { aprendices: { connect: { id: existingUser.id } } }
        });
        
        await prisma.historialCambios.create({
          data: {
            fichaId, usuarioId: instructorId,
            tipoEvento: 'IMPORTACION_UNIR', entidad: 'Ficha', entidadId: fichaId,
            descripcion: `Aprendiz ${existingUser.fullName} importado y unido a la ficha`
          }
        });
        resultados.unidos++;
      } else {
        const tempPassword = `Arachiz_${document.substring(document.length - 4)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.user.create({
          data: {
            userType: 'aprendiz',
            fullName,
            document,
            email,
            password: hashedPassword,
            fichasApr: { connect: { id: fichaId } }
          }
        });

        await prisma.historialCambios.create({
          data: {
            fichaId, usuarioId: instructorId,
            tipoEvento: 'IMPORTACION_CREAR', entidad: 'Ficha', entidadId: fichaId,
            descripcion: `Aprendiz ${fullName} creado por importación y unido a la ficha`
          }
        });
        resultados.creados++;

        try {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Bienvenido a Arachiz - Tus credenciales',
            html: templates.welcomeImport(fullName, document, tempPassword, process.env.FRONTEND_URL)
          }).catch(emailErr => {
            console.error(`Error enviando email a ${email}:`, emailErr);
          });
        } catch (syncEmailErr) {
          console.error(`Error síncrono enviando email a ${email}:`, syncEmailErr);
        }
      }
    }

    res.json({ message: 'Importación finalizada', resultados });

  } catch (error) {
    console.error('Error importando aprendices:', error);
    res.status(500).json({ error: 'Error al procesar el archivo: ' + error.message });
  }
};

const importCompetencias = async (req, res) => {
  const { fichaId } = req.params;
  const instructorId = req.user.id;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: true,
        competencias: { include: { resultados: true } }
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });

    const isAdmin = req.user.userType === 'administrador';
    const isLider = ficha.instructorAdminId === instructorId || 
                    ficha.instructores.some(i => i.instructorId === instructorId && i.role === 'admin');

    if (!isLider && !isAdmin) {
      return res.status(403).json({ error: 'Solo el administrador o instructor líder pueden importar competencias' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const workbook = new ExcelJS.Workbook();
    if (req.file.originalname.endsWith('.csv')) {
      const { Readable } = require('stream');
      const stream = new Readable();
      stream.push(req.file.buffer);
      stream.push(null);
      await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(400).json({ error: 'El archivo está vacío' });

    let headers = [];
    let compIdx = -1, resIdx = -1, tipoIdx = -1;
    let headerRowIdx = -1;

    for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
      worksheet.getRow(r).eachCell((cell, colNumber) => {
        const val = getCellValueText(cell).toLowerCase();
        if (val.includes('competencia') || val.includes('nombre')) compIdx = colNumber;
        if (val.includes('resultado')) resIdx = colNumber;
        if (val.includes('tipo')) tipoIdx = colNumber;
      });

      if (compIdx !== -1) {
        headerRowIdx = r;
        break;
      } else {
        compIdx = -1; resIdx = -1; tipoIdx = -1;
      }
    }

    if (compIdx === -1) {
      return res.status(400).json({ error: 'El archivo debe contener una columna para la Competencia' });
    }

    const resultados = { creadas: 0, resultadosCreados: 0, errores: [], filas: 0 };
    const incomingCompetencies = new Map();

    for (let i = headerRowIdx + 1; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row.hasValues) continue;
      
      resultados.filas++;

      const compNombre = getCellValueText(row.getCell(compIdx));
      const resNombre = resIdx !== -1 ? getCellValueText(row.getCell(resIdx)) : '';
      const tipo = tipoIdx !== -1 ? getCellValueText(row.getCell(tipoIdx)) : 'Técnica';

      if (!compNombre) {
        resultados.errores.push(`Fila ${i}: Nombre de competencia en blanco`);
        continue;
      }

      const cleanedComp = cleanName(compNombre);
      const cleanedRes = cleanName(resNombre);

      if (!incomingCompetencies.has(cleanedComp)) {
        incomingCompetencies.set(cleanedComp, { tipo: tipo || 'Técnica', resultados: new Set() });
      }
      if (cleanedRes) {
        incomingCompetencies.get(cleanedComp).resultados.add(cleanedRes);
      }
    }

    for (const [compName, info] of incomingCompetencies.entries()) {
      let competencia = ficha.competencias.find(c => c.nombre.toLowerCase() === compName.toLowerCase());
      
      if (!competencia) {
        competencia = await prisma.competencia.create({
          data: {
            nombre: compName,
            tipo: info.tipo,
            fichaId
          },
          include: { resultados: true }
        });
        resultados.creadas++;
      }
      
      const existingResults = competencia.resultados.map(r => r.nombre.toLowerCase());
      const resultsToCreate = [];
      
      for (const resName of info.resultados) {
        if (!existingResults.includes(resName.toLowerCase())) {
          resultsToCreate.push({
            nombre: resName,
            competenciaId: competencia.id
          });
        }
      }
      
      if (resultsToCreate.length > 0) {
        await prisma.resultadoAprendizaje.createMany({
          data: resultsToCreate
        });
        resultados.resultadosCreados += resultsToCreate.length;
      }
    }

    await prisma.historialCambios.create({
      data: {
        fichaId, usuarioId: instructorId,
        tipoEvento: 'IMPORTACION_COMPETENCIA', entidad: 'Ficha', entidadId: fichaId,
        descripcion: `${resultados.creadas} competencias y ${resultados.resultadosCreados} resultados importados masivamente`
      }
    });

    res.json({ message: 'Importación finalizada', resultados });

  } catch (error) {
    console.error('Error importando competencias:', error);
    res.status(500).json({ error: 'Error al procesar el archivo: ' + error.message });
  }
};

const downloadPlantillaAprendices = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Aprendices');
  
  worksheet.columns = [
    { header: 'Nombre Completo', key: 'nombre', width: 35 },
    { header: 'Documento', key: 'documento', width: 20 },
    { header: 'Email', key: 'email', width: 35 }
  ];
  
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Plantilla_Aprendices_Arachiz.xlsx"`);
  
  await workbook.xlsx.write(res);
  res.end();
};

const downloadPlantillaCompetencias = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Competencias');
  
  worksheet.columns = [
    { header: 'Nombre de la Competencia', key: 'competencia', width: 40 },
    { header: 'Resultado de Aprendizaje', key: 'resultado', width: 45 },
    { header: 'Tipo (Técnica/Transversal/Básica)', key: 'tipo', width: 30 }
  ];
  
  worksheet.addRow({ competencia: 'Desarrollo de Software', resultado: 'Diseñar la estructura de datos y componentes del sistema.', tipo: 'Técnica' });
  worksheet.addRow({ competencia: 'Desarrollo de Software', resultado: 'Desarrollar el código fuente de acuerdo con el diseño.', tipo: 'Técnica' });
  worksheet.addRow({ competencia: 'Ética Profesional', resultado: 'Interactuar en los contextos Productivo y Social.', tipo: 'Transversal' });
  
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Plantilla_Competencias_Arachiz.xlsx"`);
  
  await workbook.xlsx.write(res);
  res.end();
};

function parseExcelDate(cellValue) {
  if (!cellValue) return null;
  if (cellValue instanceof Date) return cellValue;
  
  if (typeof cellValue === 'object') {
    if (cellValue.result instanceof Date) return cellValue.result;
    if (cellValue.result) cellValue = cellValue.result;
    else if (cellValue.richText) {
      cellValue = cellValue.richText.map(t => t.text).join('');
    } else {
      cellValue = cellValue.toString();
    }
  }

  const str = cellValue.toString().trim();
  
  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  const partsDash = str.split('-');
  if (partsDash.length === 3) {
    const year = parseInt(partsDash[0], 10);
    const month = parseInt(partsDash[1], 10) - 1;
    const day = parseInt(partsDash[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function cleanName(val) {
  if (!val) return '';
  return val.toString()
    .trim()
    .replace(/^\d+\s*[-–—]\s*/, '')
    .replace(/^\d+\s+/, '')
    .trim();
}

const parseExcelFicha = async (req, res) => {
  console.log('[importController] parseExcelFicha iniciado');
  
  if (!req.file) {
    console.log('[importController] No file received');
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  console.log('[importController] File received:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.buffer?.length
  });

  try {
    const workbook = new ExcelJS.Workbook();
    
    // Verificar que el buffer existe y tiene contenido
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.log('[importController] Buffer is empty');
      return res.status(400).json({ error: 'El archivo está vacío o no se pudo leer' });
    }

    console.log('[importController] Loading Excel workbook...');
    try {
      await workbook.xlsx.load(req.file.buffer);
      console.log('[importController] Workbook loaded successfully');
    } catch (xlsxErr) {
      console.error('[importController] Error loading Excel:', xlsxErr);
      return res.status(400).json({ error: 'No se pudo leer el archivo Excel. Asegúrate de que sea un archivo .xlsx válido y no esté protegido con contraseña.' });
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      console.log('[importController] Worksheet is empty');
      return res.status(400).json({ error: 'El archivo está vacío' });
    }

    console.log('[importController] Worksheet found, parsing cells...');

    const getCellValue = (cellRef) => {
      const cell = worksheet.getCell(cellRef);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object') {
        if (cell.value.result !== undefined && cell.value.result !== null) {
          return cell.value.result.toString().trim();
        }
        if (cell.value.richText) {
          return cell.value.richText.map(t => t.text).join('').trim();
        }
        if (cell.value.text) {
          return cell.value.text.toString().trim();
        }
        return cell.value.toString().trim();
      }
      return cell.value.toString().trim();
    };

    const numero = getCellValue('C3');
    const nombre = getCellValue('C6');
    const rawFechaInicio = worksheet.getCell('C8').value;
    const rawFechaFin = worksheet.getCell('C9').value;
    const modalidad = getCellValue('C10');
    const rawRegional = getCellValue('C11');
    const rawCentro = getCellValue('C12');

    console.log('[importController] Parsed basic data:', { numero, nombre, modalidad });

    if (!numero || !nombre) {
      return res.status(400).json({ 
        error: 'El formato del archivo no coincide. Se espera el número de ficha en C3 y la denominación del programa en C6.' 
      });
    }

    const fechaInicio = parseExcelDate(rawFechaInicio);
    const fechaFin = parseExcelDate(rawFechaFin);

    const region = cleanName(rawRegional);
    const centro = cleanName(rawCentro);

    // Group competencies and results from columns F (competencia) and G (resultado)
    const competenciesMap = new Map();
    const rowCount = worksheet.rowCount;

    console.log('[importController] Processing competencies and results, total rows:', rowCount);

    for (let r = 14; r <= rowCount; r++) {
      const compCell = worksheet.getCell(`F${r}`);
      const resCell = worksheet.getCell(`G${r}`);
      
      let compVal = '';
      if (compCell && compCell.value !== null && compCell.value !== undefined) {
        compVal = getCellValue(`F${r}`);
      }
      
      let resVal = '';
      if (resCell && resCell.value !== null && resCell.value !== undefined) {
        resVal = getCellValue(`G${r}`);
      }
      
      compVal = cleanName(compVal);
      resVal = cleanName(resVal);
      
      if (compVal) {
        if (!competenciesMap.has(compVal)) {
          competenciesMap.set(compVal, new Set());
        }
        if (resVal) {
          competenciesMap.get(compVal).add(resVal);
        }
      }
    }

    const competencias = [];
    for (const [nombreComp, resultadosSet] of competenciesMap.entries()) {
      competencias.push({
        nombre: nombreComp,
        resultados: Array.from(resultadosSet)
      });
    }

    console.log('[importController] Successfully parsed', competencias.length, 'competencias');
    console.log('[importController] Sending response...');

    res.json({
      ficha: {
        numero,
        nombre,
        fechaInicio: fechaInicio ? fechaInicio.toISOString() : null,
        fechaFin: fechaFin ? fechaFin.toISOString() : null,
        modalidad,
        region,
        centro
      },
      competencias
    });
  } catch (error) {
    console.error('Error al analizar archivo Excel:', error);
    res.status(500).json({ error: 'Error al analizar el archivo Excel: ' + error.message });
  }
};

const confirmExcelFicha = async (req, res) => {
  const { ficha, competencias } = req.body;
  const instructorId = req.user.id;

  if (!ficha || !ficha.numero || !ficha.nombre || !ficha.nivel || !ficha.centro || !ficha.jornada || !ficha.region) {
    return res.status(400).json({ error: 'Faltan datos obligatorios de la Ficha' });
  }

  try {
    const existingFicha = await prisma.ficha.findUnique({
      where: { numero: ficha.numero.toString() }
    });

    if (existingFicha) {
      return res.status(400).json({ error: `Ya existe una ficha con el número ${ficha.numero}` });
    }

    const { generarCodigoFicha } = require('../utils/generators');
    const code = generarCodigoFicha();

    let duracion = 24;
    if (ficha.fechaInicio && ficha.fechaFin) {
      const start = new Date(ficha.fechaInicio);
      const end = new Date(ficha.fechaFin);
      const years = end.getFullYear() - start.getFullYear();
      const months = end.getMonth() - start.getMonth();
      const calculatedDuracion = (years * 12) + months;
      if (calculatedDuracion > 0) {
        duracion = calculatedDuracion > 30 ? 30 : calculatedDuracion;
      }
    }

    const isAdministrador = req.user.userType === 'administrador';
    const fichaData = {
      numero: ficha.numero.toString(),
      nombre: ficha.nombre,
      nivel: ficha.nivel,
      centro: ficha.centro,
      jornada: ficha.jornada,
      region: ficha.region,
      duracion,
      fechaInicio: ficha.fechaInicio ? new Date(ficha.fechaInicio) : null,
      fechaFin: ficha.fechaFin ? new Date(ficha.fechaFin) : null,
      code,
      ...(isAdministrador 
        ? { administrador: { connect: { id: instructorId } } } 
        : { 
            instructorAdmin: { connect: { id: instructorId } },
            instructores: { create: [{ instructorId, role: 'admin' }] }
          })
    };

    const result = await prisma.$transaction(async (tx) => {
      const newFicha = await tx.ficha.create({
        data: fichaData
      });

      let totalResultados = 0;
      if (competencias && competencias.length > 0) {
        for (const comp of competencias) {
          const createdComp = await tx.competencia.create({
            data: {
              nombre: comp.nombre,
              tipo: 'Técnica',
              fichaId: newFicha.id
            }
          });

          if (comp.resultados && comp.resultados.length > 0) {
            await tx.resultadoAprendizaje.createMany({
              data: comp.resultados.map(resNombre => ({
                nombre: resNombre,
                competenciaId: createdComp.id
              }))
            });
            totalResultados += comp.resultados.length;
          }
        }
      }

      await tx.historialCambios.create({
        data: {
          fichaId: newFicha.id,
          usuarioId: instructorId,
          tipoEvento: 'CREACION_IMPORTACION',
          entidad: 'Ficha',
          entidadId: newFicha.id,
          descripcion: `Ficha ${newFicha.numero}, ${competencias ? competencias.length : 0} competencias y ${totalResultados} resultados creados e importados desde Excel`
        }
      });

      return newFicha;
    }, {
      maxWait: 10000,
      timeout: 120000 // 120 seconds
    });

    res.status(201).json({
      message: 'Ficha, competencias y resultados importados exitosamente',
      ficha: result
    });
  } catch (error) {
    console.error('Error al confirmar importación de Excel:', error);
    res.status(500).json({ error: 'Error al confirmar la importación: ' + error.message });
  }
};

module.exports = { 
  importAprendices, 
  importCompetencias, 
  downloadPlantillaAprendices, 
  downloadPlantillaCompetencias,
  parseExcelFicha,
  confirmExcelFicha
};
