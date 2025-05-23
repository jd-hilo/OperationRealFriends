import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useFrameworkReady() {
  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}