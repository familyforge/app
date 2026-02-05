import { View, Text, Pressable, Image } from 'react-native';
import { User, Star, Award } from 'lucide-react-native';
import type { Child } from '../lib/types';

interface ChildCardProps {
  child: Child;
  compact?: boolean;
  onPress?: (id: string) => void;
}

export function ChildCard({ child, compact = false, onPress }: ChildCardProps) {
  const initials = child.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'CH';

  if (compact) {
    return (
      <Pressable
        onPress={() => onPress?.(child.id)}
        className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 min-w-[160px]"
      >
        <View className="items-center">
          {child.picture ? (
            <Image
              source={{ uri: child.picture }}
              className="w-14 h-14 rounded-full mb-3"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center mb-3">
              <Text className="text-white text-lg font-semibold">{initials}</Text>
            </View>
          )}
          <Text className="text-white font-medium text-center" numberOfLines={1}>
            {child.name}
          </Text>
          <View className="flex-row items-center gap-1 mt-2">
            <Star size={14} color="#f59e0b" />
            <Text className="text-amber-400 font-medium">{child.points}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onPress?.(child.id)}
      className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50"
    >
      <View className="flex-row items-center">
        {child.picture ? (
          <Image
            source={{ uri: child.picture }}
            className="w-16 h-16 rounded-full mr-4"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center mr-4">
            <Text className="text-white text-xl font-semibold">{initials}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-xl font-semibold text-white">{child.name}</Text>
          <Text className="text-slate-400">{child.age} years old</Text>
          {child.class ? (
            <Text className="text-slate-500 text-sm">{child.class}</Text>
          ) : null}
        </View>
      </View>
      
      {/* Stats */}
      <View className="flex-row mt-4 gap-3">
        <View className="flex-1 bg-amber-500/20 rounded-xl p-3 border border-amber-500/30">
          <View className="flex-row items-center gap-2">
            <Star size={16} color="#f59e0b" />
            <Text className="text-amber-400 font-medium">{child.points}</Text>
          </View>
          <Text className="text-slate-400 text-xs mt-1">Points</Text>
        </View>
        <View className="flex-1 bg-purple-500/20 rounded-xl p-3 border border-purple-500/30">
          <View className="flex-row items-center gap-2">
            <Award size={16} color="#a855f7" />
            <Text className="text-purple-400 font-medium">{child.rewards.length}</Text>
          </View>
          <Text className="text-slate-400 text-xs mt-1">Rewards</Text>
        </View>
      </View>
    </Pressable>
  );
}
