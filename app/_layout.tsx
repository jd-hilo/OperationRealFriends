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
import { registerForPushNotificationsAsync } from "lib/notifications";

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
    registerForPushNotificationsAsync().then((t) => console.log("token :", t));

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Nunito-Regular": Nunito_400Regular,
    "Nunito-SemiBold": Nunito_600SemiBold,
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-SemiBold": Poppins_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
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
