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

    const isLider = ficha.instructorAdminId === instructorId || 
                    ficha.instructores.some(i => i.instructorId === instructorId && i.role === 'admin');

    if (!isLider) {
      return res.status(403).json({ error: 'Solo el instructor líder puede importar aprendices' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const workbook = new ExcelJS.Workbook();
    if (req.file.originalname.endsWith('.csv')) {
      await workbook.csv.read(req.file.buffer);
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(400).json({ error: 'El archivo está vacío' });

    let headers = [];
    let nameIdx = -1, docIdx = -1, emailIdx = -1;

    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const val = cell.value?.toString().toLowerCase().trim() || '';
      headers[colNumber] = val;
      if (val.includes('nombre')) nameIdx = colNumber;
      if (val.includes('documento') || val.includes('identificación')) docIdx = colNumber;
      if (val.includes('correo') || val.includes('email')) emailIdx = colNumber;
    });

    if (nameIdx === -1 || docIdx === -1 || emailIdx === -1) {
      return res.status(400).json({ error: 'El archivo debe contener columnas: Nombre, Documento y Email' });
    }

    const resultados = { creados: 0, unidos: 0, errores: [], filas: 0 };
    const transporter = createTransporter();

    // Recorrer filas omitiendo el header
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      // Ignorar filas vacías
      if (!row.hasValues) continue;
      
      resultados.filas++;

      const fullName = row.getCell(nameIdx).value?.toString().trim();
      let document = row.getCell(docIdx).value?.toString().trim();
      let email = row.getCell(emailIdx).value?.toString().trim().toLowerCase();

      // Excel a veces parsea emails como objetos { text, hyperlink }
      if (email && typeof row.getCell(emailIdx).value === 'object') {
        email = row.getCell(emailIdx).value.text?.trim().toLowerCase();
      }

      if (!fullName || !document || !email) {
        resultados.errores.push(`Fila ${i}: Datos incompletos`);
        continue;
      }

      // Validar si el aprendiz ya está en la ficha
      if (ficha.aprendices.some(a => a.document === document || a.email === email)) {
        resultados.errores.push(`Fila ${i}: ${fullName} ya pertenece a esta ficha`);
        continue;
      }

      // Buscar si el usuario ya existe en Arachiz
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ document }, { email }] }
      });

      if (existingUser) {
        if (existingUser.userType !== 'aprendiz') {
          resultados.errores.push(`Fila ${i}: ${email} ya está registrado como ${existingUser.userType} y no puede unirse como aprendiz`);
          continue;
        }

        // Si existe, pero el documento o email no coinciden exactamente, reportar conflicto
        if (existingUser.document !== document || existingUser.email !== email) {
          resultados.errores.push(`Fila ${i}: Hay un conflicto con el email o documento de ${fullName}. Verifica que correspondan al mismo usuario.`);
          continue;
        }

        // Unir a la ficha
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
        // Crear nuevo usuario
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

        // Enviar email con credenciales
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Bienvenido a Arachiz - Tus credenciales',
            html: templates.welcomeImport(fullName, document, tempPassword, process.env.FRONTEND_URL)
          });
        } catch (emailErr) {
          console.error(`Error enviando email a ${email}:`, emailErr);
        }
      }
    }

    res.json({ message: 'Importación finalizada', resultados });

  } catch (error) {
    console.error('Error importando aprendices:', error);
    res.status(500).json({ error: 'Error al procesar el archivo: ' + error.message });
  }
};

const importMaterias = async (req, res) => {
  const { fichaId } = req.params;
  const instructorId = req.user.id;

  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        instructores: true,
        materias: true
      }
    });

    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });

    const isLider = ficha.instructorAdminId === instructorId || 
                    ficha.instructores.some(i => i.instructorId === instructorId && i.role === 'admin');

    if (!isLider) {
      return res.status(403).json({ error: 'Solo el instructor líder puede importar materias' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const workbook = new ExcelJS.Workbook();
    if (req.file.originalname.endsWith('.csv')) {
      await workbook.csv.read(req.file.buffer);
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(400).json({ error: 'El archivo está vacío' });

    let headers = [];
    let nameIdx = -1, tipoIdx = -1;

    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const val = cell.value?.toString().toLowerCase().trim() || '';
      headers[colNumber] = val;
      if (val.includes('nombre')) nameIdx = colNumber;
      if (val.includes('tipo')) tipoIdx = colNumber;
    });

    if (nameIdx === -1) {
      return res.status(400).json({ error: 'El archivo debe contener una columna Nombre' });
    }

    const resultados = { creados: 0, errores: [], filas: 0 };

    // Recopilar materias válidas primero para insertarlas en lote
    const materiasACrear = [];

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row.hasValues) continue;
      
      resultados.filas++;

      const nombre = row.getCell(nameIdx).value?.toString().trim();
      const tipo = tipoIdx !== -1 ? row.getCell(tipoIdx).value?.toString().trim() : 'Transversal';

      if (!nombre) {
        resultados.errores.push(`Fila ${i}: Nombre de materia en blanco`);
        continue;
      }

      // Validar si ya existe en la ficha (comparar con las existentes Y las que ya vamos a crear)
      const yaExiste = ficha.materias.some(m => m.nombre.toLowerCase() === nombre.toLowerCase())
        || materiasACrear.some(m => m.nombre.toLowerCase() === nombre.toLowerCase());

      if (yaExiste) {
        resultados.errores.push(`Fila ${i}: La materia ${nombre} ya existe en la ficha`);
        continue;
      }

      materiasACrear.push({
        nombre,
        tipo: tipo || 'Transversal',
        fichaId,
        instructorId
      });
    }

    // Inserción en lote (una sola query en lugar de N queries)
    if (materiasACrear.length > 0) {
      await prisma.materia.createMany({
        data: materiasACrear,
        skipDuplicates: true
      });
      resultados.creados = materiasACrear.length;

      await prisma.historialCambios.create({
        data: {
          fichaId, usuarioId: instructorId,
          tipoEvento: 'IMPORTACION_MATERIA', entidad: 'Ficha', entidadId: fichaId,
          descripcion: `${materiasACrear.length} materias importadas masivamente`
        }
      });
    }

    res.json({ message: 'Importación finalizada', resultados });

  } catch (error) {
    console.error('Error importando materias:', error);
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
  
  worksheet.addRow({ nombre: 'Juan Pérez', documento: '1020304050', email: 'juan.perez@example.com' });
  worksheet.addRow({ nombre: 'María Gómez', documento: '1098765432', email: 'maria.gomez@example.com' });
  
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Plantilla_Aprendices_Arachiz.xlsx"`);
  
  await workbook.xlsx.write(res);
  res.end();
};

const downloadPlantillaMaterias = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Materias');
  
  worksheet.columns = [
    { header: 'Nombre de la Materia', key: 'nombre', width: 40 },
    { header: 'Tipo (Técnica/Transversal)', key: 'tipo', width: 25 }
  ];
  
  worksheet.addRow({ nombre: 'Desarrollo de Software', tipo: 'Técnica' });
  worksheet.addRow({ nombre: 'Ética Profesional', tipo: 'Transversal' });
  
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Plantilla_Materias_Arachiz.xlsx"`);
  
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
  
  // Format DD/MM/YYYY
  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Format YYYY-MM-DD
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
    .replace(/^\d+\s*[-–—]\s*/, '') // Remove starting digits followed by dash
    .replace(/^\d+\s+/, '')         // Remove starting digits followed by space
    .trim();
}

const parseExcelFicha = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(400).json({ error: 'El archivo está vacío' });

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

    if (!numero || !nombre) {
      return res.status(400).json({ 
        error: 'El formato del archivo no coincide. Se espera el número de ficha en C3 y la denominación del programa en C6.' 
      });
    }

    const fechaInicio = parseExcelDate(rawFechaInicio);
    const fechaFin = parseExcelDate(rawFechaFin);

    const region = cleanName(rawRegional);
    const centro = cleanName(rawCentro);

    // Read materias from column F (6th column) starting at row 14
    const materiasSet = new Set();
    const rowCount = worksheet.rowCount;
    for (let r = 14; r <= rowCount; r++) {
      const cell = worksheet.getCell(`F${r}`);
      if (cell && cell.value !== null && cell.value !== undefined) {
        let val = '';
        if (typeof cell.value === 'object') {
          if (cell.value.result !== undefined && cell.value.result !== null) {
            val = cell.value.result.toString();
          } else if (cell.value.richText) {
            val = cell.value.richText.map(t => t.text).join('');
          } else if (cell.value.text) {
            val = cell.value.text.toString();
          } else {
            val = cell.value.toString();
          }
        } else {
          val = cell.value.toString();
        }
        val = cleanName(val);
        if (val) {
          materiasSet.add(val);
        }
      }
    }

    const materias = Array.from(materiasSet);

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
      materias
    });
  } catch (error) {
    console.error('Error al analizar archivo Excel:', error);
    res.status(500).json({ error: 'Error al analizar el archivo Excel: ' + error.message });
  }
};

const confirmExcelFicha = async (req, res) => {
  const { ficha, materias } = req.body;
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

    const result = await prisma.$transaction(async (tx) => {
      const newFicha = await tx.ficha.create({
        data: {
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
          administrador: { connect: { id: instructorId } },
          instructorAdmin: { connect: { id: instructorId } },
          instructores: {
            create: [{ instructorId, role: 'admin' }]
          }
        }
      });

      if (materias && materias.length > 0) {
        await tx.materia.createMany({
          data: materias.map((materiaNombre) => ({
            nombre: materiaNombre,
            tipo: 'Técnica',
            fichaId: newFicha.id,
            instructorId: instructorId
          })),
          skipDuplicates: true
        });
      }

      await tx.historialCambios.create({
        data: {
          fichaId: newFicha.id,
          usuarioId: instructorId,
          tipoEvento: 'CREACION_IMPORTACION',
          entidad: 'Ficha',
          entidadId: newFicha.id,
          descripcion: `Ficha ${newFicha.numero} y ${materias ? materias.length : 0} materias creadas e importadas desde Excel`
        }
      });

      return newFicha;
    });

    res.status(201).json({
      message: 'Ficha y materias importadas exitosamente',
      ficha: result
    });
  } catch (error) {
    console.error('Error al confirmar importación de Excel:', error);
    res.status(500).json({ error: 'Error al confirmar la importación: ' + error.message });
  }
};

module.exports = { 
  importAprendices, 
  importMaterias, 
  downloadPlantillaAprendices, 
  downloadPlantillaMaterias,
  parseExcelFicha,
  confirmExcelFicha
};
