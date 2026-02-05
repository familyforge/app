/// <reference types="nativewind/types" />

import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import {
  ChevronLeft,
  Bell,
  Shield,
  Cloud,
  CloudOff,
  Trash2,
  Download,
  Upload,
  X,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronRight,
} from "lucide-react-native";
import { useProfileStore } from "../lib/state/profile-store";
import { useAppStore } from "../lib/state/app-store";
import { useFamilyStore } from "../lib/state/family-store";
import { useCalendarStore } from "../lib/state/calendar-store";
import { useDeadlinesStore } from "../lib/state/deadlines-store";
import { useAuth } from "../lib/api/auth-context";
import { requestDataExport } from "../lib/api/data-export";
import { triggerTestNotification } from "../lib/utils/notifications";

export default function SettingsFullScreen() {
  const router = useRouter();
  const netInfo = useNetInfo();
  const { user } = useAuth();
  const profile = useProfileStore((state) => state.profile);

  const notifications = useProfileStore((state) => state.notifications);
  const updateNotifications = useProfileStore((state) => state.updateNotifications);
  const sync = useProfileStore((state) => state.sync);
  const updateSync = useProfileStore((state) => state.updateSync);
  const privacy = useProfileStore((state) => state.privacy);
  const updatePrivacy = useProfileStore((state) => state.updatePrivacy);
  const requestDeletion = useProfileStore((state) => state.requestDeletion);
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const resetAppStore = useAppStore((state) => state.resetStore);
  const resetFamilyStore = useFamilyStore((state) => state.resetStore);
  const resetCalendarStore = useCalendarStore((state) => state.resetStore);
  const resetDeadlinesStore = useDeadlinesStore((state) => state.resetStore);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Warning handler for disabling sync
  const handleSyncToggle = (setting: 'enabled' | 'autoSync', newValue: boolean) => {
    if (!newValue) {
      // User is trying to turn OFF sync - show warning
      Alert.alert(
        "Disable Sync?",
        "⚠️ Warning: Other family members won't see your changes to tasks, rewards, routines, and calendars in real-time.\n\nThis can cause:\n• Conflicting task assignments\n• Missed updates to routines\n• Delayed reward redemptions\n• Calendar sync issues\n\nAre you sure you want to continue?",
        [
          { text: "Keep Sync On", style: "cancel" },
          {
            text: "Turn Off Anyway",
            style: "destructive",
            onPress: () => {
              if (setting === 'enabled') {
                updateSync({ enabled: false, autoSync: false });
              } else {
                updateSync({ autoSync: false });
              }
            },
          },
        ]
      );
    } else {
      // User is turning sync ON
      if (setting === 'enabled') {
        updateSync({ enabled: true });
      } else {
        updateSync({ autoSync: true });
      }
    }
  };

  const handleExportData = async () => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to request a data export.",
        [{ text: "OK" }]
      );
      return;
    }

    // Confirm the request
    Alert.alert(
      "Export My Data",
      "This will send a request to our team to prepare your data export. Once ready, you'll receive an email with a download link.\n\nThis may take up to 48 hours to process.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Export",
          onPress: async () => {
            setIsExporting(true);
            try {
              const result = await requestDataExport({
                userId: user.id,
                userEmail: user.email || profile.email || "",
                userName: user.name || profile.name || "User",
              });

              if (result.success) {
                Alert.alert(
                  "Request Submitted",
                  "Your data export request has been submitted. You'll receive an email at " + (user.email || profile.email) + " when your data is ready to download.",
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert(
                  "Request Failed",
                  result.error || "Unable to submit your request. Please try again later.",
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              Alert.alert(
                "Error",
                "An unexpected error occurred. Please try again later.",
                [{ text: "OK" }]
              );
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (confirmText !== "DELETE") {
      Alert.alert("Confirmation Required", 'Please type "DELETE" to confirm.');
      return;
    }

    requestDeletion(deleteReason);
    
    // Reset all stores
    resetProfile();
    resetAppStore();
    resetFamilyStore();
    resetCalendarStore();
    resetDeadlinesStore();

    setDeleteModalOpen(false);
    router.replace("/login");
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View className="mb-6">
      <Text className="text-sm font-medium text-slate-400 px-5 mb-2">{title}</Text>
      <View className="mx-5 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {children}
      </View>
    </View>
  );

  const ToggleRow = ({
    icon: Icon,
    iconColor,
    label,
    sublabel,
    value,
    onToggle,
    isLast,
  }: {
    icon: any;
    iconColor: string;
    label: string;
    sublabel?: string;
    value: boolean;
    onToggle: (val: boolean) => void;
    isLast?: boolean;
  }) => (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        !isLast ? "border-b border-slate-800" : ""
      }`}
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View
          className="h-9 w-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium">{label}</Text>
          {sublabel && (
            <Text className="text-xs text-slate-400 mt-0.5">{sublabel}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#475569", true: "#10b981" }}
        thumbColor="#fff"
      />
    </View>
  );

  const ActionRow = ({
    icon: Icon,
    iconColor,
    label,
    sublabel,
    onPress,
    isLast,
  }: {
    icon: any;
    iconColor: string;
    label: string;
    sublabel?: string;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 ${
        !isLast ? "border-b border-slate-800" : ""
      }`}
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View
          className="h-9 w-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium">{label}</Text>
          {sublabel && (
            <Text className="text-xs text-slate-400 mt-0.5">{sublabel}</Text>
          )}
        </View>
      </View>
      <ChevronRight size={18} color="#64748b" />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Settings",
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Settings size={20} color="#6b7280" />
          <Text className="text-xl font-bold text-white">Settings</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Connection Status */}
        <View className="px-5 pt-6 pb-4">
          <View
            className={`rounded-2xl p-4 flex-row items-center gap-3 ${
              netInfo.isConnected
                ? "border border-emerald-500/30 bg-emerald-500/10"
                : "border border-amber-500/30 bg-amber-500/10"
            }`}
          >
            {netInfo.isConnected ? (
              <>
                <Cloud size={20} color="#10b981" />
                <View>
                  <Text className="text-emerald-400 font-medium">Connected</Text>
                  <Text className="text-xs text-slate-400">
                    Your data is syncing to the cloud
                  </Text>
                </View>
              </>
            ) : (
              <>
                <CloudOff size={20} color="#f59e0b" />
                <View>
                  <Text className="text-amber-400 font-medium">Offline Mode</Text>
                  <Text className="text-xs text-slate-400">
                    Changes will sync when you're back online
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          <ToggleRow
            icon={Bell}
            iconColor="#3b82f6"
            label="Task Reminders"
            sublabel="Get notified about pending tasks"
            value={notifications.taskReminders}
            onToggle={(val) => updateNotifications({ taskReminders: val })}
          />
          <ToggleRow
            icon={Bell}
            iconColor="#f59e0b"
            label="Routine Reminders"
            sublabel="Morning and bedtime routine alerts"
            value={notifications.routineReminders}
            onToggle={(val) => updateNotifications({ routineReminders: val })}
          />
          <ToggleRow
            icon={AlertTriangle}
            iconColor="#ef4444"
            label="Urgent Alerts"
            sublabel="Deadlines and overdue tasks"
            value={notifications.urgentAlerts}
            onToggle={(val) => updateNotifications({ urgentAlerts: val })}
          />
          <ToggleRow
            icon={Bell}
            iconColor="#8b5cf6"
            label="Motivational Nudges"
            sublabel="Positive daily reminders"
            value={notifications.motivationalNudges}
            onToggle={(val) => updateNotifications({ motivationalNudges: val })}
          />
          <ToggleRow
            icon={Bell}
            iconColor="#10b981"
            label="Achievement Alerts"
            sublabel="Celebrate your children's wins"
            value={notifications.achievementAlerts}
            onToggle={(val) => updateNotifications({ achievementAlerts: val })}
          />
          <ToggleRow
            icon={Bell}
            iconColor="#0ea5e9"
            label="Weekly Reports"
            sublabel="Get a summary every Sunday"
            value={notifications.weeklyReports}
            onToggle={(val) => updateNotifications({ weeklyReports: val })}
          />
          <ActionRow
            icon={Bell}
            iconColor="#22c55e"
            label="Test Notification"
            sublabel="Send a test alert now"
            onPress={triggerTestNotification}
          />
          <ActionRow
            icon={Settings}
            iconColor="#64748b"
            label="Notification Sound & Volume"
            sublabel="Use your device settings to choose sound and volume"
            onPress={() => Linking.openSettings()}
            isLast
          />
        </Section>

        {/* Sync & Backup */}
        <Section title="SYNC & BACKUP">
          <ToggleRow
            icon={Cloud}
            iconColor="#3b82f6"
            label="Cloud Sync"
            sublabel="Required for family members to see changes"
            value={sync.enabled}
            onToggle={(val) => handleSyncToggle('enabled', val)}
          />
          <ToggleRow
            icon={RefreshCw}
            iconColor="#10b981"
            label="Auto-sync"
            sublabel="Sync changes in real-time"
            value={sync.autoSync}
            onToggle={(val) => handleSyncToggle('autoSync', val)}
            isLast
          />
        </Section>

        {/* Privacy */}
        <Section title="PRIVACY">
          <ToggleRow
            icon={Eye}
            iconColor="#8b5cf6"
            label="Show Points Balance"
            sublabel="Let children see their points"
            value={privacy.showPointsToChildren}
            onToggle={(val) => updatePrivacy({ showPointsToChildren: val })}
          />
          <ToggleRow
            icon={EyeOff}
            iconColor="#64748b"
            label="Hide Sensitive Info"
            sublabel="Blur personal details in reports"
            value={privacy.hidePersonalInReports}
            onToggle={(val) => updatePrivacy({ hidePersonalInReports: val })}
          />
          <ToggleRow
            icon={Shield}
            iconColor="#10b981"
            label="Analytics"
            sublabel="Help improve the app"
            value={privacy.allowAnalytics}
            onToggle={(val) => updatePrivacy({ allowAnalytics: val })}
            isLast
          />
        </Section>

        {/* Data Management */}
        <Section title="DATA MANAGEMENT">
          <Pressable
            onPress={handleExportData}
            disabled={isExporting}
            className={`flex-row items-center px-4 py-4 border-b border-slate-800 ${isExporting ? "opacity-50" : ""}`}
          >
            <View className="h-9 w-9 rounded-full bg-blue-500/20 items-center justify-center mr-3">
              <Download size={18} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">
                {isExporting ? "Submitting Request..." : "Export My Data"}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Request a copy of all your data
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setDeleteModalOpen(true)}
            className="flex-row items-center px-4 py-4"
          >
            <View className="h-9 w-9 rounded-full bg-red-500/20 items-center justify-center mr-3">
              <Trash2 size={18} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-400 font-medium">Delete Account</Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Permanently remove all your data
              </Text>
            </View>
          </Pressable>
        </Section>

        {/* App Info */}
        <View className="px-5 mt-4 items-center">
          <Text className="text-xs text-slate-500">FamilyForge v1.0.0</Text>
          <Text className="text-xs text-slate-600 mt-1">
            Last synced: {sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleString() : "Never"}
          </Text>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal visible={deleteModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-800">
              <Pressable onPress={() => setDeleteModalOpen(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-lg font-semibold text-red-400">Delete Account</Text>
              <View className="w-6" />
            </View>

            <View className="px-5 py-6">
              {/* Warning */}
              <View className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 mb-6">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertTriangle size={20} color="#ef4444" />
                  <Text className="text-red-400 font-semibold">Warning</Text>
                </View>
                <Text className="text-slate-300 text-sm leading-relaxed">
                  This action cannot be undone. All your data including children profiles, 
                  tasks, rewards, and progress will be permanently deleted.
                </Text>
              </View>

              {/* Reason */}
              <Text className="text-sm font-medium text-slate-400 mb-2">
                Why are you leaving? (optional)
              </Text>
              <TextInput
                value={deleteReason}
                onChangeText={setDeleteReason}
                placeholder="Help us improve..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 min-h-[80px]"
              />

              {/* Confirmation */}
              <Text className="text-sm font-medium text-slate-400 mb-2">
                Type "DELETE" to confirm
              </Text>
              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="DELETE"
                placeholderTextColor="#64748b"
                autoCapitalize="characters"
                className="bg-slate-800 border border-red-500/30 rounded-xl px-4 py-3 text-white mb-6"
              />

              {/* Delete Button */}
              <Pressable
                onPress={handleDeleteAccount}
                disabled={confirmText !== "DELETE"}
                className={`py-4 rounded-xl items-center ${
                  confirmText === "DELETE" ? "bg-red-500" : "bg-slate-700"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    confirmText === "DELETE" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Delete My Account Forever
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
