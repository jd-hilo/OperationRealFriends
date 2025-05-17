import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import EntryScreen from './src/screens/EntryScreen';
import QuizScreen from './src/screens/QuizScreen';
import QueueScreen from './src/screens/QueueScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PromptScreen from './src/screens/PromptScreen';
import ChatScreen from './src/screens/ChatScreen';

// Store
import { useUserStore } from './src/store/userStore';

// Types
import { RootStackParamList } from './src/types';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { userId, checkExistingUser } = useUserStore();
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'Nunito-Regular': require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any data if needed
        await checkExistingUser();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [checkExistingUser]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#FFFFFF' }
          }}
        >
          {!userId ? (
            <>
              <Stack.Screen name="Entry" component={EntryScreen} />
              <Stack.Screen name="Quiz" component={QuizScreen} />
              <Stack.Screen name="Queue" component={QueueScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Prompt" component={PromptScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}