// Contextual upgrade prompt.
//
// Shown in place of a feature the current plan cannot use, at the moment the
// user reaches for it — rather than leaving /upgrade reachable only from a
// Profile menu row that has to be hunted for.

import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Sparkles, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { PLAN_LABELS } from "../lib/plans";
import type { PlanType } from "../lib/state/profile-store";

interface UpgradePromptProps {
  /** What the user was trying to do, e.g. "share access with a partner". */
  feature: string;
  /** One line on why it is worth having. */
  benefit?: string;
  /** Plan that unlocks it. Defaults to Forge. */
  requiredPlan?: PlanType;
  /** Analytics/deep-link hint carried through to the upgrade screen. */
  source?: string;
  compact?: boolean;
}

export function UpgradePrompt({
  feature,
  benefit,
  requiredPlan = "forge",
  source,
  compact = false,
}: UpgradePromptProps) {
  const planName = PLAN_LABELS[requiredPlan];

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/upgrade", params: source ? { source } : {} });
  };

  return (
    <Pressable onPress={open} accessibilityRole="button">
      <LinearGradient
        colors={["rgba(245,158,11,0.18)", "rgba(139,92,246,0.14)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(245,158,11,0.35)",
          padding: compact ? 14 : 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(245,158,11,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={19} color="#F59E0B" />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Sparkles size={13} color="#F59E0B" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#F59E0B", letterSpacing: 0.4 }}>
                {planName.toUpperCase()} FEATURE
              </Text>
            </View>
            <Text
              style={{
                fontSize: compact ? 14 : 15,
                fontWeight: "700",
                color: "#fff",
                marginTop: 3,
              }}
            >
              Upgrade to {feature}
            </Text>
            {benefit && !compact && (
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, lineHeight: 18 }}>
                {benefit}
              </Text>
            )}
          </View>

          <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default UpgradePrompt;
