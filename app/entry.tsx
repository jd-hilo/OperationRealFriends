import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import Button from '../components/Button';
import { useUserStore } from '../store/userStore';
import { theme } from '../constants/theme';

export default function EntryScreen() {
  const { createUser } = useUserStore();

  const handleGetStarted = async () => {
    await createUser();
    router.replace('/quiz');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CrewCheckin</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/3280130/pexels-photo-3280130.jpeg' }} 
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Find Your Accountability Crew</Text>
        <Text style={styles.subtitle}>
          Join a group of like-minded people who will help you stay on track with your goals.
        </Text>

        <Button 
          title="Get Started" 
          onPress={handleGetStarted}
          icon={<ChevronRight color="#FFFFFF" size={20} />}
          iconPosition="right"
        />

        <Text style={styles.privacyNote}>
          No sign up required. We'll create a temporary profile to match you with the right crew.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  logo: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.primary,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  privacyNote: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    maxWidth: '80%',
  },
});