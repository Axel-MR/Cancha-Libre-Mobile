"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import api from "../../services/api"
import * as SecureStore from "expo-secure-store"

const EditarCentroDeportivo = ({ centroId }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [centroData, setCentroData] = useState({
    nombre: "",
    ubicacion: "",
    imagenUrl: null,
  })
  const [canchas, setCanchas] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [nuevaCancha, setNuevaCancha] = useState({
    nombre: "",
    deporte: "",
    alumbrado: false,
    jugadores: 0,
    imagenUrl: null
  })

  // Cargar datos del centro deportivo
  useEffect(() => {
    const fetchCentroDeportivo = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken")
        if (!token) {
          throw new Error("No se encontró token de autenticación")
        }

        const response = await api.get(`/centros-deportivos/${centroId}`)
        if (!response.data || !response.data.data) {
          throw new Error("Respuesta incompleta del servidor")
        }

        const centro = response.data.data
        setCentroData({
          nombre: centro.nombre,
          ubicacion: centro.ubicacion,
          imagenUrl: centro.imagenUrl
        })
        
        // Cargar las canchas asociadas a este centro
        const canchasResponse = await api.get(`/centros-deportivos/${centroId}/canchas`)
        if (canchasResponse.data && canchasResponse.data.data) {
          setCanchas(canchasResponse.data.data)
        }
      } catch (error) {
        console.error("Error al cargar centro deportivo:", error)
        Alert.alert("Error", "No se pudo cargar la información del centro deportivo")
      } finally {
        setIsLoading(false)
      }
    }

    if (centroId) {
      fetchCentroDeportivo()
    } else {
      setIsLoading(false)
      Alert.alert("Error", "No se especificó un centro deportivo para editar")
    }
  }, [centroId])

  const handleChange = (name, value) => {
    setCentroData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCanchaChange = (name, value) => {
    setNuevaCancha((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const pickCentroImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      })

      if (!result.canceled) {
        const asset = result.assets[0]
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.readAsDataURL(blob)

        reader.onloadend = () => {
          const base64data = reader.result
          setCentroData((prev) => ({
            ...prev,
            imagenUrl: base64data,
          }))
        }
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
    }
  }

  const pickCanchaImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      })

      if (!result.canceled) {
        const asset = result.assets[0]
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.readAsDataURL(blob)

        reader.onloadend = () => {
          const base64data = reader.result
          setNuevaCancha((prev) => ({
            ...prev,
            imagenUrl: base64data,
          }))
        }
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
    }
  }

  const handleUpdateCentro = async () => {
    if (!centroData.nombre || !centroData.ubicacion) {
      Alert.alert("Error", "Nombre y ubicación son campos requeridos")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await SecureStore.getItemAsync("userToken")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      const dataToSend = {
        nombre: centroData.nombre,
        ubicacion: centroData.ubicacion,
        imagenBase64: centroData.imagenUrl,
      }

      const response = await api.put(`/centros-deportivos/${centroId}`, dataToSend)

      if (!response.data || !response.data.data) {
        throw new Error("Respuesta incompleta del servidor")
      }

      Alert.alert("Éxito", "Centro deportivo actualizado correctamente")
    } catch (error) {
      console.error("Error al actualizar:", error.response?.data || error.message)
      
      let errorMessage = "Error al actualizar el centro deportivo"
      if (error.response?.status === 401) {
        errorMessage = "No autorizado. Por favor inicia sesión nuevamente"
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      Alert.alert("Error", errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddCancha = async () => {
    if (!nuevaCancha.nombre || !nuevaCancha.deporte || nuevaCancha.jugadores <= 0) {
      Alert.alert("Error", "Nombre, deporte y número de jugadores son campos requeridos")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await SecureStore.getItemAsync("userToken")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      const dataToSend = {
        nombre: nuevaCancha.nombre,
        deporte: nuevaCancha.deporte,
        alumbrado: nuevaCancha.alumbrado,
        jugadores: parseInt(nuevaCancha.jugadores),
        imagenBase64: nuevaCancha.imagenUrl,
        centroDeportivoId: centroId
      }

      const response = await api.post(`/centros-deportivos/${centroId}/canchas`, dataToSend)

      if (!response.data || !response.data.data) {
        throw new Error("Respuesta incompleta del servidor")
      }

      // Actualizar la lista de canchas
      setCanchas([...canchas, response.data.data])
      
      // Resetear el formulario
      setNuevaCancha({
        nombre: "",
        deporte: "",
        alumbrado: false,
        jugadores: 0,
        imagenUrl: null
      })
      
      setModalVisible(false)
      Alert.alert("Éxito", "Cancha añadida correctamente")
    } catch (error) {
      console.error("Error al añadir cancha:", error.response?.data || error.message)
      
      let errorMessage = "Error al añadir la cancha"
      if (error.response?.status === 401) {
        errorMessage = "No autorizado. Por favor inicia sesión nuevamente"
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      Alert.alert("Error", errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCancha = async (canchaId) => {
    Alert.alert(
      "Confirmar eliminación", 
      "¿Estás seguro de que quieres eliminar esta cancha? Esta acción no se puede deshacer.",
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

              await api.delete(`/canchas/${canchaId}`)
              
              // Actualizar la lista de canchas
              setCanchas(canchas.filter(cancha => cancha.id !== canchaId))
              Alert.alert("Éxito", "Cancha eliminada correctamente")
            } catch (error) {
              console.error("Error al eliminar cancha:", error)
              Alert.alert("Error", "No se pudo eliminar la cancha")
            }
          }
        }
      ]
    )
  }

  const renderCanchaItem = ({ item }) => (
    <View style={styles.canchaItem}>
      <View style={styles.canchaInfo}>
        {item.imagenUrl ? (
          <Image source={{ uri: item.imagenUrl }} style={styles.canchaImage} />
        ) : (
          <View style={styles.canchaImagePlaceholder}>
            <Ionicons name="football-outline" size={24} color="#aaa" />
          </View>
        )}
        <View style={styles.canchaDetails}>
          <Text style={styles.canchaName}>{item.nombre}</Text>
          <Text style={styles.canchaDetail}>Deporte: {item.deporte}</Text>
          <Text style={styles.canchaDetail}>Jugadores: {item.jugadores}</Text>
          <Text style={styles.canchaDetail}>
            Alumbrado: {item.alumbrado ? "Sí" : "No"}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteCancha(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f95dc" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Centro Deportivo</Text>

      {/* Formulario de edición del centro */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Centro</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre del Centro*</Text>
          <TextInput
            style={styles.input}
            value={centroData.nombre}
            onChangeText={(text) => handleChange("nombre", text)}
            placeholder="Ej: Polideportivo Municipal"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ubicación*</Text>
          <TextInput
            style={styles.input}
            value={centroData.ubicacion}
            onChangeText={(text) => handleChange("ubicacion", text)}
            placeholder="Ej: Av. Principal 123"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Imagen del Centro</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickCentroImage}>
            {centroData.imagenUrl ? (
              <Image source={{ uri: centroData.imagenUrl }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={24} color="#666" />
                <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.updateButton} 
          onPress={handleUpdateCentro} 
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Actualizar Información</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de canchas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Canchas</Text>
        
        {canchas.length > 0 ? (
          <FlatList
            data={canchas}
            renderItem={renderCanchaItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // Para evitar scroll anidado
          />
        ) : (
          <View style={styles.noCanchasContainer}>
            <Ionicons name="football-outline" size={40} color="#ccc" />
            <Text style={styles.noCanchasText}>No hay canchas registradas</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" style={styles.addIcon} />
          <Text style={styles.buttonText}>Añadir Nueva Cancha</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para añadir cancha */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Nueva Cancha</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre de la Cancha*</Text>
                <TextInput
                  style={styles.input}
                  value={nuevaCancha.nombre}
                  onChangeText={(text) => handleCanchaChange("nombre", text)}
                  placeholder="Ej: Cancha Principal"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Deporte*</Text>
                <TextInput
                  style={styles.input}
                  value={nuevaCancha.deporte}
                  onChangeText={(text) => handleCanchaChange("deporte", text)}
                  placeholder="Ej: Fútbol, Baloncesto, etc."
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de Jugadores*</Text>
                <TextInput
                  style={styles.input}
                  value={nuevaCancha.jugadores.toString()}
                  onChangeText={(text) => handleCanchaChange("jugadores", text)}
                  placeholder="Ej: 10"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Alumbrado</Text>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleCanchaChange("alumbrado", !nuevaCancha.alumbrado)}
                >
                  <View style={[styles.checkbox, nuevaCancha.alumbrado && styles.checkboxActive]}>
                    {nuevaCancha.alumbrado && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Esta cancha dispone de alumbrado
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Imagen de la Cancha</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickCanchaImage}>
                  {nuevaCancha.imagenUrl ? (
                    <Image source={{ uri: nuevaCancha.imagenUrl }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={24} color="#666" />
                      <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleAddCancha}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar Cancha</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  imagePicker: {
    height: 150,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#2f95dc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  addIcon: {
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#2f95dc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noCanchasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  noCanchasText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  canchaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  canchaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  canchaImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  canchaImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  canchaDetails: {
    flex: 1,
  },
  canchaName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  canchaDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    paddingBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#2f95dc',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#444',
  },
});

export default EditarCentroDeportivo;