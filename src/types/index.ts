export type RootStackParamList = {
  Entry: undefined;
  Quiz: undefined;
  Queue: undefined;
  Dashboard: undefined;
  Prompt: undefined;
  Chat: undefined;
};

export type User = {
  id: string;
  created_at: string;
  quiz_answers: QuizAnswers;
  current_group_id: string | null;
};

export type QuizAnswers = {
  question1: number;
  question2: number;
  question3: number;
  question4: number;
  question5: number;
  question6: number;
};

export type Group = {
  id: string;
  member_ids: string[];
  streak_count: number;
  is_active: boolean;
  created_at: string;
};

export type Prompt = {
  id: string;
  question_text: string;
  created_at: string;
};

export type Submission = {
  id: string;
  user_id: string;
  group_id: string;
  prompt_id: string;
  response_text: string;
  created_at: string;
};

export type Message = {
  id: string;
  group_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
};