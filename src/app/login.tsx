// FamilyForge App - Login Screen (PIN-based authentication)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { Mail, LogIn, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../lib/api';
import { PinInput } from '../components/PinInput';
import { useOnboardingStore } from '../lib/state/onboarding-store';
import { theme } from '../lib/theme';

const colors = {
  background: theme.background,
  surfacePrimary: theme.surfacePrimary,
  surfaceElevated: theme.surfaceElevated,
  border: theme.border,
  textPrimary: theme.textPrimary,
  textSecondary: theme.textSecondary,
  textMuted: theme.textMuted,
  purple: theme.purple,
  teal: theme.teal,
  red: '#EF4444',
  gradientStart: theme.gradientStart,
  gradientEnd: theme.gradientEnd,
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const pinString = pin;

    if (!email) {
      setError('Please enter your email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (pinString.length !== 6) {
      setError('Please enter your complete 6-digit PIN');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError(null);
    // Use PIN as password for auth (backend should handle PIN verification)
    const result = await signIn({ email, password: pinString });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } else {
      setError(result.error ?? 'Invalid email or PIN');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Clear PIN on error
      setPin('');
    }
  };

  const handleForgotPin = () => {
    router.push('/forgot-password');
  };

  const handleSignUp = () => {
    resetOnboarding();
    router.push('/onboarding');
  };

  const isPinComplete = pin.length === 6;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
            <KeyboardAwareScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              bottomOffset={50}
            >
              <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 }}>
                {/* Escape hatch. Someone who reaches this screen by mistake --
                    from onboarding, or after signing out -- otherwise has no way
                    out but to force-quit. */}
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    if (router.canGoBack()) router.back();
                    else router.replace('/');
                  }}
                  hitSlop={12}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 7,
                    alignSelf: 'flex-start', marginBottom: 20,
                    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <ArrowLeft size={18} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '600' }}>Back</Text>
                </Pressable>

                {/* Header */}
                <Animated.View 
                  entering={FadeInDown.duration(600)} 
                  style={{ alignItems: 'center', marginBottom: 48 }}
                >
                  <Text style={{ fontSize: 36, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
                    FamilyForge
                  </Text>
                  <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                    Welcome back!
                  </Text>
                </Animated.View>

                {/* Form */}
                <Animated.View entering={FadeInUp.delay(200).duration(500)}>
                  {/* Email Input */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>
                      Email Address
                    </Text>
                    <View 
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: colors.surfaceElevated, 
                        borderRadius: 16, 
                        paddingHorizontal: 16, 
                        paddingVertical: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Mail size={20} color={colors.textMuted} />
                      <TextInput
                        style={{ 
                          flex: 1, 
                          color: colors.textPrimary, 
                          fontSize: 16, 
                          marginLeft: 12,
                        }}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* PIN Input */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>
                      6-Digit PIN
                    </Text>
                    <PinInput
                      value={pin}
                      onChange={setPin}
                      masked
                      activeColor={colors.purple}
                      filledColor={colors.teal}
                      boxBackground={colors.surfaceElevated}
                      borderColor={colors.border}
                      textColor={colors.textPrimary}
                      boxHeight={52}
                    />
                  </View>

                  {/* Been invited? An invited partner or guardian arrives with
                      a code and nothing else; without this they have no route in. */}
                  <Pressable
                    onPress={() => router.push('/join-family')}
                    style={{ alignSelf: 'center', marginBottom: 18, paddingVertical: 8 }}
                  >
                    <Text style={{ color: colors.purple, fontSize: 14.5, fontWeight: '600' }}>
                      Been invited to a family? Enter your code
                    </Text>
                  </Pressable>

                  {/* Forgot PIN */}
                  <Pressable onPress={handleForgotPin} style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
                    <Text style={{ color: colors.teal, fontSize: 14 }}>Forgot PIN?</Text>
                  </Pressable>

                  {/* Error Message */}
                  {error && (
                    <Animated.View 
                      entering={FadeInUp.duration(300)}
                      style={{ 
                        backgroundColor: `${colors.red}20`, 
                        borderRadius: 14, 
                        paddingHorizontal: 16, 
                        paddingVertical: 12, 
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: `${colors.red}40`,
                      }}
                    >
                      <Text style={{ color: colors.red, textAlign: 'center', fontSize: 14 }}>{error}</Text>
                    </Animated.View>
                  )}

                  {/* Login Button */}
                  <Pressable
                    onPress={handleLogin}
                    disabled={isLoading || !isPinComplete}
                    style={{ 
                      backgroundColor: isPinComplete ? colors.teal : colors.surfaceElevated, 
                      borderRadius: 16, 
                      paddingVertical: 16, 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      opacity: isLoading ? 0.7 : 1,
                      borderWidth: isPinComplete ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.textPrimary} />
                    ) : (
                      <>
                        <LogIn size={20} color={isPinComplete ? colors.textPrimary : colors.textMuted} />
                        <Text 
                          style={{ 
                            color: isPinComplete ? colors.textPrimary : colors.textMuted, 
                            fontWeight: '600', 
                            fontSize: 16, 
                            marginLeft: 8,
                          }}
                        >
                          Sign In
                        </Text>
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Sign Up Link */}
                <Animated.View 
                  entering={FadeInUp.delay(400).duration(500)}
                  style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}
                >
                  <Text style={{ color: colors.textMuted }}>Don't have an account? </Text>
                  <Pressable onPress={handleSignUp}>
                    <Text style={{ color: colors.teal, fontWeight: '600' }}>Sign Up</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </KeyboardAwareScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
