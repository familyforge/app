/// <reference types="nativewind/types" />

import { Pressable, ScrollView, Text, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ChevronLeft,
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Star,
  Heart,
  Shield,
  FileText,
  ExternalLink,
  Lightbulb,
  Users,
  ChevronRight,
} from "lucide-react-native";

const FAQ_ITEMS = [
  {
    question: "How do I add a new child?",
    answer:
      "Go to the Children tab and tap the '+' button at the top. Fill in your child's details including name, age, and any special interests.",
  },
  {
    question: "How does the points system work?",
    answer:
      "Children earn points by completing tasks. You set the point values when creating tasks. Points can be redeemed for rewards that you define.",
  },
  {
    question: "Can I share access with my partner?",
    answer:
      "Yes! Go to Profile > Give Access to invite family members. They can have different access levels: Partner (full access), Co-parent, Guardian, or Child.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Your data is stored locally on your device and can optionally sync to our secure cloud. We use industry-standard encryption and never share your data.",
  },
  {
    question: "How do I create routines?",
    answer:
      "Go to Profile > My Routines. You can create morning, after-school, and bedtime routines with step-by-step tasks for your children.",
  },
];

const TIPS = [
  {
    emoji: "🎯",
    title: "Start Small",
    description: "Begin with 2-3 simple tasks and gradually add more as your child gets used to the system.",
  },
  {
    emoji: "🌟",
    title: "Celebrate Wins",
    description: "Use the achievement alerts to make completing tasks exciting and rewarding.",
  },
  {
    emoji: "🤝",
    title: "Involve Your Child",
    description: "Let them help choose tasks and rewards. Kids are more motivated when they have input.",
  },
  {
    emoji: "📅",
    title: "Be Consistent",
    description: "Regular routines help children feel secure and develop good habits naturally.",
  },
];

export default function SupportScreen() {
  const router = useRouter();

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@familyforge.app?subject=Support%20Request");
  };

  const handleRateApp = () => {
    // Would link to app store
    Linking.openURL("https://apps.apple.com");
  };

  const MenuItem = ({
    icon: Icon,
    iconColor,
    label,
    sublabel,
    onPress,
    isExternal,
  }: {
    icon: any;
    iconColor: string;
    label: string;
    sublabel?: string;
    onPress: () => void;
    isExternal?: boolean;
  }) => (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-4 border-b border-slate-800">
      <View
        className="h-10 w-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium">{label}</Text>
        {sublabel && <Text className="text-xs text-slate-400 mt-0.5">{sublabel}</Text>}
      </View>
      {isExternal ? (
        <ExternalLink size={18} color="#64748b" />
      ) : (
        <ChevronRight size={18} color="#64748b" />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Support & About",
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
          <HelpCircle size={20} color="#ec4899" />
          <Text className="text-xl font-bold text-white">Support & About</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Quick Links */}
        <View className="px-5 pt-6">
          <Text className="text-sm font-medium text-slate-400 mb-2">GET HELP</Text>
          <View className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <MenuItem
              icon={MessageCircle}
              iconColor="#3b82f6"
              label="Chat with Support"
              sublabel="Usually responds within 24 hours"
              onPress={handleEmailSupport}
              isExternal
            />
            <MenuItem
              icon={Mail}
              iconColor="#10b981"
              label="Email Support"
              sublabel="support@familyforge.app"
              onPress={handleEmailSupport}
              isExternal
            />
            <MenuItem
              icon={Book}
              iconColor="#8b5cf6"
              label="User Guide"
              sublabel="Learn how to use all features"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* FAQ Section */}
        <View className="px-5 mt-6">
          <Text className="text-sm font-medium text-slate-400 mb-2">FREQUENTLY ASKED QUESTIONS</Text>
          <View className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            {FAQ_ITEMS.map((faq, index) => (
              <View
                key={index}
                className={`p-4 ${index < FAQ_ITEMS.length - 1 ? "border-b border-slate-800" : ""}`}
              >
                <Text className="text-white font-medium mb-2">{faq.question}</Text>
                <Text className="text-sm text-slate-400 leading-relaxed">{faq.answer}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Parenting Tips */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center gap-2 mb-2">
            <Lightbulb size={16} color="#f59e0b" />
            <Text className="text-sm font-medium text-slate-400">PARENTING TIPS</Text>
          </View>
          <View className="gap-3">
            {TIPS.map((tip, index) => (
              <View
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">{tip.emoji}</Text>
                  <Text className="text-white font-medium">{tip.title}</Text>
                </View>
                <Text className="text-sm text-slate-400 leading-relaxed">{tip.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View className="px-5 mt-6">
          <Text className="text-sm font-medium text-slate-400 mb-2">ABOUT</Text>
          <View className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <MenuItem
              icon={Star}
              iconColor="#f59e0b"
              label="Rate FamilyForge"
              sublabel="Help other parents find us"
              onPress={handleRateApp}
              isExternal
            />
            <MenuItem
              icon={Heart}
              iconColor="#ec4899"
              label="Share with Friends"
              sublabel="Spread the word"
              onPress={() => {}}
            />
            <MenuItem
              icon={FileText}
              iconColor="#64748b"
              label="Terms of Service"
              onPress={() => {}}
              isExternal
            />
            <MenuItem
              icon={Shield}
              iconColor="#10b981"
              label="Privacy Policy"
              onPress={() => {}}
              isExternal
            />
          </View>
        </View>

        {/* App Info */}
        <View className="px-5 mt-8 items-center">
          <View className="h-16 w-16 rounded-2xl bg-emerald-500/20 items-center justify-center mb-4">
            <Users size={32} color="#10b981" />
          </View>
          <Text className="text-xl font-bold text-white">FamilyForge</Text>
          <Text className="text-sm text-slate-400 mt-1">Version 1.0.0</Text>
          <Text className="text-xs text-slate-500 mt-4 text-center px-8">
            Made with ❤️ to help busy parents raise amazing kids through positive
            reinforcement and consistent routines.
          </Text>
          <Text className="text-xs text-slate-600 mt-4">© 2026 FamilyForge. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
