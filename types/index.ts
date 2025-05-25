export type RootStackParamList = {
  entry: undefined;
  quiz: undefined;
  queue: undefined;
  '(tabs)': undefined;
};

export interface User {
  id: string;
  email: string;
  created_at: string;
  has_completed_quiz: boolean;
  current_group_id: string | null;
  streak_count: number;
  submitted: boolean;
  last_submission_date: string;
  avatar_url?: string;
  location?: string;
  preferred_language?: string;
  preferred_name?: string;
}

export interface QuizAnswer {
  id: string;
  user_id: string;
  question1: number;
  question2: number;
  question3: number;
  question4: number;
  question5: number;
  question6: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
  current_prompt_id?: string;
  next_prompt_due?: string;
  streak_count?: number;
  is_active: boolean;
  members?: User[];
  current_prompt?: Prompt;
  prompts?: Prompt[];
}

export type Prompt = {
  id: string;
  content: string;
  created_at: string;
  prompt_type: 'text' | 'audio' | 'photo';
  due_date: string;
};

export interface Submission {
  id: string;
  user_id: string;
  group_id: string;
  prompt_id: string;
  response_text: string;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
}