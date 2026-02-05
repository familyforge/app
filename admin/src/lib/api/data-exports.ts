// FamilyForge Admin - Data Export Requests API
// Handles admin functionality for processing user data export requests

import { supabase } from '../supabase';

export interface DataExportRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  download_url: string | null;
  expires_at: string | null;
  notes: string | null;
}

export interface DataExportListOptions {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'all';
  limit?: number;
  offset?: number;
  sortBy?: 'requested_at' | 'processed_at';
  sortOrder?: 'asc' | 'desc';
}

const db = supabase as unknown as {
  from: (table: string) => any;
};

/**
 * Get all data export requests for admin review
 */
export async function getDataExportRequests(
  options: DataExportListOptions = {}
): Promise<{ data: DataExportRequest[]; count: number; error?: string }> {
  const {
    status = 'pending',
    limit = 50,
    offset = 0,
    sortBy = 'requested_at',
    sortOrder = 'desc',
  } = options;

  try {
    let query = db
      .from('data_export_requests')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching data export requests:', error);
      return { data: [], count: 0, error: error.message };
    }

    return { data: data as DataExportRequest[], count: count || 0 };
  } catch (error) {
    console.error('Unexpected error in getDataExportRequests:', error);
    return { data: [], count: 0, error: 'Failed to fetch export requests' };
  }
}

/**
 * Get a single data export request by ID
 */
export async function getDataExportRequestById(
  requestId: string
): Promise<{ data: DataExportRequest | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('data_export_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching data export request:', error);
      return { data: null, error: error.message };
    }

    return { data: data as DataExportRequest };
  } catch (error) {
    console.error('Unexpected error in getDataExportRequestById:', error);
    return { data: null, error: 'Failed to fetch export request' };
  }
}

/**
 * Update a data export request status
 */
export async function updateDataExportRequest(
  requestId: string,
  updates: {
    status?: 'processing' | 'completed' | 'failed';
    processed_by?: string;
    download_url?: string;
    expires_at?: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = { ...updates };

    // Auto-set processed_at when status changes to completed or failed
    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.processed_at = new Date().toISOString();
    }

    const { error } = await db
      .from('data_export_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('Error updating data export request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateDataExportRequest:', error);
    return { success: false, error: 'Failed to update export request' };
  }
}

/**
 * Mark a request as processing (admin started working on it)
 */
export async function markExportAsProcessing(
  requestId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  return updateDataExportRequest(requestId, {
    status: 'processing',
    processed_by: adminId,
  });
}

/**
 * Complete a data export request with download URL
 */
export async function completeDataExport(
  requestId: string,
  adminId: string,
  downloadUrl: string,
  expiresInDays: number = 7
): Promise<{ success: boolean; error?: string }> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return updateDataExportRequest(requestId, {
    status: 'completed',
    processed_by: adminId,
    download_url: downloadUrl,
    expires_at: expiresAt.toISOString(),
  });
}

/**
 * Mark a data export request as failed
 */
export async function failDataExport(
  requestId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  return updateDataExportRequest(requestId, {
    status: 'failed',
    processed_by: adminId,
    notes: reason,
  });
}

/**
 * Get all user data for export (to be called when generating export)
 */
export async function getUserDataForExport(userId: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    // Fetch all user data from various tables
    const [
      parentsResult,
      childrenResult,
      tasksResult,
      taskHistoryResult,
      rewardsResult,
      rewardHistoryResult,
      routinesResult,
      goalsResult,
    ] = await Promise.all([
      supabase.from('parents').select('*').eq('id', userId).single(),
      supabase.from('children').select('*').eq('parent_id', userId),
      supabase.from('tasks').select('*').eq('parent_id', userId),
      supabase.from('task_history').select('*').eq('parent_id', userId),
      supabase.from('rewards').select('*').eq('parent_id', userId),
      supabase.from('reward_history').select('*').eq('parent_id', userId),
      supabase.from('routines').select('*').eq('parent_id', userId),
      supabase.from('goals').select('*').eq('parent_id', userId),
    ]);

    const userData = {
      exportedAt: new Date().toISOString(),
      userId,
      profile: parentsResult.data || {},
      children: childrenResult.data || [],
      tasks: tasksResult.data || [],
      taskHistory: taskHistoryResult.data || [],
      rewards: rewardsResult.data || [],
      rewardHistory: rewardHistoryResult.data || [],
      routines: routinesResult.data || [],
      goals: goalsResult.data || [],
    };

    return { success: true, data: userData };
  } catch (error) {
    console.error('Error fetching user data for export:', error);
    return { success: false, error: 'Failed to fetch user data' };
  }
}

/**
 * Get count of pending export requests
 */
export async function getPendingExportCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('data_export_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending export count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error in getPendingExportCount:', error);
    return 0;
  }
}
