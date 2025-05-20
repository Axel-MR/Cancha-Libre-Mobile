import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './StarRating';
import RatingDisplay from './RatingDisplay';

interface ReservationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: any;
  centroDeportivo: any;
  cancha: any;
  actions?: {
    primary?: {
      text: string;
      onPress: () => void;
      color?: string;
    };
    secondary?: {
      text: string;
      onPress: () => void;
      color?: string;
    };
  };
  badge?: {
    text: string;
    color: string;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  title?: string;
  // Nuevos props para calificaciones
  userRating?: number;
  onRateCancha?: (canchaId: string, rating: number) => Promise<void>;
  isRatingEnabled?: boolean;
}

const ReservationDetailModal = ({
  visible,
  onClose,
  reservation,
  centroDeportivo,
  cancha,
  actions,
  badge,
  title = "Detalle de Reserva",
  // Nuevos props para calificaciones
  userRating = 0,
  onRateCancha,
  isRatingEnabled = false
}: ReservationDetailModalProps) => {
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [currentRating, setCurrentRating] = useState(userRating);
  
  if (!reservation) return null;

  const handleRatingChange = async (rating: number) => {
    if (!onRateCancha || !cancha?.id) return;
    
    setCurrentRating(rating);
    setIsSubmittingRating(true);
    
    try {
      await onRateCancha(cancha.id, rating);
      Alert.alert(
        "Calificación Enviada",
        "¡Gracias por calificar esta cancha!",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      Alert.alert(
        "Error",
        "No se pudo enviar tu calificación. Inténtalo de nuevo más tarde.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          {badge && (
            <View style={[styles.modalBadge, { backgroundColor: badge.color }]}>
              {badge.icon && <Ionicons name={badge.icon} size={16} color="white" />}
              <Text style={styles.modalBadgeText}>{badge.text}</Text>
            </View>
          )}
          
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Centro Deportivo:</Text>
            <Text style={styles.modalText}>{centroDeportivo?.nombre || 'Desconocido'}</Text>
            <Text style={styles.modalText}>{centroDeportivo?.ubicacion || 'Ubicación no disponible'}</Text>
          </View>
          
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Cancha:</Text>
            <View style={styles.canchaHeaderRow}>
              <Text style={styles.modalText}>
                {cancha?.nombre || 'Desconocida'} ({cancha?.deporte || 'Deporte no especificado'})
              </Text>
              
              {/* Mostrar calificación promedio si existe */}
              {cancha?.calificacionPromedio > 0 && (
                <RatingDisplay 
                  rating={cancha.calificacionPromedio} 
                  totalRatings={cancha.totalCalificaciones}
                  size={14}
                />
              )}
            </View>
            
            {cancha && (
              <Text style={styles.modalText}>
                Para {cancha.jugadores} jugadores - {cancha.alumbrado ? 'Con alumbrado' : 'Sin alumbrado'}
              </Text>
            )}
          </View>
          
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Fecha y Hora:</Text>
            <Text style={styles.modalText}>
              {format(new Date(reservation.fecha), 'EEEE, d MMMM yyyy', { locale: es })}
            </Text>
            <Text style={styles.modalText}>
              {format(new Date(reservation.horaInicio), 'HH:mm')} - {format(new Date(reservation.horaFin), 'HH:mm')}
            </Text>
          </View>
          
          {reservation.estado && (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Estado:</Text>
              <Text style={[
                styles.modalEstadoText, 
                reservation.estado === 'RESERVADO' ? styles.estadoReservado : 
                reservation.estado === 'CANCELADO' ? styles.estadoCancelado : 
                styles.estadoOtro
              ]}>
                {reservation.estado}
              </Text>
            </View>
          )}
          
          {reservation.objetosRentados && reservation.objetosRentados.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Objetos Rentados:</Text>
              {reservation.objetosRentados.map((objeto: any, index: number) => (
                <Text key={index} style={styles.modalText}>
                  {objeto.nombre} (x{objeto.cantidad})
                </Text>
              ))}
            </View>
          )}
          
          {/* Sección de calificación */}
          {isRatingEnabled && (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Califica esta Cancha:</Text>
              <View style={styles.ratingContainer}>
                <StarRating
                  rating={currentRating}
                  size={32}
                  disabled={isSubmittingRating}
                  onRatingChange={handleRatingChange}
                />
                <Text style={styles.ratingHelpText}>
                  {currentRating > 0 
                    ? `Tu calificación: ${currentRating.toFixed(1)}`
                    : "Toca las estrellas para calificar"}
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.modalButtonsContainer}>
            {actions?.primary && (
              <TouchableOpacity
                style={[
                  styles.buttonPrimary,
                  actions.primary.color ? { backgroundColor: actions.primary.color } : null,
                  !actions.secondary ? { width: '100%' } : { flex: 1, marginRight: 8 }
                ]}
                onPress={actions.primary.onPress}
              >
                <Text style={styles.buttonText}>{actions.primary.text}</Text>
              </TouchableOpacity>
            )}
            
            {actions?.secondary && (
              <TouchableOpacity
                style={[
                  styles.buttonSecondary,
                  actions.secondary.color ? { backgroundColor: actions.secondary.color } : null,
                  !actions.primary ? { width: '100%' } : { flex: 1, marginLeft: 8 }
                ]}
                onPress={actions.secondary.onPress}
              >
                <Text style={styles.buttonText}>{actions.secondary.text}</Text>
              </TouchableOpacity>
            )}
            
            {!actions?.primary && !actions?.secondary && (
              <TouchableOpacity
                style={[styles.buttonSecondary, { width: '100%' }]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cerrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalSection: {
    marginBottom: 15,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2196F3',
  },
  canchaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 3,
  },
  modalEstadoText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  estadoReservado: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
  },
  estadoCancelado: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  estadoOtro: {
    backgroundColor: '#F5F5F5',
    color: '#757575',
  },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  ratingHelpText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReservationDetailModal;