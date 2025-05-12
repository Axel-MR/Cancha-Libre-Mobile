"use client"

import { useState } from "react"
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
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import api from "../../services/api"
import * as SecureStore from "expo-secure-store"

const CrearCentroDeportivo = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    imagenUrl: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Reducir calidad para base64
      })

      if (!result.canceled) {
        const asset = result.assets[0]

        // Convertir imagen a base64
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.readAsDataURL(blob)

        reader.onloadend = () => {
          const base64data = reader.result
          setFormData((prev) => ({
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

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.ubicacion) {
      Alert.alert("Error", "Nombre y ubicación son campos requeridos")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await SecureStore.getItemAsync("userToken")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      // Preparar datos según lo que espera el backend
      const dataToSend = {
        nombre: formData.nombre,
        ubicacion: formData.ubicacion,
        imagenBase64: formData.imagenUrl, // Cambiamos el nombre del campo
      }

      console.log("Enviando datos a /api/centros-deportivos...")

      // Asegurarse de usar la ruta completa
      const response = await api.post("/centros-deportivos", dataToSend)

      // Modificación aquí: Verificar la estructura correcta de la respuesta
      if (!response.data || !response.data.data || !response.data.data.id) {
        throw new Error("Respuesta incompleta del servidor")
      }

      Alert.alert("Éxito", "Centro deportivo creado correctamente", [{ text: "OK", onPress: () => router.back() }])
    } catch (error) {
      console.error("Error completo:", error.response?.data || error.message)

      let errorMessage = "Error al crear el centro deportivo"

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Nuevo Centro Deportivo</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre del Centro*</Text>
        <TextInput
          style={styles.input}
          value={formData.nombre}
          onChangeText={(text) => handleChange("nombre", text)}
          placeholder="Ej: Polideportivo Municipal"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Ubicación*</Text>
        <TextInput
          style={styles.input}
          value={formData.ubicacion}
          onChangeText={(text) => handleChange("ubicacion", text)}
          placeholder="Ej: Av. Principal 123"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Imagen del Centro</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {formData.imagenUrl ? (
            <Image source={{ uri: formData.imagenUrl }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={24} color="#666" />
              <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isSubmitting ? (
        <ActivityIndicator size="large" color="#2f95dc" style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>Crear Centro Deportivo</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
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
  submitButton: {
    backgroundColor: '#2f95dc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
});

export default CrearCentroDeportivo;