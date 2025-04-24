// components/MenuItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuItemProps {
  icon: string;
  text: string;
  route: string;
  navigation: any;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, route, navigation }) => (
  <TouchableOpacity 
    style={styles.menuItem} 
    onPress={() => navigation.navigate(route)}
  >
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon} size={24} color="#2f95dc" />
    </View>
    <Text style={styles.menuText}>{text}</Text>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 5,
  },
  menuIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
});

export default MenuItem;