import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Globe,
  MapPin,
  Crown,
  TrendingUp,
  ChevronDown,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp, FadeIn } from "react-native-reanimated";
import { cn } from "../lib/cn";
import { useAppStore } from "../lib/state/app-store";
import {
  useLearningStore,
  LEARNING_CATEGORIES,
  LearningCategory,
  LeaderboardEntry,
} from "../lib/state/learning-store";

type LeaderboardTab = "country" | "worldwide";

export default function LeaderboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  
  const children = useAppStore((s) => s.children);
  const selectedChildId = useAppStore((s) => s.selectedChildId);
  
  const getCountryLeaderboard = useLearningStore((s) => s.getCountryLeaderboard);
  const getWorldwideLeaderboard = useLearningStore((s) => s.getWorldwideLeaderboard);
  const getChildGoldTotal = useLearningStore((s) => s.getChildGoldTotal);
  const getChildExamSessions = useLearningStore((s) => s.getChildExamSessions);
  const hasSystemQuestions = useLearningStore((s) => s.hasSystemQuestions);
  
  const child = children.find((c) => c.id === selectedChildId);
  // In a real app, country would come from the child's profile
  // For now using a mock default - this would be extended when backend is implemented
  const childCountry = "United Kingdom"; // Default country
  
  // Get subjects with system questions (leaderboard-eligible)
  const leaderboardSubjects = LEARNING_CATEGORIES.filter(
    (cat) => cat.id !== "words" && hasSystemQuestions(cat.id)
  );
  
  const [selectedCategory, setSelectedCategory] = useState<LearningCategory>(
    (params.categoryId as LearningCategory) || leaderboardSubjects[0]?.id || "maths"
  );
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("country");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  // Mock children data for leaderboard (in production, this would come from a backend)
  // For now, create mock data including the current child
  const allChildrenData = [
    ...(child ? [{ id: child.id, name: child.name, country: childCountry }] : []),
    // Mock top performers
    { id: "mock-1", name: "Emma W.", country: "United Kingdom" },
    { id: "mock-2", name: "Oliver S.", country: "United States" },
    { id: "mock-3", name: "Sophia L.", country: "Canada" },
    { id: "mock-4", name: "James T.", country: "United Kingdom" },
    { id: "mock-5", name: "Ava M.", country: "Australia" },
    { id: "mock-6", name: "Noah B.", country: "United Kingdom" },
    { id: "mock-7", name: "Isabella R.", country: "Germany" },
    { id: "mock-8", name: "Liam H.", country: "France" },
    { id: "mock-9", name: "Mia K.", country: "United Kingdom" },
    { id: "mock-10", name: "Lucas P.", country: "Spain" },
  ];
  
  // Get leaderboards
  const countryLeaderboard = getCountryLeaderboard(selectedCategory, childCountry, allChildrenData);
  const worldwideLeaderboard = getWorldwideLeaderboard(selectedCategory, allChildrenData);
  
  const currentLeaderboard = activeTab === "country" ? countryLeaderboard : worldwideLeaderboard;
  
  // Get child's stats for this category
  const childGold = child ? getChildGoldTotal(child.id, selectedCategory) : 0;
  const childSessions = child ? getChildExamSessions(child.id, selectedCategory).length : 0;
  const childRank = currentLeaderboard.find((e) => e.childId === child?.id)?.rank || null;
  
  const getCategoryInfo = (categoryId: LearningCategory) => {
    return LEARNING_CATEGORIES.find((c) => c.id === categoryId);
  };
  
  const selectedCategoryInfo = getCategoryInfo(selectedCategory);
  
  // Rank badge colors
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: "bg-amber-500", text: "text-amber-900", icon: Crown };
    if (rank === 2) return { bg: "bg-slate-300", text: "text-slate-800", icon: Medal };
    if (rank === 3) return { bg: "bg-amber-700", text: "text-amber-100", icon: Medal };
    return { bg: "bg-slate-700", text: "text-white", icon: null };
  };
  
  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              className="bg-slate-800 p-2 rounded-full"
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="white" />
            </Pressable>
            <Text className="text-white font-bold text-lg">Leaderboard</Text>
            <View className="w-10" />
          </View>
          
          {/* Category Selector */}
          <Pressable
            className="bg-slate-800 rounded-xl p-4 flex-row items-center justify-between"
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <View className="flex-row items-center">
              <Text className="text-3xl mr-3">{selectedCategoryInfo?.emoji}</Text>
              <View>
                <Text className="text-white font-semibold">{selectedCategoryInfo?.label}</Text>
                <Text className="text-slate-400 text-sm">Select subject</Text>
              </View>
            </View>
            <ChevronDown
              size={20}
              color="#94a3b8"
              style={{ transform: [{ rotate: showCategoryPicker ? "180deg" : "0deg" }] }}
            />
          </Pressable>
          
          {/* Category Dropdown */}
          {showCategoryPicker && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="bg-slate-800 rounded-xl mt-2 overflow-hidden"
            >
              {leaderboardSubjects.map((cat) => (
                <Pressable
                  key={cat.id}
                  className={cn(
                    "flex-row items-center p-4 border-b border-slate-700",
                    selectedCategory === cat.id && "bg-violet-500/20"
                  )}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text className="text-2xl mr-3">{cat.emoji}</Text>
                  <Text
                    className={
                      selectedCategory === cat.id
                        ? "text-violet-400 font-medium"
                        : "text-white"
                    }
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>
        
        {/* Child's Stats Card */}
        {child && (
          <Animated.View
            entering={FadeInDown.duration(500)}
            className="mx-6 my-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/70 text-sm">Your All-Time Gold</Text>
                <View className="flex-row items-center mt-1">
                  <Medal size={24} color="#fbbf24" />
                  <Text className="text-amber-300 text-3xl font-bold ml-2">{childGold}</Text>
                </View>
                <Text className="text-white/60 text-xs mt-1">{childSessions} sessions completed</Text>
              </View>
              
              {childRank ? (
                <View className="items-center">
                  <Text className="text-white/70 text-sm">Your Rank</Text>
                  <View className="bg-white/20 rounded-xl px-4 py-2 mt-1">
                    <Text className="text-white text-2xl font-bold">#{childRank}</Text>
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <Text className="text-white/70 text-sm">Your Rank</Text>
                  <View className="bg-white/10 rounded-xl px-4 py-2 mt-1">
                    <Text className="text-white/50 text-sm">Not ranked</Text>
                  </View>
                </View>
              )}
            </View>
            
            {!childRank && childGold > 0 && (
              <View className="mt-3 pt-3 border-t border-white/20">
                <View className="flex-row items-center">
                  <TrendingUp size={16} color="#22c55e" />
                  <Text className="text-emerald-300 text-sm ml-2">
                    Keep going! Earn more Gold to enter the top 100!
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}
        
        {/* Tab Switcher */}
        <View className="flex-row mx-6 mb-4 bg-slate-800 rounded-xl p-1">
          <Pressable
            className={cn(
              "flex-1 flex-row items-center justify-center py-3 rounded-lg",
              activeTab === "country" && "bg-violet-600"
            )}
            onPress={() => setActiveTab("country")}
          >
            <MapPin size={16} color={activeTab === "country" ? "white" : "#94a3b8"} />
            <Text
              className={cn(
                "ml-2 font-medium",
                activeTab === "country" ? "text-white" : "text-slate-400"
              )}
            >
              {childCountry}
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex-1 flex-row items-center justify-center py-3 rounded-lg",
              activeTab === "worldwide" && "bg-violet-600"
            )}
            onPress={() => setActiveTab("worldwide")}
          >
            <Globe size={16} color={activeTab === "worldwide" ? "white" : "#94a3b8"} />
            <Text
              className={cn(
                "ml-2 font-medium",
                activeTab === "worldwide" ? "text-white" : "text-slate-400"
              )}
            >
              Worldwide
            </Text>
          </Pressable>
        </View>
        
        {/* Leaderboard List */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {currentLeaderboard.length === 0 ? (
            <Animated.View
              entering={FadeIn.duration(500)}
              className="bg-slate-800 rounded-2xl p-8 items-center mt-4"
            >
              <Trophy size={48} color="#64748b" />
              <Text className="text-white text-lg font-semibold mt-4">No rankings yet</Text>
              <Text className="text-slate-400 text-center mt-2">
                Be the first to earn Gold in {selectedCategoryInfo?.label}!
              </Text>
            </Animated.View>
          ) : (
            currentLeaderboard.map((entry, index) => {
              const rankStyle = getRankStyle(entry.rank);
              const isCurrentChild = entry.childId === child?.id;
              
              return (
                <Animated.View
                  key={entry.childId}
                  entering={FadeInUp.delay(index * 50).duration(400)}
                  className={cn(
                    "bg-slate-800 rounded-xl p-4 mb-2 flex-row items-center",
                    isCurrentChild && "border-2 border-violet-500"
                  )}
                >
                  {/* Rank */}
                  <View
                    className={cn(
                      "w-10 h-10 rounded-full items-center justify-center mr-3",
                      rankStyle.bg
                    )}
                  >
                    {rankStyle.icon ? (
                      <rankStyle.icon size={20} color={entry.rank === 1 ? "#78350f" : "#fff"} />
                    ) : (
                      <Text className={cn("font-bold", rankStyle.text)}>{entry.rank}</Text>
                    )}
                  </View>
                  
                  {/* Name & Country */}
                  <View className="flex-1">
                    <Text className={cn("font-semibold", isCurrentChild ? "text-violet-400" : "text-white")}>
                      {entry.childName} {isCurrentChild && "(You)"}
                    </Text>
                    {activeTab === "worldwide" && (
                      <Text className="text-slate-400 text-sm">{entry.country}</Text>
                    )}
                  </View>
                  
                  {/* Gold */}
                  <View className="flex-row items-center">
                    <Medal size={18} color="#fbbf24" />
                    <Text className="text-amber-300 font-bold ml-1">{entry.totalGold}</Text>
                  </View>
                </Animated.View>
              );
            })
          )}
          
          {/* Motivation for non-ranked users */}
          {!childRank && currentLeaderboard.length > 0 && (
            <Animated.View
              entering={FadeIn.delay(500).duration(500)}
              className="bg-slate-800/50 rounded-xl p-4 mt-4 mb-8"
            >
              <Text className="text-slate-300 text-center">
                💪 You're not in the top 100 yet, but every practice session brings you closer!
              </Text>
            </Animated.View>
          )}
          
          {/* Top 100 limit notice */}
          {currentLeaderboard.length >= 100 && (
            <View className="py-4 mb-8">
              <Text className="text-slate-500 text-center text-sm">
                Showing top 100 • Rankings update after each exam
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
