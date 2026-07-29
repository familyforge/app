// Per-child visual accessibility settings.
//
// Some children find bright, saturated colour genuinely difficult — sensory
// processing differences, autism, photosensitivity, migraine. The Kids app is
// deliberately vivid, which is right for most children and wrong for those ones.
//
// Set by the parent and stored on the child's row, so it follows them onto any
// device rather than being re-toggled on each handset.

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Check, Eye, Waves } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase, isSupabaseConfigured } from "../lib/api/supabase";
import { PALETTES, type ChildThemeName } from "../lib/childTheme";

interface Props {
  visible: boolean;
  childId: string | null;
  childName: string;
  onClose: () => void;
}

/** A miniature of the palette, so a parent can see the difference before saving. */
function Swatch({ theme }: { theme: ChildThemeName }) {
  const p = PALETTES[theme];
  return (
    <View style={{ flexDirection: "row", gap: 5, marginTop: 10 }}>
      {[p.gold, p.mint, p.sky, p.violet, p.coral].map((c, i) => (
        <View key={i} style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: c }} />
      ))}
    </View>
  );
}

export function ChildVisualNeedsModal({ visible, childId, childName, onClose }: Props) {
  const [theme, setTheme] = useState<ChildThemeName>("vivid");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !childId || !isSupabaseConfigured()) return;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> };
          };
        };
      })
        .from("children")
        .select("visual_theme,reduce_motion")
        .eq("id", childId)
        .maybeSingle();
      const row = data as { visual_theme?: string; reduce_motion?: boolean } | null;
      setTheme(row?.visual_theme === "calm" ? "calm" : "vivid");
      setReduceMotion(Boolean(row?.reduce_motion));
      setLoading(false);
    })();
  }, [visible, childId]);

  const save = async () => {
    if (!childId || !isSupabaseConfigured()) return;
    setSaving(true);
    await (supabase as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => { eq: (k: string, val: string) => Promise<unknown> };
      };
    })
      .from("children")
      .update({ visual_theme: theme, reduce_motion: reduceMotion })
      .eq("id", childId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    onClose();
  };

  const options: Array<{ key: ChildThemeName; title: string; blurb: string }> = [
    { key: "vivid", title: "Bright and colourful", blurb: "The standard look. Warm colours, playful." },
    { key: "calm", title: "Calm and muted", blurb: "Dark, soft colours. Gentler on the eyes." },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#15151b", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 38 }}>
          <View style={{ alignItems: "center", paddingTop: 12 }}>
            <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" }} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 22, paddingTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>
                How {childName} sees the app
              </Text>
              <Text style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 19 }}>
                For children who find bright colours or movement difficult.
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 48, alignItems: "center" }}>
              <ActivityIndicator color="#8b5cf6" />
            </View>
          ) : (
            <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
              {options.map((o) => {
                const active = theme === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => { Haptics.selectionAsync(); setTheme(o.key); }}
                    style={{
                      borderRadius: 20, padding: 16, marginBottom: 11,
                      backgroundColor: active ? "rgba(139,92,246,0.16)" : "rgba(255,255,255,0.05)",
                      borderWidth: 2, borderColor: active ? "#8b5cf6" : "rgba(255,255,255,0.09)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Eye size={18} color={active ? "#a78bfa" : "rgba(255,255,255,0.45)"} />
                      <Text style={{ flex: 1, marginLeft: 10, fontSize: 16.5, fontWeight: "700", color: "#fff" }}>
                        {o.title}
                      </Text>
                      {active && (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#8b5cf6", alignItems: "center", justifyContent: "center" }}>
                          <Check size={15} color="#fff" strokeWidth={3.5} />
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4, marginLeft: 28 }}>
                      {o.blurb}
                    </Text>
                    <View style={{ marginLeft: 28 }}>
                      <Swatch theme={o.key} />
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => { Haptics.selectionAsync(); setReduceMotion((v) => !v); }}
                style={{
                  flexDirection: "row", alignItems: "center",
                  borderRadius: 20, padding: 16, marginTop: 4,
                  backgroundColor: reduceMotion ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.05)",
                  borderWidth: 2, borderColor: reduceMotion ? "#10b981" : "rgba(255,255,255,0.09)",
                }}
              >
                <Waves size={18} color={reduceMotion ? "#34d399" : "rgba(255,255,255,0.45)"} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 16.5, fontWeight: "700", color: "#fff" }}>Reduce movement</Text>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3, lineHeight: 18 }}>
                    Stops glowing, bouncing and celebration effects.
                  </Text>
                </View>
                {reduceMotion && (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" }}>
                    <Check size={15} color="#fff" strokeWidth={3.5} />
                  </View>
                )}
              </Pressable>

              <Text style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginTop: 14, lineHeight: 18 }}>
                This is saved to {childName}'s account, so it applies on any device
                they sign in to.
              </Text>

              <Pressable
                onPress={save}
                disabled={saving}
                style={{
                  marginTop: 18, borderRadius: 17, paddingVertical: 16,
                  alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
                  backgroundColor: "#8b5cf6",
                }}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={19} color="#fff" />}
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default ChildVisualNeedsModal;
