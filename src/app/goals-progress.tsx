/// <reference types="nativewind/types" />

import { useState, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ChevronLeft,
  Plus,
  Target,
  X,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  Award,
  TrendingUp,
} from "lucide-react-native";
import {
  Goal,
  createGoal,
  useProfileStore,
  MALE_PARENTAL_GOALS,
  FEMALE_PARENTAL_GOALS,
} from "../lib/state/profile-store";

export default function GoalsProgressScreen() {
  const router = useRouter();

  const profile = useProfileStore((state) => state.profile);
  const goals = useProfileStore((state) => state.goals);
  const addGoal = useProfileStore((state) => state.addGoal);
  const updateGoal = useProfileStore((state) => state.updateGoal);
  const removeGoal = useProfileStore((state) => state.removeGoal);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalProgress, setGoalProgress] = useState(0);

  const parentalGoal = useMemo(() => {
    if (!profile.parentalGoal) return null;
    const goalsList = profile.gender === "female" ? FEMALE_PARENTAL_GOALS : MALE_PARENTAL_GOALS;
    return goalsList.find((g) => g.value === profile.parentalGoal);
  }, [profile.parentalGoal, profile.gender]);

  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, g) => sum + g.progress, 0);
    return Math.round(totalProgress / goals.length);
  }, [goals]);

  const completedGoals = useMemo(() => {
    return goals.filter((g) => g.progress >= 100).length;
  }, [goals]);

  const openAddModal = () => {
    setEditingGoalId(null);
    setGoalTitle("");
    setGoalProgress(0);
    setModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setGoalTitle(goal.title);
    setGoalProgress(goal.progress);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!goalTitle.trim()) return;

    if (editingGoalId) {
      updateGoal(editingGoalId, {
        title: goalTitle.trim(),
        progress: goalProgress,
      });
    } else {
      const newGoal = createGoal(goalTitle.trim());
      newGoal.progress = goalProgress;
      addGoal(newGoal);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingGoalId) {
      removeGoal(editingGoalId);
      setModalOpen(false);
    }
  };

  const adjustProgress = (goalId: string, delta: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
      updateGoal(goalId, { progress: newProgress });
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "#10b981";
    if (progress >= 75) return "#3b82f6";
    if (progress >= 50) return "#f59e0b";
    if (progress >= 25) return "#f97316";
    return "#ef4444";
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "My Goals & Progress",
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-xl font-bold text-white">My Goals & Progress</Text>
        <Pressable
          onPress={openAddModal}
          className="h-10 w-10 rounded-full bg-emerald-500/20 items-center justify-center"
        >
          <Plus size={24} color="#10b981" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Stats Overview */}
        <View className="px-5 pt-6">
          <View className="flex-row gap-3 mb-6">
            {/* Overall Progress */}
            <View className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <TrendingUp size={16} color="#10b981" />
                <Text className="text-xs text-emerald-400">Overall Progress</Text>
              </View>
              <Text className="text-3xl font-bold text-white">{overallProgress}%</Text>
            </View>
            
            {/* Completed */}
            <View className="flex-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Award size={16} color="#f59e0b" />
                <Text className="text-xs text-amber-400">Completed</Text>
              </View>
              <Text className="text-3xl font-bold text-white">
                {completedGoals}/{goals.length}
              </Text>
            </View>
          </View>

          {/* Main Parenting Goal */}
          {parentalGoal && (
            <View className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 mb-6">
              <Text className="text-xs text-blue-400 mb-1">Your #1 Parenting Goal</Text>
              <Text className="text-lg font-semibold text-white">{parentalGoal.label}</Text>
            </View>
          )}
        </View>

        {/* Goals List */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-white">Custom Goals</Text>
          </View>

          {goals.length === 0 ? (
            <View className="rounded-2xl border border-slate-800 border-dashed p-8 items-center">
              <Target size={32} color="#64748b" />
              <Text className="text-slate-400 text-center mt-3">
                No goals yet. Add a goal to track your parenting progress!
              </Text>
              <Pressable
                onPress={openAddModal}
                className="mt-4 px-6 py-3 rounded-full bg-emerald-500"
              >
                <Text className="text-white font-medium">Add Your First Goal</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {goals.map((goal) => {
                const color = getProgressColor(goal.progress);
                const isComplete = goal.progress >= 100;

                return (
                  <Pressable
                    key={goal.id}
                    onPress={() => openEditModal(goal)}
                    className={`rounded-2xl border bg-slate-900 overflow-hidden ${
                      isComplete ? "border-emerald-500/30" : "border-slate-800"
                    }`}
                  >
                    {/* Goal Header */}
                    <View className="flex-row items-center justify-between p-4">
                      <View className="flex-1 mr-3">
                        <Text
                          className={`text-base font-medium ${
                            isComplete ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {isComplete ? "✓ " : ""}{goal.title}
                        </Text>
                        <Text className="text-xs text-slate-400 mt-1">
                          {goal.progress}% complete
                        </Text>
                      </View>

                      {/* Quick Adjust Buttons */}
                      <View className="flex-row items-center gap-1">
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            adjustProgress(goal.id, -10);
                          }}
                          className="h-8 w-8 rounded-full bg-slate-800 items-center justify-center"
                        >
                          <ChevronDown size={16} color="#94a3b8" />
                        </Pressable>
                        <View className="w-12 items-center">
                          <Text className="text-lg font-bold" style={{ color }}>
                            {goal.progress}%
                          </Text>
                        </View>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            adjustProgress(goal.id, 10);
                          }}
                          className="h-8 w-8 rounded-full bg-slate-800 items-center justify-center"
                        >
                          <ChevronUp size={16} color="#94a3b8" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="h-2 bg-slate-800">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${goal.progress}%`,
                          backgroundColor: color,
                        }}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-semibold text-white mb-4">Tips for Success</Text>
          <View className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <View className="gap-3">
              <View className="flex-row items-start gap-3">
                <Text className="text-lg">💡</Text>
                <Text className="text-sm text-slate-300 flex-1">
                  Break big goals into smaller, achievable milestones
                </Text>
              </View>
              <View className="flex-row items-start gap-3">
                <Text className="text-lg">📅</Text>
                <Text className="text-sm text-slate-300 flex-1">
                  Review and update your progress weekly
                </Text>
              </View>
              <View className="flex-row items-start gap-3">
                <Text className="text-lg">🎉</Text>
                <Text className="text-sm text-slate-300 flex-1">
                  Celebrate small wins along the way
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-800">
              <Pressable onPress={() => setModalOpen(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-lg font-semibold text-white">
                {editingGoalId ? "Edit Goal" : "New Goal"}
              </Text>
              <Pressable onPress={handleSave} disabled={!goalTitle.trim()}>
                <Check size={24} color={goalTitle.trim() ? "#10b981" : "#475569"} />
              </Pressable>
            </View>

            <View className="px-5 py-6">
              {/* Title */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Goal Title</Text>
              <TextInput
                value={goalTitle}
                onChangeText={setGoalTitle}
                placeholder="e.g., Spend quality time with kids daily"
                placeholderTextColor="#64748b"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4"
              />

              {/* Progress Slider */}
              <Text className="text-sm font-medium text-slate-400 mb-2">
                Current Progress: {goalProgress}%
              </Text>
              <View className="flex-row items-center gap-3 mb-4">
                <Pressable
                  onPress={() => setGoalProgress(Math.max(0, goalProgress - 10))}
                  className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
                >
                  <ChevronDown size={20} color="#94a3b8" />
                </Pressable>
                <View className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${goalProgress}%` }}
                  />
                </View>
                <Pressable
                  onPress={() => setGoalProgress(Math.min(100, goalProgress + 10))}
                  className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
                >
                  <ChevronUp size={20} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Quick Progress Buttons */}
              <View className="flex-row gap-2 mb-6">
                {[0, 25, 50, 75, 100].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setGoalProgress(value)}
                    className={`flex-1 py-2 rounded-lg items-center ${
                      goalProgress === value
                        ? "bg-emerald-500"
                        : "bg-slate-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        goalProgress === value ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {value}%
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Delete Button */}
              {editingGoalId && (
                <Pressable
                  onPress={handleDelete}
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 bg-red-500/10"
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="text-red-400 font-medium">Delete Goal</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
