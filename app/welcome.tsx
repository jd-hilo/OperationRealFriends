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
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <View style={styles.globeContainer}>
        <Image source={require('../assets/globe.png')} style={styles.globe} />
        {/* Animated Avatars */}
        {AVATARS.map((uri, i) => {
          // Each avatar floats up and down by 16px, with a phase offset
          const translateY = hoverAnim[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -16],
          });
          return (
            <Animated.Image
              key={i}
              source={{ uri }}
              style={[
                styles.avatar,
                AVATAR_POSITIONS[i],
                { zIndex: 2, transform: [{ translateY }] },
              ]}
            />
          );
        })}
        {/* Lines (static for now) */}
        <View style={[styles.line, { top: 110, left: 120, width: 60, transform: [{ rotate: '20deg' }] }]} />
        <View style={[styles.line, { top: 110, right: 120, width: 60, transform: [{ rotate: '-20deg' }] }]} />
        <View style={[styles.line, { bottom: 110, left: 120, width: 60, transform: [{ rotate: '-20deg' }] }]} />
        <View style={[styles.line, { bottom: 110, right: 120, width: 60, transform: [{ rotate: '20deg' }] }]} />
      </View>
     
      
      <Text style={styles.subtitle}>
        Curated groups with daily{"\n"}connections
      </Text>
      <Button
        title="Lets go!🤪"
        onPress={() => router.push('/(auth)/signup')}
      />
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
  globeContainer: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  globe: {
    width: 260,
    height: 260,
    borderRadius: 130,
    position: 'absolute',
    top: 30,
    left: 30,
    opacity: 0.96,
  },
  avatar: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#fff',
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  line: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#E0E7FF',
    borderRadius: 2,
    zIndex: 1,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    color: '#111',
    marginBottom: 8,
    letterSpacing: 1,
  },
  vibe: {
    color: '#1877FF',
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 32,
  },
}); 