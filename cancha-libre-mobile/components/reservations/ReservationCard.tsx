import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';

interface ReservationCardProps {
  id: string;
  fecha: Date;
  horaInicio: Date;
  horaFin: Date;
  deporte: string;
  centroDeportivo: string;
  cancha: string;
  estado?: string;
  imagenUrl?: string;
  badge?: {
    text: string;
    color: string;
  };
  borderColor?: string;
  onPress: (id: string) => void;
}

const ReservationCard = ({
  id,
  fecha,
  horaInicio,
  horaFin,
  deporte,
  centroDeportivo,
  cancha,
  estado,
  imagenUrl,
  badge,
  borderColor,
  onPress
}: ReservationCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSource, setImageSource] = useState<any>(null);

  // Función para obtener una imagen por defecto según el deporte
  const getDefaultImage = () => {
    const deporteLower = deporte.toLowerCase();
    if (deporteLower.includes('futbol') || deporteLower.includes('fútbol')) {
      return 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1000';
    } else if (deporteLower.includes('basquet') || deporteLower.includes('básquet') || deporteLower.includes('basket')) {
      return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000';
    } else if (deporteLower.includes('tenis')) {
      return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1000';
    } else {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000';
    }
  };

  // Configurar la fuente de la imagen
  useEffect(() => {
    // Depuración: Imprimir la URL de la imagen
    console.log(`[ReservationCard] ID: ${id}, URL de imagen: ${imagenUrl}`);
    
    // Intentar usar la imagen proporcionada primero
    if (imagenUrl) {
      // Verificar si la URL usa HTTPS
      if (imagenUrl.startsWith('https://')) {
        setImageSource({ uri: imagenUrl });
      } else if (imagenUrl.startsWith('http://')) {
        // Convertir HTTP a HTTPS si es posible (para evitar problemas de seguridad)
        const httpsUrl = imagenUrl.replace('http://', 'https://');
        setImageSource({ uri: httpsUrl });
      } else {
        // Si es una ruta relativa, usar la imagen por defecto
        setImageSource({ uri: getDefaultImage() });
      }
    } else {
      // Si no hay URL, usar la imagen por defecto
      setImageSource({ uri: getDefaultImage() });
    }
  }, [id, imagenUrl, deporte]);

  const cardStyle = borderColor ? [styles.card, { borderLeftWidth: 4, borderLeftColor: borderColor }] : styles.card;

  const handleImageError = () => {
    console.log(`[ReservationCard] Error al cargar imagen: ${imageSource?.uri}`);
    setIsLoading(false);
    setHasError(true);
    // Usar imagen por defecto en caso de error
    setImageSource({ uri: getDefaultImage() });
  };

  return (
    <TouchableOpacity 
      style={cardStyle}
      onPress={() => onPress(id)}
    >
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.text}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.deporteTitulo}>{deporte}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha:</Text>
          <Text style={styles.infoValue}>
            {format(fecha, 'yyyy-MM-dd')}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hora:</Text>
          <Text style={styles.infoValue}>
            {format(horaInicio, 'HH:mm')} - {format(horaFin, 'HH:mm')}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Centro Deportivo:</Text>
          <Text style={styles.infoValue}>{centroDeportivo}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cancha:</Text>
          <Text style={styles.infoValue}>{cancha}</Text>
        </View>
        
        {estado && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[
              styles.estadoText, 
              estado === 'RESERVADO' ? styles.estadoReservado : 
              estado === 'CANCELADO' ? styles.estadoCancelado : 
              styles.estadoOtro
            ]}>
              {estado}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.imageContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        )}
        
        {hasError && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No se pudo cargar la imagen</Text>
          </View>
        )}
        
       <Image 
  source={imageSource}
  style={[styles.imagen, hasError ? styles.hiddenImage : null]} 
  contentFit="cover"
  transition={300}
  onLoadStart={() => setIsLoading(true)}
  onLoad={() => {
    setIsLoading(false);
    setHasError(false);
  }}
  onError={handleImageError}
/>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  deporteTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  estadoText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  hiddenImage: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    zIndex: 1,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ReservationCard;