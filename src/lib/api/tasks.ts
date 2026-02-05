// Pro Parenting App - Tasks API

import { supabase } from './supabase';
import { throwIfSupabaseError } from './helpers';
import { mapTaskRow } from './mappers';
import { sendAchievementAlert } from './email';
import type { Task, TaskStatus, TaskType, TaskCategory } from '../types';
import type { Tables, InsertTables, UpdateTables } from './database.types';

export interface CreateTaskInput {
  childId: string;
  title: string;
  description?: string;
  type?: TaskType;
  category?: TaskCategory;
  points?: number;
  negativePoints?: number;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  type?: TaskType;
  category?: TaskCategory;
  points?: number;
  negativePoints?: number;
  status?: TaskStatus;
  dueDate?: string | null;
  completedAt?: string | null;
}

export async function getTasksByChild(childId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Failed to fetch tasks');

  return (data ?? []).map(mapTaskRow);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const payload: InsertTables<'tasks'> = {
    child_id: input.childId,
    title: input.title,
    description: input.description ?? null,
    type: (input.type ?? 'chore') as Tables<'tasks'>['type'],
    category: input.category ?? 'chore',
    points: input.points ?? 0,
    negative_points: input.negativePoints ?? 0,
    status: 'pending',
    due_date: input.dueDate ?? null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to create task');

  if (!data) {
    throw new Error('Failed to create task');
  }

  return mapTaskRow(data as Tables<'tasks'>);
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const payload: UpdateTables<'tasks'> = {
    title: input.title,
    description: input.description ?? undefined,
    type: input.type as Tables<'tasks'>['type'],
    category: input.category,
    points: input.points,
    negative_points: input.negativePoints,
    status: input.status as Tables<'tasks'>['status'],
    due_date: input.dueDate ?? undefined,
    completed_at: input.completedAt ?? undefined,
  };

  const { data, error } = await supabase
    .from('tasks')
    .update(payload as never)
    .eq('id', taskId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to update task');

  if (!data) {
    throw new Error('Failed to update task');
  }

  return mapTaskRow(data as Tables<'tasks'>);
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  throwIfSupabaseError(error, 'Failed to delete task');
}

export async function completeTask(taskId: string): Promise<Task> {
  const completedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: completedAt } as never)
    .eq('id', taskId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to complete task');

  if (!data) {
    throw new Error('Failed to complete task');
  }

  const task = mapTaskRow(data as Tables<'tasks'>);

  // Send achievement email if task completion is significant
  try {
    // Get child and parent info
    const { data: child } = await supabase
      .from('children')
      .select('name, points, parent_id, parents(email, name)')
      .eq('id', task.childId)
      .single();

    if (child && child.parents) {
      const parent = Array.isArray(child.parents) ? child.parents[0] : child.parents;
      
      // Check if this is a significant milestone
      const isSignificantTask = task.points >= 50; // High-value task
      const isStreakMilestone = false; // TODO: Check for streak milestones
      
      if (isSignificantTask) {
        await sendAchievementAlert({
          parentEmail: parent.email,
          parentName: parent.name,
          childName: child.name,
          achievementTitle: 'Task Completed!',
          achievementDetails: `${child.name} completed "${task.title}" and earned ${task.points} points!`,
          pointsEarned: task.points,
        });
      }
    }
  } catch (emailError) {
    // Don't fail task completion if email fails
    console.error('Failed to send achievement email:', emailError);
  }

  return task;
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  const payload: UpdateTables<'tasks'> = {
    status: status as Tables<'tasks'>['status'],
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .update(payload as never)
    .eq('id', taskId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to update task status');

  if (!data) {
    throw new Error('Failed to update task status');
  }

  return mapTaskRow(data as Tables<'tasks'>);
}
