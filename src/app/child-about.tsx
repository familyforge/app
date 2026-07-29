// FamilyForge Kids — About me.
//
// The one screen in the app where the child contributes rather than consumes.
// Everything else shows them what a grown-up decided; this is theirs to fill in,
// and their family sees it.
//
// Saves per field on blur rather than behind a "Save" button: a child should not
// be able to lose an answer by navigating away, and a single big save button
// invites all-or-nothing anxiety about getting it right.

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useChildTheme } from "../lib/childTheme";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Check, Heart } from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  ABOUT_PROMPTS, loadAboutMe, saveAboutMe, loadChildParentId, loadChildSession,
  type AboutAnswers,
} from "../lib/api/childSession";


const DISPLAY = "Baloo2_800ExtraBold";
const DISPLAY_MID = "Baloo2_700Bold";
const BODY = "PlusJakartaSans_500Medium";

export default function ChildAboutScreen() {
  const C = useChildTheme((s) => s.palette);
  const [answers, setAnswers] = useState<AboutAnswers>({});
  const [childId, setChildId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [saved, session, pid] = await Promise.all([
        loadAboutMe(),
        loadChildSession(),
        loadChildParentId(),
      ]);
      setAnswers(saved);
      setChildId(session?.child.id ?? null);
      setParentId(pid);
      setLoading(false);
    })();
  }, []);

  const commit = useCallback(
    async (key: string, value: string) => {
      if (!childId) return;
      const ok = await saveAboutMe(childId, parentId, key, value);
      if (ok) {
        Haptics.selectionAsync();
        setSavedKey(key);
        setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1600);
      }
    },
    [childId, parentId]
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[C.sky1, C.sky2, C.teal, C.deep, C.ink]}
        locations={[0, 0.13, 0.4, 0.7, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 440 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10 }}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            hitSlop={12}
            style={{
              width: 42, height: 42, borderRadius: 21,
              alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(255,246,232,0.16)",
            }}
          >
            <ArrowLeft size={20} color={C.cream} />
          </Pressable>
          <Text style={{ flex: 1, marginLeft: 13, fontFamily: DISPLAY, fontSize: 27, color: C.cream }}>
            About me
          </Text>
          <Heart size={22} color={C.cream} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={C.gold} />
          </View>
        ) : (
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            bottomOffset={60}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
          >
            <Animated.Text
              entering={FadeIn}
              style={{ fontFamily: BODY, fontSize: 14, color: "rgba(255,246,232,0.8)", lineHeight: 20, marginBottom: 20 }}
            >
              Tell your family a bit about you. Answer as many as you like — you
              can change them any time.
            </Animated.Text>

            {ABOUT_PROMPTS.map((prompt, i) => (
              <Animated.View
                key={prompt.key}
                entering={FadeInDown.delay(40 + i * 45).springify().damping(16)}
                style={{ marginBottom: 14 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7, marginLeft: 4 }}>
                  <Text style={{ fontSize: 16 }}>{prompt.emoji}</Text>
                  <Text style={{ fontFamily: DISPLAY_MID, fontSize: 15.5, color: C.cream, flex: 1 }}>
                    {prompt.label}
                  </Text>
                  {savedKey === prompt.key && (
                    <Animated.View entering={FadeIn} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Check size={13} color={C.mint} strokeWidth={3.5} />
                      <Text style={{ fontFamily: BODY, fontSize: 11.5, color: C.mint }}>Saved</Text>
                    </Animated.View>
                  )}
                </View>

                <TextInput
                  defaultValue={answers[prompt.key] ?? ""}
                  onEndEditing={(e) => commit(prompt.key, e.nativeEvent.text)}
                  placeholder={prompt.placeholder}
                  placeholderTextColor="rgba(255,246,232,0.28)"
                  multiline={prompt.multiline}
                  maxLength={prompt.multiline ? 240 : 60}
                  style={{
                    backgroundColor: "rgba(255,246,232,0.07)",
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: "rgba(255,246,232,0.13)",
                    paddingHorizontal: 16,
                    paddingVertical: prompt.multiline ? 14 : 15,
                    minHeight: prompt.multiline ? 92 : undefined,
                    textAlignVertical: prompt.multiline ? "top" : "center",
                    fontFamily: DISPLAY_MID,
                    fontSize: 16.5,
                    color: C.cream,
                  }}
                />
              </Animated.View>
            ))}

            <Text
              style={{
                fontFamily: BODY, fontSize: 12.5, color: C.faint,
                textAlign: "center", marginTop: 14, lineHeight: 18,
              }}
            >
              Your answers save on their own.{"\n"}Your family can see them.
            </Text>
          </KeyboardAwareScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
