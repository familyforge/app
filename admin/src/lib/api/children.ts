// Pro Parenting Admin - Children API

import { supabase, type Tables } from '../supabase';
import { throwIfSupabaseError } from './helpers';

export interface ChildListOptions {
  parentId?: string;
  limit?: number;
  offset?: number;
}

export async function getChildren(options: ChildListOptions = {}): Promise<Tables<'children'>[]> {
  let query = supabase.from('children').select('*');

  if (options.parentId) {
    query = query.eq('parent_id', options.parentId);
  }

  if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
  }
  if (typeof options.offset === 'number' && options.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  throwIfSupabaseError(error, 'Failed to fetch children');

  return (data ?? []) as Tables<'children'>[];
}

export async function getChildById(childId: string): Promise<Tables<'children'> | null> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Failed to fetch child');

  return (data ?? null) as Tables<'children'> | null;
}
