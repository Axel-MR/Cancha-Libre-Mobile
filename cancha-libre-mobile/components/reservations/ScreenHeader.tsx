import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  showActionButton?: boolean;
  actionButtonText?: string;
  actionButtonIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
}

const ScreenHeader = ({
  title,
  showActionButton = false,
  actionButtonText = 'Crear',
  actionButtonIcon = 'add-circle',
  onActionPress
}: ScreenHeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {showActionButton && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onActionPress}
        >
          <Ionicons name={actionButtonIcon} size={24} color="white" />
          <Text style={styles.actionButtonText}>{actionButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2196F3',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ScreenHeader;