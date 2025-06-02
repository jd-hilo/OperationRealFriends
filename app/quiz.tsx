import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

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
      text: 'What is your preferred name?',
      type: 'text',
    },
    {
      id: 12,
      text: 'What is your postal code? (Enter your local postal/zip code)',
      type: 'text',
    },
    {
      id: 13,
      text: 'What is your preferred language?',
      type: 'text',
    },
    {
      id: 14,
      text: 'Write a short bio about yourself (2-3 sentences)',
      type: 'text',
    },
    {
      id: 15,
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
            question10: newAnswers[9]
          },
          user_profile: {
            preferred_name: newAnswers[10],
            location: newAnswers[11],
            preferred_language: newAnswers[12]
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
              question10: newAnswers[9]
            }
          })
          .eq('id', user?.id);

        if (quizError) {
          console.error('Error saving quiz answers:', quizError);
          throw quizError;
        }

        // Then save the user profile data
        const { error: profileError } = await supabase
          .from('users')
          .update({
            has_completed_quiz: true,
            preferred_name: newAnswers[10],
            location: newAnswers[11],
            preferred_language: newAnswers[12],
            bio: newAnswers[13],
            avatar_url: newAnswers[14] || null
          })
          .eq('id', user?.id);

        if (profileError) {
          console.error('Error updating user profile:', profileError);
          throw profileError;
        }

        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      console.error('Error in handleAnswer:', err);
      setError(err.message);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;

    // Validate postal code format
    if (currentQuestion === 11) { // Index 11 is the postal code question
      const postalCode = textInput.trim();
      
      // Check if it's a US ZIP code (5 digits)
      const usZipRegex = /^\d{5}$/;
      // Check if it's a Canadian postal code (A1A 1A1 format)
      const canadaPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      // Check if it's a UK postcode (various formats)
      const ukPostalRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
      // Check if it's a general international postal code (3-10 chars, alphanumeric with spaces/hyphens)
      const internationalPostalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;

      if (!usZipRegex.test(postalCode) && 
          !canadaPostalRegex.test(postalCode) && 
          !ukPostalRegex.test(postalCode) && 
          !internationalPostalRegex.test(postalCode)) {
        setError('Please enter a valid postal code. Examples:\n• US: 12345\n• Canada: A1A 1A1\n• UK: SW1A 1AA\n• International: 3-10 characters');
        return;
      }

      // If it's a US ZIP code, ensure it's a valid range (00001-99950)
      if (usZipRegex.test(postalCode)) {
        const zipNum = parseInt(postalCode);
        if (zipNum < 1 || zipNum > 99950) {
          setError('Please enter a valid US ZIP code (00001-99950)');
          return;
        }
      }
    }

    handleAnswer(textInput.trim());
  };

  const handleTextChange = (text: string) => {
    // Only modify text for postal code field
    if (currentQuestion === 11) {
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
      console.log('Starting image upload process...');

      // Pick image with minimal configuration
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.1,
        base64: true,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        if (!user) return;

        setError('Uploading image...');
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const base64Data = result.assets[0].base64;
        if (!base64Data) {
          throw new Error('Failed to get image data');
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, decode(base64Data), {
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
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('');
      Alert.alert(
        'Upload Failed',
        'Failed to upload profile picture. Please try again.'
      );
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
          <Text style={styles.questionNumber}>
            Question {currentQuestion + 1} of {questions.length}
          </Text>
          <Text style={styles.questionText}>
            {questions[currentQuestion].text}
          </Text>

          <View style={styles.optionsContainer}>
            {questions[currentQuestion].type === 'text' ? (
              <View style={styles.textInputContainer}>
                {currentQuestion === 12 ? (
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
                ) : currentQuestion === 14 ? (
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
                      currentQuestion === 13 && styles.bioInput
                    ]}
                    value={textInput}
                    onChangeText={handleTextChange}
                    placeholder={
                      currentQuestion === 10 ? "Enter your preferred name" :
                      currentQuestion === 13 ? "Enter your bio" :
                      "Enter your postal code..."
                    }
                    placeholderTextColor="#888"
                    onSubmitEditing={handleTextSubmit}
                    returnKeyType="done"
                    maxLength={currentQuestion === 11 ? 10 : undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    multiline={currentQuestion === 13}
                    textAlignVertical={currentQuestion === 13 ? "top" : "center"}
                  />
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
                  {answers[currentQuestion] === option ? (
                    <LinearGradient
                      colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.optionGradient}
                    >
                      <Text style={styles.selectedOptionText}>
                        {option}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.optionText}>
                      {option}
                    </Text>
                  )}
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
    borderBottomColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#87CEEB',
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
  },
  optionGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOption: {
    // No border, just keep the gradient
  },
  optionText: {
    fontSize: theme.typography.fontSize.md,
    color: '#222',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    width: '100%',
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
});