import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Modal, TouchableOpacity, ScrollView } from 'react-native';
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
  const [modalVisible, setModalVisible] = useState(false);
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
      }, 2000); // 2-second delay
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
      <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="information-outline" size={24} color="#4B1AFF" />
      </TouchableOpacity>

      <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>  
        <Text style={styles.personalityType}>{personalityResult?.type}</Text>
        <Text style={styles.description}>{personalityResult?.description}</Text>
        
        {personalityResult?.depth && (
          <>
            <TouchableOpacity 
              onPress={() => setShowDepth(!showDepth)} 
              style={styles.showMoreButton}
            >
              <Text style={styles.showMoreButtonText}>
                {showDepth ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>
            
            {showDepth && (
              <Text style={styles.depthText}>{personalityResult.depth}</Text>
            )}
          </>
        )}
      </Animated.View>

      <TouchableOpacity 
        style={styles.homeButton}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Text style={styles.homeButtonText}>Next</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Your Personality Results</Text>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.personalityType}>{personalityResult?.type}</Text>
                <Text style={styles.description}>{personalityResult?.description}</Text>
                
                {personalityResult?.depth && (
                  <>
                    <TouchableOpacity 
                      onPress={() => setShowDepth(!showDepth)} 
                      style={styles.showMoreButton}
                    >
                      <Text style={styles.showMoreButtonText}>
                        {showDepth ? 'Show Less' : 'Show More'}
                      </Text>
                    </TouchableOpacity>
                    
                    {showDepth && (
                      <Text style={styles.depthText}>{personalityResult.depth}</Text>
                    )}
                  </>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B1AFF',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    width: '90%',
  },
  personalityType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B1AFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B1AFF',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4B1AFF',
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  showMoreButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#4B1AFF',
    borderRadius: 8,
  },
  showMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  depthText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  homeButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#4B1AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 