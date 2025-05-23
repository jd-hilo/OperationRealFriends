import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  hasCompletedQuiz: boolean;
  activeGroup: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setQuizCompleted: () => Promise<void>;
  initialize: () => Promise<void>;
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
  setActiveGroup: (groupId: string | null) => void;
  setUser: (user: any | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  hasCompletedQuiz: false,
  activeGroup: null,

  initialize: async () => {
    try {
      // Get the current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('current_group_id, has_completed_quiz')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        console.log('Initializing auth store with user data:', {
          userId: session.user.id,
          hasCompletedQuiz: userData.has_completed_quiz,
          activeGroup: userData.current_group_id
        });

        set({
          user: session.user,
          session,
          hasCompletedQuiz: userData.has_completed_quiz,
          activeGroup: userData.current_group_id,
          loading: false
        });
      } else {
        set({ loading: false });
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (session?.user) {
          set({ user: session.user, session });
        } else {
          set({ user: null, session: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // First check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (!data?.user) throw new Error('No user data returned');

      // Create user record in our database
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: email,
            has_completed_quiz: false,
            current_group_id: null,
            active_group: false
          }
        ]);

      if (userError) throw userError;

      // Set the session in Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      set({ 
        user: data.user, 
        session: session,
        hasCompletedQuiz: false,
        activeGroup: null
      });
    } catch (error) {
      console.error('Error signing up:', error);
      // Provide more user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw error;
      }
      throw new Error('Failed to create account. Please try again.');
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data?.user) throw new Error('No user data returned');

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('current_group_id, has_completed_quiz')
        .eq('id', data.user.id)
        .single();

      if (userError) throw userError;

      console.log('Signing in with user data:', {
        userId: data.user.id,
        hasCompletedQuiz: userData.has_completed_quiz,
        activeGroup: userData.current_group_id
      });

      set({
        user: data.user,
        session: data.session,
        hasCompletedQuiz: userData.has_completed_quiz,
        activeGroup: userData.current_group_id
      });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null, activeGroup: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  setQuizCompleted: async () => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');

    try {
      // Update the database first
      const { error } = await supabase
        .from('users')
        .update({ has_completed_quiz: true })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state but don't trigger queue routing
      set({ 
        hasCompletedQuiz: true,
        activeGroup: null // Ensure we don't have an active group
      });
    } catch (error) {
      console.error('Error setting quiz completed:', error);
      throw error;
    }
  },

  joinQueue: async () => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');

    try {
      console.log('Joining queue for user:', user.id);
      
      // Update user's queue status: set current_group_id to null and active_group to false
      const { error } = await supabase
        .from('users')
        .update({ 
          current_group_id: null,
          active_group: false
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state: activeGroup is null until assigned a real group id
      set({ activeGroup: null });
      
      console.log('Successfully joined queue');
    } catch (error) {
      console.error('Error joining queue:', error);
      throw error;
    }
  },

  leaveQueue: async () => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');

    try {
      console.log('Leaving queue for user:', user.id);
      
      // Update user's queue status
      const { error } = await supabase
        .from('users')
        .update({ 
          current_group_id: null,
          active_group: false
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      set({ activeGroup: null });
      
      console.log('Successfully left queue');
    } catch (error) {
      console.error('Error leaving queue:', error);
      throw error;
    }
  },

  setActiveGroup: (groupId) => set({ activeGroup: groupId }),

  setUser: (user) => set({ user })
})); 