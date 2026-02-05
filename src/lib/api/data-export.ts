// FamilyForge - Data Export Request API
// Handles user requests to export their data (GDPR compliance)

import { supabase } from './supabase';

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

/**
 * Submit a request to export user data
 * Only the main account owner can request this
 */
export async function requestDataExport(params: {
  userId: string;
  userEmail: string;
  userName: string;
}): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    const db = supabase as unknown as {
      from: (table: string) => any;
    };
    // Check if there's already a pending request
    const { data: existingRequest, error: checkError } = await db
      .from('data_export_requests')
      .select('id, status, requested_at')
      .eq('user_id', params.userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing request:', checkError);
    }

    if (existingRequest) {
      const requestDate = new Date(existingRequest.requested_at).toLocaleDateString();
      return {
        success: false,
        error: `You already have a pending data export request from ${requestDate}. Please wait for it to be processed.`,
      };
    }

    // Create new export request
    const { data, error } = await db
      .from('data_export_requests')
      .insert({
        user_id: params.userId,
        user_email: params.userEmail,
        user_name: params.userName,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating data export request:', error);
      return {
        success: false,
        error: 'Failed to submit export request. Please try again later.',
      };
    }

    return {
      success: true,
      requestId: (data as { id: string }).id,
    };
  } catch (error) {
    console.error('Unexpected error in requestDataExport:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get the status of a user's data export request
 */
export async function getExportRequestStatus(userId: string): Promise<{
  hasRequest: boolean;
  request?: DataExportRequest;
}> {
  try {
    const db = supabase as unknown as {
      from: (table: string) => any;
    };
    const { data, error } = await db
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching export request status:', error);
      return { hasRequest: false };
    }

    if (!data) {
      return { hasRequest: false };
    }

    return {
      hasRequest: true,
      request: data as DataExportRequest,
    };
  } catch (error) {
    console.error('Unexpected error in getExportRequestStatus:', error);
    return { hasRequest: false };
  }
}
