import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { determinePersonalityType } from '../lib/personality';

const EMOJIS = ['✨', '🔮', '🌟', '🎯', '🧩', '🎨'];
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_RETRIES = 15; // 30 seconds total

export default function QuizLoadingScreen() {
  const { user } = useAuth();
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);

  // Emoji animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Reset animations
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);

      // Fade and scale out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change emoji
        setCurrentEmojiIndex((prev) => (prev + 1) % EMOJIS.length);

        // Fade and scale in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Check for results and redirect
  useEffect(() => {
    const checkResults = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('personalitytype, personalitydescription, personalitydepth')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking results:', error);
          return;
        }

        // If we have results, route to results page
        if (data?.personalitytype && data?.personalitydescription) {
          router.replace('/results');
          return;
        }

        // If no results yet, increment retry count
        setRetryCount(prev => {
          const newCount = prev + 1;
          
          // If we've hit max retries, try to regenerate personality type
          if (newCount >= MAX_RETRIES) {
            console.log('Max retries reached, attempting to regenerate personality type');
            determinePersonalityType(user.id).catch(console.error);
            return 0; // Reset counter
          }
          
          return newCount;
        });
      } catch (error) {
        console.error('Error in checkResults:', error);
      }
    };

    const interval = setInterval(checkResults, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <LinearGradient
      colors={['#E9F2FE', '#EDE7FF', '#FFFFFF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.emoji,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {EMOJIS[currentEmojiIndex]}
        </Animated.Text>
        <Text style={styles.title}>Using our magic to find your result...</Text>
        <Text style={styles.subtitle}>This will only take a moment ✨</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 