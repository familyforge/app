// Pro Parenting App - Profile & Control Center Store

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ParentingRole = "single_parent" | "co_parent" | "guardian" | "other";
export type AppTone = "gentle" | "structured" | "motivational";
export type RoutineType = "morning" | "after_school" | "bedtime";
export type Gender = "male" | "female" | "other";
export type ParentalGoal = 
  | "be_more_patient"
  | "build_stronger_bond"
  | "create_structure"
  | "support_education"
  | "encourage_independence";
export type ReminderIntensity = "low" | "medium" | "high";
export type ReminderStyle = "gentle" | "direct" | "supportive";

export type PlanType = "free" | "pro" | "forge";

export interface ParentProfile {
  name: string;
  email: string;
  avatarUrl: string;
  gender: Gender | null;
  country: string;
  language: string;
  role: ParentingRole | null;
  tone: AppTone | null;
  parentalGoal: ParentalGoal | null;
  plan: PlanType;
}

export interface Routine {
  id: string;
  type: RoutineType;
  title: string;
  steps: string[];
  time: string;
  reminderTime: string;
  reminderEnabled: boolean;
  streak: number;
  completedCount: number;
  lastCompletedDate: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  targetDays: number;
  currentStreak: number;
}

export interface Preferences {
  reminderIntensity: ReminderIntensity;
  reminderStyle: ReminderStyle;
  highStressWindows: { start: string; end: string }[];
  structureLevel: number; // 1-5
}

export interface NotificationSettings {
  routineReminders: boolean;
  taskReminders: boolean;
  urgentAlerts: boolean;
  achievementAlerts: boolean;
  motivationalNudges: boolean;
  weeklyReports: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface SyncSettings {
  cloudSyncEnabled: boolean;
  enabled: boolean;
  autoSync: boolean;
  lastSyncAt: string | null;
}

export interface PrivacySettings {
  syncChildData: boolean;
  syncAnalytics: boolean;
  childDataProtection: boolean;
  showPointsToChildren: boolean;
  hidePersonalInReports: boolean;
  allowAnalytics: boolean;
}

export interface DeletionRequest {
  id: string;
  requestedAt: string;
  reason: string;
}

interface ProfileState {
  profile: ParentProfile;
  routines: Routine[];
  goals: Goal[];
  preferences: Preferences;
  notifications: NotificationSettings;
  sync: SyncSettings;
  privacy: PrivacySettings;
  deletionRequests: DeletionRequest[];

  updateProfile: (updates: Partial<ParentProfile>) => void;
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  removeRoutine: (id: string) => void;
  logRoutineComplete: (id: string, date?: string) => void;

  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  updatePreferences: (updates: Partial<Preferences>) => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  updateSync: (updates: Partial<SyncSettings>) => void;
  updatePrivacy: (updates: Partial<PrivacySettings>) => void;
  requestDeletion: (reason: string) => void;
  resetProfile: () => void;
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const initialProfile: ParentProfile = {
  name: "",
  email: "",
  avatarUrl: "",
  gender: null,
  country: "",
  language: "",
  role: null,
  tone: null,
  parentalGoal: null,
  plan: "free",
};

export const MALE_PARENTAL_GOALS: { label: string; value: ParentalGoal }[] = [
  { label: "Be more patient with my kids", value: "be_more_patient" },
  { label: "Build a stronger bond with my children", value: "build_stronger_bond" },
  { label: "Create structure and discipline at home", value: "create_structure" },
  { label: "Support my children's education", value: "support_education" },
  { label: "Encourage independence and responsibility", value: "encourage_independence" },
];

export const FEMALE_PARENTAL_GOALS: { label: string; value: ParentalGoal }[] = [
  { label: "Be more patient and present", value: "be_more_patient" },
  { label: "Strengthen emotional connection", value: "build_stronger_bond" },
  { label: "Establish consistent routines", value: "create_structure" },
  { label: "Help my children thrive academically", value: "support_education" },
  { label: "Foster independence and confidence", value: "encourage_independence" },
];

const initialPreferences: Preferences = {
  reminderIntensity: "medium",
  reminderStyle: "supportive",
  highStressWindows: [],
  structureLevel: 3,
};

const initialNotifications: NotificationSettings = {
  routineReminders: true,
  taskReminders: true,
  urgentAlerts: true,
  achievementAlerts: true,
  motivationalNudges: true,
  weeklyReports: true,
  quietHoursEnabled: false,
  quietHoursStart: "21:00",
  quietHoursEnd: "07:00",
};

const initialSync: SyncSettings = {
  cloudSyncEnabled: true,
  enabled: true,
  autoSync: true,
  lastSyncAt: null,
};

const initialPrivacy: PrivacySettings = {
  syncChildData: true,
  syncAnalytics: false,
  childDataProtection: true,
  showPointsToChildren: true,
  hidePersonalInReports: false,
  allowAnalytics: true,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      routines: [],
      goals: [],
      preferences: initialPreferences,
      notifications: initialNotifications,
      sync: initialSync,
      privacy: initialPrivacy,
      deletionRequests: [],

      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),
      addRoutine: (routine) => set((state) => ({ routines: [...state.routines, routine] })),
      updateRoutine: (id, updates) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === id ? { ...routine, ...updates } : routine
          ),
        })),
      removeRoutine: (id) =>
        set((state) => ({ routines: state.routines.filter((routine) => routine.id !== id) })),
      logRoutineComplete: (id, date) => {
        const today = date || new Date().toISOString().split("T")[0];
        set((state) => ({
          routines: state.routines.map((routine) => {
            if (routine.id !== id) return routine;
            const lastDate = routine.lastCompletedDate;
            const isNewDay = lastDate ? lastDate !== today : true;
            return {
              ...routine,
              streak: isNewDay ? routine.streak + 1 : routine.streak,
              completedCount: routine.completedCount + 1,
              lastCompletedDate: today,
            };
          }),
        }));
      },

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)),
        })),
      removeGoal: (id) => set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) })),

      updatePreferences: (updates) =>
        set((state) => ({ preferences: { ...state.preferences, ...updates } })),
      updateNotifications: (updates) =>
        set((state) => ({ notifications: { ...state.notifications, ...updates } })),
      updateSync: (updates) => set((state) => ({ sync: { ...state.sync, ...updates } })),
      updatePrivacy: (updates) => set((state) => ({ privacy: { ...state.privacy, ...updates } })),
      requestDeletion: (reason) =>
        set((state) => ({
          deletionRequests: [
            ...state.deletionRequests,
            { id: createId(), requestedAt: new Date().toISOString(), reason },
          ],
        })),

      resetProfile: () =>
        set({
          profile: initialProfile,
          routines: [],
          goals: [],
          preferences: initialPreferences,
          notifications: initialNotifications,
          sync: initialSync,
          privacy: initialPrivacy,
          deletionRequests: get().deletionRequests,
        }),
    }),
    {
      name: "pro-parenting-profile",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const createRoutine = (data: { type: RoutineType; title: string; steps: string[]; time: string }): Routine => ({
  id: createId(),
  type: data.type,
  title: data.title,
  steps: data.steps,
  time: data.time,
  reminderTime: data.time,
  reminderEnabled: true,
  streak: 0,
  completedCount: 0,
  lastCompletedDate: null,
});

export const createGoal = (title: string): Goal => ({
  id: createId(),
  title,
  description: "",
  progress: 0,
  targetDays: 14,
  currentStreak: 0,
});
