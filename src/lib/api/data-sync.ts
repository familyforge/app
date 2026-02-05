// FamilyForge - Offline-First Data Sync Service
// Saves data locally first, then syncs to Supabase
// On read: check local first, fall back to online

import { supabase, isSupabaseConfigured, getCurrentUser } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ============================================
// TYPES (Matching actual database schema)
// ============================================

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

// Parents table schema
export interface ParentData {
  id: string;
  email: string;
  name: string;
  subscription_tier: 'free' | 'premium';
  plan_code?: string | null;
  notification_settings?: Record<string, unknown> | null;
  privacy_settings?: Record<string, unknown> | null;
  sync_settings?: Record<string, unknown> | null;
}

// Children table schema
export interface ChildData {
  id: string;
  parent_id: string;
  name: string;
  nickname?: string | null;
  age: number;
  birthday?: string | null;
  avatar?: string | null;
  picture?: string | null;
  class?: string | null;
  school?: string | null;
  school_schedule?: string | null;
  email?: string | null;
  points: number;
  interests?: string[] | null;
  learning_style?: string | null;
  special_needs?: string | null;
  archived?: boolean | null;
}

// Tasks table schema
export interface TaskData {
  id: string;
  child_id: string;
  title: string;
  description?: string | null;
  category: string;
  type: 'chore' | 'exercise' | 'personal_care';
  status: 'pending' | 'completed' | 'skipped';
  points: number;
  negative_points?: number;
  due_date?: string | null;
  completed_at?: string | null;
}

// Rewards table schema
export interface RewardData {
  id: string;
  child_id?: string | null;
  title: string;
  description?: string | null;
  points_required: number;
  image_url?: string | null;
  redeemed: boolean;
  redeemed_at?: string | null;
  date_earned?: string | null;
}

// Local storage keys
const STORAGE_KEYS = {
  PARENT: 'ff_parent_data',
  CHILDREN: 'ff_children_data',
  TASKS: 'ff_tasks_data',
  REWARDS: 'ff_rewards_data',
  SYNC_QUEUE: 'ff_sync_queue',
  LAST_SYNC: 'ff_last_sync',
};

// Sync queue item
interface SyncQueueItem {
  id: string;
  operation: 'insert' | 'update' | 'delete';
  table: 'parents' | 'children' | 'tasks' | 'rewards' | 'settings';
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================
// NETWORK STATUS
// ============================================

let isOnline = true;

export async function checkNetwork(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    isOnline = state.isConnected ?? false;
    return isOnline;
  } catch {
    return false;
  }
}

export function getOnlineStatus(): boolean {
  return isOnline;
}

// ============================================
// SYNC QUEUE MANAGEMENT
// ============================================

async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getSyncQueue();
  const newItem: SyncQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  queue.push(newItem);
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

async function removeFromSyncQueue(id: string): Promise<void> {
  const queue = await getSyncQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
}

async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
}

// Helper to convert typed data to queue format
function toQueueData(data: ParentData | ChildData | TaskData | RewardData | { id: string }): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

// ============================================
// PARENT DATA SYNC
// ============================================

export async function saveParentLocally(data: ParentData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PARENT, JSON.stringify(data));
}

export async function getParentLocally(): Promise<ParentData | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PARENT);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function syncParentToCloud(data: ParentData): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    await addToSyncQueue({ operation: 'update', table: 'parents', data: toQueueData(data) });
    return { success: true };
  }

  const online = await checkNetwork();
  if (!online) {
    await addToSyncQueue({ operation: 'update', table: 'parents', data: toQueueData(data) });
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('parents')
      .upsert({
        id: data.id,
        email: data.email,
        name: data.name,
        subscription_tier: data.subscription_tier,
        plan_code: data.plan_code ?? 'free',
        updated_at: new Date().toISOString(),
      });

    if (error) {
      await addToSyncQueue({ operation: 'update', table: 'parents', data: toQueueData(data) });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    await addToSyncQueue({ operation: 'update', table: 'parents', data: toQueueData(data) });
    return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
  }
}

export async function fetchParentFromCloud(): Promise<ParentData | null> {
  if (!isSupabaseConfigured()) return null;

  const online = await checkNetwork();
  if (!online) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;

    const parentData: ParentData = {
      id: data.id,
      email: data.email,
      name: data.name,
      subscription_tier: data.subscription_tier as 'free' | 'premium',
      plan_code: data.plan_code,
      notification_settings: data.notification_settings as Record<string, unknown> | null,
      privacy_settings: data.privacy_settings as Record<string, unknown> | null,
      sync_settings: data.sync_settings as Record<string, unknown> | null,
    };

    // Save to local storage
    await saveParentLocally(parentData);

    return parentData;
  } catch {
    return null;
  }
}

// ============================================
// CHILDREN DATA SYNC
// ============================================

export async function saveChildrenLocally(children: ChildData[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
}

export async function getChildrenLocally(): Promise<ChildData[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHILDREN);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function syncChildToCloud(child: ChildData): Promise<{ success: boolean; error?: string }> {
  // Save locally first
  const children = await getChildrenLocally();
  const existingIndex = children.findIndex((c) => c.id === child.id);
  if (existingIndex >= 0) {
    children[existingIndex] = child;
  } else {
    children.push(child);
  }
  await saveChildrenLocally(children);

  if (!isSupabaseConfigured()) {
    await addToSyncQueue({ operation: existingIndex >= 0 ? 'update' : 'insert', table: 'children', data: toQueueData(child) });
    return { success: true };
  }

  const online = await checkNetwork();
  if (!online) {
    await addToSyncQueue({ operation: existingIndex >= 0 ? 'update' : 'insert', table: 'children', data: toQueueData(child) });
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('children')
      .upsert({
        id: child.id,
        parent_id: child.parent_id,
        name: child.name,
        nickname: child.nickname,
        age: child.age,
        birthday: child.birthday,
        avatar: child.avatar,
        picture: child.picture,
        class: child.class,
        school: child.school,
        school_schedule: child.school_schedule,
        email: child.email,
        points: child.points,
        interests: child.interests,
        learning_style: child.learning_style,
        special_needs: child.special_needs,
        archived: child.archived,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      await addToSyncQueue({ operation: 'update', table: 'children', data: toQueueData(child) });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    await addToSyncQueue({ operation: 'update', table: 'children', data: toQueueData(child) });
    return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
  }
}

export async function fetchChildrenFromCloud(parentId: string): Promise<ChildData[]> {
  if (!isSupabaseConfigured()) return [];

  const online = await checkNetwork();
  if (!online) return [];

  try {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId);

    if (error || !data) return [];

    const children: ChildData[] = data.map((row) => ({
      id: row.id,
      parent_id: row.parent_id,
      name: row.name,
      nickname: row.nickname,
      age: row.age ?? 0,
      birthday: row.birthday,
      avatar: row.avatar,
      picture: row.picture,
      class: row.class,
      school: row.school,
      school_schedule: row.school_schedule,
      email: row.email,
      points: row.points ?? 0,
      interests: row.interests,
      learning_style: row.learning_style,
      special_needs: row.special_needs,
      archived: row.archived,
    }));

    // Save to local storage
    await saveChildrenLocally(children);

    return children;
  } catch {
    return [];
  }
}

export async function deleteChildFromCloud(childId: string): Promise<{ success: boolean; error?: string }> {
  // Remove locally first
  const children = await getChildrenLocally();
  const filtered = children.filter((c) => c.id !== childId);
  await saveChildrenLocally(filtered);

  if (!isSupabaseConfigured()) {
    await addToSyncQueue({ operation: 'delete', table: 'children', data: { id: childId } });
    return { success: true };
  }

  const online = await checkNetwork();
  if (!online) {
    await addToSyncQueue({ operation: 'delete', table: 'children', data: { id: childId } });
    return { success: true };
  }

  try {
    const { error } = await supabase.from('children').delete().eq('id', childId);
    if (error) {
      await addToSyncQueue({ operation: 'delete', table: 'children', data: { id: childId } });
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
  }
}

// ============================================
// TASKS DATA SYNC
// ============================================

export async function saveTasksLocally(tasks: TaskData[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

export async function getTasksLocally(): Promise<TaskData[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function syncTaskToCloud(task: TaskData): Promise<{ success: boolean; error?: string }> {
  // Save locally first
  const tasks = await getTasksLocally();
  const existingIndex = tasks.findIndex((t) => t.id === task.id);
  if (existingIndex >= 0) {
    tasks[existingIndex] = task;
  } else {
    tasks.push(task);
  }
  await saveTasksLocally(tasks);

  if (!isSupabaseConfigured()) {
    await addToSyncQueue({ operation: existingIndex >= 0 ? 'update' : 'insert', table: 'tasks', data: toQueueData(task) });
    return { success: true };
  }

  const online = await checkNetwork();
  if (!online) {
    await addToSyncQueue({ operation: existingIndex >= 0 ? 'update' : 'insert', table: 'tasks', data: toQueueData(task) });
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .upsert({
        id: task.id,
        child_id: task.child_id,
        title: task.title,
        description: task.description,
        category: task.category,
        type: task.type,
        status: task.status,
        points: task.points,
        negative_points: task.negative_points,
        due_date: task.due_date,
        completed_at: task.completed_at,
      });

    if (error) {
      await addToSyncQueue({ operation: 'update', table: 'tasks', data: toQueueData(task) });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    await addToSyncQueue({ operation: 'update', table: 'tasks', data: toQueueData(task) });
    return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
  }
}

export async function fetchTasksFromCloud(childId?: string): Promise<TaskData[]> {
  if (!isSupabaseConfigured()) return [];

  const online = await checkNetwork();
  if (!online) return [];

  try {
    let query = supabase.from('tasks').select('*');
    
    // If childId provided, filter by child. Otherwise get all local children's tasks
    if (childId) {
      query = query.eq('child_id', childId);
    } else {
      // Get all children from local storage and filter tasks by their IDs
      const localChildren = await getChildrenLocally();
      if (localChildren.length === 0) return [];
      const childIds = localChildren.map(c => c.id);
      query = query.in('child_id', childIds);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    const tasks: TaskData[] = data.map((row) => ({
      id: row.id,
      child_id: row.child_id,
      title: row.title,
      description: row.description,
      category: row.category,
      type: row.type as 'chore' | 'exercise' | 'personal_care',
      status: row.status as 'pending' | 'completed' | 'skipped',
      points: row.points,
      negative_points: row.negative_points,
      due_date: row.due_date,
      completed_at: row.completed_at,
    }));

    // Save to local storage
    await saveTasksLocally(tasks);

    return tasks;
  } catch {
    return [];
  }
}

// ============================================
// REWARDS DATA SYNC
// ============================================

export async function saveRewardsLocally(rewards: RewardData[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
}

export async function getRewardsLocally(): Promise<RewardData[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REWARDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function syncRewardToCloud(reward: RewardData): Promise<{ success: boolean; error?: string }> {
  // Save locally first
  const rewards = await getRewardsLocally();
  const existingIndex = rewards.findIndex((r) => r.id === reward.id);
  if (existingIndex >= 0) {
    rewards[existingIndex] = reward;
  } else {
    rewards.push(reward);
  }
  await saveRewardsLocally(rewards);

  if (!isSupabaseConfigured()) {
    await addToSyncQueue({ operation: existingIndex >= 0 ? 'update' : 'insert', table: 'rewards', data: toQueueData(reward) });
    return { success: true };
  }

  const online = await checkNetwork();
  if (!online) {
    await addToSyncQueue({ operation: existingIndex >= 0 ? 'update' : 'insert', table: 'rewards', data: toQueueData(reward) });
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('rewards')
      .upsert({
        id: reward.id,
        child_id: reward.child_id,
        title: reward.title,
        description: reward.description,
        points_required: reward.points_required,
        image_url: reward.image_url,
        redeemed: reward.redeemed,
        redeemed_at: reward.redeemed_at,
        date_earned: reward.date_earned,
      });

    if (error) {
      await addToSyncQueue({ operation: 'update', table: 'rewards', data: toQueueData(reward) });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    await addToSyncQueue({ operation: 'update', table: 'rewards', data: toQueueData(reward) });
    return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
  }
}

export async function fetchRewardsFromCloud(childId?: string): Promise<RewardData[]> {
  if (!isSupabaseConfigured()) return [];

  const online = await checkNetwork();
  if (!online) return [];

  try {
    let query = supabase.from('rewards').select('*');

    // If childId provided, filter by child. Otherwise get all local children's rewards
    if (childId) {
      query = query.eq('child_id', childId);
    } else {
      // Get all children from local storage and filter rewards by their IDs
      const localChildren = await getChildrenLocally();
      if (localChildren.length === 0) return [];
      const childIds = localChildren.map(c => c.id);
      query = query.in('child_id', childIds);
    }
    
    const { data, error } = await query;

    if (error || !data) return [];

    const rewards: RewardData[] = data.map((row) => ({
      id: row.id,
      child_id: row.child_id,
      title: row.title,
      description: row.description,
      points_required: row.points_required,
      image_url: row.image_url,
      redeemed: row.redeemed ?? false,
      redeemed_at: row.redeemed_at,
      date_earned: row.date_earned,
    }));

    // Save to local storage
    await saveRewardsLocally(rewards);

    return rewards;
  } catch {
    return [];
  }
}

// ============================================
// FULL SYNC (Pull all data from cloud)
// ============================================

export async function pullAllDataFromCloud(parentId: string): Promise<{
  success: boolean;
  parent: ParentData | null;
  children: ChildData[];
  tasks: TaskData[];
  rewards: RewardData[];
}> {
  // First fetch parent and children
  const [parent, children] = await Promise.all([
    fetchParentFromCloud(),
    fetchChildrenFromCloud(parentId),
  ]);

  // Then fetch tasks and rewards (which depend on children being loaded)
  const [tasks, rewards] = await Promise.all([
    fetchTasksFromCloud(),
    fetchRewardsFromCloud(),
  ]);

  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

  return {
    success: true,
    parent,
    children,
    tasks,
    rewards,
  };
}

// ============================================
// PROCESS SYNC QUEUE (Push pending changes)
// ============================================

export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  if (!isSupabaseConfigured()) {
    return { processed: 0, failed: 0 };
  }

  const online = await checkNetwork();
  if (!online) {
    return { processed: 0, failed: 0 };
  }

  const queue = await getSyncQueue();
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.operation === 'delete') {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', item.data.id as string);
        if (!error) {
          await removeFromSyncQueue(item.id);
          processed++;
        } else {
          failed++;
        }
      } else {
        const { error } = await supabase
          .from(item.table)
          .upsert(item.data as never);
        if (!error) {
          await removeFromSyncQueue(item.id);
          processed++;
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  if (processed > 0) {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  return { processed, failed };
}

// ============================================
// GET SYNC STATUS
// ============================================

export async function getSyncStatus(): Promise<SyncStatus> {
  const queue = await getSyncQueue();
  const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  const online = await checkNetwork();

  return {
    isOnline: online,
    lastSyncAt: lastSync,
    pendingChanges: queue.length,
    syncInProgress: false,
  };
}

// ============================================
// GET DATA WITH FALLBACK (Local first, then cloud)
// ============================================

export async function getParentWithFallback(): Promise<ParentData | null> {
  // 1. Check local first
  const localData = await getParentLocally();
  if (localData) {
    // Background fetch from cloud to update local
    fetchParentFromCloud().catch(() => {});
    return localData;
  }

  // 2. Fall back to cloud
  return fetchParentFromCloud();
}

export async function getChildrenWithFallback(parentId: string): Promise<ChildData[]> {
  // 1. Check local first
  const localData = await getChildrenLocally();
  if (localData.length > 0) {
    // Background fetch from cloud to update local
    fetchChildrenFromCloud(parentId).catch(() => {});
    return localData;
  }

  // 2. Fall back to cloud
  return fetchChildrenFromCloud(parentId);
}

export async function getTasksWithFallback(childId?: string): Promise<TaskData[]> {
  // 1. Check local first
  const localData = await getTasksLocally();
  if (localData.length > 0) {
    // Background fetch from cloud to update local
    fetchTasksFromCloud(childId).catch(() => {});
    return childId ? localData.filter(t => t.child_id === childId) : localData;
  }

  // 2. Fall back to cloud
  return fetchTasksFromCloud(childId);
}

export async function getRewardsWithFallback(childId?: string): Promise<RewardData[]> {
  // 1. Check local first
  const localData = await getRewardsLocally();
  if (localData.length > 0) {
    // Background fetch from cloud to update local
    fetchRewardsFromCloud(childId).catch(() => {});
    return childId ? localData.filter(r => r.child_id === childId) : localData;
  }

  // 2. Fall back to cloud
  return fetchRewardsFromCloud(childId);
}

// ============================================
// CLEAR ALL LOCAL DATA
// ============================================

export async function clearAllLocalData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.PARENT),
    AsyncStorage.removeItem(STORAGE_KEYS.CHILDREN),
    AsyncStorage.removeItem(STORAGE_KEYS.TASKS),
    AsyncStorage.removeItem(STORAGE_KEYS.REWARDS),
    AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE),
    AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
  ]);
}
