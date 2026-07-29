// The daily affirmation, shown as a centred card.
//
// Deliberately quiet: no illustration, no confetti, no call to action. A parent
// reading "we see you" at 7am should not then be sold something. One line, one
// button, gone.

import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { Heart } from "lucide-react-native";

interface Props {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

export function AffirmationModal({ visible, message, onDismiss }: Props) {
  const close = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Animated.View
        entering={FadeIn.duration(220)}
        style={{ flex: 1, backgroundColor: "rgba(6,8,16,0.72)", alignItems: "center", justifyContent: "center", padding: 26 }}
      >
        <Animated.View entering={ZoomIn.springify().damping(15)} style={{ width: "100%", maxWidth: 420 }}>
          <View
            style={{
              borderRadius: 32,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              shadowColor: "#000",
              shadowOpacity: 0.45,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 16 },
            }}
          >
            <BlurView intensity={40} tint="dark">
              <LinearGradient
                colors={["rgba(139,92,246,0.22)", "rgba(236,72,153,0.10)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 28, paddingTop: 34, paddingBottom: 26, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 54, height: 54, borderRadius: 27,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: "rgba(236,72,153,0.18)",
                    borderWidth: 1, borderColor: "rgba(236,72,153,0.35)",
                    marginBottom: 20,
                  }}
                >
                  <Heart size={24} color="#f9a8d4" />
                </View>

                <Text
                  style={{
                    fontSize: 20,
                    lineHeight: 30,
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "600",
                    letterSpacing: 0.1,
                  }}
                >
                  {message}
                </Text>

                <Pressable
                  onPress={close}
                  style={{
                    marginTop: 28,
                    alignSelf: "stretch",
                    borderRadius: 18,
                    paddingVertical: 15,
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.13)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.18)",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Thank you</Text>
                </Pressable>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default AffirmationModal;
