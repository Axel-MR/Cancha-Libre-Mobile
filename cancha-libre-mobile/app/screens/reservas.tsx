import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";

// Componentes
import ScreenHeader from "../../components/reservations/ScreenHeader";
import ReservationCard from "../../components/reservations/ReservationCard";
import ReservationDetailModal from "../../components/reservations/ReservationDetailModal";
import LoadingState from "../../components/reservations/LoadingState";
import EmptyState from "../../components/reservations/EmptyState";
import InfoBanner from "../../components/reservations/InfoBanner";
import { commonStyles } from "../../components/reservations/CommonStyles";
import { normalizeImageUrl } from "../../utils/imageUtils";

const Reservas = () => {
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centrosDeportivos, setCentrosDeportivos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [reservasDisponibles, setReservasDisponibles] = useState([]);
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState({}); // Para rastrear errores de carga de imágenes

  // Cargar datos al iniciar
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Cargar centros deportivos
      const centrosResponse = await api.get("/centros-deportivos");
      if (centrosResponse.data && centrosResponse.data.data) {
        setCentrosDeportivos(centrosResponse.data.data);
      }

      // Cargar canchas
      const canchasResponse = await api.get("/canchas");
      if (canchasResponse.data && canchasResponse.data.data) {
        setCanchas(canchasResponse.data.data);
      }

      // Cargar reservas disponibles
      const reservasResponse = await api.get("/reservas/disponibles");

      if (reservasResponse.data && reservasResponse.data.data) {
        // Convertir las fechas de string a objetos Date
        const reservasConFechas = reservasResponse.data.data.map((reserva) => ({
          ...reserva,
          fecha: new Date(reserva.fecha),
          horaInicio: new Date(reserva.horaInicio),
          horaFin: new Date(reserva.horaFin),
        }));

        setReservasDisponibles(reservasConFechas);
      } else {
        setReservasDisponibles([]);
      }

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

      setReservasDisponibles([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const verDetalleReserva = (reservaId) => {
    const reserva = reservasDisponibles.find((r) => r.id === reservaId);
    if (reserva) {
      setSelectedReserva(reserva);
      setModalVisible(true);
    }
  };

  const getDeporteCancha = (id) => {
    const cancha = canchas.find((c) => c.id === id);
    return cancha ? cancha.deporte : "Desconocido";
  };

  const getNombreCancha = (id) => {
    const cancha = canchas.find((c) => c.id === id);
    return cancha ? cancha.nombre : "Desconocida";
  };

  const getNombreCentroDeportivo = (id) => {
    const centro = centrosDeportivos.find((c) => c.id === id);
    return centro ? centro.nombre : "Desconocido";
  };

  // Función para obtener la calificación promedio de una cancha
  const getCalificacionCancha = (id) => {
    const cancha = canchas.find((c) => c.id === id);
    return cancha
      ? {
          promedio: cancha.calificacionPromedio || 0,
          total: cancha.totalCalificaciones || 0,
        }
      : { promedio: 0, total: 0 };
  };

  // Función para manejar errores de carga de imágenes
  const handleImageError = (id, type) => {
    console.log(`[Reservas] Error al cargar imagen de ${type} ID: ${id}`);
    setImageErrors((prev) => ({
      ...prev,
      [`${type}_${id}`]: true,
    }));
  };

  // Verificar si hay error de carga para una imagen
  const hasImageError = (id, type) => {
    return !!imageErrors[`${type}_${id}`];
  };

  const getImagenBase64 = (canchaId) => {
    const cancha = canchas.find(c => c.id === canchaId);
    return cancha?.imagenBase64 || null;
  };

  const getImagenBase64Centro = (centroId) => {
    const centro = centrosDeportivos.find(c => c.id === centroId);
    return centro?.imagenBase64 || null;
  };

  // Función para obtener la URL de la imagen del centro deportivo
  const getImagenCentroDeportivo = (id) => {
    const centro = centrosDeportivos.find((c) => c.id === id);

    // Si no hay centro o no tiene URL de imagen, retornar null
    if (!centro || !centro.imagenUrl) {
      return null;
    }

    return centro.imagenUrl;
  };

  // Función para obtener la URL de la imagen de la cancha
  const getImagenCancha = (id) => {
    const cancha = canchas.find((c) => c.id === id);

    if (!cancha || !cancha.imagenUrl) {
      return null;
    }

    return cancha.imagenUrl;
  };

  // Función para determinar si una reserva es destacada (para el badge)
  const isReservaDestacada = (reserva) => {
    const ahora = new Date();
    const fechaReserva = new Date(reserva.fecha);
    const diferenciaDias = Math.floor((fechaReserva - ahora) / (1000 * 60 * 60 * 24));
    
    return diferenciaDias <= 2; // Destacar reservas en los próximos 2 días
  };

  // Función para obtener el color del borde según el deporte
  const getBorderColorByDeporte = (deporte) => {
    switch (deporte?.toLowerCase()) {
      case 'fútbol':
      case 'futbol':
        return '#4CAF50'; // Verde
      case 'baloncesto':
      case 'basketball':
      case 'básquetbol':
        return '#FF9800'; // Naranja
      case 'tenis':
        return '#2196F3'; // Azul
      case 'voleibol':
      case 'volleyball':
        return '#9C27B0'; // Púrpura
      default:
        return null; // Sin borde especial
    }
  };

  const handleReservar = async (reservaId) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Obtener el ID del usuario del token
      const tokenParts = token.split(".");
      let userId = "";

      if (tokenParts.length > 1) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload && payload.userId) {
            userId = payload.userId;
          }
        } catch (e) {
          console.error("Error al decodificar token:", e);
        }
      }

      if (!userId) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      // Actualizar la reserva con el ID del usuario
      const response = await api.put(`/reservas/${reservaId}`, {
        reservadorId: userId,
        estado: "RESERVADO",
      });

      if (response.data && response.data.success) {
        Alert.alert(
          "Reserva exitosa",
          "La cancha ha sido reservada correctamente.",
          [
            {
              text: "OK",
              onPress: () => {
                setModalVisible(false);
                fetchData(); // Volver a cargar los datos
              },
            },
          ]
        );
      } else {
        throw new Error("No se pudo completar la reserva");
      }
    } catch (error) {
      console.error("Error al reservar:", error);
      Alert.alert(
        "Error",
        "No se pudo completar la reserva: " +
          (error.message || "Error desconocido")
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <LoadingState message="Cargando reservas disponibles..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.content}>
        <InfoBanner
          title="Canchas disponibles"
          description="Aquí puedes ver todas las canchas disponibles para reservar. Selecciona una para ver más detalles y realizar tu reserva."
          icon="basketball-outline"
          iconColor="#2196F3"
          backgroundColor="#E3F2FD"
        />

        <FlatList
          data={reservasDisponibles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Determinar qué imagen usar (cancha o centro) y si hay error
            const useImagenCancha =
              !!getImagenCancha(item.canchaId) &&
              !hasImageError(item.canchaId, "cancha");
            const useImagenCentro =
              !!getImagenCentroDeportivo(item.centroDeportivoId) &&
              !hasImageError(item.centroDeportivoId, "centro");
            const finalImagenUrl = useImagenCancha
              ? getImagenCancha(item.canchaId)
              : useImagenCentro
              ? getImagenCentroDeportivo(item.centroDeportivoId)
              : null;

            const calificacion = getCalificacionCancha(item.canchaId);
            const deporte = getDeporteCancha(item.canchaId);
            
            // Determinar si la reserva es destacada
            const esDestacada = isReservaDestacada(item);
            
            // Configurar badge si es destacada
            const badge = esDestacada ? {
              text: "¡Pronto!",
              color: "#FF5722"
            } : null;
            
            // Obtener color de borde según el deporte
            const borderColor = getBorderColorByDeporte(deporte);

            return (
              <ReservationCard
                id={item.id}
                fecha={item.fecha}
                horaInicio={item.horaInicio}
                horaFin={item.horaFin}
                deporte={deporte}
                centroDeportivo={getNombreCentroDeportivo(
                  item.centroDeportivoId
                )}
                cancha={getNombreCancha(item.canchaId)}
                canchaId={item.canchaId}
                imagenUrl={finalImagenUrl}
                imagenBase64={
                  getImagenBase64(item.canchaId) ||
                  getImagenBase64Centro(item.centroDeportivoId)
                }
                badge={badge}
                borderColor={borderColor}
                calificacionPromedio={calificacion.promedio}
                totalCalificaciones={calificacion.total}
                onPress={verDetalleReserva}
                onImageError={() => {
                  // Si estamos usando la imagen de la cancha y falla, intentar con la del centro
                  if (useImagenCancha) {
                    handleImageError(item.canchaId, "cancha");
                  } else if (useImagenCentro) {
                    handleImageError(item.centroDeportivoId, "centro");
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
              title="No hay reservas disponibles"
              message="Desliza hacia abajo para actualizar o crea una nueva reserva"
            />
          }
        />
      </View>

      {selectedReserva && (
        <ReservationDetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reservation={selectedReserva}
          centroDeportivo={centrosDeportivos.find(
            (c) => c.id === selectedReserva.centroDeportivoId
          )}
          cancha={canchas.find((c) => c.id === selectedReserva.canchaId)}
          // Eliminamos la calificación del usuario y la función de calificar
          isRatingEnabled={false} // Deshabilitamos la calificación en este modal
          actions={{
            primary: {
              text: "Reservar",
              onPress: () => handleReservar(selectedReserva.id),
              color: "#4CAF50",
            },
            secondary: {
              text: "Cerrar",
              onPress: () => setModalVisible(false),
            },
          }}
          onImageError={(type, id) => handleImageError(id, type)}
        />
      )}
    </SafeAreaView>
  );
};

export default Reservas;