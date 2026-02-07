/// <reference types="nativewind/types" />

import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  ChevronRight, 
  Star, 
  User, 
  Gift, 
  BookOpen,
  Trophy,
  Target,
  Zap,
  Medal,
  MapPin,
  Clock,
  Bell,
  Search,
  X,
  Award,
  Users,
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppStore } from '../../lib/state/app-store';
import { useProfileStore } from '../../lib/state/profile-store';
import { useLearningStore } from '../../lib/state/learning-store';
import { useCalendarStore } from '../../lib/state/calendar-store';
import { theme } from '../../lib/theme';
import type { Task, Child } from '../../lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Theme constants (using theme tokens)
const colors = {
  background: theme.background,
  surfacePrimary: theme.surfacePrimary,
  surfaceElevated: theme.surfaceElevated,
  border: theme.border,
  textPrimary: theme.textPrimary,
  textSecondary: theme.textSecondary,
  textMuted: theme.textMuted,
  purple: theme.purple,
  purpleDark: theme.purpleDark,
  teal: theme.teal,
  amber: theme.amber,
  green: theme.green,
  red: '#EF4444',
  gradientStart: theme.gradientStart,
  gradientEnd: theme.gradientEnd,
};

// Search categories
const SEARCH_CATEGORIES = [
  { id: 'children', label: 'Children', icon: Users, color: colors.purple },
  { id: 'tasks', label: 'Tasks', icon: Target, color: colors.teal },
  { id: 'learning', label: 'Learning', icon: BookOpen, color: colors.green },
  { id: 'rewards', label: 'Rewards', icon: Gift, color: colors.amber },
  { id: 'events', label: 'Events', icon: Calendar, color: colors.purple },
];

export default function HomeScreen() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const tasks = useAppStore((s) => s.tasks);
  const rewards = useAppStore((s) => s.rewards);
  const profile = useProfileStore((s) => s.profile);
  const calendarEvents = useCalendarStore((s) => s.events);
  
  // Profile picture glow animation
  const glowOpacity = useSharedValue(0.2);
  const glowScale = useSharedValue(1);
  
  useEffect(() => {
    // Subtle pulsing glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Repeat forever
      false
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  
  // UI State
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationFilter, setNotificationFilter] = useState<string>('all');
  
  const todaysTasks = (tasks as Task[]).filter((t) => t.status === 'pending').slice(0, 3);
  const completedToday = (tasks as Task[]).filter((t) => t.status === 'completed').length;
  const totalPoints = (children as Child[]).reduce((sum, child) => sum + child.points, 0);
  const activeChildren = children.filter((c) => !c.archived);
  
  // Empty notifications - populated by real app activity
  const notifications: { id: string; type: string; title: string; message: string; time: string; urgent: boolean }[] = [];
  
  const hasUrgentNotifications = notifications.some((n) => n.urgent);
  const hasNotifications = notifications.length > 0;
  
  // Get upcoming events for next 7 days
  const getUpcomingEventsCount = () => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekStr = weekFromNow.toISOString().split('T')[0];
    
    return calendarEvents.filter((e) => e.date >= todayStr && e.date <= weekStr).length;
  };
  
  const upcomingEvents = getUpcomingEventsCount();
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  const firstName = profile.name?.split(' ')[0] || 'Parent';
  
  // Search results filtering
  const getSearchResults = useCallback(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase();
    const results: Record<string, unknown[]> = {
      children: activeChildren.filter((c) => c.name.toLowerCase().includes(query)),
      tasks: tasks.filter((t) => t.title.toLowerCase().includes(query)),
      rewards: rewards.filter((r) => r.title.toLowerCase().includes(query)),
      events: calendarEvents.filter((e) => e.title.toLowerCase().includes(query)),
    };
    
    return results;
  }, [searchQuery, activeChildren, tasks, rewards, calendarEvents]);
  
  const searchResults = getSearchResults();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header Section */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <SafeAreaView edges={['top']} style={{ marginTop: -30 }}>
          <Animated.View entering={FadeInDown.duration(600)}>
            {/* Greeting and Icons Row */}
            <View 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' }}>
                  {getGreeting()}
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 2 }}>
                  {firstName} 👋
                </Text>
              </View>
              
              {/* Right Icon Group: Bell → Search → Profile */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Notification Bell */}
                <Pressable
                  onPress={() => setShowNotifications(true)}
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Bell size={22} color="#E5E8F5" />
                  {hasNotifications && (
                    <View 
                      style={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        width: 10, 
                        height: 10, 
                        borderRadius: 5, 
                        backgroundColor: hasUrgentNotifications ? colors.red : colors.purple,
                        borderWidth: 2,
                        borderColor: colors.gradientStart,
                      }} 
                    />
                  )}
                </Pressable>
                
                {/* Search */}
                <Pressable
                  onPress={() => setShowSearch(true)}
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Search size={22} color="#E5E8F5" />
                </Pressable>
                
                {/* Profile Avatar with Glow Effect */}
                <Pressable 
                  onPress={() => router.push('/(tabs)/profile')}
                  style={{ alignItems: 'center' }}
                >
                  <View style={{ position: 'relative' }}>
                    {/* Gold glow ring behind avatar */}
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: -3,
                          left: -3,
                          right: -3,
                          bottom: -3,
                          borderRadius: 14,
                          backgroundColor: '#F59E0B',
                        },
                        glowStyle,
                      ]}
                    />
                    <View
                      style={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: 12, 
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {profile.avatarUrl ? (
                        <Image source={{ uri: profile.avatarUrl }} style={{ width: 44, height: 44 }} />
                      ) : (
                        <User size={20} color="#E5E8F5" />
                      )}
                    </View>
                  </View>
                  <Text style={{ fontSize: 10, color: 'rgba(229,232,245,0.7)', marginTop: 4, fontWeight: '500' }}>Profile</Text>
                </Pressable>
              </View>
            </View>
            
            {/* Stats Cards - Restructured with subtitles */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Family Points Card */}
              <Pressable 
                onPress={() => router.push('/(tabs)/progress')}
                style={{ 
                  flex: 1, 
                  backgroundColor: colors.surfaceElevated, 
                  borderRadius: 14, 
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View 
                    style={{ 
                      width: 28, 
                      height: 28, 
                      backgroundColor: colors.purple, 
                      borderRadius: 8, 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Star size={14} color={colors.textPrimary} />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    Family Points
                  </Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '700' }}>
                  {totalPoints}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                  Earned through achievements
                </Text>
              </Pressable>
              
              {/* Completed Tasks Card */}
              <Pressable 
                onPress={() => router.push('/(tabs)/tasks')}
                style={{ 
                  flex: 1, 
                  backgroundColor: colors.surfaceElevated, 
                  borderRadius: 14, 
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View 
                    style={{ 
                      width: 28, 
                      height: 28, 
                      backgroundColor: colors.green, 
                      borderRadius: 8, 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <CheckCircle2 size={14} color={colors.textPrimary} />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    Completed
                  </Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '700' }}>
                  {completedToday}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                  {completedToday > 0 ? "Your family is smashing it!" : "Tasks completed today"}
                </Text>
              </Pressable>
            </View>
            
            {/* Family Calendar Card - Full width below */}
            <Pressable 
              onPress={() => router.push('/family-calendar')}
              style={{ 
                backgroundColor: colors.surfaceElevated, 
                borderRadius: 14, 
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View 
                style={{ 
                  width: 28, 
                  height: 28, 
                  backgroundColor: colors.teal, 
                  borderRadius: 8, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Calendar size={14} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                  Family Calendar
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                  Upcoming events we can't forget
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginRight: 8 }}>
                  {upcomingEvents}
                </Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Your Stars Section */}
        <Animated.View 
          entering={FadeInUp.delay(150).duration(500)}
          style={{ marginTop: 12, marginBottom: 12 }}
        >
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} color={colors.amber} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Your Stars</Text>
            </View>
            <Pressable 
              onPress={() => router.push('/(tabs)/children')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: colors.surfacePrimary, 
                paddingHorizontal: 10, 
                paddingVertical: 5, 
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 4 }}>All</Text>
              <ChevronRight size={12} color={colors.textMuted} />
            </Pressable>
          </View>
          
          {activeChildren.length > 0 ? (
            <View 
              style={{ 
                marginHorizontal: 20, 
                backgroundColor: colors.surfacePrimary, 
                borderRadius: 16, 
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ flexGrow: 0 }}
              >
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  {activeChildren.slice(0, 5).map((child, index) => {
                    const childFirstName = child.name.split(' ')[0] || child.name;
                    const initials = child.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('') || 'CH';
                    
                    return (
                      <Animated.View 
                        key={child.id}
                        entering={FadeInRight.delay(index * 60).duration(350)}
                      >
                        <Pressable
                          onPress={() => router.push(`/child-profile?id=${child.id}`)}
                          style={{ alignItems: 'center' }}
                        >
                          <View 
                            style={{ 
                              padding: 2, 
                              borderRadius: 20, 
                              borderWidth: 2, 
                              borderColor: colors.purple,
                            }}
                          >
                            {child.picture ? (
                              <Image
                                source={{ uri: child.picture }}
                                style={{ width: 52, height: 52, borderRadius: 16 }}
                              />
                            ) : (
                              <LinearGradient
                                colors={[colors.purple, colors.purpleDark]}
                                style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{initials}</Text>
                              </LinearGradient>
                            )}
                          </View>
                          <Text style={{ color: colors.textPrimary, fontWeight: '600', textAlign: 'center', fontSize: 12, marginTop: 6 }} numberOfLines={1}>
                            {childFirstName}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 }}>
                            <Star size={9} color={colors.amber} />
                            <Text style={{ color: colors.amber, fontWeight: '700', fontSize: 11 }}>{child.points}</Text>
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View 
              style={{ 
                marginHorizontal: 20, 
                backgroundColor: colors.surfacePrimary, 
                borderRadius: 16, 
                padding: 24, 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
              }}
            >
              <View style={{ width: 48, height: 48, backgroundColor: colors.surfaceElevated, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <User size={24} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 12, fontSize: 13 }}>Add your children to get started</Text>
              <Pressable 
                onPress={() => router.push('/(tabs)/children')}
                style={{ backgroundColor: colors.purple, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>+ Add Child</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Up Next Section */}
        <Animated.View 
          entering={FadeInUp.delay(250).duration(500)}
          style={{ paddingHorizontal: 20, marginBottom: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Target size={18} color={colors.purple} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Up Next</Text>
            </View>
            <Pressable 
              onPress={() => router.push('/(tabs)/tasks')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: colors.surfacePrimary, 
                paddingHorizontal: 10, 
                paddingVertical: 5, 
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 4 }}>All tasks</Text>
              <ChevronRight size={12} color={colors.textMuted} />
            </Pressable>
          </View>
          
          {todaysTasks.length > 0 ? (
            <View style={{ gap: 8 }}>
              {todaysTasks.map((task, index) => (
                <Animated.View 
                  key={task.id}
                  entering={FadeInUp.delay(300 + index * 50).duration(350)}
                >
                  <Pressable 
                    onPress={() => router.push('/(tabs)/tasks')}
                    style={{ 
                      backgroundColor: colors.surfaceElevated, 
                      borderRadius: 14, 
                      padding: 12, 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View 
                      style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 10, 
                        backgroundColor: colors.surfacePrimary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginRight: 10,
                      }}
                    >
                      <Zap size={18} color={colors.purple} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{task.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Star size={10} color={colors.amber} />
                        <Text style={{ color: colors.amber, fontSize: 12, fontWeight: '600' }}>{task.points} pts</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: `${colors.purple}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: colors.purple, fontSize: 10, fontWeight: '700' }}>PENDING</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View 
              style={{ 
                backgroundColor: colors.surfaceElevated, 
                borderRadius: 14, 
                padding: 20, 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ width: 40, height: 40, backgroundColor: `${colors.green}20`, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <CheckCircle2 size={20} color={colors.green} />
              </View>
              <Text style={{ color: colors.green, fontWeight: '600', fontSize: 14 }}>All caught up!</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>No pending tasks</Text>
            </View>
          )}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          entering={FadeInUp.delay(350).duration(500)}
          style={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8 }}>
            <Zap size={18} color={colors.teal} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Quick Actions</Text>
          </View>
          
          <View style={{ gap: 8 }}>
            {/* Top Row - 2 feature cards */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable 
                onPress={() => router.push('/learning-assignments')}
                style={{ 
                  flex: 1,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    backgroundColor: colors.teal, 
                    borderRadius: 10, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: 10,
                  }}
                >
                  <BookOpen size={20} color={colors.textPrimary} />
                </View>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Learning</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Manage assignments</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => router.push('/(tabs)/rewards')}
                style={{ 
                  flex: 1,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    backgroundColor: colors.purple, 
                    borderRadius: 10, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: 10,
                  }}
                >
                  <Gift size={20} color={colors.textPrimary} />
                </View>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Rewards</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Redeem points</Text>
              </Pressable>
            </View>
            
            {/* Middle Row - 3 compact cards */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable 
                onPress={() => router.push('/(tabs)/progress')}
                style={{ 
                  flex: 1,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 14,
                  padding: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <TrendingUp size={18} color={colors.green} />
                <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 5, fontSize: 11 }}>Progress</Text>
                <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 1 }}>Track stats</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => router.push('/leaderboard')}
                style={{ 
                  flex: 1,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 14,
                  padding: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Medal size={18} color={colors.amber} />
                <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 5, fontSize: 11 }}>Leaderboard</Text>
                <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 1 }}>Rankings</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => router.push('/my-routines')}
                style={{ 
                  flex: 1,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 14,
                  padding: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Clock size={18} color={colors.purple} />
                <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 5, fontSize: 11 }}>Routines</Text>
                <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 1 }}>Daily habits</Text>
              </Pressable>
            </View>
            
            {/* Bottom Row - Find My Kids */}
            <Pressable 
              onPress={() => router.push('/findmykids')}
              style={{ 
                backgroundColor: colors.surfaceElevated,
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View 
                style={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: colors.green, 
                  borderRadius: 10, 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: 12,
                }}
              >
                <MapPin size={20} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Find My Kids</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Real-time location tracking</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Notification Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          onPress={() => setShowNotifications(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              position: 'absolute',
              top: 100,
              right: 20,
              width: SCREEN_WIDTH - 40,
              maxHeight: 450,
              backgroundColor: colors.surfacePrimary,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Notifications</Text>
                <Pressable onPress={() => setShowNotifications(false)}>
                  <X size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              
              {/* Filter Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
                  {['all', 'tasks', 'learning', 'rewards', 'events'].map((filter) => (
                    <Pressable
                      key={filter}
                      onPress={() => setNotificationFilter(filter)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: notificationFilter === filter ? colors.purple : colors.surfaceElevated,
                      }}
                    >
                      <Text style={{ 
                        color: notificationFilter === filter ? colors.textPrimary : colors.textSecondary, 
                        fontSize: 12, 
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}>
                        {filter}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              
              {/* Notifications List */}
              <ScrollView style={{ maxHeight: 300 }}>
                {notifications
                  .filter((n) => notificationFilter === 'all' || n.type === notificationFilter.slice(0, -1))
                  .map((notification) => (
                    <View 
                      key={notification.id} 
                      style={{ 
                        padding: 14, 
                        borderBottomWidth: 1, 
                        borderBottomColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View 
                        style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 10, 
                          backgroundColor: notification.urgent ? `${colors.red}20` : `${colors.purple}20`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {notification.type === 'task' && <CheckCircle2 size={18} color={colors.green} />}
                        {notification.type === 'event' && <Calendar size={18} color={notification.urgent ? colors.red : colors.teal} />}
                        {notification.type === 'reward' && <Gift size={18} color={colors.amber} />}
                        {notification.type === 'learning' && <Award size={18} color={colors.purple} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{notification.title}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{notification.message}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>{notification.time}</Text>
                      </View>
                      {notification.urgent && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red }} />
                      )}
                    </View>
                  ))}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
      
      {/* Search Modal */}
      <Modal
        visible={showSearch}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <Animated.View entering={FadeInDown.duration(250)} style={{ padding: 20 }}>
              {/* Search Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <View 
                  style={{ 
                    flex: 1, 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Search size={20} color={colors.textMuted} />
                  <TextInput
                    placeholder="Search children, tasks, rewards..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    style={{
                      flex: 1,
                      color: colors.textPrimary,
                      fontSize: 15,
                      paddingVertical: 14,
                      marginLeft: 10,
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <X size={18} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
                <Pressable onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
                  <Text style={{ color: colors.purple, fontWeight: '600' }}>Cancel</Text>
                </Pressable>
              </View>
              
              {/* Search Suggestions (before typing) */}
              {!searchQuery && (
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' }}>
                    Search Categories
                  </Text>
                  <View style={{ gap: 8 }}>
                    {SEARCH_CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <Pressable
                          key={category.id}
                          onPress={() => setSearchQuery(category.label + ': ')}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.surfaceElevated,
                            padding: 14,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <View 
                            style={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: 10, 
                              backgroundColor: `${category.color}20`,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }}
                          >
                            <IconComponent size={18} color={category.color} />
                          </View>
                          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15 }}>{category.label}</Text>
                          <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
              
              {/* Search Results */}
              {searchQuery && searchResults && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Children Results */}
                  {(searchResults.children as Child[]).length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' }}>
                        Children
                      </Text>
                      {(searchResults.children as Child[]).map((child: Child) => (
                        <Pressable
                          key={child.id}
                          onPress={() => { router.push(`/child-profile?id=${child.id}`); setShowSearch(false); setSearchQuery(''); }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.surfaceElevated,
                            padding: 12,
                            borderRadius: 12,
                            marginBottom: 8,
                          }}
                        >
                          <Users size={18} color={colors.purple} style={{ marginRight: 12 }} />
                          <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>{child.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  
                  {/* Tasks Results */}
                  {(searchResults.tasks as Task[]).length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' }}>
                        Tasks
                      </Text>
                      {(searchResults.tasks as Task[]).slice(0, 5).map((task: Task) => (
                        <Pressable
                          key={task.id}
                          onPress={() => { router.push('/(tabs)/tasks'); setShowSearch(false); setSearchQuery(''); }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.surfaceElevated,
                            padding: 12,
                            borderRadius: 12,
                            marginBottom: 8,
                          }}
                        >
                          <Target size={18} color={colors.teal} style={{ marginRight: 12 }} />
                          <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>{task.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  
                  {/* No Results */}
                  {Object.values(searchResults).every((arr) => (arr as unknown[]).length === 0) && (
                    <View style={{ alignItems: 'center', paddingTop: 40 }}>
                      <Search size={40} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: 15 }}>No results found</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>Try a different search term</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </Animated.View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
