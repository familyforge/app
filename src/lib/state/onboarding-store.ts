// FamilyForge App - Emotional Onboarding Store
// 24-step emotional-first onboarding flow

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Parent Type - determines tone, colors, and emotional framing
export type ParentType = "father" | "mother";

// Academic years (UK system)
export type AcademicClass =
  | "year_1" | "year_2" | "year_3" | "year_4" | "year_5" | "year_6"
  | "year_7" | "year_8" | "year_9" | "year_10" | "year_11" | "year_12" | "year_13";

// Child gender
export type ChildGender = "male" | "female";

// Learning struggle areas
export type LearningStruggle =
  | "mathematics" | "english" | "science" | "history" | "geography" | "languages"
  | "art" | "music" | "physical_education" | "computer_science"
  | "reading" | "writing" | "spelling" | "focus" | "time_management";

// Subscription plans
export type SubscriptionPlan = "free" | "pro" | "forge";
export type BillingCycle = "monthly" | "yearly";

// Emotional question responses
export type YouAreNotAloneResponse =
  | "doing_best_tired"
  | "love_overwhelmed"
  | "worry_not_enough"
  | "feel_judged"
  | "feel_proud";

export type ParentIdentityWord =
  | "committed" | "trying" | "learning" | "stressed" | "patient" | "firm" | "lost_sometimes";

export type DailyPainPoint =
  | "mornings" | "homework" | "mealtimes" | "screen_time" | "bedtime" | "not_listening" | "too_tired";

export type EmotionalTrigger =
  | "repeating_not_heard"
  | "feeling_failing"
  | "raising_voice"
  | "bad_habits"
  | "not_enough_time"
  | "disconnected";

export type GuiltReflection =
  | "wish_patient" | "should_better" | "dont_mess_up" | "parents_different" | "learning_as_i_go";

export type ChildWorry =
  | "discipline" | "confidence" | "focus" | "habits" | "future" | "emotional_health" | "safety";

export type ParentStrength =
  | "show_love" | "provide" | "protect" | "teach_values" | "present" | "learning";

export type ParentFear =
  | "drift_away" | "fail_them" | "not_prepare" | "too_strict" | "too_soft" | "repeat_mistakes";

export type HopeChange =
  | "less_stress" | "better_routines" | "more_cooperation" | "stronger_connection" | "clearer_structure" | "more_peace";

export type Commitment =
  | "better_parent" | "peace_home" | "children_thrive" | "structure_not_chaos" | "love_clarity";

// Child profile during onboarding
export interface OnboardingChild {
  id: string;
  firstName: string;
  academicClass: AcademicClass | null;
  gender: ChildGender | null;
  dateOfBirth: string;
  favoriteColor: string;
  learningStruggles: LearningStruggle[];
}

interface OnboardingState {
  // Flow control
  step: number;
  totalSteps: number;

  // Step 0: Parent Identity
  parentType: ParentType | null;

  // Step 1: You Are Not Alone
  youAreNotAloneResponse: YouAreNotAloneResponse | null;

  // Step 2: Identity as a Parent
  parentIdentityWord: ParentIdentityWord | null;
  parentIdentityCustomWord: string;

  // Step 3: Daily Pain Points (multi-select)
  dailyPainPoints: DailyPainPoint[];

  // Step 4: Emotional Trigger
  emotionalTrigger: EmotionalTrigger | null;

  // Step 5: Guilt and Self Reflection
  guiltReflection: GuiltReflection | null;

  // Step 6: Fix One Thing (typed)
  fixOneThing: string;

  // Step 7: Child Behavior Reflection
  childWorry: ChildWorry | null;

  // Step 8: Parent Name
  parentFirstName: string;
  parentLastName: string;

  // Step 9: How to Remember You (typed)
  howToRemember: string;

  // Step 10: Fear Screen
  parentFear: ParentFear | null;

  // Step 11: Hope Screen
  hopeChange: HopeChange | null;

  // Step 12: Commitment Screen
  commitment: Commitment | null;

  // Step 13: Strength Acknowledgement
  parentStrength: ParentStrength | null;

  // Step 14: Children Count
  childrenCount: number;

  // Step 15: Children Info (all in one screen)
  childDrafts: OnboardingChild[];

  // Step 19: Email Collection
  parentEmail: string;

  // Step 20: PIN Creation
  parentPin: string;

  // Step 21: Paywall
  selectedPlan: SubscriptionPlan | null;
  billingCycle: BillingCycle;

  // Step 22: Avatar Setup
  avatarUrl: string;
  avatarSetupComplete: boolean;

  // Completion flags
  onboardingComplete: boolean;
  accountCreated: boolean;
  paymentComplete: boolean;
  emailSentAt: string | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setParentType: (type: ParentType | null) => void;
  setYouAreNotAloneResponse: (response: YouAreNotAloneResponse | null) => void;
  setParentIdentityWord: (word: ParentIdentityWord | null) => void;
  setParentIdentityCustomWord: (word: string) => void;
  toggleDailyPainPoint: (point: DailyPainPoint) => void;
  setEmotionalTrigger: (trigger: EmotionalTrigger | null) => void;
  setGuiltReflection: (reflection: GuiltReflection | null) => void;
  setFixOneThing: (text: string) => void;
  setChildWorry: (worry: ChildWorry | null) => void;
  setParentFirstName: (name: string) => void;
  setParentLastName: (name: string) => void;
  setHowToRemember: (text: string) => void;
  setParentFear: (fear: ParentFear | null) => void;
  setHopeChange: (change: HopeChange | null) => void;
  setCommitment: (commitment: Commitment | null) => void;
  setParentStrength: (strength: ParentStrength | null) => void;
  setChildrenCount: (count: number) => void;
  updateChildDraft: (index: number, updates: Partial<OnboardingChild>) => void;
  addLearningStruggle: (childIndex: number, struggle: LearningStruggle) => void;
  removeLearningStruggle: (childIndex: number, struggle: LearningStruggle) => void;
  setParentEmail: (email: string) => void;
  setParentPin: (pin: string) => void;
  setSelectedPlan: (plan: SubscriptionPlan | null) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
  setAvatarUrl: (url: string) => void;
  setAvatarSetupComplete: (complete: boolean) => void;
  setAccountCreated: (created: boolean) => void;
  setPaymentComplete: (complete: boolean) => void;
  setEmailSentAt: (timestamp: string | null) => void;
  markComplete: () => void;
  resetOnboarding: () => void;
}

const TOTAL_STEPS = 24;

const createChildDraft = (index: number): OnboardingChild => ({
  id: `child-${index + 1}-${Date.now()}`,
  firstName: "",
  academicClass: null,
  gender: null,
  dateOfBirth: "",
  favoriteColor: "#8B5CF6",
  learningStruggles: [],
});

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      step: 0,
      totalSteps: TOTAL_STEPS,

      parentType: null,
      youAreNotAloneResponse: null,
      parentIdentityWord: null,
      parentIdentityCustomWord: "",
      dailyPainPoints: [],
      emotionalTrigger: null,
      guiltReflection: null,
      fixOneThing: "",
      childWorry: null,
      parentFirstName: "",
      parentLastName: "",
      howToRemember: "",
      parentFear: null,
      hopeChange: null,
      commitment: null,
      parentStrength: null,
      childrenCount: 1,
      childDrafts: [createChildDraft(0)],
      parentEmail: "",
      parentPin: "",
      selectedPlan: null,
      billingCycle: "monthly",
      avatarUrl: "",
      avatarSetupComplete: false,
      onboardingComplete: false,
      accountCreated: false,
      paymentComplete: false,
      emailSentAt: null,

      // Actions
      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: Math.min(state.step + 1, TOTAL_STEPS - 1) })),
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 0) })),

      setParentType: (type) => set({ parentType: type }),
      setYouAreNotAloneResponse: (response) => set({ youAreNotAloneResponse: response }),
      setParentIdentityWord: (word) => set({ parentIdentityWord: word }),
      setParentIdentityCustomWord: (word) => set({ parentIdentityCustomWord: word }),

      toggleDailyPainPoint: (point) =>
        set((state) => ({
          dailyPainPoints: state.dailyPainPoints.includes(point)
            ? state.dailyPainPoints.filter((p) => p !== point)
            : [...state.dailyPainPoints, point],
        })),

      setEmotionalTrigger: (trigger) => set({ emotionalTrigger: trigger }),
      setGuiltReflection: (reflection) => set({ guiltReflection: reflection }),
      setFixOneThing: (text) => set({ fixOneThing: text }),
      setChildWorry: (worry) => set({ childWorry: worry }),
      setParentFirstName: (name) => set({ parentFirstName: name }),
      setParentLastName: (name) => set({ parentLastName: name }),
      setHowToRemember: (text) => set({ howToRemember: text }),
      setParentFear: (fear) => set({ parentFear: fear }),
      setHopeChange: (change) => set({ hopeChange: change }),
      setCommitment: (commitment) => set({ commitment: commitment }),
      setParentStrength: (strength) => set({ parentStrength: strength }),

      setChildrenCount: (count) => {
        const safeCount = Math.max(1, Math.min(10, count));
        set({
          childrenCount: safeCount,
          childDrafts: Array.from({ length: safeCount }, (_, index) =>
            get().childDrafts[index] ?? createChildDraft(index)
          ),
        });
      },

      updateChildDraft: (index, updates) =>
        set((state) => ({
          childDrafts: state.childDrafts.map((child, idx) =>
            idx === index ? { ...child, ...updates } : child
          ),
        })),

      addLearningStruggle: (childIndex, struggle) =>
        set((state) => ({
          childDrafts: state.childDrafts.map((child, idx) => {
            if (idx !== childIndex) return child;
            if (child.learningStruggles.length >= 3) return child;
            if (child.learningStruggles.includes(struggle)) return child;
            return { ...child, learningStruggles: [...child.learningStruggles, struggle] };
          }),
        })),

      removeLearningStruggle: (childIndex, struggle) =>
        set((state) => ({
          childDrafts: state.childDrafts.map((child, idx) => {
            if (idx !== childIndex) return child;
            return { ...child, learningStruggles: child.learningStruggles.filter((s) => s !== struggle) };
          }),
        })),

      setParentEmail: (email) => set({ parentEmail: email }),
      setParentPin: (pin) => set({ parentPin: pin }),
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      setBillingCycle: (cycle) => set({ billingCycle: cycle }),
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      setAvatarSetupComplete: (complete) => set({ avatarSetupComplete: complete }),
      setAccountCreated: (created) => set({ accountCreated: created }),
      setPaymentComplete: (complete) => set({ paymentComplete: complete }),
      setEmailSentAt: (timestamp) => set({ emailSentAt: timestamp }),

      markComplete: () => set({ onboardingComplete: true }),

      resetOnboarding: () =>
        set({
          step: 0,
          parentType: null,
          youAreNotAloneResponse: null,
          parentIdentityWord: null,
          parentIdentityCustomWord: "",
          dailyPainPoints: [],
          emotionalTrigger: null,
          guiltReflection: null,
          fixOneThing: "",
          childWorry: null,
          parentFirstName: "",
          parentLastName: "",
          howToRemember: "",
          parentFear: null,
          hopeChange: null,
          commitment: null,
          parentStrength: null,
          childrenCount: 1,
          childDrafts: [createChildDraft(0)],
          parentEmail: "",
          parentPin: "",
          selectedPlan: null,
          billingCycle: "monthly",
          avatarUrl: "",
          avatarSetupComplete: false,
          onboardingComplete: false,
          accountCreated: false,
          paymentComplete: false,
          emailSentAt: null,
        }),
    }),
    {
      name: "familyforge-onboarding-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Tone and color helpers based on parent type
export const getParentTheme = (parentType: ParentType | null) => {
  if (parentType === "mother") {
    return {
      primary: "#EC4899", // Pink
      secondary: "#F472B6",
      accent: "#F9A8D4",
      gradient: ["#0F0A1F", "#1E1B4B", "#1E1B4B", "#0F0A1F"] as const, // Dark deep indigo
      emotionalTone: "nurturing",
    };
  }
  if (parentType === "father") {
    return {
      primary: "#8B5CF6", // Purple
      secondary: "#A78BFA",
      accent: "#C4B5FD",
      gradient: ["#0F0A1F", "#1E1B4B", "#1E1B4B", "#0F0A1F"] as const, // Dark deep indigo
      emotionalTone: "protective",
    };
  }
  return {
    primary: "#8B5CF6", // Default purple
    secondary: "#A78BFA",
    accent: "#C4B5FD",
    gradient: ["#0F0A1F", "#1E1B4B", "#1E1B4B", "#0F0A1F"] as const, // Dark deep indigo
    emotionalTone: "neutral",
  };
};

export const getParentToneMessages = (parentType: ParentType | null) => {
  if (parentType === "mother") {
    return {
      greeting: "The weight you carry is real.",
      validation: "The mental load is invisible to everyone except you. The guilt, the worry, the endless planning. You're not failing – you're fighting.",
      reassurance: "You don't need to be perfect. You need to be present.",
      closing: "FamilyForge sees you. Every small moment matters.",
      summary: "You hold your family together in ways no one sees. This is your space to breathe.",
      motivation: "You're not alone in this anymore.",
      painAcknowledge: "The exhaustion is real. The overwhelm is valid.",
    };
  }
  if (parentType === "father") {
    return {
      greeting: "Leading a family takes everything you have.",
      validation: "You want to be present. You want to provide. You want them to look up to you. That pressure is heavy.",
      reassurance: "Being a great father isn't about perfection – it's about showing up.",
      closing: "FamilyForge helps you build the family you've always wanted to lead.",
      summary: "Your presence matters more than you know. Let's build something lasting.",
      motivation: "You're building a legacy, one day at a time.",
      painAcknowledge: "The responsibility is heavy. The fear of failing them is real.",
    };
  }
  return {
    greeting: "Welcome to FamilyForge",
    validation: "Parenting is the hardest job without a manual.",
    reassurance: "You're already doing better than you think.",
    closing: "Let's build something great together.",
    summary: "Your family's journey starts here.",
    motivation: "Every great family starts with one decision.",
    painAcknowledge: "The challenges are real. The desire to do better is powerful.",
  };
};

// Label mappings
export const ACADEMIC_CLASS_LABELS: Record<AcademicClass, string> = {
  year_1: "Year 1 (Age 5-6)",
  year_2: "Year 2 (Age 6-7)",
  year_3: "Year 3 (Age 7-8)",
  year_4: "Year 4 (Age 8-9)",
  year_5: "Year 5 (Age 9-10)",
  year_6: "Year 6 (Age 10-11)",
  year_7: "Year 7 (Age 11-12)",
  year_8: "Year 8 (Age 12-13)",
  year_9: "Year 9 (Age 13-14)",
  year_10: "Year 10 (Age 14-15)",
  year_11: "Year 11 (Age 15-16)",
  year_12: "Year 12 (Age 16-17)",
  year_13: "Year 13 (Age 17-18)",
};

export const LEARNING_STRUGGLE_LABELS: Record<LearningStruggle, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
  history: "History",
  geography: "Geography",
  languages: "Languages",
  art: "Art & Design",
  music: "Music",
  physical_education: "P.E.",
  computer_science: "Computing",
  reading: "Reading",
  writing: "Writing",
  spelling: "Spelling",
  focus: "Focus",
  time_management: "Time",
};
