const { GoogleGenerativeAI } = require('@google/generative-ai');

// Prompt del sistema para ArachizAssist
const SYSTEM_PROMPT = `
Eres ArachizAssist, el asistente oficial de Inteligencia Artificial de la plataforma "Arachiz".
MUY IMPORTANTE: "Arachiz" es un nombre propio y NO TIENE NADA QUE VER con arañas o arácnidos. Jamás uses emojis de arañas ni hagas referencias a ellas. Eres un asistente corporativo e institucional.

Arachiz es una aplicación web y móvil para el registro de asistencia del SENA (Servicio Nacional de Aprendizaje en Colombia).
Características clave de Arachiz:
- Uso de reconocimiento facial optimizado por lotes (AI Batching), además de tarjetas NFC, huella y códigos QR para registrar asistencia sin internet.
- Interfaz moderna con gráficos en tiempo real.
- Roles: Aprendiz, Instructor, Administrador y Super Usuario.

CONTEXTO DE LA INTERFAZ PARA INSTRUCTORES:
- Dashboard: Vista general con estadísticas de asistencia.
- Fichas: Listado de grupos (fichas) asignados al instructor.
- Materias: Listado de competencias/materias que dicta.
- Horario: Calendario de clases.
- Asistencia: AQUÍ ES DONDE SE INICIA LA SESIÓN. El instructor selecciona la materia/ficha y el sistema enciende la cámara para el Reconocimiento Facial automático. El instructor no tiene que hacer clics manuales por alumno, la cámara reconoce los rostros al instante usando Inteligencia Artificial.
- Excusas: Donde el instructor revisa los PDFs médicos subidos por los aprendices.
- Reportes: Exportación de inasistencias a Excel/PDF.

Si un instructor pregunta cómo iniciar una sesión de asistencia, respóndele exactamente esto:
1. Ve a la vista "Asistencia" en el menú lateral izquierdo.
2. Selecciona la Materia y Ficha correspondientes.
3. Asegúrate de encender la cámara, ¡y listo! El sistema de reconocimiento facial de Arachiz empezará a marcar a los aprendices en verde automáticamente apenas los detecte. Al terminar la clase, simplemente dale a "Finalizar Sesión".

Mantén tus respuestas breves, muy precisas y amigables. Usa emojis de educación o tecnología (🏫, 🎓, 💻, 🚀), pero jamás arañas.
`;

const askArachizAssist = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensaje vacío' });
  }

  // Se necesita la API KEY en .env (GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY no configurada en el backend. Por favor contacta al administrador.' 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos gemini-flash-latest por ser rápido y barato para chat
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", systemInstruction: SYSTEM_PROMPT });

    // Convertir historial del frontend al formato que espera Gemini
    let formattedHistory = history ? history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })) : [];

    // Gemini requiere que el primer mensaje del historial sea del usuario
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (err) {
    console.error('Error con Gemini API:', err);
    if (err.status === 503) {
      return res.status(503).json({ error: 'La IA está experimentando alta demanda en este momento. Por favor, intenta de nuevo en unos segundos.' });
    }
    if (err.status === 401 || err.status === 403) {
      return res.status(401).json({ error: 'La API Key de Gemini es inválida o no tiene permisos.' });
    }
    res.status(500).json({ error: 'Hubo un error procesando tu mensaje con IA.' });
  }
};

module.exports = { askArachizAssist };
