import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export default function ProfileHeader({ title, isEditing, onEdit, onCancel }: ProfileHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {!isEditing ? (
        <TouchableOpacity 
          style={styles.editButton}
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Ionicons name="close" size={20} color="white" />
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
});