// Pro Parenting App - Forgot Password Screen
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
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
      } else {
        setError(result.error ?? 'Failed to send reset email');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-[#1a1a1f]">
        <View className="flex-1 px-6 justify-center items-center">
          <View className="bg-[#5b9a8b]/20 rounded-full p-6 mb-6">
            <CheckCircle size={48} color="#5b9a8b" />
          </View>
          <Text className="text-white text-2xl font-bold mb-2 text-center">Check your email</Text>
          <Text className="text-[#6b6b70] text-center mb-8">
            We've sent password reset instructions to {email}
          </Text>
          <Pressable
            onPress={handleBack}
            className="bg-[#252529] rounded-xl py-4 px-8"
          >
            <Text className="text-white font-semibold">Back to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1a1a1f]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={50}
          >
            <Pressable className="flex-1 px-6 pt-6 pb-8" onPress={() => {}}>
            {/* Back Button */}
            <Pressable onPress={handleBack} className="flex-row items-center mb-8">
              <ArrowLeft size={24} color="#5b9a8b" />
              <Text className="text-[#5b9a8b] ml-2">Back</Text>
            </Pressable>

            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-white mb-2">Forgot Password?</Text>
              <Text className="text-[#6b6b70] text-base">
                No worries! Enter your email and we'll send you reset instructions.
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Email Input */}
              <View>
                <Text className="text-[#6b6b70] text-sm mb-2 ml-1">Email</Text>
                <View className="flex-row items-center bg-[#252529] rounded-xl px-4 py-3">
                  <Mail size={20} color="#6b6b70" />
                  <TextInput
                    className="flex-1 text-white text-base ml-3"
                    placeholder="Enter your email"
                    placeholderTextColor="#6b6b70"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-500/20 rounded-xl px-4 py-3 mt-4">
                  <Text className="text-red-400 text-center">{error}</Text>
                </View>
              )}

              {/* Reset Button */}
              <Pressable
                onPress={handleResetPassword}
                disabled={isLoading}
                className="bg-[#5b9a8b] rounded-xl py-4 mt-6 flex-row items-center justify-center"
                style={{ opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Send size={20} color="white" />
                    <Text className="text-white font-semibold text-lg ml-2">Send Reset Link</Text>
                  </>
                )}
              </Pressable>
            </View>
            </Pressable>
          </KeyboardAwareScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
