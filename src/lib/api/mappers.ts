// Pro Parenting App - API Mappers
// Map database rows to app-facing types

import type { Tables } from './database.types';
import type {
  Child,
  Task,
  Reward,
  Exercise,
  ExerciseQuestion,
  Report,
  Settings,
  TaskCategory,
  TaskType,
  TaskStatus,
} from '../types';

export function mapChildRow(row: Tables<'children'>, rewardIds: string[] = []): Child {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    nickname: row.nickname ?? undefined,
    avatar: row.avatar ?? undefined,
    picture: row.picture ?? null,
    age: row.age,
    birthday: row.birthday ?? null,
    class: row.class ?? '',
    schoolSchedule: row.school_schedule ?? '',
    interests: row.interests ?? [],
    learningStyle: row.learning_style ?? '',
    specialNeeds: row.special_needs ?? '',
    archived: row.archived ?? false,
    points: row.points,
    rewards: rewardIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskRow(row: Tables<'tasks'>): Task {
  return {
    id: row.id,
    childId: row.child_id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type as TaskType,
    category: row.category as TaskCategory,
    points: row.points,
    negativePoints: row.negative_points,
    status: row.status as TaskStatus,
    completed: row.status === 'completed',
    dueDate: row.due_date,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function mapRewardRow(row: Tables<'rewards'>): Reward {
  return {
    id: row.id,
    childId: row.child_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    // points_required became nullable in migration 020: a milestone reward has a
    // gold target rather than a price. Zero is the right local stand-in — the
    // Kids app shows the target instead when period is 'gold_target'.
    pointsCost: row.points_required ?? 0,
    pointsRequired: row.points_required ?? undefined,
    dateEarned: row.date_earned,
    redeemed: row.redeemed,
    redeemedAt: row.redeemed_at,
    createdAt: row.created_at,
  };
}

export function mapExerciseRow(row: Tables<'exercises'>): Exercise {
  const questions = Array.isArray(row.questions) ? row.questions : [];
  return {
    id: row.id,
    childId: row.child_id,
    subject: row.subject,
    questions: questions as unknown as ExerciseQuestion[],
    pointsPerQuestion: row.points_per_question,
    completed: row.completed,
    marked: row.marked,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function mapReportRow(row: Tables<'reports'>): Report {
  return {
    id: row.id,
    childId: row.child_id,
    date: row.date,
    tasksCompleted: row.tasks_completed,
    pointsEarned: row.points_earned,
    rewardsRedeemed: row.rewards_redeemed,
    createdAt: row.created_at,
  };
}

export function mapSettingsRow(row: Tables<'settings'>): Settings {
  return {
    theme: row.theme,
    notifications: row.notifications,
    reminders: row.reminders,
  };
}
