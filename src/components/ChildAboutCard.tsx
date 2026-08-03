// What a child chose to tell their family, shown to the parent.
//
// The Kids app has let a child fill this in since the About-me screen shipped,
// but nothing read it back — the answers were write-only, which is worse than
// not asking. A child writing "something I find hard" and having no one ever see
// it is the opposite of what that prompt is for.
//
// The two reflective answers are pulled out and shown first. Favourites are
// pleasant; "proud of" and "find hard" are the ones a parent should actually
// respond to.

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Heart, Star, MessageCircleHeart } from "lucide-react-native";
import { ABOUT_PROMPTS } from "../lib/api/childSession";
import { loadChildAbout, type AboutEntry } from "../lib/api/familySharing";

interface Props {
  childId: string;
  childName: string;
}

/** Prompts worth surfacing above the light-hearted ones. */
const REFLECTIVE = new Set(["proud", "hard"]);

const LABELS: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  ABOUT_PROMPTS.map((p) => [p.key, { label: p.label, emoji: p.emoji }])
);

export function ChildAboutCard({ childId, childName }: Props) {
  const [entries, setEntries] = useState<AboutEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadChildAbout(childId).then((rows) => {
      if (!cancelled) setEntries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  if (entries === null) {
    return (
      <View className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  }

  const firstName = childName.split(" ")[0];

  if (entries.length === 0) {
    return (
      <View className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <View className="mb-2 flex-row items-center gap-2">
          <Heart size={18} color="#f472b6" />
          <Text className="text-lg font-semibold text-white">About {firstName}</Text>
        </View>
        <Text className="text-sm leading-relaxed text-slate-400">
          {firstName} hasn't filled this in yet. In the Kids app they can tap
          their picture and choose "About me" to tell you their favourites — and
          anything they're proud of or finding hard.
        </Text>
      </View>
    );
  }

  const reflective = entries.filter((e) => REFLECTIVE.has(e.key));
  const favourites = entries.filter((e) => !REFLECTIVE.has(e.key));

  return (
    <View className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <View className="mb-4 flex-row items-center gap-2">
        <Heart size={18} color="#f472b6" />
        <Text className="text-lg font-semibold text-white">About {firstName}</Text>
        <Text className="ml-auto text-xs text-slate-500">in their words</Text>
      </View>

      {/* Reflective answers first, and visually distinct — these are the ones
          worth a conversation, not a glance. */}
      {reflective.map((e) => {
        const meta = LABELS[e.key];
        const isHard = e.key === "hard";
        return (
          <View
            key={e.key}
            className={`mb-3 rounded-xl border p-4 ${
              isHard ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"
            }`}
          >
            <View className="mb-1.5 flex-row items-center gap-2">
              {isHard ? (
                <MessageCircleHeart size={15} color="#fbbf24" />
              ) : (
                <Star size={15} color="#34d399" />
              )}
              <Text className={`text-xs font-semibold ${isHard ? "text-amber-300" : "text-emerald-300"}`}>
                {meta?.label ?? e.key}
              </Text>
            </View>
            <Text className="text-[15px] leading-relaxed text-white">{e.value}</Text>
          </View>
        );
      })}

      {favourites.length > 0 && (
        <View className="mt-1 flex-row flex-wrap gap-2">
          {favourites.map((e) => {
            const meta = LABELS[e.key];
            return (
              <View
                key={e.key}
                className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2"
              >
                <Text className="text-[11px] text-slate-400">
                  {meta?.emoji ?? "•"} {(meta?.label ?? e.key).replace(/^My /, "")}
                </Text>
                <Text className="mt-0.5 text-sm font-medium text-white">{e.value}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default ChildAboutCard;
