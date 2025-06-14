import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Animated, Linking } from 'react-native';
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

  const handleJoinWaitlist = () => {
    Linking.openURL('https://wt.ls/pact');
  };

  return (
    <LinearGradient
      colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
      locations={[0, 0.5192, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.globeWrapper, { transform: [{ rotate: spin }] }]}>
          <Image source={require('../assets/globe.png')} style={styles.globe} />
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </Animated.View>
        <Text style={styles.title}>Join the Waitlist</Text>
        <Text style={styles.subtitle}>
          We're currently at capacity, but you can join our waitlist to be among the first to know when spots open up!
        </Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
        <Text style={styles.hint}>
          Join now to secure your spot and get early access to our community.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleJoinWaitlist}
        >
          <View style={styles.buttonGradient}>
            <LinearGradient
              colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.textGradient}
            >
              <Text style={styles.buttonText}>Join Waitlist</Text>
            </LinearGradient>
          </View>
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
    width: 300,
    height: 300,
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
    width: 220,
    height: 110,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -110 }, { translateY: -55 }],
    resizeMode: 'contain',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
    opacity: 0.9,
  },
  spinner: {
    marginBottom: theme.spacing.xl,
  },
  hint: {
    fontSize: theme.typography.fontSize.md,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
    opacity: 0.8,
  },
  button: {
    width: 280,
    height: 62,
    borderRadius: 51,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
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
  textGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});