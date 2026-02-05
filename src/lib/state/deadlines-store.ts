import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";

export type DeadlineCategory =
  | "school"
  | "medical"
  | "document"
  | "payment"
  | "registration"
  | "other";

export type DeadlinePriority = "low" | "medium" | "high" | "urgent";

export interface Deadline {
  id: string;
  title: string;
  description?: string;
  category: DeadlineCategory;
  priority: DeadlinePriority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  childIds?: string[]; // Which children this applies to
  isCompleted: boolean;
  completedAt?: string;
  reminder?: number; // Days before to remind
  createdAt: string;
}

export const DEADLINE_CATEGORIES: Record<DeadlineCategory, { label: string; color: string; emoji: string }> = {
  school: { label: "School", color: "#3b82f6", emoji: "📚" },
  medical: { label: "Medical", color: "#ef4444", emoji: "🏥" },
  document: { label: "Document", color: "#f59e0b", emoji: "📄" },
  payment: { label: "Payment", color: "#10b981", emoji: "💳" },
  registration: { label: "Registration", color: "#8b5cf6", emoji: "📝" },
  other: { label: "Other", color: "#6b7280", emoji: "📌" },
};

export const DEADLINE_PRIORITIES: Record<DeadlinePriority, { label: string; color: string }> = {
  low: { label: "Low", color: "#64748b" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#f97316" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

interface DeadlinesState {
  deadlines: Deadline[];

  // Actions
  addDeadline: (deadline: Omit<Deadline, "id" | "createdAt" | "isCompleted">) => Deadline;
  updateDeadline: (id: string, updates: Partial<Deadline>) => void;
  removeDeadline: (id: string) => void;
  completeDeadline: (id: string) => void;
  uncompleteDeadline: (id: string) => void;

  // Queries
  getUpcomingDeadlines: (days?: number) => Deadline[];
  getOverdueDeadlines: () => Deadline[];
  getDeadlinesByCategory: (category: DeadlineCategory) => Deadline[];
  getDeadlinesForChild: (childId: string) => Deadline[];
  getCompletedDeadlines: () => Deadline[];

  resetStore: () => void;
}

const initialState = {
  deadlines: [],
};

export const useDeadlinesStore = create<DeadlinesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addDeadline: (deadlineData) => {
        const newDeadline: Deadline = {
          id: nanoid(),
          ...deadlineData,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          deadlines: [...state.deadlines, newDeadline],
        }));
        return newDeadline;
      },

      updateDeadline: (id, updates) => {
        set((state) => ({
          deadlines: state.deadlines.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      removeDeadline: (id) => {
        set((state) => ({
          deadlines: state.deadlines.filter((d) => d.id !== id),
        }));
      },

      completeDeadline: (id) => {
        set((state) => ({
          deadlines: state.deadlines.map((d) =>
            d.id === id
              ? { ...d, isCompleted: true, completedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      uncompleteDeadline: (id) => {
        set((state) => ({
          deadlines: state.deadlines.map((d) =>
            d.id === id ? { ...d, isCompleted: false, completedAt: undefined } : d
          ),
        }));
      },

      getUpcomingDeadlines: (days = 30) => {
        const { deadlines } = get();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return deadlines
          .filter((d) => {
            if (d.isCompleted) return false;
            const dueDate = new Date(d.dueDate);
            return dueDate >= now && dueDate <= endDate;
          })
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      },

      getOverdueDeadlines: () => {
        const { deadlines } = get();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return deadlines
          .filter((d) => {
            if (d.isCompleted) return false;
            const dueDate = new Date(d.dueDate);
            return dueDate < now;
          })
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      },

      getDeadlinesByCategory: (category) => {
        return get().deadlines.filter((d) => d.category === category && !d.isCompleted);
      },

      getDeadlinesForChild: (childId) => {
        return get().deadlines.filter(
          (d) => !d.isCompleted && d.childIds && d.childIds.includes(childId)
        );
      },

      getCompletedDeadlines: () => {
        return get().deadlines.filter((d) => d.isCompleted);
      },

      resetStore: () => {
        set(initialState);
      },
    }),
    {
      name: "deadlines-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Utility functions
export const getDaysUntil = (dateStr: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatDueDate = (dateStr: string): string => {
  const days = getDaysUntil(dateStr);

  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  }
  if (days === 0) {
    return "Due today";
  }
  if (days === 1) {
    return "Due tomorrow";
  }
  if (days <= 7) {
    return `Due in ${days} days`;
  }

  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
};

export const getUrgencyColor = (dateStr: string, isCompleted: boolean): string => {
  if (isCompleted) return "#10b981"; // Green

  const days = getDaysUntil(dateStr);

  if (days < 0) return "#ef4444"; // Red - overdue
  if (days === 0) return "#ef4444"; // Red - due today
  if (days <= 2) return "#f97316"; // Orange - very soon
  if (days <= 7) return "#f59e0b"; // Yellow - this week
  return "#64748b"; // Gray - plenty of time
};
