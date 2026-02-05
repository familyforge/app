// Pro Parenting App - Offline Sync API

import { supabase } from './supabase';
import { requireAuthUserId, throwIfSupabaseError } from './helpers';
import type { Database, SyncQueueItem } from './database.types';

export type SyncOperation = 'insert' | 'update' | 'delete';
export type SyncTableName = keyof Database['public']['Tables'];

export interface QueueSyncInput {
  operation: SyncOperation;
  tableName: SyncTableName;
  recordId: string;
  data?: Record<string, unknown>;
  parentId?: string;
}

export interface SyncResult {
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export async function enqueueSyncOperation(input: QueueSyncInput): Promise<SyncQueueItem> {
  const resolvedParentId = input.parentId ?? await requireAuthUserId();

  const payload = {
    parent_id: resolvedParentId,
    operation: input.operation,
    table_name: input.tableName,
    record_id: input.recordId,
    data: input.data ?? {},
    synced: false,
  };

  const { data, error } = await supabase
    .from('sync_queue')
    .insert(payload as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Failed to enqueue sync operation');

  if (!data) {
    throw new Error('Failed to enqueue sync operation');
  }

  return data as SyncQueueItem;
}

export async function getPendingSyncOperations(parentId?: string): Promise<SyncQueueItem[]> {
  const resolvedParentId = parentId ?? await requireAuthUserId();

  const { data, error } = await supabase
    .from('sync_queue')
    .select('*')
    .eq('parent_id', resolvedParentId)
    .eq('synced', false)
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error, 'Failed to fetch sync queue');

  return (data ?? []) as SyncQueueItem[];
}

export async function markSyncOperationSynced(id: string): Promise<void> {
  const { error } = await supabase
    .from('sync_queue')
    .update({ synced: true, synced_at: new Date().toISOString() } as never)
    .eq('id', id);

  throwIfSupabaseError(error, 'Failed to mark sync operation as synced');
}

async function applySyncOperation(operation: SyncQueueItem): Promise<void> {
  const tableName = operation.table_name as SyncTableName;
  const data = (operation.data ?? {}) as Record<string, unknown>;

  if (operation.operation === 'insert') {
    const { error } = await supabase.from(tableName).insert(data as never);
    throwIfSupabaseError(error, `Failed to insert ${tableName}`);
    return;
  }

  if (operation.operation === 'update') {
    const { error } = await supabase
      .from(tableName)
      .update(data as never)
      .eq('id', operation.record_id);
    throwIfSupabaseError(error, `Failed to update ${tableName}`);
    return;
  }

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', operation.record_id);
  throwIfSupabaseError(error, `Failed to delete ${tableName}`);
}

export async function processSyncQueue(parentId?: string): Promise<SyncResult> {
  const operations = await getPendingSyncOperations(parentId);

  const result: SyncResult = {
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (const operation of operations) {
    try {
      await applySyncOperation(operation);
      await markSyncOperationSynced(operation.id);
      result.processed += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        id: operation.id,
        error: error instanceof Error ? error.message : 'Unknown sync error',
      });
    }
  }

  return result;
}

export async function clearSyncedOperations(parentId?: string): Promise<void> {
  const resolvedParentId = parentId ?? await requireAuthUserId();

  const { error } = await supabase
    .from('sync_queue')
    .delete()
    .eq('parent_id', resolvedParentId)
    .eq('synced', true);

  throwIfSupabaseError(error, 'Failed to clear synced operations');
}
