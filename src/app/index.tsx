// FamilyForge App - Entry Point
// Handles routing based on onboarding completion status
// Web shows landing page, mobile goes to normal flow

import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
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
  
  // WEB ONLY: Show landing page first (marketing page)
  // Mobile apps bypass this and go directly to app flow
  if (Platform.OS === "web") {
    // Check if user is already onboarded - if so, go to app
    if (onboardingComplete && avatarSetupComplete) {
      return <Redirect href="/(tabs)/home" />;
    }
    // Otherwise show landing page
    return <Redirect href="/landing" />;
  }
  
  // MOBILE: Normal app flow
  // If onboarding is complete and avatar is set, show tabs/home
  if (onboardingComplete && avatarSetupComplete) {
    // Redirect to home tab using Expo Router's file system
    return <Redirect href="/(tabs)/home" />;
  }
  
  // Otherwise redirect to onboarding
  return <Redirect href="/onboarding" />;
}
