// Pro Parenting Admin - Parents API

import { supabase, type Tables, type UserRole, type SubscriptionTier } from '../supabase';
import { throwIfSupabaseError } from './helpers';

export interface ParentListOptions {
  search?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  limit?: number;
  offset?: number;
}

export async function getParents(options: ParentListOptions = {}): Promise<Tables<'parents'>[]> {
  let query = supabase.from('parents').select('*');

  if (options.search) {
    query = query.ilike('email', `%${options.search}%`);
  }
  if (options.role) {
    query = query.eq('role', options.role);
  }
  if (options.subscriptionTier) {
    query = query.eq('subscription_tier', options.subscriptionTier);
  }

  if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
  }
  if (typeof options.offset === 'number' && options.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  throwIfSupabaseError(error, 'Failed to fetch parents');

  return (data ?? []) as Tables<'parents'>[];
}

export async function getParentById(parentId: string): Promise<Tables<'parents'> | null> {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('id', parentId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Failed to fetch parent');

  return (data ?? null) as Tables<'parents'> | null;
}

export async function updateParentRole(parentId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('parents')
    .update({ role } as never)
    .eq('id', parentId);

  throwIfSupabaseError(error, 'Failed to update parent role');
}

export async function updateParentSubscription(parentId: string, tier: SubscriptionTier): Promise<void> {
  const { error } = await supabase
    .from('parents')
    .update({ subscription_tier: tier } as never)
    .eq('id', parentId);

  throwIfSupabaseError(error, 'Failed to update subscription tier');
}

export async function deleteParent(parentId: string): Promise<void> {
  const { error } = await supabase
    .from('parents')
    .delete()
    .eq('id', parentId);

  throwIfSupabaseError(error, 'Failed to delete parent');
}
