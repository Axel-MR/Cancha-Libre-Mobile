import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  halfColor?: string;
  disabled?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating = ({
  rating,
  maxRating = 5,
  size = 24,
  color = '#FFD700', // Gold
  emptyColor = '#CCCCCC',
  halfColor = '#FFD700',
  disabled = false,
  onRatingChange
}: StarRatingProps) => {
  const [currentRating, setCurrentRating] = useState(rating);

  // Función para manejar el toque en una posición específica
  const handleRatingChange = (position: number, halfPosition: boolean) => {
    if (disabled) return;
    
    // Calcular la nueva calificación basada en la posición
    // Si es media estrella, restar 0.5
    const newRating = halfPosition ? position - 0.5 : position;
    
    setCurrentRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  // Renderizar las estrellas
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxRating; i++) {
      // Determinar el tipo de estrella (llena, media o vacía)
      let iconName: keyof typeof Ionicons.glyphMap;
      let iconColor: string;
      
      if (currentRating >= i) {
        iconName = 'star';
        iconColor = color;
      } else if (currentRating >= i - 0.5) {
        iconName = 'star-half';
        iconColor = halfColor;
      } else {
        iconName = 'star-outline';
        iconColor = emptyColor;
      }
      
      // Crear la estrella con áreas táctiles para estrella completa y media estrella
      stars.push(
        <View key={i} style={styles.starContainer}>
          {/* Área táctil para media estrella (izquierda) */}
          <TouchableOpacity
            style={[styles.touchArea, styles.leftHalf]}
            disabled={disabled}
            onPress={() => handleRatingChange(i - 0.5, true)}
          />
          
          {/* Área táctil para estrella completa (derecha) */}
          <TouchableOpacity
            style={[styles.touchArea, styles.rightHalf]}
            disabled={disabled}
            onPress={() => handleRatingChange(i, false)}
          />
          
          {/* Icono de estrella */}
          <Ionicons
            name={iconName}
            size={size}
            color={iconColor}
            style={styles.starIcon}
          />
        </View>
      );
    }
    
    return stars;
  };

  return (
    <View style={styles.container}>
      {renderStars()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    position: 'relative',
    marginHorizontal: 2,
  },
  starIcon: {
    position: 'relative',
    zIndex: 1,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  leftHalf: {
    left: 0,
    right: '50%',
  },
  rightHalf: {
    left: '50%',
    right: 0,
  },
});

export default StarRating;