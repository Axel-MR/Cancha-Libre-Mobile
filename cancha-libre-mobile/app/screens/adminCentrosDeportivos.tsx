"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal
} from "react-native"
import { Link, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import api from "../../services/api"
import * as SecureStore from "expo-secure-store"
import EditarCentroDeportivo from "./editarCentrosDeportivos"

const AdminCentrosDeportivos = () => {
  const router = useRouter()
  const [centrosDeportivos, setCentrosDeportivos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCentroId, setSelectedCentroId] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Función para cargar los centros deportivos
  const fetchCentrosDeportivos = async () => {
    try {
      setIsLoading(true)
      const token = await SecureStore.getItemAsync("userToken")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      const response = await api.get("/centros-deportivos")
      if (!response.data || !response.data.data) {
        throw new Error("Respuesta incompleta del servidor")
      }

      setCentrosDeportivos(response.data.data)
    } catch (error) {
      console.error("Error al cargar centros deportivos:", error.response?.data || error.message)
      let errorMessage = "Error al cargar los centros deportivos"
      if (error.response?.status === 401) {
        errorMessage = "No autorizado. Por favor inicia sesión nuevamente"
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      Alert.alert("Error", errorMessage)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchCentrosDeportivos()
  }, [])

  // Función para refrescar la lista
  const onRefresh = () => {
    setRefreshing(true)
    fetchCentrosDeportivos()
  }

  // Función para eliminar un centro deportivo
  const handleDeleteCentro = (id, nombre) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de que quieres eliminar el centro "${nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("userToken")
              if (!token) {
                throw new Error("No se encontró token de autenticación")
              }

              await api.delete(`/centros-deportivos/${id}`)
              
              // Actualizar la lista
              setCentrosDeportivos(centrosDeportivos.filter(centro => centro.id !== id))
              Alert.alert("Éxito", "Centro deportivo eliminado correctamente")
            } catch (error) {
              console.error("Error al eliminar:", error)
              Alert.alert("Error", "No se pudo eliminar el centro deportivo")
            }
          }
        }
      ]
    )
  }

  // Manejar la edición de un centro
  const handleEditCentro = (id) => {
    setSelectedCentroId(id)
    setModalVisible(true)
  }

  // Renderizar cada ítem de la lista
  const renderCentroItem = ({ item }) => (
    <View style={styles.centroItem}>
      <View style={styles.centroImageContainer}>
        {item.imagenUrl ? (
          <Image source={{ uri: item.imagenUrl }} style={styles.centroImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business-outline" size={28} color="#aaa" />
          </View>
        )}
      </View>
      
      <View style={styles.centroInfo}>
        <Text style={styles.centroNombre}>{item.nombre}</Text>
        <Text style={styles.centroUbicacion}>{item.ubicacion}</Text>
        <Text style={styles.centroCanchas}>
          {item.canchas?.length || 0} {item.canchas?.length === 1 ? "cancha" : "canchas"}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditCentro(item.id)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCentro(item.id, item.nombre)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Administrar Centros Deportivos</Text>
        <Link href="/screens/crearCentroDeportivo" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
          <Text style={styles.loadingText}>Cargando centros deportivos...</Text>
        </View>
      ) : centrosDeportivos.length > 0 ? (
        <FlatList
          data={centrosDeportivos}
          renderItem={renderCentroItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2f95dc"]}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="business" size={70} color="#ccc" />
          <Text style={styles.emptyText}>No hay centros deportivos</Text>
          <Text style={styles.emptySubText}>
            Pulsa el botón "+" para crear un nuevo centro deportivo
          </Text>
        </View>
      )}

      {/* Modal para editar centro deportivo */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false)
          // Refrescar la lista al cerrar el modal para mostrar los cambios
          fetchCentrosDeportivos()
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setModalVisible(false)
                fetchCentrosDeportivos() // Refrescar la lista al volver
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#2f95dc" />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
          
          {/* Renderizar el componente de edición con el ID seleccionado */}
          {selectedCentroId && <EditarCentroDeportivo centroId={selectedCentroId} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  listContainer: {
    padding: 16,
  },
  centroItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  centroImageContainer: {
    marginRight: 12,
  },
  centroImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centroInfo: {
    flex: 1,
  },
  centroNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  centroUbicacion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  centroCanchas: {
    fontSize: 14,
    color: '#2f95dc',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2f95dc',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2f95dc',
    fontWeight: '500',
  },
});

export default AdminCentrosDeportivos;