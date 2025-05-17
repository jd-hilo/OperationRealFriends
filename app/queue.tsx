import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function QueueScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="account-group"
          size={80}
          color="#007AFF"
          style={styles.icon}
        />
        <Text style={styles.title}>Finding Your Crew</Text>
        <Text style={styles.subtitle}>
          We're matching you with compatible group members...
        </Text>
        <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
        <Text style={styles.hint}>
          This usually takes a few minutes. We'll notify you when your group is ready!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  spinner: {
    marginVertical: 30,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: '80%',
  },
});