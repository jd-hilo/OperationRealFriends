import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Animated, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useAuth } from '../lib/auth';
import Button from '../components/Button';

export default function QueueScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isJoining, setIsJoining] = useState(false);

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

  const handleJoinQueue = () => {
    setIsJoining(true);
    // Add queue joining logic here
    router.replace('/(tabs)/home');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/welcome');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
        <Text style={styles.title}>Ready to Connect?</Text>
        <Text style={styles.description}>
          Join our waitlist to be matched with a group of like-minded individuals.
        </Text>
        <Button
          onPress={handleJoinQueue}
          title="Join Waitlist"
          loading={isJoining}
          style={styles.joinButton}
        />
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: '#666',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  joinButton: {
    width: '100%',
    maxWidth: 280,
  },
  signOutButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  signOutText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#666',
    textDecorationLine: 'underline',
  },
});