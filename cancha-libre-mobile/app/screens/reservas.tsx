import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";

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
      } else {
        console.log("No se encontraron datos de canchas en la respuesta");
      }

      // Cargar reservas disponibles - AQUÍ ESTÁ EL CAMBIO PRINCIPAL
      console.log("Obteniendo reservas disponibles...");
      const reservasResponse = await api.get('/reservas/disponibles');
      console.log("Respuesta de reservas:", reservasResponse.data);
      
      if (reservasResponse.data && reservasResponse.data.data) {
        // Convertir las fechas de string a objetos Date
        const reservasConFechas = reservasResponse.data.data.map(reserva => ({
          ...reserva,
          fecha: new Date(reserva.fecha),
          horaInicio: new Date(reserva.horaInicio),
          horaFin: new Date(reserva.horaFin)
        }));
        
        setReservasDisponibles(reservasConFechas);
        console.log(`Se encontraron ${reservasConFechas.length} reservas disponibles`);
      } else {
        console.log("No se encontraron datos de reservas en la respuesta");
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
      
      // Si hay error, establecer arrays vacíos
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
    console.log("Intentando navegar a Crear Reservas...");
    try {
      router.push("/screens/crearReserva");
    } catch (error) {
      console.error("Error al navegar:", error);
      Alert.alert("Error de navegación", "No se pudo navegar a la pantalla Crear Reservas");
    }
  };

  const verDetalleReserva = (reserva) => {
    setSelectedReserva(reserva);
    setModalVisible(true);
  };

  const getNombreCentroDeportivo = (id) => {
    const centro = centrosDeportivos.find(c => c.id === id);
    return centro ? centro.nombre : 'Desconocido';
  };

  const getNombreCancha = (id) => {
    const cancha = canchas.find(c => c.id === id);
    return cancha ? cancha.nombre : 'Desconocida';
  };

  const getDeporteCancha = (id) => {
    const cancha = canchas.find(c => c.id === id);
    return cancha ? cancha.deporte : 'Desconocido';
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

      // Aquí implementarías la llamada a la API para reservar
      // Por ejemplo, actualizar la reserva con el ID del usuario
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
                // Actualizar la lista de reservas disponibles
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

  const renderReservaItem = ({ item }) => {
    const centro = centrosDeportivos.find(c => c.id === item.centroDeportivoId);
    const cancha = canchas.find(c => c.id === item.canchaId);

    return (
      <TouchableOpacity 
        style={styles.reservaCard}
        onPress={() => verDetalleReserva(item)}
      >
        <View style={styles.reservaContent}>
          <Text style={styles.deporteTitulo}>{getDeporteCancha(item.canchaId)}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(item.fecha), 'yyyy-MM-dd')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hora:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(item.horaInicio), 'HH:mm')} - {format(new Date(item.horaFin), 'HH:mm')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Centro Deportivo:</Text>
            <Text style={styles.infoValue}>{centro?.nombre || 'Desconocido'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cancha:</Text>
            <Text style={styles.infoValue}>{cancha?.nombre || 'Desconocida'}</Text>
          </View>
        </View>
        
        <Image 
          source={{ uri: centro?.imagenUrl || 'https://via.placeholder.com/400x200' }} 
          style={styles.reservaImagen} 
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  const DetalleReservaModal = () => {
    if (!selectedReserva) return null;

    const centro = centrosDeportivos.find(c => c.id === selectedReserva.centroDeportivoId);
    const cancha = canchas.find(c => c.id === selectedReserva.canchaId);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalle de Reserva</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Centro Deportivo:</Text>
              <Text style={styles.modalText}>{centro?.nombre || 'Desconocido'}</Text>
              <Text style={styles.modalText}>{centro?.ubicacion || 'Ubicación no disponible'}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Cancha:</Text>
              <Text style={styles.modalText}>
                {cancha?.nombre || 'Desconocida'} ({cancha?.deporte || 'Deporte no especificado'})
              </Text>
              {cancha && (
                <Text style={styles.modalText}>
                  Para {cancha.jugadores} jugadores - {cancha.alumbrado ? 'Con alumbrado' : 'Sin alumbrado'}
                </Text>
              )}
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Fecha y Hora:</Text>
              <Text style={styles.modalText}>
                {format(new Date(selectedReserva.fecha), 'EEEE, d MMMM yyyy', { locale: es })}
              </Text>
              <Text style={styles.modalText}>
                {format(new Date(selectedReserva.horaInicio), 'HH:mm')} - {format(new Date(selectedReserva.horaFin), 'HH:mm')}
              </Text>
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.buttonReservar}
                onPress={() => handleReservar(selectedReserva.id)}
              >
                <Text style={styles.buttonText}>Reservar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.buttonCerrar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando reservas disponibles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reservas Disponibles</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={navigateToCrearReservas}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <FlatList
          data={reservasDisponibles}
          keyExtractor={(item) => item.id}
          renderItem={renderReservaItem}
          contentContainerStyle={styles.reservasList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196F3"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No hay reservas disponibles</Text>
              <Text style={styles.emptySubText}>Desliza hacia abajo para actualizar o crea una nueva reserva</Text>
            </View>
          }
        />
      </View>
      
      <DetalleReservaModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  reservasList: {
    padding: 10,
  },
  reservaCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    flexDirection: 'column',
    width: '100%',
  },
  reservaContent: {
    padding: 16,
  },
  deporteTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  reservaImagen: {
    width: '100%',
    height: 180,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 15,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2196F3',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 3,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonReservar: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  buttonCerrar: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default Reservas;