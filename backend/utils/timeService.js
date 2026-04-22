const axios = require('axios');

// Zona horaria de Colombia
const TIMEZONE = 'America/Bogota';

/**
 * Obtiene la fecha y hora actual de Colombia usando API externa
 * Fallback a hora del servidor si la API falla
 */
async function getCurrentColombiaTime() {
  try {
    // Usar WorldTimeAPI para obtener hora exacta de Colombia
    const response = await axios.get(`http://worldtimeapi.org/api/timezone/${TIMEZONE}`, {
      timeout: 3000
    });
    
    const colombiaTime = new Date(response.data.datetime);
    
    console.log(`[TimeService] Hora de Colombia obtenida: ${colombiaTime.toISOString()}`);
    return colombiaTime;
  } catch (error) {
    console.warn('[TimeService] Error obteniendo hora de API, usando hora del servidor:', error.message);
    
    // Fallback: usar hora del servidor ajustada a Colombia (UTC-5)
    const now = new Date();
    const colombiaOffset = -5 * 60; // Colombia es UTC-5
    const localOffset = now.getTimezoneOffset();
    const diff = colombiaOffset - localOffset;
    
    const colombiaTime = new Date(now.getTime() + diff * 60 * 1000);
    console.log(`[TimeService] Hora de Colombia (fallback): ${colombiaTime.toISOString()}`);
    return colombiaTime;
  }
}

/**
 * Obtiene solo la fecha actual de Colombia en formato YYYY-MM-DD
 */
async function getCurrentColombiaDate() {
  const time = await getCurrentColombiaTime();
  return time.toISOString().split('T')[0];
}

/**
 * Formatea una fecha a la zona horaria de Colombia
 */
function formatToColombiaTime(date) {
  return new Date(date).toLocaleString('es-CO', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

module.exports = {
  getCurrentColombiaTime,
  getCurrentColombiaDate,
  formatToColombiaTime,
  TIMEZONE
};
