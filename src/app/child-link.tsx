// Child app — device sign-in.
//
// Deliberately reuses the existing email + 6-digit PIN auth so this works today
// with no new backend: once a parent has created a child account, the child can
// sign in here immediately. A friendlier pairing flow (short code / QR, so a
// child never has to type an email) is the planned replacement — see the child
// auth stage. Keeping the credential model identical means that swap is a change
// of input widget, not a change of auth.

import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator as RNActivityIndicator } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Sparkles, LogIn, ArrowLeft, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { redeemChildLoginCode, activateLinkedChild } from "../lib/api/childLogin";
import { useChildDeviceStore } from "../lib/state/child-device-store";
import { PinInput } from "../components/PinInput";
import { theme } from "../lib/theme";

export default function ChildLinkScreen() {
  const linkChild = useChildDeviceStore((s) => s.linkChild);
  // Someone is already signed in on this device if there is an active child.
  // Reaching this screen from the switcher must therefore be cancellable —
  // tapping "Add another child" by mistake previously stranded the child here
  // with no way back to their own dashboard.
  const activeChildId = useChildDeviceStore((s) => s.activeChildId);
  // Children already set up on this device. Signing out keeps their token, so
  // they can resume with one tap instead of asking for another code — which is
  // what makes an accidental sign-out recoverable rather than a dead end.
  const linkedChildren = useChildDeviceStore((s) => s.linkedChildren);
  const setActiveChild = useChildDeviceStore((s) => s.setActiveChild);
  const updateToken = useChildDeviceStore((s) => s.updateToken);
  const unlinkChild = useChildDeviceStore((s) => s.unlinkChild);
  const canGoBack = Boolean(activeChildId);
  const [resuming, setResuming] = useState<string | null>(null);

  const resume = async (childId: string, token: string) => {
    setResuming(childId);
    setError(null);
    const result = await activateLinkedChild(token);
    if (result.success && result.refreshToken) {
      updateToken(childId, result.refreshToken);
      setActiveChild(childId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/child-dashboard");
    } else {
      // Token is genuinely dead — drop it so they are asked for a code rather
      // than left tapping a button that can never work.
      unlinkChild(childId);
      setError("That sign-in expired. Ask for a new code.");
    }
    setResuming(null);
  };
  const [firstName, setFirstName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = firstName.trim().length > 0 && code.length === 6 && !busy;

  const handleSignIn = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);

    const result = await redeemChildLoginCode(firstName, code);

    if (result.success && result.childId && result.refreshToken) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Remember this child on the device. They never need a code again, and a
      // sibling who has also signed in once can be switched to without one.
      linkChild({
        childId: result.childId,
        name: result.childName ?? firstName.trim(),
        refreshToken: result.refreshToken,
      });
      router.replace("/child-dashboard");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // One message for every failure: a child should never see "invalid
      // credentials", and it must not reveal whether the name or the code was
      // the wrong half.
      setError(result.error ?? "That code didn't work. Ask your parent for a new one.");
      setCode("");
    }
    setBusy(false);
  };

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
            {/* Always rendered. Hiding it made the screen a dead end for anyone
                whose device had no linked child left — which is exactly the
                person most likely to be looking for a way out. */}
            <Pressable
                onPress={() => {
                  // In order of what "back" should mean here.
                  if (activeChildId) {
                    router.replace("/child-dashboard");
                    return;
                  }
                  const target = linkedChildren[0];
                  if (target) {
                    void resume(target.childId, target.refreshToken);
                    return;
                  }
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }
                  // Nothing behind us: the only way on is a code, so put the
                  // keyboard away and leave them on the form.
                  Keyboard.dismiss();
                }}
                hitSlop={12}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 7,
                  alignSelf: "flex-start", marginBottom: 18,
                  paddingVertical: 9, paddingHorizontal: 14, borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                <ArrowLeft size={18} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: "600" }}>
                  Back
                </Text>
            </Pressable>

            <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: "center", marginBottom: 40 }}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: "rgba(139,92,246,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <Sparkles size={36} color={theme.purple} />
              </View>
              <Text style={{ fontSize: 32, fontWeight: "800", color: theme.textPrimary, textAlign: "center" }}>
                Hi there!
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: theme.textSecondary,
                  marginTop: 8,
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                Ask your parent for your{"\n"}sign-in details to get started
              </Text>
            </Animated.View>

            {linkedChildren.length > 0 && (
              <Animated.View entering={FadeInUp.delay(120).duration(500)} style={{ marginBottom: 28 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 10, marginLeft: 4 }}>
                  Tap to come straight back
                </Text>
                {linkedChildren.map((c) => (
                  <Pressable
                    key={c.childId}
                    onPress={() => resume(c.childId, c.refreshToken)}
                    disabled={resuming !== null}
                    style={{
                      flexDirection: "row", alignItems: "center",
                      padding: 13, borderRadius: 20, marginBottom: 9,
                      backgroundColor: "rgba(139,92,246,0.14)",
                      borderWidth: 1.5, borderColor: "rgba(139,92,246,0.4)",
                    }}
                  >
                    <View
                      style={{
                        width: 46, height: 46, borderRadius: 23,
                        backgroundColor: theme.purple,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontFamily: "Baloo2_800ExtraBold", fontSize: 21, color: "#fff" }}>
                        {c.name.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, marginLeft: 13, fontFamily: "Baloo2_700Bold", fontSize: 18, color: theme.textPrimary }}>
                      {c.name}
                    </Text>
                    {resuming === c.childId ? (
                      <RNActivityIndicator size="small" color={theme.purple} />
                    ) : (
                      <RotateCcw size={19} color={theme.purple} />
                    )}
                  </Pressable>
                ))}
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                  Or sign in someone new below
                </Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>
                Your first name
              </Text>
              <View
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  marginBottom: 24,
                }}
              >
                <TextInput
                  style={{ paddingVertical: 16, fontSize: 20, color: theme.textPrimary, fontWeight: "600" }}
                  placeholder="e.g. Gideon"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={firstName}
                  onChangeText={setFirstName}
                  // Capitals are ignored when matching, so autocapitalise is a
                  // convenience here rather than something the child must get right.
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>
                Your 6-digit code
              </Text>
              <PinInput
                value={code}
                onChange={setCode}
                activeColor={theme.purple}
                filledColor={theme.teal}
                boxBackground={theme.surfaceElevated}
                borderColor={theme.border}
                textColor={theme.textPrimary}
              />
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10, textAlign: "center" }}>
                Ask your parent to make you a code. It only lasts 2 minutes!
              </Text>

              {error && (
                <View
                  style={{
                    marginTop: 18,
                    backgroundColor: "rgba(239,68,68,0.12)",
                    borderColor: "rgba(239,68,68,0.35)",
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <Text style={{ color: "#FCA5A5", fontSize: 14, textAlign: "center" }}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleSignIn}
                disabled={!ready}
                style={{
                  marginTop: 28,
                  backgroundColor: ready ? theme.purple : "rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  paddingVertical: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <LogIn size={20} color={ready ? "#fff" : "rgba(255,255,255,0.3)"} />
                )}
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: ready ? "#fff" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {busy ? "Signing in..." : "Let's go!"}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
