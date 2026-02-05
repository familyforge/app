import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from "expo-splash-screen";
import { useAppStore } from "../lib/state/app-store";
import { useProfileStore } from "../lib/state/profile-store";
import { useDeadlinesStore } from "../lib/state/deadlines-store";
import { useLearningStore } from "../lib/state/learning-store";
import { scheduleAllNotifications } from "../lib/utils/notifications";
import { AuthProvider } from "../lib/api/auth-context";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  const theme = useAppStore((s) => s.settings.theme);
  const isDark = theme === "dark" || theme === "system";
  const tasks = useAppStore((s) => s.tasks);
  const routines = useProfileStore((s) => s.routines);
  const notificationSettings = useProfileStore((s) => s.notifications);
  const deadlines = useDeadlinesStore((s) => s.deadlines);
  const learningTasks = useLearningStore((s) => s.tasks);

  useEffect(() => {
    scheduleAllNotifications({
      tasks,
      routines,
      deadlines,
      learningTasks,
      notifications: notificationSettings,
    });
  }, [tasks, routines, deadlines, learningTasks, notificationSettings]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#1a1a1f" : "#f8f8fa",
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "modal",
            headerShown: true,
            headerTitle: "Settings",
            headerStyle: {
              backgroundColor: isDark ? "#252529" : "#ffffff",
            },
            headerTintColor: isDark ? "#e8e8e8" : "#1a1a1f",
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="my-routines"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="goals-progress"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="give-access"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="family-calendar"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="deadlines"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings-full"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="support"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="child-dashboard"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="child-profile"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="learning-assignments"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="child-learning"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="leaderboard"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="findmykids"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="upgrade"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
