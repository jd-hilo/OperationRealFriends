import React from 'react';
import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_600SemiBold
} from '@expo-google-fonts/nunito';
import {
  Poppins_400Regular,
  Poppins_600SemiBold
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { useAuthStore } from '../store/auth';
import { View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuthStore();

  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  // Handle routing based on auth state
  useEffect(() => {
    if (!fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isEntryScreen = segments[0] === 'entry';
    const isSignupScreen = segments[1] === 'signup';
    const isQuizScreen = segments[0] === 'quiz';

    // If we're on the entry screen, signup screen, or quiz screen, stay there
    if (isEntryScreen || (inAuthGroup && isSignupScreen) || isQuizScreen) return;

    if (!user) {
      // Not signed in - go to entry screen
      if (!isEntryScreen && !inAuthGroup) {
        router.replace('/entry');
      }
    } else {
      // Signed in - show main app
      if (!inTabsGroup && !isQuizScreen) {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, segments, fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null if fonts haven't loaded and there's no error
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}