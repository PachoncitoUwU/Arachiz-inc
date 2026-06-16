const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const ExcelJS = require('exceljs');

const generarCodigoUnico = async () => {
  let codigo;
  let existe = true;
  while (existe) {
    codigo = crypto.randomBytes(3).toString('hex').toUpperCase();
    const evt = await prisma.evento.findUnique({ where: { codigoInvitacion: codigo } });
    if (!evt) existe = false;
  }
  return codigo;
};

// 1. Obtener eventos (filtrados por rol)
const getEventos = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query; // 'admin' o 'instructor'

    let eventos;

    if (role === 'admin') {
      // El administrador ve los eventos de las fichas que administra o creados por él
      eventos = await prisma.evento.findMany({
        where: {
          OR: [
            { creadorId: userId },
            {
              fichas: {
                some: {
                  ficha: { administradorId: userId }
                }
              }
            }
          ]
        },
        include: {
          creador: { select: { fullName: true } },
          fichas: {
            include: { ficha: { select: { numero: true, nombre: true } } }
          },
          _count: { select: { registros: true } }
        },
        orderBy: { fechaHora: 'desc' }
      });
    } else {
      // El instructor ve los creados por él, o donde sus fichas participan
      eventos = await prisma.evento.findMany({
        where: {
          OR: [
            { creadorId: userId },
            {
              fichas: {
                some: {
                  ficha: {
                    OR: [
                      { instructorAdminId: userId },
                      { instructores: { some: { instructorId: userId } } }
                    ]
                  }
                }
              }
            }
          ]
        },
        include: {
          creador: { select: { fullName: true } },
          fichas: {
            include: { ficha: { select: { numero: true, nombre: true } } }
          },
          _count: { select: { registros: true } }
        },
        orderBy: { fechaHora: 'desc' }
      });
    }

    res.json({ eventos });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos: ' + err.message });
  }
};

// 2. Obtener eventos para aprendices
const getEventosAprendiz = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar en qué fichas está el aprendiz
    const userFichas = await prisma.ficha.findMany({
      where: { aprendices: { some: { id: userId } } },
      select: { id: true }
    });
    const fichasIds = userFichas.map(f => f.id);

    // Obtener eventos activos de hoy en adelante
    const eventos = await prisma.evento.findMany({
      where: {
        fichas: { some: { fichaId: { in: fichasIds } } },
        fechaHora: { gte: new Date(new Date().setHours(0,0,0,0)) }
      },
      include: {
        creador: { select: { fullName: true } },
        fichas: { select: { fichaId: true } }
      },
      orderBy: { fechaHora: 'asc' }
    });

    res.json({ eventos });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos del aprendiz: ' + err.message });
  }
};

// 3. Crear evento
const crearEvento = async (req, res) => {
  try {
    const { nombre, descripcion, fechaHora, fichasIds } = req.body;
    const creadorId = req.user.id;

    if (!nombre || !fechaHora) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, fechaHora)' });
    }

    const codigoInvitacion = await generarCodigoUnico();

    const evento = await prisma.evento.create({
      data: {
        nombre,
        descripcion,
        fechaHora: new Date(fechaHora),
        creadorId,
        codigoInvitacion,
        fichas: fichasIds && fichasIds.length > 0 ? {
          create: fichasIds.map(fid => ({
            fichaId: fid,
            unidaPorId: creadorId
          }))
        } : undefined
      },
      include: {
        fichas: { include: { ficha: true } }
      }
    });

    res.status(201).json({ message: 'Evento creado exitosamente', evento });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear evento: ' + err.message });
  }
};

// 4. Unir fichas mediante código
const unirFichasCodigo = async (req, res) => {
  try {
    const { codigoInvitacion, fichasIds } = req.body;
    const userId = req.user.id;

    if (!codigoInvitacion || !fichasIds || fichasIds.length === 0) {
      return res.status(400).json({ error: 'Código de invitación y Fichas requeridos' });
    }

    const evento = await prisma.evento.findUnique({
      where: { codigoInvitacion }
    });

    if (!evento) {
      return res.status(404).json({ error: 'Código de invitación inválido o evento no encontrado' });
    }

    // Filtrar fichas que ya están en el evento
    const fichasActuales = await prisma.eventoFicha.findMany({
      where: { eventoId: evento.id }
    });
    const fichasActualesIds = fichasActuales.map(f => f.fichaId);

    const fichasNuevas = fichasIds.filter(fid => !fichasActualesIds.includes(fid));

    if (fichasNuevas.length === 0) {
      return res.status(400).json({ error: 'Las fichas seleccionadas ya están unidas a este evento' });
    }

    await prisma.eventoFicha.createMany({
      data: fichasNuevas.map(fid => ({
        eventoId: evento.id,
        fichaId: fid,
        unidaPorId: userId
      }))
    });

    res.json({ message: 'Fichas unidas al evento exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al unir fichas: ' + err.message });
  }
};

// 5. Detalles del evento (incluye aprendices de todas las fichas)
const getEventoDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        creador: { select: { fullName: true } },
        fichas: {
          include: {
            ficha: {
              include: {
                aprendices: {
                  select: { id: true, fullName: true, document: true, avatarUrl: true, nfcUid: true }
                },
                instructores: {
                  include: { instructor: { select: { id: true, fullName: true, document: true } } }
                },
                instructorAdmin: { select: { id: true, fullName: true, document: true } },
                competencias: {
                  include: {
                    resultados: {
                      include: {
                        instructor: { select: { id: true, fullName: true, document: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        registros: true
      }
    });

    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Extraer todos los aprendices y combinarlos
    let todosAprendicesMap = new Map();
    evento.fichas.forEach(f => {
      f.ficha.aprendices.forEach(a => {
        if (!todosAprendicesMap.has(a.id)) {
          todosAprendicesMap.set(a.id, {
            ...a,
            fichaNumero: f.ficha.numero,
            presente: false,
            metodo: null,
            registroId: null
          });
        }
      });
    });

    // Marcar los que tienen registro
    evento.registros.forEach(r => {
      if (todosAprendicesMap.has(r.aprendizId)) {
        const ap = todosAprendicesMap.get(r.aprendizId);
        ap.presente = r.presente;
        ap.metodo = r.metodo;
        ap.registroId = r.id;
        ap.timestamp = r.timestamp;
      }
    });

    const aprendicesList = Array.from(todosAprendicesMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));

    // Extraer todos los instructores
    let todosInstructoresMap = new Map();
    evento.fichas.forEach(f => {
      // 1. Añadir instructorAdmin
      if (f.ficha.instructorAdmin) {
        if (!todosInstructoresMap.has(f.ficha.instructorAdmin.id)) {
          todosInstructoresMap.set(f.ficha.instructorAdmin.id, {
            ...f.ficha.instructorAdmin,
            fichaNumero: f.ficha.numero
          });
        }
      }
      
      // 2. Añadir de FichaInstructor
      if (f.ficha.instructores) {
        f.ficha.instructores.forEach(instRel => {
          if (instRel.instructor && !todosInstructoresMap.has(instRel.instructor.id)) {
            todosInstructoresMap.set(instRel.instructor.id, {
              ...instRel.instructor,
              fichaNumero: f.ficha.numero
            });
          }
        });
      }
      
      // 3. Añadir de Resultados de Aprendizaje
      if (f.ficha.competencias) {
        f.ficha.competencias.forEach(comp => {
          if (comp.resultados) {
            comp.resultados.forEach(res => {
              if (res.instructor && !todosInstructoresMap.has(res.instructor.id)) {
                todosInstructoresMap.set(res.instructor.id, {
                  ...res.instructor,
                  fichaNumero: f.ficha.numero
                });
              }
            });
          }
        });
      }
    });
    const instructoresList = Array.from(todosInstructoresMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));

    res.json({
      evento: {
        id: evento.id,
        nombre: evento.nombre,
        descripcion: evento.descripcion,
        fechaHora: evento.fechaHora,
        codigoInvitacion: evento.codigoInvitacion,
        estado: evento.estado,
        creador: evento.creador
      },
      aprendices: aprendicesList,
      instructores: instructoresList
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener detalles: ' + err.message });
  }
};

// 6. Registrar asistencia (manual, qr, nfc)
const registrarAsistencia = async (req, res) => {
  try {
    const { id } = req.params; // Evento ID
    const { aprendizId, document, nfcUid, presente, metodo } = req.body;

    const evento = await prisma.evento.findUnique({ where: { id } });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    if (evento.estado !== 'en_curso') {
      return res.status(400).json({ error: 'La sesión de asistencia no está iniciada' });
    }

    const eventoFichas = await prisma.eventoFicha.findMany({
      where: { eventoId: id }
    });
    const fichasIds = eventoFichas.map(f => f.fichaId);

    if (req.user.userType === 'instructor' && evento.creadorId !== req.user.id) {
      const instructorInFicha = await prisma.ficha.findFirst({
        where: {
          id: { in: fichasIds },
          OR: [
            { instructorAdminId: req.user.id },
            { instructores: { some: { instructorId: req.user.id } } }
          ]
        }
      });
      if (!instructorInFicha) {
        return res.status(403).json({ error: 'No estás autorizado para tomar asistencia en este evento' });
      }
    }

    let user;

    if (aprendizId) {
      user = await prisma.user.findUnique({ where: { id: aprendizId } });
    } else if (document) {
      user = await prisma.user.findUnique({ where: { document } });
    } else if (nfcUid) {
      user = await prisma.user.findUnique({ where: { nfcUid } });
    }

    if (!user) {
      return res.status(404).json({ error: 'Aprendiz no encontrado' });
    }

    const isInFicha = await prisma.ficha.findFirst({
      where: {
        id: { in: fichasIds },
        aprendices: { some: { id: user.id } }
      }
    });

    if (!isInFicha) {
      return res.status(403).json({ error: 'El aprendiz no pertenece a ninguna ficha invitada a este evento' });
    }

    const estadoPresente = presente !== undefined ? presente : true;
    const registroMetodo = metodo || 'manual';

    const registro = await prisma.eventoRegistro.upsert({
      where: {
        eventoId_aprendizId: {
          eventoId: id,
          aprendizId: user.id
        }
      },
      update: {
        presente: estadoPresente,
        metodo: registroMetodo,
        timestamp: new Date()
      },
      create: {
        eventoId: id,
        aprendizId: user.id,
        presente: estadoPresente,
        metodo: registroMetodo
      }
    });

    res.json({ message: 'Asistencia registrada', registro, aprendiz: { id: user.id, fullName: user.fullName } });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar asistencia: ' + err.message });
  }
};

// 7. Descargar Reporte en Excel
const getReporteEvento = async (req, res) => {
  try {
    const { id } = req.params;

    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        creador: { select: { fullName: true } },
        fichas: {
          include: {
            ficha: {
              include: {
                aprendices: { select: { id: true, fullName: true, document: true } }
              }
            }
          }
        },
        registros: true
      }
    });

    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Arachiz System';
    
    const sheet = workbook.addWorksheet('Asistencia Evento');

    sheet.columns = [
      { header: 'Ficha', key: 'ficha', width: 15 },
      { header: 'Aprendiz', key: 'aprendiz', width: 35 },
      { header: 'Documento', key: 'documento', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Método', key: 'metodo', width: 15 },
      { header: 'Fecha/Hora Registro', key: 'hora', width: 25 }
    ];

    // Estilo encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4285F4' } };

    let todosAprendicesMap = new Map();
    evento.fichas.forEach(f => {
      f.ficha.aprendices.forEach(a => {
        if (!todosAprendicesMap.has(a.id)) {
          todosAprendicesMap.set(a.id, {
            ...a,
            fichaNumero: f.ficha.numero,
            presente: false,
            metodo: 'Ninguno',
            hora: 'N/A'
          });
        }
      });
    });

    evento.registros.forEach(r => {
      if (todosAprendicesMap.has(r.aprendizId)) {
        const ap = todosAprendicesMap.get(r.aprendizId);
        ap.presente = r.presente;
        ap.metodo = r.metodo;
        ap.hora = new Date(r.timestamp).toLocaleString('es-CO');
      }
    });

    const aprendicesList = Array.from(todosAprendicesMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));

    aprendicesList.forEach(ap => {
      const row = sheet.addRow({
        ficha: ap.fichaNumero,
        aprendiz: ap.fullName,
        documento: ap.document,
        estado: ap.presente ? 'Presente' : 'Ausente',
        metodo: ap.metodo,
        hora: ap.hora
      });
      if (ap.presente) {
        row.getCell('estado').font = { color: { argb: 'FF34A853' }, bold: true };
      } else {
        row.getCell('estado').font = { color: { argb: 'FFEA4335' }, bold: true };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Evento_${evento.codigoInvitacion}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte: ' + err.message });
  }
};

const iniciarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await prisma.evento.findUnique({ where: { id } });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    if (req.user.userType !== 'administrador' && evento.creadorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el administrador o creador puede iniciar el evento' });
    }

    const updated = await prisma.evento.update({
      where: { id },
      data: { estado: 'en_curso' }
    });

    res.json({ message: 'Evento iniciado', evento: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar evento: ' + err.message });
  }
};

const finalizarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await prisma.evento.findUnique({ where: { id } });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    if (req.user.userType !== 'administrador' && evento.creadorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el administrador o creador puede finalizar el evento' });
    }

    const updated = await prisma.evento.update({
      where: { id },
      data: { estado: 'finalizado' }
    });

    res.json({ message: 'Evento finalizado', evento: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar evento: ' + err.message });
  }
};

module.exports = {
  getEventos,
  getEventosAprendiz,
  crearEvento,
  unirFichasCodigo,
  getEventoDetails,
  registrarAsistencia,
  getReporteEvento,
  iniciarEvento,
  finalizarEvento
};
