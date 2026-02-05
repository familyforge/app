import { View, Text, Pressable, Image } from 'react-native';
import { Gift, Star } from 'lucide-react-native';
import type { Reward } from '../lib/types';

interface RewardCardProps {
  reward: Reward;
  onPress?: (reward: Reward) => void;
}

export function RewardCard({ reward, onPress }: RewardCardProps) {
  return (
    <Pressable
      onPress={() => onPress?.(reward)}
      className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden"
      style={{ width: '47%' }}
    >
      <View className="h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 items-center justify-center">
        {reward.imageUrl ? (
          <Image 
            source={{ uri: reward.imageUrl }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
        ) : (
          <Gift size={40} color="#a855f7" />
        )}
      </View>
      <View className="p-3">
        <Text className="text-white font-medium" numberOfLines={1}>
          {reward.title}
        </Text>
        {reward.description && (
          <Text className="text-slate-400 text-sm mt-1" numberOfLines={2}>
            {reward.description}
          </Text>
        )}
        <View className="flex-row items-center gap-1 mt-2">
          <Star size={14} color="#f59e0b" />
          <Text className="text-amber-400 font-semibold">{reward.pointsCost}</Text>
        </View>
      </View>
    </Pressable>
  );
}
