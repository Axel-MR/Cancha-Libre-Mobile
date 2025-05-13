import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';

interface ProfileFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  suffix?: string;
}

export default function ProfileField({ 
  label, 
  value, 
  isEditing, 
  onChangeText, 
  placeholder,
  keyboardType = 'default',
  suffix
}: ProfileFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.inputValue}>
          {value ? (suffix ? `${value} ${suffix}` : value) : 'No especificado'}
        </Text>
      )}
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
  textInput: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2196F3',
  },
});