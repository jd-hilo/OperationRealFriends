import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface PersonalityResult {
  type: string;
  description: string;
  depth: string;
}

export default function ResultsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [personalityResult, setPersonalityResult] = useState<PersonalityResult | null>(null);
  const [showDepth, setShowDepth] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchPersonalityResult = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('personalitytype, personalitydescription, personalitydepth')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPersonalityResult({
          type: data.personalitytype,
          description: data.personalitydescription,
          depth: data.personalitydepth
        });
      }
      setLoading(false);

      // Delay the fade-in animation
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }, 500);
    };

    fetchPersonalityResult();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B1AFF" />
        <Text style={styles.loadingText}>Getting your results...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Personality Type Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Personality Type</Text>
            <Text style={styles.subtitle}>Here's what makes you unique! 🌟</Text>
            <View style={styles.typeBox}>
              <Text style={styles.personalityType}>{personalityResult?.type}</Text>
              <Text style={styles.description}>{personalityResult?.description}</Text>
            </View>
          </View>

          {/* In-Depth Analysis Card */}
          {personalityResult?.depth && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>In-Depth Analysis</Text>
              <Text style={styles.subtitle}>A deeper look into your personality 🔍</Text>
              <View style={styles.depthBox}>
                {personalityResult.depth.split('\n\n').map((section, index) => {
                  // Skip empty sections
                  if (!section.trim()) return null;

                  // Split section into lines
                  const lines = section.split('\n');
                  
                  // Check if this is a section with ### title
                  if (lines[0].startsWith('###')) {
                    const title = lines[0].replace(/^###\s*/, '').trim();
                    const content = lines.slice(1);
                    
                    return (
                      <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                        {content.map((line, i) => {
                          if (!line.trim()) return null;

                          // Handle bullet points
                          if (line.trim().startsWith('•')) {
                            const [bulletPoint, ...description] = line.trim().split(':');
                            return (
                              <View key={i} style={styles.bulletPoint}>
                                <Text style={styles.bulletPointTitle}>
                                  {bulletPoint.replace('•', '').trim()}
                                </Text>
                                {description.length > 0 && (
                                  <Text style={styles.bulletPointContent}>
                                    {description.join(':').trim()}
                                  </Text>
                                )}
                              </View>
                            );
                          }
                          
                          // Handle numbered points
                          if (line.trim().match(/^\d+\./)) {
                            const [number, ...content] = line.trim().split('.');
                            return (
                              <View key={i} style={styles.numberedPoint}>
                                <Text style={styles.numberCircle}>{number}</Text>
                                <Text style={styles.numberedContent}>
                                  {content.join('.').trim()}
                                </Text>
                              </View>
                            );
                          }

                          // Regular line within a section
                          return (
                            <Text key={i} style={styles.sectionContent}>
                              {line.trim()}
                            </Text>
                          );
                        })}
                      </View>
                    );
                  }
                  
                  // Regular paragraph (not a section)
                  return (
                    <View key={index} style={styles.paragraphSection}>
                      {lines.map((line, i) => {
                        if (!line.trim()) return null;
                        return (
                          <Text key={i} style={styles.paragraphText}>
                            {line.trim()}
                          </Text>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.nextButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <LinearGradient
          colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 120,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 350,
    gap: 24,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#111',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 15,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
  },
  typeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  personalityType: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B1AFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#222',
    lineHeight: 24,
    textAlign: 'center',
  },
  depthBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  paragraphSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  paragraphText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  bulletPoint: {
    flexDirection: 'column',
    marginLeft: 16,
    marginBottom: 12,
  },
  bulletPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  bulletPointContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  numberedPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 16,
    marginBottom: 12,
  },
  numberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4B1AFF',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  numberedContent: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  nextButton: {
    width: '100%',
    maxWidth: 280,
    height: 62,
    borderRadius: 51,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
}); 