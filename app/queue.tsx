import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

export default function QueueScreen() {
  const router = useRouter();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.globeWrapper, { transform: [{ rotate: spin }] }]}>
          <Image source={require('../assets/globe.png')} style={styles.globe} />
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </Animated.View>
        <Text style={styles.title}>Finding Your Crew</Text>
        <Text style={styles.subtitle}>
          We're matching you with compatible group members based on your preferences and personality.
        </Text>
        <ActivityIndicator size="large" color="#6366F1" style={styles.spinner} />
        <Text style={styles.hint}>
          This usually takes a few minutes. We'll notify you when your group is ready!
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGoHome}
        >
          <LinearGradient
            colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Go to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  globeWrapper: {
    width: 260,
    height: 260,
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  globe: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logo: {
    position: 'absolute',
    width: 180,
    height: 90,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -90 }, { translateY: -45 }],
    resizeMode: 'contain',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: '#222',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: '#666',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  spinner: {
    marginBottom: theme.spacing.xl,
  },
  hint: {
    fontSize: theme.typography.fontSize.md,
    color: '#666',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  button: {
    width: 280,
    height: 62,
    borderRadius: 51,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});