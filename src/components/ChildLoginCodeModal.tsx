// Parent-facing: generate a one-time sign-in code for a child.
//
// The code is deliberately large and spaced out — a parent reads it aloud to a
// child across a room. The countdown is prominent because the code dies after
// 120 seconds, and a parent needs to see that before it silently stops working.

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, RefreshCw, KeyRound, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  issueChildLoginCode,
  secondsUntil,
  CHILD_CODE_TTL_SECONDS,
  type IssuedChildCode,
} from "../lib/api/childLogin";

interface Props {
  visible: boolean;
  childId: string | null;
  childName: string;
  onClose: () => void;
}

export function ChildLoginCodeModal({ visible, childId, childName, onClose }: Props) {
  const [issued, setIssued] = useState<IssuedChildCode | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!childId) return;
    setBusy(true);
    setError(null);
    const result = await issueChildLoginCode(childId);
    if (result) {
      setIssued(result);
      setRemaining(secondsUntil(result.expiresAt));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError("Couldn't create a code. Please try again.");
    }
    setBusy(false);
  }, [childId]);

  // Fresh code each time the sheet opens; stale state cleared on close so a
  // previous child's code can never be shown against another child's name.
  useEffect(() => {
    if (visible) {
      setIssued(null);
      setRemaining(0);
      generate();
    }
  }, [visible, generate]);

  useEffect(() => {
    if (!issued) return;
    const id = setInterval(() => setRemaining(secondsUntil(issued.expiresAt)), 250);
    return () => clearInterval(id);
  }, [issued]);

  const expired = Boolean(issued) && remaining <= 0;
  const pct = issued ? Math.max(0, Math.min(1, remaining / CHILD_CODE_TTL_SECONDS)) : 0;
  const urgent = remaining <= 30;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: "#15151b", borderRadius: 26, overflow: "hidden" }}>
          <LinearGradient
            colors={["rgba(139,92,246,0.25)", "rgba(79,70,229,0.12)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 22 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: "rgba(139,92,246,0.25)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <KeyRound size={20} color="#a78bfa" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
                  {childName}'s sign-in code
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 2 }}>
                  For the FamilyForge Kids app
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <X size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
          </LinearGradient>

          <View style={{ padding: 22 }}>
            {busy && !issued ? (
              <View style={{ paddingVertical: 34, alignItems: "center" }}>
                <ActivityIndicator color="#a78bfa" />
              </View>
            ) : error ? (
              <Text style={{ color: "#FCA5A5", textAlign: "center", paddingVertical: 22 }}>{error}</Text>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 44,
                    fontWeight: "800",
                    color: expired ? "rgba(255,255,255,0.25)" : "#fff",
                    textAlign: "center",
                    letterSpacing: 10,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {issued?.code ?? "------"}
                </Text>

                <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 18, overflow: "hidden" }}>
                  <View
                    style={{
                      height: 4,
                      width: `${pct * 100}%`,
                      backgroundColor: expired ? "#6b7280" : urgent ? "#EF4444" : "#10B981",
                      borderRadius: 2,
                    }}
                  />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
                  <Clock size={14} color={expired ? "#9CA3AF" : urgent ? "#EF4444" : "rgba(255,255,255,0.6)"} />
                  <Text style={{ color: expired ? "#9CA3AF" : urgent ? "#EF4444" : "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" }}>
                    {expired ? "Code expired" : `Expires in ${remaining}s`}
                  </Text>
                </View>

                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", marginTop: 18, lineHeight: 19 }}>
                  In the Kids app, {childName} signs in with their first name
                  {"\n"}(<Text style={{ color: "#fff", fontWeight: "700" }}>{childName}</Text>) and this code.
                </Text>

                <Pressable
                  onPress={generate}
                  disabled={busy}
                  style={{
                    marginTop: 20,
                    backgroundColor: expired ? "#8b5cf6" : "rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    paddingVertical: 15,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <RefreshCw size={17} color="#fff" />
                  )}
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    {expired ? "Get a new code" : "Generate new code"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ChildLoginCodeModal;
