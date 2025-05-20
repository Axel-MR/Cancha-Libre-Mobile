import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Crear instancia de axios
const api = axios.create({
  baseURL: 'http://192.168.0.178:3000/api', 
  timeout: 10000,
});

// Variable para controlar si estamos en proceso de renovar el token
let isRefreshing = false;
let failedQueue = [];

// Función para procesar la cola de solicitudes fallidas
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor para añadir token a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      // No añadir token para login o registro
      if (config.url.includes('/auth/login') || config.url.includes('/auth/registro')) {
        return config;
      }
      
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error en interceptor de request:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si el error no es 401 o ya intentamos renovar el token, rechazar
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Marcar que ya intentamos renovar el token para esta solicitud
    originalRequest._retry = true;
    
    // Si ya estamos renovando el token, añadir esta solicitud a la cola
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axios(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
    
    isRefreshing = true;
    
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      // Si no hay refresh token, rechazar y limpiar
      if (!refreshToken) {
        console.log('No hay refresh token disponible');
        await SecureStore.deleteItemAsync('userToken');
        processQueue(new Error('No refresh token available'));
        return Promise.reject(error);
      }
      
      // Intentar renovar el token
      const response = await axios.post(
        'http://192.168.100.13:3000/api/auth/renovar-token',
        { refreshToken }
      );
      
      if (response.data && response.data.success) {
        const newToken = response.data.token;
        
        // Guardar el nuevo token
        await SecureStore.setItemAsync('userToken', newToken);
        
        // Actualizar el header de autorización para todas las solicitudes
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Actualizar el header de la solicitud original
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Procesar la cola con el nuevo token
        processQueue(null, newToken);
        
        // Reintentar la solicitud original
        return axios(originalRequest);
      } else {
        // Si la renovación falla, limpiar tokens y rechazar
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        processQueue(new Error('Failed to refresh token'));
        return Promise.reject(error);
      }
    } catch (refreshError) {
      // Si hay un error al renovar, limpiar tokens y rechazar
      console.error('Error al renovar token:', refreshError);
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('refreshToken');
      processQueue(refreshError);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;