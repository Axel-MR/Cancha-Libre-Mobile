import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';

// Tipo para los datos del usuario
interface UserData {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  edad?: number;
  sexo?: string;
  estatura?: number;
  peso?: number;
  ejercicio_semanal?: number;
  avatarUrl?: string;
  reservasHechas?: number;
  faltas?: number;
  rol: string;
}

// Tipo para los datos editables
interface EditableData {
  nombre: string;
  telefono: string;
  edad: string;
  sexo: string;
  estatura: string;
  peso: string;
  ejercicio_semanal: string;
  avatarUrl?: string;
}

const Perfil = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editableData, setEditableData] = useState<EditableData>({
    nombre: '',
    telefono: '',
    edad: '',
    sexo: '',
    estatura: '',
    peso: '',
    ejercicio_semanal: '',
    avatarUrl: undefined
  });
  const [error, setError] = useState<string | null>(null);

  // Obtener datos del usuario al cargar
  useEffect(() => {
    fetchUserData();
  }, []);

  // Función para decodificar el token JWT y obtener el ID del usuario
  const getUserIdFromToken = async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return null;
      
      console.log('Token obtenido:', token);
      
      // Decodificar el token para obtener el ID del usuario
      // Usando la importación corregida de jwt-decode
      const decoded: any = jwtDecode(token);
      console.log('Token decodificado:', decoded);
      
      return decoded.userId || null;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      
      // Alternativa manual para extraer el ID si jwt-decode falla
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return null;
        
        // Dividir el token y decodificar manualmente la parte del payload
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        console.log('Payload decodificado manualmente:', payload);
        
        return payload.userId || null;
      } catch (manualError) {
        console.error('Error al decodificar manualmente:', manualError);
        return null;
      }
    }
  };

  // Función para obtener los datos del usuario
  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        // Intentar obtener el usuario de la información de inicio de sesión
        const userInfo = await SecureStore.getItemAsync('userInfo');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          if (user && user.id) {
            console.log('Usando ID de userInfo:', user.id);
            setUserData(user);
            
            // Inicializar datos editables
            setEditableData({
              nombre: user.nombre || '',
              telefono: user.telefono || '',
              edad: user.edad ? user.edad.toString() : '',
              sexo: user.sexo || '',
              estatura: user.estatura ? user.estatura.toString() : '',
              peso: user.peso ? user.peso.toString() : '',
              ejercicio_semanal: user.ejercicio_semanal ? user.ejercicio_semanal.toString() : '',
              avatarUrl: user.avatarUrl
            });
            
            setIsLoading(false);
            return;
          }
        }
        
        throw new Error('No se pudo obtener el ID del usuario');
      }

      console.log('Obteniendo datos del usuario con ID:', userId);
      const response = await api.get(`/usuarios/${userId}`);
      
      if (response.data && (response.data.data || response.data)) {
        // Manejar diferentes formatos de respuesta
        const user = response.data.data || response.data;
        setUserData(user);
        
        // Inicializar datos editables
        setEditableData({
          nombre: user.nombre || '',
          telefono: user.telefono || '',
          edad: user.edad ? user.edad.toString() : '',
          sexo: user.sexo || '',
          estatura: user.estatura ? user.estatura.toString() : '',
          peso: user.peso ? user.peso.toString() : '',
          ejercicio_semanal: user.ejercicio_semanal ? user.ejercicio_semanal.toString() : '',
          avatarUrl: user.avatarUrl
        });
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      console.error('Error al obtener datos del usuario:', error);
      setError(error.message || 'Error al cargar los datos del perfil');
      
      // Si el error es de autenticación, redirigir al login
      if (error.response && error.response.status === 401) {
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [{ text: 'OK', onPress: handleLogout }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para guardar los cambios en el perfil
  const handleSaveProfile = async () => {
    // Validar datos antes de enviar
    if (!editableData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    
    if (!editableData.telefono.trim()) {
      Alert.alert('Error', 'El teléfono es obligatorio');
      return;
    }
    
    setIsSaving(true);
    try {
      if (!userData) throw new Error('No hay datos de usuario');
      
      // Preparar datos para actualizar
      const updateData = {
        nombre: editableData.nombre,
        telefono: editableData.telefono,
        edad: editableData.edad ? parseInt(editableData.edad) : null,
        sexo: editableData.sexo,
        estatura: editableData.estatura ? parseFloat(editableData.estatura) : null,
        peso: editableData.peso ? parseFloat(editableData.peso) : null,
        ejercicio_semanal: editableData.ejercicio_semanal ? parseInt(editableData.ejercicio_semanal) : null,
        avatarUrl: editableData.avatarUrl
      };

      // Enviar solicitud de actualización
      const response = await api.put(`/usuarios/${userData.id}`, updateData);
      
      if (response.data) {
        const updatedUser = response.data.data || response.data;
        setUserData(prev => prev ? {...prev, ...updatedUser} : updatedUser);
        
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setIsEditing(false);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert(
        'Error', 
        error.message || 'No se pudo actualizar el perfil'
      );
      
      // Si el error es de autenticación, redirigir al login
      if (error.response && error.response.status === 401) {
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [{ text: 'OK', onPress: handleLogout }]
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Función para seleccionar una imagen de la galería
  const handlePickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permisos para acceder a tu galería');
        return;
      }
      
      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Actualizar la URL local
        setEditableData({
          ...editableData,
          avatarUrl: result.assets[0].uri
        });
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sí, cerrar sesión',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('userToken');
              await SecureStore.deleteItemAsync('userInfo');
              router.replace('/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          }
        }
      ]
    );
  };

  // Renderizar pantalla de carga
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar pantalla de error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchUserData}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar pantalla principal
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Cabecera */}
          <View style={styles.header}>
            <Text style={styles.title}>Mi Perfil</Text>
            {!isEditing ? (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color="white" />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  // Restaurar datos originales
                  if (userData) {
                    setEditableData({
                      nombre: userData.nombre || '',
                      telefono: userData.telefono || '',
                      edad: userData.edad ? userData.edad.toString() : '',
                      sexo: userData.sexo || '',
                      estatura: userData.estatura ? userData.estatura.toString() : '',
                      peso: userData.peso ? userData.peso.toString() : '',
                      ejercicio_semanal: userData.ejercicio_semanal ? userData.ejercicio_semanal.toString() : '',
                      avatarUrl: userData.avatarUrl
                    });
                  }
                  setIsEditing(false);
                }}
              >
                <Ionicons name="close" size={20} color="white" />
                <Text style={styles.editButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Sección de perfil */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: editableData.avatarUrl || 'https://via.placeholder.com/150?text=Usuario'
                }} 
                style={styles.avatar} 
              />
              {isEditing && (
                <TouchableOpacity 
                  style={styles.changeAvatarButton}
                  onPress={handlePickImage}
                >
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.userName}>{userData?.nombre}</Text>
            <Text style={styles.userEmail}>{userData?.correo}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.reservasHechas || 0}</Text>
                <Text style={styles.statLabel}>Reservas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.faltas || 0}</Text>
                <Text style={styles.statLabel}>Faltas</Text>
              </View>
            </View>
          </View>
          
          {/* Sección de información personal */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editableData.nombre}
                  onChangeText={(text) => setEditableData({...editableData, nombre: text})}
                  placeholder="Tu nombre"
                />
              ) : (
                <Text style={styles.inputValue}>{userData?.nombre || 'No especificado'}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editableData.telefono}
                  onChangeText={(text) => setEditableData({...editableData, telefono: text})}
                  placeholder="Tu teléfono"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.inputValue}>{userData?.telefono || 'No especificado'}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Edad</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editableData.edad}
                  onChangeText={(text) => setEditableData({...editableData, edad: text})}
                  placeholder="Tu edad"
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.inputValue}>{userData?.edad || 'No especificado'}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sexo</Text>
              {isEditing ? (
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[
                      styles.radioButton, 
                      editableData.sexo === 'Masculino' && styles.radioButtonSelected
                    ]}
                    onPress={() => setEditableData({...editableData, sexo: 'Masculino'})}
                  >
                    <Text style={[
                      styles.radioText,
                      editableData.sexo === 'Masculino' && styles.radioTextSelected
                    ]}>Masculino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.radioButton, 
                      editableData.sexo === 'Femenino' && styles.radioButtonSelected
                    ]}
                    onPress={() => setEditableData({...editableData, sexo: 'Femenino'})}
                  >
                    <Text style={[
                      styles.radioText,
                      editableData.sexo === 'Femenino' && styles.radioTextSelected
                    ]}>Femenino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.radioButton, 
                      editableData.sexo === 'Otro' && styles.radioButtonSelected
                    ]}
                    onPress={() => setEditableData({...editableData, sexo: 'Otro'})}
                  >
                    <Text style={[
                      styles.radioText,
                      editableData.sexo === 'Otro' && styles.radioTextSelected
                    ]}>Otro</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.inputValue}>{userData?.sexo || 'No especificado'}</Text>
              )}
            </View>
          </View>
          
          {/* Sección de información física */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Física</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estatura (m)</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editableData.estatura}
                  onChangeText={(text) => setEditableData({...editableData, estatura: text})}
                  placeholder="Tu estatura en metros"
                  keyboardType="decimal-pad"
                />
              ) : (
                <Text style={styles.inputValue}>
                  {userData?.estatura ? `${userData.estatura} m` : 'No especificado'}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editableData.peso}
                  onChangeText={(text) => setEditableData({...editableData, peso: text})}
                  placeholder="Tu peso en kilogramos"
                  keyboardType="decimal-pad"
                />
              ) : (
                <Text style={styles.inputValue}>
                  {userData?.peso ? `${userData.peso} kg` : 'No especificado'}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ejercicio semanal (horas)</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editableData.ejercicio_semanal}
                  onChangeText={(text) => setEditableData({...editableData, ejercicio_semanal: text})}
                  placeholder="Horas de ejercicio a la semana"
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.inputValue}>
                  {userData?.ejercicio_semanal ? `${userData.ejercicio_semanal} horas` : 'No especificado'}
                </Text>
              )}
            </View>
          </View>
          
          {/* Botones de acción */}
          {isEditing && (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    width: '80%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  inputValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2196F3',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  radioButtonSelected: {
    backgroundColor: '#2196F3',
  },
  radioText: {
    color: '#2196F3',
  },
  radioTextSelected: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Perfil;