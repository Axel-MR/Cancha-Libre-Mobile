import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoBannerProps {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
}

const InfoBanner = ({
  title,
  description,
  icon = 'information-circle',
  iconColor = '#2196F3',
  backgroundColor = '#E3F2FD'
}: InfoBannerProps) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default InfoBanner;