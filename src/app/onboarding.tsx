// FamilyForge App - Emotional Onboarding Flow
// 24-step emotional-first onboarding with varied screen designs

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  SlideInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import {
  Heart,
  Shield,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  Mail,
  Lock,
  Crown,
  Star,
  Sparkles,
  Calendar,
  User,
  Camera,
  Image as ImageIcon,
  MessageCircle,
  Brain,
  Clock,
  Sun,
  Moon,
  Coffee,
  Frown,
  Meh,
  Smile,
  Target,
  Compass,
  Flame,
  Leaf,
  Zap,
  Plus,
  Minus,
  ChevronDown,
  Edit3,
  AlertCircle,
  Gift,
  Lightbulb,
  HandHeart,
  TreeDeciduous,
  Eye,
  EyeOff,
} from "lucide-react-native";
import {
  useOnboardingStore,
  ParentType,
  YouAreNotAloneResponse,
  ParentIdentityWord,
  DailyPainPoint,
  EmotionalTrigger,
  GuiltReflection,
  ChildWorry,
  ParentStrength,
  ParentFear,
  HopeChange,
  Commitment,
  AcademicClass,
  ChildGender,
  LearningStruggle,
  SubscriptionPlan,
  getParentTheme,
  getParentToneMessages,
  ACADEMIC_CLASS_LABELS,
  LEARNING_STRUGGLE_LABELS,
} from "../lib/state/onboarding-store";
import { useProfileStore, Gender } from "../lib/state/profile-store";
import { useAppStore } from "../lib/state/app-store";
import { useTestimonialsStore } from "../lib/state/testimonials-store";
import { useQuery } from "@tanstack/react-query";
import {
  getCurrencyType,
  formatPrice,
  formatDailyPrice,
  PLAN_PRICES,
  type CurrencyType,
} from "../lib/utils/currency";
import { getAppPricingConfig } from "../lib/api/app-settings";
import { signUp, syncChildToCloud, syncParentToCloud, getCurrentUser, type ChildData, type ParentData } from "../lib/api";
import { sendWelcomeEmail, sendEmailVerificationCode } from "../lib/api/email";
import { theme } from "../lib/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Loading messages - reassuring statements
const LOADING_MESSAGES = [
  "Personalizing your dashboard...",
  "Setting up your child's learning plan...",
  "Creating your family's growth roadmap...",
  "Building custom routines for your family...",
  "Preparing rewards that motivate...",
  "Configuring progress tracking...",
  "Adding the finishing touches...",
  "You're going to love this...",
  "Almost ready to transform your parenting...",
  "Your family hub is coming together...",
];

// Color options for children
const CHILD_COLORS = [
  "#8B5CF6", "#EC4899", "#06B6D4", "#10B981",
  "#F59E0B", "#EF4444", "#6366F1", "#14B8A6",
];

const createUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Academic classes
const ACADEMIC_CLASSES: AcademicClass[] = [
  "year_1", "year_2", "year_3", "year_4", "year_5", "year_6",
  "year_7", "year_8", "year_9", "year_10", "year_11", "year_12", "year_13",
];

// Learning struggles
const LEARNING_STRUGGLES: LearningStruggle[] = [
  "mathematics", "english", "science", "reading", "writing",
  "focus", "time_management", "spelling", "history", "geography",
];

// Auto-sliding testimonials carousel component
function TestimonialsCarousel() {
  const allTestimonials = useTestimonialsStore((s) => s.testimonials);
  const testimonials = allTestimonials.filter((t) => t.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const CARD_WIDTH = 280;
  const CARD_GAP = 12;
  
  // Auto-slide effect
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
      <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 12 }}>
        Trusted by thousands of families
      </Text>
      
      <View style={{ overflow: "hidden", marginHorizontal: -20 }}>
        <Animated.View 
          style={[
            { flexDirection: "row", paddingHorizontal: 20, gap: CARD_GAP },
            animatedStyle
          ]}
        >
          {testimonials.map((testimonial, idx) => (
            <View 
              key={testimonial.id} 
              style={{ 
                width: CARD_WIDTH, 
                backgroundColor: "rgba(255,255,255,0.06)", 
                borderRadius: 16, 
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)"
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Animated.Image 
                    source={{ uri: testimonial.imageUrl }} 
                    style={{ width: 44, height: 44 }} 
                  />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{testimonial.name}</Text>
              </View>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 20, fontStyle: "italic" }}>
                "{testimonial.text}"
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>
      
      {/* Dots indicator */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14 }}>
        {testimonials.map((_, idx) => (
          <View
            key={idx}
            style={{
              width: idx === currentIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: idx === currentIndex ? "#fff" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  // Store selectors
  const step = useOnboardingStore((s) => s.step);
  const totalSteps = useOnboardingStore((s) => s.totalSteps);
  const parentType = useOnboardingStore((s) => s.parentType);
  const youAreNotAloneResponse = useOnboardingStore((s) => s.youAreNotAloneResponse);
  const parentIdentityWord = useOnboardingStore((s) => s.parentIdentityWord);
  const parentIdentityCustomWord = useOnboardingStore((s) => s.parentIdentityCustomWord);
  const dailyPainPoints = useOnboardingStore((s) => s.dailyPainPoints);
  const emotionalTrigger = useOnboardingStore((s) => s.emotionalTrigger);
  const guiltReflection = useOnboardingStore((s) => s.guiltReflection);
  const fixOneThing = useOnboardingStore((s) => s.fixOneThing);
  const childWorry = useOnboardingStore((s) => s.childWorry);
  const parentFirstName = useOnboardingStore((s) => s.parentFirstName);
  const parentLastName = useOnboardingStore((s) => s.parentLastName);
  const howToRemember = useOnboardingStore((s) => s.howToRemember);
  const parentFear = useOnboardingStore((s) => s.parentFear);
  const hopeChange = useOnboardingStore((s) => s.hopeChange);
  const commitment = useOnboardingStore((s) => s.commitment);
  const parentStrength = useOnboardingStore((s) => s.parentStrength);
  const childrenCount = useOnboardingStore((s) => s.childrenCount);
  const childDrafts = useOnboardingStore((s) => s.childDrafts);
  const parentEmail = useOnboardingStore((s) => s.parentEmail);
  const parentPin = useOnboardingStore((s) => s.parentPin);
  const selectedPlan = useOnboardingStore((s) => s.selectedPlan);
  const billingCycle = useOnboardingStore((s) => s.billingCycle);
  const avatarUrl = useOnboardingStore((s) => s.avatarUrl);
  const emailVerificationCode = useOnboardingStore((s) => s.emailVerificationCode);
  const emailVerificationSentAt = useOnboardingStore((s) => s.emailVerificationSentAt);
  const emailVerified = useOnboardingStore((s) => s.emailVerified);

  // Store actions
  const setStep = useOnboardingStore((s) => s.setStep);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const setParentType = useOnboardingStore((s) => s.setParentType);
  const setYouAreNotAloneResponse = useOnboardingStore((s) => s.setYouAreNotAloneResponse);
  const setParentIdentityWord = useOnboardingStore((s) => s.setParentIdentityWord);
  const setParentIdentityCustomWord = useOnboardingStore((s) => s.setParentIdentityCustomWord);
  const toggleDailyPainPoint = useOnboardingStore((s) => s.toggleDailyPainPoint);
  const setEmotionalTrigger = useOnboardingStore((s) => s.setEmotionalTrigger);
  const setGuiltReflection = useOnboardingStore((s) => s.setGuiltReflection);
  const setFixOneThing = useOnboardingStore((s) => s.setFixOneThing);
  const setChildWorry = useOnboardingStore((s) => s.setChildWorry);
  const setParentFirstName = useOnboardingStore((s) => s.setParentFirstName);
  const setParentLastName = useOnboardingStore((s) => s.setParentLastName);
  const setHowToRemember = useOnboardingStore((s) => s.setHowToRemember);
  const setParentFear = useOnboardingStore((s) => s.setParentFear);
  const setHopeChange = useOnboardingStore((s) => s.setHopeChange);
  const setCommitment = useOnboardingStore((s) => s.setCommitment);
  const setParentStrength = useOnboardingStore((s) => s.setParentStrength);
  const setChildrenCount = useOnboardingStore((s) => s.setChildrenCount);
  const updateChildDraft = useOnboardingStore((s) => s.updateChildDraft);
  const addLearningStruggle = useOnboardingStore((s) => s.addLearningStruggle);
  const removeLearningStruggle = useOnboardingStore((s) => s.removeLearningStruggle);
  const setParentEmail = useOnboardingStore((s) => s.setParentEmail);
  const setParentPin = useOnboardingStore((s) => s.setParentPin);
  const setSelectedPlan = useOnboardingStore((s) => s.setSelectedPlan);
  const setBillingCycle = useOnboardingStore((s) => s.setBillingCycle);
  const setAvatarUrl = useOnboardingStore((s) => s.setAvatarUrl);
  const setAvatarSetupComplete = useOnboardingStore((s) => s.setAvatarSetupComplete);
  const accountCreated = useOnboardingStore((s) => s.accountCreated);
  const setAccountCreated = useOnboardingStore((s) => s.setAccountCreated);
  const setPaymentComplete = useOnboardingStore((s) => s.setPaymentComplete);
  const markComplete = useOnboardingStore((s) => s.markComplete);
  const setEmailVerificationCode = useOnboardingStore((s) => s.setEmailVerificationCode);
  const setEmailVerificationSentAt = useOnboardingStore((s) => s.setEmailVerificationSentAt);
  const setEmailVerified = useOnboardingStore((s) => s.setEmailVerified);

  // Profile and App stores
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const profileCountry = useProfileStore((s) => s.profile.country);
  const addChild = useAppStore((s) => s.addChild);

  // Get currency type based on profile country
  const currencyType: CurrencyType = useMemo(() => getCurrencyType(profileCountry), [profileCountry]);

  const { data: pricingConfig } = useQuery({
    queryKey: ["app-settings", "pricing-config"],
    queryFn: getAppPricingConfig,
    staleTime: 1000 * 60 * 5,
  });

  const planPrices = pricingConfig?.planPrices ?? PLAN_PRICES;
  const mostPopularPlanId = pricingConfig?.mostPopularPlanId ?? "forge";
  const trialOffer = pricingConfig?.trialOffer;

  // Local state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [expandedChild, setExpandedChild] = useState<number | null>(0);

  const pinInputRef = useRef<TextInput>(null);
  const confirmPinInputRef = useRef<TextInput>(null);

  // Get theme based on parent type
  const parentTheme = useMemo(() => getParentTheme(parentType), [parentType]);
  const toneMessages = useMemo(() => getParentToneMessages(parentType), [parentType]);

  // Progress (only show after step 0)
  const progress = useMemo(() => {
    if (step === 0) return 0;
    return Math.min((step) / (totalSteps - 1), 1);
  }, [step, totalSteps]);

  // Loading screen timer - 15 seconds with rotating messages

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);
  useEffect(() => {
    if (step !== 17) return;
    setLoadingMessageIndex(0);
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    const timer = setTimeout(() => {
      clearInterval(interval);
      nextStep();
    }, 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [step, nextStep]);

  // Check if can proceed
  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return parentType !== null;
      case 1: return youAreNotAloneResponse !== null;
      case 2: return parentIdentityWord !== null;
      case 3: return dailyPainPoints.length > 0;
      case 4: return emotionalTrigger !== null;
      case 5: return guiltReflection !== null;
      case 6: return fixOneThing.trim().length >= 8;
      case 7: return childWorry !== null;
      case 8: return parentFirstName.trim().length > 0;
      case 9: return howToRemember.trim().length > 10;
      case 10: return parentFear !== null;
      case 11: return hopeChange !== null;
      case 12: return commitment !== null;
      case 13: return parentStrength !== null;
      case 14: return childrenCount > 0;
      case 15: return childDrafts.every((c) => c.firstName.trim().length > 0 && c.academicClass !== null);
      case 16: return true;
      case 17: return false; // Auto-advances
      case 18: return true;
      case 19: return parentEmail.trim().includes("@");
      case 20:
        return pin.length === 6;
      case 21: return verificationInput.length === 4 && !isVerifying;
      case 22: return selectedPlan !== null;
      case 23: return avatarUrl.length > 0;
      case 24: return true;
      default: return true;
    }
  }, [step, parentType, youAreNotAloneResponse, parentIdentityWord, dailyPainPoints, emotionalTrigger, guiltReflection, fixOneThing, childWorry, parentFirstName, howToRemember, parentFear, hopeChange, commitment, parentStrength, childrenCount, childDrafts, parentEmail, pin, confirmPin, verificationInput, isVerifying, selectedPlan, avatarUrl]);

  // Handle parent type selection (auto-advances)
  const handleParentTypeSelect = (type: ParentType) => {
    setParentType(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => nextStep(), 400);
  };

  // Handle PIN input - simple string-based approach
  const handlePinChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "").slice(0, 6);
    setPin(sanitized);
    setPinError(null);
  };

  const handleConfirmPinChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "").slice(0, 6);
    setConfirmPin(sanitized);
    setPinError(null);
  };

  const createVerificationCode = () => String(Math.floor(1000 + Math.random() * 9000));

  const sendVerificationCode = async (): Promise<boolean> => {
    const fullName = `${parentFirstName} ${parentLastName}`.trim() || parentEmail.split("@")[0];
    const code = createVerificationCode();
    setEmailVerificationCode(code);
    setEmailVerificationSentAt(new Date().toISOString());
    setVerificationError(null);

    const result = await sendEmailVerificationCode(
      { email: parentEmail, name: fullName },
      { parentName: fullName, code }
    );

    if (!result.success) {
      setVerificationError(result.error || "Failed to send verification code");
      return false;
    }
    setResendCountdown(30);
    return true;
  };

  // State for account creation
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Handle continue
  const handleContinue = async () => {
    if (!canProceed && step !== 24) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // PIN validation
    if (step === 20) {
      setParentPin(pin);
    }

    // Create Supabase account at step 20 (after email and PIN are set)
    if (step === 20 && !accountCreated) {
      setIsCreatingAccount(true);
      setAccountError(null);
      
      try {
        const fullName = `${parentFirstName} ${parentLastName}`.trim() || parentEmail.split('@')[0];
        
        console.log('[Onboarding] Creating account for:', parentEmail);
        
        // Create the account in Supabase
        const result = await signUp({
          email: parentEmail,
          password: pin, // Using PIN as password for simplicity
          name: fullName,
        });
        
        console.log('[Onboarding] SignUp result:', { success: result.success, error: result.error });
        
        if (!result.success) {
          setAccountError(result.error || 'Failed to create account');
          setIsCreatingAccount(false);
          return; // Don't proceed if account creation failed
        }
        
        // Account created successfully
        setAccountCreated(true);
        
        // Send verification code email FIRST (block on this)
        const verificationSent = await sendVerificationCode();
        if (!verificationSent) {
          setAccountError("We couldn't send your verification code. Please try again.");
          setIsCreatingAccount(false);
          return;
        }
        setEmailVerified(false);
        setVerificationInput("");
        
        // Send welcome email 2 minutes later (don't block on this)
        setTimeout(() => {
          sendWelcomeEmail(
            { email: parentEmail, name: fullName },
            fullName
          ).then((emailResult) => {
            if (!emailResult.success) {
              console.warn('Welcome email failed:', emailResult.error);
            } else {
              console.log('Welcome email sent successfully!');
            }
          }).catch((err) => {
            console.warn('Welcome email error:', err);
          });
        }, 120000); // 2 minutes = 120,000 milliseconds
        
      } catch (error) {
        setAccountError(error instanceof Error ? error.message : 'An unexpected error occurred');
        setIsCreatingAccount(false);
        return;
      }
      
      setIsCreatingAccount(false);
    }

    if (step === 21) {
      setIsVerifying(true);
      setVerificationError(null);

      const sentAt = emailVerificationSentAt ? new Date(emailVerificationSentAt).getTime() : 0;
      const isExpired = Date.now() - sentAt > 10 * 60 * 1000;

      if (isExpired) {
        setVerificationError("That code expired. Tap resend to get a new one.");
        setIsVerifying(false);
        return;
      }

      if (verificationInput !== emailVerificationCode) {
        setVerificationError("That code doesn't match. Please try again.");
        setIsVerifying(false);
        return;
      }

      setEmailVerified(true);
      setIsVerifying(false);
      
      // Small delay to ensure state updates before navigating to next step
      setTimeout(() => {
        nextStep();
      }, 100);
      return;
    }

    if (step === 22) {
      setPaymentComplete(true);
    }

    if (step === 23) {
      setAvatarSetupComplete(true);
    }

    // Final step - Save data locally AND sync to cloud
    if (step === 24) {
      const fullName = `${parentFirstName} ${parentLastName}`.trim();
      const mapRole = (pt: ParentType | null) => pt === "father" || pt === "mother" ? "other" : "other";
      
      // Update local profile store
      updateProfile({
        name: fullName || undefined,
        email: parentEmail || undefined,
        avatarUrl: avatarUrl || undefined,
        gender: parentType === "father" ? "male" as Gender : parentType === "mother" ? "female" as Gender : undefined,
        role: mapRole(parentType) as "other",
        plan: selectedPlan === "forge" ? "forge" : selectedPlan === "pro" ? "pro" : "free",
      });

      // Get the current user ID for syncing
      const currentUser = await getCurrentUser();
      const parentId = currentUser?.id || `local-${Date.now()}`;

      // Sync parent profile to cloud (background)
      const parentData: ParentData = {
        id: parentId,
        email: parentEmail,
        name: fullName,
        subscription_tier: selectedPlan === "forge" || selectedPlan === "pro" ? "premium" : "free",
        plan_code: selectedPlan || "free",
        avatar_url: avatarUrl || undefined,
        onboarding_data: {
          parentType,
          dailyPainPoints,
          emotionalTrigger,
          parentStrength,
          hopeChange,
          commitment,
          howToRemember,
        },
      };
      syncParentToCloud(parentData).catch((err) => {
        console.warn("Parent sync failed (will retry):", err);
      });

      // Add children locally AND sync to cloud
      childDrafts.forEach((child) => {
        if (child.firstName.trim()) {
          const dob = new Date(child.dateOfBirth || Date.now());
          const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          
          // Generate a unique ID for this child
          const childLocalId = createUuid();
          
          // Add to local store
          addChild({
            id: childLocalId,
            name: child.firstName.trim(),
            age: Math.max(1, age),
            className: child.academicClass ? ACADEMIC_CLASS_LABELS[child.academicClass] : undefined,
          });

          // Sync to cloud (background)
          const childData: ChildData = {
            id: childLocalId,
            parent_id: parentId,
            name: child.firstName.trim(),
            age: Math.max(1, age),
            points: 0,
            class: child.academicClass ? ACADEMIC_CLASS_LABELS[child.academicClass] : null,
            birthday: child.dateOfBirth || null,
            interests: null,
            learning_style: null,
            special_needs: null,
          };
          syncChildToCloud(childData).catch((err) => {
            console.warn("Child sync failed (will retry):", err);
          });
        }
      });

      markComplete();
      router.replace("/(tabs)/home");
      return;
    }

    nextStep();
  };

  // Image picker
  const handlePickAvatar = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });

    if (!result.canceled && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  // Render step content with varied designs
  const renderStepContent = () => {
    // STEP 0: Parent Identity - Full screen dramatic selection
    if (step === 0) {
      return (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          <Animated.View entering={FadeInUp.duration(600)} style={{ alignItems: "center", marginBottom: 48 }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center", letterSpacing: -0.5 }}>
              Who are you?
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 12 }}>
              This shapes everything about your experience
            </Text>
          </Animated.View>

          <View style={{ gap: 20 }}>
            <Animated.View entering={FadeInLeft.delay(200).duration(500)}>
              <Pressable
                onPress={() => handleParentTypeSelect("father")}
                style={{
                  backgroundColor: "rgba(96, 165, 250, 0.15)",
                  borderRadius: 24,
                  padding: 28,
                  borderWidth: 2,
                  borderColor: parentType === "father" ? "#60A5FA" : "rgba(96, 165, 250, 0.3)",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ width: 64, height: 64, backgroundColor: "rgba(96, 165, 250, 0.2)", borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                  <Shield size={32} color="#60A5FA" />
                </View>
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>I am a Father</Text>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Building a legacy, one day at a time</Text>
                </View>
                <ChevronRight size={24} color="rgba(255,255,255,0.3)" />
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInRight.delay(300).duration(500)}>
              <Pressable
                onPress={() => handleParentTypeSelect("mother")}
                style={{
                  backgroundColor: "rgba(232, 121, 249, 0.15)",
                  borderRadius: 24,
                  padding: 28,
                  borderWidth: 2,
                  borderColor: parentType === "mother" ? "#E879F9" : "rgba(232, 121, 249, 0.3)",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ width: 64, height: 64, backgroundColor: "rgba(232, 121, 249, 0.2)", borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                  <Heart size={32} color="#E879F9" />
                </View>
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>I am a Mother</Text>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>The heart that holds everything together</Text>
                </View>
                <ChevronRight size={24} color="rgba(255,255,255,0.3)" />
              </Pressable>
            </Animated.View>
          </View>

          <Animated.View entering={FadeIn.delay(500).duration(400)} style={{ marginTop: 48 }}>
            <Pressable onPress={() => router.push("/login")} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                Already have an account? <Text style={{ color: parentTheme.primary, fontWeight: "600" }}>Sign in</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      );
    }

    // STEP 1: You Are Not Alone - Emotional, centered cards
    if (step === 1) {
      const options: { key: YouAreNotAloneResponse; label: string; icon: React.ReactNode }[] = [
        { key: "doing_best_tired", label: "I am doing my best, but I feel tired", icon: <Coffee size={20} color={parentTheme.primary} /> },
        { key: "love_overwhelmed", label: "I love my children, but sometimes I feel overwhelmed", icon: <Heart size={20} color={parentTheme.primary} /> },
        { key: "worry_not_enough", label: "I worry I am not doing enough", icon: <AlertCircle size={20} color={parentTheme.primary} /> },
        { key: "feel_judged", label: "I feel judged by others as a parent", icon: <Users size={20} color={parentTheme.primary} /> },
        { key: "feel_proud", label: "I feel proud of myself as a parent", icon: <Star size={20} color={parentTheme.primary} /> },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Animated.View entering={ZoomIn.delay(100).duration(400)} style={{ width: 72, height: 72, backgroundColor: `${parentTheme.primary}20`, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <HandHeart size={36} color={parentTheme.primary} />
            </Animated.View>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>YOU ARE NOT ALONE</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff", textAlign: "center", lineHeight: 32 }}>
              Parenting is beautiful, but let's be honest...
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 8 }}>
              it can also be exhausting.
            </Text>
          </View>

          <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
            Which feels most true for you right now?
          </Text>

          <View style={{ gap: 12 }}>
            {options.map((option, index) => (
              <Animated.View key={option.key} entering={FadeInUp.delay(100 + index * 80).duration(400)}>
                <Pressable
                  onPress={() => setYouAreNotAloneResponse(option.key)}
                  style={{
                    backgroundColor: youAreNotAloneResponse === option.key ? `${parentTheme.primary}25` : "rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    padding: 18,
                    borderWidth: 2,
                    borderColor: youAreNotAloneResponse === option.key ? parentTheme.primary : "rgba(255,255,255,0.1)",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ marginRight: 14 }}>{option.icon}</View>
                  <Text style={{ flex: 1, fontSize: 15, color: "#fff", lineHeight: 22 }}>{option.label}</Text>
                  {youAreNotAloneResponse === option.key && <Check size={20} color={parentTheme.primary} />}
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 2: Identity as a Parent - Word cloud style
    if (step === 2) {
      const words: { key: ParentIdentityWord; label: string }[] = [
        { key: "committed", label: "Committed" },
        { key: "trying", label: "Trying" },
        { key: "learning", label: "Learning" },
        { key: "stressed", label: "Stressed" },
        { key: "patient", label: "Patient" },
        { key: "firm", label: "Firm" },
        { key: "lost_sometimes", label: "Lost sometimes" },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>HOW YOU SEE YOURSELF</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              When you think about yourself as a parent, what word comes to mind?
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
            {words.map((word, index) => (
              <Animated.View key={word.key} entering={ZoomIn.delay(index * 60).duration(300)}>
                <Pressable
                  onPress={() => setParentIdentityWord(word.key)}
                  style={{
                    backgroundColor: parentIdentityWord === word.key ? parentTheme.primary : "rgba(255,255,255,0.08)",
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: parentIdentityWord === word.key ? parentTheme.primary : "rgba(255,255,255,0.15)",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "600", color: parentIdentityWord === word.key ? "#000" : "#fff" }}>
                    {word.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Another word I would use is...</Text>
            <TextInput
              style={{ fontSize: 16, color: "#fff", padding: 0 }}
              placeholder="Type here (optional)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={parentIdentityCustomWord}
              onChangeText={setParentIdentityCustomWord}
            />
          </View>
        </Animated.View>
      );
    }

    // STEP 3: Daily Pain Points - Multi-select with icons
    if (step === 3) {
      const painPoints: { key: DailyPainPoint; label: string; icon: React.ReactNode }[] = [
        { key: "mornings", label: "Mornings before school", icon: <Sun size={18} color={parentTheme.primary} /> },
        { key: "homework", label: "Homework time", icon: <Edit3 size={18} color={parentTheme.primary} /> },
        { key: "mealtimes", label: "Mealtimes", icon: <Coffee size={18} color={parentTheme.primary} /> },
        { key: "screen_time", label: "Screen time battles", icon: <Zap size={18} color={parentTheme.primary} /> },
        { key: "bedtime", label: "Bedtime", icon: <Moon size={18} color={parentTheme.primary} /> },
        { key: "not_listening", label: "When they don't listen", icon: <MessageCircle size={18} color={parentTheme.primary} /> },
        { key: "too_tired", label: "When I'm too tired to explain again", icon: <Frown size={18} color={parentTheme.primary} /> },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>THE HARDEST MOMENTS</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              Which moments of the day are hardest?
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>Select all that apply</Text>
          </View>

          <View style={{ gap: 10 }}>
            {painPoints.map((point, index) => {
              const isSelected = dailyPainPoints.includes(point.key);
              return (
                <Animated.View key={point.key} entering={SlideInRight.delay(index * 50).duration(300)}>
                  <Pressable
                    onPress={() => toggleDailyPainPoint(point.key)}
                    style={{
                      backgroundColor: isSelected ? `${parentTheme.primary}20` : "rgba(255,255,255,0.05)",
                      borderRadius: 14,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: isSelected ? parentTheme.primary : "transparent",
                    }}
                  >
                    <View style={{ width: 36, height: 36, backgroundColor: `${parentTheme.primary}15`, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      {point.icon}
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, color: "#fff" }}>{point.label}</Text>
                    <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: isSelected ? parentTheme.primary : "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      );
    }

    // STEP 4: Emotional Trigger - Dark, serious tone
    if (step === 4) {
      const triggers: { key: EmotionalTrigger; label: string }[] = [
        { key: "repeating_not_heard", label: "Repeating myself and not being heard" },
        { key: "feeling_failing", label: "Feeling like I'm failing them" },
        { key: "raising_voice", label: "Raising my voice when I didn't want to" },
        { key: "bad_habits", label: "Seeing bad habits form" },
        { key: "not_enough_time", label: "Not having enough time for each child" },
        { key: "disconnected", label: "Feeling disconnected from them" },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Text style={{ fontSize: 14, color: "#EF4444", fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>WHAT HURTS THE MOST</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
                Be honest.
              </Text>
              <Text style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                Which of these hurts the most?
              </Text>
            </Animated.View>
          </View>

          <View style={{ gap: 12 }}>
            {triggers.map((trigger, index) => (
              <Animated.View key={trigger.key} entering={FadeInUp.delay(300 + index * 80).duration(400)}>
                <Pressable
                  onPress={() => setEmotionalTrigger(trigger.key)}
                  style={{
                    backgroundColor: emotionalTrigger === trigger.key ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.03)",
                    borderRadius: 14,
                    padding: 18,
                    borderWidth: 1.5,
                    borderColor: emotionalTrigger === trigger.key ? "#EF4444" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ fontSize: 16, color: emotionalTrigger === trigger.key ? "#FCA5A5" : "rgba(255,255,255,0.8)", lineHeight: 24 }}>
                    {trigger.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 5: Guilt and Self Reflection - Quote style
    if (step === 5) {
      const reflections: { key: GuiltReflection; label: string }[] = [
        { key: "wish_patient", label: '"I wish I was more patient"' },
        { key: "should_better", label: '"I should be doing better"' },
        { key: "dont_mess_up", label: '"I don\'t want to mess this up"' },
        { key: "parents_different", label: '"My parents did it differently"' },
        { key: "learning_as_i_go", label: '"I\'m learning as I go"' },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>QUIET THOUGHTS</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              Have you ever thought any of these?
            </Text>
          </View>

          <View style={{ gap: 14 }}>
            {reflections.map((reflection, index) => (
              <Animated.View key={reflection.key} entering={FadeInLeft.delay(index * 100).duration(400)}>
                <Pressable
                  onPress={() => setGuiltReflection(reflection.key)}
                  style={{
                    backgroundColor: guiltReflection === reflection.key ? `${parentTheme.primary}15` : "transparent",
                    borderRadius: 16,
                    padding: 20,
                    borderLeftWidth: 4,
                    borderLeftColor: guiltReflection === reflection.key ? parentTheme.primary : "rgba(255,255,255,0.15)",
                  }}
                >
                  <Text style={{ fontSize: 18, color: guiltReflection === reflection.key ? "#fff" : "rgba(255,255,255,0.7)", fontStyle: "italic", lineHeight: 26 }}>
                    {reflection.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 6: Fix One Thing - Text input focused
    if (step === 6) {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <View style={{ width: 56, height: 56, backgroundColor: `${parentTheme.primary}20`, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Lightbulb size={28} color={parentTheme.primary} />
            </View>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>IF YOU COULD FIX ONE THING</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              What would it be in your parenting right now?
            </Text>
          </View>

          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
            <TextInput
              style={{ fontSize: 17, color: "#fff", minHeight: 120, textAlignVertical: "top", lineHeight: 26 }}
              placeholder="For example, I wish I could get them to listen without shouting..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={fixOneThing}
              onChangeText={setFixOneThing}
              multiline
              autoFocus
            />
          </View>

          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 12, textAlign: "center" }}>
            {fixOneThing.length}/200 characters
          </Text>
        </Animated.View>
      );
    }

    // STEP 7: Child Behavior Reflection - Grid layout
    if (step === 7) {
      const worries: { key: ChildWorry; label: string; icon: React.ReactNode }[] = [
        { key: "discipline", label: "Their discipline", icon: <Target size={22} color={parentTheme.primary} /> },
        { key: "confidence", label: "Their confidence", icon: <Star size={22} color={parentTheme.primary} /> },
        { key: "focus", label: "Their focus", icon: <Brain size={22} color={parentTheme.primary} /> },
        { key: "habits", label: "Their habits", icon: <Clock size={22} color={parentTheme.primary} /> },
        { key: "future", label: "Their future", icon: <Compass size={22} color={parentTheme.primary} /> },
        { key: "emotional_health", label: "Their emotional health", icon: <Heart size={22} color={parentTheme.primary} /> },
        { key: "safety", label: "Their safety", icon: <Shield size={22} color={parentTheme.primary} /> },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>YOUR CONCERNS</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              What worries you most about your children?
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {worries.map((worry, index) => (
              <Animated.View key={worry.key} entering={ZoomIn.delay(index * 70).duration(300)} style={{ width: (SCREEN_WIDTH - 52) / 2 }}>
                <Pressable
                  onPress={() => setChildWorry(worry.key)}
                  style={{
                    backgroundColor: childWorry === worry.key ? `${parentTheme.primary}20` : "rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    padding: 20,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: childWorry === worry.key ? parentTheme.primary : "transparent",
                  }}
                >
                  <View style={{ marginBottom: 12 }}>{worry.icon}</View>
                  <Text style={{ fontSize: 14, color: "#fff", textAlign: "center", fontWeight: "500" }}>{worry.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 8: Parent Name - Clean, minimal
    if (step === 8) {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>ABOUT YOU</Text>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff", lineHeight: 36 }}>
              What should we call you?
            </Text>
            <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
              {toneMessages.reassurance}
            </Text>
          </View>

          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10, marginLeft: 4 }}>First name *</Text>
              <TextInput
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 18,
                  fontSize: 18,
                  color: "#fff",
                  borderWidth: 1,
                  borderColor: parentFirstName ? parentTheme.primary : "rgba(255,255,255,0.1)",
                }}
                placeholder="Your first name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={parentFirstName}
                onChangeText={setParentFirstName}
                autoFocus
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10, marginLeft: 4 }}>Last name (optional)</Text>
              <TextInput
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 18,
                  fontSize: 18,
                  color: "#fff",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
                placeholder="Your last name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={parentLastName}
                onChangeText={setParentLastName}
              />
            </View>
          </View>
        </Animated.View>
      );
    }

    // STEP 9: How to Remember You - Emotional text input
    if (step === 9) {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <View style={{ width: 56, height: 56, backgroundColor: `${parentTheme.primary}20`, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <TreeDeciduous size={28} color={parentTheme.primary} />
            </View>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>THE MEMORY YOU WANT TO LEAVE</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              When your child grows up, how do you want them to remember you?
            </Text>
          </View>

          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
            <TextInput
              style={{ fontSize: 17, color: "#fff", minHeight: 100, textAlignVertical: "top", lineHeight: 26 }}
              placeholder="Write freely..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={howToRemember}
              onChangeText={setHowToRemember}
              multiline
              autoFocus
            />
          </View>

          <View style={{ backgroundColor: `${parentTheme.primary}15`, borderRadius: 12, padding: 16, marginTop: 20, flexDirection: "row", alignItems: "center" }}>
            <MessageCircle size={18} color={parentTheme.primary} style={{ marginRight: 12 }} />
            <Text style={{ flex: 1, fontSize: 14, color: "rgba(255,255,255,0.7)", fontStyle: "italic", lineHeight: 20 }}>
              They may not remember everything you said, but they will remember how you made them feel.
            </Text>
          </View>
        </Animated.View>
      );
    }

    // STEP 10: Fear Screen - Dark, impactful
    if (step === 10) {
      const fears: { key: ParentFear; label: string }[] = [
        { key: "drift_away", label: "That they drift away from me" },
        { key: "fail_them", label: "That I fail them" },
        { key: "not_prepare", label: "That I don't prepare them enough" },
        { key: "too_strict", label: "That I'm too strict" },
        { key: "too_soft", label: "That I'm too soft" },
        { key: "repeat_mistakes", label: "That I repeat mistakes from my past" },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: "#F59E0B", fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>YOUR BIGGEST FEAR</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              What is your biggest fear as a parent?
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {fears.map((fear, index) => (
              <Animated.View key={fear.key} entering={FadeInRight.delay(index * 80).duration(400)}>
                <Pressable
                  onPress={() => setParentFear(fear.key)}
                  style={{
                    backgroundColor: parentFear === fear.key ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.03)",
                    borderRadius: 14,
                    padding: 18,
                    borderWidth: 1.5,
                    borderColor: parentFear === fear.key ? "#F59E0B" : "rgba(255,255,255,0.08)",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 16, color: parentFear === fear.key ? "#FCD34D" : "rgba(255,255,255,0.8)", lineHeight: 24 }}>
                    {fear.label}
                  </Text>
                  {parentFear === fear.key && <Check size={20} color="#F59E0B" />}
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 11: Hope Screen - Positive, bright
    if (step === 11) {
      const hopes: { key: HopeChange; label: string; icon: React.ReactNode }[] = [
        { key: "less_stress", label: "Less stress at home", icon: <Leaf size={20} color="#10B981" /> },
        { key: "better_routines", label: "Better routines", icon: <Clock size={20} color="#10B981" /> },
        { key: "more_cooperation", label: "More cooperation", icon: <Users size={20} color="#10B981" /> },
        { key: "stronger_connection", label: "Stronger connection", icon: <Heart size={20} color="#10B981" /> },
        { key: "clearer_structure", label: "Clearer structure", icon: <Target size={20} color="#10B981" /> },
        { key: "more_peace", label: "More peace", icon: <Sparkles size={20} color="#10B981" /> },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <View style={{ width: 56, height: 56, backgroundColor: "rgba(16, 185, 129, 0.2)", borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Sun size={28} color="#10B981" />
            </View>
            <Text style={{ fontSize: 14, color: "#10B981", fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>WHAT YOU HOPE WILL CHANGE</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              If things improved in the next 6 months, what would change first?
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {hopes.map((hope, index) => (
              <Animated.View key={hope.key} entering={FadeInUp.delay(index * 80).duration(400)}>
                <Pressable
                  onPress={() => setHopeChange(hope.key)}
                  style={{
                    backgroundColor: hopeChange === hope.key ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: 1.5,
                    borderColor: hopeChange === hope.key ? "#10B981" : "transparent",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ width: 40, height: 40, backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    {hope.icon}
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, color: "#fff" }}>{hope.label}</Text>
                  {hopeChange === hope.key && <Check size={20} color="#10B981" />}
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 12: Commitment Screen - Heart-centered
    if (step === 12) {
      const commitments: { key: Commitment; label: string }[] = [
        { key: "better_parent", label: "I want to become a better parent" },
        { key: "peace_home", label: "I want peace in my home" },
        { key: "children_thrive", label: "I want my children to thrive" },
        { key: "structure_not_chaos", label: "I want structure, not chaos" },
        { key: "love_clarity", label: "I want to lead with love and clarity" },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 36 }}>
            <Animated.View entering={ZoomIn.delay(100).duration(400)}>
              <View style={{ width: 80, height: 80, backgroundColor: `${parentTheme.primary}20`, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Flame size={40} color={parentTheme.primary} />
              </View>
            </Animated.View>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>WHAT YOU ARE CHOOSING</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", textAlign: "center", lineHeight: 34 }}>
              Which statement feels closest to your heart?
            </Text>
          </View>

          <View style={{ gap: 14 }}>
            {commitments.map((c, index) => (
              <Animated.View key={c.key} entering={FadeInUp.delay(200 + index * 100).duration(400)}>
                <Pressable
                  onPress={() => setCommitment(c.key)}
                  style={{
                    backgroundColor: commitment === c.key ? `${parentTheme.primary}20` : "rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: commitment === c.key ? parentTheme.primary : "transparent",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: commitment === c.key ? parentTheme.primary : "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    {commitment === c.key && <Check size={16} color="#000" strokeWidth={3} />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, color: "#fff", lineHeight: 24 }}>{c.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 13: Strength Acknowledgement - Affirmation
    if (step === 13) {
      const strengths: { key: ParentStrength; label: string; icon: React.ReactNode }[] = [
        { key: "show_love", label: "I show love", icon: <Heart size={24} color="#EC4899" /> },
        { key: "provide", label: "I provide", icon: <Gift size={24} color="#F59E0B" /> },
        { key: "protect", label: "I protect", icon: <Shield size={24} color="#3B82F6" /> },
        { key: "teach_values", label: "I teach values", icon: <Lightbulb size={24} color="#8B5CF6" /> },
        { key: "present", label: "I am present", icon: <Users size={24} color="#10B981" /> },
        { key: "learning", label: "I am learning", icon: <Brain size={24} color="#06B6D4" /> },
      ];

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: "#10B981", fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>WHAT YOU'RE DOING RIGHT</Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 }}>
              Let's pause.
            </Text>
            <Text style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
              What do you believe you're doing well as a parent?
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {strengths.map((strength, index) => (
              <Animated.View key={strength.key} entering={ZoomIn.delay(index * 80).duration(300)} style={{ width: (SCREEN_WIDTH - 52) / 2 }}>
                <Pressable
                  onPress={() => setParentStrength(strength.key)}
                  style={{
                    backgroundColor: parentStrength === strength.key ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    padding: 20,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: parentStrength === strength.key ? "#10B981" : "transparent",
                  }}
                >
                  <View style={{ marginBottom: 12 }}>{strength.icon}</View>
                  <Text style={{ fontSize: 15, color: "#fff", textAlign: "center", fontWeight: "500" }}>{strength.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // STEP 14: Children Count
    if (step === 14) {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <View style={{ width: 80, height: 80, backgroundColor: `${parentTheme.primary}20`, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Users size={40} color={parentTheme.primary} />
            </View>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>YOUR FAMILY</Text>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              How many children do you have?
            </Text>
          </View>

          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 24, padding: 32, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 32 }}>
              <Pressable
                onPress={() => setChildrenCount(Math.max(1, childrenCount - 1))}
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
              >
                <Minus size={24} color="#fff" />
              </Pressable>

              <Text style={{ fontSize: 64, fontWeight: "800", color: parentTheme.primary, minWidth: 80, textAlign: "center" }}>
                {childrenCount}
              </Text>

              <Pressable
                onPress={() => setChildrenCount(Math.min(10, childrenCount + 1))}
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: parentTheme.primary, alignItems: "center", justifyContent: "center" }}
              >
                <Plus size={24} color="#000" />
              </Pressable>
            </View>

            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginTop: 16 }}>
              {childrenCount === 1 ? "1 child" : `${childrenCount} children`}
            </Text>
          </View>
        </Animated.View>
      );
    }

    // STEP 15: Children Info - Simple scrollable list
    if (step === 15) {
      const currentChild = childDrafts[activeChildIndex] || childDrafts[0];
      const currentIndex = activeChildIndex;
      
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ flex: 1, paddingHorizontal: 24 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
              CHILD {currentIndex + 1} OF {childDrafts.length}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff" }}>
              Tell us about your child
            </Text>
          </View>

          <KeyboardAwareScrollView 
            showsVerticalScrollIndicator={false} 
            style={{ flex: 1 }}
            bottomOffset={50}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>First Name *</Text>
              <TextInput
                style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, fontSize: 16, color: "#fff" }}
                placeholder="Enter child's name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={currentChild.firstName}
                onChangeText={(text) => updateChildDraft(currentIndex, { firstName: text })}
              />
            </View>

            {/* Academic Year */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Academic Year *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {ACADEMIC_CLASSES.map((cls) => (
                    <Pressable
                      key={cls}
                      onPress={() => updateChildDraft(currentIndex, { academicClass: cls })}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: currentChild.academicClass === cls ? parentTheme.primary : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Text style={{ fontSize: 14, color: currentChild.academicClass === cls ? "#000" : "#fff", fontWeight: "500" }}>
                        {cls.replace("year_", "Year ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Gender */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Gender</Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {(["male", "female"] as ChildGender[]).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => updateChildDraft(currentIndex, { gender: g })}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: currentChild.gender === g ? parentTheme.primary : "rgba(255,255,255,0.08)",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 15, color: currentChild.gender === g ? "#000" : "#fff", fontWeight: "500" }}>
                      {g === "male" ? "Boy" : "Girl"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Child selector for multiple children */}
            {childDrafts.length > 1 && (
              <View style={{ marginTop: 8, marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>Switch Child</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {childDrafts.map((child, idx) => (
                    <Pressable
                      key={child.id}
                      onPress={() => setActiveChildIndex(idx)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: idx === currentIndex ? parentTheme.primary : "rgba(255,255,255,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: idx === currentIndex ? "#fff" : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "700", color: idx === currentIndex ? "#000" : "#fff" }}>
                        {idx + 1}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </KeyboardAwareScrollView>
        </Animated.View>
      );
    }

    // STEP 16: Motivation Screen
    if (step === 16) {
      return (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
          <Animated.View entering={ZoomIn.duration(600)} style={{ alignItems: "center" }}>
            <View style={{ width: 100, height: 100, backgroundColor: `${parentTheme.primary}20`, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
              <Sparkles size={50} color={parentTheme.primary} />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={{ fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 42 }}>
            {toneMessages.motivation}
          </Animated.Text>

          <Animated.Text entering={FadeInUp.delay(500).duration(500)} style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 20, lineHeight: 26 }}>
            {toneMessages.validation}
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(700).duration(500)} style={{ backgroundColor: `${parentTheme.primary}15`, borderRadius: 16, padding: 20, marginTop: 40 }}>
            <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", textAlign: "center", fontStyle: "italic", lineHeight: 24 }}>
              "{toneMessages.closing}"
            </Text>
          </Animated.View>
        </View>
      );
    }

    // STEP 17: Loading/Personalization - Beautiful anticipation screen
    if (step === 17) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }}>
          {/* Animated pulsing circle */}
          <Animated.View 
            entering={ZoomIn.duration(600)}
            style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: `${parentTheme.primary}20`, alignItems: "center", justifyContent: "center", marginBottom: 40 }}
          >
            <ActivityIndicator size="large" color={parentTheme.primary} />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.duration(400)}
            key={loadingMessageIndex}
            style={{ fontSize: 22, fontWeight: "600", color: "#fff", textAlign: "center", marginBottom: 12, lineHeight: 30 }}
          >
            {LOADING_MESSAGES[loadingMessageIndex]}
          </Animated.Text>

          <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 22 }}>
            We're creating something special just for you and your family
          </Text>

          {/* Progress dots */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 48 }}>
            {[0, 1, 2, 3, 4].map((idx) => (
              <View 
                key={idx}
                style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: loadingMessageIndex >= idx * 2 ? parentTheme.primary : "rgba(255,255,255,0.2)" 
                }} 
              />
            ))}
          </View>
        </View>
      );
    }

    // STEP 18: Summary - WOW MOMENT
    if (step === 18) {
      const getEmotionalInsight = () => {
        if (parentType === "father") {
          return `${parentFirstName}, being a father isn't about being perfect—it's about being present. Your children don't need a superhero. They need you: showing up, every single day, even when you're tired. That's what builds lasting memories.`;
        }
        return `${parentFirstName}, the weight you carry—the planning, the worrying, the endless mental load—it's invisible to most, but not to us. You're doing more than you realize, and your children feel your love in every small moment.`;
      };

      const getClosingMessage = () => {
        if (parentType === "father") {
          return "You're not just raising kids. You're building a legacy.";
        }
        return "You're not just a mother. You're the heart of your family.";
      };

      return (
        <Animated.View entering={FadeIn.duration(600)} style={{ paddingHorizontal: 20 }}>
          {/* Header with Sparkle Effect */}
          <Animated.View entering={ZoomIn.delay(200).duration(500)} style={{ alignItems: "center", marginBottom: 28 }}>
            <View style={{ width: 90, height: 90, backgroundColor: `${parentTheme.primary}25`, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Sparkles size={45} color={parentTheme.primary} />
            </View>
            <Text style={{ fontSize: 30, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 38 }}>
              We See You, {parentFirstName}
            </Text>
          </Animated.View>

          {/* Emotional Insight Card */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ backgroundColor: `${parentTheme.primary}15`, borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: `${parentTheme.primary}30` }}>
            <Text style={{ fontSize: 17, color: "rgba(255,255,255,0.95)", lineHeight: 28, textAlign: "center" }}>
              {getEmotionalInsight()}
            </Text>
          </Animated.View>

          {/* Family Overview */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 12, color: parentTheme.primary, fontWeight: "600", letterSpacing: 1, marginBottom: 16 }}>YOUR FAMILY</Text>
            
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, backgroundColor: `${parentTheme.primary}20`, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                {parentType === "father" ? <Shield size={24} color={parentTheme.primary} /> : <Heart size={24} color={parentTheme.primary} />}
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{parentFirstName}</Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{parentType === "father" ? "Father" : "Mother"} • Family Leader</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 12 }} />

            <View style={{ gap: 12 }}>
              {childDrafts.map((child, idx) => (
                <Animated.View key={child.id} entering={FadeInLeft.delay(700 + idx * 100).duration(400)} style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: child.favoriteColor || parentTheme.primary, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{child.firstName?.charAt(0) || (idx + 1)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>{child.firstName || `Child ${idx + 1}`}</Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                      {child.academicClass ? ACADEMIC_CLASS_LABELS[child.academicClass] : ""}
                      {child.gender ? ` • ${child.gender === "male" ? "Boy" : "Girl"}` : ""}
                    </Text>
                  </View>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: child.favoriteColor || parentTheme.primary }} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Closing Affirmation */}
          <Animated.View entering={FadeInUp.delay(900).duration(500)} style={{ alignItems: "center", paddingHorizontal: 10, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: `${parentTheme.primary}40` }} />
              <Star size={20} color={parentTheme.primary} style={{ marginHorizontal: 12 }} />
              <View style={{ flex: 1, height: 1, backgroundColor: `${parentTheme.primary}40` }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: parentTheme.primary, textAlign: "center", lineHeight: 26 }}>
              {getClosingMessage()}
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 12 }}>
              FamilyForge is ready to support your journey.
            </Text>
          </Animated.View>
        </Animated.View>
      );
    }

    // STEP 19: Email Collection
    if (step === 19) {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{ width: 72, height: 72, backgroundColor: `${parentTheme.primary}20`, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Mail size={36} color={parentTheme.primary} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              Stay Connected
            </Text>
            <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 12, lineHeight: 22 }}>
              We'll send your personalized welcome guide and weekly family tips
            </Text>
          </View>

          <TextInput
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 18,
              fontSize: 17,
              color: "#fff",
              borderWidth: 1,
              borderColor: parentEmail.includes("@") ? parentTheme.primary : "rgba(255,255,255,0.1)",
            }}
            placeholder="Your email address"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={parentEmail}
            onChangeText={setParentEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />

          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 16 }}>
            We respect your privacy. No spam, ever.
          </Text>
        </Animated.View>
      );
    }

    // STEP 20: PIN Creation
    if (step === 20) {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{ width: 72, height: 72, backgroundColor: "rgba(16, 185, 129, 0.2)", borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Lock size={36} color="#10B981" />
            </View>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              Secure Your Account
            </Text>
            <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 8 }}>
              Create a 6-digit PIN for quick access
            </Text>
          </View>

          <View style={{ gap: 20 }}>
            {/* Enter PIN */}
            <View>
              <Pressable onPress={() => pinInputRef.current?.focus()} style={{ alignItems: "center" }}>
                <View style={{ flexDirection: "row", gap: 10 }} pointerEvents="none">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <View
                      key={`pin-${index}`}
                      style={{
                        width: 50,
                        height: 60,
                        borderWidth: 2,
                        borderRadius: 12,
                        borderColor: index === pin.length ? "#10B981" : pin[index] ? "#10B981" : "rgba(255,255,255,0.15)",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff" }}>
                        {pin[index] ? (showPin ? pin[index] : "*") : ""}
                      </Text>
                    </View>
                  ))}
                </View>
                <TextInput
                  ref={pinInputRef}
                  value={pin}
                  onChangeText={handlePinChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={{ position: "absolute", opacity: 0, width: "100%", height: "100%" }}
                />
              </Pressable>
            </View>

            {/* Show/Hide PIN Toggle */}
            <Pressable 
              onPress={() => setShowPin(!showPin)} 
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 }}
            >
              {showPin ? (
                <EyeOff size={20} color="rgba(255,255,255,0.6)" />
              ) : (
                <Eye size={20} color="rgba(255,255,255,0.6)" />
              )}
              <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
                {showPin ? "Hide PIN" : "Tap to view PIN"}
              </Text>
            </Pressable>
          </View>

          {pinError && (
            <Text style={{ fontSize: 14, color: "#EF4444", textAlign: "center", marginTop: 16 }}>{pinError}</Text>
          )}

          {accountError && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 12, borderRadius: 12 }}>
              <AlertCircle size={18} color="#EF4444" />
              <Text style={{ fontSize: 14, color: "#EF4444", flex: 1 }}>{accountError}</Text>
            </View>
          )}

          {isCreatingAccount && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 }}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Creating your account...</Text>
            </View>
          )}
        </Animated.View>
      );
    }

    // STEP 21: Email Verification Code
    if (step === 21) {
      const canResend = resendCountdown === 0;

      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              Check your email
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8, textAlign: "center" }}>
              We sent a 4-digit code to {parentEmail}
            </Text>
          </View>

          <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
              Enter code
            </Text>
            <TextInput
              value={verificationInput}
              onChangeText={(value) => {
                const sanitized = value.replace(/[^0-9]/g, "").slice(0, 4);
                setVerificationInput(sanitized);
                setVerificationError(null);
              }}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                paddingVertical: 14,
                textAlign: "center",
                color: "#fff",
                fontSize: 24,
                fontWeight: "800",
                letterSpacing: 6,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            />

            {verificationError && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 10, borderRadius: 12 }}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={{ fontSize: 13, color: "#EF4444", flex: 1 }}>{verificationError}</Text>
              </View>
            )}

            <Pressable
              onPress={() => {
                if (!canResend) return;
                sendVerificationCode();
              }}
              disabled={!canResend}
              style={{ marginTop: 14, alignItems: "center", opacity: canResend ? 1 : 0.6 }}
            >
              <Text style={{ fontSize: 13, color: canResend ? parentTheme.primary : "rgba(255,255,255,0.4)" }}>
                {canResend ? "Resend code" : `Resend in ${resendCountdown}s`}
              </Text>
            </Pressable>
          </View>

          {isVerifying && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 }}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Verifying code...</Text>
            </View>
          )}
        </Animated.View>
      );
    }

    // STEP 22: Paywall
    if (step === 22) {
      const getPrice = (plan: "free" | "pro" | "forge", cycle: "monthly" | "yearly") => {
        const basePrice = planPrices[plan][cycle];
        return formatPrice(basePrice, currencyType);
      };
      
      const getDailyPriceFormatted = (plan: "free" | "pro" | "forge", cycle: "monthly" | "yearly") => {
        const basePrice = planPrices[plan][cycle];
        return formatDailyPrice(basePrice, currencyType);
      };
      
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              Choose Your Plan
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
              Invest in your family's growth
            </Text>
          </View>

          {/* Billing Toggle - More prominent */}
          <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 4, marginBottom: 16 }}>
            <Pressable onPress={() => setBillingCycle("monthly")} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: billingCycle === "monthly" ? "#fff" : "transparent", alignItems: "center" }}>
              <Text style={{ color: billingCycle === "monthly" ? "#1E1B4B" : "#fff", fontWeight: "700", fontSize: 15 }}>Monthly</Text>
            </Pressable>
            <Pressable onPress={() => setBillingCycle("yearly")} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: billingCycle === "yearly" ? "#fff" : "transparent", alignItems: "center" }}>
              <Text style={{ color: billingCycle === "yearly" ? "#1E1B4B" : "#fff", fontWeight: "700", fontSize: 15 }}>Yearly</Text>
              {billingCycle !== "yearly" && (
                <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "600", marginTop: 2 }}>Save 20%</Text>
              )}
            </Pressable>
          </View>

          <View style={{ gap: 10 }}>
            {/* Forge Plan */}
            <Pressable onPress={() => setSelectedPlan("forge")} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderRadius: 20, padding: 16, borderWidth: 2, borderColor: selectedPlan === "forge" ? "#F59E0B" : "rgba(245, 158, 11, 0.4)", position: "relative" }}>
              {mostPopularPlanId === "forge" && (
                <View style={{ position: "absolute", top: -12, left: 16, right: 16, alignItems: "center" }}>
                  <View style={{ backgroundColor: "#F59E0B", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Crown size={14} color="#000" />
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#000", letterSpacing: 0.5 }}>MOST POPULAR</Text>
                  </View>
                </View>
              )}
              
              <View style={{ marginTop: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>Forge Plan</Text>
                    <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Everything in Pro, plus:</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{getPrice("forge", billingCycle).formatted}/mo</Text>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: "#10B981" }}>
                      {getDailyPriceFormatted("forge", billingCycle)}/day
                    </Text>
                    {trialOffer?.enabled && (
                      <Text style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                        {trialOffer.label}: {formatPrice(trialOffer.firstMonthPrice, currencyType).formatted} for {trialOffer.durationDays} days, then {getPrice("forge", billingCycle).formatted}/mo
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={{ marginTop: 10, gap: 5 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Check size={15} color="#F59E0B" />
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Unlimited children</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Check size={15} color="#F59E0B" />
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Learning assignments</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Check size={15} color="#F59E0B" />
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Family calendar</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Check size={15} color="#F59E0B" />
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Co-parent access</Text>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Pro Plan */}
            <Pressable onPress={() => setSelectedPlan("pro")} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, borderWidth: 2, borderColor: selectedPlan === "pro" ? parentTheme.primary : "transparent", position: "relative" }}>
              {mostPopularPlanId === "pro" && (
                <View style={{ position: "absolute", top: -10, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Star size={12} color="#062a1d" />
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#062a1d" }}>MOST POPULAR</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Pro Plan</Text>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Up to 4 children</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{getPrice("pro", billingCycle).formatted}/mo</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#10B981" }}>
                    {getDailyPriceFormatted("pro", billingCycle)}/day
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: 8, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Check size={14} color="#10B981" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Unlimited tasks & rewards</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Check size={14} color="#10B981" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Progress tracking & streaks</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Check size={14} color="#10B981" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Points & leaderboards</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Check size={14} color="#10B981" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Routine builder</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Check size={14} color="#10B981" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Weekly reports</Text>
                </View>
              </View>
            </Pressable>

            {/* Free Plan */}
            <Pressable onPress={() => setSelectedPlan("free")} style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14, borderWidth: 2, borderColor: selectedPlan === "free" ? parentTheme.primary : "transparent" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Free Plan</Text>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>1 child only</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "rgba(255,255,255,0.5)" }}>{getPrice("free", billingCycle).formatted}</Text>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>forever</Text>
                </View>
              </View>
              <View style={{ marginTop: 8, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Check size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Basic tasks & rewards</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Check size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Simple tracking</Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Testimonials Carousel - Auto-sliding */}
          <TestimonialsCarousel />
        </Animated.View>
      );
    }

    // STEP 23: Avatar Setup
    if (step === 23) {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              Add Your Avatar
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 8 }}>
              This is required to continue
            </Text>
          </View>

          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: avatarUrl ? parentTheme.primary : "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              {avatarUrl ? (
                <Animated.Image entering={FadeIn.duration(300)} source={{ uri: avatarUrl }} style={{ width: 160, height: 160 }} />
              ) : (
                <User size={64} color="rgba(255,255,255,0.3)" />
              )}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable onPress={() => handlePickAvatar(false)} style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <ImageIcon size={22} color={parentTheme.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>Choose from Library</Text>
            </Pressable>
            <Pressable onPress={() => handlePickAvatar(true)} style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Camera size={22} color="#10B981" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>Take a Photo</Text>
            </Pressable>
          </View>
        </Animated.View>
      );
    }

    // STEP 24: Final/Ready
    if (step === 24) {
      return (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          <Animated.View entering={ZoomIn.duration(500)} style={{ alignItems: "center" }}>
            <View style={{ width: 100, height: 100, backgroundColor: "rgba(16, 185, 129, 0.2)", borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
              <Check size={50} color="#10B981" />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={{ fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center" }}>
            You're All Set, {parentFirstName}!
          </Animated.Text>

          <Animated.Text entering={FadeInUp.delay(400).duration(500)} style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 16, lineHeight: 24 }}>
            Your family dashboard is ready. Start building better habits, tracking progress, and celebrating wins together.
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, marginTop: 40, gap: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>What's next:</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Zap size={18} color={parentTheme.primary} />
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Create your first family task</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Gift size={18} color="#F59E0B" />
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Set up rewards for motivation</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Brain size={18} color="#06B6D4" />
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Explore learning assignments</Text>
            </View>
          </Animated.View>
        </View>
      );
    }

    return null;
  };

  // Show back button
  const showBackButton = step > 0 && step !== 17 && step !== 23 && step < 24;
  // Show continue button
  const showContinueButton = step !== 0 && step !== 17;
  const isFinalStep = step === 24;
  // Get continue label
  const getContinueLabel = () => {
    if (step === 22) return `Continue with ${selectedPlan === "free" ? "Free" : selectedPlan === "pro" ? "Pro" : "Forge"}`;
    if (step === 24) return "Go to Dashboard";
    return "Continue";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      <LinearGradient
        colors={step === 0 ? ["#1a1a1f", "#0f0f12", "#0a0a0f"] : [...parentTheme.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ flex: 1 }}>
            {/* Progress Bar */}
            {step > 0 && step !== 17 && (
              <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  {showBackButton && (
                    <Pressable onPress={prevStep} style={{ flexDirection: "row", alignItems: "center" }}>
                      <ChevronLeft size={20} color="rgba(255,255,255,0.6)" />
                      <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>Back</Text>
                    </Pressable>
                  )}
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{step}/{totalSteps - 1}</Text>
                </View>
                <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                  <View style={{ height: 3, backgroundColor: parentTheme.primary, borderRadius: 2, width: `${progress * 100}%` }} />
                </View>
              </View>
            )}

            {/* Content */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: step === 0 || step === 16 || step === 17 || step === 24 ? 0 : 32, paddingBottom: 32, flexGrow: step === 0 || step === 16 || step === 17 || step === 24 ? 1 : undefined }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {renderStepContent()}
              </ScrollView>

              {/* Continue Button */}
              {showContinueButton && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
                <Pressable
                  onPress={handleContinue}
                  disabled={!isFinalStep && (!canProceed || isCreatingAccount)}
                  style={{
                    backgroundColor: (isFinalStep || (canProceed && !isCreatingAccount)) ? parentTheme.primary : "rgba(255,255,255,0.1)",
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isCreatingAccount && <ActivityIndicator size="small" color="#000" />}
                  <Text style={{ fontSize: 17, fontWeight: "700", color: (isFinalStep || (canProceed && !isCreatingAccount)) ? "#000" : "rgba(255,255,255,0.3)" }}>
                    {isCreatingAccount ? "Creating Account..." : getContinueLabel()}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
