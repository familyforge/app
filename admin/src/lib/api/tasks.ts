// Pro Parenting Admin - Tasks API

import { supabase, type Tables, type TaskStatus } from '../supabase';
import { throwIfSupabaseError } from './helpers';

export interface TaskListOptions {
  childId?: string;
  status?: TaskStatus;
  limit?: number;
  offset?: number;
}

export async function getTasks(options: TaskListOptions = {}): Promise<Tables<'tasks'>[]> {
  let query = supabase.from('tasks').select('*');

  if (options.childId) {
    query = query.eq('child_id', options.childId);
  }
  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
  }
  if (typeof options.offset === 'number' && options.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  throwIfSupabaseError(error, 'Failed to fetch tasks');

  return (data ?? []) as Tables<'tasks'>[];
}
