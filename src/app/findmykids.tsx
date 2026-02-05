/// <reference types="nativewind/types" />

import { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Image, ScrollView, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Battery,
  Clock,
  Wifi,
  WifiOff,
  Settings,
  AlertTriangle,
  Shield,
  ChevronRight,
  User,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import { useAppStore } from '../lib/state/app-store';
import { useLocationStore, LocationStatus } from '../lib/state/location-store';
import { theme } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Theme colors
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
  red: theme.red,
};

// Status colors
const statusColors: Record<LocationStatus, string> = {
  live: colors.green,
  recent: colors.amber,
  offline: colors.textMuted,
};

const statusLabels: Record<LocationStatus, string> = {
  live: 'Live',
  recent: 'Recently Updated',
  offline: 'Offline',
};

// Format timestamp
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default function FindMyKidsScreen() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const childLocations = useLocationStore((s) => s.childLocations);
  const permissions = useLocationStore((s) => s.permissions);
  const findMyKidsEnabled = useLocationStore((s) => s.findMyKidsEnabled);
  const setTrackingEnabled = useLocationStore((s) => s.setTrackingEnabled);
  
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const activeChildren = useMemo(
    () => children.filter((c) => !c.archived),
    [children]
  );
  
  const selectedChild = useMemo(
    () => activeChildren.find((c) => c.id === selectedChildId),
    [activeChildren, selectedChildId]
  );
  
  const selectedLocation = selectedChildId ? childLocations[selectedChildId] : null;
  
  // Auto-select first child
  useEffect(() => {
    if (!selectedChildId && activeChildren.length > 0) {
      setSelectedChildId(activeChildren[0].id);
    }
  }, [activeChildren, selectedChildId]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh - in real app, this would fetch new locations
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };
  
  if (!findMyKidsEnabled) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              backgroundColor: `${colors.purple}20`, 
              borderRadius: 40, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 24 
            }}>
              <Shield size={40} color={colors.purple} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
              Find My Kids is Disabled
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
              Location tracking is currently turned off. Enable it in settings to see your children's locations.
            </Text>
            <Pressable
              onPress={() => router.push('/settings-full')}
              style={{
                backgroundColor: colors.purple,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 16 }}>
                Go to Settings
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.purple, colors.purpleDark, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <SafeAreaView edges={['top']} style={{ marginTop: -30 }}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowLeft size={20} color={colors.textPrimary} />
              </Pressable>
              
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>
                  Find My Kids
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
                  Real-time location tracking
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={handleRefresh}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw 
                    size={18} 
                    color={colors.textPrimary} 
                    style={isRefreshing ? { transform: [{ rotate: '360deg' }] } : undefined}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/settings-full')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Settings size={18} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
      
      {/* Location Cards View - Map-free implementation */}
      <View style={{ flex: 1 }}>
        {/* Placeholder for Map - Shows location info without native maps */}
        <View style={{ flex: 1, backgroundColor: colors.surfacePrimary }}>
          {selectedLocation ? (
            <Animated.View 
              entering={FadeIn.duration(300)}
              style={{ flex: 1, padding: 20 }}
            >
              {/* Location Header Card */}
              <View style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: `${statusColors[selectedLocation.status]}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <MapPin size={28} color={statusColors[selectedLocation.status]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
                      {selectedChild?.name || 'Unknown'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: statusColors[selectedLocation.status],
                      }} />
                      <Text style={{ color: statusColors[selectedLocation.status], fontSize: 14, fontWeight: '600' }}>
                        {statusLabels[selectedLocation.status]}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Location Details */}
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Navigation size={18} color={colors.textMuted} />
                    <Text style={{ color: colors.textSecondary, fontSize: 15, flex: 1 }}>
                      {selectedLocation.placeName || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Clock size={18} color={colors.textMuted} />
                    <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                      Updated {formatTimestamp(selectedLocation.timestamp)}
                    </Text>
                  </View>
                  {selectedLocation.batteryLevel !== undefined && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Battery size={18} color={selectedLocation.batteryLevel < 20 ? colors.red : colors.textMuted} />
                      <Text style={{ color: selectedLocation.batteryLevel < 20 ? colors.red : colors.textSecondary, fontSize: 15 }}>
                        {selectedLocation.batteryLevel}% battery
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Open in Maps Button */}
              <Pressable
                onPress={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`;
                  Linking.openURL(url);
                }}
                style={{
                  backgroundColor: colors.purple,
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <ExternalLink size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  Open in Google Maps
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: `${colors.textMuted}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <MapPin size={36} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center' }}>
                Select a child below to view their location
              </Text>
            </View>
          )}
        </View>
        
        {/* Children Selector - Bottom Sheet Style */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surfacePrimary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            paddingBottom: 32,
            maxHeight: '50%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 16,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
          </View>
          
          {/* Children Scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            style={{ flexGrow: 0 }}
          >
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {activeChildren.map((child) => {
                const location = childLocations[child.id];
                const isSelected = child.id === selectedChildId;
                const permission = permissions[child.id];
                const isEnabled = permission?.trackingEnabled ?? true;
                
                const initials = child.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('') || 'CH';
                
                return (
                  <Pressable
                    key={child.id}
                    onPress={() => setSelectedChildId(child.id)}
                    style={{
                      backgroundColor: isSelected ? colors.surfaceElevated : 'transparent',
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.purple : colors.border,
                      minWidth: 100,
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ position: 'relative' }}>
                      {child.picture ? (
                        <Image
                          source={{ uri: child.picture }}
                          style={{ width: 48, height: 48, borderRadius: 16 }}
                        />
                      ) : (
                        <LinearGradient
                          colors={[colors.purple, colors.purpleDark]}
                          style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{initials}</Text>
                        </LinearGradient>
                      )}
                      {/* Status dot */}
                      {location && (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: statusColors[location.status],
                            borderWidth: 2,
                            borderColor: colors.surfacePrimary,
                          }}
                        />
                      )}
                    </View>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginTop: 8 }}>
                      {child.name.split(' ')[0]}
                    </Text>
                    {location && (
                      <Text style={{ color: statusColors[location.status], fontSize: 10, marginTop: 2 }}>
                        {statusLabels[location.status]}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          
          {/* Selected Child Details */}
          {selectedChild && selectedLocation && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{ paddingHorizontal: 20, marginTop: 8 }}
            >
              <View
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Status Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: `${statusColors[selectedLocation.status]}20`,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    {selectedLocation.status === 'live' ? (
                      <Wifi size={14} color={statusColors[selectedLocation.status]} />
                    ) : selectedLocation.status === 'recent' ? (
                      <Clock size={14} color={statusColors[selectedLocation.status]} />
                    ) : (
                      <WifiOff size={14} color={statusColors[selectedLocation.status]} />
                    )}
                    <Text style={{ color: statusColors[selectedLocation.status], fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                      {statusLabels[selectedLocation.status]}
                    </Text>
                  </View>
                  
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 'auto' }}>
                    {formatTimestamp(selectedLocation.timestamp)}
                  </Text>
                </View>
                
                {/* Info Grid */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {/* Battery */}
                  {selectedLocation.batteryLevel !== undefined && (
                    <View style={{ flex: 1, backgroundColor: colors.surfacePrimary, borderRadius: 12, padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Battery 
                          size={16} 
                          color={selectedLocation.batteryLevel < 20 ? colors.red : colors.green} 
                        />
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>Battery</Text>
                      </View>
                      <Text style={{ 
                        color: selectedLocation.batteryLevel < 20 ? colors.red : colors.textPrimary, 
                        fontSize: 18, 
                        fontWeight: '700' 
                      }}>
                        {selectedLocation.batteryLevel}%
                      </Text>
                      {selectedLocation.batteryLevel < 20 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <AlertTriangle size={10} color={colors.red} />
                          <Text style={{ color: colors.red, fontSize: 10, marginLeft: 4 }}>Low battery</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Accuracy */}
                  <View style={{ flex: 1, backgroundColor: colors.surfacePrimary, borderRadius: 12, padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Navigation size={16} color={colors.purple} />
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>Accuracy</Text>
                    </View>
                    <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
                      ±{selectedLocation.accuracy || 15}m
                    </Text>
                  </View>
                </View>
                
                {/* Privacy Notice */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${colors.teal}15`,
                    borderRadius: 10,
                    padding: 12,
                    marginTop: 16,
                  }}
                >
                  <Shield size={16} color={colors.teal} />
                  <Text style={{ color: colors.teal, fontSize: 12, marginLeft: 8, flex: 1 }}>
                    {selectedChild.name.split(' ')[0]} can see that location sharing is active
                  </Text>
                </View>
              </View>
              
              {/* Tracking Toggle */}
              <Pressable
                onPress={() => setTrackingEnabled(selectedChild.id, !(permissions[selectedChild.id]?.trackingEnabled ?? true))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MapPin size={18} color={colors.purple} />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500', marginLeft: 10 }}>
                    Pause tracking for {selectedChild.name.split(' ')[0]}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            </Animated.View>
          )}
          
          {/* No Children State */}
          {activeChildren.length === 0 && (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <View style={{ 
                width: 64, 
                height: 64, 
                backgroundColor: colors.surfaceElevated, 
                borderRadius: 32, 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: 16 
              }}>
                <User size={32} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
                Add children to track their location
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/children')}
                style={{
                  backgroundColor: colors.purple,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginTop: 16,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Add Child</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}
