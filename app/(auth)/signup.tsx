import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { theme } from '../../constants/theme';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    try {
      setError('');
      
      // Validate email format
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate password length
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      await signUp(email, password);
      // Router will automatically redirect based on auth state
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    backgroundColor: '#FAFAFA', // Off-white background
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.text.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    borderWidth: 2,
    borderColor: '#000',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#87CEEB',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: theme.typography.fontSize.md,
    fontFamily: 'Poppins-SemiBold',
  },
  link: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  error: {
    color: '#EF4444',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    padding: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
}); 