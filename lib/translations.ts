import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config';

console.log('OpenAI API Key available:', !!OPENAI_API_KEY);

const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Add this for Expo/React Native
}); 

export const translateMessage = async (text: string, targetLanguage: Language): Promise<string> => {
  if (!OPENAI_API_KEY) {
    return text;
  }

  try {
    console.log('Attempting translation to:', LANGUAGES[targetLanguage]);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a translator. Your ONLY job is to translate text to ${LANGUAGES[targetLanguage]}. If you can translate the text, output ONLY the translated text. If you cannot translate the text, output the original text exactly as received. Never add any words like "sorry" or explanations. Never say you cannot translate something. Just output either the translation or the original text.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';

export const LANGUAGES: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean'
}; 