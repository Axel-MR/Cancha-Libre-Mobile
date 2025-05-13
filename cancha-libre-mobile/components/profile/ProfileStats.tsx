import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileStatsProps {
  reservas: number;
  faltas: number;
}

export default function ProfileStats({ reservas, faltas }: ProfileStatsProps) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{reservas}</Text>
        <Text style={styles.statLabel}>Reservas</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{faltas}</Text>
        <Text style={styles.statLabel}>Faltas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    width: '80%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
});