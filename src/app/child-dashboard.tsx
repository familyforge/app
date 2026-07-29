// FamilyForge Kids — home screen.
//
// Aesthetic: "Treasure Quest", warmed up. Sunrise coral and gold over a deep
// teal night, with each quest card carrying its own vivid colour rather than a
// uniform dark glass. Children respond to saturation and contrast; the first
// pass was handsome but too sober for the audience.
//
// Chores are quests and points are gold — a language a child already has, and
// one the app half-spoke already (the learning store counts "gold").
//
// IMPORTANT: this screen never guesses which child it is showing. It resolves
// strictly from the signed-in session. An earlier version fell back to
// `children[0]`, which — combined with Expo Go sharing one storage sandbox
// between the parent and child builds — meant a parent's leaked session put an
// arbitrary child's name on screen, changing on every refresh.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StatusBar, RefreshControl, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  Flame, Coins, Sparkles, Check, Trophy, BookOpen, Hourglass, PartyPopper, Users, ChevronDown, Gift,
} from "lucide-react-native";
import Animated, {
  FadeInDown, FadeIn, ZoomIn,
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, withSequence, Easing,
} from "react-native-reanimated";
import { useAppStore } from "../lib/state/app-store";
import { useChildDeviceStore } from "../lib/state/child-device-store";
import { loadChildSession, submitTaskForApprovalRemote, loadGoldSummary, type GoldSummary } from "../lib/api/childSession";
import { displayableImage } from "../lib/api/storage";
import { activateLinkedChild } from "../lib/api/childLogin";
import { getStreak } from "../lib/api/streaks";
import { isChildApp } from "../lib/appVariant";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { ChildMenu } from "../components/ChildMenu";
import { useChildTheme, type ChildPalette } from "../lib/childTheme";
import { DeadlineCountdown } from "../components/DeadlineCountdown";
import type { Task } from "../lib/types";


// Each quest gets its own colour so a list of chores reads as a row of toys
// rather than a spreadsheet. Derived from the live palette, so the calm theme
// gets the same variety at a fraction of the chroma.
const questColours = (C: ChildPalette): Array<[string, string]> => [
  [C.gold, C.sun],
  [C.mint, C.teal],
  [C.sky, C.deep],
  [C.violet, C.teal],
  [C.coral, C.sun],
];


const DISPLAY = "Baloo2_800ExtraBold";
const DISPLAY_MID = "Baloo2_700Bold";
const BODY = "PlusJakartaSans_500Medium";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Resolve to `fallback` if a promise has not settled in time.
 *
 * Every network call on this screen is wrapped: without this, one hung request
 * left a child staring at a loading screen with no way forward.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function useBreathing(enabled = true) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) { v.value = 0.5; return; }
    v.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [v, enabled]);
  return useAnimatedStyle(() => ({
    opacity: 0.3 + v.value * 0.35,
    transform: [{ scale: 0.9 + v.value * 0.16 }],
  }));
}

/**
 * One period of gold.
 *
 * `hero` tiles form the top row (Today, This week) and are given more height and
 * a larger numeral, because those are the two a child checks constantly. The
 * lower row carries the longer horizons at a calmer weight.
 *
 * The old layout put a single 82pt total above these, which duplicated the
 * All-time tile and pushed the quests below the fold. The tiles now carry the
 * number on their own.
 */
function GoldTile({
  label, value, tint, hero = false,
}: { label: string; value: number; tint: string; hero?: boolean }) {
  const C = useChildTheme((s) => s.palette);
  return (
    <View
      style={{
        flex: 1,
        borderRadius: hero ? 26 : 22,
        paddingVertical: hero ? 22 : 17,
        paddingHorizontal: hero ? 16 : 8,
        alignItems: "center",
        justifyContent: "center",
        minHeight: hero ? 104 : 84,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: `${tint}55`,
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={[`${tint}30`, "rgba(10,25,34,0.55)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: DISPLAY,
          fontSize: hero ? 40 : 27,
          lineHeight: hero ? 46 : 32,
          color: tint,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: BODY,
          fontSize: hero ? 12.5 : 11,
          color: "rgba(255,246,232,0.78)",
          marginTop: hero ? 4 : 2,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function QuestCard({
  task, index, onClaim, disabled, caregiver,
}: {
  task: Task;
  index: number;
  onClaim: (id: string) => void;
  disabled: boolean;
  /** Who the child calls the person who set this — "Dad", "Nanny". */
  caregiver: string;
}) {
  const C = useChildTheme((s) => s.palette);
  const reduceMotion = useChildTheme((s) => s.reduceMotion);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const waiting = task.status === "pending_approval";
  const done = task.status === "completed";
  const colours = questColours(C)[index % 5];

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 65).springify().damping(15)}>
      <AnimatedPressable
        disabled={waiting || done || disabled}
        onPressIn={() => { if (!reduceMotion) scale.value = withSpring(0.96, { damping: 18 }); }}
        onPressOut={() => { if (!reduceMotion) scale.value = withSpring(1, { damping: 11 }); }}
        onPress={() => onClaim(task.id)}
        style={[
          style,
          {
            marginBottom: 14,
            borderRadius: 28,
            padding: 16,
            backgroundColor: done
              ? "rgba(74,222,155,0.10)"
              : waiting
              ? "rgba(255,201,77,0.12)"
              : "rgba(255,246,232,0.07)",
            borderWidth: 2,
            borderColor: done
              ? "rgba(74,222,155,0.4)"
              : waiting
              ? "rgba(255,201,77,0.5)"
              : "rgba(255,246,232,0.13)",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 5,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <LinearGradient
            colors={done ? [C.mint, "#22A06B"] : waiting ? ["#8A6A2F", "#5C4620"] : colours}
            style={{ width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
          >
            {done ? (
              <Check size={26} color="#06301F" strokeWidth={4} />
            ) : waiting ? (
              <Hourglass size={23} color={C.cream} />
            ) : (
              <Text style={{ fontFamily: DISPLAY, fontSize: 21, color: "#3A2606" }}>{task.points}</Text>
            )}
          </LinearGradient>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: DISPLAY_MID,
                fontSize: 18.5,
                lineHeight: 24,
                color: done ? C.dim : C.cream,
                textDecorationLine: done ? "line-through" : "none",
              }}
            >
              {task.title}
            </Text>
            <Text style={{ fontFamily: BODY, fontSize: 12.5, color: waiting ? C.gold : C.faint, marginTop: 1 }}>
              {done
                ? "Nice work!"
                : waiting
                ? `Waiting for ${caregiver}…`
                : `${task.points} gold · from ${task.assignedByLabel ?? caregiver}`}
            </Text>
            {/* Only tasks the parent gave a deadline show a countdown. */}
            {!done && <DeadlineCountdown dueDate={task.dueDate} endTime={task.endTime} compact />}
          </View>

          {!waiting && !done && (
            <View
              style={{
                paddingHorizontal: 15, paddingVertical: 11, borderRadius: 18,
                backgroundColor: "rgba(74,222,155,0.18)",
                borderWidth: 1.5, borderColor: "rgba(74,222,155,0.45)",
              }}
            >
              <Text style={{ fontFamily: DISPLAY_MID, fontSize: 14.5, color: C.mint }}>I did it!</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function ChildDashboard() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrateChildSession = useAppStore((s) => s.hydrateChildSession);
  const submitTaskForApproval = useAppStore((s) => s.submitTaskForApproval);

  const activeChildId = useChildDeviceStore((s) => s.activeChildId);
  const linkedCount = useChildDeviceStore((s) => s.linkedChildren.length);
  const updateToken = useChildDeviceStore((s) => s.updateToken);
  const unlinkChild = useChildDeviceStore((s) => s.unlinkChild);
  const signOutActive = useChildDeviceStore((s) => s.signOutActive);

  // Resolved strictly from the session — never guessed from a local list.
  const [child, setChild] = useState<{ id: string; name: string; points: number; caregiver: string; photo: string | null } | null>(null);
  const [streak, setStreak] = useState(0);
  const [gold, setGold] = useState<GoldSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mutex: only one load may be in flight at a time.
  const loadingRef = useRef(false);
  // Set when a load is requested while one is already running, so the newer
  // request re-runs afterwards instead of being silently dropped — otherwise
  // switching child during a load would leave the previous child's data up.
  const pendingRef = useRef(false);
  // Always points at the newest `load`, so the re-run uses current state.
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const C = useChildTheme((s) => s.palette);
  const reduceMotion = useChildTheme((s) => s.reduceMotion);
  const setChildTheme = useChildTheme((s) => s.setTheme);
  const glow = useBreathing(!reduceMotion);

  /**
   * Load the active child's session.
   *
   * Guarded by a mutex. Switching child previously fired TWO concurrent loads —
   * one from the switcher's onSwitched, one from `activeChildId` changing and
   * recreating this callback. Refresh tokens are single-use, so the second load
   * refreshed with an already-consumed token, failed, and unlinked the child
   * from the device. That was the hang, and why it stayed broken after a
   * restart.
   */
  const load = useCallback(async (): Promise<void> => {
    if (!isChildApp) return;
    if (loadingRef.current) {
      pendingRef.current = true;
      return;
    }
    loadingRef.current = true;

    try {
      let session = await withTimeout(loadChildSession(), 15000, null);

      // Only re-activate when the live session genuinely is not this child. The
      // switcher has usually just done it, so this is a fallback rather than the
      // normal path.
      if (activeChildId && (!session || session.child.id !== activeChildId)) {
        const linked = useChildDeviceStore
          .getState()
          .linkedChildren.find((c) => c.childId === activeChildId);

        if (linked) {
          const restored = await withTimeout(
            activateLinkedChild(linked.refreshToken),
            15000,
            { success: false as const }
          );

          if (restored.success && restored.refreshToken) {
            updateToken(activeChildId, restored.refreshToken);
            session = await withTimeout(loadChildSession(), 15000, null);
          } else {
            // Deliberately NOT unlinking. A transient network failure used to
            // delete the child from the device, forcing a fresh code from a
            // parent. Keep the entry and let them retry.
            setError("Couldn't sign in just now. Check your connection and try again.");
            setChild(null);
            return;
          }
        }
      }

      if (!session) {
        setChild(null);
        return;
      }

      setError(null);
      // Applied before the first paint of real content, so a child who needs the
      // calm palette never sees a flash of the bright one.
      setChildTheme(session.visualTheme, session.reduceMotion);
      hydrateChildSession(session.child, session.tasks);
      setChild({
        id: session.child.id,
        name: session.child.name,
        points: session.child.points,
        caregiver: session.child.caregiverLabel?.trim() || "your parent",
        photo: displayableImage(session.child.picture),
      });

      // Secondary data must never hold up the screen, nor break it if it fails.
      const s = await withTimeout(getStreak("daily_login"), 10000, null);
      setStreak(s?.currentStreak ?? 0);
      setGold(await withTimeout(loadGoldSummary(session.child.points), 10000, null));
    } finally {
      // In a finally so no early return, thrown error or timeout can leave the
      // screen stuck on "Finding your quests".
      loadingRef.current = false;
      setLoading(false);
      if (pendingRef.current) {
        pendingRef.current = false;
        void loadRef.current();
      }
    }
  }, [activeChildId, hydrateChildSession, updateToken, setChildTheme]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const todo = useMemo(() => tasks.filter((t) => t.status === "pending"), [tasks]);
  const waiting = useMemo(() => tasks.filter((t) => t.status === "pending_approval"), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks]);

  const goldToday = done.reduce((sum, t) => sum + t.points, 0);
  const totalQuests = todo.length + waiting.length + done.length;
  const progress = totalQuests === 0 ? 0 : done.length / totalQuests;

  const handleClaim = useCallback(
    async (taskId: string) => {
      setClaiming(taskId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      submitTaskForApproval(taskId);
      if (!reduceMotion) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1600);
      }
      await submitTaskForApprovalRemote(taskId);
      setClaiming(null);
    },
    [submitTaskForApproval, reduceMotion]
  );

  if (loading || !child) {
    const stuck = !loading && !child;
    return (
      <View style={{ flex: 1, backgroundColor: C.ink }}>
        <LinearGradient colors={[C.teal, C.deep, C.ink]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }}>
          <Sparkles size={46} color={C.gold} />
          <Text style={{ fontFamily: DISPLAY, fontSize: 25, color: C.cream, marginTop: 16, textAlign: "center" }}>
            {loading ? "Finding your quests…" : "Let's get you signed in"}
          </Text>
          {error && (
            <Text style={{ fontFamily: BODY, fontSize: 14, color: C.dim, marginTop: 10, textAlign: "center", lineHeight: 20 }}>
              {error}
            </Text>
          )}
          {stuck && (
            <Pressable
              onPress={() => { setLoading(true); setError(null); void load(); }}
              style={{ marginTop: 18, paddingHorizontal: 26, paddingVertical: 14, borderRadius: 20, borderWidth: 2, borderColor: C.gold }}
            >
              <Text style={{ fontFamily: DISPLAY_MID, fontSize: 15, color: C.gold }}>Try again</Text>
            </Pressable>
          )}
          {!loading && (
            <Pressable
              onPress={() => router.replace("/child-link")}
              style={{ marginTop: 22, paddingHorizontal: 26, paddingVertical: 15, borderRadius: 20, backgroundColor: C.gold }}
            >
              <Text style={{ fontFamily: DISPLAY_MID, fontSize: 16, color: "#3A2606" }}>Enter my code</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </View>
    );
  }

  const firstName = child.name.split(" ")[0];

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      <StatusBar barStyle="light-content" />

      {/* Sunrise over deep water — warm at the top where the child's name and
          gold sit, cooling into night behind the quest list. */}
      <LinearGradient
        colors={[C.sky1, C.sky2, C.teal, C.deep, C.ink]}
        locations={[0, 0.14, 0.42, 0.7, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 620 }}
      />
      <LinearGradient
        colors={[reduceMotion || C.gold === "#B4A582" ? "rgba(180,165,130,0.10)" : "rgba(255,201,77,0.35)", "transparent"]}
        style={{ position: "absolute", top: -140, right: -90, width: 400, height: 400, borderRadius: 200 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* ——— Who's playing ——— */}
          <Animated.View
            entering={FadeInDown.duration(480)}
            style={{ paddingHorizontal: 22, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}
          >
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMenuOpen(true); }}
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <View
                style={{
                  width: 64, height: 64, borderRadius: 32, padding: 3,
                  backgroundColor: "rgba(255,246,232,0.28)",
                }}
              >
                {child.photo ? (
                  <Image
                    source={{ uri: child.photo }}
                    style={{ flex: 1, borderRadius: 30 }}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[C.gold, C.sun]}
                    style={{ flex: 1, borderRadius: 30, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ fontFamily: DISPLAY, fontSize: 28, color: "#3A2606" }}>
                      {firstName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              <View style={{ marginLeft: 13, flex: 1 }}>
                <Text style={{ fontFamily: BODY, fontSize: 13, color: "rgba(255,246,232,0.75)" }}>
                  Welcome back
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text style={{ fontFamily: DISPLAY, fontSize: 29, color: C.cream, lineHeight: 35 }}>
                    {firstName}
                  </Text>
                  <ChevronDown size={19} color="rgba(255,246,232,0.7)" />
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/child-rewards"); }}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18,
                backgroundColor: "rgba(255,201,77,0.28)",
                borderWidth: 1.5, borderColor: "rgba(255,246,232,0.4)",
                marginRight: 8,
              }}
            >
              <Gift size={16} color={C.cream} />
              <Text style={{ fontFamily: DISPLAY_MID, fontSize: 14.5, color: C.cream }}>Rewards</Text>
            </Pressable>

            {streak > 0 && (
              <Animated.View
                entering={ZoomIn.delay(360)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 5,
                  paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18,
                  backgroundColor: "rgba(255,122,107,0.25)",
                  borderWidth: 1.5, borderColor: "rgba(255,246,232,0.35)",
                }}
              >
                <Flame size={17} color={C.cream} />
                <Text style={{ fontFamily: DISPLAY_MID, fontSize: 16, color: C.cream }}>{streak}</Text>
              </Animated.View>
            )}
          </Animated.View>


        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 130 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cream} />}
        >
          {/* ——— Gold ———
              Five periods, no single headline number. The old 82pt total
              duplicated the All-time tile and pushed the quest list below the
              fold on a small handset. */}
          <Animated.View entering={FadeInDown.delay(80).duration(540)} style={{ marginTop: 6 }}>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Animated.View
                style={[glow, {
                  position: "absolute", top: -30,
                  width: 260, height: 200, borderRadius: 130,
                  backgroundColor: "rgba(255,246,232,0.13)",
                }]}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <Coins size={19} color={C.cream} />
                <Text style={{ fontFamily: BODY, fontSize: 12.5, color: "rgba(255,246,232,0.85)", letterSpacing: 1.6 }}>
                  MY GOLD
                </Text>
                {goldToday > 0 && (
                  <View
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 4,
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                      backgroundColor: "rgba(74,222,155,0.28)",
                      borderWidth: 1, borderColor: "rgba(255,246,232,0.3)",
                      marginLeft: 4,
                    }}
                  >
                    <Sparkles size={11} color={C.cream} />
                    <Text style={{ fontFamily: DISPLAY_MID, fontSize: 12, color: C.cream }}>
                      +{goldToday}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {gold ? (
              <View style={{ paddingHorizontal: 20 }}>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                  <GoldTile label="Today" value={gold.today} tint={C.mint} hero />
                  <GoldTile label="This week" value={gold.week} tint={C.sky} hero />
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <GoldTile label="Month" value={gold.month} tint={C.violet} />
                  <GoldTile label="Year" value={gold.year} tint={C.coral} />
                  <GoldTile label="All time" value={gold.allTime} tint={C.gold} />
                </View>
              </View>
            ) : (
              // Placeholder keeps the layout from jumping while the summary loads.
              <View style={{ paddingHorizontal: 20 }}>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1, height: 104, borderRadius: 26, backgroundColor: "rgba(255,246,232,0.06)" }} />
                  <View style={{ flex: 1, height: 104, borderRadius: 26, backgroundColor: "rgba(255,246,232,0.06)" }} />
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={{ flex: 1, height: 84, borderRadius: 22, backgroundColor: "rgba(255,246,232,0.06)" }} />
                  ))}
                </View>
              </View>
            )}
          </Animated.View>

          {/* ——— Progress ——— */}
          {totalQuests > 0 && (
            <Animated.View entering={FadeInDown.delay(150)} style={{ marginTop: 26, paddingHorizontal: 22 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 9 }}>
                <Text style={{ fontFamily: DISPLAY_MID, fontSize: 15.5, color: C.cream }}>Today's adventure</Text>
                <Text style={{ fontFamily: DISPLAY_MID, fontSize: 15.5, color: C.gold }}>
                  {done.length}/{totalQuests}
                </Text>
              </View>
              <View style={{ height: 14, borderRadius: 7, backgroundColor: "rgba(10,25,34,0.35)", overflow: "hidden" }}>
                <Animated.View entering={FadeIn.delay(450)} style={{ width: `${progress * 100}%`, height: 14 }}>
                  <LinearGradient
                    colors={[C.mint, C.gold]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flex: 1, borderRadius: 7 }}
                  />
                </Animated.View>
              </View>
            </Animated.View>
          )}

          {/* ——— Quests ——— */}
          <View style={{ paddingHorizontal: 22, marginTop: 30 }}>
            {todo.length > 0 && (
              <>
                <Text style={{ fontFamily: DISPLAY, fontSize: 22, color: C.cream, marginBottom: 14 }}>
                  Your quests
                </Text>
                {todo.map((t, i) => (
                  <QuestCard key={t.id} task={t} index={i} onClaim={handleClaim} disabled={claiming === t.id} caregiver={child.caregiver} />
                ))}
              </>
            )}

            {waiting.length > 0 && (
              <>
                <Text style={{ fontFamily: DISPLAY, fontSize: 20, color: C.gold, marginTop: 10, marginBottom: 14 }}>
                  Being checked
                </Text>
                {waiting.map((t, i) => (
                  <QuestCard key={t.id} task={t} index={i} onClaim={handleClaim} disabled caregiver={child.caregiver} />
                ))}
              </>
            )}

            {done.length > 0 && (
              <>
                <Text style={{ fontFamily: DISPLAY, fontSize: 20, color: C.mint, marginTop: 10, marginBottom: 14 }}>
                  All finished
                </Text>
                {done.map((t, i) => (
                  <QuestCard key={t.id} task={t} index={i} onClaim={handleClaim} disabled caregiver={child.caregiver} />
                ))}
              </>
            )}

            {totalQuests === 0 && (
              <Animated.View
                entering={FadeIn.delay(180)}
                style={{
                  alignItems: "center", paddingVertical: 44, borderRadius: 30,
                  backgroundColor: "rgba(255,246,232,0.06)",
                  borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,246,232,0.18)",
                }}
              >
                <PartyPopper size={42} color={C.gold} />
                <Text style={{ fontFamily: DISPLAY, fontSize: 23, color: C.cream, marginTop: 14 }}>
                  Nothing to do!
                </Text>
                <Text style={{ fontFamily: BODY, fontSize: 13.5, color: C.dim, marginTop: 6, textAlign: "center", paddingHorizontal: 32 }}>
                  {child.caregiver} will add quests soon.{"\n"}Pull down to check again.
                </Text>
              </Animated.View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>

      <SafeAreaView
        edges={["bottom"]}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(10,25,34,0.92)",
          borderTopWidth: 1, borderTopColor: "rgba(255,246,232,0.1)",
        }}
      >
      {/* ——— Fixed bar ———
          Pinned rather than scrolled: these are the child's only navigation, and
          on a long quest list they were previously unreachable without scrolling
          to the very bottom. */}
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 }}>
            {[
              { icon: BookOpen, label: "Learning", tint: C.mint, to: "/child-learning" },
              { icon: Trophy, label: "Trophies", tint: C.gold, to: "/leaderboard" },
              { icon: Users, label: "Switch", tint: C.sky, onPress: () => setSwitcherOpen(true) },
            ].map(({ icon: Icon, label, tint, to, onPress }) => (
              <Pressable
                key={label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (onPress) onPress();
                  else router.push(to as never);
                }}
                style={{ flex: 1, borderRadius: 24, overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(255,246,232,0.12)" }}
              >
                <BlurView intensity={26} tint="dark" style={{ paddingVertical: 17, alignItems: "center", gap: 7 }}>
                  <Icon size={23} color={tint} />
                  <Text style={{ fontFamily: DISPLAY_MID, fontSize: 13.5, color: C.cream }}>{label}</Text>
                </BlurView>
              </Pressable>
            ))}
          </View>
      </SafeAreaView>

      <ChildMenu
        visible={menuOpen}
        childName={child.name.split(" ")[0]}
        canSwitch={linkedCount > 1}
        onClose={() => setMenuOpen(false)}
        onSwitchChild={() => setSwitcherOpen(true)}
        onAboutMe={() => router.push("/child-about")}
        onRewards={() => router.push("/child-rewards")}
        onLearning={() => router.push("/child-learning")}
        onTrophies={() => router.push("/leaderboard")}
        onSignOut={() => {
          // Keeps the stored token: the child can tap their name to come back
          // without another code. Removing the device link entirely is the
          // separate action inside the switcher.
          signOutActive();
          router.replace("/child-link");
        }}
      />

      <ChildSwitcher
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        // Only flags the spinner. Reloading is driven by `activeChildId`
        // changing, which recreates `load` with the NEW child. Calling load()
        // here ran a closure still holding the previous child's id.
        onSwitched={() => setLoading(true)}
        onAddChild={() => router.push("/child-link")}
      />

      {celebrate && (
        <Animated.View
          entering={ZoomIn.springify().damping(10)}
          exiting={FadeIn}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              paddingHorizontal: 38, paddingVertical: 30, borderRadius: 34, alignItems: "center",
              backgroundColor: "rgba(10,25,34,0.92)",
              borderWidth: 2, borderColor: "rgba(255,201,77,0.55)",
            }}
          >
            <PartyPopper size={50} color={C.gold} />
            <Text style={{ fontFamily: DISPLAY, fontSize: 27, color: C.cream, marginTop: 10 }}>Nice one!</Text>
            <Text style={{ fontFamily: BODY, fontSize: 13.5, color: C.dim, marginTop: 3 }}>
              Sent to {child.caregiver}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
