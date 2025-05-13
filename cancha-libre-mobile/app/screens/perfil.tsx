import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import api from '../../services/api';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';

// Componentes
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileStats from '../../components/profile/ProfileStats';
import ProfileField from '../../components/profile/ProfileField';
import GenderSelector from '../../components/profile/GenderSelector';
import ActionButton from '../../components/profile/ActionButton';
import LoadingState from '../../components/profile/LoadingState';
import ErrorState from '../../components/profile/ErrorState';
import ProfileSection from '../../components/profile/ProfileSection';

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

// Obtener la altura de la pantalla
const screenHeight = Dimensions.get('window').height;

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

  // Función para cancelar la edición
  const handleCancelEdit = () => {
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
  };

  // Renderizar pantalla de carga
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Cargando perfil..." />
      </SafeAreaView>
    );
  }

  // Renderizar pantalla de error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message={error} onRetry={fetchUserData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          // Añadir padding inferior para evitar que el botón quede tapado
          contentInset={{ bottom: 100 }}
          contentOffset={{ x: 0, y: 0 }}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Cabecera */}
          <ProfileHeader 
            title="Mi Perfil" 
            isEditing={isEditing} 
            onEdit={() => setIsEditing(true)} 
            onCancel={handleCancelEdit} 
          />
          
          {/* Sección de perfil */}
          <View style={styles.profileSection}>
            <Text style={styles.userName}>{userData?.nombre}</Text>
            <Text style={styles.userEmail}>{userData?.correo}</Text>
            
            <ProfileStats 
              reservas={userData?.reservasHechas || 0} 
              faltas={userData?.faltas || 0} 
            />
          </View>
          
          {/* Sección de información personal */}
          <ProfileSection title="Información Personal">
            <ProfileField 
              label="Nombre"
              value={editableData.nombre}
              isEditing={isEditing}
              onChangeText={(text) => setEditableData({...editableData, nombre: text})}
              placeholder="Tu nombre"
            />
            
            <ProfileField 
              label="Teléfono"
              value={editableData.telefono}
              isEditing={isEditing}
              onChangeText={(text) => setEditableData({...editableData, telefono: text})}
              placeholder="Tu teléfono"
              keyboardType="phone-pad"
            />
            
            <ProfileField 
              label="Edad"
              value={editableData.edad}
              isEditing={isEditing}
              onChangeText={(text) => setEditableData({...editableData, edad: text})}
              placeholder="Tu edad"
              keyboardType="number-pad"
            />
            
            <GenderSelector 
              value={editableData.sexo}
              onChange={(gender) => setEditableData({...editableData, sexo: gender})}
              isEditing={isEditing}
            />
          </ProfileSection>
          
          {/* Sección de información física */}
          <ProfileSection title="Información Física">
            <ProfileField 
              label="Estatura (m)"
              value={editableData.estatura}
              isEditing={isEditing}
              onChangeText={(text) => setEditableData({...editableData, estatura: text})}
              placeholder="Tu estatura en metros"
              keyboardType="decimal-pad"
              suffix="m"
            />
            
            <ProfileField 
              label="Peso (kg)"
              value={editableData.peso}
              isEditing={isEditing}
              onChangeText={(text) => setEditableData({...editableData, peso: text})}
              placeholder="Tu peso en kilogramos"
              keyboardType="decimal-pad"
              suffix="kg"
            />
            
            <ProfileField 
              label="Ejercicio semanal (horas)"
              value={editableData.ejercicio_semanal}
              isEditing={isEditing}
              onChangeText={(text) => setEditableData({...editableData, ejercicio_semanal: text})}
              placeholder="Horas de ejercicio a la semana"
              keyboardType="number-pad"
              suffix="horas"
            />
          </ProfileSection>
          
          {/* Botones de acción */}
          {isEditing && (
            <ActionButton 
              title="Guardar Cambios"
              onPress={handleSaveProfile}
              icon="save-outline"
              color="#4CAF50"
              isLoading={isSaving}
            />
          )}
          
          <ActionButton 
            title="Cerrar Sesión"
            onPress={handleLogout}
            icon="log-out-outline"
            color="#F44336"
          />
          
          {/* Espacio adicional al final para evitar que el botón quede tapado */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    // Añadir padding inferior para evitar que el botón quede tapado
    paddingBottom: Platform.OS === 'ios' ? 120 : 150,
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
  // Espacio adicional al final del ScrollView
  bottomSpacer: {
    height: 80, // Ajusta este valor según sea necesario
  }
});

export default Perfil;