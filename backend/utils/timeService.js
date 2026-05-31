const axios = require('axios');

// Zona horaria de Colombia
const TIMEZONE = 'America/Bogota';

/**
 * Obtiene la fecha y hora actual de Colombia usando API externa
 * Fallback a hora del servidor si la API falla
 */
async function getCurrentColombiaTime() {
  return new Date();
}

/**
 * Obtiene solo la fecha actual de Colombia en formato YYYY-MM-DD
 */
async function getCurrentColombiaDate() {
  const options = { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('fr-CA', options);
  return formatter.format(new Date());
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
