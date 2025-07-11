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
  bio?: string;
  quiz_answers?: QuizAnswers;
  personalitytype?: string;
  personalitydescription?: string;
  personalitydepth?: string;
  personalitymatch?: string;
}

export interface QuizAnswers {
  id: string;
  user_id: string;
  question1: number;
  question2: number;
  question3: number;
  question4: number;
  question5: number;
  question6: number;
  question7: number;
  question8: number;
  question9: number;
  question10: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
  current_prompt_id: string | null;
  prompt_due_date: string | null;
  next_prompt_due: string | null;
  streak_count: number;
  is_active: boolean;
  members?: User[];
  current_prompt?: Prompt;
  prompts?: Prompt[];
  match_reason?: string;
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

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
  reactions?: Reaction[];
}