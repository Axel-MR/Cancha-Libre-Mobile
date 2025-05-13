import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  iconSize?: number;
  iconColor?: string;
}

const EmptyState = ({
  icon = 'calendar-outline',
  title,
  message,
  iconSize = 50,
  iconColor = '#ccc'
}: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  message: {
    marginTop: 5,
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default EmptyState;