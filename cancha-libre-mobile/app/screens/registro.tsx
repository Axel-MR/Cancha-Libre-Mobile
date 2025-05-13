import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';

// Components
import LogoTitle from "../../components/LogoTitle";
import FormLabel from "../../components/FormLabel";
import GenderPicker from "../../components/Gender";
import FormInput from "../../components/register/FormInput";
import PasswordInput from "../../components/register/PasswordInput";
import ActionButton from "../../components/register/ActionButton";
import api from '../../services/api';

type RegisterData = {
  correo: string;
  clave: string;
  nombre: string;
  telefono: string;
  clave_ine: string;
  edad?: number;
  sexo?: string;
  estatura?: number;
  peso?: number;
  ejercicio_semanal?: number;
};

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOptionalForm, setShowOptionalForm] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    correo: "",
    clave: "",
    nombre: "",
    telefono: "",
    clave_ine: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateRequiredFields = () => {
    const { correo, clave, nombre, telefono, clave_ine } = formData;
  
    if (!correo || !clave || !nombre || !telefono || !clave_ine) {
      Alert.alert("Error", "Por favor completa todos los campos obligatorios");
      return false;
    }
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return false;
    }
  
    if (clave.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
  
    if (clave !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }
  
    if (!/^[0-9]{10}$/.test(telefono)) {
      Alert.alert("Error", "El teléfono debe tener 10 dígitos");
      return false;
    }
  
    return true;
  };
const handleRegister = async () => {
  if (!validateRequiredFields()) return;

  setLoading(true);

  try {
    console.log("Enviando solicitud de registro...");
    
    // Preparar datos para enviar
    const userData = {
      correo: formData.correo,
      clave: formData.clave,
      nombre: formData.nombre,
      telefono: formData.telefono,
      clave_ine: formData.clave_ine,
      rol: 'usuario'
    };
    
    // Agregar campos opcionales si tienen valor
    if (formData.edad) userData.edad = parseInt(formData.edad.toString());
    if (formData.sexo) userData.sexo = formData.sexo;
    if (formData.estatura) userData.estatura = parseFloat(formData.estatura.toString());
    if (formData.peso) userData.peso = parseFloat(formData.peso.toString());
    if (formData.ejercicio_semanal) userData.ejercicio_semanal = parseInt(formData.ejercicio_semanal.toString());

    console.log("Datos a enviar:", userData);
    
    const response = await api.post('/auth/registro', userData);
    console.log("Respuesta completa:", response.data);

    // Verificar si la respuesta tiene la estructura esperada
    if (!response.data?.success || !response.data?.token || !response.data?.usuario) {
      throw new Error('Respuesta incompleta del servidor');
    }

    // Extraer los datos del usuario y el token
    const { token, usuario } = response.data;
    
    // No es necesario hacer login adicional ya que el servidor ya devuelve el token
    
    // Guardar datos
    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(usuario));

    // Redirección
    router.replace('/screens/home');
    
    // Mostrar mensaje de éxito
    Alert.alert('¡Registro exitoso!', `Bienvenido ${usuario.nombre}`);

  } catch (error) {
    console.error("Error de registro:", error);
    
    let errorMessage = 'Error al registrar usuario';
    
    // Manejar respuestas de error específicas
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.log("Error de respuesta:", error.response.status, error.response.data);
      
      if (error.response.status === 409) {
        errorMessage = "Este correo electrónico ya está registrado";
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      console.log("Error de solicitud:", error.request);
      errorMessage = "No se pudo conectar con el servidor";
    } else {
      // Algo ocurrió al configurar la solicitud
      console.log("Error:", error.message);
      errorMessage = error.message;
    }

    Alert.alert('Error', errorMessage);
  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <LogoTitle title={showOptionalForm ? "DATOS ADICIONALES" : "REGISTRO"} />

        {showOptionalForm ? (
          <>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Estos datos son opcionales. Puedes completarlos ahora o más tarde.
              </Text>
            </View>

            <FormLabel>Edad</FormLabel>
            <FormInput
              placeholder="Ej. 25"
              value={formData.edad?.toString() || ""}
              onChangeText={(val) => handleChange('edad', val)}
              keyboardType="numeric"
            />

            <FormLabel>Sexo</FormLabel>
            <GenderPicker
              onGenderSelected={(gender) => handleChange('sexo', gender)}
              required={false}
            />

            <FormLabel>Estatura (cm)</FormLabel>
            <FormInput
              placeholder="Ej. 175"
              value={formData.estatura?.toString() || ""}
              onChangeText={(val) => handleChange('estatura', val)}
              keyboardType="numeric"
            />

            <FormLabel>Peso (kg)</FormLabel>
            <FormInput
              placeholder="Ej. 70.5"
              value={formData.peso?.toString() || ""}
              onChangeText={(val) => handleChange('peso', val)}
              keyboardType="numeric"
            />

            <FormLabel>Ejercicio semanal (horas)</FormLabel>
            <FormInput
              placeholder="Ej. 5"
              value={formData.ejercicio_semanal?.toString() || ""}
              onChangeText={(val) => handleChange('ejercicio_semanal', val)}
              keyboardType="numeric"
            />

            <View style={styles.buttonsContainer}>
              <ActionButton
                title="Regresar"
                onPress={() => setShowOptionalForm(false)}
                style={styles.backButton}
                textStyle={{ color: "#2f95dc" }}
                iconName="arrow-back"
                iconPosition="left"
                iconColor="#2f95dc"
              />

              <ActionButton
                title="Registrarse"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
                iconName="checkmark"
              />
            </View>
          </>
        ) : (
          <>
            <FormLabel>Correo Electrónico</FormLabel>
            <FormInput
              placeholder="ejemplo@correo.com"
              value={formData.correo}
              onChangeText={(val) => handleChange('correo', val)}
              keyboardType="email-address"
            />

            <FormLabel>Contraseña</FormLabel>
            <PasswordInput
              value={formData.clave}
              onChangeText={(val) => handleChange('clave', val)}
            />

            <FormLabel>Confirmar Contraseña</FormLabel>
            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <FormLabel>Nombre Completo</FormLabel>
            <FormInput
              placeholder="Nombre Apellido"
              value={formData.nombre}
              onChangeText={(val) => handleChange('nombre', val)}
              autoCapitalize="words"
            />

            <FormLabel>Teléfono</FormLabel>
            <FormInput
              placeholder="10 dígitos"
              value={formData.telefono}
              onChangeText={(val) => handleChange('telefono', val)}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <FormLabel>Clave INE</FormLabel>
            <FormInput
              placeholder="Clave de elector"
              value={formData.clave_ine}
              onChangeText={(val) => handleChange('clave_ine', val)}
            />

            <ActionButton
              title="Continuar"
              onPress={() => validateRequiredFields() && setShowOptionalForm(true)}
              style={styles.continueButton}
              iconName="arrow-forward"
            />

            <TouchableOpacity 
              onPress={() => router.push("/screens/login")}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                ¿Ya tienes cuenta?{" "}
                <Text style={styles.loginHighlight}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  warningBox: {
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA000",
  },
  warningText: {
    color: "#5D4037",
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: "#2f95dc",
  },
  registerButton: {
    backgroundColor: "#2f95dc",
    flex: 1,
    marginLeft: 10,
  },
  backButton: {
    borderWidth: 1,
    borderColor: "#2f95dc",
    backgroundColor: "transparent",
    flex: 1,
    marginRight: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginHighlight: {
    color: "#2f95dc",
    fontWeight: "500",
  },
});