import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// In production, these values are injected by EAS Build
const supabaseUrl = 'https://pgnzcvlvyomsfvpiukqj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbnpjdmx2eW9tc2Z2cGl1a3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MzAzNjgsImV4cCI6MjA2MzAwNjM2OH0.Nna1ZHfWhzu2j-fNyrelYlJiljGFVhsuilxmOgByYms';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});