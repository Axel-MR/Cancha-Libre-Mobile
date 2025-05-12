// utils/jwtHelper.js

/**
 * Decodifica un token JWT para extraer la información del payload
 * Esta función está diseñada para funcionar en React Native
 * 
 * @param {string} token - El token JWT completo
 * @returns {object|null} El payload decodificado o null si falla
 */
export const decodeJwt = (token) => {
    try {
      // Validar que el token tiene el formato correcto
      if (!token || typeof token !== 'string' || !token.includes('.')) {
        console.error('Token inválido o vacío');
        return null;
      }
  
      // Dividir el token en sus partes
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('El token no tiene el formato JWT estándar (header.payload.signature)');
        return null;
      }
  
      // Obtener la parte del payload (segunda parte)
      const base64Payload = tokenParts[1];
      
      // Reemplazar caracteres especiales para base64url a base64 estándar
      const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // En React Native, necesitamos una implementación personalizada de atob
      // ya que la implementación estándar puede no estar disponible
      const decodedData = decodeBase64(base64);
      
      // Convertir el JSON en un objeto
      const payload = JSON.parse(decodedData);
      return payload;
    } catch (error) {
      console.error('Error al decodificar el token JWT:', error);
      return null;
    }
  };
  
  /**
   * Decodifica una cadena base64 a texto
   * Compatible con React Native
   * 
   * @param {string} base64 - La cadena en base64 a decodificar
   * @returns {string} - La cadena decodificada
   */
  const decodeBase64 = (base64) => {
    try {
      // Si estamos en un entorno que tiene atob nativo (como web)
      if (typeof atob === 'function') {
        return atob(base64);
      }
      
      // Implementación alternativa para React Native
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      
      // Eliminar caracteres que no son base64
      base64 = String(base64).replace(/=+$/, '');
      
      if (base64.length % 4 === 1) {
        throw new Error('La cadena base64 tiene una longitud incorrecta');
      }
      
      for (let bc = 0, bs = 0, buffer, i = 0; 
           (buffer = base64.charAt(i++)); 
           ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, 
                      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      
      return output;
    } catch (error) {
      console.error('Error en la decodificación base64:', error);
      return '';
    }
  };
  
  /**
   * Extrae el ID de usuario de un token JWT
   * 
   * @param {string} token - El token JWT
   * @returns {string|null} - El ID del usuario o null si no se puede obtener
   */
  export const getUserIdFromToken = (token) => {
    const payload = decodeJwt(token);
    
    if (!payload) {
      return null;
    }
    
    // La propiedad puede ser 'userId', 'id' u otra según cómo esté configurado tu JWT
    return payload.userId || payload.id || payload.sub || null;
  };
  
  /**
   * Verifica si un token JWT ha expirado
   * 
   * @param {string} token - El token JWT a verificar
   * @returns {boolean} - true si el token ha expirado, false si aún es válido
   */
  export const isTokenExpired = (token) => {
    const payload = decodeJwt(token);
    
    if (!payload || !payload.exp) {
      // Si no tiene fecha de expiración o no se pudo decodificar, considerarlo expirado
      return true;
    }
    
    // La fecha de expiración en el token está en segundos, necesitamos convertirla a milisegundos
    const expirationDate = new Date(payload.exp * 1000);
    const currentDate = new Date();
    
    return currentDate > expirationDate;
  };
  
  /**
   * Ejemplo de uso:
   * 
   * import { getUserIdFromToken } from './utils/jwtHelper';
   * 
   * const fetchUserProfile = async () => {
   *   const token = await SecureStore.getItemAsync('userToken');
   *   const userId = getUserIdFromToken(token);
   *   
   *   if (!userId) {
   *     throw new Error('No se pudo obtener el ID del usuario');
   *   }
   *   
   *   // Ahora puedes usar userId para tus peticiones
   *   const response = await api.get(`/usuarios/${userId}`);
   * };
   */