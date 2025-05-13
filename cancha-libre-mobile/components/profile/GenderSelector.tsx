import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface GenderSelectorProps {
  value: string;
  onChange: (gender: string) => void;
  isEditing: boolean;
}

export default function GenderSelector({ value, onChange, isEditing }: GenderSelectorProps) {
  const options = ['Masculino', 'Femenino', 'Otro'];
  
  if (!isEditing) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sexo</Text>
        <Text style={styles.inputValue}>{value || 'No especificado'}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Sexo</Text>
      <View style={styles.radioGroup}>
        {options.map((option) => (
          <TouchableOpacity 
            key={option}
            style={[
              styles.radioButton, 
              value === option && styles.radioButtonSelected
            ]}
            onPress={() => onChange(option)}
          >
            <Text style={[
              styles.radioText,
              value === option && styles.radioTextSelected
            ]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  inputValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  radioButtonSelected: {
    backgroundColor: '#2196F3',
  },
  radioText: {
    color: '#2196F3',
  },
  radioTextSelected: {
    color: 'white',
  },
});