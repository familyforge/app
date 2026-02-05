// Pro Parenting App - Reports API

import { supabase } from './supabase';
import { throwIfSupabaseError } from './helpers';
import { mapReportRow } from './mappers';
import type { Report } from '../types';
import type { Tables, InsertTables } from './database.types';

export interface UpsertReportInput {
  childId: string;
  date: string; // YYYY-MM-DD
  tasksCompleted?: number;
  pointsEarned?: number;
  rewardsRedeemed?: number;
  notes?: string | null;
}

export async function getReportsByChild(childId: string, startDate?: string, endDate?: string): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*')
    .eq('child_id', childId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, 'Failed to fetch reports');

  return (data ?? []).map(mapReportRow);
}

export async function upsertReport(input: UpsertReportInput): Promise<Report> {
  const payload: InsertTables<'reports'> = {
    child_id: input.childId,
    date: input.date,
    tasks_completed: input.tasksCompleted ?? 0,
    points_earned: input.pointsEarned ?? 0,
    rewards_redeemed: input.rewardsRedeemed ?? 0,
    notes: input.notes ?? null,
  };

  const { data, error } = await supabase
    .from('reports')
    .upsert(payload as never, { onConflict: 'child_id,date' })
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to upsert report');

  if (!data) {
    throw new Error('Failed to upsert report');
  }

  return mapReportRow(data as Tables<'reports'>);
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  throwIfSupabaseError(error, 'Failed to delete report');
}
