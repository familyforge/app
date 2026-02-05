import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Award, CheckCircle2, FileText, Download, Calendar, Star, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../lib/state/app-store';
import { ChartCard } from '../../components/ChartCard';
import { PointsProgress } from '../../components/PointsProgress';
import { generateProgressPDF } from '../../lib/utils/pdf-generator';

export default function ProgressScreen() {
  const children = useAppStore((s) => s.children);
  const tasks = useAppStore((s) => s.tasks);
  const rewards = useAppStore((s) => s.rewards);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const selectedChild = selectedChildId ? children.find(c => c.id === selectedChildId) : null;
  
  // Calculate stats
  const totalTasksCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalPendingTasks = tasks.filter(t => t.status === 'pending').length;
  const totalPointsEarned = children.reduce((sum, c) => sum + c.points, 0);
  const totalRewardsRedeemed = children.reduce((sum, c) => sum + c.rewards.length, 0);

  // Weekly progress data (mock for now)
  const weeklyData = [
    { day: 'Mon', tasks: 3, points: 30 },
    { day: 'Tue', tasks: 5, points: 50 },
    { day: 'Wed', tasks: 2, points: 20 },
    { day: 'Thu', tasks: 4, points: 40 },
    { day: 'Fri', tasks: 6, points: 60 },
    { day: 'Sat', tasks: 3, points: 30 },
    { day: 'Sun', tasks: 1, points: 10 },
  ];

  const handleExportPDF = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await generateProgressPDF({
        children,
        tasks,
        rewards,
        selectedChildId,
      });
      
      if (result.success) {
        Alert.alert('Success', 'Progress report generated! (PDF stub - full implementation coming soon)');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-white">Progress</Text>
            <Text className="text-slate-400 mt-1">Track achievements</Text>
          </View>
          <Pressable
            onPress={handleExportPDF}
            className="bg-emerald-500 px-4 py-2 rounded-xl flex-row items-center gap-2"
          >
            <Download size={18} color="white" />
            <Text className="text-white font-medium">Export</Text>
          </Pressable>
        </View>

        {/* Child Filter */}
        {children.length > 0 && (
          <View className="px-5 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setSelectedChildId(null)}
                  className={`px-4 py-2 rounded-full ${
                    !selectedChildId ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
                >
                  <Text className={!selectedChildId ? 'text-white font-medium' : 'text-slate-400'}>
                    All Children
                  </Text>
                </Pressable>
                {children.map((child) => (
                  <Pressable
                    key={child.id}
                    onPress={() => setSelectedChildId(child.id)}
                    className={`px-4 py-2 rounded-full ${
                      selectedChildId === child.id ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  >
                    <Text className={selectedChildId === child.id ? 'text-white font-medium' : 'text-slate-400'}>
                      {child.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Stats Overview */}
        <View className="px-5 mb-6">
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/30">
              <View className="flex-row items-center gap-2 mb-2">
                <CheckCircle2 size={20} color="#10b981" />
                <Text className="text-emerald-400 font-medium">Completed</Text>
              </View>
              <Text className="text-3xl font-bold text-white">{totalTasksCompleted}</Text>
              <Text className="text-slate-400 text-sm">tasks</Text>
            </View>
            
            <View className="flex-1 bg-blue-500/20 rounded-2xl p-4 border border-blue-500/30">
              <View className="flex-row items-center gap-2 mb-2">
                <Calendar size={20} color="#3b82f6" />
                <Text className="text-blue-400 font-medium">Pending</Text>
              </View>
              <Text className="text-3xl font-bold text-white">{totalPendingTasks}</Text>
              <Text className="text-slate-400 text-sm">tasks</Text>
            </View>
          </View>
          
          <View className="flex-row gap-3">
            <View className="flex-1 bg-amber-500/20 rounded-2xl p-4 border border-amber-500/30">
              <View className="flex-row items-center gap-2 mb-2">
                <Star size={20} color="#f59e0b" />
                <Text className="text-amber-400 font-medium">Points</Text>
              </View>
              <Text className="text-3xl font-bold text-white">{totalPointsEarned}</Text>
              <Text className="text-slate-400 text-sm">total earned</Text>
            </View>
            
            <View className="flex-1 bg-purple-500/20 rounded-2xl p-4 border border-purple-500/30">
              <View className="flex-row items-center gap-2 mb-2">
                <Award size={20} color="#a855f7" />
                <Text className="text-purple-400 font-medium">Rewards</Text>
              </View>
              <Text className="text-3xl font-bold text-white">{totalRewardsRedeemed}</Text>
              <Text className="text-slate-400 text-sm">redeemed</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Chart */}
        <View className="px-5 mb-6">
          <ChartCard title="Weekly Activity" data={weeklyData} />
        </View>

        {/* Children Progress */}
        {children.length > 0 && (
          <View className="px-5 pb-8">
            <Text className="text-lg font-semibold text-white mb-4">Individual Progress</Text>
            <View className="gap-4">
              {(selectedChild ? [selectedChild] : children).map((child) => (
                <PointsProgress key={child.id} child={child} tasks={tasks} />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {children.length === 0 && (
          <View className="px-5 pb-8">
            <View className="bg-slate-800/50 rounded-2xl p-8 items-center border border-slate-700/50">
              <View className="w-20 h-20 rounded-full bg-slate-700 items-center justify-center mb-4">
                <BarChart3 size={40} color="#64748b" />
              </View>
              <Text className="text-white text-lg font-medium">No data yet</Text>
              <Text className="text-slate-400 text-center mt-2">
                Add children and complete tasks to see progress
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
