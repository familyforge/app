// Switch between children already set up on this device.
//
// A family may only have one spare phone or tablet. Once each child has signed
// in with a code, swapping between them must not require another — so this
// exchanges the stored refresh token for a live session rather than re-running
// the login flow.

import React, { useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, UserPlus, Check, LogOut } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useChildDeviceStore } from "../lib/state/child-device-store";
import { activateLinkedChild } from "../lib/api/childLogin";

const AVATAR_COLOURS: Array<[string, string]> = [
  ["#FFC24D", "#F2913D"],
  ["#4ADE9B", "#22A06B"],
  ["#FF7A6B", "#E14B57"],
  ["#63C7FF", "#2E7FD1"],
  ["#C084FC", "#8B5CF6"],
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSwitched: () => void;
  onAddChild: () => void;
}

export function ChildSwitcher({ visible, onClose, onSwitched, onAddChild }: Props) {
  const linkedChildren = useChildDeviceStore((s) => s.linkedChildren);
  const activeChildId = useChildDeviceStore((s) => s.activeChildId);
  const setActiveChild = useChildDeviceStore((s) => s.setActiveChild);
  const updateToken = useChildDeviceStore((s) => s.updateToken);
  const unlinkChild = useChildDeviceStore((s) => s.unlinkChild);

  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwitch = async (childId: string, refreshToken: string) => {
    if (childId === activeChildId) return onClose();
    setSwitching(childId);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await activateLinkedChild(refreshToken);

    if (result.success && result.refreshToken) {
      // Refresh tokens rotate — store the new one or the next switch fails.
      updateToken(childId, result.refreshToken);
      setActiveChild(childId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSwitching(null);
      onSwitched();
      onClose();
    } else {
      // Deliberately NOT unlinking. Refresh tokens are single-use, so a race or
      // a dropped connection can fail a perfectly good token — deleting the
      // child here used to strand them, needing a fresh code from a parent.
      // Keep the entry; they can tap again or use a code if it is truly dead.
      setError("Couldn't switch just now. Try again, or ask your parent for a code.");
      setSwitching(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#10202C", borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingBottom: 40 }}>
          <View style={{ alignItems: "center", paddingTop: 12 }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(255,244,224,0.25)" }} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 18, paddingBottom: 10 }}>
            <Text style={{ flex: 1, fontFamily: "Baloo2_800ExtraBold", fontSize: 25, color: "#FFF4E0" }}>
              Who's playing?
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={24} color="rgba(255,244,224,0.5)" />
            </Pressable>
          </View>

          {error && (
            <Text style={{ color: "#FF9E8F", fontFamily: "PlusJakartaSans_500Medium", fontSize: 13.5, paddingHorizontal: 24, paddingBottom: 10 }}>
              {error}
            </Text>
          )}

          <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
            {linkedChildren.map((child, i) => {
              const colours = AVATAR_COLOURS[i % AVATAR_COLOURS.length];
              const active = child.childId === activeChildId;
              const busy = switching === child.childId;

              return (
                <Pressable
                  key={child.childId}
                  onPress={() => handleSwitch(child.childId, child.refreshToken)}
                  disabled={busy}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 22,
                    marginBottom: 10,
                    backgroundColor: active ? "rgba(255,194,77,0.14)" : "rgba(255,244,224,0.05)",
                    borderWidth: 2,
                    borderColor: active ? "rgba(255,194,77,0.5)" : "transparent",
                  }}
                >
                  <LinearGradient
                    colors={colours}
                    style={{ width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ fontFamily: "Baloo2_800ExtraBold", fontSize: 24, color: "#3A2606" }}>
                      {child.name.trim().charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>

                  <Text style={{ flex: 1, marginLeft: 14, fontFamily: "Baloo2_700Bold", fontSize: 20, color: "#FFF4E0" }}>
                    {child.name}
                  </Text>

                  {busy ? (
                    <ActivityIndicator color="#FFC24D" />
                  ) : active ? (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFC24D", alignItems: "center", justifyContent: "center" }}>
                      <Check size={17} color="#3A2606" strokeWidth={3.5} />
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); unlinkChild(child.childId); }}
                    hitSlop={10}
                    style={{ marginLeft: 12 }}
                  >
                    <LogOut size={17} color="rgba(255,244,224,0.3)" />
                  </Pressable>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); onAddChild(); }}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
                padding: 17, borderRadius: 22, marginTop: 4,
                borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,244,224,0.2)",
              }}
            >
              <UserPlus size={19} color="#FFC24D" />
              <Text style={{ fontFamily: "Baloo2_700Bold", fontSize: 16, color: "#FFC24D" }}>
                Add another child
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ChildSwitcher;
