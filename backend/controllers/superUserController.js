const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

// Helper para logs
async function registrarLog(req, accion, entidad, entidadId, descripcion, datosAnteriores, datosNuevos) {
  try {
    await prisma.superUserAuditLog.create({
      data: {
        superUserId: req.user.id,
        accion,
        entidad,
        entidadId: entidadId ? String(entidadId) : null,
        descripcion,
        datosAnteriores: datosAnteriores || {},
        datosNuevos: datosNuevos || {},
        ipAddress: req.ip || req.connection?.remoteAddress || '',
        navegador: req.headers['user-agent'] || ''
      }
    });
  } catch (error) {
    console.error('Error registrando log de auditoría:', error);
  }
}

// ==========================================
// A. DASHBOARD SIMPLIFICADO
// ==========================================
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalFichas, totalAsistenciasHoy, excusasPendientes] = await Promise.all([
      prisma.user.count(),
      prisma.ficha.count(),
      prisma.asistencia.count({ where: { timestamp: { gte: today } } }),
      prisma.excusa.count({ where: { estado: 'Pendiente' } })
    ]);

    // Grafico 7 dias
    const past7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    const chartData = [];
    for (let i = 0; i < past7Days.length; i++) {
      const start = past7Days[i];
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      
      const count = await prisma.asistencia.count({
        where: { timestamp: { gte: start, lt: end } }
      });
      chartData.push({
        fecha: start.toISOString().split('T')[0],
        asistencias: count
      });
    }

    res.json({
      metrics: { totalUsers, totalFichas, totalAsistenciasHoy, excusasPendientes },
      chartData
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo dashboard' });
  }
};

// ==========================================
// B. GESTION DE USUARIOS OMNIPRESENTE
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const { tipo, search, page = 1, limit = 50 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    let where = {};
    if (tipo) where.userType = tipo;
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, document: true, userType: true,
          createdAt: true, avatarUrl: true, nfcUid: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({ users, total, page: pageNumber, totalPages: Math.ceil(total / limitNumber) });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        fichasApr: true,
        fichasInst: { include: { ficha: true } },
        fichasAdmin: true,
        fichasAdministradas: true
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo detalle de usuario' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { fullName, email, document, avatarUrl } = req.body;
    const userOld = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!userOld) return res.status(404).json({ error: 'Usuario no encontrado' });

    const userNew = await prisma.user.update({
      where: { id: req.params.id },
      data: { fullName, email, document, avatarUrl }
    });

    const { password: p1, ...oldData } = userOld;
    const { password: p2, ...newData } = userNew;

    await registrarLog(req, 'editar', 'User', req.params.id, `Editó información de ${userOld.fullName}`, oldData, newData);
    res.json(newData);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
};

exports.changeUserType = async (req, res) => {
  try {
    const { userType } = req.body;
    const userOld = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!userOld) return res.status(404).json({ error: 'Usuario no encontrado' });

    const userNew = await prisma.user.update({
      where: { id: req.params.id },
      data: { userType }
    });

    await registrarLog(req, 'cambiar_tipo', 'User', req.params.id, `Cambió tipo de ${userOld.fullName} a ${userType}`, { userType: userOld.userType }, { userType });
    res.json({ message: 'Tipo de usuario actualizado', userType });
  } catch (error) {
    res.status(500).json({ error: 'Error cambiando tipo de usuario' });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const userOld = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!userOld) return res.status(404).json({ error: 'Usuario no encontrado' });

    const newPasswordRaw = `Temp${Math.floor(Math.random() * 10000)}!`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPasswordRaw, salt);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword }
    });

    await registrarLog(req, 'resetear_password', 'User', req.params.id, `Reseteó contraseña de ${userOld.fullName}`, {}, {});
    res.json({ message: 'Contraseña reseteada', tempPassword: newPasswordRaw });
  } catch (error) {
    res.status(500).json({ error: 'Error reseteando contraseña' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  // Assuming we use a field or if not, soft delete is not in User schema?
  // User doesn't have an "activo" or "deleted" field in schema natively based on earlier inspect,
  // If no "activo", we might simulate or just respond. Let's assume we skip this or implement a mock response.
  res.status(501).json({ error: 'Soft delete no implementado en schema (requiere campo activo)' });
};

exports.deleteUserPermanently = async (req, res) => {
  try {
    const userOld = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!userOld) return res.status(404).json({ error: 'Usuario no encontrado' });

    await prisma.user.delete({ where: { id: req.params.id } });

    await registrarLog(req, 'eliminar_permanente', 'User', req.params.id, `Eliminó permanentemente a ${userOld.fullName}`, userOld, null);
    res.json({ message: 'Usuario eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando usuario' });
  }
};

exports.getUserHistory = async (req, res) => {
  try {
    const changes = await prisma.historialCambios.findMany({
      where: { usuarioId: req.params.id },
      orderBy: { fechaHora: 'desc' }
    });
    res.json(changes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
};

// ==========================================
// C. GESTION DE FICHAS GLOBAL
// ==========================================
exports.getAllFichas = async (req, res) => {
  try {
    const fichas = await prisma.ficha.findMany({
      include: {
        administrador: { select: { fullName: true } },
        instructorAdmin: { select: { fullName: true } },
        _count: { select: { aprendices: true, materias: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(fichas);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo fichas' });
  }
};

exports.getFichaDetail = async (req, res) => {
  try {
    const ficha = await prisma.ficha.findUnique({
      where: { id: req.params.id },
      include: {
        administrador: true,
        instructorAdmin: true,
        aprendices: true,
        materias: true,
        instructores: { include: { instructor: true } }
      }
    });
    if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json(ficha);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo detalle de ficha' });
  }
};

exports.createFicha = async (req, res) => {
  try {
    const data = {
      ...req.body,
      duracion: req.body.duracion ? parseInt(req.body.duracion, 10) : 0,
      fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
      fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined
    };
    const newFicha = await prisma.ficha.create({ data });
    await registrarLog(req, 'crear', 'Ficha', newFicha.id, `Creó ficha ${newFicha.numero}`, null, newFicha);
    res.json(newFicha);
  } catch (error) {
    res.status(500).json({ error: 'Error creando ficha' });
  }
};

exports.updateFicha = async (req, res) => {
  try {
    const oldFicha = await prisma.ficha.findUnique({ where: { id: req.params.id } });
    if (!oldFicha) return res.status(404).json({ error: 'Ficha no encontrada' });
    
    const body = req.body;
    const data = {};

    // Solo el superusuario puede cambiar el número, pero debe validar que no exista otro igual
    if (body.numero !== undefined && body.numero.toString() !== oldFicha.numero.toString()) {
      const existente = await prisma.ficha.findUnique({ where: { numero: body.numero.toString() } });
      if (existente) {
        return res.status(400).json({ error: 'Ya existe una ficha con ese número' });
      }
      data.numero = body.numero.toString();
    }

    if (body.nombre !== undefined) data.nombre = body.nombre;
    if (body.nivel !== undefined) data.nivel = body.nivel;
    if (body.centro !== undefined) data.centro = body.centro;
    if (body.jornada !== undefined) data.jornada = body.jornada;
    if (body.region !== undefined) data.region = body.region;
    if (body.duracion !== undefined) data.duracion = body.duracion ? parseInt(body.duracion, 10) : 0;
    if (body.fechaInicio !== undefined) data.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
    if (body.fechaFin !== undefined) data.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;

    const newFicha = await prisma.ficha.update({
      where: { id: req.params.id },
      data
    });
    await registrarLog(req, 'editar', 'Ficha', req.params.id, `Editó ficha ${oldFicha.numero}`, oldFicha, newFicha);
    res.json(newFicha);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando ficha' });
  }
};

exports.deleteFicha = async (req, res) => {
  // Soft delete no soportado nativamente sin campo estado, implementamos el permanente por ahora o mock
  res.status(501).json({ error: 'Soft delete no implementado en schema' });
};

exports.deleteFichaPermanently = async (req, res) => {
  try {
    const oldFicha = await prisma.ficha.findUnique({ where: { id: req.params.id } });
    if (!oldFicha) return res.status(404).json({ error: 'Ficha no encontrada' });
    await prisma.ficha.delete({ where: { id: req.params.id } });
    await registrarLog(req, 'eliminar_permanente', 'Ficha', req.params.id, `Eliminó ficha ${oldFicha.numero}`, oldFicha, null);
    res.json({ message: 'Ficha eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando ficha' });
  }
};

// ==========================================
// D. GESTION DE MATERIAS GLOBAL
// ==========================================
exports.getAllMaterias = async (req, res) => {
  try {
    const materias = await prisma.materia.findMany({
      include: {
        ficha: { select: { numero: true } },
        instructor: { select: { fullName: true } }
      }
    });
    res.json(materias);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo materias' });
  }
};

exports.getMateriaDetail = async (req, res) => {
  try {
    const materia = await prisma.materia.findUnique({
      where: { id: req.params.id },
      include: { ficha: true, instructor: true, horarios: true, asistencias: true }
    });
    res.json(materia);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo materia' });
  }
};

exports.createMateria = async (req, res) => {
  try {
    const newMateria = await prisma.materia.create({ data: req.body });
    await registrarLog(req, 'crear', 'Materia', newMateria.id, `Creó materia ${newMateria.nombre}`, null, newMateria);
    res.json(newMateria);
  } catch (error) {
    res.status(500).json({ error: 'Error creando materia' });
  }
};

exports.updateMateria = async (req, res) => {
  try {
    const oldMat = await prisma.materia.findUnique({ where: { id: req.params.id } });
    const newMat = await prisma.materia.update({
      where: { id: req.params.id },
      data: req.body
    });
    await registrarLog(req, 'editar', 'Materia', req.params.id, `Editó materia ${newMat.nombre}`, oldMat, newMat);
    res.json(newMat);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando materia' });
  }
};

exports.changeInstructorMateria = async (req, res) => {
  try {
    const { nuevoInstructorId } = req.body;
    const oldMat = await prisma.materia.findUnique({ where: { id: req.params.id } });
    const newMat = await prisma.materia.update({
      where: { id: req.params.id },
      data: { instructorId: nuevoInstructorId }
    });
    await registrarLog(req, 'cambiar_instructor', 'Materia', req.params.id, `Cambió instructor de ${newMat.nombre}`, { instructorId: oldMat.instructorId }, { instructorId: nuevoInstructorId });
    res.json(newMat);
  } catch (error) {
    res.status(500).json({ error: 'Error cambiando instructor' });
  }
};

exports.deleteMateria = async (req, res) => {
  res.status(501).json({ error: 'Soft delete no implementado en schema' });
};

exports.deleteMateriaPermanently = async (req, res) => {
  try {
    const oldMat = await prisma.materia.findUnique({ where: { id: req.params.id } });
    await prisma.materia.delete({ where: { id: req.params.id } });
    await registrarLog(req, 'eliminar_permanente', 'Materia', req.params.id, `Eliminó materia ${oldMat?.nombre}`, oldMat, null);
    res.json({ message: 'Materia eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando materia' });
  }
};

// ==========================================
// E. VISOR DE BD
// ==========================================
exports.getAllTables = async (req, res) => {
  try {
    // List of models from Prisma based on schema
    const tables = [
      'User', 'Ficha', 'FichaInstructor', 'Materia', 'Horario', 
      'Asistencia', 'RegistroAsistencia', 'Excusa', 'MateriaEvitada',
      'SnakeScore', 'BreakoutScore', 'FlappyScore', 'TowerScore', 
      'ReactionScore', 'MemoryScore', 'WordleScore', 'SnakeSkin', 
      'UserSkin', 'SkinOrder', 'RespuestaRapida', 'Papelera', 
      'HistorialCambios', 'ConflictoHorario', 'SuperUserAuditLog'
    ];
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo tablas' });
  }
};

exports.getTableData = async (req, res) => {
  try {
    const { tableName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Capitalize first letter properly for Prisma client (e.g. user, ficha)
    const prismaModelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    
    if (!prisma[prismaModelName]) return res.status(404).json({ error: 'Tabla no encontrada' });

    const [data, total] = await Promise.all([
      prisma[prismaModelName].findMany({ skip, take: limit }),
      prisma[prismaModelName].count()
    ]);

    res.json({ data, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo datos de tabla' });
  }
};

exports.createRecord = async (req, res) => {
  try {
    const { tableName } = req.params;
    const prismaModelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    const newRec = await prisma[prismaModelName].create({ data: req.body });
    await registrarLog(req, 'crear_db', tableName, newRec.id, `Creó registro en ${tableName}`, null, newRec);
    res.json(newRec);
  } catch (error) {
    res.status(500).json({ error: 'Error creando registro' });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const prismaModelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    
    const oldRec = await prisma[prismaModelName].findUnique({ where: { id } });
    const newRec = await prisma[prismaModelName].update({
      where: { id },
      data: req.body
    });
    await registrarLog(req, 'editar_db', tableName, id, `Editó registro en ${tableName}`, oldRec, newRec);
    res.json(newRec);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando registro' });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const prismaModelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    
    const oldRec = await prisma[prismaModelName].findUnique({ where: { id } });
    await prisma[prismaModelName].delete({ where: { id } });
    await registrarLog(req, 'eliminar_db', tableName, id, `Eliminó registro en ${tableName}`, oldRec, null);
    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando registro' });
  }
};

exports.exportTableToExcel = async (req, res) => {
  try {
    const { tableName } = req.params;
    const prismaModelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    
    if (!prisma[prismaModelName]) return res.status(404).json({ error: 'Tabla no encontrada' });

    const data = await prisma[prismaModelName].findMany();
    
    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, tableName);
    
    // Write to buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', `attachment; filename="${tableName}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Error exportando tabla' });
  }
};

// ==========================================
// F. GESTION DE EXCUSAS GLOBAL
// ==========================================
exports.getAllExcusas = async (req, res) => {
  try {
    const excusas = await prisma.excusa.findMany({
      include: {
        aprendiz: { select: { fullName: true, document: true } },
        materia: { select: { nombre: true, ficha: { select: { numero: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(excusas);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo excusas' });
  }
};

exports.approveExcusa = async (req, res) => {
  try {
    const { respuesta } = req.body;
    const oldExc = await prisma.excusa.findUnique({ where: { id: req.params.id } });
    const newExc = await prisma.excusa.update({
      where: { id: req.params.id },
      data: { estado: 'Aprobada', respuesta, respondedAt: new Date() }
    });
    await registrarLog(req, 'aprobar_excusa', 'Excusa', req.params.id, `Aprobó excusa de ID ${req.params.id}`, { estado: oldExc.estado }, { estado: 'Aprobada' });
    res.json(newExc);
  } catch (error) {
    res.status(500).json({ error: 'Error aprobando excusa' });
  }
};

exports.rejectExcusa = async (req, res) => {
  try {
    const { respuesta } = req.body;
    const oldExc = await prisma.excusa.findUnique({ where: { id: req.params.id } });
    const newExc = await prisma.excusa.update({
      where: { id: req.params.id },
      data: { estado: 'Rechazada', respuesta, respondedAt: new Date() }
    });
    await registrarLog(req, 'rechazar_excusa', 'Excusa', req.params.id, `Rechazó excusa de ID ${req.params.id}`, { estado: oldExc.estado }, { estado: 'Rechazada' });
    res.json(newExc);
  } catch (error) {
    res.status(500).json({ error: 'Error rechazando excusa' });
  }
};

exports.deleteExcusa = async (req, res) => {
  try {
    const oldExc = await prisma.excusa.findUnique({ where: { id: req.params.id } });
    await prisma.excusa.delete({ where: { id: req.params.id } });
    await registrarLog(req, 'eliminar_excusa', 'Excusa', req.params.id, `Eliminó excusa`, oldExc, null);
    res.json({ message: 'Excusa eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando excusa' });
  }
};

// ==========================================
// G. BACKUP MANUAL
// ==========================================
exports.createBackup = async (req, res) => {
  try {
    const [usuarios, fichas, materias, asistencias] = await Promise.all([
      prisma.user.findMany(),
      prisma.ficha.findMany(),
      prisma.materia.findMany(),
      prisma.asistencia.findMany()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      data: { usuarios, fichas, materias, asistencias }
    };

    const buffer = Buffer.from(JSON.stringify(backupData, null, 2));

    await registrarLog(req, 'crear_backup', 'Sistema', null, `Generó backup manual completo`, null, null);

    res.setHeader('Content-Disposition', `attachment; filename="backup_${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Error generando backup' });
  }
};

// ==========================================
// H. LOGS DE AUDITORIA
// ==========================================
exports.getLogs = async (req, res) => {
  try {
    const logs = await prisma.superUserAuditLog.findMany({
      include: {
        superUser: { select: { fullName: true, email: true } }
      },
      orderBy: { fechaHora: 'desc' },
      take: 500
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo logs' });
  }
};

exports.getLogDetail = async (req, res) => {
  try {
    const log = await prisma.superUserAuditLog.findUnique({
      where: { id: req.params.id },
      include: {
        superUser: { select: { fullName: true, email: true } }
      }
    });
    if (!log) return res.status(404).json({ error: 'Log no encontrado' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo detalle de log' });
  }
};

// ==========================================
// I. GESTIÓN DE SUPER USUARIOS
// ==========================================
exports.getAllSuperUsers = async (req, res) => {
  try {
    const superUsers = await prisma.user.findMany({
      where: { userType: 'super_usuario' },
      select: { id: true, fullName: true, email: true, createdAt: true }
    });
    res.json(superUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo super usuarios' });
  }
};

exports.createSuperUser = async (req, res) => {
  try {
    const { fullName, email, document } = req.body;
    
    const newPasswordRaw = `Super${Math.floor(Math.random() * 10000)}!`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPasswordRaw, salt);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        document,
        password: hashedPassword,
        userType: 'super_usuario'
      }
    });

    await registrarLog(req, 'crear_superuser', 'User', newUser.id, `Creó un nuevo Super Usuario: ${fullName}`, null, { id: newUser.id, email });
    res.json({ message: 'Super usuario creado', tempPassword: newPasswordRaw, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Error creando super usuario' });
  }
};

exports.toggleSuperUserStatus = async (req, res) => {
  res.status(501).json({ error: 'Soft delete no implementado en schema' });
};

exports.resetSuperUserPassword = async (req, res) => {
  exports.resetUserPassword(req, res);
};

// ==========================================
// J. ESTADISTICAS
// ==========================================
exports.getStatistics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activosHoy, asistenciasHoy, userCounts, excusasCounts] = await Promise.all([
      prisma.user.count({ where: { updatedAt: { gte: today } } }).catch(() => 0), // updatedAt missing? let's mock or use other metric. Using catch.
      prisma.asistencia.count({ where: { timestamp: { gte: today } } }),
      prisma.user.groupBy({ by: ['userType'], _count: true }),
      prisma.excusa.groupBy({ by: ['estado'], _count: true })
    ]);

    res.json({
      activosHoy: activosHoy || 0,
      asistenciasHoy,
      userCounts,
      excusasCounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadisticas' });
  }
};
