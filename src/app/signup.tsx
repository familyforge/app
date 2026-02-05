// FamilyForge App - Sign Up Screen
// Now redirects to the onboarding flow for new users

import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { useOnboardingStore } from '../lib/state/onboarding-store';
import { theme } from '../lib/theme';

export default function SignUpScreen() {
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);
  
  useEffect(() => {
    // If onboarding is already complete, go to tabs
    if (onboardingComplete) {
      router.replace('/(tabs)/home');
      return;
    }
    
    // Reset onboarding state and redirect to onboarding
    resetOnboarding();
    
    // Small delay for visual feedback
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onboardingComplete, resetOnboarding]);

  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd, theme.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />
      
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', gap: 24 }}>
          <View 
            style={{ 
              width: 80, 
              height: 80, 
              backgroundColor: `${theme.purple}20`, 
              borderRadius: 40, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Sparkles size={40} color={theme.purple} />
          </View>
          
          <Text style={{ fontSize: 28, fontWeight: '700', color: theme.textPrimary }}>
            Welcome to FamilyForge
          </Text>
          
          <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
            Setting up your personalized experience...
          </Text>
          
          <ActivityIndicator size="small" color={theme.purple} style={{ marginTop: 16 }} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
