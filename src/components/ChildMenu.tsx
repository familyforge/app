// What a child gets when they tap their own picture.
//
// Scope is deliberately narrow. A child may switch to a sibling, look at their
// own progress, tell their family about themselves, and sign out. Everything
// that changes points, approves work, or touches another child's data stays in
// the parent app — a child menu is not a settings screen.

import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  X, Users, Trophy, Gift, Heart, BookOpen, LogOut, ChevronRight,
} from "lucide-react-native";

const C = {
  cream: "#FFF6E8",
  gold: "#FFC94D",
  mint: "#4ADE9B",
  sky: "#63C7FF",
  violet: "#C084FC",
  coral: "#FF7A6B",
  dim: "rgba(255,246,232,0.55)",
};

const DISPLAY = "Baloo2_800ExtraBold";
const DISPLAY_MID = "Baloo2_700Bold";
const BODY = "PlusJakartaSans_500Medium";

interface Props {
  visible: boolean;
  childName: string;
  /** Shown only when more than one child is set up on this device. */
  canSwitch: boolean;
  onClose: () => void;
  onSwitchChild: () => void;
  onAboutMe: () => void;
  onRewards: () => void;
  onLearning: () => void;
  onTrophies: () => void;
  onSignOut: () => void;
}

export function ChildMenu({
  visible, childName, canSwitch, onClose,
  onSwitchChild, onAboutMe, onRewards, onLearning, onTrophies, onSignOut,
}: Props) {
  const initial = childName.trim().charAt(0).toUpperCase();

  const items = [
    canSwitch && {
      key: "switch",
      icon: Users,
      tint: C.sky,
      label: "Switch child",
      blurb: "Someone else's turn",
      onPress: onSwitchChild,
    },
    {
      key: "about",
      icon: Heart,
      tint: C.coral,
      label: "About me",
      blurb: "Tell your family about you",
      onPress: onAboutMe,
    },
    { key: "rewards", icon: Gift, tint: C.gold, label: "My rewards", blurb: "What you're working towards", onPress: onRewards },
    { key: "learning", icon: BookOpen, tint: C.mint, label: "My learning", blurb: "Practice and play", onPress: onLearning },
    { key: "trophies", icon: Trophy, tint: C.violet, label: "My trophies", blurb: "How you're doing", onPress: onTrophies },
  ].filter(Boolean) as Array<{
    key: string; icon: typeof Users; tint: string; label: string; blurb: string; onPress: () => void;
  }>;

  const go = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    fn();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
      <View
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          backgroundColor: "#10202C",
          borderTopLeftRadius: 34, borderTopRightRadius: 34,
          paddingBottom: 42,
        }}
      >
        <View style={{ alignItems: "center", paddingTop: 12 }}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(255,246,232,0.25)" }} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14 }}>
          <LinearGradient
            colors={[C.gold, "#F2913D"]}
            style={{ width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontFamily: DISPLAY, fontSize: 23, color: "#3A2606" }}>{initial}</Text>
          </LinearGradient>
          <Text style={{ flex: 1, marginLeft: 13, fontFamily: DISPLAY, fontSize: 24, color: C.cream }}>
            {childName}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={23} color="rgba(255,246,232,0.5)" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 18 }}>
          {items.map(({ key, icon: Icon, tint, label, blurb, onPress }) => (
            <Pressable
              key={key}
              onPress={() => go(onPress)}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingVertical: 14, paddingHorizontal: 14,
                borderRadius: 20, marginBottom: 8,
                backgroundColor: "rgba(255,246,232,0.05)",
              }}
            >
              <View
                style={{
                  width: 42, height: 42, borderRadius: 15,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: `${tint}22`,
                  borderWidth: 1.5, borderColor: `${tint}55`,
                }}
              >
                <Icon size={20} color={tint} />
              </View>
              <View style={{ flex: 1, marginLeft: 13 }}>
                <Text style={{ fontFamily: DISPLAY_MID, fontSize: 17, color: C.cream }}>{label}</Text>
                <Text style={{ fontFamily: BODY, fontSize: 12, color: C.dim, marginTop: 1 }}>{blurb}</Text>
              </View>
              <ChevronRight size={19} color="rgba(255,246,232,0.3)" />
            </Pressable>
          ))}

          {/* Set apart: signing out means needing a new code from a grown-up. */}
          <Pressable
            onPress={() => go(onSignOut)}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              paddingVertical: 15, borderRadius: 20, marginTop: 8,
              borderWidth: 1.5, borderColor: "rgba(255,122,107,0.35)",
            }}
          >
            <LogOut size={18} color={C.coral} />
            <Text style={{ fontFamily: DISPLAY_MID, fontSize: 16, color: C.coral }}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default ChildMenu;
