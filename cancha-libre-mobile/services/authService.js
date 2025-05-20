import * as SecureStore from 'expo-secure-store';
import api from './api';

// Claves para almacenar tokens
const TOKEN_KEY = 'userToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Servicio de autenticación
const authService = {
  // Guardar tokens después del login
  setTokens: async (token, refreshToken = null) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
      // Configurar el token en el header por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      console.error('Error al guardar tokens:', error);
      return false;
    }
  },

  // Obtener el token actual
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  },

  // Intentar renovar el token si ha expirado
  refreshToken: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await api.post('/auth/renovar-token', { refreshToken });
      
      if (response.data && response.data.success) {
        await authService.setTokens(response.data.token, refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al renovar token:', error);
      return false;
    }
  },

  // Cerrar sesión
  logout: async () => {
    try {
      // Limpiar tokens almacenados
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      
      // Limpiar header de autorización
      delete api.defaults.headers.common['Authorization'];
      
      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return false;
    }
  },

  // Iniciar sesión
  login: async (correo, clave) => {
    try {
      const response = await api.post('/auth/login', { correo, clave });
      
      if (response.data && response.data.success) {
        await authService.setTokens(response.data.token);
        return {
          success: true,
          user: response.data.usuario
        };
      }
      
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  },

  // Verificar token actual
  verifyToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        return { success: false, error: 'No hay token' };
      }

      // Configurar el token en el header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // IMPORTANTE: Usar la ruta correcta - verificar en español, no verify en inglés
      const response = await api.get('/auth/verificar');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          user: response.data.usuario
        };
      }
      
      return { success: false, error: 'Token inválido' };
    } catch (error) {
      console.error('Error al verificar token:', error);
      
      // Si el error es 401, intentar renovar el token
      if (error.response?.status === 401) {
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          return await authService.verifyToken(); // Intentar verificar de nuevo
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.error || 'Error al verificar token'
      };
    }
  }
};

export default authService;