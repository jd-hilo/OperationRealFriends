import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { determinePersonalityType } from '../lib/personality';

interface Question {
  id: number;
  text: string;
  options?: string[];
  type?: 'text';
}

interface QuizAnswers {
  [key: number]: string;
}

const LANGUAGES = [
  'English',
  'Mandarin Chinese',
  'Hindi',
  'Spanish',
  'Arabic',
  'Bengali',
  'Portuguese',
  'Russian',
  'Japanese',
  'French'
];

export default function QuizScreen() {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [error, setError] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const questions: Question[] = [
    {
      id: 1,
      text: 'I see myself as someone who is outgoing, sociable.',
      options: [
        'Very like me',
        'Somewhat like me',
        'A little like me',
        'Not like me',
      ],
    },
    {
      id: 2,
      text: 'I tend to be compassionate and cooperative.',
      options: [
        'Very like me',
        'Somewhat like me',
        'A little like me',
        'Not like me',
      ],
    },
    {
      id: 3,
      text: 'I am organized and pay attention to details.',
      options: [
        'Very like me',
        'Somewhat like me',
        'A little like me',
        'Not like me',
      ],
    },
    {
      id: 4,
      text: 'I remain calm under pressure.',
      options: [
        'Very like me',
        'Somewhat like me',
        'A little like me',
        'Not like me',
      ],
    },
    {
      id: 5,
      text: 'I enjoy trying new things and ideas.',
      options: [
        'Very like me',
        'Somewhat like me',
        'A little like me',
        'Not like me',
      ],
    },
    {
      id: 6,
      text: 'If you had a free Saturday, what sounds best?',
      options: [
        'A laid‑back movie or game night',
        'A live concert or gallery opening',
        'A hike or sports game',
        'Coding, reading or a podcast binge',
      ],
    },
    {
      id: 7,
      text: 'Your ideal trip is…',
      options: [
        'Backpacking to meet locals',
        'Organized group tour',
        'Beach resort escape',
        'City‑hopping food crawl',
      ],
    },
    {
      id: 8,
      text: 'How do you prefer to express yourself?',
      options: [
        'Writing or blogging',
        'Playing or listening to music',
        'Painting, crafting or design',
        'Cooking or mixology',
      ],
    },
    {
      id: 9,
      text: 'Your go‑to spot with new friends is…',
      options: [
        'A cozy cafe',
        'A lively bar or club',
        'A park or sports field',
        'A coworking space or makerspace',
      ],
    },
    {
      id: 10,
      text: 'I learn best by…',
      options: [
        'Watching videos or live demos',
        'Reading articles or books',
        'Hands‑on practice',
        'Group discussion or classes',
      ],
    },
    {
      id: 11,
      text: "What's your main goal or project for this year?",
      type: 'text',
    },
    {
      id: 12,
      text: 'What kind of support or feedback helps you most when trying to stay accountable?',
      options: [
        'Friendly reminders and encouragement',
        'Specific progress checklists and milestones',
        'Honest feedback on where I\'m off-track',
        'Celebrations when I hit milestones',
      ],
    },
    {
      id: 13,
      text: 'How do you prefer to give support to others?',
      options: [
        'Sending regular check‑in messages',
        'Sharing helpful resources and tips',
        'Setting concrete tasks or deadlines',
        'Offering encouragement and praise',
      ],
    },
    {
      id: 14,
      text: 'What is your preferred name?',
      type: 'text',
    },
    {
      id: 15,
      text: 'What is your postal code? (Enter your local postal/zip code)',
      type: 'text',
    },
    {
      id: 16,
      text: 'What is your preferred language?',
      type: 'text',
    },
    {
      id: 17,
      text: 'Write a short bio about yourself (2-3 sentences)',
      type: 'text',
    },
    {
      id: 18,
      text: 'What is your Instagram username? (optional)',
      type: 'text',
    },
    {
      id: 19,
      text: 'Upload a picture of yourself',
      type: 'text',
    },
  ];

  const handleAnswer = async (answer: string) => {
    try {
      const newAnswers = { ...answers, [currentQuestion]: answer };
      setAnswers(newAnswers);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTextInput(''); // Reset text input for next question
      } else {
        // Quiz completed
        console.log('Saving answers:', {
          quiz_answers: {
            question1: newAnswers[0],
            question2: newAnswers[1],
            question3: newAnswers[2],
            question4: newAnswers[3],
            question5: newAnswers[4],
            question6: newAnswers[5],
            question7: newAnswers[6],
            question8: newAnswers[7],
            question9: newAnswers[8],
            question10: newAnswers[9],
            question11: newAnswers[10],
            question12: newAnswers[11],
            question13: newAnswers[12]
          },
          user_profile: {
            preferred_name: newAnswers[13],
            location: newAnswers[14],
            preferred_language: newAnswers[15],
            bio: newAnswers[16],
            instagram_username: newAnswers[17],
            avatar_url: newAnswers[18] || null
          }
        });

        // First save the quiz answers
        const { error: quizError } = await supabase
          .from('users')
          .update({
            quiz_answers: {
              question1: newAnswers[0],
              question2: newAnswers[1],
              question3: newAnswers[2],
              question4: newAnswers[3],
              question5: newAnswers[4],
              question6: newAnswers[5],
              question7: newAnswers[6],
              question8: newAnswers[7],
              question9: newAnswers[8],
              question10: newAnswers[9],
              question11: newAnswers[10],
              question12: newAnswers[11],
              question13: newAnswers[12]
            },
            preferred_name: newAnswers[13],
            location: newAnswers[14],
            preferred_language: newAnswers[15],
            bio: newAnswers[16],
            instagram_username: newAnswers[17],
            avatar_url: newAnswers[18] || null
          })
          .eq('id', user?.id);

        if (quizError) {
          console.error('Error saving quiz answers:', quizError);
          setError('Failed to save quiz answers. Please try again.');
          return;
        }

        // Start personality determination before routing
        if (user?.id) {
          try {
            // Route to loading page first
            router.replace('/quiz-loading');
            // Then start personality determination
            await determinePersonalityType(user.id);
          } catch (error) {
            console.error('Error determining personality type:', error);
            // Even if there's an error, stay on loading page as it will handle retries
          }
        }
      }
    } catch (error) {
      console.error('Error in handleAnswer:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    try {
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await handleAnswer(textInput);
    } catch (error) {
      console.error('Error in handleTextSubmit:', error);
    }
  };

  const handleTextChange = (text: string) => {
    // Only modify text for postal code field
    if (currentQuestion === 14) {
      // Remove any characters that aren't letters, numbers, spaces, or hyphens
      const cleanedText = text.replace(/[^A-Za-z0-9\s\-]/g, '');
      // Convert to uppercase for consistency
      setTextInput(cleanedText.toUpperCase());
    } else {
      // For all other fields, preserve the exact text as entered
      setTextInput(text);
    }
  };

  const handleUploadImage = async () => {
    try {
      // Check current permission status
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          if (!user) return;
          setError('Processing image...');

          // Manipulate the image
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [
              { resize: { width: 800, height: 800 } },
              { crop: { originX: 0, originY: 0, width: 800, height: 800 } }
            ],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );

          if (!manipulatedImage.base64) {
            throw new Error('Failed to process image');
          }

          setError('Uploading image...');
          const fileName = `${user.id}/${Date.now()}.jpg`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, decode(manipulatedImage.base64), {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload image. Please try again.');
          }

          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

          setSelectedImage(publicUrl);
          setTextInput(publicUrl);
          setError('');
        }
        return;
      }

      // Not granted, request permission
      const { status: requestStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (requestStatus === 'granted') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          if (!user) return;
          setError('Processing image...');

          // Manipulate the image
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [
              { resize: { width: 800, height: 800 } },
              { crop: { originX: 0, originY: 0, width: 800, height: 800 } }
            ],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );

          if (!manipulatedImage.base64) {
            throw new Error('Failed to process image');
          }

          setError('Uploading image...');
          const fileName = `${user.id}/${Date.now()}.jpg`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, decode(manipulatedImage.base64), {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload image. Please try again.');
          }

          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

          setSelectedImage(publicUrl);
          setTextInput(publicUrl);
          setError('');
        }
      } else {
        Alert.alert(
          'Permission denied', 
          'Please enable photo access in your device settings to upload a profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings() 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('');
      Alert.alert('Upload Failed', 'Failed to upload profile picture. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setTextInput(''); // Reset text input when going back
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Stack.Screen 
          options={{
            headerShown: false,
            headerBackVisible: false,
            title: 'Personality Quiz',
            headerStyle: {
              backgroundColor: 'transparent',
            },
            headerShadowVisible: false,
          }} 
        />
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.headerContainer}>
            {currentQuestion > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#6366F1" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.questionText}>
            {questions[currentQuestion].text}
          </Text>

          <View style={styles.optionsContainer}>
            {questions[currentQuestion].type === 'text' ? (
              <View style={styles.textInputContainer}>
                {currentQuestion === 15 ? (
                  // Language selection dropdown
                  <View style={styles.languageContainer}>
                    {LANGUAGES.map((language, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.languageOption,
                          textInput === language && styles.selectedLanguage
                        ]}
                        onPress={() => setTextInput(language)}
                      >
                        {textInput === language && (
                          <LinearGradient
                            colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                          />
                        )}
                        <View style={styles.languageTextWrapper}>
                          <Text style={textInput === language ? styles.selectedLanguageText : styles.languageText}>
                            {language}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : currentQuestion === 18 ? (
                  // Profile picture upload
                  <View style={styles.profilePictureContainer}>
                    {selectedImage ? (
                      <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.profilePicture}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.profilePicturePlaceholder}>
                        <MaterialCommunityIcons 
                          name="account" 
                          size={48} 
                          color="#888"
                        />
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.uploadButton,
                        error ? styles.uploadButtonDisabled : null
                      ]}
                      onPress={handleUploadImage}
                      disabled={!!error}
                    >
                      <LinearGradient
                        colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={[
                          styles.uploadButtonText,
                          error ? styles.uploadButtonTextDisabled : null
                        ]}>
                          {selectedImage ? 'Change Photo' : 'Upload Photo'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.skipButton}
                      onPress={() => handleAnswer('')}
                    >
                      <Text style={styles.skipButtonText}>Skip for now</Text>
                    </TouchableOpacity>
                    <Text style={styles.uploadHint}>
                      Tap to take a photo with your camera
                    </Text>
                    {error && (
                      <Text style={styles.errorText}>{error}</Text>
                    )}
                  </View>
                ) : (
                  // Regular text input for other fields
                  <TextInput
                    style={[
                      styles.textInput,
                      currentQuestion === 16 && styles.bioInput
                    ]}
                    value={textInput}
                    onChangeText={handleTextChange}
                    placeholder={
                      currentQuestion === 10 ? "What's your main goal or project for this year?" :
                      currentQuestion === 13 ? "Enter your preferred name" :
                      currentQuestion === 14 ? "Enter your postal code..." :
                      currentQuestion === 15 ? "Select your preferred language" :
                      currentQuestion === 16 ? "Write a short bio about yourself (2-3 sentences)" :
                      currentQuestion === 17 ? "Enter your Instagram username (optional)" :
                      "Upload your profile picture"
                    }
                    placeholderTextColor="#888"
                    onSubmitEditing={handleTextSubmit}
                    returnKeyType="done"
                    maxLength={currentQuestion === 14 ? 10 : undefined}
                    autoCapitalize={currentQuestion === 13 ? "words" : "none"}
                    autoCorrect={false}
                    spellCheck={false}
                    multiline={currentQuestion === 16}
                    textAlignVertical={currentQuestion === 16 ? "top" : "center"}
                  />
                )}
                {currentQuestion === 14 && (
                  <Text style={styles.disclaimerText}>
                    We use this for general location matching only. Your postal code is private and will not be shared with other users.
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.submitButton, !textInput.trim() && styles.submitButtonDisabled]}
                  onPress={handleTextSubmit}
                  disabled={!textInput.trim()}
                >
                  <LinearGradient
                    colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={[styles.submitButtonText, !textInput.trim() && styles.submitButtonTextDisabled]}>
                      Submit
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              questions[currentQuestion].options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    answers[currentQuestion] === option && styles.selectedOption,
                  ]}
                  onPress={() => handleAnswer(option)}
                >
                  <Text style={[
                    styles.optionText,
                    answers[currentQuestion] === option && styles.selectedOptionText
                  ]}>
                      {option}
                    </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E7FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  questionNumber: {
    fontSize: theme.typography.fontSize.md,
    color: '#888',
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  questionText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: '#222',
    marginBottom: theme.spacing.xl,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  optionButton: {
    padding: theme.spacing.lg,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F3FF',
  },
  optionText: {
    fontSize: theme.typography.fontSize.md,
    color: '#222',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  selectedOptionText: {
    color: '#4B1AFF',
    fontWeight: '700',
  },
  textInputContainer: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
    backgroundColor: '#FFF',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    padding: theme.spacing.lg,
  },
  textInput: {
    borderRadius: 32,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: '#222',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    fontWeight: '500',
    marginBottom: 8,
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 20,
  },
  submitButton: {
    width: 280,
    height: 62,
    borderRadius: 51,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 51,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  languageContainer: {
    gap: theme.spacing.sm,
  },
  languageOption: {
    padding: theme.spacing.md,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  languageTextWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  selectedLanguage: {
    // No border, just keep the gradient
  },
  languageText: {
    fontSize: theme.typography.fontSize.md,
    color: '#222',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    fontSize: theme.typography.fontSize.md,
  },
  profilePictureContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#FFF',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    padding: theme.spacing.lg,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFF',
  },
  profilePicturePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: 280,
    height: 62,
    borderRadius: 51,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  uploadHint: {
    fontSize: theme.typography.fontSize.sm,
    color: '#888',
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonTextDisabled: {
    color: '#9CA3AF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#666',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    paddingHorizontal: theme.spacing.md,
  },
  skipButton: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  skipButtonText: {
    color: '#666',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    textAlign: 'center',
  },
});