import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); 