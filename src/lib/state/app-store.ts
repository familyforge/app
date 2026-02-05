// Pro Parenting App - Zustand Store
// Offline-first state management with AsyncStorage persistence

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Child, Parent, Task, Reward, Exercise, Report, Settings, TaskCategory } from "../types";

// Helper to generate UUID-like IDs (valid UUID format)
const generateId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

interface AddChildInput {
  id?: string;
  name: string;
  nickname?: string;
  age: number;
  birthday?: string | null;
  schoolSchedule?: string;
  interests?: string[];
  learningStyle?: string;
  specialNeeds?: string;
  archived?: boolean;
  avatar?: string;
  picture?: string | null;
  className?: string;
}

interface AddTaskInput {
  title: string;
  description?: string;
  points: number;
  negativePoints?: number;
  category: TaskCategory;
  childId?: string;
  dueDate?: string;
  startTime?: string | null; // HH:mm format
  endTime?: string | null; // HH:mm format
}

interface AddRewardInput {
  title: string;
  description?: string;
  pointsCost: number;
  imageUrl?: string;
}

interface AppState {
  // Current user
  currentParent: Parent | null;
  
  // Child mode (for child dashboard access)
  isChildMode: boolean;
  
  // Children data
  children: Child[];
  selectedChildId: string | null;
  
  // Tasks & exercises
  tasks: Task[];
  exercises: Exercise[];
  
  // Rewards
  rewards: Reward[];
  
  // Reports
  reports: Report[];
  
  // Settings
  settings: Settings;
  
  // Loading states
  isLoading: boolean;
  
  // Actions - Parent
  setCurrentParent: (parent: Parent | null) => void;
  
  // Actions - Child Mode
  setIsChildMode: (isChildMode: boolean) => void;
  
  // Actions - Children
  addChild: (input: AddChildInput) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  removeChild: (id: string) => void;
  selectChild: (id: string | null) => void;
  
  // Actions - Tasks
  addTask: (input: AddTaskInput) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  completeTask: (id: string) => void;
  missTask: (id: string) => void;
  
  // Actions - Exercises
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  removeExercise: (id: string) => void;
  markExercise: (id: string, results: { questionId: string; correct: boolean }[]) => void;
  
  // Actions - Rewards
  addReward: (input: AddRewardInput) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  removeReward: (id: string) => void;
  redeemReward: (rewardId: string, childId: string) => void;
  
  // Actions - Reports
  addReport: (report: Report) => void;
  
  // Actions - Settings
  updateSettings: (updates: Partial<Settings>) => void;
  
  // Actions - Loading
  setLoading: (loading: boolean) => void;
  
  // Actions - Reset
  resetStore: () => void;
}

const initialSettings: Settings = {
  theme: "dark",
  notifications: true,
  reminders: true,
};

// Empty initial data - users add their own children
const mockChildren: Child[] = [];

// Empty initial tasks - users create their own
const mockTasks: Task[] = [];

// Empty initial rewards - users create their own
const mockRewards: Reward[] = [];

const initialState = {
  currentParent: null,
  isChildMode: false,
  children: mockChildren,
  selectedChildId: null,
  tasks: mockTasks,
  exercises: [],
  rewards: mockRewards,
  reports: [],
  settings: initialSettings,
  isLoading: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Parent actions
      setCurrentParent: (parent) => set({ currentParent: parent }),
      
      // Child Mode actions
      setIsChildMode: (isChildMode) => set({ isChildMode }),
      
      // Children actions
      addChild: (input) => {
        const newChild: Child = {
          id: input.id ?? generateId(),
          name: input.name,
          nickname: input.nickname?.trim() || undefined,
          age: input.age,
          birthday: input.birthday ?? null,
          avatar: input.avatar,
          picture: input.picture ?? null,
          class: input.className?.trim() || "",
          schoolSchedule: input.schoolSchedule?.trim() || "",
          interests: input.interests ?? [],
          learningStyle: input.learningStyle?.trim() || "",
          specialNeeds: input.specialNeeds?.trim() || "",
          archived: input.archived ?? false,
          points: 0,
          rewards: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ children: [...state.children, newChild] }));
      },
      
      updateChild: (id, updates) => set((state) => ({
        children: state.children.map((c) => {
          if (c.id !== id) return c;
          // Map className to class field
          const { className, ...rest } = updates as typeof updates & { className?: string };
          const mappedUpdates = className !== undefined ? { ...rest, class: className } : rest;
          return { ...c, ...mappedUpdates, updatedAt: new Date().toISOString() };
        }),
      })),
      
      removeChild: (id) => set((state) => ({
        children: state.children.filter((c) => c.id !== id),
        tasks: state.tasks.filter((t) => t.childId !== id),
        exercises: state.exercises.filter((e) => e.childId !== id),
        rewards: state.rewards.filter((r) => r.childId !== id),
        reports: state.reports.filter((r) => r.childId !== id),
        selectedChildId: state.selectedChildId === id ? null : state.selectedChildId,
      })),
      
      selectChild: (id) => set({ selectedChildId: id }),
      
      // Task actions
      addTask: (input) => {
        const newTask: Task = {
          id: generateId(),
          title: input.title,
          description: input.description,
          points: input.points,
          negativePoints: input.negativePoints ?? 0,
          category: input.category,
          childId: input.childId,
          status: 'pending',
          dueDate: input.dueDate || new Date().toISOString(),
          startTime: input.startTime ?? null,
          endTime: input.endTime ?? null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
      
      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
      
      completeTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        if (task.status === 'completed') return;
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
              : t
          ),
          children: task.childId 
            ? state.children.map((c) =>
                c.id === task.childId
                  ? { ...c, points: c.points + task.points, updatedAt: new Date().toISOString() }
                  : c
              )
            : state.children.map((c) => ({
                ...c,
                points: c.points + Math.floor(task.points / state.children.length),
                updatedAt: new Date().toISOString(),
              })),
        }));
      },

      missTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        if (task.status === 'skipped') return;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'skipped' as const, completedAt: new Date().toISOString() }
              : t
          ),
          children: task.childId
            ? state.children.map((c) =>
                c.id === task.childId
                  ? {
                      ...c,
                      points: Math.max(0, c.points - (task.negativePoints ?? 0)),
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              )
            : state.children,
        }));
      },
      
      // Exercise actions
      addExercise: (exercise) => set((state) => ({
        exercises: [...state.exercises, exercise],
      })),
      
      updateExercise: (id, updates) => set((state) => ({
        exercises: state.exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),
      
      removeExercise: (id) => set((state) => ({
        exercises: state.exercises.filter((e) => e.id !== id),
      })),
      
      markExercise: (id, results) => {
        const exercise = get().exercises.find((e) => e.id === id);
        if (!exercise) return;
        
        const updatedQuestions = exercise.questions.map((q) => {
          const result = results.find((r) => r.questionId === q.id);
          return result ? { ...q, correct: result.correct } : q;
        });
        
        const correctCount = updatedQuestions.filter((q) => q.correct).length;
        const pointsEarned = correctCount * exercise.pointsPerQuestion;
        
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.id === id
              ? {
                  ...e,
                  questions: updatedQuestions,
                  marked: true,
                  completed: true,
                  completedAt: new Date().toISOString(),
                }
              : e
          ),
          children: state.children.map((c) =>
            c.id === exercise.childId
              ? { ...c, points: c.points + pointsEarned, updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },
      
      // Reward actions
      addReward: (input) => {
        const newReward: Reward = {
          id: generateId(),
          title: input.title,
          description: input.description,
          pointsCost: input.pointsCost,
          imageUrl: input.imageUrl,
          redeemed: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ rewards: [...state.rewards, newReward] }));
      },
      
      updateReward: (id, updates) => set((state) => ({
        rewards: state.rewards.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),
      
      removeReward: (id) => set((state) => ({
        rewards: state.rewards.filter((r) => r.id !== id),
      })),
      
      redeemReward: (rewardId, childId) => {
        const reward = get().rewards.find((r) => r.id === rewardId);
        if (!reward) return;
        
        const child = get().children.find((c) => c.id === childId);
        if (!child || child.points < reward.pointsCost) return;
        
        set((state) => ({
          children: state.children.map((c) =>
            c.id === childId
              ? {
                  ...c,
                  points: c.points - reward.pointsCost,
                  rewards: [...c.rewards, rewardId],
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },
      
      // Report actions
      addReport: (report) => set((state) => ({
        reports: [...state.reports, report],
      })),
      
      // Settings actions
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
      
      // Loading actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Reset
      resetStore: () => set(initialState),
    }),
    {
      name: "pro-parenting-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentParent: state.currentParent,
        children: state.children,
        selectedChildId: state.selectedChildId,
        tasks: state.tasks,
        exercises: state.exercises,
        rewards: state.rewards,
        reports: state.reports,
        settings: state.settings,
      }),
    }
  )
);

// Selector hooks for optimized subscriptions (per CLAUDE.md guidelines)
export const useSelectedChild = () => {
  const selectedChildId = useAppStore((s) => s.selectedChildId);
  const children = useAppStore((s) => s.children);
  return children.find((c) => c.id === selectedChildId) ?? null;
};

export const useChildTasks = (childId: string | null) => {
  const tasks = useAppStore((s) => s.tasks);
  return childId ? tasks.filter((t) => t.childId === childId) : [];
};

export const useChildRewards = (childId: string | null) => {
  const rewards = useAppStore((s) => s.rewards);
  return childId ? rewards.filter((r) => r.childId === childId) : [];
};

export const useTheme = () => useAppStore((s) => s.settings.theme);
