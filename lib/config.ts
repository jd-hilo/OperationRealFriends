import Constants from 'expo-constants';

export const OPENAI_API_KEY =   process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found in environment variables');
} 