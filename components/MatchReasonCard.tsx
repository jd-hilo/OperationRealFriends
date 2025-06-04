import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MatchReasonCardProps {
  reason: string;
}

const MatchReasonCard: React.FC<MatchReasonCardProps> = ({ reason }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Why you matched</Text>
      <Text style={styles.subtitle}>Here's what brought your crew together!</Text>
      <View style={styles.reasonBox}>
        <Text style={styles.reasonText}>{reason}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 18,
    width: 350,
    minHeight: 160,
    backgroundColor: '#FAFAFA',
    borderRadius: 44,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
    color: '#111',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  reasonBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 250,
    minHeight: 60,
  },
  reasonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
});

export default MatchReasonCard; 