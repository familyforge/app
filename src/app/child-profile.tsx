import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Star,
  Medal,
  Trophy,
  BookOpen,
  Target,
  Award,
  TrendingUp,
  Calendar,
  ChevronRight,
  Edit3,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAppStore } from "../lib/state/app-store";
import { useLearningStore, LEARNING_CATEGORIES } from "../lib/state/learning-store";

import { ChildAboutCard } from "../components/ChildAboutCard";
export default function ChildProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const children = useAppStore((s) => s.children);
  const child = children.find((c) => c.id === id);
  
  const getChildProgress = useLearningStore((s) => s.getChildProgress);
  const getAllAssignedSubjects = useLearningStore((s) => s.getAllAssignedSubjects);
  const getChildGoldTotal = useLearningStore((s) => s.getChildGoldTotal);
  const getChildExamSessions = useLearningStore((s) => s.getChildExamSessions);
  
  if (!child) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Profile",
            headerStyle: { backgroundColor: "#0f172a" },
            headerTintColor: "#fff",
            headerLeft: () => (
              <Pressable onPress={() => router.back()} className="p-2">
                <ArrowLeft size={24} color="white" />
              </Pressable>
            ),
          }}
        />
        <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
          <Text className="text-white text-xl">Child not found</Text>
          <Pressable
            className="mt-4 bg-violet-600 px-6 py-3 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </>
    );
  }
  
  const firstName = child.name.split(" ")[0] || child.name;
  const initials = child.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CH";
  
  // Get progress data
  const progress = getChildProgress(child.id);
  const assignedSubjects = getAllAssignedSubjects(child.id);
  
  // Calculate total stats
  const totalPointsEarned = progress.reduce((sum, p) => sum + p.pointsEarned, 0);
  const totalQuestionsCompleted = progress.reduce((sum, p) => sum + p.questionsAnswered, 0);
  
  // Get subject scores with leaderboard data
  const subjectScores = assignedSubjects.map((categoryId) => {
    const category = LEARNING_CATEGORIES.find((c) => c.id === categoryId);
    const sessions = getChildExamSessions(child.id, categoryId);
    const totalGold = getChildGoldTotal(child.id, categoryId);
    
    // Calculate average score from sessions
    const totalCorrect = sessions.reduce((sum, s) => sum + s.totalCorrect, 0);
    const totalQuestions = sessions.length * 10; // 10 questions per session
    const avgScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    return {
      categoryId,
      label: category?.label || categoryId,
      emoji: category?.emoji || "📚",
      totalGold,
      sessionsCount: sessions.length,
      avgScore,
    };
  });
  
  // Sort by gold earned
  subjectScores.sort((a, b) => b.totalGold - a.totalGold);
  
  // Calculate total gold across all subjects
  const totalGold = subjectScores.reduce((sum, s) => sum + s.totalGold, 0);
  
  // Get weekly progress (last 7 days)
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  
  const weeklyProgress = progress.filter((p) => p.date >= weekAgoStr);
  const weeklyPoints = weeklyProgress.reduce((sum, p) => sum + p.pointsEarned, 0);
  const weeklyQuestions = weeklyProgress.reduce((sum, p) => sum + p.questionsAnswered, 0);
  
  return (
    <>
      <Stack.Screen
        options={{
          title: `${firstName}'s Profile`,
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="white" />
            </Pressable>
          ),
        }}
      />
      
      <SafeAreaView className="flex-1 bg-slate-900" edges={["bottom"]}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Profile Header - Centered */}
          <Animated.View
            entering={FadeInDown.duration(500)}
            className="items-center pt-8 pb-8 px-6"
          >
            {child.picture ? (
              <Image
                source={{ uri: child.picture }}
                className="w-32 h-32 rounded-full mb-4 border-4 border-violet-500"
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-violet-600 items-center justify-center mb-4 border-4 border-violet-400">
                <Text className="text-white text-5xl font-bold">{initials}</Text>
              </View>
            )}
            
            <Text className="text-white text-2xl font-bold">{firstName}</Text>
            <Text className="text-slate-400 mt-1">
              {child.age} years old{child.class ? ` • ${child.class}` : ""}
            </Text>
            
            {child.interests && child.interests.length > 0 && (
              <View className="flex-row flex-wrap justify-center gap-2 mt-3">
                {child.interests.slice(0, 3).map((interest, idx) => (
                  <View key={idx} className="bg-slate-800 px-3 py-1 rounded-full">
                    <Text className="text-slate-300 text-xs">{interest}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
          
          {/* Stats Overview */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(500)}
            className="px-5 mb-6"
          >
            <View className="flex-row gap-3">
              {/* Total Points */}
              <View className="flex-1 bg-amber-500/20 rounded-2xl p-4 border border-amber-500/30">
                <View className="flex-row items-center gap-2 mb-2">
                  <Star size={20} color="#f59e0b" />
                  <Text className="text-amber-400 font-semibold">Points</Text>
                </View>
                <Text className="text-white text-3xl font-bold">{child.points}</Text>
                <Text className="text-slate-400 text-xs mt-1">Total accumulated</Text>
              </View>
              
              {/* Total Gold */}
              <View className="flex-1 bg-yellow-500/20 rounded-2xl p-4 border border-yellow-500/30">
                <View className="flex-row items-center gap-2 mb-2">
                  <Medal size={20} color="#eab308" />
                  <Text className="text-yellow-400 font-semibold">Gold</Text>
                </View>
                <Text className="text-white text-3xl font-bold">{totalGold}</Text>
                <Text className="text-slate-400 text-xs mt-1">Learning rewards</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Weekly Progress */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            className="px-5 mb-6"
          >
            <View className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
              <View className="flex-row items-center gap-2 mb-4">
                <TrendingUp size={20} color="#8b5cf6" />
                <Text className="text-white font-semibold text-lg">This Week</Text>
              </View>
              
              <View className="flex-row">
                <View className="flex-1 items-center">
                  <Text className="text-violet-400 text-2xl font-bold">{weeklyPoints}</Text>
                  <Text className="text-slate-400 text-xs">Points</Text>
                </View>
                <View className="w-px bg-slate-700" />
                <View className="flex-1 items-center">
                  <Text className="text-emerald-400 text-2xl font-bold">{weeklyQuestions}</Text>
                  <Text className="text-slate-400 text-xs">Questions</Text>
                </View>
                <View className="w-px bg-slate-700" />
                <View className="flex-1 items-center">
                  <Text className="text-amber-400 text-2xl font-bold">{child.rewards.length}</Text>
                  <Text className="text-slate-400 text-xs">Rewards</Text>
                </View>
              </View>
            </View>
          </Animated.View>
          
          {/* Subject Leaderboard */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            className="px-5 mb-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Trophy size={20} color="#f59e0b" />
                <Text className="text-white font-semibold text-lg">Subject Leaderboard</Text>
              </View>
            </View>
            
            <View className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              {subjectScores.length === 0 ? (
                <View className="p-6 items-center">
                  <BookOpen size={40} color="#64748b" />
                  <Text className="text-slate-400 text-center mt-3">
                    No subjects assigned yet
                  </Text>
                </View>
              ) : (
                subjectScores.map((subject, index) => (
                  <View
                    key={subject.categoryId}
                    className={`flex-row items-center p-4 ${
                      index !== subjectScores.length - 1 ? "border-b border-slate-700" : ""
                    }`}
                  >
                    {/* Rank */}
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      index === 0 ? "bg-amber-500" :
                      index === 1 ? "bg-slate-400" :
                      index === 2 ? "bg-amber-700" :
                      "bg-slate-700"
                    }`}>
                      <Text className={`font-bold ${
                        index < 3 ? "text-white" : "text-slate-400"
                      }`}>
                        {index + 1}
                      </Text>
                    </View>
                    
                    {/* Subject Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-lg">{subject.emoji}</Text>
                        <Text className="text-white font-medium">{subject.label}</Text>
                      </View>
                      <Text className="text-slate-500 text-xs">
                        {subject.sessionsCount} session{subject.sessionsCount !== 1 ? "s" : ""} 
                        {subject.avgScore > 0 ? ` • ${subject.avgScore}% avg` : ""}
                      </Text>
                    </View>
                    
                    {/* Gold Badge */}
                    <View className="flex-row items-center gap-1 bg-yellow-500/20 px-3 py-1.5 rounded-full">
                      <Medal size={16} color="#eab308" />
                      <Text className="text-yellow-400 font-bold">{subject.totalGold}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </Animated.View>
          
          {/* What the child told their family. Placed above the progress report
              because a child's own words matter more than their statistics. */}
          <Animated.View entering={FadeInUp.delay(350).duration(500)} className="px-5">
            <ChildAboutCard childId={child.id} childName={child.name} />
          </Animated.View>

          {/* Progress Report */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(500)}
            className="px-5 mb-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Target size={20} color="#10b981" />
                <Text className="text-white font-semibold text-lg">Progress Report</Text>
              </View>
            </View>
            
            <View className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
              <View className="gap-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400">Total Points Earned</Text>
                  <Text className="text-white font-semibold">{totalPointsEarned}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400">Questions Answered</Text>
                  <Text className="text-white font-semibold">{totalQuestionsCompleted}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400">Rewards Redeemed</Text>
                  <Text className="text-white font-semibold">{child.rewards.length}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400">Subjects Assigned</Text>
                  <Text className="text-white font-semibold">{assignedSubjects.length}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400">Learning Sessions</Text>
                  <Text className="text-white font-semibold">
                    {subjectScores.reduce((sum, s) => sum + s.sessionsCount, 0)}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
          
          {/* Quick Actions */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(500)}
            className="px-5 pb-8"
          >
            <Text className="text-white font-semibold text-lg mb-3">Quick Actions</Text>
            
            <View className="gap-3">
              <Pressable
                onPress={() => router.push("/goals-progress")}
                className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center">
                    <TrendingUp size={20} color="#10b981" />
                  </View>
                  <Text className="text-white font-medium">View Full Progress</Text>
                </View>
                <ChevronRight size={20} color="#64748b" />
              </Pressable>
              
              <Pressable
                onPress={() => router.push("/leaderboard")}
                className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center">
                    <Trophy size={20} color="#f59e0b" />
                  </View>
                  <Text className="text-white font-medium">View Leaderboard</Text>
                </View>
                <ChevronRight size={20} color="#64748b" />
              </Pressable>
              
              <Pressable
                onPress={() => router.push("/learning-assignments")}
                className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-violet-500/20 items-center justify-center">
                    <BookOpen size={20} color="#8b5cf6" />
                  </View>
                  <Text className="text-white font-medium">Manage Learning</Text>
                </View>
                <ChevronRight size={20} color="#64748b" />
              </Pressable>
              
              <Pressable
                onPress={() => router.push("/(tabs)/children")}
                className="bg-violet-600 rounded-2xl p-4 flex-row items-center justify-center gap-3"
              >
                <Edit3 size={20} color="#fff" />
                <Text className="text-white font-semibold">Edit Profile</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
