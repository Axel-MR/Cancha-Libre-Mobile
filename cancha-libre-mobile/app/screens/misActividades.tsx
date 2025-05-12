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

const MisActividades = () => {
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
        console.log(`Se encontraron ${reservasConFechas.length} actividades pasadas`);
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

  const renderReservaItem = ({ item }) => {
    const centro = centrosDeportivos.find(c => c.id === item.centroDeportivoId);
    const cancha = canchas.find(c => c.id === item.canchaId);
    
    // Calcular si la actividad fue hace poco (menos de 7 días)
    const hoy = new Date();
    const fechaReserva = new Date(item.fecha);
    const diasDiferencia = Math.floor((hoy - fechaReserva) / (1000 * 60 * 60 * 24));
    const esReciente = diasDiferencia < 7;

    return (
      <TouchableOpacity 
        style={[styles.reservaCard, esReciente && styles.reservaReciente]}
        onPress={() => verDetalleReserva(item)}
      >
        {esReciente && (
          <View style={styles.badgeReciente}>
            <Text style={styles.badgeText}>Reciente</Text>
          </View>
        )}
        
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
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[
              styles.estadoText, 
              item.estado === 'RESERVADO' ? styles.estadoReservado : 
              item.estado === 'CANCELADO' ? styles.estadoCancelado : 
              styles.estadoCompletado
            ]}>
              {item.estado === 'RESERVADO' ? 'Completada' : item.estado}
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

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalle de Actividad</Text>
            
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
                styles.estadoCompletado
              ]}>
                {selectedReserva.estado === 'RESERVADO' ? 'Completada' : selectedReserva.estado}
              </Text>
            </View>
            
            <View style={styles.modalButtonsContainer}>
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
          <Text style={styles.loadingText}>Cargando historial de actividades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Historial de Actividades</Text>
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
              <Ionicons name="fitness-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No tienes actividades pasadas</Text>
              <Text style={styles.emptySubText}>Cuando reserves y uses canchas, aparecerán aquí</Text>
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
    justifyContent: 'center',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  reservaReciente: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  badgeReciente: {
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
  estadoCompletado: {
    backgroundColor: '#E8F5E9',
    color: '#388E3C',
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
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonCerrar: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
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

export default MisActividades;