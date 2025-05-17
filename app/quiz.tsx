import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Question {
  id: number;
  text: string;
  options: string[];
}

export default function QuizScreen() {
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
    } else {
      // Quiz completed - handle submission
      handleQuizCompletion();
    }
  };

  const handleQuizCompletion = () => {
    // Add your quiz completion logic here
    // This should save the answers and navigate to the queue screen
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
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
      </ScrollView>
    </View>
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
});