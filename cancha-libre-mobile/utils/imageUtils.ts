/**
 * Utilidades para el manejo de imágenes en la aplicación
 */

// URL base del servidor para desarrollo local
const LOCAL_SERVER_URL = 'http://192.168.100.13:3000';

// URL alternativa para cuando la principal falla
const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';

/**
 * Normaliza una URL de imagen para asegurar que sea accesible
 * @param url URL original de la imagen
 * @returns URL normalizada
 */
export const normalizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // Si es una imagen base64, devolverla tal cual
  if (url.startsWith('data:image/')) {
    return url;
  }
  
  // Si ya es una URL completa, asegurarse de que use HTTP para desarrollo local
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Si es una URL del servidor local, asegurarse de que use HTTP
    if (url.includes('192.168.100.13:3000')) {
      return url.replace('https://', 'http://');
    }
    return url;
  }
  
  // Si es una ruta relativa, construir la URL completa
  return `${LOCAL_SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Obtiene una URL de imagen de respaldo cuando la original falla
 * @param originalUrl URL original que falló
 * @returns URL de imagen de respaldo
 */
export const getFallbackImageUrl = (originalUrl: string | null | undefined): string => {
  if (!originalUrl) return FALLBACK_IMAGE_URL;
  
  // Extraer información de la URL original para personalizar la imagen de respaldo
  let type = 'imagen';
  
  if (originalUrl.includes('canchas')) {
    type = 'cancha';
  } else if (originalUrl.includes('centros-deportivos')) {
    type = 'centro+deportivo';
  }
  
  return `https://via.placeholder.com/300x200?text=${type}`;
};

/**
 * Verifica si una URL es válida
 * @param url URL a verificar
 * @returns true si la URL es válida, false en caso contrario
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
};

/**
 * Configura opciones para la carga de imágenes en React Native
 * @returns Objeto con opciones para la carga de imágenes
 */
export const getImageLoadingOptions = () => {
  return {
    // Deshabilitar caché para desarrollo
    cache: 'reload' as const,
    // Permitir solicitudes no seguras (HTTP) en desarrollo
    headers: {
      'Cache-Control': 'no-cache'
    }
  };
};

/**
 * Obtiene la fuente de imagen adecuada, priorizando base64 si está disponible
 * @param item Objeto que puede contener imagenUrl y/o imagenBase64
 * @returns Objeto fuente para el componente Image
 */
export const getImageSource = (item: any) => {
  // Si hay una versión base64 disponible, usarla primero
  if (item?.imagenBase64) {
    return { uri: item.imagenBase64 };
  }
  
  // Si no hay base64 pero hay URL, normalizar y usar la URL
  if (item?.imagenUrl) {
    return { uri: normalizeImageUrl(item.imagenUrl) };
  }
  
  // Si no hay imagen, usar una imagen de respaldo
  return { uri: getFallbackImageUrl(null) };
};

/**
 * Convierte una imagen a base64 a partir de una URL
 * @param url URL de la imagen
 * @returns Promesa que resuelve a la imagen en formato base64
 */
export const convertImageToBase64 = async (url: string): Promise<string | null> => {
  try {
    // Si ya es base64, devolverla tal cual
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // Normalizar la URL
    const normalizedUrl = normalizeImageUrl(url);
    if (!normalizedUrl) return null;
    
    // Usar fetch para obtener la imagen
    const response = await fetch(normalizedUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = () => {
        reject(new Error('Error al convertir imagen a base64'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error al convertir imagen a base64:', error);
    return null;
  }
};

/**
 * Comprueba si una imagen es accesible
 * @param url URL de la imagen
 * @returns Promesa que resuelve a true si la imagen es accesible, false en caso contrario
 */
export const isImageAccessible = async (url: string): Promise<boolean> => {
  try {
    const normalizedUrl = normalizeImageUrl(url);
    if (!normalizedUrl) return false;
    
    const response = await fetch(normalizedUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error al verificar accesibilidad de imagen:', error);
    return false;
  }
};