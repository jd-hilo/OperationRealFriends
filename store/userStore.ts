import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { User, QuizAnswers } from '../types';
import { useAuthStore } from './auth';

interface UserState {
  userId: string | null;
  groupId: string | null;
  quizCompleted: boolean;
  quizAnswers: QuizAnswers | null;
  checkExistingUser: () => Promise<void>;
  createUser: () => Promise<void>;
  saveQuizAnswers: (answers: QuizAnswers) => Promise<void>;
  assignToGroup: () => Promise<void>;
  refreshGroupId: () => Promise<string | null>;
  initialize: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: null,
  groupId: null,
  quizCompleted: false,
  quizAnswers: null,

  initialize: async () => {
    try {
      const authUser = useAuthStore.getState().user;
      if (authUser?.id) {
        console.log('Initializing user store with auth user:', authUser.id);
        set({ userId: authUser.id });
        await get().checkExistingUser();
      }
    } catch (error) {
      console.error('Error initializing user store:', error);
    }
  },

  checkExistingUser: async () => {
    try {
      const { userId } = get();
      if (!userId) {
        console.log('No userId available in user store');
        return;
      }

      console.log('Checking existing user:', userId);
        // Fetch user from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
        .eq('id', userId)
          .single();

        if (error) throw error;

        if (data) {
        console.log('Found user data:', data);
          set({
            userId: data.id,
            groupId: data.current_group_id,
            quizCompleted: !!data.quiz_answers,
            quizAnswers: data.quiz_answers
          });
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    }
  },

  refreshGroupId: async () => {
    const { userId } = get();
    if (!userId) {
      console.log('No userId available for refreshGroupId');
      return null;
    }

    try {
      console.log('Refreshing group ID for user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('current_group_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error refreshing group ID:', error);
        throw error;
      }

      if (data?.current_group_id) {
        console.log('Found current_group_id:', data.current_group_id);
        // Set the state first
        set({ groupId: data.current_group_id });
        // Then return the value
        return data.current_group_id;
      } else {
        console.log('No group ID found for user');
        set({ groupId: null });
        return null;
      }
    } catch (error) {
      console.error('Error in refreshGroupId:', error);
      set({ groupId: null });
      return null;
    }
  },

  createUser: async () => {
    try {
      // Generate a new UUID
      const newUserId = uuidv4();
      
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

  assignToGroup: async () => {
    try {
      const { userId } = get();
      if (!userId) {
        console.error('No userId available');
        throw new Error('No userId available');
      }
      const groupId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

      console.log('Joining group with user ID:', userId);

      // Fetch current member_ids
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('member_ids')
        .eq('id', groupId)
        .single();

      if (fetchError) throw fetchError;

      const memberIds = group.member_ids || [];
      if (!memberIds.includes(userId)) {
        const { error: updateError } = await supabase
          .from('groups')
          .update({ member_ids: [...memberIds, userId] })
          .eq('id', groupId);
        if (updateError) throw updateError;
      }

      // Then update user's current_group_id
      const { error: userError } = await supabase
        .from('users')
        .update({
          current_group_id: groupId,
        })
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user current_group_id:', userError);
        throw userError;
      }

      // Update local state
      set({ groupId });
      console.log('User successfully assigned to group:', groupId);
    } catch (err) {
      console.error('assignToGroup error:', err);
      throw err;
    }
  }
}));