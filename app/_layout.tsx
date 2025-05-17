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
import { useUserStore } from '../store/userStore';
import { View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useFrameworkReady();

  const { userId, checkExistingUser } = useUserStore();

  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any data if needed
        await checkExistingUser();
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [checkExistingUser]);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = false; // Replace with your actual check

    if (!hasCompletedOnboarding) {
      // If not completed onboarding, redirect to quiz
      router.replace('/quiz');
    } else {
      // If completed onboarding, check if in queue
      const isInQueue = false; // Replace with your actual check

      if (isInQueue) {
        router.replace('/queue');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [segments]);

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
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' }
        }}
      >
        {!userId ? (
          <>
            <Stack.Screen name="entry" />
            <Stack.Screen name="quiz" />
            <Stack.Screen name="queue" />
          </>
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
    </View>
  );
}