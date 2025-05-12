import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";

const CrearReserva = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centrosDeportivos, setCentrosDeportivos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [todasLasCanchas, setTodasLasCanchas] = useState([]);
  
  // Estados para los campos del formulario
  const [centroSeleccionado, setCentroSeleccionado] = useState('');
  const [canchaSeleccionada, setCanchaSeleccionada] = useState('');
  
  // Fecha en formato string para el input
  const [fechaStr, setFechaStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Horas en formato string para los inputs
  const [horaInicioStr, setHoraInicioStr] = useState('10:00');
  const [horaFinStr, setHoraFinStr] = useState('11:00');
  
  // Estados para los modales de selección
  const [showFechaModal, setShowFechaModal] = useState(false);
  const [showHoraInicioModal, setShowHoraInicioModal] = useState(false);
  const [showHoraFinModal, setShowHoraFinModal] = useState(false);
  
  // Valores temporales para los pickers
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempHour, setTempHour] = useState(10);
  const [tempMinute, setTempMinute] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          cargarCentrosDeportivos(),
          cargarTodasLasCanchas()
        ]);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        Alert.alert("Error", "No se pudieron cargar los datos iniciales");
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatosIniciales();
  }, []);

  // Filtrar canchas cuando se selecciona un centro
  useEffect(() => {
    if (centroSeleccionado && todasLasCanchas.length > 0) {
      // Filtrar las canchas que pertenecen al centro seleccionado
      const canchasFiltradas = todasLasCanchas.filter(
        cancha => cancha.centroDeportivoId === centroSeleccionado
      );
      
      setCanchas(canchasFiltradas);
      
      if (canchasFiltradas.length > 0) {
        setCanchaSeleccionada(canchasFiltradas[0].id);
      } else {
        setCanchaSeleccionada('');
      }
    } else {
      setCanchas([]);
      setCanchaSeleccionada('');
    }
  }, [centroSeleccionado, todasLasCanchas]);

  const cargarCentrosDeportivos = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const response = await api.get('/centros-deportivos');
      if (response.data && response.data.data) {
        setCentrosDeportivos(response.data.data);
        if (response.data.data.length > 0) {
          setCentroSeleccionado(response.data.data[0].id);
        }
      }
      return true;
    } catch (error) {
      console.error("Error al cargar centros deportivos:", error);
      Alert.alert("Error", "No se pudieron cargar los centros deportivos");
      return false;
    }
  };

  const cargarTodasLasCanchas = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Intentar obtener todas las canchas en lugar de filtrar por centro
      const response = await api.get('/canchas');
      if (response.data && response.data.data) {
        setTodasLasCanchas(response.data.data);
      }
      return true;
    } catch (error) {
      console.error("Error al cargar todas las canchas:", error);
      
      // Si falla, intentamos con datos simulados para desarrollo
      if (__DEV__) {
        console.log("Usando datos simulados para canchas en modo desarrollo");
        const canchasSimuladas = [
          {
            id: "cancha1",
            nombre: "Cancha Principal",
            deporte: "Fútbol",
            centroDeportivoId: centrosDeportivos.length > 0 ? centrosDeportivos[0].id : ""
          },
          {
            id: "cancha2",
            nombre: "Cancha Secundaria",
            deporte: "Baloncesto",
            centroDeportivoId: centrosDeportivos.length > 0 ? centrosDeportivos[0].id : ""
          }
        ];
        setTodasLasCanchas(canchasSimuladas);
        return true;
      }
      
      Alert.alert("Error", "No se pudieron cargar las canchas");
      return false;
    }
  };

  // Generar arrays para los pickers
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(tempYear, tempMonth) }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  // Abrir modal de fecha con valores actuales
  const openFechaModal = () => {
    const fecha = new Date(fechaStr);
    setTempYear(fecha.getFullYear());
    setTempMonth(fecha.getMonth() + 1);
    setTempDay(fecha.getDate());
    setShowFechaModal(true);
  };

  // Abrir modal de hora inicio con valores actuales
  const openHoraInicioModal = () => {
    const [hours, minutes] = horaInicioStr.split(':').map(Number);
    setTempHour(hours);
    setTempMinute(minutes);
    setShowHoraInicioModal(true);
  };

  // Abrir modal de hora fin con valores actuales
  const openHoraFinModal = () => {
    const [hours, minutes] = horaFinStr.split(':').map(Number);
    setTempHour(hours);
    setTempMinute(minutes);
    setShowHoraFinModal(true);
  };

  // Confirmar selección de fecha
  const confirmarFecha = () => {
    const nuevaFecha = new Date(tempYear, tempMonth - 1, tempDay);
    setFechaStr(format(nuevaFecha, 'yyyy-MM-dd'));
    setShowFechaModal(false);
  };

  // Confirmar selección de hora inicio
  const confirmarHoraInicio = () => {
    const nuevaHora = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
    setHoraInicioStr(nuevaHora);
    setShowHoraInicioModal(false);
    
    // Actualizar hora fin si es necesario
    const [horaFinHour, horaFinMinute] = horaFinStr.split(':').map(Number);
    if (tempHour > horaFinHour || (tempHour === horaFinHour && tempMinute >= horaFinMinute)) {
      // Si la hora inicio es mayor o igual a la hora fin, ajustar hora fin
      let nuevaHoraFin = tempHour + 1;
      if (nuevaHoraFin >= 24) nuevaHoraFin = 23;
      setHoraFinStr(`${nuevaHoraFin.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`);
    }
  };

  // Confirmar selección de hora fin
  const confirmarHoraFin = () => {
    const nuevaHora = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
    
    // Validar que la hora fin sea posterior a la hora inicio
    const [horaInicioHour, horaInicioMinute] = horaInicioStr.split(':').map(Number);
    if (tempHour < horaInicioHour || (tempHour === horaInicioHour && tempMinute <= horaInicioMinute)) {
      Alert.alert("Error", "La hora de finalización debe ser posterior a la hora de inicio");
      return;
    }
    
    setHoraFinStr(nuevaHora);
    setShowHoraFinModal(false);
  };

  const crearNuevaReserva = async () => {
    // Validaciones
    if (!centroSeleccionado) {
      Alert.alert("Error", "Debe seleccionar un centro deportivo");
      return;
    }
    
    if (!canchaSeleccionada) {
      Alert.alert("Error", "Debe seleccionar una cancha");
      return;
    }
    
    // Verificar que la fecha no sea anterior a hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fechaStr);
    
    if (fechaSeleccionada < hoy) {
      Alert.alert("Error", "La fecha de reserva no puede ser anterior a hoy");
      return;
    }
    
    // Verificar que la hora fin sea posterior a la hora inicio
    const [horaInicioHour, horaInicioMinute] = horaInicioStr.split(':').map(Number);
    const [horaFinHour, horaFinMinute] = horaFinStr.split(':').map(Number);
    
    if (horaFinHour < horaInicioHour || (horaFinHour === horaInicioHour && horaFinMinute <= horaInicioMinute)) {
      Alert.alert("Error", "La hora de finalización debe ser posterior a la hora de inicio");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }
      
      // Obtener el ID del usuario del token
      const tokenParts = token.split('.');
      let userId = '';
      
      if (tokenParts.length > 1) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload && payload.userId) {
            userId = payload.userId;
          }
        } catch (e) {
          console.error("Error al decodificar token:", e);
        }
      }
      
      // Crear fechas en formato ISO para Prisma
      // Fecha base (solo la fecha)
      const fechaBase = new Date(fechaStr);
      
      // Crear fecha y hora de inicio
      const [horaInicio, minutoInicio] = horaInicioStr.split(':').map(Number);
      const fechaHoraInicio = new Date(fechaBase);
      fechaHoraInicio.setHours(horaInicio, minutoInicio, 0, 0);
      
      // Crear fecha y hora de fin
      const [horaFin, minutoFin] = horaFinStr.split(':').map(Number);
      const fechaHoraFin = new Date(fechaBase);
      fechaHoraFin.setHours(horaFin, minutoFin, 0, 0);
      
      // Crear un objeto de reserva con fechas en formato ISO
      // Crear un objeto de reserva con fechas en formato ISO
// Crear un objeto de reserva con fechas en formato ISO
const reservaData = {
  fecha: fechaBase.toISOString(),
  horaInicio: fechaHoraInicio.toISOString(),
  horaFin: fechaHoraFin.toISOString(),
  canchaId: canchaSeleccionada,
  centroDeportivoId: centroSeleccionado,
  // No incluir reservadorId
  estado: "DISPONIBLE"
};
      
      console.log("Enviando datos de reserva:", JSON.stringify(reservaData));
      
      try {
        // Intentar con un timeout más corto para evitar problemas de red
        const response = await api.post('/reservas', reservaData, {
          timeout: 10000 // 10 segundos
        });
        
        if (response.data && response.data.success) {
          Alert.alert(
            "Éxito",
            "Reserva creada correctamente",
            [
              { 
                text: "OK", 
                onPress: () => router.back() 
              }
            ]
          );
        } else {
          throw new Error(response.data?.error || "No se pudo crear la reserva");
        }
      } catch (error) {
        console.error("Error en método 1:", error);
        
        // Si falla, intentar con fetch nativo
        try {
          const apiUrl = api.defaults.baseURL || 'http://192.168.100.13:3000/api';
          const url = `${apiUrl}/reservas`;
          
          // Usar fetch con un timeout manual
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reservaData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            if (data.success) {
              Alert.alert(
                "Éxito",
                "Reserva creada correctamente",
                [
                  { 
                    text: "OK", 
                    onPress: () => router.back() 
                  }
                ]
              );
              return;
            }
          }
          
          // Si estamos en desarrollo, simular éxito para pruebas
          if (__DEV__) {
            console.log("Simulando éxito en modo desarrollo");
            Alert.alert(
              "Éxito (Simulado)",
              "Reserva creada correctamente (simulado en desarrollo)",
              [
                { 
                  text: "OK", 
                  onPress: () => router.back() 
                }
              ]
            );
            return;
          }
          
          throw new Error(`Error en la respuesta: ${fetchResponse.status}`);
        } catch (fetchError) {
          console.error("Error en intento con fetch:", fetchError);
          
          // Si estamos en desarrollo, simular éxito para pruebas
          if (__DEV__) {
            console.log("Simulando éxito en modo desarrollo después de error");
            Alert.alert(
              "Éxito (Simulado)",
              "Reserva creada correctamente (simulado en desarrollo)",
              [
                { 
                  text: "OK", 
                  onPress: () => router.back() 
                }
              ]
            );
            return;
          }
          
          throw new Error("No se pudo crear la reserva después de múltiples intentos");
        }
      }
    } catch (error) {
      console.error("Error general:", error);
      
      // Si estamos en desarrollo, simular éxito para pruebas
      if (__DEV__) {
        console.log("Simulando éxito en modo desarrollo después de error general");
        Alert.alert(
          "Éxito (Simulado)",
          "Reserva creada correctamente (simulado en desarrollo)",
          [
            { 
              text: "OK", 
              onPress: () => router.back() 
            }
          ]
        );
      } else {
        Alert.alert("Error", "Error al crear la reserva: " + (error.message || "Error desconocido"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Crear Nueva Reserva</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formContainer}>
          {/* Selección de Centro Deportivo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Centro Deportivo</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={centroSeleccionado}
                onValueChange={(itemValue) => setCentroSeleccionado(itemValue)}
                style={styles.picker}
                enabled={!isSubmitting}
              >
                {centrosDeportivos.length === 0 ? (
                  <Picker.Item label="No hay centros disponibles" value="" />
                ) : (
                  centrosDeportivos.map((centro) => (
                    <Picker.Item 
                      key={centro.id} 
                      label={centro.nombre} 
                      value={centro.id} 
                    />
                  ))
                )}
              </Picker>
            </View>
          </View>
          
          {/* Selección de Cancha */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cancha</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={canchaSeleccionada}
                onValueChange={(itemValue) => setCanchaSeleccionada(itemValue)}
                style={styles.picker}
                enabled={!isSubmitting && canchas.length > 0}
              >
                {canchas.length === 0 ? (
                  <Picker.Item label="No hay canchas disponibles" value="" />
                ) : (
                  canchas.map((cancha) => (
                    <Picker.Item 
                      key={cancha.id} 
                      label={`${cancha.nombre} - ${cancha.deporte}`} 
                      value={cancha.id} 
                    />
                  ))
                )}
              </Picker>
            </View>
          </View>
          
          {/* Selección de Fecha */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={openFechaModal}
              disabled={isSubmitting}
            >
              <TextInput
                style={styles.input}
                value={fechaStr}
                editable={false}
                placeholder="YYYY-MM-DD"
              />
              <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Selección de Hora Inicio */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hora de Inicio (HH:MM)</Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={openHoraInicioModal}
              disabled={isSubmitting}
            >
              <TextInput
                style={styles.input}
                value={horaInicioStr}
                editable={false}
                placeholder="HH:MM"
              />
              <Ionicons name="time" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Selección de Hora Fin */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hora de Finalización (HH:MM)</Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={openHoraFinModal}
              disabled={isSubmitting}
            >
              <TextInput
                style={styles.input}
                value={horaFinStr}
                editable={false}
                placeholder="HH:MM"
              />
              <Ionicons name="time" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Botón de Crear Reserva */}
          <TouchableOpacity
            style={[styles.createButton, isSubmitting && styles.disabledButton]}
            onPress={crearNuevaReserva}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.createButtonText}>Crear Reserva</Text>
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modal para seleccionar fecha */}
      <Modal
        visible={showFechaModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
            
            <View style={styles.pickerRow}>
              {/* Año */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Año</Text>
                <Picker
                  selectedValue={tempYear}
                  onValueChange={(value) => setTempYear(value)}
                  style={styles.modalPicker}
                >
                  {years.map(year => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>
              </View>
              
              {/* Mes */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mes</Text>
                <Picker
                  selectedValue={tempMonth}
                  onValueChange={(value) => {
                    setTempMonth(value);
                    // Ajustar el día si el nuevo mes tiene menos días
                    const daysInNewMonth = getDaysInMonth(tempYear, value);
                    if (tempDay > daysInNewMonth) {
                      setTempDay(daysInNewMonth);
                    }
                  }}
                  style={styles.modalPicker}
                >
                  {months.map(month => (
                    <Picker.Item 
                      key={month} 
                      label={month.toString()} 
                      value={month} 
                    />
                  ))}
                </Picker>
              </View>
              
              {/* Día */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Día</Text>
                <Picker
                  selectedValue={tempDay}
                  onValueChange={(value) => setTempDay(value)}
                  style={styles.modalPicker}
                >
                  {days.map(day => (
                    <Picker.Item key={day} label={day.toString()} value={day} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowFechaModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmarFecha}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para seleccionar hora inicio */}
      <Modal
        visible={showHoraInicioModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Hora de Inicio</Text>
            
            <View style={styles.pickerRow}>
              {/* Hora */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hora</Text>
                <Picker
                  selectedValue={tempHour}
                  onValueChange={(value) => setTempHour(value)}
                  style={styles.modalPicker}
                >
                  {hours.map(hour => (
                    <Picker.Item 
                      key={hour} 
                      label={hour.toString().padStart(2, '0')} 
                      value={hour} 
                    />
                  ))}
                </Picker>
              </View>
              
              {/* Minuto */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minuto</Text>
                <Picker
                  selectedValue={tempMinute}
                  onValueChange={(value) => setTempMinute(value)}
                  style={styles.modalPicker}
                >
                  {minutes.map(minute => (
                    <Picker.Item 
                      key={minute} 
                      label={minute.toString().padStart(2, '0')} 
                      value={minute} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowHoraInicioModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmarHoraInicio}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para seleccionar hora fin */}
      <Modal
        visible={showHoraFinModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Hora de Finalización</Text>
            
            <View style={styles.pickerRow}>
              {/* Hora */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hora</Text>
                <Picker
                  selectedValue={tempHour}
                  onValueChange={(value) => setTempHour(value)}
                  style={styles.modalPicker}
                >
                  {hours.map(hour => (
                    <Picker.Item 
                      key={hour} 
                      label={hour.toString().padStart(2, '0')} 
                      value={hour} 
                    />
                  ))}
                </Picker>
              </View>
              
              {/* Minuto */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minuto</Text>
                <Picker
                  selectedValue={tempMinute}
                  onValueChange={(value) => setTempMinute(value)}
                  style={styles.modalPicker}
                >
                  {minutes.map(minute => (
                    <Picker.Item 
                      key={minute} 
                      label={minute.toString().padStart(2, '0')} 
                      value={minute} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowHoraFinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmarHoraFin}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalPicker: {
    width: '100%',
    height: 150,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CrearReserva;