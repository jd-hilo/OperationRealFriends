import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';

const AVATARS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/85.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
];

const AVATAR_POSITIONS = [
  { top: 40, left: 60 },    // top left
  { top: 0, right: 40 },   // top right
  { bottom: 60, left: 30 },// bottom left
  { bottom: 40, right: 60 },// bottom right
  { top: 120, left: 140 }, // center-ish
];

export default function WelcomeScreen() {
  // Animated values for each avatar
  const hoverAnim = useRef(AVATARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    hoverAnim.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800 + i * 200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1800 + i * 200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [hoverAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Pact</Text>
        <Text style={styles.subtitle}>
          Join a community of like-minded people who will help you stay on track with your goals.
        </Text>
        <Button
          title="Get Started"
          onPress={() => router.push('/(auth)/signup')}
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