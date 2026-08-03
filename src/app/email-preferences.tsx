import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Mail, Bell, FileText, Users, Shield } from 'lucide-react-native';
import { useAuth } from '../lib/api/auth-context';
import { getEmailPreferences, updateEmailPreferences } from '../lib/api/email';

interface EmailPrefs {
  task_reminders: boolean;
  achievement_alerts: boolean;
  weekly_reports: boolean;
  marketing_emails: boolean;
  family_invites: boolean;
  security_alerts: boolean;
}

export default function EmailPreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<EmailPrefs>({
    task_reminders: true,
    achievement_alerts: true,
    weekly_reports: true,
    marketing_emails: false,
    family_invites: true,
    security_alerts: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const result = await getEmailPreferences(user.id);
      // `result` is the wrapper; the flags live on `result.preferences`. Reading
      // them off the wrapper is why every toggle showed off regardless of what
      // was saved.
      if (result.success && result.preferences) {
        setPrefs(result.preferences);
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (key: keyof EmailPrefs, value: boolean) => {
    if (!user?.id) return;

    // Security alerts can't be disabled
    if (key === 'security_alerts' && !value) {
      Alert.alert(
        'Security Alerts Required',
        'Security alerts cannot be disabled to keep your account safe.'
      );
      return;
    }

    try {
      setSaving(true);
      setPrefs((prev) => ({ ...prev, [key]: value }));
      await updateEmailPreferences(user.id, { [key]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      setPrefs((prev) => ({ ...prev, [key]: !value }));
      Alert.alert('Error', 'Failed to update email preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
        <View className="flex-row items-center px-5 py-4 border-b border-slate-800">
          <Pressable onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#94a3b8" />
          </Pressable>
          <Text className="text-xl font-semibold text-white flex-1">Email Preferences</Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-5 py-6">
            <View className="flex-row items-center gap-3 mb-2">
              <Mail size={20} color="#10b981" />
              <Text className="text-slate-400 text-sm">
                Manage which emails you receive from FamilyForge
              </Text>
            </View>
          </View>

          <View className="gap-4 px-5">
            <PreferenceCard
              icon={<Bell size={20} color="#10b981" />}
              title="Task Reminders"
              description="Get notified when tasks are due or overdue"
              enabled={prefs.task_reminders}
              onToggle={(value) => togglePreference('task_reminders', value)}
              disabled={saving || loading}
            />

            <PreferenceCard
              icon={<Text className="text-xl">🎉</Text>}
              title="Achievement Alerts"
              description="Celebrate when your children earn achievements and reach milestones"
              enabled={prefs.achievement_alerts}
              onToggle={(value) => togglePreference('achievement_alerts', value)}
              disabled={saving || loading}
            />

            <PreferenceCard
              icon={<FileText size={20} color="#3b82f6" />}
              title="Weekly Reports"
              description="Receive a summary of your family's progress every week"
              enabled={prefs.weekly_reports}
              onToggle={(value) => togglePreference('weekly_reports', value)}
              disabled={saving || loading}
            />

            <PreferenceCard
              icon={<Users size={20} color="#8b5cf6" />}
              title="Family Invitations"
              description="Get notified when someone invites you to join their family"
              enabled={prefs.family_invites}
              onToggle={(value) => togglePreference('family_invites', value)}
              disabled={saving || loading}
            />

            <PreferenceCard
              icon={<Mail size={20} color="#64748b" />}
              title="Marketing Emails"
              description="Tips, tricks, and updates about FamilyForge features"
              enabled={prefs.marketing_emails}
              onToggle={(value) => togglePreference('marketing_emails', value)}
              disabled={saving || loading}
            />

            <PreferenceCard
              icon={<Shield size={20} color="#ef4444" />}
              title="Security Alerts"
              description="Important account security notifications (required)"
              enabled={prefs.security_alerts}
              onToggle={(value) => togglePreference('security_alerts', value)}
              disabled={true}
              required
            />
          </View>

          <View className="mt-8 px-5">
            <View className="bg-emerald-900/20 border border-emerald-700 rounded-2xl p-4">
              <Text className="text-emerald-400 text-sm leading-relaxed">
                ✅ <Text className="font-semibold">Domain Verified!</Text> Your FamilyForge emails will be sent from noreply@familyforge.app and can reach any email address.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

interface PreferenceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}

function PreferenceCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  disabled,
  required,
}: PreferenceCardProps) {
  return (
    <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-start gap-3">
          <View className="mt-1">{icon}</View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-semibold text-base">{title}</Text>
              {required && (
                <View className="bg-red-500/20 px-2 py-0.5 rounded-full">
                  <Text className="text-red-400 text-xs font-medium">Required</Text>
                </View>
              )}
            </View>
            <Text className="text-slate-400 text-sm mt-1 leading-relaxed">
              {description}
            </Text>
          </View>
        </View>

        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: '#334155', true: '#10b981' }}
          thumbColor={enabled ? '#fff' : '#94a3b8'}
          ios_backgroundColor="#334155"
          style={{ marginLeft: 12 }}
        />
      </View>
    </View>
  );
}
