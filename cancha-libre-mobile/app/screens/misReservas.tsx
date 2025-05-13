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

const MisReservas = () => {
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centrosDeportivos, setCentrosDeportivos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

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
        setCentrosDeportivos(centrosResponse.data.data);
      }

      // Cargar canchas
      const canchasResponse = await api.get('/canchas');
      if (canchasResponse.data && canchasResponse.data.data) {
        setCanchas(canchasResponse.data.data);
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
          description="Aquí puedes ver todas las canchas que has reservado para fechas futuras. Puedes cancelar una reserva hasta 24 horas antes."
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
                estado={item.estado}
                imagenUrl={imagenCancha || imagenCentro} // Usar imagen de cancha si existe, sino la del centro
                badge={badge}
                borderColor={borderColor}
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
        />
      )}
    </SafeAreaView>
  );
};

export default MisReservas;