// Pro Parenting App - Rewards API

import { supabase } from './supabase';
import { throwIfSupabaseError } from './helpers';
import { mapRewardRow } from './mappers';
import type { Reward } from '../types';
import type { Tables, InsertTables, UpdateTables } from './database.types';

export interface CreateRewardInput {
  childId?: string | null;
  title: string;
  description?: string;
  imageUrl?: string;
  pointsRequired: number;
}

export interface UpdateRewardInput {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  pointsRequired?: number;
  redeemed?: boolean;
  redeemedAt?: string | null;
  redeemedByChildId?: string | null;
  dateEarned?: string | null;
}

export async function getRewardsByChild(childId: string, includeGlobal: boolean = true): Promise<Reward[]> {
  const query = supabase
    .from('rewards')
    .select('*');

  const { data, error } = includeGlobal
    ? await query.or(`child_id.is.null,child_id.eq.${childId}`)
    : await query.eq('child_id', childId);

  throwIfSupabaseError(error, 'Failed to fetch rewards');

  return (data ?? []).map(mapRewardRow);
}

export async function createReward(input: CreateRewardInput): Promise<Reward> {
  const payload: InsertTables<'rewards'> = {
    child_id: input.childId ?? null,
    title: input.title,
    description: input.description ?? null,
    image_url: input.imageUrl ?? null,
    points_required: input.pointsRequired,
    redeemed: false,
  };

  const { data, error } = await supabase
    .from('rewards')
    .insert(payload as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to create reward');

  if (!data) {
    throw new Error('Failed to create reward');
  }

  return mapRewardRow(data as Tables<'rewards'>);
}

export async function updateReward(rewardId: string, input: UpdateRewardInput): Promise<Reward> {
  const payload: UpdateTables<'rewards'> = {
    title: input.title,
    description: input.description ?? undefined,
    image_url: input.imageUrl ?? undefined,
    points_required: input.pointsRequired,
    redeemed: input.redeemed,
    redeemed_at: input.redeemedAt ?? undefined,
    redeemed_by_child_id: input.redeemedByChildId ?? undefined,
    date_earned: input.dateEarned ?? undefined,
  };

  const { data, error } = await supabase
    .from('rewards')
    .update(payload as never)
    .eq('id', rewardId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to update reward');

  if (!data) {
    throw new Error('Failed to update reward');
  }

  return mapRewardRow(data as Tables<'rewards'>);
}

export async function deleteReward(rewardId: string): Promise<void> {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', rewardId);

  throwIfSupabaseError(error, 'Failed to delete reward');
}

export async function redeemReward(rewardId: string, childId: string): Promise<Reward> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('rewards')
    .update({
      redeemed: true,
      redeemed_by_child_id: childId,
      redeemed_at: now,
      date_earned: now,
    } as never)
    .eq('id', rewardId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to redeem reward');

  if (!data) {
    throw new Error('Failed to redeem reward');
  }

  return mapRewardRow(data as Tables<'rewards'>);
}
