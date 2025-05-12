import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import LogoTitle from "../../components/LogoTitle";

// Componente MenuItem modificado con Link
const MenuItem = ({ icon, text, href }) => {
  return (
    <Link href={href} asChild>
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name={icon} size={24} color="#2f95dc" />
        <Text style={styles.menuItemText}>{text}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    </Link>
  );
};

const Home = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <LogoTitle title="CANCHA LIBRE" />
      </View>

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

      <Link href="/screens/reservas" asChild>
        <TouchableOpacity style={styles.reserveButton}>
          <Text style={styles.reserveButtonText}>Reservar Cancha</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </Link>

      <View style={styles.menuContainer}>
        <MenuItem
          icon="chatbubbles"
          text="Contáctanos"
          href="/screens/contacto"
        />
        <MenuItem
          icon="calendar"
          text="Mis Actividades"
          href="/screens/misActividades"
        />
        <MenuItem icon="list" text="Mis Reservas" href="/screens/misReservas" />
        <MenuItem icon="person" text="Mi Perfil" href="/screens/perfil" />
        <MenuItem icon="settings" text="Admin" href="/screens/adminPage" />
      </View>
    </ScrollView>
  );
};

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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
});

export default Home;
