import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { router } from "expo-router"
import LogoTitle from "../../components/LogoTitle"

export default function AdminPage() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LogoTitle title="ADMIN" />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/screens/crearCentroDeportivo")}
        >
          <Text style={styles.buttonText}>Crear Centro Deportivo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/screens/crearReserva")}
        >
          <Text style={styles.buttonText}>Crear Reserva</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/screens/adminCentrosDeportivos")}
        >
          <Text style={styles.buttonText}>Editar Centros Deportivo</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 15,
    backgroundColor: "#2f95dc",
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
})
