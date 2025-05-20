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
import { normalizeImageUrl } from "../../utils/imageUtils"; // Importar la función de normalización

const MisReservas = () => {
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
  const [imageErrors, setImageErrors] = useState({}); // Para rastrear errores de carga de imágenes

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
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

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
        // Filtrar reservas del usuario actual y que sean de hoy o futuras
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const reservasUsuario = reservasResponse.data.data.filter(reserva => 
          reserva.reservadorId === id && 
          new Date(reserva.fecha) >= hoy
        );
        
        // Convertir las fechas de string a objetos Date
        const reservasConFechas = reservasUsuario.map(reserva => ({
          ...reserva,
          fecha: new Date(reserva.fecha),
          horaInicio: new Date(reserva.horaInicio),
          horaFin: new Date(reserva.horaFin)
        }));
        
        // Ordenar por fecha (más cercana primero)
        reservasConFechas.sort((a, b) => a.fecha - b.fecha);
        
        setMisReservas(reservasConFechas);
      } else {
        setMisReservas([]);
      }

      // Cargar calificaciones del usuario
      await fetchUserRatings(token);
      
      // Resetear errores de imágenes
      setImageErrors({});
    } catch (error) {
      console.error("Error al cargar datos:", error);
      let errorMessage = "Error al cargar los datos";
      if (error.response?.status === 401) {
        errorMessage = "No autorizado. Por favor inicia sesión nuevamente";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
      
      setMisReservas([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Función para cargar las calificaciones del usuario
  const fetchUserRatings = async (token) => {
    try {
      // Obtener todas las canchas que el usuario ha calificado
      const response = await api.get('/calificaciones/usuario', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        // Crear un objeto con las calificaciones del usuario por canchaId
        const ratings = {};
        response.data.data.forEach(rating => {
          ratings[rating.canchaId] = rating.valor;
        });
        setUserRatings(ratings);
      }
    } catch (error) {
      console.error("Error al cargar calificaciones del usuario:", error);
      // No mostrar alerta para no interrumpir la experiencia del usuario
    }
  };

  // Función para calificar una cancha
  const handleRateCancha = async (canchaId, rating) => {
    try {
      setIsSubmittingRating(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const response = await api.post(`/calificaciones/cancha/${canchaId}`, 
        { valor: rating },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

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
      Alert.alert(
        "Error",
        "No se pudo enviar tu calificación. Inténtalo de nuevo más tarde.",
        [{ text: "OK" }]
      );
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
    console.log(`[MisReservas] Error al cargar imagen de ${type} ID: ${id}`);
    setImageErrors(prev => ({
      ...prev,
      [`${type}_${id}`]: true
    }));
  };

  // Verificar si hay error de carga para una imagen
  const hasImageError = (id, type) => {
    return !!imageErrors[`${type}_${id}`];
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

  // Función para cancelar una reserva
  const handleCancelarReserva = async (reservaId) => {
    try {
      Alert.alert(
        "Cancelar Reserva",
        "¿Estás seguro de que deseas cancelar esta reserva?",
        [
          {
            text: "No",
            style: "cancel"
          },
          {
            text: "Sí, cancelar",
            onPress: async () => {
              try {
                const response = await api.put(`/reservas/${reservaId}`, {
                  estado: 'CANCELADO'
                });

                if (response.data && response.data.success) {
                  Alert.alert(
                    "Reserva cancelada",
                    "La reserva ha sido cancelada correctamente.",
                    [
                      { 
                        text: "OK", 
                        onPress: () => {
                          setModalVisible(false);
                          // Actualizar la lista de reservas
                          if (userId) {
                            fetchData(userId);
                          }
                        } 
                      }
                    ]
                  );
                } else {
                  throw new Error("No se pudo cancelar la reserva");
                }
              } catch (error) {
                console.error("Error al cancelar reserva:", error);
                Alert.alert("Error", "No se pudo cancelar la reserva: " + (error.message || "Error desconocido"));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al mostrar alerta:", error);
      Alert.alert("Error", "Ocurrió un error al intentar cancelar la reserva");
    }
  };

  // Función para verificar si una reserva es para hoy
  const esReservaHoy = (fecha) => {
    const hoy = new Date();
    const fechaReserva = new Date(fecha);
    
    return (
      fechaReserva.getDate() === hoy.getDate() &&
      fechaReserva.getMonth() === hoy.getMonth() &&
      fechaReserva.getFullYear() === hoy.getFullYear()
    );
  };

  // Función para verificar si una reserva es para mañana
  const esReservaMañana = (fecha) => {
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    
    const fechaReserva = new Date(fecha);
    
    return (
      fechaReserva.getDate() === mañana.getDate() &&
      fechaReserva.getMonth() === mañana.getMonth() &&
      fechaReserva.getFullYear() === mañana.getFullYear()
    );
  };

  // Función para verificar si una reserva ya pasó (para habilitar calificaciones)
  const esReservaPasada = (fecha) => {
    const hoy = new Date();
    const fechaReserva = new Date(fecha);
    fechaReserva.setHours(23, 59, 59); // Final del día
    
    return fechaReserva < hoy;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <LoadingState message="Cargando tus reservas..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScreenHeader 
        title="Próximas Reservas"
        showActionButton={true}
        actionButtonText="Nueva"
        actionButtonIcon="add-circle"
        onActionPress={() => router.push("/screens/crearReserva")}
      />
      
      
      <View style={commonStyles.content}>
        <InfoBanner 
          title="Tus próximas actividades"
          description="Aquí puedes ver todas las canchas que has reservado para fechas futuras. Puedes cancelar una reserva hasta 24 horas antes y calificar las canchas que ya has utilizado."
          icon="calendar"
          iconColor="#FF9800"
          backgroundColor="#FFF3E0"
        />
        
        <FlatList
          data={misReservas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Determinar badge y color de borde
            let badge;
            let borderColor;
            
            if (esReservaHoy(item.fecha)) {
              badge = { text: 'HOY', color: '#FF9800' };
              borderColor = '#FF9800';
            } else if (esReservaMañana(item.fecha)) {
              badge = { text: 'MAÑANA', color: '#4CAF50' };
              borderColor = '#4CAF50';
            }
            
            // Determinar qué imagen usar (cancha o centro) y si hay error
            const useImagenCancha = !!getImagenCancha(item.canchaId) && !hasImageError(item.canchaId, 'cancha');
            const useImagenCentro = !!getImagenCentroDeportivo(item.centroDeportivoId) && !hasImageError(item.centroDeportivoId, 'centro');
            const finalImagenUrl = useImagenCancha ? getImagenCancha(item.canchaId) : (useImagenCentro ? getImagenCentroDeportivo(item.centroDeportivoId) : null);
            
            const calificacion = getCalificacionCancha(item.canchaId);
            
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
                estado={item.estado}
                imagenUrl={finalImagenUrl}
                badge={badge}
                borderColor={borderColor}
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
              icon="calendar-outline"
              title="No tienes reservas futuras"
              message="¡Reserva una cancha para comenzar a jugar!"
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
          badge={esReservaHoy(selectedReserva.fecha) ? 
            { text: 'HOY', color: '#FF9800', icon: 'time' } : 
            undefined
          }
          // Añadir props para calificaciones
          userRating={getUserRating(selectedReserva.canchaId)}
          onRateCancha={handleRateCancha}
          isRatingEnabled={esReservaPasada(selectedReserva.fecha)} // Solo permitir calificar reservas pasadas
          isSubmittingRating={isSubmittingRating}
          actions={selectedReserva.estado === 'RESERVADO' ? {
            primary: {
              text: "Cancelar Reserva",
              onPress: () => handleCancelarReserva(selectedReserva.id),
              color: "#F44336"
            },
            secondary: {
              text: "Cerrar",
              onPress: () => setModalVisible(false)
            }
          } : {
            secondary: {
              text: "Cerrar",
              onPress: () => setModalVisible(false)
            }
          }}
          onImageError={(type, id) => handleImageError(id, type)}
        />
      )}
    </SafeAreaView>
  );
};

export default MisReservas;