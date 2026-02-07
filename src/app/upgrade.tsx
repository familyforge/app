// FamilyForge - Upgrade Plan Page
// Allows users to upgrade from Free to Pro or Forge, or Pro to Forge

import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  ChevronLeft,
  Check,
  Crown,
  Sparkles,
  Star,
  Shield,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  Zap,
} from "lucide-react-native";
import { useProfileStore } from "../lib/state/profile-store";
import { useTestimonialsStore } from "../lib/state/testimonials-store";
import { updateParentPlan } from "../lib/api/subscription";
import {
  getCurrencyType,
  formatPrice,
  formatDailyPrice,
  PLAN_PRICES,
  type PlanType,
  type CurrencyType,
} from "../lib/utils/currency";
import { getAppPricingConfig } from "../lib/api/app-settings";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Auto-sliding testimonials carousel
function TestimonialsCarousel() {
  const allTestimonials = useTestimonialsStore((s) => s.testimonials);
  const testimonials = allTestimonials.filter((t) => t.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const CARD_WIDTH = 280;
  const CARD_GAP = 12;

  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % testimonials.length;
        translateX.value = withTiming(-next * (CARD_WIDTH + CARD_GAP), {
          duration: 600,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (testimonials.length === 0) return null;

  return (
    <View style={{ marginTop: 20 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Trusted by thousands of families
      </Text>

      <View style={{ overflow: "hidden", marginHorizontal: -20 }}>
        <Animated.View
          style={[
            { flexDirection: "row", paddingHorizontal: 20, gap: CARD_GAP },
            animatedStyle,
          ]}
        >
          {testimonials.map((testimonial) => (
            <View
              key={testimonial.id}
              style={{
                width: CARD_WIDTH,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <Animated.Image
                    source={{ uri: testimonial.imageUrl }}
                    style={{ width: 44, height: 44 }}
                  />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
                  {testimonial.name}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 20,
                  fontStyle: "italic",
                }}
              >
                "{testimonial.text}"
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Dots indicator */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
          marginTop: 14,
        }}
      >
        {testimonials.map((_, idx) => (
          <View
            key={idx}
            style={{
              width: idx === currentIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                idx === currentIndex ? "#fff" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function UpgradeScreen() {
  const profile = useProfileStore((s) => s.profile);
  const currentPlan = useProfileStore((s) => s.profile.plan) || "free";
  const updateProfile = useProfileStore((s) => s.updateProfile);

  // Determine currency based on user's country
  const currencyType: CurrencyType = getCurrencyType(profile.country);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    currentPlan === "forge" ? "forge" : currentPlan === "pro" ? "forge" : "pro"
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: pricingConfig } = useQuery({
    queryKey: ["app-settings", "pricing-config"],
    queryFn: getAppPricingConfig,
    staleTime: 1000 * 60 * 5,
  });

  const planPrices = pricingConfig?.planPrices ?? PLAN_PRICES;
  const mostPopularPlanId = pricingConfig?.mostPopularPlanId ?? "forge";
  const trialOffer = pricingConfig?.trialOffer;

  const canUpgradeTo = (plan: PlanType): boolean => {
    if (currentPlan === "forge") return false; // Already on highest
    if (currentPlan === "pro" && plan === "free") return false; // Can't downgrade
    if (currentPlan === "pro" && plan === "pro") return false; // Already on Pro
    if (currentPlan === "free" && plan === "free") return false; // Already on Free
    return true;
  };

  const handleUpgrade = async () => {
    if (!canUpgradeTo(selectedPlan)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update the profile with the new plan
    updateProfile({ plan: selectedPlan });
    await updateParentPlan(selectedPlan);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(false);

    // Navigate back with success
    router.back();
  };

  const getPrice = (plan: PlanType, cycle: "monthly" | "yearly") => {
    const basePrice = planPrices[plan][cycle];
    return formatPrice(basePrice, currencyType);
  };

  const getDailyPriceFormatted = (plan: PlanType, cycle: "monthly" | "yearly") => {
    const basePrice = planPrices[plan][cycle];
    return formatDailyPrice(basePrice, currencyType);
  };

  const isCurrentPlan = (plan: PlanType) => plan === currentPlan;

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <LinearGradient
        colors={["#1E1B4B", "#0f172a"]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: "700",
                color: "#fff",
                textAlign: "center",
                marginRight: 40,
              }}
            >
              Upgrade Plan
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeIn.duration(500)}
              style={{ paddingHorizontal: 20 }}
            >
              {/* Current Plan Badge */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: "#10B981" }}
                  >
                    Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "700",
                    color: "#fff",
                    textAlign: "center",
                  }}
                >
                  {currentPlan === "forge"
                    ? "You're on the Best Plan!"
                    : "Unlock More Features"}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.6)",
                    marginTop: 8,
                  }}
                >
                  {currentPlan === "forge"
                    ? "Enjoy all premium features"
                    : "Invest in your family's growth"}
                </Text>
              </View>

              {/* Billing Toggle */}
              {currentPlan !== "forge" && (
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 16,
                    padding: 4,
                    marginBottom: 16,
                  }}
                >
                  <Pressable
                    onPress={() => setBillingCycle("monthly")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor:
                        billingCycle === "monthly" ? "#fff" : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: billingCycle === "monthly" ? "#1E1B4B" : "#fff",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Monthly
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setBillingCycle("yearly")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor:
                        billingCycle === "yearly" ? "#fff" : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: billingCycle === "yearly" ? "#1E1B4B" : "#fff",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Yearly
                    </Text>
                    {billingCycle !== "yearly" && (
                      <Text
                        style={{
                          color: "#10B981",
                          fontSize: 11,
                          fontWeight: "600",
                          marginTop: 2,
                        }}
                      >
                        Save 20%
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              <View style={{ gap: 10 }}>
                {/* Forge Plan - Most Popular */}
                {currentPlan !== "forge" && (
                  <Pressable
                    onPress={() => setSelectedPlan("forge")}
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 2,
                      borderColor:
                        selectedPlan === "forge"
                          ? "#F59E0B"
                          : "rgba(245, 158, 11, 0.4)",
                      position: "relative",
                    }}
                  >
                    {mostPopularPlanId === "forge" && (
                      <View
                        style={{
                          position: "absolute",
                          top: -12,
                          left: 16,
                          right: 16,
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "#F59E0B",
                            paddingHorizontal: 14,
                            paddingVertical: 5,
                            borderRadius: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Crown size={14} color="#000" />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "800",
                              color: "#000",
                              letterSpacing: 0.5,
                            }}
                          >
                            MOST POPULAR
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={{ marginTop: 6 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}
                          >
                            Forge Plan
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}
                          >
                            {getPrice("forge", billingCycle).formatted}/mo
                          </Text>
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: "800",
                              color: "#10B981",
                            }}
                          >
                            {getDailyPriceFormatted("forge", billingCycle)}/day
                          </Text>
                          {trialOffer?.enabled && (
                            <Text
                              style={{
                                marginTop: 4,
                                fontSize: 11,
                                color: "rgba(255,255,255,0.65)",
                              }}
                            >
                              {trialOffer.label}: {formatPrice(trialOffer.firstMonthPrice, currencyType).formatted} for {trialOffer.durationDays} days, then {getPrice("forge", billingCycle).formatted}/mo
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Includes All Pro Features Banner */}
                      <View
                        style={{
                          marginTop: 12,
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: "rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <View
                            style={{
                              backgroundColor: "#10B981",
                              borderRadius: 6,
                              padding: 4,
                            }}
                          >
                            <Check size={12} color="#fff" strokeWidth={3} />
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#10B981" }}>
                            INCLUDES ALL PRO FEATURES
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 28 }}>
                          Unlimited tasks & rewards • Progress tracking • Points & leaderboards
                        </Text>
                      </View>

                      {/* Plus these Forge-exclusive features */}
                      <View style={{ marginTop: 12 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#F59E0B",
                            marginBottom: 8,
                            letterSpacing: 0.5,
                          }}
                        >
                          + FORGE EXCLUSIVE FEATURES
                        </Text>
                        <View style={{ gap: 5 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Check size={15} color="#F59E0B" />
                            <Text
                              style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                            >
                              Unlimited children
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Check size={15} color="#F59E0B" />
                            <Text
                              style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                            >
                              Learning assignments
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Check size={15} color="#F59E0B" />
                            <Text
                              style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                            >
                              Family calendar
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Check size={15} color="#F59E0B" />
                            <Text
                              style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                            >
                              Co-parent access
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )}

                {/* Pro Plan */}
                {currentPlan === "free" && (
                  <Pressable
                    onPress={() => setSelectedPlan("pro")}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 2,
                      borderColor:
                        selectedPlan === "pro" ? "#10B981" : "transparent",
                    }}
                  >
                    {mostPopularPlanId === "pro" && (
                      <View
                        style={{
                          position: "absolute",
                          top: -10,
                          left: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 10,
                          backgroundColor: "#10B981",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Star size={12} color="#062a1d" />
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#062a1d" }}>
                          MOST POPULAR
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}
                        >
                          Pro Plan
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 2,
                          }}
                        >
                          Up to 4 children
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}
                        >
                          {getPrice("pro", billingCycle).formatted}/mo
                        </Text>
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "800",
                            color: "#10B981",
                          }}
                        >
                          {getDailyPriceFormatted("pro", billingCycle)}/day
                        </Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 8, gap: 4 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Check size={14} color="#10B981" />
                        <Text
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
                        >
                          Unlimited tasks & rewards
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Check size={14} color="#10B981" />
                        <Text
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
                        >
                          Progress tracking & streaks
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Check size={14} color="#10B981" />
                        <Text
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
                        >
                          Points & leaderboards
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Check size={14} color="#10B981" />
                        <Text
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
                        >
                          Routine builder
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Check size={14} color="#10B981" />
                        <Text
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
                        >
                          Weekly reports
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                {/* Current Plan Display (if Pro or Forge) */}
                {currentPlan !== "free" && (
                  <View
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 2,
                      borderColor: "rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Check size={18} color="#10B981" />
                      <Text
                        style={{ fontSize: 16, fontWeight: "600", color: "#10B981" }}
                      >
                        You're on the {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Why Upgrade Section */}
              {currentPlan !== "forge" && (
                <Animated.View
                  entering={FadeInDown.delay(200).duration(400)}
                  style={{ marginTop: 24 }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#fff",
                      marginBottom: 12,
                    }}
                  >
                    Why upgrade?
                  </Text>
                  <View style={{ gap: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "rgba(59, 130, 246, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BarChart3 size={20} color="#3B82F6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                        >
                          Detailed Progress Reports
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 2,
                          }}
                        >
                          Track improvement over weeks and months
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "rgba(168, 85, 247, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Sparkles size={20} color="#A855F7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                        >
                          Gamified Motivation
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 2,
                          }}
                        >
                          Points, streaks, and leaderboards
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Shield size={20} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                        >
                          Peace of Mind
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 2,
                          }}
                        >
                          Location tracking & safety features
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Testimonials */}
              <TestimonialsCarousel />
            </Animated.View>
          </ScrollView>

          {/* Bottom CTA */}
          {currentPlan !== "forge" && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 20,
                paddingTop: 12,
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Pressable
                onPress={handleUpgrade}
                disabled={isProcessing || !canUpgradeTo(selectedPlan)}
                style={{
                  backgroundColor: isProcessing ? "rgba(245, 158, 11, 0.5)" : "#F59E0B",
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isProcessing ? (
                  <Text
                    style={{ fontSize: 18, fontWeight: "700", color: "#000" }}
                  >
                    Processing...
                  </Text>
                ) : (
                  <>
                    <Zap size={20} color="#000" />
                    <Text
                      style={{ fontSize: 18, fontWeight: "700", color: "#000" }}
                    >
                      Upgrade to{" "}
                      {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                    </Text>
                  </>
                )}
              </Pressable>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                Cancel anytime • 7-day money-back guarantee
              </Text>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
