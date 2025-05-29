import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); 

export const translateMessage = async (text: string, targetLanguage: Language): Promise<string> => {
  return text; // Stub: replace with actual translation logic
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