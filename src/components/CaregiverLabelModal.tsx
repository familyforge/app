// "What do your children call you?"
//
// Drives every piece of copy in the Kids app. Without it a child is told to ask
// "your grown-up", which is placeholder text pretending to be finished — a child
// knows Dad, Nanny, Grandad.
//
// Stored on `parents` and mirrored onto `children` by a trigger (migration 016),
// because a child cannot read the parents table under RLS.

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, TextInput, ActivityIndicator } from "react-native";
import { X, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase, isSupabaseConfigured } from "../lib/api/supabase";

const PRESETS = ["Mum", "Dad", "Mummy", "Daddy", "Grandma", "Grandad", "Nanny", "Auntie", "Uncle"];

interface Props {
  visible: boolean;
  current?: string | null;
  onClose: () => void;
  onSaved: (label: string) => void;
}

export function CaregiverLabelModal({ visible, current, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<string>(current ?? "");
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(current ?? "");
      setCustom(PRESETS.includes(current ?? "") ? "" : current ?? "");
      setError(null);
    }
  }, [visible, current]);

  const value = (custom.trim() || selected).trim();

  const save = async () => {
    if (!value || !isSupabaseConfigured()) return;
    setSaving(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) {
      setError("You need to be signed in.");
      setSaving(false);
      return;
    }

    const { error: err } = await supabase
      .from("parents")
      .update({ caregiver_label: value } as never)
      .eq("id", auth.user.id);

    setSaving(false);

    if (err) {
      setError("Couldn't save that. Please try again.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved(value);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#15151b", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 38 }}>
          <View style={{ alignItems: "center", paddingTop: 12 }}>
            <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" }} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 22, paddingTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>
                What do your children call you?
              </Text>
              <Text style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 19 }}>
                Used all through the Kids app — "Sent to Dad", "Waiting for Nanny".
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9, paddingHorizontal: 22, paddingTop: 20 }}>
            {PRESETS.map((preset) => {
              const active = value === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => { Haptics.selectionAsync(); setSelected(preset); setCustom(""); }}
                  style={{
                    paddingHorizontal: 17, paddingVertical: 11, borderRadius: 15,
                    backgroundColor: active ? "#8b5cf6" : "rgba(255,255,255,0.07)",
                    borderWidth: 1.5,
                    borderColor: active ? "#a78bfa" : "rgba(255,255,255,0.1)",
                  }}
                >
                  <Text style={{ color: active ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: "700", fontSize: 15 }}>
                    {preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
            <Text style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
              Or type your own
            </Text>
            <TextInput
              value={custom}
              onChangeText={(t) => { setCustom(t); setSelected(""); }}
              placeholder="e.g. Papa"
              placeholderTextColor="rgba(255,255,255,0.28)"
              maxLength={20}
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                borderRadius: 15, paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 16, color: "#fff",
                borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)",
              }}
            />
          </View>

          {error && (
            <Text style={{ color: "#FCA5A5", fontSize: 13.5, paddingHorizontal: 22, paddingTop: 12 }}>{error}</Text>
          )}

          <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
            <Pressable
              onPress={save}
              disabled={!value || saving}
              style={{
                backgroundColor: value ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                borderRadius: 17, paddingVertical: 16,
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : value ? <Check size={19} color="#fff" /> : null}
              <Text style={{ color: value ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: "700", fontSize: 16 }}>
                {value ? `Save "${value}"` : "Pick one"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default CaregiverLabelModal;
