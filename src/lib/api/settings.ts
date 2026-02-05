// Pro Parenting App - Settings API

import { supabase } from './supabase';
import { requireAuthUserId, throwIfSupabaseError } from './helpers';
import { mapSettingsRow } from './mappers';
import type { Settings } from '../types';
import type { Tables, UpdateTables } from './database.types';

export interface ParentSettings extends Settings {
  pointsToMoneyRate: number;
  currency: string;
}

export interface UpdateSettingsInput {
  theme?: Settings['theme'];
  notifications?: boolean;
  reminders?: boolean;
  pointsToMoneyRate?: number;
  currency?: string;
}

export async function getSettings(parentId?: string): Promise<ParentSettings | null> {
  const resolvedParentId = parentId ?? await requireAuthUserId();

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('parent_id', resolvedParentId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Failed to fetch settings');

  if (!data) {
    return null;
  }

  const base = mapSettingsRow(data as Tables<'settings'>);
  return {
    ...base,
    pointsToMoneyRate: (data as Tables<'settings'>).points_to_money_rate,
    currency: (data as Tables<'settings'>).currency,
  };
}

export async function updateSettings(input: UpdateSettingsInput, parentId?: string): Promise<ParentSettings> {
  const resolvedParentId = parentId ?? await requireAuthUserId();

  const payload: UpdateTables<'settings'> = {
    theme: input.theme,
    notifications: input.notifications,
    reminders: input.reminders,
    points_to_money_rate: input.pointsToMoneyRate,
    currency: input.currency,
  };

  const { data, error } = await supabase
    .from('settings')
    .update(payload as never)
    .eq('parent_id', resolvedParentId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to update settings');

  if (!data) {
    throw new Error('Failed to update settings');
  }

  const base = mapSettingsRow(data as Tables<'settings'>);
  return {
    ...base,
    pointsToMoneyRate: (data as Tables<'settings'>).points_to_money_rate,
    currency: (data as Tables<'settings'>).currency,
  };
}
