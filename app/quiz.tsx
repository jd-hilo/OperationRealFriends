import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
      text: 'How do you prefer to spend your free time?',
      options: [
        'Reading or watching movies alone',
        'Hanging out with friends',
        'Trying new activities',
        'Relaxing at home',
      ],
    },
    {
      id: 2,
      text: 'What energizes you the most?',
      options: [
        'Deep conversations',
        'Physical activities',
        'Creative projects',
        'Learning new things',
      ],
    },
    {
      id: 3,
      text: 'How do you handle stress?',
      options: [
        'Talk it out with others',
        'Exercise or physical activity',
        'Meditation or alone time',
        'Distract myself with hobbies',
      ],
    },
    {
      id: 4,
      text: 'What type of social situations do you enjoy?',
      options: [
        'Small, intimate gatherings',
        'Large parties',
        'One-on-one conversations',
        'Group activities',
      ],
    },
    {
      id: 5,
      text: 'How do you make decisions?',
      options: [
        'Based on feelings and intuition',
        'After careful analysis',
        'By discussing with others',
        'Following past experiences',
      ],
    },
    {
      id: 6,
      text: 'What is your preferred name?',
      type: 'text',
    },
    {
      id: 7,
      text: 'Where are you located?',
      type: 'text',
    },
    {
      id: 8,
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
          preferred_name: newAnswers[5],
          location: newAnswers[6],
          preferred_language: newAnswers[7]
        });

      const { error: updateError } = await supabase
        .from('users')
        .update({
            has_completed_quiz: true,
            preferred_name: newAnswers[5],
            location: newAnswers[6],
            preferred_language: newAnswers[7]
        })
          .eq('id', user?.id);

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
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