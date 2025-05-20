import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StarRating from './StarRating';

interface RatingDisplayProps {
  rating: number;
  totalRatings: number;
  size?: number;
  showCount?: boolean;
}

const RatingDisplay = ({
  rating,
  totalRatings,
  size = 16,
  showCount = true
}: RatingDisplayProps) => {
  return (
    <View style={styles.container}>
      <StarRating
        rating={rating}
        size={size}
        disabled={true}
      />
      {showCount && (
        <Text style={styles.ratingText}>
          {rating.toFixed(1)} ({totalRatings})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default RatingDisplay;