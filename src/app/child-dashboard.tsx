import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight, BookOpen, Trophy, Calendar, Target, Clock, LogOut, Star, Sparkles, Medal, ChevronRight, AlertCircle } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAppStore } from "../lib/state/app-store";
import { useLearningStore, LEARNING_CATEGORIES, LearningCategory } from "../lib/state/learning-store";
import { cn } from "../lib/cn";

export default function ChildDashboard() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const selectedChildId = useAppStore((s) => s.selectedChildId);
  const setIsChildMode = useAppStore((s) => s.setIsChildMode);
  
  const getPendingTasksForChild = useLearningStore((s) => s.getPendingTasksForChild);
  const getChildProgress = useLearningStore((s) => s.getChildProgress);
  const getAllAssignedSubjects = useLearningStore((s) => s.getAllAssignedSubjects);
  const getTasksForChild = useLearningStore((s) => s.getTasksForChild);
  const getChildGoldTotal = useLearningStore((s) => s.getChildGoldTotal);
  const getChildExamSessions = useLearningStore((s) => s.getChildExamSessions);
  
  // Get the currently selected child
  const child = children.find((c) => c.id === selectedChildId);
  
  if (!child) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-purple-500 to-indigo-600">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-white text-xl text-center">No child profile selected</Text>
          <Pressable
            className="mt-4 bg-white/20 px-6 py-3 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  
  const pendingTasks = getPendingTasksForChild(child.id);
  const progress = getChildProgress(child.id);
  const allTasks = getTasksForChild(child.id);
  const assignedSubjects = getAllAssignedSubjects(child.id);
  
  // Calculate today's points
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPoints = progress
    .filter((p) => p.date === todayStr)
    .reduce((sum, p) => sum + p.pointsEarned, 0);
  
  // Separate general tasks (non-learning) from learning subjects
  const generalTasks = pendingTasks.filter((t) => !t.isQuestionBased);
  const learningTasks = pendingTasks.filter((t) => t.isQuestionBased);
  
  // Get subject info with scores
  const subjectsWithScores = assignedSubjects.map((categoryId) => {
    const category = LEARNING_CATEGORIES.find((c) => c.id === categoryId);
    const sessions = getChildExamSessions(child.id, categoryId);
    const totalGold = getChildGoldTotal(child.id, categoryId);
    const hasAttempted = sessions.length > 0;
    
    return {
      categoryId,
      label: category?.label || categoryId,
      emoji: category?.emoji || "📚",
      totalGold,
      sessions: sessions.length,
      hasAttempted,
    };
  });
  
  // Sort subjects: attempted ones first, then by gold
  subjectsWithScores.sort((a, b) => {
    if (a.hasAttempted && !b.hasAttempted) return -1;
    if (!a.hasAttempted && b.hasAttempted) return 1;
    return b.totalGold - a.totalGold;
  });
  
  const handleLogout = () => {
    setIsChildMode(false);
    router.replace("/");
  };
  
  // Quick action items for children (view-only)
  const quickActions = [
    {
      icon: BookOpen,
      label: "My Learning",
      color: "bg-emerald-500",
      onPress: () => router.push("/child-learning"),
    },
    {
      icon: Trophy,
      label: "Leaderboard",
      color: "bg-amber-500",
      onPress: () => router.push("/leaderboard"),
    },
    {
      icon: Calendar,
      label: "Calendar",
      color: "bg-blue-500",
      onPress: () => router.push("/family-calendar"),
    },
    {
      icon: Target,
      label: "My Tasks",
      color: "bg-rose-500",
      onPress: () => router.push("/(tabs)/tasks"),
    },
  ];
  
  return (
    <View className="flex-1 bg-gradient-to-b from-purple-500 to-indigo-600">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            className="px-6 pt-4 pb-6"
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-white/70 text-lg">Hello,</Text>
                <Text className="text-white text-3xl font-bold">{child.name}! 👋</Text>
              </View>
              <Pressable
                className="bg-white/20 p-3 rounded-full"
                onPress={handleLogout}
              >
                <LogOut size={24} color="white" />
              </Pressable>
            </View>
          </Animated.View>
          
          {/* Points Card */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(600)}
            className="mx-6 bg-white/20 backdrop-blur-lg rounded-3xl p-6 mb-6"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/70 text-sm">Total Points</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-4xl font-bold">{child.points}</Text>
                  <Star size={24} color="#FFD700" fill="#FFD700" className="ml-2" />
                </View>
              </View>
              <View className="bg-white/30 rounded-2xl px-4 py-2">
                <Text className="text-white/70 text-xs">Today</Text>
                <Text className="text-white text-xl font-bold">+{todayPoints}</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Pending Learning Tasks */}
          {learningTasks.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(200).duration(600)}
              className="mx-6 mb-6"
            >
              <View className="flex-row items-center mb-3">
                <Sparkles size={20} color="white" />
                <Text className="text-white text-lg font-semibold ml-2">
                  Learning Tasks
                </Text>
                <View className="bg-amber-400 rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-amber-900 text-xs font-bold">
                    {learningTasks.length} pending
                  </Text>
                </View>
              </View>
              
              <Pressable
                className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 flex-row items-center justify-between"
                onPress={() => router.push("/child-learning")}
              >
                <View className="flex-row items-center flex-1">
                  <View className="bg-emerald-500 w-12 h-12 rounded-full items-center justify-center">
                    <BookOpen size={24} color="white" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">
                      {learningTasks.length} task{learningTasks.length > 1 ? "s" : ""} waiting
                    </Text>
                    <Text className="text-white/70 text-sm">
                      Tap to start learning!
                    </Text>
                  </View>
                </View>
                <ArrowRight size={24} color="white" />
              </Pressable>
            </Animated.View>
          )}
          
          {/* My General Tasks - Non-academic tasks */}
          {generalTasks.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(250).duration(600)}
              className="mx-6 mb-6"
            >
              <View className="flex-row items-center mb-3">
                <Target size={20} color="white" />
                <Text className="text-white text-lg font-semibold ml-2">
                  My General Tasks
                </Text>
              </View>
              
              <View className="bg-white/20 backdrop-blur-lg rounded-2xl overflow-hidden">
                {generalTasks.map((task, index) => (
                  <Pressable
                    key={task.id}
                    className={cn(
                      "p-4 flex-row items-center",
                      index < generalTasks.length - 1 && "border-b border-white/10"
                    )}
                    onPress={() => router.push("/child-learning")}
                  >
                    <View className="bg-rose-500 w-10 h-10 rounded-full items-center justify-center">
                      <Target size={20} color="white" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-medium">{task.title}</Text>
                      <View className="flex-row items-center mt-1">
                        <Star size={12} color="#fbbf24" fill="#fbbf24" />
                        <Text className="text-amber-300 text-xs ml-1">+{task.points} points</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}
          
          {/* My Regular Subjects - All assigned learning subjects */}
          {subjectsWithScores.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(300).duration(600)}
              className="mx-6 mb-6"
            >
              <View className="flex-row items-center mb-3">
                <BookOpen size={20} color="white" />
                <Text className="text-white text-lg font-semibold ml-2">
                  My Regular Subjects
                </Text>
              </View>
              
              <View className="bg-white/20 backdrop-blur-lg rounded-2xl overflow-hidden">
                {subjectsWithScores.map((subject, index) => (
                  <Pressable
                    key={subject.categoryId}
                    className={cn(
                      "p-4 flex-row items-center",
                      index < subjectsWithScores.length - 1 && "border-b border-white/10"
                    )}
                    onPress={() => router.push("/child-learning")}
                  >
                    <Text className="text-3xl mr-3">{subject.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{subject.label}</Text>
                      {subject.hasAttempted ? (
                        <View className="flex-row items-center mt-1">
                          <Medal size={12} color="#fbbf24" />
                          <Text className="text-amber-300 text-xs ml-1">
                            {subject.totalGold} Gold • {subject.sessions} sessions
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center mt-1">
                          <AlertCircle size={12} color="rgba(255,255,255,0.5)" />
                          <Text className="text-white/50 text-xs ml-1">
                            Not attempted yet
                          </Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                ))}
              </View>
              
              {/* Notice if subject not attempted */}
              {subjectsWithScores.some((s) => !s.hasAttempted) && (
                <View className="mt-3 bg-amber-500/20 rounded-xl p-3 flex-row items-center">
                  <AlertCircle size={16} color="#fbbf24" />
                  <Text className="text-amber-300 text-xs ml-2 flex-1">
                    Some subjects haven't been attempted. Ask your parents if you'd like to try them!
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
          
          {/* Quick Actions */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(600)}
            className="px-6 mb-6"
          >
            <Text className="text-white text-lg font-semibold mb-3">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {quickActions.map((action, index) => (
                <Pressable
                  key={action.label}
                  className={cn(
                    "w-[48%] rounded-2xl p-4",
                    action.color
                  )}
                  onPress={action.onPress}
                >
                  <action.icon size={32} color="white" />
                  <Text className="text-white font-semibold mt-2">
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
          
          {/* View-Only Notice */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            className="mx-6 mb-6 bg-white/10 rounded-2xl p-4"
          >
            <View className="flex-row items-center">
              <Clock size={20} color="rgba(255,255,255,0.7)" />
              <Text className="text-white/70 text-sm ml-2 flex-1">
                You can view your tasks, rewards, and calendar. Ask a parent to make changes!
              </Text>
            </View>
          </Animated.View>
          
          {/* Today's Schedule */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(600)}
            className="px-6 mb-8"
          >
            <Text className="text-white text-lg font-semibold mb-3">
              Today's Schedule
            </Text>
            <View className="bg-white/20 backdrop-blur-lg rounded-2xl p-4">
              <View className="flex-row items-center">
                <View className="w-1 h-full bg-white/30 rounded-full absolute left-4" />
                <View className="space-y-4 pl-8">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-emerald-400 -ml-6" />
                    <Text className="text-white ml-4">Morning routine</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-blue-400 -ml-6" />
                    <Text className="text-white ml-4">School day</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-amber-400 -ml-6" />
                    <Text className="text-white ml-4">Learning tasks</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-purple-400 -ml-6" />
                    <Text className="text-white ml-4">Bedtime routine</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
