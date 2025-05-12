import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';

// Componentes
import LogoTitle from "../../components/LogoTitle";
import FormLabel from "../../components/FormLabel";
import GenderPicker from "../../components/Gender";
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
  
      // Verificación adaptada a la estructura real de la respuesta
      // El usuario está directamente en response.data
      if (!response.data?.id || !response.data?.correo) {
        throw new Error('Respuesta incompleta del servidor');
      }
  
      // Ahora necesitamos obtener un token, dos opciones:
      // 1. Si tu API devuelve un token en otro lugar de la respuesta, úsalo
      // 2. Si no, podemos hacer un login automático para obtener el token
      
      // Opción 2: Login automático para obtener token
      const loginResponse = await api.post('/auth/login', {
        correo: formData.correo,
        clave: formData.clave
      });
      
      console.log("Respuesta de login:", loginResponse.data);
      
      if (!loginResponse.data?.token) {
        throw new Error('No se pudo obtener un token de acceso');
      }
      
      // Guardar datos
      await SecureStore.setItemAsync('userToken', loginResponse.data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data));
  
      // Redirección
      router.replace('/screens/home');
      
      // Mostrar mensaje de éxito
      Alert.alert('¡Registro exitoso!', `Bienvenido ${response.data.nombre}`);
  
    } catch (error) {
      console.error("Error de registro:", error);
      
      let errorMessage = 'Error al registrar usuario';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 409) {
        errorMessage = "Este correo electrónico ya está registrado";
      } else if (error.message) {
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
            <TextInput
              placeholder="Ej. 25"
              value={formData.edad?.toString() || ""}
              onChangeText={(val) => handleChange('edad', val)}
              style={styles.input}
              keyboardType="numeric"
            />

            <FormLabel>Sexo</FormLabel>
            <GenderPicker
              onGenderSelected={(gender) => handleChange('sexo', gender)}
              required={false}
            />

            <FormLabel>Estatura (cm)</FormLabel>
            <TextInput
              placeholder="Ej. 175"
              value={formData.estatura?.toString() || ""}
              onChangeText={(val) => handleChange('estatura', val)}
              style={styles.input}
              keyboardType="numeric"
            />

            <FormLabel>Peso (kg)</FormLabel>
            <TextInput
              placeholder="Ej. 70.5"
              value={formData.peso?.toString() || ""}
              onChangeText={(val) => handleChange('peso', val)}
              style={styles.input}
              keyboardType="numeric"
            />

            <FormLabel>Ejercicio semanal (horas)</FormLabel>
            <TextInput
              placeholder="Ej. 5"
              value={formData.ejercicio_semanal?.toString() || ""}
              onChangeText={(val) => handleChange('ejercicio_semanal', val)}
              style={styles.input}
              keyboardType="numeric"
            />

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={() => setShowOptionalForm(false)}
              >
                <Ionicons name="arrow-back" size={20} color="#2f95dc" />
                <Text style={[styles.buttonText, { color: "#2f95dc" }]}>
                  Regresar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.registerButton]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Registrarse</Text>
                    <Ionicons name="checkmark" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <FormLabel>Correo Electrónico</FormLabel>
            <TextInput
              placeholder="ejemplo@correo.com"
              value={formData.correo}
              onChangeText={(val) => handleChange('correo', val)}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <FormLabel>Contraseña</FormLabel>
            <View style={styles.passwordContainer}>
              <TextInput
                value={formData.clave}
                onChangeText={(val) => handleChange('clave', val)}
                secureTextEntry={!showPassword}
                style={styles.inputPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <FormLabel>Confirmar Contraseña</FormLabel>
            <View style={styles.passwordContainer}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                style={styles.inputPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <FormLabel>Nombre Completo</FormLabel>
            <TextInput
              placeholder="Nombre Apellido"
              value={formData.nombre}
              onChangeText={(val) => handleChange('nombre', val)}
              style={styles.input}
              autoCapitalize="words"
            />

            <FormLabel>Teléfono</FormLabel>
            <TextInput
              placeholder="10 dígitos"
              value={formData.telefono}
              onChangeText={(val) => handleChange('telefono', val)}
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <FormLabel>Clave INE</FormLabel>
            <TextInput
              placeholder="Clave de elector"
              value={formData.clave_ine}
              onChangeText={(val) => handleChange('clave_ine', val)}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={() => validateRequiredFields() && setShowOptionalForm(true)}
            >
              <Text style={styles.buttonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

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
    input: {
      height: 50,
      borderColor: "#e0e0e0",
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 15,
      borderRadius: 8,
      fontSize: 16,
      backgroundColor: "#fff",
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderColor: "#e0e0e0",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: "#fff",
      height: 50,
      marginBottom: 15,
    },
    inputPassword: {
      flex: 1,
      fontSize: 16,
    },
    eyeIcon: {
      paddingLeft: 10,
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
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 20,
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
      flex: 1,
      marginRight: 10,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "500",
      marginHorizontal: 8,
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