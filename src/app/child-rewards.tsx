// FamilyForge Kids — Rewards.
//
// What a child is working towards, grouped by the shape of the goal:
//
//   Today / This week / This month / This year — recurring windows
//   Big goals                                  — unlock at an all-time gold total
//
// Milestone rewards get a progress bar against the child's real gold, because
// "you're 340 of 500 there" motivates in a way a bare price does not. Recurring
// rewards deliberately do not, since the window resets and a bar would imply
// permanence.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StatusBar, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useChildTheme, type ChildPalette } from "../lib/childTheme";
import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Gift, Lock, Check, Trophy, Sparkles } from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { loadChildRewards, loadChildSession, type ChildReward, type RewardPeriod } from "../lib/api/childSession";


const DISPLAY = "Baloo2_800ExtraBold";
const DISPLAY_MID = "Baloo2_700Bold";
const BODY = "PlusJakartaSans_500Medium";

// Tints are palette KEYS, resolved at render — the module cannot read a hook,
// and the palette changes per child.
const GROUPS: Array<{ key: RewardPeriod; label: string; blurb: string; tint: keyof ChildPalette }> = [
  { key: "daily", label: "Today", blurb: "Resets every day", tint: "mint" },
  { key: "weekly", label: "This week", blurb: "Resets on Monday", tint: "sky" },
  { key: "monthly", label: "This month", blurb: "Resets each month", tint: "violet" },
  { key: "yearly", label: "This year", blurb: "Once a year", tint: "coral" },
  { key: "gold_target", label: "Big goals", blurb: "Unlock with total gold", tint: "gold" },
];

function RewardCard({
  reward, tint, index, gold,
}: {
  reward: ChildReward;
  tint: string;
  index: number;
  gold: number;
}) {
  const C = useChildTheme((s) => s.palette);
  const isMilestone = reward.period === "gold_target" && reward.goldTarget != null;
  const target = reward.goldTarget ?? 0;
  const unlocked = isMilestone ? gold >= target : false;
  const pct = isMilestone && target > 0 ? Math.min(1, gold / target) : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 55).springify().damping(15)}
      style={{
        borderRadius: 26,
        padding: 16,
        marginBottom: 12,
        backgroundColor: unlocked ? "rgba(74,222,155,0.12)" : "rgba(255,246,232,0.07)",
        borderWidth: 2,
        borderColor: unlocked ? "rgba(74,222,155,0.45)" : `${tint}44`,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <LinearGradient
          colors={unlocked ? [C.mint, "#22A06B"] : [tint, `${tint}99`]}
          style={{ width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
        >
          {unlocked ? (
            <Check size={24} color="#06301F" strokeWidth={4} />
          ) : isMilestone ? (
            <Lock size={21} color="#3A2606" />
          ) : (
            <Gift size={22} color="#3A2606" />
          )}
        </LinearGradient>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text numberOfLines={2} style={{ fontFamily: DISPLAY_MID, fontSize: 18, lineHeight: 23, color: C.cream }}>
            {reward.title}
          </Text>
          <Text style={{ fontFamily: BODY, fontSize: 12.5, color: unlocked ? C.mint : C.faint, marginTop: 2 }}>
            {unlocked
              ? "Unlocked! Ask about this one"
              : isMilestone
              ? `${gold} of ${target} gold`
              : reward.pointsRequired != null
              ? `${reward.pointsRequired} gold`
              : "Keep going!"}
          </Text>
        </View>
      </View>

      {isMilestone && !unlocked && (
        <View style={{ marginTop: 13 }}>
          <View style={{ height: 11, borderRadius: 6, backgroundColor: "rgba(10,25,34,0.4)", overflow: "hidden" }}>
            <View style={{ width: `${pct * 100}%`, height: 11 }}>
              <LinearGradient
                colors={[C.mint, C.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, borderRadius: 6 }}
              />
            </View>
          </View>
          <Text style={{ fontFamily: BODY, fontSize: 11.5, color: C.faint, marginTop: 5 }}>
            {Math.max(0, target - gold)} gold to go
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function ChildRewardsScreen() {
  const C = useChildTheme((s) => s.palette);
  const [rewards, setRewards] = useState<ChildReward[]>([]);
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [list, session] = await Promise.all([loadChildRewards(), loadChildSession()]);
    setRewards(list);
    setGold(session?.child.points ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const grouped = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      // 'spend' rewards are shown under Today: from a child's point of view
      // "something I can swap gold for right now" is the same idea.
      items: rewards.filter((r) =>
        g.key === "daily" ? r.period === "daily" || r.period === "spend" : r.period === g.key
      ),
    })).filter((g) => g.items.length > 0);
  }, [rewards]);

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[C.sky1, C.sky2, C.teal, C.deep, C.ink]}
        locations={[0, 0.13, 0.4, 0.7, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 460 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Fixed header, matching the dashboard. */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
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
            Rewards
          </Text>
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 13, paddingVertical: 9, borderRadius: 17,
              backgroundColor: "rgba(255,246,232,0.18)",
              borderWidth: 1.5, borderColor: "rgba(255,246,232,0.3)",
            }}
          >
            <Sparkles size={15} color={C.cream} />
            <Text style={{ fontFamily: DISPLAY_MID, fontSize: 16, color: C.cream, fontVariant: ["tabular-nums"] }}>
              {gold}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 46 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cream} />}
        >
          {grouped.map((group, gi) => (
            <View key={group.key} style={{ marginTop: gi === 0 ? 8 : 22 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 9, marginBottom: 12 }}>
                <Text style={{ fontFamily: DISPLAY, fontSize: 21, color: C[group.tint] }}>{group.label}</Text>
                <Text style={{ fontFamily: BODY, fontSize: 12, color: C.faint }}>{group.blurb}</Text>
              </View>
              {group.items.map((r, i) => (
                <RewardCard key={r.id} reward={r} tint={C[group.tint]} index={i} gold={gold} />
              ))}
            </View>
          ))}

          {!loading && grouped.length === 0 && (
            <Animated.View
              entering={FadeIn.delay(150)}
              style={{
                alignItems: "center", paddingVertical: 52, marginTop: 20, borderRadius: 30,
                backgroundColor: "rgba(255,246,232,0.06)",
                borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,246,232,0.18)",
              }}
            >
              <Trophy size={42} color={C.gold} />
              <Text style={{ fontFamily: DISPLAY, fontSize: 22, color: C.cream, marginTop: 14 }}>
                No rewards yet
              </Text>
              <Text style={{ fontFamily: BODY, fontSize: 13.5, color: C.dim, marginTop: 6, textAlign: "center", paddingHorizontal: 34 }}>
                Ask about setting some up.{"\n"}Then start earning gold!
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
