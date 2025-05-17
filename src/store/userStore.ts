import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { supabase } from '../lib/supabase';
import { User, QuizAnswers } from '../types';

interface UserState {
  userId: string | null;
  groupId: string | null;
  quizCompleted: boolean;
  quizAnswers: QuizAnswers | null;
  checkExistingUser: () => Promise<void>;
  createUser: () => Promise<void>;
  saveQuizAnswers: (answers: QuizAnswers) => Promise<void>;
  assignToGroup: (groupId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: null,
  groupId: null,
  quizCompleted: false,
  quizAnswers: null,

  checkExistingUser: async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        // Fetch user from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', storedUserId)
          .single();

        if (error) throw error;

        if (data) {
          set({
            userId: data.id,
            groupId: data.current_group_id,
            quizCompleted: !!data.quiz_answers,
            quizAnswers: data.quiz_answers
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    }
  },

  createUser: async () => {
    try {
      // Generate a new UUID
      const newUserId = uuid.v4().toString();
      
      // Create a new user in Supabase
      const { error } = await supabase
        .from('users')
        .insert([
          { id: newUserId, created_at: new Date().toISOString() }
        ]);

      if (error) throw error;

      // Save to AsyncStorage
      await AsyncStorage.setItem('userId', newUserId);
      
      set({ userId: newUserId });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  },

  saveQuizAnswers: async (answers: QuizAnswers) => {
    const { userId } = get();
    if (!userId) return;

    try {
      // Update user in Supabase
      const { error } = await supabase
        .from('users')
        .update({ quiz_answers: answers })
        .eq('id', userId);

      if (error) throw error;

      set({ quizAnswers: answers, quizCompleted: true });
    } catch (error) {
      console.error('Error saving quiz answers:', error);
    }
  },

  assignToGroup: async (groupId: string) => {
    const { userId } = get();
    if (!userId) return;

    try {
      // Update user with group ID
      const { error } = await supabase
        .from('users')
        .update({ current_group_id: groupId })
        .eq('id', userId);

      if (error) throw error;

      // Add user to group members
      const { error: groupError } = await supabase.rpc('add_user_to_group', {
        p_user_id: userId,
        p_group_id: groupId
      });

      if (groupError) throw groupError;

      set({ groupId });
    } catch (error) {
      console.error('Error assigning to group:', error);
    }
  }
}));