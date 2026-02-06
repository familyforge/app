// FamilyForge Landing Page - Web Only
// Premium, emotionally-driven marketing page for parents

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
  Linking,
  Image,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  Shield,
  Users,
  Clock,
  Gift,
  Calendar,
  BarChart3,
  Bell,
  BookOpen,
  Star,
  Trophy,
  Mail,
  Download,
  ChevronRight,
  Play,
  Sparkles,
  Target,
  Check,
  X,
} from "lucide-react-native";

// Detect mobile device and OS
function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isMobile =
        /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
      const isIOS = /iphone|ipad|ipod/i.test(ua);
      const isAndroid = /android/i.test(ua);

      setDeviceInfo({ isMobile, isIOS, isAndroid });
    }
  }, []);

  return deviceInfo;
}

// Sound notification for download prompt
function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = () => {
    if (Platform.OS === "web" && typeof Audio !== "undefined") {
      // Use a pleasant notification sound (data URI for a simple ding)
      const audioData =
        "data:audio/wav;base64,UklGRqoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYYGAACAgICAgICAgICAgICAgICAgICAgICAgICAjYKMn5R3f114dnlwdHJ5d3p4a19vZGNfY2RhYmloaG1tcHJ2d3t9f4CFiIuPjpGQkZKVlJSZmJmZmJiampeUk5CNjY2IhomGg4B8fnh2c3BtbWtnaGZlYl5gXVldXFtaW1xcXlxfX2FgY2VkZWhnbW5wcnV5fH1/goWGiIyNjoyOkJKQkZKUnJucm5+goqKio6Sjp6ioqKepqKqqrKusra6vrq2urKurrKmqqqmnp6alpqSkpKCfnpycmpuYlZSUk5CPjIyMioiHhoSCgIB+fXt6eXh3dnR1dHR1dXZ3eXp7fH5/gIKDhoeIiYuNjo+RkpOUlZaXl5iZmpqbmpmcm5uin6Gdm5uZlZSSkJCOjIqOjIR9endzcjxvbm1ta2lnZmVkYF9fX15cXFxcXV1dXl1dXV5gYWJiYmJjZGVmZmdpamprbGxub29xcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj4+QkZKSkpOUlZWVlpaWl5eXl5eXl5eXlpaVlZSUk5OSkZCPj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHRzc3JycXFwcXFxcXJyc3N0dXZ3d3h5enp7fH1+fn+AgYKDhIWFhoaHiIiJioqLi4yMjI2Njoy=";
      try {
        const audio = new Audio(audioData);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {
        // Ignore audio errors
      }
    }
  };

  return { playSound };
}

// Feature card data
const FEATURES = [
  {
    icon: Sparkles,
    title: "Quick Start",
    problem: "New apps feel overwhelming",
    result: "See value in minutes",
    relief: "No learning curve, just clarity",
    colors: ["#10b981", "#059669"] as const,
  },
  {
    icon: Users,
    title: "Multi-Child Support",
    problem: "Managing multiple kids is chaos",
    result: "Individual child dashboards",
    relief: "Each child, their own space",
    colors: ["#8b5cf6", "#7c3aed"] as const,
  },
  {
    icon: Heart,
    title: "Shared Family Access",
    problem: "Solo parenting is exhausting",
    result: "Invite co-parents easily",
    relief: "Teamwork without conflict",
    colors: ["#f43f5e", "#e11d48"] as const,
  },
  {
    icon: Clock,
    title: "Tasks & Routines",
    problem: "Constant reminding drains you",
    result: "Assign and track tasks",
    relief: "Consistency without nagging",
    colors: ["#3b82f6", "#2563eb"] as const,
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    problem: "Things slip through the cracks",
    result: "Automatic notifications",
    relief: "Nothing gets forgotten",
    colors: ["#f59e0b", "#d97706"] as const,
  },
  {
    icon: Gift,
    title: "Rewards System",
    problem: "Motivation battles every day",
    result: "Points and redeemable rewards",
    relief: "Encouragement replaces arguments",
    colors: ["#ec4899", "#db2777"] as const,
  },
  {
    icon: BookOpen,
    title: "Learning Assignments",
    problem: "Education feels separate",
    result: "Learning tied to daily life",
    relief: "Growth beyond just chores",
    colors: ["#14b8a6", "#0d9488"] as const,
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    problem: "No visibility into improvement",
    result: "Streaks and goal visualization",
    relief: "See growth build confidence",
    colors: ["#6366f1", "#4f46e5"] as const,
  },
  {
    icon: Trophy,
    title: "Weekly Reports",
    problem: "No time to track everything",
    result: "Automatic summaries",
    relief: "Clarity for busy parents",
    colors: ["#eab308", "#ca8a04"] as const,
  },
  {
    icon: Calendar,
    title: "Family Calendar",
    problem: "Scattered schedules cause stress",
    result: "One centralized view",
    relief: "No more forgotten events",
    colors: ["#06b6d4", "#0891b2"] as const,
  },
  {
    icon: Shield,
    title: "Privacy Control",
    problem: "Don't trust apps with data",
    result: "GDPR-ready, full control",
    relief: "Your family, your data",
    colors: ["#64748b", "#475569"] as const,
  },
  {
    icon: Mail,
    title: "Email Preferences",
    problem: "Apps spam constantly",
    result: "Complete control",
    relief: "Only what you want",
    colors: ["#a855f7", "#9333ea"] as const,
  },
];

// Mobile Download Prompt Component
function MobileDownloadPrompt({
  isIOS,
  isAndroid,
  onDismiss,
}: {
  isIOS: boolean;
  isAndroid: boolean;
  onDismiss: () => void;
}) {
  return (
    <View
      style={{
        position: "fixed" as any,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "rgba(15, 10, 31, 0.98)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(139, 92, 246, 0.3)",
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          paddingTop: 16,
          gap: 12,
        }}
      >
        {/* App Icon */}
        <Image
          source={require("../../assets/logo.png")}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
          }}
          resizeMode="cover"
        />

        {/* App Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            FamilyForge
          </Text>
          <Text
            style={{
              color: "#a0a0a0",
              fontSize: 12,
            }}
          >
            Rewards and Growth for Kids
          </Text>
        </View>

        {/* Store Button */}
        <Pressable
          onPress={() => router.push('/onboarding')}
          style={{
            backgroundColor: isIOS ? "#0066cc" : "#01875f",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Download size={16} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 13 }}>
            {isIOS ? "App Store" : "Play Store"}
          </Text>
        </Pressable>

        {/* Dismiss */}
        <Pressable onPress={onDismiss} style={{ padding: 8 }}>
          <X size={20} color="#666666" />
        </Pressable>
      </View>
    </View>
  );
}

// Glowing Text Component
function GlowText({
  children,
  style,
  glow = true,
}: {
  children: React.ReactNode;
  style?: any;
  glow?: boolean;
}) {
  return (
    <Text
      style={[
        {
          textShadowColor: glow ? "rgba(139, 92, 246, 0.6)" : "transparent",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: glow ? 20 : 0,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// Gradient Button Component
function GradientButton({
  onPress,
  children,
  size = "large",
}: {
  onPress: () => void;
  children: React.ReactNode;
  size?: "small" | "large";
}) {
  const isLarge = size === "large";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
      })}
    >
      <LinearGradient
        colors={["#8b5cf6", "#6366f1", "#4f46e5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: isLarge ? 18 : 14,
          paddingHorizontal: isLarge ? 48 : 32,
          borderRadius: isLarge ? 16 : 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: isLarge ? 18 : 15,
            fontWeight: "700",
            letterSpacing: 0.5,
          }}
        >
          {children}
        </Text>
        <ChevronRight size={isLarge ? 22 : 18} color="#ffffff" />
      </LinearGradient>
    </Pressable>
  );
}

// Feature Card Component
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const Icon = feature.icon;
  const accentColors = [
    { bg: "#10b981", text: "#10b981" }, // green
    { bg: "#8b5cf6", text: "#8b5cf6" }, // purple
    { bg: "#eab308", text: "#eab308" }, // gold
  ];
  const accent = accentColors[index % 3];

  return (
    <View
      style={{
        backgroundColor: "rgba(30, 25, 50, 0.6)",
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(139, 92, 246, 0.2)",
        minWidth: 300,
        maxWidth: 360,
      }}
    >
      {/* Number Badge */}
      <View
        style={{
          position: "absolute",
          top: -12,
          left: 20,
          backgroundColor: accent.bg,
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
          {index + 1}
        </Text>
      </View>

      {/* Icon and Title */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
        <LinearGradient
          colors={feature.colors}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={24} color="#ffffff" />
        </LinearGradient>
        <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "700" }}>
          {feature.title}
        </Text>
      </View>

      {/* Problem → Result → Relief */}
      <View style={{ marginTop: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#f87171",
              marginTop: 6,
            }}
          />
          <Text style={{ color: "#94a3b8", fontSize: 14, flex: 1 }}>
            {feature.problem}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#4ade80",
              marginTop: 6,
            }}
          />
          <Text style={{ color: "#e2e8f0", fontSize: 14, flex: 1 }}>
            {feature.result}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <Check size={16} color={accent.text} style={{ marginTop: 2 }} />
          <Text style={{ color: accent.text, fontSize: 14, fontWeight: "600", flex: 1 }}>
            {feature.relief}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Quote Block Component
function QuoteBlock() {
  return (
    <View
      style={{
        backgroundColor: "rgba(30, 25, 50, 0.4)",
        borderLeftWidth: 4,
        borderLeftColor: "#8b5cf6",
        padding: 24,
        paddingLeft: 28,
        borderRadius: 12,
        marginVertical: 20,
      }}
    >
      <Text
        style={{
          color: "#e2e8f0",
          fontSize: 20,
          fontStyle: "italic",
          lineHeight: 30,
        }}
      >
        "Struggling doesn't mean you're failing. It means you're showing up,
        every single day, for the people who matter most."
      </Text>
      <Text
        style={{
          color: "#8b5cf6",
          fontSize: 14,
          fontWeight: "600",
          marginTop: 16,
        }}
      >
        — To Every Parent Reading This
      </Text>
    </View>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const device = useDeviceDetection();
  const { playSound } = useNotificationSound();
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  // Show download prompt after a brief delay on mobile
  useEffect(() => {
    if (device.isMobile && !promptDismissed) {
      const timer = setTimeout(() => {
        setShowDownloadPrompt(true);
        playSound();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [device.isMobile, promptDismissed]);

  const handleGetStarted = () => {
    router.push("/signup");
  };

  const handleDismissPrompt = () => {
    setShowDownloadPrompt(false);
    setPromptDismissed(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0a1f" }}>
      {/* Mobile Download Prompt */}
      {showDownloadPrompt && (
        <MobileDownloadPrompt
          isIOS={device.isIOS}
          isAndroid={device.isAndroid}
          onDismiss={handleDismissPrompt}
        />
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: showDownloadPrompt ? 80 : 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingTop: isWide ? 100 : 60,
            paddingBottom: 60,
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 40,
            }}
          >
            <Image
              source={require("../../assets/logo.png")}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
              }}
              resizeMode="cover"
            />
            <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>
              FamilyForge
            </Text>
          </View>

          {/* Headline */}
          <GlowText
            style={{
              color: "#ffffff",
              fontSize: isWide ? 56 : 36,
              fontWeight: "800",
              textAlign: "center",
              lineHeight: isWide ? 68 : 44,
              maxWidth: 900,
            }}
          >
            Parenting is{" "}
            <Text style={{ color: "#8b5cf6" }}>overwhelming</Text>.{"\n"}
            You're not alone.
          </GlowText>

          {/* Subheadline */}
          <Text
            style={{
              color: "#94a3b8",
              fontSize: isWide ? 22 : 18,
              textAlign: "center",
              marginTop: 24,
              maxWidth: 700,
              lineHeight: isWide ? 34 : 28,
            }}
          >
            Between the endless tasks, the mental load, the guilt, and the
            exhaustion—parenting is harder than anyone admits.{"\n"}
            <Text style={{ color: "#e2e8f0", fontWeight: "500" }}>
              FamilyForge gives you structure without losing your sanity.
            </Text>
          </Text>

          {/* CTA Button */}
          <View style={{ marginTop: 40 }}>
            <GradientButton onPress={handleGetStarted}>Get Started</GradientButton>
          </View>

          {/* Trust indicators */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 24,
            }}
          >
            <Shield size={16} color="#4ade80" />
            <Text style={{ color: "#94a3b8", fontSize: 13 }}>
              Free to try • No credit card required • Cancel anytime
            </Text>
          </View>
        </View>

        {/* EMPATHY SECTION - MOTHERS */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 60,
            backgroundColor: "rgba(30, 25, 50, 0.3)",
          }}
        >
          <View style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}>
            <Text
              style={{
                color: "#f472b6",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              For Mothers
            </Text>

            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 28,
                fontWeight: "700",
                lineHeight: isWide ? 46 : 38,
                marginBottom: 24,
              }}
            >
              The invisible labor is real.{"\n"}
              The guilt is crushing.
            </GlowText>

            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 17,
                lineHeight: 28,
              }}
            >
              You remember every appointment, every preference, every deadline. You
              carry the family's schedule in your head while everyone else just
              asks, "What's for dinner?"
              {"\n\n"}
              The exhaustion isn't weakness—it's proof of everything you're already
              doing. FamilyForge doesn't ask you to do more. It helps you share the
              load.
            </Text>
          </View>
        </View>

        {/* EMPATHY SECTION - FATHERS */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 60,
          }}
        >
          <View style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}>
            <Text
              style={{
                color: "#60a5fa",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              For Fathers
            </Text>

            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 28,
                fontWeight: "700",
                lineHeight: isWide ? 46 : 38,
                marginBottom: 24,
              }}
            >
              The pressure is relentless.{"\n"}
              The fear of failing is real.
            </GlowText>

            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 17,
                lineHeight: 28,
              }}
            >
              You want to be present, to connect, to be more than just the
              provider. But between work demands and family needs, you're
              constantly pulled in directions that feel impossible to manage.
              {"\n\n"}
              FamilyForge gives you visibility and structure—so you can show up
              intentionally, not just reactively.
            </Text>
          </View>
        </View>

        {/* FEATURES SECTION */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 60,
            backgroundColor: "rgba(30, 25, 50, 0.3)",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <Text
              style={{
                color: "#8b5cf6",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              How It Helps
            </Text>

            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 40 : 30,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Problems Solved,{"\n"}Not Features Dumped
            </GlowText>
          </View>

          {/* Feature Cards Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
            }}
          >
            {FEATURES.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </View>
        </View>

        {/* VALIDATION SECTION */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 60,
          }}
        >
          <View style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}>
            <Text
              style={{
                color: "#4ade80",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              You're Doing Better Than You Think
            </Text>

            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 28,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: isWide ? 46 : 38,
                marginBottom: 24,
              }}
            >
              This isn't about perfection.{"\n"}
              It's about support.
            </GlowText>

            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 17,
                lineHeight: 28,
                textAlign: "center",
              }}
            >
              FamilyForge was built by parents, for parents. We understand that
              some days just surviving is a victory. The app is designed to bring
              calm, not chaos—structure without rigidity, progress without
              pressure.
            </Text>

            <QuoteBlock />
          </View>
        </View>

        {/* FINAL CTA SECTION */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 80,
            alignItems: "center",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
          }}
        >
          <GlowText
            style={{
              color: "#ffffff",
              fontSize: isWide ? 40 : 30,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Ready to breathe easier?
          </GlowText>

          <Text
            style={{
              color: "#94a3b8",
              fontSize: 18,
              textAlign: "center",
              marginBottom: 32,
              maxWidth: 500,
            }}
          >
            Start free today. No pressure, no guilt—just a little help.
          </Text>

          <GradientButton onPress={handleGetStarted}>Get Started</GradientButton>
        </View>

        {/* FOOTER */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 40,
            borderTopWidth: 1,
            borderTopColor: "rgba(139, 92, 246, 0.2)",
            backgroundColor: "rgba(15, 10, 31, 0.95)",
          }}
        >
          {/* App Store Buttons */}
          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <Pressable
              onPress={() => router.push('/onboarding')}
              style={{
                backgroundColor: "#000000",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#333333",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View>
                <Text style={{ color: "#999999", fontSize: 10 }}>
                  Download on the
                </Text>
                <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "600" }}>
                  App Store
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/onboarding')}
              style={{
                backgroundColor: "#000000",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#333333",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View>
                <Text style={{ color: "#999999", fontSize: 10 }}>GET IT ON</Text>
                <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "600" }}>
                  Google Play
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Legal Links */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <Pressable onPress={() => router.push("/privacy-policy" as any)}>
              <Text
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  backgroundColor: "rgba(100, 116, 139, 0.1)",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                }}
              >
                Privacy Policy
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push("/terms" as any)}>
              <Text
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  backgroundColor: "rgba(100, 116, 139, 0.1)",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                }}
              >
                Terms of Service
              </Text>
            </Pressable>
          </View>

          {/* Copyright */}
          <Text
            style={{
              color: "#475569",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} FamilyForge. Built with love for
            families everywhere.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
