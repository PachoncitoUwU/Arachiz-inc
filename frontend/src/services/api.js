const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiCache = new Map();

const fetchApi = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const isGet = method.toUpperCase() === 'GET';

  if (isGet && apiCache.has(endpoint)) {
    const cached = apiCache.get(endpoint);
    // Usar caché por 5 minutos para que la navegación entre vistas sea rápida
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
  } else if (!isGet) {
    // Limpiar caché cuando hay operaciones de escritura para mantener la info actualizada
    apiCache.clear();
  }

  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();

  // Si es 401, no cerrar sesión automáticamente, solo lanzar el error
  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }
  
  if (isGet) {
    apiCache.set(endpoint, { data, timestamp: Date.now() });
  }

  return data;
};

export default fetchApi;
