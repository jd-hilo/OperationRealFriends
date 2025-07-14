import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const demoLocations = {
  'user1': {
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'Sarah',
    country: 'United States'
  },
  'user2': {
    latitude: 51.5074,
    longitude: -0.1278,
    name: 'James',
    country: 'United Kingdom'
  },
  'user3': {
    latitude: 35.6762,
    longitude: 139.6503,
    name: 'Yuki',
    country: 'Japan'
  },
  'user4': {
    latitude: -33.8688,
    longitude: 151.2093,
    name: 'Emma',
    country: 'Australia'
  },
};

const slides = [
  {
    id: 0,
    title: 'MEET FRiENDS\nACHiEVE GOALS',
    titleBlue: 'FRiENDS\nGOALS',
    subtitle: 'Swipe to learn how it works →',
    demoContent: ({ anims }: { anims?: Animated.Value[] } = {}) => (
      <View style={styles.demoContainer}>
        <View style={styles.messageContainerWrapper}>
          <View style={[styles.messageContainer, { padding: 0 }]}>
            <Animated.View style={[styles.messageBubble, anims ? { 
              opacity: anims[0], 
              transform: [{ 
                translateY: anims[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            } : {}]}>
              <View style={styles.messageHeader}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
                  style={styles.messageAvatar}
                />
                <Text style={styles.messageUsername}>Sarah</Text>
              </View>
              <Text style={styles.messageText}>Started my fitness journey today! 💪 Anyone else working on health goals?</Text>
            </Animated.View>

            <Animated.View style={[styles.messageBubble, anims ? {
              opacity: anims[1],
              transform: [{ 
                translateY: anims[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            } : {}]}>
              <View style={styles.messageHeader}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=2' }}
                  style={styles.messageAvatar}
                />
                <Text style={styles.messageUsername}>Mike</Text>
              </View>
              <Text style={styles.messageText}>I'm in! Been trying to build a morning workout routine. Let's motivate each other! 🌅</Text>
            </Animated.View>

            <Animated.View style={[styles.messageBubble, anims ? {
              opacity: anims[2],
              transform: [{ 
                translateY: anims[2].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            } : {}]}>
              <View style={styles.messageHeader}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
                  style={styles.messageAvatar}
                />
                <Text style={styles.messageUsername}>Emma</Text>
              </View>
              <Text style={styles.messageText}>Count me in! We can share workout tips and celebrate our progress together! 🎉</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: 1,
    title: 'QUICK\nViBE CHECK',
    titleBlue: 'CHECK',
    subtitle: 'Compelte our personality assessment.',
    demoContent: () => (
      <View style={styles.demoContainer}>
        <View style={styles.quizContent}>
          <Text style={styles.quizTitle}>What's your ideal weekend?</Text>
          <View style={styles.quizOptions}>
            <TouchableOpacity style={[styles.quizOption, styles.quizOptionSelected]}>
              <Text style={styles.quizOptionText}>🏃‍♂️ Outdoor adventures</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quizOption}>
              <Text style={styles.quizOptionText}>🎮 Gaming marathon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quizOption}>
              <Text style={styles.quizOptionText}>📚 Reading & relaxing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: 2,
    title: 'MEET\nYOUR GROUP',
    titleBlue: 'GROUP',
    subtitle: 'Get matched with 4 other people.',
    demoContent: () => (
      <View style={styles.demoContainer}>
        <View style={[styles.groupCardContainer, { height: 269 }]}>
          <View style={styles.groupTopRow}>
            <View style={styles.groupNameSection}>
              <Text style={styles.groupName}>Adventure Squad</Text>
              <Text style={styles.groupSubdesc}>A pack that tends to pick bold answers 💥</Text>
            </View>
            <View style={styles.groupAvatarRow}>
              {[...Array(2)].map((_, i) => (
                <Image
                  key={i}
                  source={{ uri: `https://i.pravatar.cc/150?img=${i + 1}` }}
                  style={[styles.groupAvatar, { marginLeft: i === 0 ? 0 : -12 }]}
                />
              ))}
              <View style={styles.groupExtraBadge}>
                <Text style={styles.groupExtraText}>+2</Text>
              </View>
            </View>
          </View>
          <View style={styles.groupMapContainer}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: 20,
                longitude: 0,
                latitudeDelta: 180,
                longitudeDelta: 360,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
              toolbarEnabled={false}
              zoomEnabled={true}
              scrollEnabled={true}
              rotateEnabled={true}
              pitchEnabled={true}
              minZoomLevel={1}
              maxZoomLevel={20}
            >
              {Object.entries(demoLocations).map(([userId, location]) => (
                <Marker
                  key={userId}
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title={location.name}
                  description={`From ${location.country}`}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <View style={styles.mapMarker}>
                      <MapPin size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: 3,
    title: 'ONE\nPROMT DAiLY',
    titleBlue: 'DAiLY',
    subtitle: 'Share something real,\nin your own way.',
    demoContent: () => (
      <View style={styles.demoContainer}>
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>09</Text>
              <Text style={styles.dateMonth}>May</Text>
              <LinearGradient
                colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dateUnderline}
              />
            </View>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>24</Text>
              <Text style={styles.timerLabel}>Hours</Text>
            </View>
          </View>
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>Today's prompt</Text>
            <Text style={styles.promptText}>What is one thing you did to help you achieve your goal? 🎯</Text>
          </View>
          <TouchableOpacity style={styles.respondButton}>
            <LinearGradient
              colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.respondButtonGradient}
            >
              <Text style={styles.respondButtonText}>Respond now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    ),
  },
  {
    id: 4,
    title: 'iT\nGETS SOCiAL',
    titleBlue: 'SOCiAL',
    subtitle: 'React, reply, and grow your\nconnection.',
    demoContent: () => (
      <View style={styles.demoContainer}>
        <View style={styles.messageContainerWrapper}>
          <ScrollView style={styles.messageContainer} showsVerticalScrollIndicator={false}>
            <View style={[styles.messageBubble, { marginBottom: 12 }]}>
              <View style={styles.messageHeader}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
                  style={styles.messageAvatar}
                />
                <Text style={styles.messageUsername}>Sarah</Text>
              </View>
              <Text style={styles.messageText}>Just shipped my first React Native app! 🚀 Can't believe how far I've come in just 3 months!</Text>
              <View style={styles.reactions}>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="heart" size={20} color="#FF4B6E" />
                  <Text style={styles.reactionCount}>6</Text>
                </View>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="chat" size={20} color="#4B1AFF" />
                  <Text style={styles.reactionCount}>3</Text>
                </View>
              </View>
            </View>

            <View style={[styles.messageBubble, { marginBottom: 12 }]}>
              <View style={styles.messageHeader}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
                  style={styles.messageAvatar}
                />
                <Text style={styles.messageUsername}>James</Text>
              </View>
              <Text style={styles.messageText}>Wow Sarah, that's amazing! 🎉 I remember when you first started asking about React Native basics. You've grown so much!</Text>
              <View style={styles.reactions}>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="heart" size={20} color="#FF4B6E" />
                  <Text style={styles.reactionCount}>4</Text>
                </View>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="chat" size={20} color="#4B1AFF" />
                  <Text style={styles.reactionCount}>1</Text>
                </View>
              </View>
            </View>

            <View style={[styles.messageBubble, { marginBottom: 12 }]}>
              <View style={styles.messageHeader}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=5' }}
                  style={styles.messageAvatar}
                />
                <Text style={styles.messageUsername}>Emma</Text>
              </View>
              <Text style={styles.messageText}>Started learning Python today! 🐍 @Sarah, your journey is so inspiring! Hope I can make progress like you did!</Text>
              <View style={styles.reactions}>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="heart" size={20} color="#FF4B6E" />
                  <Text style={styles.reactionCount}>5</Text>
                </View>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="chat" size={20} color="#4B1AFF" />
                  <Text style={styles.reactionCount}>2</Text>
                </View>
              </View>
            </View>

            <View style={[styles.messageBubble]}>
              <View style={styles.messageHeader}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
                  style={styles.messageAvatar}
                />
                <Text style={styles.messageUsername}>Sarah</Text>
              </View>
              <Text style={styles.messageText}>You got this Emma! 💪 DM me if you need any help with Python basics. We all start somewhere!</Text>
              <View style={styles.reactions}>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="heart" size={20} color="#FF4B6E" />
                  <Text style={styles.reactionCount}>3</Text>
                </View>
                <View style={styles.reaction}>
                  <MaterialCommunityIcons name="chat" size={20} color="#4B1AFF" />
                  <Text style={styles.reactionCount}>1</Text>
                </View>
              </View>
            </View>
          </ScrollView>
          <LinearGradient
            colors={['rgba(233, 242, 254, 0)', 'rgba(233, 242, 254, 1)']}
            style={styles.messageGradient}
            pointerEvents="none"
          />
        </View>
      </View>
    ),
  },
];

export default function Welcome() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Add animation values for welcome messages
  const messageAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current
  ];

  // Start welcome message animations when component mounts
  React.useEffect(() => {
    if (currentIndex === 0) {
      Animated.sequence([
        Animated.timing(messageAnims[0], {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnims[1], {
        toValue: 1,
          duration: 800,
        useNativeDriver: true,
      }),
        Animated.timing(messageAnims[2], {
        toValue: 1,
          duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    }
  }, [currentIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    if (currentIndex !== index) {
      setCurrentIndex(index);
      // Reset and restart animations when coming back to first slide
      if (index === 0) {
        messageAnims.forEach(anim => anim.setValue(0));
        Animated.sequence([
          Animated.timing(messageAnims[0], {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(messageAnims[1], {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(messageAnims[2], {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ]).start();
      }
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
              {index === 0 ? slide.demoContent({ anims: messageAnims }) : slide.demoContent()}
              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  {slide.title.split('\n').map((line, i) => {
                    const blueWords = slide.titleBlue.split('\n');
                    return (
                      <React.Fragment key={i}>
                        {line.split(' ').map((word, j) => {
                          const isBlue = blueWords.some(blueWord => blueWord === word);
            return (
                            <React.Fragment key={j}>
                              {isBlue ? (
                                <Text style={styles.titleBlue}>{word}</Text>
                              ) : (
                                word
                              )}
                              {j < line.split(' ').length - 1 ? ' ' : ''}
                            </React.Fragment>
                          );
                        })}
                        {i < slide.title.split('\n').length - 1 ? '\n' : ''}
                      </React.Fragment>
                    );
                  })}
                </Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
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
              colors={['#3AB9F9', '#4B1AFF']}
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
    height: height - 100,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  demoContainer: {
    width: 350,
    height: height * 0.45,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingBottom: 20,
  },
  title: {
    fontFamily: "PlanetComic",
    fontSize: 32,
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
    letterSpacing: 0,
  },
  titleBlue: {
    color: '#4B1AFF',
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  // Quiz screen styles
  quizContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  quizOptions: {
    width: '100%',
    gap: 12,
  },
  quizOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  quizOptionSelected: {
    backgroundColor: '#4B1AFF15',
    borderColor: '#4B1AFF',
    borderWidth: 1,
  },
  quizOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // Group screen styles
  groupCardContainer: {
    width: 350,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  groupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  groupNameSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: 200,
    height: 'auto',
  },
  groupName: {
    fontFamily: Platform.OS === 'ios' ? 'Open Sans' : 'sans-serif',
    fontWeight: '700',
    fontSize: 16,
    color: '#010101',
    marginBottom: 2,
  },
  groupSubdesc: {
    fontFamily: Platform.OS === 'ios' ? 'Open Sans' : 'sans-serif',
    fontWeight: '400',
    fontSize: 14,
    color: '#444',
    marginTop: 0,
  },
  groupAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginTop: 0,
  },
  groupAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  groupExtraBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: -8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupExtraText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  groupMapContainer: {
    width: '100%',
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
  },
  groupMapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupMapText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  // Prompt screen styles
  promptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  dateDay: {
    fontWeight: '700',
    fontSize: 20,
    color: '#222',
    lineHeight: 22,
  },
  dateMonth: {
    fontWeight: '600',
    fontSize: 14,
    color: '#6366F1',
    lineHeight: 16,
  },
  dateUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timerText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#222',
    marginTop: 2,
  },
  timerLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: -2,
  },
  promptSection: {
    marginBottom: 16,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    lineHeight: 22,
  },
  respondButton: {
    height: 62,
    borderRadius: 51,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
  },
  respondButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  respondButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  // Message screen styles
  messageContainerWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  messageContainer: {
    flex: 1,
    padding: 16,
  },
  messageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  messageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4B1AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  messageText: {
    fontSize: 14,
    color: '#222',
    lineHeight: 18,
    marginBottom: 8,
  },
  reactions: {
    flexDirection: 'row',
    gap: 16,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionCount: {
    fontSize: 14,
    color: '#666',
  },
  mapMarker: {
    backgroundColor: '#4B1AFF',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  introImage: {
    width: '80%',
    height: '80%',
    opacity: 0.9,
  },
  logoOverlay: {
    position: 'absolute',
    width: '60%',
    height: '60%',
    resizeMode: 'contain',
  },
}); 