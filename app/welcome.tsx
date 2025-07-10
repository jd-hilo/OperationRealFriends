import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'QUICK\nViBE CHECK',
    titleBlue: 'ViBE',
    subtitle: 'Answer the quiz to find your\nmatch.',
  },
  {
    id: 2,
    title: 'MEET\nYOUR GROUP',
    titleBlue: 'GROUP',
    subtitle: 'Show up together,\nor the pact dissolves.',
  },
  {
    id: 3,
    title: 'ONE\nPROMT DAiLY',
    titleBlue: 'DAiLY',
    subtitle: 'Share something real,\nin your own way.',
  },
  {
    id: 4,
    title: 'iT\nGETS SOCiAL',
    titleBlue: 'SOCiAL',
    subtitle: 'React, reply, and grow your\nconnection.',
  },
];

export default function Welcome() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    if (currentIndex !== index) {
      setCurrentIndex(index);
      // Fade animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <LinearGradient
      colors={['#E9F2FE', '#EDE7FF', '#FFFFFF']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              <Text style={styles.title}>
                {slide.title.split('\n').map((part, i) => (
                  <Text key={i}>
                    {part.includes(slide.titleBlue) 
                      ? part.replace(slide.titleBlue, `${'\n'}\x1B[34m${slide.titleBlue}\x1B[0m`)
                      : `${part}\n`}
                  </Text>
                ))}
              </Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.button}>
            <LinearGradient
              colors={['#3AB9F9', '#4B1AFF', '#006FFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Lets go!👋</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'PlanetComic',
    fontSize: 48,
    color: '#111',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 56,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#4B1AFF',
    width: 24,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
}); 