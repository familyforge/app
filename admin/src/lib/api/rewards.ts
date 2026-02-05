// Pro Parenting Admin - Rewards API

import { supabase, type Tables } from '../supabase';
import { throwIfSupabaseError } from './helpers';

export interface RewardListOptions {
  childId?: string;
  redeemed?: boolean;
  limit?: number;
  offset?: number;
}

export async function getRewards(options: RewardListOptions = {}): Promise<Tables<'rewards'>[]> {
  let query = supabase.from('rewards').select('*');

  if (options.childId) {
    query = query.eq('child_id', options.childId);
  }
  if (typeof options.redeemed === 'boolean') {
    query = query.eq('redeemed', options.redeemed);
  }

  if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
  }
  if (typeof options.offset === 'number' && options.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  throwIfSupabaseError(error, 'Failed to fetch rewards');

  return (data ?? []) as Tables<'rewards'>[];
}
