import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { theme } from '../../constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      setError('');
      await signIn(email, password);
      // Router will automatically redirect based on auth state
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
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