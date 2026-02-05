// Settings Modal
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "../lib/state/app-store";
import { Moon, Sun, Bell, Clock, RotateCcw, Mail } from "lucide-react-native";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppStore((s) => s.settings.theme);
  const notifications = useAppStore((s) => s.settings.notifications);
  const reminders = useAppStore((s) => s.settings.reminders);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetStore = useAppStore((s) => s.resetStore);

  const isDark = theme === "dark" || theme === "system";

  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ theme: theme === "dark" ? "light" : "dark" });
  };

  const toggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ notifications: !notifications });
  };

  const toggleReminders = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ reminders: !reminders });
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetStore();
  };

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    value: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 rounded-xl mb-3 ${
        isDark ? "bg-card active:bg-card/80" : "bg-card-light active:bg-gray-100"
      }`}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className={isDark ? "text-text text-base" : "text-text-light text-base"}>
          {label}
        </Text>
      </View>
      <View
        className={`w-12 h-7 rounded-full p-1 ${
          value ? "bg-primary" : isDark ? "bg-muted/30" : "bg-gray-300"
        }`}
      >
        <View
          className={`w-5 h-5 rounded-full bg-white ${
            value ? "ml-auto" : "mr-auto"
          }`}
        />
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      className={isDark ? "flex-1 bg-background" : "flex-1 bg-background-light"}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text
        className={`text-sm font-medium mb-3 ${isDark ? "text-muted" : "text-muted-light"}`}
      >
        APPEARANCE
      </Text>

      <SettingRow
        icon={isDark ? <Moon color="#5b9a8b" size={22} /> : <Sun color="#5b9a8b" size={22} />}
        label="Dark Mode"
        value={isDark}
        onPress={toggleTheme}
      />

      <Text
        className={`text-sm font-medium mb-3 mt-6 ${isDark ? "text-muted" : "text-muted-light"}`}
      >
        NOTIFICATIONS
      </Text>

      <SettingRow
        icon={<Bell color="#5b9a8b" size={22} />}
        label="Push Notifications"
        value={notifications}
        onPress={toggleNotifications}
      />

      <SettingRow
        icon={<Clock color="#5b9a8b" size={22} />}
        label="Task Reminders"
        value={reminders}
        onPress={toggleReminders}
      />

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/email-preferences');
        }}
        className={`flex-row items-center justify-between p-4 rounded-xl mt-3 ${
          isDark ? "bg-card active:bg-card/80" : "bg-card-light active:bg-gray-100"
        }`}
      >
        <View className="flex-row items-center gap-3">
          <Mail color="#5b9a8b" size={22} />
          <Text className={isDark ? "text-text text-base" : "text-text-light text-base"}>
            Email Preferences
          </Text>
        </View>
        <Text className={isDark ? "text-muted" : "text-muted-light"}>›</Text>
      </Pressable>

      <Text
        className={`text-sm font-medium mb-3 mt-6 ${isDark ? "text-muted" : "text-muted-light"}`}
      >
        DATA
      </Text>

      <Pressable
        onPress={handleReset}
        className={`flex-row items-center gap-3 p-4 rounded-xl ${
          isDark ? "bg-card active:bg-card/80" : "bg-card-light active:bg-gray-100"
        }`}
      >
        <RotateCcw color="#ef4444" size={22} />
        <Text className="text-error text-base">Reset All Data</Text>
      </Pressable>

      <Text className={`text-xs text-center mt-8 ${isDark ? "text-muted" : "text-muted-light"}`}>
        FamilyForge v1.0.0
      </Text>
    </ScrollView>
  );
}
