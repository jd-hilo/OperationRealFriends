import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
} from "@expo-google-fonts/nunito";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../lib/auth";
import * as Notifications from "expo-notifications";
import { View, ActivityIndicator } from "react-native";
import { Mixpanel } from 'mixpanel-react-native';
const trackAutomaticEvents = false;
const useNative = false;
export const mixpanel = new Mixpanel(
  'f500b52ae88a2aa0a4b91fe098ceca03',
  trackAutomaticEvents,
  useNative
);
mixpanel.init();
// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inWelcomeScreen = segments[0] === "welcome";

    if (!user && !inAuthGroup && !inWelcomeScreen) {
      // If not authenticated and not in auth or welcome screen, go to welcome
      router.replace("/welcome");
    } else if (user && (inAuthGroup || inWelcomeScreen)) {
      // If authenticated and in auth or welcome screen, go to home
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Nunito-Regular": Nunito_400Regular,
    "Nunito-SemiBold": Nunito_600SemiBold,
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "PlanetComic": require("../assets/fonts/PlanetComic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Log font loading status for debugging
      if (fontError) {
        console.error('Font loading error:', fontError);
      } else {
        console.log('Fonts loaded successfully:', Object.keys(fontsLoaded));
      }
      SplashScreen.hideAsync().catch(() => {
        /* ignore error */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
