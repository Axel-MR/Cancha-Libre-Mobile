import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { KeyboardAvoidingView, Platform } from "react-native";
import api from "../../services/api"; // Importación del API
import axios from "axios"; // Importar axios directamente como respaldo
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

    // Validación mejorada de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return;
    }

    setLoading(true);

    try {
      console.log("Intentando hacer login...");

      // Verificar si api está definido correctamente
      let response;
      if (!api || typeof api.post !== "function") {
        console.log(
          "Usando axios directamente porque api.post no está disponible"
        );
        response = await axios.post(
          "http://192.168.100.13:3000/api/auth/login",
          {
            correo: email,
            clave: password,
          }
        );
      } else {
        console.log("Usando la instancia api configurada");
        response = await api.post("/auth/login", {
          correo: email,
          clave: password,
        });
      }

      console.log("Respuesta recibida:", response.data);

      // Verificación más robusta de la respuesta
      if (!response.data?.token || !response.data?.usuario) {
        throw new Error("Respuesta incompleta del servidor");
      }

      // Guardar token y datos de usuario
      await Promise.all([
        SecureStore.setItemAsync("userToken", response.data.token),
        SecureStore.setItemAsync(
          "userInfo",
          JSON.stringify(response.data.usuario)
        ), // Cambiado de 'userData' a 'userInfo'
      ]);

      // Redirigir al home sin posibilidad de volver atrás
      router.replace("/screens/home");

      // Mostrar bienvenida
      Alert.alert("Bienvenido", `Hola ${response.data.usuario.nombre}!`, [
        { text: "Continuar" },
      ]);
    } catch (error) {
      console.error("Error de autenticación:", error);

      let errorMessage =
        "Error al iniciar sesión. Por favor intenta nuevamente.";

      // Manejo mejorado de errores
      if (error.response?.status === 401) {
        errorMessage = "Credenciales incorrectas";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.isNetworkError) {
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
  <KeyboardAvoidingView
    style={styles.contentContainer}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // ajusta si usas header
  >
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
  </KeyboardAvoidingView>

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
  loginButton: {
    backgroundColor: "#2f95dc",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
