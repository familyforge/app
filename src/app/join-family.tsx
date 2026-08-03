// Joining a family with an invite code.
//
// The missing half of `give-access`. A parent could always generate a code;
// there was no screen anywhere that could accept one, so every invite was a
// dead end.
//
// Reached from the login screen ("Been invited to a family?") and from Profile,
// because an invited person may or may not already have an account.

import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ArrowLeft, Users, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { redeemFamilyInvite } from "../lib/api/familySharing";
import { useAuth } from "../lib/api";
import { theme } from "../lib/theme";

const ROLE_LABEL: Record<string, string> = {
  partner: "partner",
  co_parent: "co-parent",
  guardian: "guardian",
  caregiver: "caregiver",
  parent: "parent",
};

export default function JoinFamilyScreen() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<{ role: string; name: string } | null>(null);

  const ready = code.trim().length >= 4 && name.trim().length > 0 && !busy;

  const submit = async () => {
    if (!ready) return;
    Keyboard.dismiss();

    // Redeeming attaches the invite to auth.uid(), so there must be an account
    // first. Sending them to sign up rather than failing silently.
    if (!user) {
      setError("Please create an account or sign in first, then enter your code.");
      return;
    }

    setBusy(true);
    setError(null);

    const result = await redeemFamilyInvite(code, name);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJoined({ role: ROLE_LABEL[result.role ?? "guardian"] ?? "member", name: result.memberName ?? name });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? "That code didn't work.");
    }
    setBusy(false);
  };

  if (joined) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd, theme.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 340 }}
        />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }}>
          <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: "center" }}>
            <View
              style={{
                width: 84, height: 84, borderRadius: 42,
                backgroundColor: "rgba(16,185,129,0.18)",
                borderWidth: 2, borderColor: "rgba(16,185,129,0.45)",
                alignItems: "center", justifyContent: "center", marginBottom: 22,
              }}
            >
              <Check size={40} color="#34d399" strokeWidth={3} />
            </View>
            <Text style={{ fontSize: 27, fontWeight: "800", color: theme.textPrimary, textAlign: "center" }}>
              You're in
            </Text>
            <Text
              style={{
                fontSize: 16, color: theme.textSecondary, marginTop: 10,
                textAlign: "center", lineHeight: 23,
              }}
            >
              You've joined the family as a {joined.role}.{"\n"}
              You'll see the children you've been given access to.
            </Text>
            <Pressable
              onPress={() => router.replace("/(tabs)/home")}
              style={{
                marginTop: 30, backgroundColor: theme.purple,
                borderRadius: 17, paddingVertical: 16, paddingHorizontal: 34,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Go to the family</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd, theme.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 340 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="always"
          bottomOffset={50}
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              hitSlop={12}
              style={{
                flexDirection: "row", alignItems: "center", gap: 7,
                alignSelf: "flex-start", marginBottom: 20,
                paddingVertical: 9, paddingHorizontal: 14, borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <ArrowLeft size={18} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: "600" }}>Back</Text>
            </Pressable>

            <Animated.View entering={FadeInDown.duration(560)} style={{ alignItems: "center", marginBottom: 36 }}>
              <View
                style={{
                  width: 76, height: 76, borderRadius: 38,
                  backgroundColor: "rgba(139,92,246,0.2)",
                  alignItems: "center", justifyContent: "center", marginBottom: 18,
                }}
              >
                <Users size={36} color={theme.purple} />
              </View>
              <Text style={{ fontSize: 30, fontWeight: "800", color: theme.textPrimary, textAlign: "center" }}>
                Join a family
              </Text>
              <Text
                style={{
                  fontSize: 15.5, color: theme.textSecondary, marginTop: 9,
                  textAlign: "center", lineHeight: 22,
                }}
              >
                Enter the code you were sent to help{"\n"}look after the children.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(150).duration(500)}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>
                Your name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="How the family will see you"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="words"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderRadius: 16, borderWidth: 1, borderColor: theme.border,
                  paddingHorizontal: 16, paddingVertical: 16,
                  fontSize: 17, color: theme.textPrimary, marginBottom: 22,
                }}
              />

              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>
                Invite code
              </Text>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                placeholder="e.g. K4M2XP"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderRadius: 16, borderWidth: 1, borderColor: theme.border,
                  paddingHorizontal: 16, paddingVertical: 16,
                  fontSize: 22, fontWeight: "700", letterSpacing: 4,
                  color: theme.textPrimary, textAlign: "center",
                }}
              />

              {error && (
                <View
                  style={{
                    marginTop: 18, padding: 14, borderRadius: 14,
                    backgroundColor: "rgba(239,68,68,0.12)",
                    borderWidth: 1, borderColor: "rgba(239,68,68,0.35)",
                  }}
                >
                  <Text style={{ color: "#FCA5A5", fontSize: 14, textAlign: "center" }}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={submit}
                disabled={!ready}
                style={{
                  marginTop: 28,
                  backgroundColor: ready ? theme.purple : "rgba(255,255,255,0.1)",
                  borderRadius: 17, paddingVertical: 17,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {busy && <ActivityIndicator size="small" color="#fff" />}
                <Text
                  style={{
                    fontSize: 16.5, fontWeight: "700",
                    color: ready ? "#fff" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {busy ? "Joining…" : "Join family"}
                </Text>
              </Pressable>

              <Text
                style={{
                  color: theme.textMuted, fontSize: 12.5,
                  textAlign: "center", marginTop: 16, lineHeight: 18,
                }}
              >
                You'll only see the children you've been{"\n"}given access to.
              </Text>
            </Animated.View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
