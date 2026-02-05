import { View, Text, Image } from 'react-native';
import { Star, CheckCircle2, Award } from 'lucide-react-native';
import type { Child, Task } from '../lib/types';

interface PointsProgressProps {
  child: Child;
  tasks: Task[];
}

export function PointsProgress({ child, tasks }: PointsProgressProps) {
  const childTasks = tasks.filter(t => t.childId === child.id || !t.childId);
  const completedTasks = childTasks.filter(t => t.status === 'completed').length;
  const totalTasks = childTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const initials = child.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'CH';

  return (
    <View className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        {child.picture ? (
          <Image source={{ uri: child.picture }} className="w-12 h-12 rounded-full mr-3" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center mr-3">
            <Text className="text-white font-semibold">{initials}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg">{child.name}</Text>
          <Text className="text-slate-400 text-sm">{child.age} years old</Text>
          {child.class ? (
            <Text className="text-slate-500 text-xs">{child.class}</Text>
          ) : null}
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-amber-500/20 rounded-xl p-3 border border-amber-500/30">
          <View className="flex-row items-center gap-2">
            <Star size={16} color="#f59e0b" />
            <Text className="text-amber-400 font-semibold">{child.points}</Text>
          </View>
          <Text className="text-slate-400 text-xs mt-1">Total Points</Text>
        </View>
        
        <View className="flex-1 bg-emerald-500/20 rounded-xl p-3 border border-emerald-500/30">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={16} color="#10b981" />
            <Text className="text-emerald-400 font-semibold">{completedTasks}</Text>
          </View>
          <Text className="text-slate-400 text-xs mt-1">Completed</Text>
        </View>
        
        <View className="flex-1 bg-purple-500/20 rounded-xl p-3 border border-purple-500/30">
          <View className="flex-row items-center gap-2">
            <Award size={16} color="#a855f7" />
            <Text className="text-purple-400 font-semibold">{child.rewards.length}</Text>
          </View>
          <Text className="text-slate-400 text-xs mt-1">Rewards</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mt-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-slate-400 text-sm">Task Completion</Text>
          <Text className="text-white font-medium">{completionRate}%</Text>
        </View>
        <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <View 
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </View>
      </View>
    </View>
  );
}
