import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isLoading?: boolean;
}

export default function ActionButton({ title, onPress, icon, color, isLoading }: ActionButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          <Ionicons name={icon} size={20} color="white" />
          <Text style={styles.buttonText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});