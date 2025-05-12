import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Configuración base de la API
const api = axios.create({
  baseURL: 'http://192.168.100.13:3000/api', // Ajusta esto a tu URL de API
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a todas las solicitudes
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error al obtener token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (Unauthorized), podríamos manejar la redirección al login aquí
    if (error.response && error.response.status === 401) {
      console.log('Sesión expirada o token inválido');
      // La redirección se maneja en el componente
    }
    return Promise.reject(error);
  }
);

export default api;