import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';

interface Question {
  id: number;
  text: string;
  options: string[];
}

export default function QuizScreen() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

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
  ];

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const { user, setQuizCompleted } = useAuthStore.getState();
      if (!user) throw new Error('No user found');

      // Convert answers array to a JSON object with question IDs
      const quizAnswers = answers.reduce((acc, answer, index) => {
        acc[`question${index + 1}`] = answer;
        return acc;
      }, {} as Record<string, number>);

      // Update user record in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({
          quiz_answers: quizAnswers,
          has_completed_quiz: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      await setQuizCompleted();
      
      // Navigate back to home
      router.push('/(tabs)/home');
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const handleGoHome = () => {
    router.push('/(tabs)/home');
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
        >
          <MaterialCommunityIcons name="home" size={24} color="#007AFF" />
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>

        <Text style={styles.questionNumber}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
        <Text style={styles.questionText}>
          {questions[currentQuestion].text}
        </Text>

        <View style={styles.optionsContainer}>
          {questions[currentQuestion].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                answers[currentQuestion] === index && styles.selectedOption,
              ]}
              onPress={() => handleAnswer(index)}
            >
              <Text
                style={[
                  styles.optionText,
                  answers[currentQuestion] === index && styles.selectedOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentQuestion === questions.length - 1 && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              answers[currentQuestion] === undefined && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={answers[currentQuestion] === undefined}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        )}
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
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  homeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
});