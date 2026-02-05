// Pro Parenting App - Exercises API

import { supabase } from './supabase';
import { throwIfSupabaseError } from './helpers';
import { mapExerciseRow } from './mappers';
import type { Exercise, ExerciseQuestion } from '../types';
import type { Tables, InsertTables, UpdateTables } from './database.types';

export interface CreateExerciseInput {
  childId: string;
  subject: string;
  questions: ExerciseQuestion[];
  pointsPerQuestion?: number;
}

export interface UpdateExerciseInput {
  subject?: string;
  questions?: ExerciseQuestion[];
  pointsPerQuestion?: number;
  completed?: boolean;
  marked?: boolean;
  completedAt?: string | null;
}

export async function getExercisesByChild(childId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Failed to fetch exercises');

  return (data ?? []).map(mapExerciseRow);
}

export async function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  const payload: InsertTables<'exercises'> = {
    child_id: input.childId,
    subject: input.subject,
    questions: input.questions as never,
    points_per_question: input.pointsPerQuestion ?? 1,
    completed: false,
    marked: false,
  };

  const { data, error } = await supabase
    .from('exercises')
    .insert(payload as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to create exercise');

  if (!data) {
    throw new Error('Failed to create exercise');
  }

  return mapExerciseRow(data as Tables<'exercises'>);
}

export async function updateExercise(exerciseId: string, input: UpdateExerciseInput): Promise<Exercise> {
  const payload: UpdateTables<'exercises'> = {
    subject: input.subject,
    questions: input.questions as never,
    points_per_question: input.pointsPerQuestion,
    completed: input.completed,
    marked: input.marked,
    completed_at: input.completedAt ?? undefined,
  };

  const { data, error } = await supabase
    .from('exercises')
    .update(payload as never)
    .eq('id', exerciseId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to update exercise');

  if (!data) {
    throw new Error('Failed to update exercise');
  }

  return mapExerciseRow(data as Tables<'exercises'>);
}

export async function markExerciseCompleted(exerciseId: string, marked: boolean = false): Promise<Exercise> {
  const completedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('exercises')
    .update({
      completed: true,
      marked,
      completed_at: completedAt,
    } as never)
    .eq('id', exerciseId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to mark exercise completed');

  if (!data) {
    throw new Error('Failed to mark exercise completed');
  }

  return mapExerciseRow(data as Tables<'exercises'>);
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId);

  throwIfSupabaseError(error, 'Failed to delete exercise');
}
