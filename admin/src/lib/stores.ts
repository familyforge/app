// Admin Dashboard State Management
// Zustand stores with simpler flat interfaces

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  TimeRange,
  DateRange,
  AdminPage,
  AdminRole,
  UserPreferences,
  LoadingState,
  User,
  UserDetail,
  OnboardingAnalytics,
  SubscriptionAnalytics,
  AppHealthAnalytics,
  EngagementAnalytics,
  Anomaly,
  OverviewMetrics,
} from './types';

// ============================================
// FILTER STORE
// ============================================

interface FilterState {
  timeRange: TimeRange;
  customDateRange: DateRange | null;
  searchQuery: string;
  platform: 'all' | 'ios' | 'android' | 'web';
  segment: 'all' | 'free' | 'paid' | 'churned' | 'new' | 'active' | 'inactive';
  country: string;
  setTimeRange: (range: TimeRange) => void;
  setCustomDateRange: (range: DateRange | null) => void;
  setSearchQuery: (query: string) => void;
  setPlatform: (platform: 'all' | 'ios' | 'android' | 'web') => void;
  setSegment: (segment: 'all' | 'free' | 'paid' | 'churned' | 'new' | 'active' | 'inactive') => void;
  setCountry: (country: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      timeRange: '30d',
      customDateRange: null,
      searchQuery: '',
      platform: 'all',
      segment: 'all',
      country: 'all',
      setTimeRange: (timeRange) => set({ timeRange, customDateRange: null }),
      setCustomDateRange: (customDateRange) => set({ timeRange: 'custom', customDateRange }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setPlatform: (platform) => set({ platform }),
      setSegment: (segment) => set({ segment }),
      setCountry: (country) => set({ country }),
      resetFilters: () =>
        set({
          timeRange: '30d',
          customDateRange: null,
          searchQuery: '',
          platform: 'all',
          segment: 'all',
          country: 'all',
        }),
    }),
    {
      name: 'admin-filters',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================
// AUTH & PREFERENCES STORE
// ============================================

interface AuthState {
  isAuthenticated: boolean;
  currentEmail: string;
  role: AdminRole;
  preferences: UserPreferences;
  setAuthenticated: (authenticated: boolean, email?: string, role?: AdminRole) => void;
  setRole: (role: AdminRole) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  logout: () => void;
}

const defaultPreferences: UserPreferences = {
  defaultTimeRange: '30d',
  defaultPage: 'overview',
  savedFilters: {},
  pinnedMetrics: ['dau', 'mrr', 'churnRate', 'onboardingRate'],
  collapsedSections: [],
  theme: 'dark',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentEmail: '',
      role: 'admin',
      preferences: defaultPreferences,
      setAuthenticated: (isAuthenticated, email = '', role = 'admin') =>
        set({ isAuthenticated, currentEmail: email, role }),
      setRole: (role) => set({ role }),
      updatePreferences: (updates) =>
        set((state) => ({ preferences: { ...state.preferences, ...updates } })),
      logout: () =>
        set({ isAuthenticated: false, currentEmail: '', role: 'admin' }),
    }),
    {
      name: 'admin-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================
// NAVIGATION STORE
// ============================================

interface NavigationState {
  currentPage: AdminPage;
  selectedUserId: string | null;
  sidebarCollapsed: boolean;
  setPage: (page: AdminPage) => void;
  setSelectedUser: (userId: string | null) => void;
  toggleSidebar: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      currentPage: 'overview',
      selectedUserId: null,
      sidebarCollapsed: false,
      setPage: (currentPage) => set({ currentPage, selectedUserId: null }),
      setSelectedUser: (selectedUserId) =>
        set({ selectedUserId, currentPage: selectedUserId ? 'user-detail' : 'users' }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'admin-navigation',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================
// OVERVIEW DATA STORE
// ============================================

interface OverviewState {
  metrics: OverviewMetrics | null;
  anomalies: Anomaly[];
  status: LoadingState;
  error: string | null;
  lastFetched: number | null;
  setMetrics: (metrics: OverviewMetrics | null) => void;
  setAnomalies: (anomalies: Anomaly[]) => void;
  setStatus: (status: LoadingState) => void;
  setError: (error: string | null) => void;
  setLastFetched: (timestamp: number) => void;
}

export const useOverviewStore = create<OverviewState>((set) => ({
  metrics: null,
  anomalies: [],
  status: 'idle',
  error: null,
  lastFetched: null,
  setMetrics: (metrics) => set({ metrics }),
  setAnomalies: (anomalies) => set({ anomalies }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
}));

// ============================================
// USERS STORE
// ============================================

interface UsersState {
  users: User[];
  selectedUser: UserDetail | null;
  total: number;
  page: number;
  pageSize: number;
  status: LoadingState;
  error: string | null;
  setUsers: (users: User[]) => void;
  setSelectedUser: (user: UserDetail | null) => void;
  setTotal: (total: number) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setStatus: (status: LoadingState) => void;
  setError: (error: string | null) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  selectedUser: null,
  total: 0,
  page: 1,
  pageSize: 25,
  status: 'idle',
  error: null,
  setUsers: (users) => set({ users }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setTotal: (total) => set({ total }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));

// ============================================
// ANALYTICS STORES
// ============================================

interface OnboardingState {
  analytics: OnboardingAnalytics | null;
  status: LoadingState;
  error: string | null;
  setAnalytics: (analytics: OnboardingAnalytics | null) => void;
  setStatus: (status: LoadingState) => void;
  setError: (error: string | null) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  analytics: null,
  status: 'idle',
  error: null,
  setAnalytics: (analytics) => set({ analytics }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));

interface SubscriptionState {
  analytics: SubscriptionAnalytics | null;
  status: LoadingState;
  error: string | null;
  setAnalytics: (analytics: SubscriptionAnalytics | null) => void;
  setStatus: (status: LoadingState) => void;
  setError: (error: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  analytics: null,
  status: 'idle',
  error: null,
  setAnalytics: (analytics) => set({ analytics }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));

interface AppHealthState {
  analytics: AppHealthAnalytics | null;
  status: LoadingState;
  error: string | null;
  setAnalytics: (analytics: AppHealthAnalytics | null) => void;
  setStatus: (status: LoadingState) => void;
  setError: (error: string | null) => void;
}

export const useAppHealthStore = create<AppHealthState>((set) => ({
  analytics: null,
  status: 'idle',
  error: null,
  setAnalytics: (analytics) => set({ analytics }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));

interface EngagementState {
  analytics: EngagementAnalytics | null;
  status: LoadingState;
  error: string | null;
  setAnalytics: (analytics: EngagementAnalytics | null) => void;
  setStatus: (status: LoadingState) => void;
  setError: (error: string | null) => void;
}

export const useEngagementStore = create<EngagementState>((set) => ({
  analytics: null,
  status: 'idle',
  error: null,
  setAnalytics: (analytics) => set({ analytics }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));

// ============================================
// SUPPORT STORE
// ============================================

interface SupportState {
  tickets: unknown[];
  auditLog: unknown[];
  status: LoadingState;
  error: string | null;
  setTickets: (tickets: unknown[]) => void;
  setAuditLog: (entries: unknown[]) => void;
  setStatus: (status: LoadingState) => void;
  setError: (error: string | null) => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  tickets: [],
  auditLog: [],
  status: 'idle',
  error: null,
  setTickets: (tickets) => set({ tickets }),
  setAuditLog: (auditLog) => set({ auditLog }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));

// ============================================
// CACHE UTILITIES
// ============================================

export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function isCacheValid(lastFetched: number | null): boolean {
  if (!lastFetched) return false;
  return Date.now() - lastFetched < CACHE_TTL;
}

export function shouldRefetch(lastFetched: number | null, status: LoadingState): boolean {
  if (status === 'loading') return false;
  return !isCacheValid(lastFetched);
}

// ============================================
// DATE UTILITIES
// ============================================

export function getDateRangeFromTimeRange(timeRange: TimeRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (timeRange) {
    case '24h':
      start.setHours(start.getHours() - 24);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
};

export const formatDateForQuery = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
