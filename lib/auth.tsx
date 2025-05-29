import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserProfile = async (userId: string, email: string) => {
    // First try to fetch the profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // If profile exists, return it
    if (existingProfile) {
      return existingProfile;
    }

    // If no profile exists, create one
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          created_at: new Date().toISOString(),
          has_completed_quiz: false,
          submitted: false,
          last_submission_date: null,
          current_group_id: null
        }
      ]);

    if (insertError) {
      console.error('Error creating user record:', insertError);
      throw insertError;
    }

    // Fetch the newly created profile
    const { data: newProfile, error: newFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (newFetchError) {
      console.error('Error fetching new user profile:', newFetchError);
      throw newFetchError;
    }

    return newProfile;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await ensureUserProfile(session.user.id, session.user.email || '');
          setUser(profile);
        } catch (error) {
          console.error('Error ensuring user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await ensureUserProfile(session.user.id, session.user.email || '');
          setUser(profile);
        } catch (error) {
          console.error('Error ensuring user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    console.log('Attempting sign up with:', { email, passwordLength: password.length });
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: 'https://pgnzcvlvyomsfvpiukqj.supabase.co/auth/v1/verify'
      }
    });
    console.log('Sign up response:', { data, error });
    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }

    // Create and fetch user profile after successful signup
    if (data.user) {
      const profile = await ensureUserProfile(data.user.id, email);
      setUser(profile);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 