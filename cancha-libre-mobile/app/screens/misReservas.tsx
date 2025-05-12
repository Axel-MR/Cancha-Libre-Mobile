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
      console.log("Obteniendo reservas del usuario...");
      const reservasResponse = await api.get('/reservas');
      console.log("Respuesta de reservas:", reservasResponse.data);
      
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
        console.log(`Se encontraron ${reservasConFechas.length} reservas futuras`);
      } else {
        console.log("No se encontraron datos de reservas en la respuesta");
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
      
      // Si hay error, establecer arrays vacíos
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

  const renderReservaItem = ({ item }) => {
    const centro = centrosDeportivos.find(c => c.id === item.centroDeportivoId);
    const cancha = canchas.find(c => c.id === item.canchaId);
    
    // Determinar si la reserva es para hoy o mañana
    const esHoy = esReservaHoy(item.fecha);
    const esMañana = esReservaMañana(item.fecha);
    
    return (
      <TouchableOpacity 
        style={[
          styles.reservaCard, 
          esHoy ? styles.reservaHoy : 
          esMañana ? styles.reservaMañana : null
        ]}
        onPress={() => verDetalleReserva(item)}
      >
        {esHoy && (
          <View style={styles.badgeHoy}>
            <Text style={styles.badgeText}>HOY</Text>
          </View>
        )}
        
        {esMañana && (
          <View style={styles.badgeMañana}>
            <Text style={styles.badgeText}>MAÑANA</Text>
          </View>
        )}
        
        <View style={styles.reservaContent}>
          <Text style={styles.deporteTitulo}>{getDeporteCancha(item.canchaId)}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(item.fecha), 'EEEE, d MMMM yyyy', { locale: es })}
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
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[
              styles.estadoText, 
              item.estado === 'RESERVADO' ? styles.estadoReservado : 
              item.estado === 'CANCELADO' ? styles.estadoCancelado : 
              styles.estadoOtro
            ]}>
              {item.estado}
            </Text>
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
    const esHoy = esReservaHoy(selectedReserva.fecha);

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
            
            {esHoy && (
              <View style={styles.modalBadgeHoy}>
                <Ionicons name="time" size={16} color="white" />
                <Text style={styles.modalBadgeText}>HOY</Text>
              </View>
            )}
            
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
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Estado:</Text>
              <Text style={[
                styles.modalEstadoText, 
                selectedReserva.estado === 'RESERVADO' ? styles.estadoReservado : 
                selectedReserva.estado === 'CANCELADO' ? styles.estadoCancelado : 
                styles.estadoOtro
              ]}>
                {selectedReserva.estado}
              </Text>
            </View>
            
            {selectedReserva.objetosRentados && selectedReserva.objetosRentados.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Objetos Rentados:</Text>
                {selectedReserva.objetosRentados.map((objeto, index) => (
                  <Text key={index} style={styles.modalText}>
                    {objeto.nombre} (x{objeto.cantidad})
                  </Text>
                ))}
              </View>
            )}
            
            <View style={styles.modalButtonsContainer}>
              {selectedReserva.estado === 'RESERVADO' && (
                <TouchableOpacity
                  style={styles.buttonCancelar}
                  onPress={() => handleCancelarReserva(selectedReserva.id)}
                >
                  <Text style={styles.buttonText}>Cancelar Reserva</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.buttonCerrar,
                  selectedReserva.estado !== 'RESERVADO' && { width: '100%' }
                ]}
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
          <Text style={styles.loadingText}>Cargando tus reservas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Reservas</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push("/screens/crearReserva")}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Nueva</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <FlatList
          data={misReservas}
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
              <Text style={styles.emptyText}>No tienes reservas futuras</Text>
              <Text style={styles.emptySubText}>¡Reserva una cancha para comenzar a jugar!</Text>
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
    position: 'relative',
  },
  reservaHoy: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  reservaMañana: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  badgeHoy: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeMañana: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    alignItems: 'center',
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
  estadoText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  estadoReservado: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
  },
  estadoCancelado: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  estadoOtro: {
    backgroundColor: '#F5F5F5',
    color: '#757575',
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
  modalBadgeHoy: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
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
  modalEstadoText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonCancelar: {
    backgroundColor: '#F44336',
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

export default MisReservas;