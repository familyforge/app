// Pro Parenting App - Children API

import { supabase } from './supabase';
import { requireAuthUserId, throwIfSupabaseError } from './helpers';
import { mapChildRow } from './mappers';
import type { Child } from '../types';
import type { Tables, InsertTables, UpdateTables } from './database.types';

export interface CreateChildInput {
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
  parentId?: string;
}

export interface UpdateChildInput {
  name?: string;
  nickname?: string | null;
  age?: number;
  birthday?: string | null;
  schoolSchedule?: string | null;
  interests?: string[] | null;
  learningStyle?: string | null;
  specialNeeds?: string | null;
  archived?: boolean | null;
  avatar?: string | null;
  picture?: string | null;
  className?: string | null;
  points?: number;
}

async function getRewardMapForChildren(childIds: string[]): Promise<Map<string, string[]>> {
  if (childIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('rewards')
    .select('id, redeemed_by_child_id')
    .eq('redeemed', true)
    .in('redeemed_by_child_id', childIds);

  throwIfSupabaseError(error, 'Failed to fetch redeemed rewards');

  const map = new Map<string, string[]>();
  const rewardRows = (data ?? []) as Array<{ id: string; redeemed_by_child_id: string | null }>;
  rewardRows.forEach((reward) => {
    const childId = reward.redeemed_by_child_id;
    if (!childId) {
      return;
    }
    const current = map.get(childId) ?? [];
    map.set(childId, [...current, reward.id]);
  });

  return map;
}

export async function getChildren(parentId?: string): Promise<Child[]> {
  const resolvedParentId = parentId ?? await requireAuthUserId();

  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', resolvedParentId)
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error, 'Failed to fetch children');

  const rows = (data ?? []) as Tables<'children'>[];
  const rewardMap = await getRewardMapForChildren(rows.map((child) => child.id));

  return rows.map((row) => mapChildRow(row, rewardMap.get(row.id) ?? []));
}

export async function getChildById(childId: string): Promise<Child | null> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Failed to fetch child');

  if (!data) {
    return null;
  }

  const rewardMap = await getRewardMapForChildren([childId]);
  return mapChildRow(data as Tables<'children'>, rewardMap.get(childId) ?? []);
}

export async function createChild(input: CreateChildInput): Promise<Child> {
  const resolvedParentId = input.parentId ?? await requireAuthUserId();

  const payload: InsertTables<'children'> = {
    parent_id: resolvedParentId,
    name: input.name,
    nickname: input.nickname ?? null,
    age: input.age,
    birthday: input.birthday ?? null,
    avatar: input.avatar ?? null,
    picture: input.picture ?? null,
    class: input.className ?? null,
    school_schedule: input.schoolSchedule ?? null,
    interests: input.interests ?? null,
    learning_style: input.learningStyle ?? null,
    special_needs: input.specialNeeds ?? null,
    archived: input.archived ?? false,
    points: 0,
  };

  const { data, error } = await supabase
    .from('children')
    .insert(payload as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to create child');

  if (!data) {
    throw new Error('Failed to create child');
  }

  return mapChildRow(data as Tables<'children'>, []);
}

export async function updateChild(childId: string, input: UpdateChildInput): Promise<Child> {
  const payload: UpdateTables<'children'> = {
    name: input.name,
    nickname: input.nickname ?? undefined,
    age: input.age,
    birthday: input.birthday ?? undefined,
    avatar: input.avatar ?? undefined,
    picture: input.picture ?? undefined,
    class: input.className ?? undefined,
    school_schedule: input.schoolSchedule ?? undefined,
    interests: input.interests ?? undefined,
    learning_style: input.learningStyle ?? undefined,
    special_needs: input.specialNeeds ?? undefined,
    archived: input.archived ?? undefined,
    points: input.points,
  };

  const { data, error } = await supabase
    .from('children')
    .update(payload as never)
    .eq('id', childId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to update child');

  if (!data) {
    throw new Error('Failed to update child');
  }

  return mapChildRow(data as Tables<'children'>, []);
}

export async function deleteChild(childId: string): Promise<void> {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', childId);

  throwIfSupabaseError(error, 'Failed to delete child');
}
