// Pro Parenting App - Type Definitions
// Based on README.md Data Model

export interface Child {
  id: string;
  parentId?: string;
  name: string;
  nickname?: string;
  avatar?: string;
  picture: string | null;
  age: number;
  birthday?: string | null;
  class: string;
  schoolSchedule?: string;
  interests?: string[];
  learningStyle?: string;
  specialNeeds?: string;
  archived?: boolean;
  academicYear?: number; // 1-13 for UK school years
  points: number;
  rewards: string[]; // Array of redeemed reward IDs
  /** What this child calls their main caregiver. Drives all Kids-app copy. */
  caregiverLabel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  subscriptionTier: "free" | "premium";
  createdAt: string;
}

export type TaskType = "chore" | "exercise" | "personal_care";
export type TaskCategory = "chore" | "personal_care" | "exercise" | "learning" | "social" | "creative" | "other";
// "pending_approval" is what a child sets by tapping "I did it!". It is not yet
// completed and awards no points until a parent approves — so children get
// agency over their own tasks while parents keep the final say.
export type TaskStatus = "pending" | "pending_approval" | "completed" | "skipped";

export interface Task {
  id: string;
  childId?: string;
  title: string;
  description?: string;
  type?: TaskType;
  category: TaskCategory;
  points: number;
  negativePoints?: number;
  status: TaskStatus;
  completed?: boolean;
  dueDate?: string | null;
  startTime?: string | null; // HH:mm format for task start time
  endTime?: string | null; // HH:mm format for task end time (auto-miss if not completed by this time)
  createdAt: string;
  completedAt?: string | null;
  /** When the child submitted it for approval. */
  submittedAt?: string | null;
  /**
   * What the child calls whoever set this task — "Dad", "Nanny", "Grandad".
   * Snapshotted at creation so attribution survives later changes.
   */
  assignedByLabel?: string | null;
}

/**
 * How a reward is earned.
 *   spend       — exchange points for it (the original behaviour)
 *   daily..yearly — earned within a recurring window
 *   gold_target — unlocks once all-time gold reaches a threshold
 */
export type RewardPeriod = 'spend' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'gold_target';

export interface Reward {
  id: string;
  childId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  pointsCost: number;
  pointsRequired?: number;
  dateEarned?: string | null;
  redeemed?: boolean;
  redeemedAt?: string | null;
  /** Defaults to 'spend' so existing rewards keep their old behaviour. */
  period?: RewardPeriod;
  /** All-time gold needed. Only meaningful when period is 'gold_target'. */
  goldTarget?: number | null;
  createdAt: string;
}

export interface Exercise {
  id: string;
  childId: string;
  subject: string;
  questions: ExerciseQuestion[];
  pointsPerQuestion: number;
  completed: boolean;
  marked: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface ExerciseQuestion {
  id: string;
  question: string;
  answer: string | null;
  correct: boolean | null;
}

export interface Report {
  id: string;
  childId: string;
  date: string;
  tasksCompleted: number;
  pointsEarned: number;
  rewardsRedeemed: number;
  createdAt: string;
}

export interface Settings {
  theme: "dark" | "light" | "system";
  notifications: boolean;
  reminders: boolean;
}

// Admin specific types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "superadmin";
  createdAt: string;
}

export interface Analytics {
  totalParents: number;
  totalChildren: number;
  totalTasksCompleted: number;
  totalPointsEarned: number;
  totalRewardsRedeemed: number;
  completionRate: number;
  engagementTrend: number[];
}
