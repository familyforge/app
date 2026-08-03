import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, View, ActivityIndicator, AppState } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Home, Users, CheckSquare, Gift, BarChart3, User } from "lucide-react-native";
import { useAuth } from "../../lib/api";
import { isChildApp } from "../../lib/appVariant";
import { recordStreakActivity } from "../../lib/api/streaks";
import { hydrateFromCloud, startCloudSync } from "../../lib/api/cloud-sync";
import { scheduleGoalReminder } from "../../lib/utils/goalReminder";
import { registerPushToken } from "../../lib/utils/pushToken";
import {
  ensureTodaysAffirmation, pendingAffirmation, markAffirmationSeen, scheduleDailyAffirmation,
} from "../../lib/utils/dailyAffirmation";
import { AffirmationModal } from "../../components/AffirmationModal";
import { theme } from "../../lib/theme";

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const loggedStreakFor = useRef<string | null>(null);
  const [affirmation, setAffirmation] = useState<string | null>(null);

  // Case 3 from dailyAffirmation.ts: the 07:00 notification may have fired while
  // the app was closed, or been ignored. Showing it on next open means a parent
  // who was busy at 7am still receives the message rather than losing it.
  const checkAffirmation = useCallback(async () => {
    if (isChildApp) return;
    await ensureTodaysAffirmation();
    await scheduleDailyAffirmation();
    const pending = await pendingAffirmation();
    if (pending) setAffirmation(pending.message);
  }, []);

  useEffect(() => {
    if (!user?.id || isChildApp) return;
    void checkAffirmation();
    // Also re-check on foreground, so a parent who leaves the app open overnight
    // still gets the 7am message rather than waiting for a cold start.
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void checkAffirmation();
    });
    return () => sub.remove();
  }, [user?.id, checkAffirmation]);

  // Record the daily check-in once the user is actually in the app. Guarded by
  // user id so it fires once per signed-in session rather than on every render;
  // recordStreakActivity is itself a no-op after the first call each day.
  useEffect(() => {
    if (!user?.id) return;
    if (loggedStreakFor.current === user.id) return;
    loggedStreakFor.current = user.id;
    void recordStreakActivity("daily_login");
  }, [user?.id]);

  // Cross-device persistence. Pull first so a fresh handset shows this parent's
  // real family rather than an empty account, then mirror later edits back up.
  // Child builds are excluded: they hold one child's data, not a family's.
  useEffect(() => {
    if (!user?.id || isChildApp) return;
    let stop: (() => void) | undefined;
    void hydrateFromCloud().then(() => { stop = startCloudSync(); });
    return () => { stop?.(); };
  }, [user?.id]);

  // Push the re-engagement nudge 5 hours out on every open, so it only fires
  // after a real gap rather than on a timer the parent cannot reset.
  useEffect(() => {
    if (!user?.id || isChildApp) return;
    void scheduleGoalReminder();
    // Without a stored token there is nowhere to send "your child finished a
    // task", so this runs on every authenticated launch.
    void registerPushToken("parent");
  }, [user?.id]);

  // Wait for the persisted session to be restored before deciding.
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.purple} />
      </View>
    );
  }

  // Guard: the tabs hold real family data, so they require a live session.
  // Without this, completing onboarding once left the app permanently
  // reachable on that device regardless of whether anyone was signed in.
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <AffirmationModal
        visible={affirmation !== null}
        message={affirmation ?? ""}
        onDismiss={() => {
          void markAffirmationSeen();
          setAffirmation(null);
        }}
      />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          borderTopWidth: 1,
          // WhatsApp-style balanced height: lift icons within bar, keep background to bottom
          height: Platform.OS === "android" ? 72 : 85,
          paddingTop: Platform.OS === "android" ? 6 : 8,
          paddingBottom: Platform.OS === "android" ? 14 : 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        headerShown: false, // We handle headers in each screen with SafeAreaView
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      {/* Parent-only tabs. `href: null` removes them from the child app entirely
          rather than merely hiding the button — without this, a signed-in child
          could reach the parent's Home, Children, Progress and Profile screens,
          since the auth guard above only proves *someone* is signed in, not that
          they are a parent. The child app keeps Tasks and Rewards, which are the
          two screens that are genuinely theirs. */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          href: isChildApp ? null : undefined,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: "Children",
          href: isChildApp ? null : undefined,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, size }) => <Gift color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          href: isChildApp ? null : undefined,
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </>
  );
}
