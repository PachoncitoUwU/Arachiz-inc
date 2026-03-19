const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
};

export default fetchApi;
