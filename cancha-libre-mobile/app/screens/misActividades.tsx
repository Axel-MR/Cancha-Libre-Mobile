import React, { useState, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter } from "expo-router";
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";

// Componentes
import ScreenHeader from '../../components/reservations/ScreenHeader';
import ReservationCard from '../../components/reservations/ReservationCard';
import ReservationDetailModal from '../../components/reservations/ReservationDetailModal';
import LoadingState from '../../components/reservations/LoadingState';
import EmptyState from '../../components/reservations/EmptyState';
import InfoBanner from '../../components/reservations/InfoBanner';
import { commonStyles } from '../../components/reservations/CommonStyles';
import authService from "../../services/authService";
import { normalizeImageUrl } from "../../utils/imageUtils"; // Importar la función de normalización

const MisActividades = () => {
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centrosDeportivos, setCentrosDeportivos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userRatings, setUserRatings] = useState({}); // Para almacenar las calificaciones del usuario
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [imageErrors, setImageErrors] = useState({}); // Para rastrear errores de carga de imágenes

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      setIsAuthChecking(true);
      try {
        // Verificar si hay un token válido
        const authResult = await authService.verifyToken();
        
        if (!authResult.success) {
          console.log("Sesión no válida, redirigiendo al login...");
          router.replace("/screens/login");
          return;
        }
        
        // Si la autenticación es exitosa, establecer el ID del usuario y cargar datos
        const id = authResult.user.id;
        setUserId(id);
        await fetchData(id);
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        Alert.alert(
          "Error de autenticación",
          "No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => router.replace("/screens/login") }]
        );
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    checkAuthAndLoadData();
  }, []);

  // Obtener el ID del usuario del token
  const getUserIdFromToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const tokenParts = token.split('.');
      if (tokenParts.length > 1) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload && payload.userId) {
          setUserId(payload.userId);
          return payload.userId;
        }
      }
      throw new Error("No se pudo obtener el ID del usuario");
    } catch (error) {
      console.error("Error al obtener ID del usuario:", error);
      return null;
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    const initData = async () => {
      const id = await getUserIdFromToken();
      if (id) {
        fetchData(id);
      }
    };
    
    initData();
  }, []);

  const fetchData = async (id) => {
    setIsLoading(true);
    try {
      // Ya no necesitamos obtener el token manualmente
      // El interceptor en api.js lo añadirá automáticamente a todas las solicitudes

      // Cargar centros deportivos
      const centrosResponse = await api.get('/centros-deportivos');
      if (centrosResponse.data && centrosResponse.data.data) {
        // Normalizar URLs de imágenes en los centros deportivos
        const centrosNormalizados = centrosResponse.data.data.map(centro => ({
          ...centro,
          _originalImagenUrl: centro.imagenUrl, // Guardar URL original para depuración
          imagenUrl: normalizeImageUrl(centro.imagenUrl) // Normalizar URL
        }));
        setCentrosDeportivos(centrosNormalizados);
      }

      // Cargar canchas
      const canchasResponse = await api.get('/canchas');
      if (canchasResponse.data && canchasResponse.data.data) {
        // Normalizar URLs de imágenes en las canchas
        const canchasNormalizadas = canchasResponse.data.data.map(cancha => ({
          ...cancha,
          _originalImagenUrl: cancha.imagenUrl, // Guardar URL original para depuración
          imagenUrl: normalizeImageUrl(cancha.imagenUrl) // Normalizar URL
        }));
        setCanchas(canchasNormalizadas);
      }

      // Cargar todas las reservas del usuario
      const reservasResponse = await api.get('/reservas');
      
      if (reservasResponse.data && reservasResponse.data.data) {
        // Filtrar reservas del usuario actual y que sean anteriores a hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const reservasUsuario = reservasResponse.data.data.filter(reserva => 
          reserva.reservadorId === id && 
          new Date(reserva.fecha) < hoy
        );
        
        // Convertir las fechas de string a objetos Date
        const reservasConFechas = reservasUsuario.map(reserva => ({
          ...reserva,
          fecha: new Date(reserva.fecha),
          horaInicio: new Date(reserva.horaInicio),
          horaFin: new Date(reserva.horaFin)
        }));
        
        // Ordenar por fecha (más reciente primero)
        reservasConFechas.sort((a, b) => b.fecha - a.fecha);
        
        setMisReservas(reservasConFechas);
      } else {
        setMisReservas([]);
      }

      // Cargar calificaciones del usuario
      await fetchUserRatings();
      
      // Resetear errores de imágenes
      setImageErrors({});
    } catch (error) {
      console.error("Error al cargar datos:", error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = "Error al cargar los datos";
      
      if (error.response) {
        // Error de respuesta del servidor
        if (error.response.status === 401) {
          errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente";
          
          // Intentar renovar el token automáticamente (esto lo manejará el interceptor)
          // Si falla, redirigir al login
          router.replace("/screens/login");
          return;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // Error de red (no se recibió respuesta)
        errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión a internet";
      } else if (error.message) {
        // Error específico
        errorMessage = error.message;
      }
      
      Alert.alert(
        "Error", 
        errorMessage,
        [{ text: "OK" }]
      );
      
      setMisReservas([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Función fetchUserRatings mejorada
  const fetchUserRatings = async () => {
    try {
      // El interceptor añadirá el token automáticamente
      const response = await api.get('/calificaciones/usuario');

      if (response.data && response.data.success) {
        // Crear un objeto con las calificaciones del usuario por canchaId
        const ratings = {};
        
        // Verificar que data es un array antes de iterarlo
        if (Array.isArray(response.data.data)) {
          response.data.data.forEach(rating => {
            ratings[rating.canchaId] = rating.valor;
          });
        }
        
        setUserRatings(ratings);
      }
    } catch (error) {
      console.error("Error al cargar calificaciones del usuario:", error);
      
      // Manejar diferentes tipos de errores
      if (error.response) {
        if (error.response.status === 404) {
          // Si el endpoint no existe o no hay calificaciones, simplemente establecer un objeto vacío
          setUserRatings({});
        } else if (error.response.status !== 401) {
          // No mostrar alerta para errores 401 (ya se maneja en el interceptor)
          // y tampoco para 404 (es un caso esperado)
          console.log(`Error ${error.response.status} al cargar calificaciones`);
        }
      } else {
        // Para otros errores, no mostrar alerta para no interrumpir la experiencia
        console.log("Error al cargar calificaciones:", error.message);
      }
    }
  };

  // Función para calificar una cancha
  const handleRateCancha = async (canchaId, rating) => {
    try {
      setIsSubmittingRating(true);
      
      // No necesitamos obtener el token manualmente ni verificarlo
      // El interceptor de API se encargará de añadir el token y manejar errores de autenticación
      
      const response = await api.post(`/calificaciones/cancha/${canchaId}`, { 
        valor: rating 
      });

      if (response.data && response.data.success) {
        // Actualizar la calificación en el estado local
        setUserRatings(prev => ({
          ...prev,
          [canchaId]: rating
        }));

        // Actualizar la calificación promedio en la cancha
        setCanchas(prevCanchas => 
          prevCanchas.map(cancha => 
            cancha.id === canchaId 
              ? { 
                  ...cancha, 
                  calificacionPromedio: response.data.data.promedio,
                  totalCalificaciones: response.data.data.total
                } 
              : cancha
          )
        );

        Alert.alert(
          "Calificación enviada",
          "¡Gracias por calificar esta cancha!",
          [{ text: "OK" }]
        );
      } else {
        throw new Error("No se pudo enviar la calificación");
      }
    } catch (error) {
      console.error("Error al calificar cancha:", error);
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [{ 
            text: "OK", 
            onPress: () => {
              // Limpiar tokens y redirigir al login
              SecureStore.deleteItemAsync("userToken");
              router.replace("/screens/login");
            } 
          }]
        );
      } else {
        Alert.alert(
          "Error",
          "No se pudo enviar tu calificación. Inténtalo de nuevo más tarde.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (userId) {
      fetchData(userId);
    } else {
      setRefreshing(false);
    }
  };

  const verDetalleReserva = (reservaId) => {
    const reserva = misReservas.find(r => r.id === reservaId);
    if (reserva) {
      setSelectedReserva(reserva);
      setModalVisible(true);
    }
  };

  const getDeporteCancha = (id) => {
    const cancha = canchas.find(c => c.id === id);
    return cancha ? cancha.deporte : 'Desconocido';
  };

  const getNombreCancha = (id) => {
    const cancha = canchas.find(c => c.id === id);
    return cancha ? cancha.nombre : 'Desconocida';
  };

  const getNombreCentroDeportivo = (id) => {
    const centro = centrosDeportivos.find(c => c.id === id);
    return centro ? centro.nombre : 'Desconocido';
  };

  // Función para obtener la calificación promedio de una cancha
  const getCalificacionCancha = (id) => {
    const cancha = canchas.find(c => c.id === id);
    return cancha ? {
      promedio: cancha.calificacionPromedio || 0,
      total: cancha.totalCalificaciones || 0
    } : { promedio: 0, total: 0 };
  };

  // Función para obtener la calificación del usuario para una cancha
  const getUserRating = (canchaId) => {
    return userRatings[canchaId] || 0;
  };

  // Función para manejar errores de carga de imágenes
  const handleImageError = (id, type) => {
    console.log(`[MisActividades] Error al cargar imagen de ${type} ID: ${id}`);
    setImageErrors(prev => ({
      ...prev,
      [`${type}_${id}`]: true
    }));
  };

  // Función para obtener la URL de la imagen del centro deportivo (usando normalizeImageUrl)
  const getImagenCentroDeportivo = (id) => {
    const centro = centrosDeportivos.find(c => c.id === id);
    
    // Si no hay centro o no tiene URL de imagen, retornar null
    if (!centro || !centro.imagenUrl) {
      return null;
    }
    
    // La URL ya debería estar normalizada desde fetchData
    return centro.imagenUrl;
  };

  // Función para obtener la URL de la imagen de la cancha (usando normalizeImageUrl)
  const getImagenCancha = (id) => {
    const cancha = canchas.find(c => c.id === id);
    
    if (!cancha || !cancha.imagenUrl) {
      return null;
    }
    
    // La URL ya debería estar normalizada desde fetchData
    return cancha.imagenUrl;
  };

  // Calcular si la actividad fue hace poco (menos de 7 días)
  const esReciente = (fecha) => {
    const hoy = new Date();
    const fechaReserva = new Date(fecha);
    const diasDiferencia = Math.floor((hoy - fechaReserva) / (1000 * 60 * 60 * 24));
    return diasDiferencia < 7;
  };

  // Verificar si el usuario ya ha calificado una cancha
  const haCalificadoCancha = (canchaId) => {
    return userRatings[canchaId] > 0;
  };

  // Verificar si hay error de carga para una imagen
  const hasImageError = (id, type) => {
    return !!imageErrors[`${type}_${id}`];
  };

  if (isAuthChecking || isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <LoadingState 
          message={isAuthChecking ? "Verificando sesión..." : "Cargando historial de actividades..."} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScreenHeader 
        title="Historial de Actividades"
      />
      
      <View style={commonStyles.content}>
        <InfoBanner 
          title="Tu historial deportivo"
          description="Aquí puedes ver todas las actividades deportivas a las que has asistido en el pasado. Califica las canchas para ayudar a otros usuarios a elegir."
          icon="fitness"
          iconColor="#4CAF50"
          backgroundColor="#E8F5E9"
        />
        
        <FlatList
          data={misReservas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const imagenCancha = getImagenCancha(item.canchaId);
            const imagenCentro = getImagenCentroDeportivo(item.centroDeportivoId);
            const calificacion = getCalificacionCancha(item.canchaId);
            const userRating = getUserRating(item.canchaId);
            
            // Determinar si mostrar badge de calificación
            let badge;
            if (userRating > 0) {
              badge = { 
                text: `Tu calificación: ${userRating}★`, 
                color: '#FF9800' 
              };
            } else if (esReciente(item.fecha)) {
              badge = { 
                text: 'Reciente', 
                color: '#4CAF50' 
              };
            }
            
            // Determinar qué imagen usar (cancha o centro) y si hay error
            const useImagenCancha = !!imagenCancha && !hasImageError(item.canchaId, 'cancha');
            const useImagenCentro = !!imagenCentro && !hasImageError(item.centroDeportivoId, 'centro');
            const finalImagenUrl = useImagenCancha ? imagenCancha : (useImagenCentro ? imagenCentro : null);
            
            return (
              <ReservationCard
                id={item.id}
                fecha={item.fecha}
                horaInicio={item.horaInicio}
                horaFin={item.horaFin}
                deporte={getDeporteCancha(item.canchaId)}
                centroDeportivo={getNombreCentroDeportivo(item.centroDeportivoId)}
                cancha={getNombreCancha(item.canchaId)}
                canchaId={item.canchaId}
                estado={item.estado === 'RESERVADO' ? 'Completada' : item.estado}
                imagenUrl={finalImagenUrl}
                badge={badge}
                borderColor={userRating > 0 ? '#FF9800' : (esReciente(item.fecha) ? '#4CAF50' : undefined)}
                calificacionPromedio={calificacion.promedio}
                totalCalificaciones={calificacion.total}
                onPress={verDetalleReserva}
                onImageError={() => {
                  // Si estamos usando la imagen de la cancha y falla, intentar con la del centro
                  if (useImagenCancha) {
                    handleImageError(item.canchaId, 'cancha');
                  } else if (useImagenCentro) {
                    handleImageError(item.centroDeportivoId, 'centro');
                  }
                }}
              />
            );
          }}
          contentContainerStyle={commonStyles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196F3"]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="fitness-outline"
              title="No tienes actividades pasadas"
              message="Cuando reserves y uses canchas, aparecerán aquí"
            />
          }
        />
      </View>
      
      {selectedReserva && (
        <ReservationDetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reservation={selectedReserva}
          centroDeportivo={centrosDeportivos.find(c => c.id === selectedReserva.centroDeportivoId)}
          cancha={canchas.find(c => c.id === selectedReserva.canchaId)}
          title="Detalle de Actividad"
          // Añadir props para calificaciones
          userRating={getUserRating(selectedReserva.canchaId)}
          onRateCancha={handleRateCancha}
          isRatingEnabled={true} // Siempre permitir calificar en actividades pasadas
          isSubmittingRating={isSubmittingRating}
          actions={{
            primary: haCalificadoCancha(selectedReserva.canchaId) ? undefined : {
              text: "Calificar Cancha",
              onPress: () => {}, // No es necesario, se maneja con el componente de calificación
              color: "#FF9800"
            },
            secondary: {
              text: "Cerrar",
              onPress: () => setModalVisible(false)
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default MisActividades;