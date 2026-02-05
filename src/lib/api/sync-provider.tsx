// FamilyForge - Sync Provider
// Manages offline-first data synchronization

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import {
  getSyncStatus,
  processSyncQueue,
  pullAllDataFromCloud,
  checkNetwork,
  type SyncStatus,
} from './data-sync';
import { getCurrentUser, isSupabaseConfigured } from './supabase';

// ============================================
// CONTEXT
// ============================================

interface SyncContextValue {
  status: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  syncNow: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface SyncProviderProps {
  children: React.ReactNode;
  /** Interval in ms for background sync (default: 30 seconds) */
  syncInterval?: number;
  /** Whether to sync immediately when coming online */
  syncOnReconnect?: boolean;
}

export function SyncProvider({
  children,
  syncInterval = 30000,
  syncOnReconnect = true,
}: SyncProviderProps) {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSyncAt: null,
    pendingChanges: 0,
    syncInProgress: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const wasOffline = useRef(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update sync status
  const refreshStatus = useCallback(async () => {
    const newStatus = await getSyncStatus();
    setStatus(newStatus);
  }, []);

  // Sync pending changes to cloud
  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await processSyncQueue();
      await refreshStatus();
    } catch (error) {
      console.warn('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshStatus]);

  // Pull all data from cloud
  const pullFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        await pullAllDataFromCloud(user.id);
        await refreshStatus();
      }
    } catch (error) {
      console.warn('Pull from cloud failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshStatus]);

  // Network change handler
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isNowOnline = state.isConnected ?? false;
      
      setStatus((prev) => ({ ...prev, isOnline: isNowOnline }));

      // If we just came back online and have pending changes, sync them
      if (isNowOnline && wasOffline.current && syncOnReconnect) {
        console.log('Back online - syncing pending changes...');
        await syncNow();
      }

      wasOffline.current = !isNowOnline;
    });

    return () => unsubscribe();
  }, [syncNow, syncOnReconnect]);

  // App state change handler (sync when app becomes active)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const isOnline = await checkNetwork();
        if (isOnline) {
          await syncNow();
        }
      }
    });

    return () => subscription.remove();
  }, [syncNow]);

  // Background sync interval
  useEffect(() => {
    if (syncInterval > 0) {
      syncIntervalRef.current = setInterval(async () => {
        const isOnline = await checkNetwork();
        if (isOnline && !isSyncing) {
          const currentStatus = await getSyncStatus();
          if (currentStatus.pendingChanges > 0) {
            await syncNow();
          }
        }
      }, syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncInterval, syncNow, isSyncing]);

  // Initial status check
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const value: SyncContextValue = {
    status,
    isOnline: status.isOnline,
    isSyncing,
    lastSyncAt: status.lastSyncAt,
    pendingChanges: status.pendingChanges,
    syncNow,
    pullFromCloud,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// ============================================
// HOOKS
// ============================================

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

export function useIsOnline(): boolean {
  const { isOnline } = useSync();
  return isOnline;
}

export function useSyncStatus(): SyncStatus {
  const { status } = useSync();
  return status;
}

export function usePendingChanges(): number {
  const { pendingChanges } = useSync();
  return pendingChanges;
}
