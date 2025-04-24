import React, { useState } from "react";
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import api from "../../services/api"; // Asegúrate de importar tu instancia de api
import LogoTitle from "../../components/LogoTitle";
import FormLabel from "../../components/FormLabel";
import OrangeCirclesFooter from "../../components/OrangeCirclesFooter";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    // Validación básica de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return;
    }

    setLoading(true);

    try {
      // Llamada real a la API
      const response = await api.post('/auth/login', {
        correo: email,
        clave: password
      });

      if (response.token && response.usuario) {
        // Guardar token y datos de usuario
        await Promise.all([
          SecureStore.setItemAsync('userToken', response.token),
          SecureStore.setItemAsync('userData', JSON.stringify(response.usuario))
        ]);
        
        // Redirigir al home y limpiar stack
        router.replace("/screens/home");
        
        Alert.alert(
          "Bienvenido",
          `Hola ${response.usuario.nombre}`,
          [{ text: "Continuar" }]
        );
      } else {
        throw new Error("Respuesta inesperada del servidor");
      }
    } catch (error: any) {
      console.error("Error de autenticación:", error);
      
      let errorMessage = "Error al iniciar sesión. Por favor intenta nuevamente.";
      
      if (error.response) {
        // Manejo de errores específicos del backend
        if (error.response.status === 401) {
          errorMessage = "Credenciales incorrectas";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Problema de conexión. Verifica tu internet";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/screens/registro");
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <LogoTitle title="INICIAR SESIÓN" />

        <FormLabel>Correo Electrónico</FormLabel>
        <TextInput
          placeholder="ejemplo@correo.com"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <FormLabel>Contraseña</FormLabel>
        <View style={styles.passwordContainer}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.inputPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
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

        {loading ? (
          <ActivityIndicator size="large" color="#2f95dc" />
        ) : (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.registerLink}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerText}>
            ¿No tienes cuenta?{" "}
            <Text style={styles.registerHighlight}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </View>
      
      <OrangeCirclesFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff', 
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
  loginButton: {
    backgroundColor: '#2f95dc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 25,
    alignItems: "center",
    marginBottom: 80,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerHighlight: {
    color: "#2f95dc",
    fontWeight: "500",
  },
});