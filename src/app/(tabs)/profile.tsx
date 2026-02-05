/// <reference types="nativewind/types" />

import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Edit3,
  Clock,
  Target,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  MapPin,
  Calendar,
  AlertCircle,
  LogOut,
  BookOpen,
  Crown,
} from "lucide-react-native";
import { useAppStore } from "../../lib/state/app-store";
import {
  useProfileStore,
  MALE_PARENTAL_GOALS,
  FEMALE_PARENTAL_GOALS,
} from "../../lib/state/profile-store";

const MENU_ITEMS = [
  {
    id: "upgrade",
    title: "Upgrade Plan",
    subtitle: "Unlock premium features",
    icon: Crown,
    route: "/upgrade",
    color: "#f59e0b",
    highlight: true,
  },
  {
    id: "edit-profile",
    title: "Edit Profile",
    subtitle: "Name, email, preferences",
    icon: Edit3,
    route: "/edit-profile",
    color: "#10b981",
  },
  {
    id: "my-routines",
    title: "My Routines",
    subtitle: "Morning, school, bedtime routines",
    icon: Clock,
    route: "/my-routines",
    color: "#3b82f6",
  },
  {
    id: "goals-progress",
    title: "My Goals & Progress",
    subtitle: "Track your parenting journey",
    icon: Target,
    route: "/goals-progress",
    color: "#f59e0b",
  },
  {
    id: "give-access",
    title: "Give Access",
    subtitle: "Invite family members",
    icon: Users,
    route: "/give-access",
    color: "#8b5cf6",
  },
  {
    id: "settings",
    title: "Settings",
    subtitle: "Notifications, privacy, sync",
    icon: Settings,
    route: "/settings-full",
    color: "#6b7280",
  },
  {
    id: "support",
    title: "Support & About",
    subtitle: "Help, guidance, app info",
    icon: HelpCircle,
    route: "/support",
    color: "#ec4899",
  },
  {
    id: "learning",
    title: "Learning Assignments",
    subtitle: "Manage learning tasks",
    icon: BookOpen,
    route: "/learning-assignments",
    color: "#06b6d4",
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  const children = useAppStore((state) => state.children);
  const profile = useProfileStore((state) => state.profile);
  const routines = useProfileStore((state) => state.routines);
  const goals = useProfileStore((state) => state.goals);

  const activeChildren = useMemo(
    () => children.filter((child) => !child.archived),
    [children]
  );

  const parentalGoalLabel = useMemo(() => {
    if (!profile.parentalGoal) return null;
    const goalsList = profile.gender === "female" ? FEMALE_PARENTAL_GOALS : MALE_PARENTAL_GOALS;
    return goalsList.find((g) => g.value === profile.parentalGoal)?.label || null;
  }, [profile.parentalGoal, profile.gender]);

  const completionPercent = useMemo(() => {
    const required = [profile.name, profile.avatarUrl, profile.country, profile.language, profile.role, profile.tone];
    const completed = required.filter((item) => typeof item === "string" ? item.trim().length > 0 : Boolean(item));
    return Math.round((completed.length / required.length) * 100);
  }, [profile]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Overview Card */}
        <View className="px-5 pt-4">
          <View className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
            {/* Header with Avatar */}
            <View className="items-center pt-8 pb-6 px-5">
              <Pressable
                onPress={() => router.push("/edit-profile")}
                className="h-28 w-28 rounded-full bg-slate-800 items-center justify-center overflow-hidden border-4 border-emerald-500/30"
              >
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} className="h-28 w-28" />
                ) : (
                  <User size={40} color="#94a3b8" />
                )}
              </Pressable>
              <Text className="text-2xl font-bold text-white mt-4">
                {profile.name || "Your Name"}
              </Text>
              {profile.email ? (
                <Text className="text-sm text-slate-400 mt-1">{profile.email}</Text>
              ) : null}
            </View>

            {/* Quick Info */}
            <View className="px-5 pb-6">
              {/* Children Highlight */}
              <View className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-4">
                <Text className="text-emerald-400 text-center text-lg font-medium">
                  🎉 You have {activeChildren.length} amazing {activeChildren.length === 1 ? "child" : "children"}!
                </Text>
              </View>

              {/* Quick Stats Row */}
              <View className="flex-row gap-3 mb-4">
                {profile.country ? (
                  <View className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/50 p-3 items-center">
                    <MapPin size={14} color="#94a3b8" />
                    <Text className="text-xs text-slate-400 text-center mt-1">{profile.country}</Text>
                  </View>
                ) : null}
                <View className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/50 p-3 items-center">
                  <Text className="text-lg font-bold text-white">{routines.length}</Text>
                  <Text className="text-xs text-slate-400">Routines</Text>
                </View>
                <View className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/50 p-3 items-center">
                  <Text className="text-lg font-bold text-white">{goals.length}</Text>
                  <Text className="text-xs text-slate-400">Goals</Text>
                </View>
                <View className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 items-center">
                  <Text className="text-lg font-bold text-emerald-400">{completionPercent}%</Text>
                  <Text className="text-xs text-slate-400">Complete</Text>
                </View>
              </View>

              {/* Parenting Goal */}
              {parentalGoalLabel ? (
                <View className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <View className="flex-row items-center gap-2">
                    <Target size={14} color="#f59e0b" />
                    <Text className="text-xs text-amber-400">{parentalGoalLabel}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-semibold text-white mb-4">Account</Text>
          <View className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
            {MENU_ITEMS.filter((item) => {
              // Hide upgrade if user is on Forge plan
              if (item.id === "upgrade" && profile.plan === "forge") return false;
              return true;
            }).map((item, index, arr) => {
              const IconComponent = item.icon;
              const isHighlight = "highlight" in item && item.highlight;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  className={`flex-row items-center px-5 py-4 ${
                    index < arr.length - 1 ? "border-b border-slate-800" : ""
                  }`}
                  style={isHighlight ? { backgroundColor: "rgba(245, 158, 11, 0.1)" } : undefined}
                >
                  <View
                    className="h-10 w-10 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <IconComponent size={20} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-medium text-white">{item.title}</Text>
                      {isHighlight && profile.plan !== "forge" && (
                        <View className="bg-amber-500 px-2 py-0.5 rounded">
                          <Text className="text-[10px] font-bold text-black">
                            {profile.plan === "free" ? "FREE" : "PRO"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-slate-400">{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={20} color={isHighlight ? "#f59e0b" : "#64748b"} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-semibold text-white mb-4">Quick Actions</Text>
          
          {/* Find My Kids - Featured Action */}
          <Pressable
            onPress={() => router.push("/findmykids")}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex-row items-center mb-3"
          >
            <View className="h-12 w-12 rounded-full bg-emerald-500/20 items-center justify-center mr-4">
              <MapPin size={24} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-white">Find My Kids</Text>
              <Text className="text-xs text-slate-400 mt-1">Real-time location tracking</Text>
            </View>
            <ChevronRight size={20} color="#10b981" />
          </Pressable>
          
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push("/family-calendar")}
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4 items-center"
            >
              <View className="h-12 w-12 rounded-full bg-blue-500/20 items-center justify-center mb-2">
                <Calendar size={24} color="#3b82f6" />
              </View>
              <Text className="text-sm font-medium text-white">Family Calendar</Text>
              <Text className="text-xs text-slate-400 mt-1">View events</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/deadlines")}
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4 items-center"
            >
              <View className="h-12 w-12 rounded-full bg-red-500/20 items-center justify-center mb-2">
                <AlertCircle size={24} color="#ef4444" />
              </View>
              <Text className="text-sm font-medium text-white">Deadlines</Text>
              <Text className="text-xs text-slate-400 mt-1">Time-sensitive</Text>
            </Pressable>
          </View>
        </View>

        {/* App Version */}
        <View className="px-5 mt-8 items-center">
          <Text className="text-xs text-slate-500">FamilyForge v1.0.0</Text>
          <Text className="text-xs text-slate-600 mt-1">Built with ❤️ for intentional parents</Text>
        </View>

        {/* Logout Button */}
        <View className="px-5 mt-6 mb-8">
          <Pressable
            onPress={() => {
              // TODO: Implement actual logout logic
              router.replace("/login");
            }}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex-row items-center justify-center"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-400 font-medium ml-2">Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
