// FamilyForge App - Entry Point
// Handles routing based on onboarding completion status
// Web shows landing page, mobile goes to normal flow

import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { Redirect, router } from "expo-router";
import { useOnboardingStore } from "../lib/state/onboarding-store";
import { useAppStore } from "../lib/state/app-store";
import { useChildDeviceStore } from "../lib/state/child-device-store";
import { useAuth } from "../lib/api";
import { isChildApp } from "../lib/appVariant";
import { theme } from "../lib/theme";

export default function IndexScreen() {
  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);
  const avatarSetupComplete = useOnboardingStore((s) => s.avatarSetupComplete);
  const step = useOnboardingStore((s) => s.step);
  const { user, isLoading: authLoading } = useAuth();
  const setIsChildMode = useAppStore((s) => s.setIsChildMode);
  const activeChildId = useChildDeviceStore((s) => s.activeChildId);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Wait for zustand to hydrate from AsyncStorage
    const timeout = setTimeout(() => setHasHydrated(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  // The child build is child mode, permanently — it is not a mode the user can
  // leave. This is what makes the "I did it -> parent approves" flow reachable;
  // setIsChildMode(true) previously had no caller anywhere in the codebase.
  useEffect(() => {
    if (isChildApp) setIsChildMode(true);
  }, [setIsChildMode]);

  // Show loading while hydrating local state or restoring the session
  if (!hasHydrated || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.purple} />
      </View>
    );
  }
  
  // CHILD APP: no parent onboarding, no marketing landing page, no tabs.
  //
  // The gate is "has a child been linked on THIS device", NOT "is anyone signed
  // in". Those differ: in Expo Go both variants share one storage sandbox, so a
  // parent's session leaks into the Kids app and `user` is non-null for someone
  // who is not a child at all. Gating on `user` skipped the login screen and
  // dropped a parent straight into a child's dashboard.
  if (isChildApp) {
    if (!activeChildId) {
      return <Redirect href="/child-link" />;
    }
    return <Redirect href="/child-dashboard" />;
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
  if (onboardingComplete && avatarSetupComplete) {
    // Onboarding done, but a finished onboarding is NOT proof of a session --
    // those flags live in AsyncStorage and survive sign-out and app reinstalls
    // of the same device. Require a real user before entering the app.
    if (!user) {
      return <Redirect href="/login" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  // Otherwise redirect to onboarding
  return <Redirect href="/onboarding" />;
}
