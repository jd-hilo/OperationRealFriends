import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface Question {
  id: number;
  text: string;
  options?: string[];
  type?: 'text';
}

interface QuizAnswers {
  [key: number]: string;
}

export default function QuizScreen() {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [error, setError] = useState('');
  const [textInput, setTextInput] = useState('');

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
      text: 'Where are you located?',
      type: 'text',
    },
    {
      id: 13,
      text: 'What is your preferred language?',
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
            preferred_language: newAnswers[12]
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
    if (textInput.trim()) {
      handleAnswer(textInput.trim());
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: 'Personality Quiz'
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
              <TextInput
                style={styles.textInput}
                placeholder="Type your answer here..."
                value={textInput}
                onChangeText={setTextInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.submitButton, !textInput.trim() && styles.submitButtonDisabled]}
                onPress={handleTextSubmit}
                disabled={!textInput.trim()}
              >
                <Text style={[styles.submitButtonText, !textInput.trim() && styles.submitButtonTextDisabled]}>
                  Submit
                </Text>
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
              <Text
                style={[
                  styles.optionText,
                    answers[currentQuestion] === option && styles.selectedOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionNumber: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  optionButton: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  textInputContainer: {
    marginTop: 10,
    gap: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#666',
  },
});