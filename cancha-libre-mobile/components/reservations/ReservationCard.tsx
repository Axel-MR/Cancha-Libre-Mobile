import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFallbackImageUrl, getImageLoadingOptions, getImageSource } from '../../utils/imageUtils';

// Tipos para las props
interface ReservationCardProps {
  id: string;
  fecha: Date;
  horaInicio: Date;
  horaFin: Date;
  deporte: string;
  centroDeportivo: string;
  cancha: string;
  canchaId: string;
  estado?: string;
  imagenUrl?: string | null;
  imagenBase64?: string | null; // Prop para base64
  badge?: {
    text: string;
    color: string;
  } | null;
  borderColor?: string | null;
  calificacionPromedio?: number;
  totalCalificaciones?: number;
  onPress: (id: string) => void;
  onImageError?: () => void;
}

const ReservationCard = ({
  id,
  fecha,
  horaInicio,
  horaFin,
  deporte,
  centroDeportivo,
  cancha,
  canchaId,
  estado = 'DISPONIBLE',
  imagenUrl,
  imagenBase64,
  badge = null,
  borderColor = null,
  calificacionPromedio = 0,
  totalCalificaciones = 0,
  onPress,
  onImageError
}: ReservationCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Formatear fecha y hora
  const fechaFormateada = format(fecha, 'EEEE d MMMM', { locale: es });
  const horaInicioFormateada = format(horaInicio, 'HH:mm');
  const horaFinFormateada = format(horaFin, 'HH:mm');

  // Determinar color de estado
  const getEstadoColor = () => {
    switch (estado) {
      case 'DISPONIBLE':
        return '#4CAF50';
      case 'RESERVADO':
        return '#2196F3';
      case 'CANCELADO':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  // Manejar error de carga de imagen
  const handleImageError = () => {
    console.log(`[ReservationCard] Error al cargar imagen: ${imagenUrl}`);
    setImageError(true);
    if (onImageError) {
      onImageError();
    }
  };

  // Obtener fuente de imagen, priorizando base64
  const getSource = () => {
    if (imageError) {
      return { uri: getFallbackImageUrl(imagenUrl) };
    }
    
    if (imagenBase64) {
      return { uri: imagenBase64 };
    }
    
    if (imagenUrl) {
      return { uri: imagenUrl };
    }
    
    return { uri: getFallbackImageUrl(null) };
  };

  // Renderizar estrellas para la calificación
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(calificacionPromedio);
    const halfStar = calificacionPromedio % 1 >= 0.5;
    
    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`star-full-${i}`} name="star" size={16} color="#FFD700" />
      );
    }
    
    // Media estrella si es necesario
    if (halfStar) {
      stars.push(
        <Ionicons key="star-half" name="star-half" size={16} color="#FFD700" />
      );
    }
    
    // Estrellas vacías
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`star-empty-${i}`} name="star-outline" size={16} color="#CCCCCC" />
      );
    }
    
    return stars;
  };

  // Registrar información de depuración
  if (imagenUrl) {
    console.log(`[ReservationCard] ID: ${id}, URL original: ${imagenUrl}`);
    console.log(`[ReservationCard] ID: ${id}, URL normalizada: ${imagenUrl}`);
    if (imagenBase64) {
      console.log(`[ReservationCard] ID: ${id}, Imagen base64 disponible`);
    }
  }

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        borderColor ? { borderColor: borderColor, borderWidth: 2 } : null
      ]} 
      onPress={() => onPress(id)}
      activeOpacity={0.7}
    >
      {/* Contenedor de imagen con tamaño reducido */}
      <View style={styles.imageContainer}>
        {(imagenUrl || imagenBase64) ? (
          <Image 
            source={getSource()} 
            style={styles.image}
            onError={handleImageError}
            onLoadStart={() => setIsImageLoading(true)}
            onLoadEnd={() => setIsImageLoading(false)}
            {...getImageLoadingOptions()}
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={24} color="#bbb" />
            <Text style={styles.noImageText}>Sin imagen</Text>
          </View>
        )}
        
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.deporte}>{deporte}</Text>
          <View style={[styles.estadoContainer, { backgroundColor: getEstadoColor() }]}>
            <Text style={styles.estadoText}>{estado}</Text>
          </View>
        </View>
        
        <Text style={styles.cancha} numberOfLines={1}>{cancha}</Text>
        <Text style={styles.centro} numberOfLines={1}>{centroDeportivo}</Text>
        
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          <Text style={styles.ratingText}>
            {calificacionPromedio.toFixed(1)} ({totalCalificaciones})
          </Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#666" style={styles.icon} />
            <Text style={styles.dateText}>{fechaFormateada}</Text>
          </View>
          
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#666" style={styles.icon} />
            <Text style={styles.timeText}>{horaInicioFormateada} - {horaFinFormateada}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderColor: '#eee',
    borderWidth: 1,
    height: 160, // Altura fija para la tarjeta
  },
  imageContainer: {
    width: 110, // Ancho reducido para la imagen
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 0, // Cambiado a la derecha
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 4, // Cambiado para que se vea bien en la derecha
    borderBottomLeftRadius: 4, // Cambiado para que se vea bien en la derecha
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between', // Distribuir el contenido verticalmente
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deporte: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  estadoContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  estadoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cancha: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  centro: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  footer: {
    marginTop: 'auto',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
});

export default ReservationCard;