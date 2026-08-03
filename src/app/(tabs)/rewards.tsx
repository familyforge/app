import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Gift, Star, Check, ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../lib/state/app-store';
import { RewardCard } from '../../components/RewardCard';
import type { Reward, RewardPeriod } from '../../lib/types';

const REWARD_PERIODS: Array<{ key: RewardPeriod; label: string; blurb: string }> = [
  { key: 'spend', label: 'Spend gold', blurb: 'Swap gold for it any time.' },
  { key: 'daily', label: 'Daily', blurb: 'Can be earned once a day. Resets each morning.' },
  { key: 'weekly', label: 'Weekly', blurb: 'Once a week. Resets on Monday.' },
  { key: 'monthly', label: 'Monthly', blurb: 'Once a month.' },
  { key: 'yearly', label: 'Yearly', blurb: 'A big one, once a year.' },
  { key: 'gold_target', label: 'Big goal', blurb: 'Unlocks when total gold reaches a target.' },
];

export default function RewardsScreen() {
  const rewards = useAppStore((s) => s.rewards);
  const children = useAppStore((s) => s.children);
  const addReward = useAppStore((s) => s.addReward);
  const redeemReward = useAppStore((s) => s.redeemReward);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // The schema has supported these since migration 020 and the Kids app already
  // groups by them; the form was the only thing still stuck on "costs N points".
  const [period, setPeriod] = useState<RewardPeriod>('spend');
  const [goldTarget, setGoldTarget] = useState('');

  const isMilestone = period === 'gold_target';
  // A milestone needs a target; everything else needs a price.
  const canSubmit = title.trim().length > 0 && (isMilestone ? goldTarget.trim().length > 0 : pointsCost.trim().length > 0);

  const handleAddReward = () => {
    if (!canSubmit) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    addReward({
      title: title.trim(),
      description: description.trim() || undefined,
      pointsCost: isMilestone ? 0 : parseInt(pointsCost) || 50,
      imageUrl: imageUrl.trim() || undefined,
      period,
      goldTarget: isMilestone ? parseInt(goldTarget) || null : null,
    });

    resetForm();
  };

  const resetForm = () => {
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setPointsCost('');
    setImageUrl('');
    setPeriod('spend');
    setGoldTarget('');
  };

  const handleRedeemPress = (reward: Reward) => {
    setSelectedReward(reward);
    setRedeemModalVisible(true);
  };

  const handleRedeem = () => {
    if (!selectedReward || !selectedChildId) return;
    
    const child = children.find(c => c.id === selectedChildId);
    if (!child || child.points < selectedReward.pointsCost) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    redeemReward(selectedReward.id, selectedChildId);
    setRedeemModalVisible(false);
    setSelectedReward(null);
    setSelectedChildId('');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-white">Rewards</Text>
            <Text className="text-slate-400 mt-1">{rewards.length} available</Text>
          </View>
          <Pressable
            onPress={() => setModalVisible(true)}
            className="bg-purple-500 w-12 h-12 rounded-full items-center justify-center"
          >
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        {/* Children Points Overview */}
        {children.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-lg font-semibold text-white mb-3">Points Balance</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row gap-3">
                {children.map((child) => (
                  <View
                    key={child.id}
                    className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-4 border border-amber-500/30 min-w-[140px]"
                  >
                    <Text className="text-white font-medium">{child.name}</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <Star size={20} color="#f59e0b" />
                      <Text className="text-2xl font-bold text-amber-400">{child.points}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Rewards Grid */}
        <View className="px-5 pb-8">
          <Text className="text-lg font-semibold text-white mb-4">Available Rewards</Text>
          {rewards.length > 0 ? (
            <View className="flex-row flex-wrap gap-4">
              {rewards.map((reward) => (
                <Pressable
                  key={reward.id}
                  onPress={() => handleRedeemPress(reward)}
                  className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden"
                  style={{ width: '47%' }}
                >
                  <View className="h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 items-center justify-center">
                    {reward.imageUrl ? (
                      <Image source={{ uri: reward.imageUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Gift size={40} color="#a855f7" />
                    )}
                  </View>
                  <View className="p-3">
                    <Text className="text-white font-medium" numberOfLines={1}>{reward.title}</Text>
                    <View className="flex-row items-center gap-1 mt-2">
                      <Star size={14} color="#f59e0b" />
                      <Text className="text-amber-400 font-semibold">{reward.pointsCost}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="bg-slate-800/50 rounded-2xl p-8 items-center border border-slate-700/50">
              <View className="w-20 h-20 rounded-full bg-purple-500/20 items-center justify-center mb-4">
                <Gift size={40} color="#a855f7" />
              </View>
              <Text className="text-white text-lg font-medium">No rewards yet</Text>
              <Text className="text-slate-400 text-center mt-2">Create rewards to motivate your children</Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                className="mt-4 bg-purple-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-medium">Add Reward</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Reward Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={resetForm}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-800 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-semibold text-white">Add Reward</Text>
              <Pressable onPress={resetForm}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-slate-400 mb-2">Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Reward name"
                  placeholderTextColor="#64748b"
                  className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <View>
                <Text className="text-slate-400 mb-2">Description (optional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Reward description"
                  placeholderTextColor="#64748b"
                  multiline
                  className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <View>
                <Text className="text-slate-400 mb-2">How is it earned?</Text>
                <View className="flex-row flex-wrap gap-2">
                  {REWARD_PERIODS.map((opt) => {
                    const active = period === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => { Haptics.selectionAsync(); setPeriod(opt.key); }}
                        className={`rounded-xl px-3 py-2 border ${
                          active ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-700 border-slate-600'
                        }`}
                      >
                        <Text className={active ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text className="text-slate-500 text-xs mt-2">
                  {REWARD_PERIODS.find((o) => o.key === period)?.blurb}
                </Text>
              </View>

              {isMilestone ? (
                <View>
                  <Text className="text-slate-400 mb-2">Gold needed to unlock</Text>
                  <TextInput
                    value={goldTarget}
                    onChangeText={setGoldTarget}
                    placeholder="500"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                  <Text className="text-slate-500 text-xs mt-2">
                    Your child sees a progress bar filling towards this.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text className="text-slate-400 mb-2">Points Cost</Text>
                  <TextInput
                    value={pointsCost}
                    onChangeText={setPointsCost}
                    placeholder="50"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                </View>
              )}

              <View>
                <Text className="text-slate-400 mb-2">Image URL (optional)</Text>
                <TextInput
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://..."
                  placeholderTextColor="#64748b"
                  className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <Pressable
                onPress={handleAddReward}
                className="bg-purple-500 rounded-xl py-4 items-center mt-2"
              >
                <Text className="text-white font-semibold text-lg">Add Reward</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Redeem Modal */}
      <Modal
        visible={redeemModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-800 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-semibold text-white">Redeem Reward</Text>
              <Pressable onPress={() => setRedeemModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedReward && (
              <View className="gap-4">
                <View className="bg-slate-700/50 rounded-2xl p-4 flex-row items-center">
                  <View className="w-16 h-16 bg-purple-500/20 rounded-xl items-center justify-center mr-4">
                    <Gift size={32} color="#a855f7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-lg">{selectedReward.title}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Star size={16} color="#f59e0b" />
                      <Text className="text-amber-400 font-medium">{selectedReward.pointsCost} points</Text>
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-slate-400 mb-3">Select Child</Text>
                  <View className="gap-2">
                    {children.map((child) => {
                      const canAfford = child.points >= (selectedReward?.pointsCost || 0);
                      return (
                        <Pressable
                          key={child.id}
                          onPress={() => canAfford && setSelectedChildId(child.id)}
                          className={`flex-row items-center p-4 rounded-xl ${
                            selectedChildId === child.id ? 'bg-purple-500' : 'bg-slate-700'
                          } ${!canAfford ? 'opacity-50' : ''}`}
                        >
                          <View className="flex-1">
                            <Text className={`font-medium ${selectedChildId === child.id ? 'text-white' : 'text-white'}`}>
                              {child.name}
                            </Text>
                            <Text className={`text-sm ${selectedChildId === child.id ? 'text-purple-200' : 'text-slate-400'}`}>
                              {child.points} points {!canAfford && '(not enough)'}
                            </Text>
                          </View>
                          {selectedChildId === child.id && (
                            <Check size={20} color="white" />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable
                  onPress={handleRedeem}
                  disabled={!selectedChildId}
                  className={`rounded-xl py-4 items-center flex-row justify-center gap-2 mt-2 ${
                    selectedChildId ? 'bg-purple-500' : 'bg-slate-600'
                  }`}
                >
                  <ShoppingCart size={20} color="white" />
                  <Text className="text-white font-semibold text-lg">Redeem</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
