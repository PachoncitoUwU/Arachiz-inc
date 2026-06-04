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

      // Validar si ya existe
      if (ficha.materias.some(m => m.nombre.toLowerCase() === nombre.toLowerCase())) {
        resultados.errores.push(`Fila ${i}: La materia ${nombre} ya existe en la ficha`);
        continue;
      }

      await prisma.materia.create({
        data: {
          nombre,
          tipo: tipo || 'Transversal',
          fichaId,
          instructorId // Se le asigna por defecto al que la subió
        }
      });

      await prisma.historialCambios.create({
        data: {
          fichaId, usuarioId: instructorId,
          tipoEvento: 'IMPORTACION_MATERIA', entidad: 'Ficha', entidadId: fichaId,
          descripcion: `Materia ${nombre} importada masivamente`
        }
      });
      resultados.creados++;
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

module.exports = { importAprendices, importMaterias, downloadPlantillaAprendices, downloadPlantillaMaterias };
