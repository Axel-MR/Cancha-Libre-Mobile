import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  list: {
    padding: 10,
    paddingBottom: 100, // Espacio adicional para evitar que el último elemento quede tapado
  },
});

export const colors = {
  primary: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  text: {
    primary: '#333',
    secondary: '#666',
    light: '#999',
  },
  background: {
    main: '#f5f5f5',
    card: '#ffffff',
  }
};

export default {
  styles: commonStyles,
  colors
};