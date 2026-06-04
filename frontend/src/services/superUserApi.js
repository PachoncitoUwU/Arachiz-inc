import fetchApi from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetchBlob = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error('Error al descargar archivo');
  return response.blob();
};

const buildQuery = (params) => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.append(key, params[key]);
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
};

export const superUserApi = {
  // Dashboard
  getDashboard: () => fetchApi('/super-usuario/dashboard'),
  
  // Usuarios
  getAllUsers: (filters) => fetchApi(`/super-usuario/usuarios${buildQuery(filters)}`),
  getUserDetail: (id) => fetchApi(`/super-usuario/usuarios/${id}`),
  updateUser: (id, data) => fetchApi(`/super-usuario/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  changeUserType: (id, userType) => fetchApi(`/super-usuario/usuarios/${id}/tipo`, { method: 'PUT', body: JSON.stringify({ userType }) }),
  resetUserPassword: (id) => fetchApi(`/super-usuario/usuarios/${id}/resetear-password`, { method: 'POST' }),
  toggleUserStatus: (id) => fetchApi(`/super-usuario/usuarios/${id}/toggle-status`, { method: 'PUT' }),
  deleteUserPermanently: (id) => fetchApi(`/super-usuario/usuarios/${id}`, { method: 'DELETE' }),
  getUserHistory: (id) => fetchApi(`/super-usuario/usuarios/${id}/historial`),
  
  // Fichas
  getAllFichas: () => fetchApi('/super-usuario/fichas'),
  getFichaDetail: (id) => fetchApi(`/super-usuario/fichas/${id}`),
  createFicha: (data) => fetchApi('/super-usuario/fichas', { method: 'POST', body: JSON.stringify(data) }),
  updateFicha: (id, data) => fetchApi(`/super-usuario/fichas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFicha: (id) => fetchApi(`/super-usuario/fichas/${id}`, { method: 'DELETE' }),
  deleteFichaPermanently: (id) => fetchApi(`/super-usuario/fichas/${id}/permanente`, { method: 'DELETE' }),
  
  // Materias
  getAllMaterias: () => fetchApi('/super-usuario/materias'),
  getMateriaDetail: (id) => fetchApi(`/super-usuario/materias/${id}`),
  createMateria: (data) => fetchApi('/super-usuario/materias', { method: 'POST', body: JSON.stringify(data) }),
  updateMateria: (id, data) => fetchApi(`/super-usuario/materias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  changeInstructorMateria: (id, instructorId) => fetchApi(`/super-usuario/materias/${id}/instructor`, { method: 'PUT', body: JSON.stringify({ nuevoInstructorId: instructorId }) }),
  deleteMateria: (id) => fetchApi(`/super-usuario/materias/${id}`, { method: 'DELETE' }),
  deleteMateriaPermanently: (id) => fetchApi(`/super-usuario/materias/${id}/permanente`, { method: 'DELETE' }),
  
  // Database
  getAllTables: () => fetchApi('/super-usuario/database/tables'),
  getTableData: (tableName, page, limit) => fetchApi(`/super-usuario/database/tables/${tableName}?page=${page}&limit=${limit}`),
  createRecord: (tableName, data) => fetchApi(`/super-usuario/database/tables/${tableName}`, { method: 'POST', body: JSON.stringify(data) }),
  updateRecord: (tableName, id, data) => fetchApi(`/super-usuario/database/tables/${tableName}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecord: (tableName, id) => fetchApi(`/super-usuario/database/tables/${tableName}/${id}`, { method: 'DELETE' }),
  exportTableToExcel: (tableName) => fetchBlob(`/super-usuario/database/tables/${tableName}/export`),
  
  // Excusas
  getAllExcusas: (filters) => fetchApi(`/super-usuario/excusas${buildQuery(filters)}`),
  approveExcusa: (id, respuesta) => fetchApi(`/super-usuario/excusas/${id}/aprobar`, { method: 'POST', body: JSON.stringify({ respuesta }) }),
  rejectExcusa: (id, respuesta) => fetchApi(`/super-usuario/excusas/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ respuesta }) }),
  deleteExcusa: (id) => fetchApi(`/super-usuario/excusas/${id}`, { method: 'DELETE' }),
  
  // Backup
  createBackup: () => fetchBlob('/super-usuario/backup', { method: 'POST' }),
  
  // Logs
  getLogs: (filters) => fetchApi(`/super-usuario/logs${buildQuery(filters)}`),
  getLogDetail: (id) => fetchApi(`/super-usuario/logs/${id}`),
  
  // Super Usuarios
  getAllSuperUsers: () => fetchApi('/super-usuario/super-usuarios'),
  createSuperUser: (data) => fetchApi('/super-usuario/super-usuarios', { method: 'POST', body: JSON.stringify(data) }),
  toggleSuperUserStatus: (id) => fetchApi(`/super-usuario/super-usuarios/${id}/toggle-status`, { method: 'PUT' }),
  resetSuperUserPassword: (id) => fetchApi(`/super-usuario/super-usuarios/${id}/resetear-password`, { method: 'POST' }),
  
  // Estadísticas
  getStatistics: () => fetchApi('/super-usuario/estadisticas'),
};
