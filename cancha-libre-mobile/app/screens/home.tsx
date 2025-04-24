import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Cambiado a useRouter
import LogoTitle from "../../components/LogoTitle";
import MenuItem from "../../components/MenuItem";

const Home = () => {
  const router = useRouter(); // Usa useRouter

  const navigateToReservas = () => {
    console.log("Intentando navegar a Reservas...");
    try {
      // Intenta sin el slash inicial
      router.push("/screens/reservas");
    } catch (error) {
      console.error("Error al navegar:", error);
      Alert.alert("Error de navegación", "No se pudo navegar a la pantalla Reservas");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <LogoTitle title="CANCHA LIBRE" />
      </View>

      {/* Mensaje principal */}
      <View style={styles.messageContainer}>
        <MaterialIcons
          name="sports-soccer"
          size={24}
          color="#2f95dc"
          style={styles.sportIcon}
        />
        <Text style={styles.welcomeMessage}>
          Reserva canchas deportivas en pocos pasos
        </Text>
        <Text style={styles.subMessage}>
          Encuentra el lugar perfecto para jugar cuando quieras
        </Text>
      </View>

      {/* Botón de reserva */}
      <TouchableOpacity
        style={styles.reserveButton}
        onPress={navigateToReservas}
      >
        <Text style={styles.reserveButtonText}>Reservar Cancha</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      {/* Menú */}
      <View style={styles.menuContainer}>
        <MenuItem
          icon="chatbubbles"
          text="Contáctanos"
          onPress={() => router.push("/screens/contacto")}
        />
        <MenuItem
          icon="calendar"
          text="Mis Actividades"
          onPress={() => router.push("/screens/misActividades")}
        />
        <MenuItem
          icon="list"
          text="Mis Reservas"
          onPress={() => router.push("/screens/misReservas")}
        />
        <MenuItem
          icon="person"
          text="Mi Perfil"
          onPress={() => router.push("/screens/perfil")}
        />
      </View>
    </ScrollView>
  );
};

// Estilos (se mantienen igual)
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  sportIcon: {
    marginBottom: 12,
  },
  welcomeMessage: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 6,
  },
  subMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  reserveButton: {
    flexDirection: "row",
    backgroundColor: "#2f95dc",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  reserveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  menuContainer: {
    marginTop: 10,
  },
});

export default Home;