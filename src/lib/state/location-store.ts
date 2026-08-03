import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type LocationStatus = 'live' | 'recent' | 'offline';

export interface ChildLocation {
  childId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  status: LocationStatus;
  accuracy?: number;
  batteryLevel?: number;
  /**
   * Human-readable place, when reverse geocoding has resolved one.
   * findmykids.tsx has always rendered this with a lat/long fallback, but the
   * field was never declared — so it read undefined and every location showed
   * as coordinates.
   */
  placeName?: string;
  isAppInstalled: boolean;
  hasPermission: boolean;
}

export interface LocationPermission {
  childId: string;
  trackingEnabled: boolean;
  authorizedViewers: string[]; // user IDs who can view this child's location
}

export interface LocationHistory {
  childId: string;
  locations: Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
  }>;
}

interface LocationState {
  // Current locations
  childLocations: Record<string, ChildLocation>;
  
  // Permissions
  permissions: Record<string, LocationPermission>;
  
  // Location history (limited to 30 days)
  history: Record<string, LocationHistory>;
  
  // Feature toggle
  findMyKidsEnabled: boolean;
  
  // Actions
  setFindMyKidsEnabled: (enabled: boolean) => void;
  updateChildLocation: (location: ChildLocation) => void;
  setTrackingEnabled: (childId: string, enabled: boolean) => void;
  addAuthorizedViewer: (childId: string, viewerId: string) => void;
  removeAuthorizedViewer: (childId: string, viewerId: string) => void;
  clearLocationHistory: (childId: string) => void;
  getChildLocation: (childId: string) => ChildLocation | null;
  isViewerAuthorized: (childId: string, viewerId: string) => boolean;
  getLocationStatus: (timestamp: number) => LocationStatus;
}

// Helper to determine location status based on timestamp
const getLocationStatus = (timestamp: number): LocationStatus => {
  const now = Date.now();
  const diff = now - timestamp;
  const fiveMinutes = 5 * 60 * 1000;
  const fifteenMinutes = 15 * 60 * 1000;
  
  if (diff < fiveMinutes) return 'live';
  if (diff < fifteenMinutes) return 'recent';
  return 'offline';
};

// Mock locations for demo (San Francisco area)
const generateMockLocations = (): Record<string, ChildLocation> => ({
  '1': {
    childId: '1',
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: Date.now() - 2 * 60 * 1000, // 2 min ago - live
    status: 'live',
    accuracy: 10,
    batteryLevel: 85,
    isAppInstalled: true,
    hasPermission: true,
  },
  '2': {
    childId: '2',
    latitude: 37.7849,
    longitude: -122.4094,
    timestamp: Date.now() - 8 * 60 * 1000, // 8 min ago - recent
    status: 'recent',
    accuracy: 15,
    batteryLevel: 42,
    isAppInstalled: true,
    hasPermission: true,
  },
  '3': {
    childId: '3',
    latitude: 37.7649,
    longitude: -122.4294,
    timestamp: Date.now() - 30 * 60 * 1000, // 30 min ago - offline
    status: 'offline',
    accuracy: 20,
    batteryLevel: 15,
    isAppInstalled: true,
    hasPermission: true,
  },
});

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      // Initial state with mock data
      childLocations: generateMockLocations(),
      permissions: {
        '1': { childId: '1', trackingEnabled: true, authorizedViewers: ['parent-1'] },
        '2': { childId: '2', trackingEnabled: true, authorizedViewers: ['parent-1'] },
        '3': { childId: '3', trackingEnabled: true, authorizedViewers: ['parent-1'] },
      },
      history: {},
      findMyKidsEnabled: true,
      
      setFindMyKidsEnabled: (enabled) => set({ findMyKidsEnabled: enabled }),
      
      updateChildLocation: (location) => {
        set((state) => ({
          childLocations: {
            ...state.childLocations,
            [location.childId]: {
              ...location,
              status: getLocationStatus(location.timestamp),
            },
          },
        }));
        
        // Add to history (limited retention)
        const { history } = get();
        const childHistory = history[location.childId] || { childId: location.childId, locations: [] };
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        
        // Filter out old locations and add new one
        const updatedLocations = [
          ...childHistory.locations.filter((l) => l.timestamp > thirtyDaysAgo),
          {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp,
          },
        ].slice(-1000); // Keep max 1000 entries
        
        set((state) => ({
          history: {
            ...state.history,
            [location.childId]: {
              childId: location.childId,
              locations: updatedLocations,
            },
          },
        }));
      },
      
      setTrackingEnabled: (childId, enabled) => {
        set((state) => ({
          permissions: {
            ...state.permissions,
            [childId]: {
              ...state.permissions[childId],
              childId,
              trackingEnabled: enabled,
              authorizedViewers: state.permissions[childId]?.authorizedViewers || [],
            },
          },
        }));
      },
      
      addAuthorizedViewer: (childId, viewerId) => {
        set((state) => {
          const current = state.permissions[childId] || {
            childId,
            trackingEnabled: true,
            authorizedViewers: [],
          };
          
          if (current.authorizedViewers.includes(viewerId)) return state;
          
          return {
            permissions: {
              ...state.permissions,
              [childId]: {
                ...current,
                authorizedViewers: [...current.authorizedViewers, viewerId],
              },
            },
          };
        });
      },
      
      removeAuthorizedViewer: (childId, viewerId) => {
        set((state) => {
          const current = state.permissions[childId];
          if (!current) return state;
          
          return {
            permissions: {
              ...state.permissions,
              [childId]: {
                ...current,
                authorizedViewers: current.authorizedViewers.filter((id) => id !== viewerId),
              },
            },
          };
        });
      },
      
      clearLocationHistory: (childId) => {
        set((state) => {
          const { [childId]: _, ...rest } = state.history;
          return { history: rest };
        });
      },
      
      getChildLocation: (childId) => {
        const { childLocations } = get();
        return childLocations[childId] || null;
      },
      
      isViewerAuthorized: (childId, viewerId) => {
        const { permissions } = get();
        const permission = permissions[childId];
        if (!permission) return false;
        return permission.trackingEnabled && permission.authorizedViewers.includes(viewerId);
      },
      
      getLocationStatus,
    }),
    {
      name: 'location-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        permissions: state.permissions,
        findMyKidsEnabled: state.findMyKidsEnabled,
        // Don't persist locations or history - they're real-time
      }),
    }
  )
);
