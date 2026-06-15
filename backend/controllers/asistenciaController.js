const prisma = require('../lib/prisma');
const { getCurrentColombiaDate, getCurrentColombiaTime } = require('../utils/timeService');
const { sendAttendanceEmail } = require('../utils/emailService');
const { sendPushToUsers } = require('../utils/webPush');

// Cache en memoria de sesiones activas: { asistenciaId → { resultadoId, activa, llegadaTarde, timestamp, fichaAprendicesIds } }
const sessionCache = new Map();
const SESSION_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos máximo

async function getSessionFromCache(asistenciaId) {
  const cached = sessionCache.get(asistenciaId);
  if (cached && Date.now() - cached._cachedAt < SESSION_CACHE_TTL_MS) {
    return cached;
  }
  
  const session = await prisma.asistencia.findUnique({
    where: { id: asistenciaId },
    select: {
      id: true,
      activa: true,
      resultadoId: true,
      llegadaTarde: true,
      timestamp: true,
      resultado: {
        select: {
          competencia: {
            select: {
              ficha: {
                select: {
                  aprendices: { select: { id: true } }
                }
              }
            }
          }
        }
      }
    }
  });
  
  if (!session) return null;
  
  const entry = {
    ...session,
    fichaAprendicesIds: new Set(session.resultado.competencia.ficha.aprendices.map(a => a.id)),
    _cachedAt: Date.now()
  };
  
  if (session.activa) sessionCache.set(asistenciaId, entry);
  return entry;
}

function invalidateSessionCache(asistenciaId) {
  sessionCache.delete(asistenciaId);
}

// RF08 - Crear sesión
const createSession = async (req, res) => {
  const { resultadoId, llegadaTarde, duracion, aula, descripcion } = req.body;
  const instructorId = req.user.id;
  
  if (!resultadoId) return res.status(400).json({ error: 'Falta el resultado de aprendizaje' });
  
  try {
    // Verificar que el instructor a cargo es el que inicia la sesión
    const resultadoObj = await prisma.resultadoAprendizaje.findUnique({
      where: { id: resultadoId }
    });
    
    if (!resultadoObj) {
      return res.status(404).json({ error: 'Resultado de aprendizaje no encontrado' });
    }
    
    if (resultadoObj.instructorId !== instructorId) {
      return res.status(403).json({ error: 'No tienes permiso para iniciar sesión en este resultado de aprendizaje (no estás a cargo)' });
    }

    // Verificar que no haya sesión activa para este resultado
    const existing = await prisma.asistencia.findFirst({
      where: { resultadoId, activa: true }
    });
    if (existing) return res.status(400).json({ error: 'Ya hay una sesión activa para este resultado de aprendizaje' });

    // Obtener fecha actual de Colombia
    const autoFecha = await getCurrentColombiaDate();
    const colombiaTime = await getCurrentColombiaTime();
    console.log(`[Asistencia] Creando sesión con fecha de Colombia: ${autoFecha}`);

    const parsedLlegadaTarde = llegadaTarde !== undefined ? parseInt(llegadaTarde, 10) : 15;
    const parsedDuracion = duracion !== undefined ? parseInt(duracion, 10) : 120;

    // Crear la sesión
    const newAsistencia = await prisma.asistencia.create({
      data: {
        fecha: autoFecha,
        timestamp: colombiaTime,
        llegadaTarde: parsedLlegadaTarde,
        duracion: parsedDuracion,
        aula: aula || null,
        descripcion: descripcion || null,
        resultado: { connect: { id: resultadoId } },
        instructor: { connect: { id: instructorId } },
        activa: true
      },
      include: {
        registros: { include: { aprendiz: { select: { fullName: true, document: true } } } },
        resultado: { 
          include: { 
            competencia: { 
              include: { 
                ficha: { 
                  select: { 
                    numero: true, 
                    aprendices: { 
                      select: { 
                        id: true, 
                        fullName: true, 
                        document: true, 
                        nfcUid: true, 
                        huellas: true, 
                        avatarUrl: true
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
    
    // Filtrar resultados evitados en memoria
    const resultadosEvitados = await prisma.resultadoEvitado.findMany({
      where: { resultadoId },
      select: { aprendizId: true }
    });
    const evitadasIds = new Set(resultadosEvitados.map(re => re.aprendizId));
    newAsistencia.resultado.competencia.ficha.aprendices = newAsistencia.resultado.competencia.ficha.aprendices.filter(a => !evitadasIds.has(a.id));
    
    const serialService = req.app.get('serialService');

    // Notificar al hardware (USB o WiFi)
    if (serialService && serialService.isConnected) {
      serialService.sendCommand('SESSION ON');
    } else {
      const hardwareController = require('./hardwareController');
      hardwareController.queueCommand('SESSION ON');
    }

    const userIds = newAsistencia.resultado.competencia.ficha.aprendices.map(a => a.id);
    const resultadoName = newAsistencia.resultado.nombre;
    const instructorName = req.user?.fullName || 'tu instructor';

    // Responder inmediatamente al instructor sin esperar el push
    res.status(201).json({ message: 'Sesión creada', asistencia: newAsistencia });

    // Push en background
    sendPushToUsers(userIds, {
      title: '¡Sesión de Asistencia Iniciada!',
      body: `La sesión de ${resultadoName} ha comenzado con ${instructorName}. Registra tu asistencia a tiempo.`,
      icon: '/mi-logo.png',
      url: '/aprendiz/dashboard'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear la sesión: ' + err.message });
  }
};

// RF30/RF31 - Historial del aprendiz
const getMyAttendance = async (req, res) => {
  const aprendizId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit || '200', 10), 500);
  const offset = parseInt(req.query.offset || '0', 10);
  try {
    const [registros, total] = await Promise.all([
      prisma.registroAsistencia.findMany({
        where: { aprendizId },
        select: {
          id: true,
          presente: true,
          metodo: true,
          tarde: true,
          justificado: true,
          timestamp: true,
          asistencia: {
            select: {
              id: true,
              fecha: true,
              resultado: {
                select: {
                  nombre: true,
                  competencia: { select: { nombre: true, tipo: true } }
                }
              }
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.registroAsistencia.count({ where: { aprendizId } })
    ]);
    res.json({ registros, total, limit, offset });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Obtener todas las sesiones de un resultado
const getSessionsByResultado = async (req, res) => {
  const { resultadoId } = req.params;
  const { fechaDesde, fechaHasta, estado, metodo } = req.query;
  
  try {
    let whereClause = { resultadoId };
    
    if (fechaDesde || fechaHasta) {
      whereClause.fecha = {};
      if (fechaDesde) whereClause.fecha.gte = fechaDesde;
      if (fechaHasta) whereClause.fecha.lte = fechaHasta;
    }
    
    if (estado === 'activa') {
      whereClause.activa = true;
    } else if (estado === 'finalizada') {
      whereClause.activa = false;
    }

    const asistencias = await prisma.asistencia.findMany({
      where: whereClause,
      include: {
        registros: { 
          where: metodo ? { metodo } : {},
          include: { 
            aprendiz: { select: { fullName: true, document: true } } 
          } 
        },
        instructor: { select: { fullName: true } },
        resultado: {
          select: {
            nombre: true,
            competencia: { select: { nombre: true, tipo: true } }
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });
    
    res.json({ asistencias });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF09 - Registrar asistencia (aprendiz por código)
const registerAttendance = async (req, res) => {
  const { asistenciaId, metodo } = req.body;
  const targetAprendizId = req.user.id;
  try {
    const asistencia = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
      include: {
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: {
                    aprendices: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!asistencia) return res.status(404).json({ error: 'No se encontró la sesión' });
    if (!asistencia.activa) return res.status(400).json({ error: 'La sesión de asistencia ya finalizó' });

    const perteneceAFicha = asistencia.resultado.competencia.ficha.aprendices.some(a => a.id === targetAprendizId);
    if (!perteneceAFicha) {
      return res.status(403).json({ error: 'No perteneces a la ficha de este resultado de aprendizaje' });
    }
    
    // Verificar que el aprendiz NO tenga este resultado evitado
    const tieneResultadoEvitado = await prisma.resultadoEvitado.findUnique({
      where: {
        aprendizId_resultadoId: {
          aprendizId: targetAprendizId,
          resultadoId: asistencia.resultadoId
        }
      }
    });
    
    if (tieneResultadoEvitado) {
      return res.status(403).json({ error: 'No puedes registrar asistencia en un resultado evitado' });
    }

    const existing = await prisma.registroAsistencia.findUnique({
      where: { asistenciaId_aprendizId: { asistenciaId, aprendizId: targetAprendizId } }
    });
    if (existing) return res.status(400).json({ error: 'Ya registraste tu asistencia en esta sesión' });

    const colombiaTime = await getCurrentColombiaTime();

    // Calcular tardanza
    const sessionStart = new Date(asistencia.timestamp);
    const registerTime = new Date(colombiaTime);
    const diffMs = registerTime.getTime() - sessionStart.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const tarde = diffMins > (asistencia.llegadaTarde || 15);

    const registro = await prisma.registroAsistencia.create({
      data: {
        presente: true,
        metodo: metodo || 'codigo',
        timestamp: colombiaTime,
        tarde: tarde,
        asistencia: { connect: { id: asistenciaId } },
        aprendiz: { connect: { id: targetAprendizId } }
      },
      include: { aprendiz: { select: { id: true, fullName: true, document: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        id: registro.id,
        aprendizId: targetAprendizId,
        aprendiz: {
          id: targetAprendizId,
          fullName: registro.aprendiz.fullName,
          document: registro.aprendiz.document
        },
        presente: true,
        metodo: registro.metodo,
        timestamp: registro.timestamp,
        tarde: registro.tarde
      });
    }
    res.json({ message: 'Asistencia registrada', registro });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar asistencia: ' + err.message });
  }
};

// Registrar asistencia con Hardware (Instructor)
const registerHardwareAttendance = async (req, res) => {
  const { asistenciaId, nfcUid, huellaId } = req.body;
  if (!asistenciaId) return res.status(400).json({ error: 'Falta asistenciaId' });

  try {
    const whereClauses = [];
    if (nfcUid) whereClauses.push({ nfcUid });
    if (huellaId !== undefined) whereClauses.push({ huellas: { has: parseInt(huellaId, 10) } });

    if (whereClauses.length === 0) {
      return res.status(400).json({ error: 'Se requiere nfcUid o huellaId' });
    }

    const aprendiz = await prisma.user.findFirst({ where: { OR: whereClauses } });
    if (!aprendiz) return res.status(404).json({ error: 'Usuario no encontrado para este hardware' });

    const asistencia = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
      include: {
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: {
                    aprendices: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!asistencia || !asistencia.activa) return res.status(400).json({ error: 'Sesión inactiva o no encontrada' });

    const belongsToFicha = asistencia.resultado.competencia.ficha.aprendices.some(a => a.id === aprendiz.id);
    if (!belongsToFicha) return res.status(403).json({ error: 'Aprendiz no pertenece a esta ficha' });
    
    // Verificar que el aprendiz NO tenga este resultado evitado
    const tieneResultadoEvitado = await prisma.resultadoEvitado.findUnique({
      where: {
        aprendizId_resultadoId: {
          aprendizId: aprendiz.id,
          resultadoId: asistencia.resultadoId
        }
      }
    });
    
    if (tieneResultadoEvitado) {
      return res.status(403).json({ error: 'Este aprendiz tiene este resultado evitado' });
    }

    const existing = await prisma.registroAsistencia.findUnique({
      where: { asistenciaId_aprendizId: { asistenciaId, aprendizId: aprendiz.id } }
    });

    if (existing) {
       return res.status(400).json({ error: 'Ya registró su asistencia previamente' });
    }

    const colombiaTime = await getCurrentColombiaTime();

    // Calcular tardanza
    const sessionStart = new Date(asistencia.timestamp);
    const registerTime = new Date(colombiaTime);
    const diffMs = registerTime.getTime() - sessionStart.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const tarde = diffMins > (asistencia.llegadaTarde || 15);

    const registro = await prisma.registroAsistencia.create({
      data: {
        presente: true,
        metodo: nfcUid ? 'nfc' : 'huella',
        timestamp: colombiaTime,
        tarde: tarde,
        asistencia: { connect: { id: asistenciaId } },
        aprendiz: { connect: { id: aprendiz.id } }
      },
      include: { aprendiz: { select: { id: true, fullName: true, document: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        id: registro.id,
        aprendizId: aprendiz.id,
        aprendiz: {
          id: aprendiz.id,
          fullName: registro.aprendiz.fullName,
          document: registro.aprendiz.document
        },
        presente: true,
        metodo: registro.metodo,
        timestamp: registro.timestamp,
        tarde: registro.tarde
      });
    }

    res.json({ message: 'Asistencia de hardware registrada', registro });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar hardware: ' + err.message });
  }
};

const closeSessionById = async (id, io, serialService) => {
  const asistenciaBasic = await prisma.asistencia.findUnique({
    where: { id },
    select: { id: true, activa: true, resultadoId: true }
  });
  
  if (!asistenciaBasic) throw new Error('Sesión no encontrada');
  if (!asistenciaBasic.activa) throw new Error('La sesión ya fue cerrada');

  const asistencia = await prisma.asistencia.findUnique({
    where: { id },
    include: {
      registros: true,
      resultado: {
        include: {
          competencia: {
            include: {
              ficha: {
                include: {
                  aprendices: {
                    where: {
                      NOT: {
                        resultadosEvitados: {
                          some: { resultadoId: asistenciaBasic.resultadoId }
                        }
                      }
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

  const todosAprendices = asistencia.resultado.competencia.ficha.aprendices;
  const registradosIds = asistencia.registros.map(r => r.aprendizId);
  const ausentes = todosAprendices.filter(a => !registradosIds.includes(a.id));

  if (ausentes.length > 0) {
    await prisma.registroAsistencia.createMany({
      data: ausentes.map(a => ({
        presente: false,
        metodo: 'automatico',
        asistenciaId: asistencia.id,
        aprendizId: a.id
      }))
    });

    // Enviar correos de inasistencia en paralelo
    Promise.all(ausentes.map(a =>
      sendAttendanceEmail(
        a.email,
        a.fullName,
        asistencia.resultado.nombre,
        'ausente',
        new Date(),
        'automatico'
      ).catch(err => console.error(`[EmailService] Error al enviar correo a ${a.email}:`, err))
    ));
  }

  const updatedAsistencia = await prisma.asistencia.update({
    where: { id },
    data: { activa: false },
    include: {
      registros: { include: { aprendiz: { select: { fullName: true, document: true } } } }
    }
  });

  if (serialService) serialService.sendCommand('SESSION OFF');
  if (io) io.to(`session_${id}`).emit('sessionClosed', { id });

  // Notificar al ESP por WiFi
  if (!serialService || !serialService.isConnected) {
    const hardwareController = require('./hardwareController');
    hardwareController.queueCommand('SESSION OFF');
  }

  // Update Rachas de Asistencia
  try {
    if (registradosIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: registradosIds } },
        data: { rachaAsistencia: { increment: 1 } }
      });
    }
    if (ausentes.length > 0) {
      const ausentesIds = ausentes.map(a => a.id);
      await prisma.user.updateMany({
        where: { id: { in: ausentesIds } },
        data: { rachaAsistencia: 0 }
      });
    }
  } catch (err) {
    console.error('[Streaks] Error actualizando rachas de asistencia:', err);
  }

  return updatedAsistencia;
};

// RF28/RF42 - Finalizar sesión
const endSession = async (req, res) => {
  const { id } = req.params;
  try {
    const io = req.app.get('io');
    const serialService = req.app.get('serialService');
    const updated = await closeSessionById(id, io, serialService);
    invalidateSessionCache(id);
    res.json({ message: 'Sesión finalizada. Ausencias marcadas automáticamente.', asistencia: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar sesión: ' + err.message });
  }
};

const checkAndCloseExpiredSessions = async (io, serialService) => {
  try {
    const now = new Date();
    const activeSessions = await prisma.asistencia.findMany({
      where: { activa: true }
    });

    for (const session of activeSessions) {
      const sessionStart = new Date(session.timestamp);
      const durationMs = session.duracion * 60 * 1000;
      const expireTime = new Date(sessionStart.getTime() + durationMs);

      if (now >= expireTime) {
        console.log(`[AutoClose] La sesión ${session.id} ha expirado. Cerrando automáticamente...`);
        try {
          await closeSessionById(session.id, io, serialService);
        } catch (err) {
          console.error(`[AutoClose] Error cerrando sesión ${session.id}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error('[AutoClose] Error buscando sesion expiradas:', error.message);
  }
};

// RF39/RF50 - Sesión activa de un resultado
const getActiveSession = async (req, res) => {
  const { resultadoId } = req.params;
  try {
    const session = await prisma.asistencia.findFirst({
      where: { resultadoId, activa: true },
      include: {
        registros: { include: { aprendiz: { select: { id: true, fullName: true, document: true } } } },
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: { 
                    aprendices: { 
                      select: { id: true, fullName: true, document: true, nfcUid: true, huellas: true, faceDescriptor: true, avatarUrl: true } 
                    } 
                  }
                }
              }
            },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });
    
    if (session) {
      const resultadosEvitados = await prisma.resultadoEvitado.findMany({
        where: { resultadoId },
        select: { aprendizId: true }
      });
      const evitadasIds = new Set(resultadosEvitados.map(re => re.aprendizId));
      session.resultado.competencia.ficha.aprendices = session.resultado.competencia.ficha.aprendices.filter(a => !evitadasIds.has(a.id));
    }
    
    res.json({ session: session || null });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Buscar sesión activa por ID de sesión directamente (para aprendices)
const getSessionById = async (req, res) => {
  const { id } = req.params;
  try {
    const sessionBasic = await prisma.asistencia.findUnique({
      where: { id },
      select: { resultadoId: true }
    });
    
    if (!sessionBasic) return res.status(404).json({ error: 'Sesión no encontrada' });
    
    const session = await prisma.asistencia.findUnique({
      where: { id },
      include: {
        registros: { include: { aprendiz: { select: { id: true, fullName: true, document: true } } } },
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: { 
                    aprendices: { 
                      select: { id: true, fullName: true, document: true, nfcUid: true, huellas: true, faceDescriptor: true, avatarUrl: true } 
                    } 
                  }
                }
              }
            },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });
    
    if (session) {
      const resultadosEvitados = await prisma.resultadoEvitado.findMany({
        where: { resultadoId: sessionBasic.resultadoId },
        select: { aprendizId: true }
      });
      const evitadasIds = new Set(resultadosEvitados.map(re => re.aprendizId));
      session.resultado.competencia.ficha.aprendices = session.resultado.competencia.ficha.aprendices.filter(a => !evitadasIds.has(a.id));
    }
    
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Buscar CUALQUIER sesión activa del instructor en el momento
const getMyActiveAnySession = async (req, res) => {
  try {
    const sessionBasic = await prisma.asistencia.findFirst({
      where: { instructorId: req.user.id, activa: true },
      select: { id: true, resultadoId: true }
    });
    
    if (!sessionBasic) {
      return res.json({ session: null });
    }
    
    const session = await prisma.asistencia.findFirst({
      where: { instructorId: req.user.id, activa: true },
      include: {
        registros: { include: { aprendiz: { select: { id: true, fullName: true, document: true } } } },
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: { 
                    aprendices: { 
                      select: { id: true, fullName: true, document: true, nfcUid: true, huellas: true, faceDescriptor: true, avatarUrl: true } 
                    } 
                  }
                }
              }
            },
            instructor: { select: { fullName: true } }
          }
        }
      }
    });
    
    if (session) {
      const resultadosEvitados = await prisma.resultadoEvitado.findMany({
        where: { resultadoId: sessionBasic.resultadoId },
        select: { aprendizId: true }
      });
      const evitadasIds = new Set(resultadosEvitados.map(re => re.aprendizId));
      session.resultado.competencia.ficha.aprendices = session.resultado.competencia.ficha.aprendices.filter(a => !evitadasIds.has(a.id));
    }
    
    res.json({ session: session || null });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Registrar asistencia por reconocimiento facial (instructor)
const registerFacialAttendance = async (req, res) => {
  const { asistenciaId, aprendizId } = req.body;
  if (!asistenciaId || !aprendizId) {
    return res.status(400).json({ error: 'Faltan asistenciaId o aprendizId' });
  }

  try {
    const session = await getSessionFromCache(asistenciaId);
    if (!session || !session.activa) {
      return res.status(400).json({ error: 'Sesión inactiva o no encontrada' });
    }

    if (!session.fichaAprendicesIds.has(aprendizId)) {
      return res.status(403).json({ error: 'Aprendiz no pertenece a esta ficha' });
    }

    const colombiaTime = await getCurrentColombiaTime();
    const sessionStart = new Date(session.timestamp);
    const registerTime = new Date(colombiaTime);
    const diffMins = Math.floor((registerTime - sessionStart) / 60000);
    const tarde = diffMins > (session.llegadaTarde || 15);

    let registro;
    try {
      registro = await prisma.registroAsistencia.create({
        data: {
          presente: true,
          metodo: 'facial',
          timestamp: colombiaTime,
          tarde,
          asistencia: { connect: { id: asistenciaId } },
          aprendiz: { connect: { id: aprendizId } }
        },
        select: { id: true, tarde: true, timestamp: true }
      });
    } catch (e) {
      if (e.code === 'P2002') {
        return res.status(400).json({ error: 'Este aprendiz ya registró asistencia' });
      }
      throw e;
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        id: registro.id,
        aprendizId,
        presente: true,
        metodo: 'facial',
        timestamp: registro.timestamp,
        tarde: registro.tarde
      });
    }

    res.json({ message: 'Asistencia facial registrada', ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar: ' + err.message });
  }
};

// Registrar asistencia facial en LOTE
const registerFacialBatch = async (req, res) => {
  const { asistenciaId, aprendizIds } = req.body;
  if (!asistenciaId || !Array.isArray(aprendizIds) || aprendizIds.length === 0) {
    return res.status(400).json({ error: 'Faltan asistenciaId o aprendizIds' });
  }
  if (aprendizIds.length > 20) {
    return res.status(400).json({ error: 'Máximo 20 aprendices por lote' });
  }

  try {
    const session = await getSessionFromCache(asistenciaId);
    if (!session || !session.activa) {
      return res.status(400).json({ error: 'Sesión inactiva o no encontrada' });
    }

    const colombiaTime = await getCurrentColombiaTime();
    const sessionStart = new Date(session.timestamp);
    const diffMins = Math.floor((new Date(colombiaTime) - sessionStart) / 60000);
    const tarde = diffMins > (session.llegadaTarde || 15);

    const validIds = aprendizIds.filter(id => session.fichaAprendicesIds.has(id));

    const results = await Promise.allSettled(
      validIds.map(aprendizId =>
        prisma.registroAsistencia.create({
          data: {
            presente: true,
            metodo: 'facial',
            timestamp: colombiaTime,
            tarde,
            asistencia: { connect: { id: asistenciaId } },
            aprendiz: { connect: { id: aprendizId } }
          },
          select: { id: true, tarde: true, timestamp: true }
        })
      )
    );

    const ok = [];
    const already = [];
    const failed = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        ok.push(validIds[i]);
      } else if (r.reason?.code === 'P2002') {
        already.push(validIds[i]);
      } else {
        failed.push(validIds[i]);
      }
    });

    const io = req.app.get('io');
    if (io && ok.length > 0) {
      ok.forEach(aprendizId => {
        io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
          aprendizId, presente: true, metodo: 'facial',
          timestamp: colombiaTime, tarde
        });
      });
    }

    res.json({ registered: ok, alreadyDone: already, failed });
  } catch (err) {
    res.status(500).json({ error: 'Error en lote: ' + err.message });
  }
};

// Registro manual por instructor
const registerManualAttendance = async (req, res) => {
  const { asistenciaId, aprendizId } = req.body;
  const instructorId = req.user.id;

  if (!asistenciaId || !aprendizId) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const session = await prisma.asistencia.findFirst({
      where: {
        id: asistenciaId,
        instructorId,
        activa: true
      },
      include: {
        resultado: {
          include: {
            competencia: {
              include: {
                ficha: {
                  include: {
                    aprendices: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o no activa' });
    }

    const isEnrolled = session.resultado.competencia.ficha.aprendices.some(a => a.id === aprendizId);
    if (!isEnrolled) {
      return res.status(403).json({ error: 'El aprendiz no pertenece a esta ficha' });
    }
    
    // Verificar que el aprendiz NO tenga este resultado evitado
    const tieneResultadoEvitado = await prisma.resultadoEvitado.findUnique({
      where: {
        aprendizId_resultadoId: {
          aprendizId,
          resultadoId: session.resultadoId
        }
      }
    });
    
    if (tieneResultadoEvitado) {
      return res.status(403).json({ error: 'Este aprendiz tiene este resultado evitado' });
    }

    const existing = await prisma.registroAsistencia.findFirst({
      where: {
        asistenciaId,
        aprendizId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'El aprendiz ya está registrado' });
    }

    const colombiaTime = await getCurrentColombiaTime();

    // Calcular tardanza
    const sessionStart = new Date(session.timestamp);
    const registerTime = new Date(colombiaTime);
    const diffMs = registerTime.getTime() - sessionStart.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const tarde = diffMins > (session.llegadaTarde || 15);

    const registro = await prisma.registroAsistencia.create({
      data: {
        presente: true,
        metodo: 'manual',
        timestamp: colombiaTime,
        tarde: tarde,
        asistencia: { connect: { id: asistenciaId } },
        aprendiz: { connect: { id: aprendizId } }
      },
      include: { 
        aprendiz: { 
          select: { 
            id: true,
            fullName: true, 
            document: true,
            email: true
          } 
        } 
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${asistenciaId}`).emit('nuevaAsistencia', {
        id: registro.id,
        aprendizId: registro.aprendizId,
        aprendiz: registro.aprendiz,
        presente: true,
        metodo: 'manual',
        timestamp: registro.timestamp,
        tarde: registro.tarde
      });
    }

    res.json({ message: 'Asistencia registrada manualmente', registro });
  } catch (err) {
    console.error('Error en registro manual:', err);
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { 
  createSession, 
  getSessionsByResultado, 
  getMyAttendance, 
  registerAttendance, 
  registerHardwareAttendance, 
  endSession, 
  getActiveSession, 
  getSessionById, 
  getMyActiveAnySession, 
  registerFacialAttendance, 
  registerFacialBatch, 
  registerManualAttendance, 
  checkAndCloseExpiredSessions 
};
