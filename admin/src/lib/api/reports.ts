// Pro Parenting Admin - Reports API

import { supabase, type Tables } from '../supabase';
import { throwIfSupabaseError } from './helpers';

export interface ReportListOptions {
  childId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function getReports(options: ReportListOptions = {}): Promise<Tables<'reports'>[]> {
  let query = supabase.from('reports').select('*');

  if (options.childId) {
    query = query.eq('child_id', options.childId);
  }
  if (options.startDate) {
    query = query.gte('date', options.startDate);
  }
  if (options.endDate) {
    query = query.lte('date', options.endDate);
  }

  if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
  }
  if (typeof options.offset === 'number' && options.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error } = await query.order('date', { ascending: false });
  throwIfSupabaseError(error, 'Failed to fetch reports');

  return (data ?? []) as Tables<'reports'>[];
}
