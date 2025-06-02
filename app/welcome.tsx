import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Pact</Text>
        <Text style={styles.subtitle}>
          Join a community of like-minded people who will help you stay on track with your goals.
        </Text>
        <Button
          title="Get Started"
          onPress={() => router.replace('/(auth)/signup')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    color: '#111',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  }
}); 