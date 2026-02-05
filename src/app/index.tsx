// FamilyForge App - Entry Point
// Handles routing based on onboarding completion status
// Re-exports home screen if complete, otherwise redirects to onboarding

import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, router } from "expo-router";
import { useOnboardingStore } from "../lib/state/onboarding-store";
import { theme } from "../lib/theme";

export default function IndexScreen() {
  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);
  const avatarSetupComplete = useOnboardingStore((s) => s.avatarSetupComplete);
  const step = useOnboardingStore((s) => s.step);
  const [hasHydrated, setHasHydrated] = useState(false);
  
  useEffect(() => {
    // Wait for zustand to hydrate from AsyncStorage
    const timeout = setTimeout(() => setHasHydrated(true), 100);
    return () => clearTimeout(timeout);
  }, []);
  
  // Show loading while hydrating
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.purple} />
      </View>
    );
  }
  
  // If onboarding is complete and avatar is set, show tabs/home
  if (onboardingComplete && avatarSetupComplete) {
    // Redirect to home tab using Expo Router's file system
    return <Redirect href="/(tabs)/home" />;
  }
  
  // Otherwise redirect to onboarding
  return <Redirect href="/onboarding" />;
}
