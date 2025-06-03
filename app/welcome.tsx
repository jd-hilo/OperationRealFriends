import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const AVATAR_URLS = [
  'https://images.unsplash.com/photo-1613053341085-db794820ce43?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1643915541770-9c3a468593b2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2VuJTIwenxlbnwwfHwwfHx8MA%3D%3D',
  'https://images.unsplash.com/photo-1677126743843-037efa8e8da7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1589742067167-9683bf95ab54?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://plus.unsplash.com/premium_photo-1673757121264-757f9af1149d?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  ,
];

const AVATAR_POSITIONS = [
  { x: 0.15, y: 0.25 },
  { x: 0.7, y: 0.18 },
  { x: 0.8, y: 0.65 },
  { x: 0.25, y: 0.7 },
  { x: 0.5, y: 0.1 },
  { x: 0.6, y: 0.5 },
];

const globeSize = 260;
const avatarSize = 54;

export default function WelcomeScreen() {
  const fadeAnims = useRef(AVATAR_URLS.map(() => new Animated.Value(0))).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();

    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Avatar animations
    fadeAnims.forEach((fadeAnim, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.timing(fadeAnim, {
            toValue: 0.2,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.delay(900),
        ])
      );
      loop.start();
    });
  }, [fadeAnims, scaleAnim, rotateAnim, subtitleAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.centerContent}>
        <Animated.View 
          style={[
            styles.globeWrapper,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: spin }
              ]
            }
          ]}
        >
          <Image source={require('../assets/globe.png')} style={styles.globe} />
          {AVATAR_URLS.map((url, i) => {
            const pos = AVATAR_POSITIONS[i % AVATAR_POSITIONS.length];
            return (
              <Animated.Image
                key={i}
                source={{ uri: url }}
                style={[
                  styles.avatar,
                  {
                    left: pos.x * globeSize - avatarSize / 2,
                    top: pos.y * globeSize - avatarSize / 2,
                    opacity: fadeAnims[i],
                  },
                ]}
                resizeMode="cover"
              />
            );
          })}
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </Animated.View>
        <Animated.Text 
          style={[
            styles.subtitle,
            {
              opacity: subtitleAnim,
              transform: [{
                translateY: subtitleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          Meet your curated group of people all working towards achieving their goal.
        </Animated.Text>
      </View>
      <TouchableOpacity
        onPress={() => router.replace('/(auth)/signup')}
        activeOpacity={0.85}
        style={styles.button}
      >
        <LinearGradient
          colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Get Started 👉</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  globeWrapper: {
    width: globeSize,
    height: globeSize,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  globe: {
    width: globeSize,
    height: globeSize,
    borderRadius: globeSize / 2,
    opacity: 0.8,
  },
  avatar: {
    position: 'absolute',
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    opacity: 0.2,
  },
  logo: {
    width: 400,
    height: 200,
    resizeMode: 'contain',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -200 }, { translateY: -100 }],
    zIndex: 2,
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
    maxWidth: 340,
    fontFamily: theme.typography.fontFamily.bodyRegular,
  },
  button: {
    width: '100%',
    height: 62,
    borderRadius: 51,
    borderWidth: 4,
    borderColor: '#FFF',
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 20,
  },
}); 