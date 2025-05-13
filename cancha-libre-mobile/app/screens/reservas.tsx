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

const Reservas = () => {
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centrosDeportivos, setCentrosDeportivos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [reservasDisponibles, setReservasDisponibles] = useState([]);
  const router = useRouter();

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
      const centrosResponse = await api.get('/centros-deportivos');
      if (centrosResponse.data && centrosResponse.data.data) {
        setCentrosDeportivos(centrosResponse.data.data);
      }

      // Cargar canchas
      const canchasResponse = await api.get('/canchas');
      if (canchasResponse.data && canchasResponse.data.data) {
        setCanchas(canchasResponse.data.data);
      }

      // Cargar reservas disponibles
      const reservasResponse = await api.get('/reservas/disponibles');
      
      if (reservasResponse.data && reservasResponse.data.data) {
        // Convertir las fechas de string a objetos Date
        const reservasConFechas = reservasResponse.data.data.map(reserva => ({
          ...reserva,
          fecha: new Date(reserva.fecha),
          horaInicio: new Date(reserva.horaInicio),
          horaFin: new Date(reserva.horaFin)
        }));
        
        setReservasDisponibles(reservasConFechas);
      } else {
        setReservasDisponibles([]);
      }
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

  const navigateToCrearReservas = () => {
    router.push("/screens/crearReserva");
  };

  const verDetalleReserva = (reservaId) => {
    const reserva = reservasDisponibles.find(r => r.id === reservaId);
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

  // Función para obtener la URL de la imagen del centro deportivo
  const getImagenCentroDeportivo = (id) => {
    const centro = centrosDeportivos.find(c => c.id === id);
    
    // Si no hay centro o no tiene URL de imagen, retornar null
    if (!centro || !centro.imagenUrl) {
      return null;
    }
    
    // Si la URL ya comienza con http:// o https://, usarla directamente
    if (centro.imagenUrl.startsWith('http://') || centro.imagenUrl.startsWith('https://')) {
      return centro.imagenUrl;
    }
    
    // Si es una ruta relativa, usar HTTP
    return `http://192.168.100.13:3000${centro.imagenUrl.startsWith('/') ? '' : '/'}${centro.imagenUrl}`;
  };

  // Función para obtener la URL de la imagen de la cancha
  const getImagenCancha = (id) => {
    const cancha = canchas.find(c => c.id === id);
    
    if (!cancha || !cancha.imagenUrl) {
      return null;
    }
    
    if (cancha.imagenUrl.startsWith('http://') || cancha.imagenUrl.startsWith('https://')) {
      return cancha.imagenUrl;
    }
    
    // Usar HTTP
    return `http://192.168.100.13:3000${cancha.imagenUrl.startsWith('/') ? '' : '/'}${cancha.imagenUrl}`;
  };

  const handleReservar = async (reservaId) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Obtener el ID del usuario del token
      const tokenParts = token.split('.');
      let userId = '';
      
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
        estado: 'RESERVADO'
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
              } 
            }
          ]
        );
      } else {
        throw new Error("No se pudo completar la reserva");
      }
    } catch (error) {
      console.error("Error al reservar:", error);
      Alert.alert("Error", "No se pudo completar la reserva: " + (error.message || "Error desconocido"));
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
      <ScreenHeader 
        title="Reservas Disponibles"
        showActionButton={true}
        actionButtonText="Crear"
        actionButtonIcon="add-circle"
        onActionPress={navigateToCrearReservas}
      />
      
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
            const imagenCancha = getImagenCancha(item.canchaId);
            const imagenCentro = getImagenCentroDeportivo(item.centroDeportivoId);
            
            return (
              <ReservationCard
                id={item.id}
                fecha={item.fecha}
                horaInicio={item.horaInicio}
                horaFin={item.horaFin}
                deporte={getDeporteCancha(item.canchaId)}
                centroDeportivo={getNombreCentroDeportivo(item.centroDeportivoId)}
                cancha={getNombreCancha(item.canchaId)}
                imagenUrl={imagenCancha || imagenCentro} // Usar imagen de cancha si existe, sino la del centro
                onPress={verDetalleReserva}
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
          centroDeportivo={centrosDeportivos.find(c => c.id === selectedReserva.centroDeportivoId)}
          cancha={canchas.find(c => c.id === selectedReserva.canchaId)}
          actions={{
            primary: {
              text: "Reservar",
              onPress: () => handleReservar(selectedReserva.id),
              color: "#4CAF50"
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

export default Reservas;