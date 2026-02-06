// Admin Dashboard Types - Enterprise Grade Analytics
// FamilyForge Pro Parenting Admin Console

// ============================================
// TIME & DATE TYPES
// ============================================

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';
export type DateRange = {
  start: Date;
  end: Date;
};

export type Granularity = 'hour' | 'day' | 'week' | 'month';

// ============================================
// USER & LIFECYCLE TYPES
// ============================================

export type LifecycleState = 'signed_up' | 'onboarding' | 'onboarded' | 'active' | 'inactive' | 'churned';

export type UserSegment = 'all' | 'free' | 'trial' | 'forge' | 'pro' | 'churned' | 'at_risk';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: string | null;
  planCode: string;
  childrenCount: number;
  createdAt: string;
  lastActivityAt: string | null;
  lifecycleState: LifecycleState;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  deviceType: string | null;
  platform: string | null;
  country: string | null;
  tasksCompleted: number;
  rewardsRedeemed: number;
}

export interface UserDetail extends User {
  children: Child[];
  sessions: UserSession[];
  subscriptionHistory: SubscriptionEvent[];
  activityLog: ActivityLogEntry[];
  supportNotes: SupportNote[];
  flags: UserFlag[];
  onboardingEvents: OnboardingEvent[];
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  age: number;
  points: number;
  tasksCompleted: number;
  createdAt: string;
}

// ============================================
// ACTIVITY & SESSION TYPES
// ============================================

export interface ActivityLogEntry {
  id: string;
  parentId: string | null;
  childId: string | null;
  eventType: string;
  eventCategory: string;
  eventData: Record<string, unknown>;
  deviceType: string | null;
  platform: string | null;
  osVersion: string | null;
  appVersion: string | null;
  createdAt: string;
}

export interface UserSession {
  id: string;
  parentId: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  deviceType: string | null;
  platform: string | null;
  osVersion: string | null;
  appVersion: string | null;
  screensVisited: string[];
  actionsCount: number;
}

// ============================================
// ONBOARDING TYPES
// ============================================

export interface OnboardingEvent {
  id: string;
  parentId: string;
  stepName: string;
  stepIndex: number;
  completed: boolean;
  skipped: boolean;
  timeSpentSeconds: number;
  deviceType: string | null;
  platform: string | null;
  country: string | null;
  acquisitionSource: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface OnboardingFunnelStep {
  stepName: string;
  stepIndex: number;
  usersStarted: number;
  usersCompleted: number;
  usersSkipped: number;
  avgTimeSeconds: number;
  completionRate: number;
  dropOffRate: number;
}

export interface OnboardingAnalytics {
  totalStarted: number;
  totalCompleted: number;
  overallCompletionRate: number;
  avgTimeToComplete: number;
  funnelSteps: OnboardingFunnelStep[];
  dropOffPoints: { step: string; dropOffCount: number; percentage: number }[];
  byDevice: { device: string; completionRate: number; count: number }[];
  byPlatform: { platform: string; completionRate: number; count: number }[];
  bySource: { source: string; completionRate: number; count: number }[];
}

// ============================================
// SUBSCRIPTION & REVENUE TYPES
// ============================================

export type SubscriptionEventType = 
  | 'trial_started' 
  | 'converted' 
  | 'renewed' 
  | 'cancelled' 
  | 'failed_payment' 
  | 'reactivated'
  | 'upgraded'
  | 'downgraded';

export type BillingCycle = 'monthly' | 'yearly';
export type Platform = 'ios' | 'android' | 'web';

export interface SubscriptionEvent {
  id: string;
  parentId: string | null;
  eventType: SubscriptionEventType;
  planCode: string | null;
  billingCycle: BillingCycle | null;
  platform: Platform | null;
  amountCents: number;
  currency: string;
  previousPlan: string | null;
  trialDaysRemaining: number | null;
  gracePeriodDays: number | null;
  failureReason: string | null;
  externalTransactionId: string | null;
  createdAt: string;
}

export interface RevenueSnapshot {
  id: string;
  snapshotDate: string;
  mrrCents: number;
  arrCents: number;
  newMrrCents: number;
  churnedMrrCents: number;
  expansionMrrCents: number;
  totalSubscribers: number;
  newSubscribers: number;
  churnedSubscribers: number;
  trialUsers: number;
  trialConversions: number;
  freeUsers: number;
  forgePlanUsers: number;
  proPlanUsers: number;
  iosSubscribers: number;
  androidSubscribers: number;
  webSubscribers: number;
}

export interface SubscriptionAnalytics {
  currentMrr: number;
  currentArr: number;
  mrrGrowth: number; // percentage
  churnRate: number;
  conversionRate: number;
  trialToPaidRate: number;
  avgRevenuePerUser: number;
  lifetimeValue: number;
  byPlan: { plan: string; count: number; mrr: number; percentage: number }[];
  byPlatform: { platform: Platform; count: number; mrr: number; percentage: number }[];
  byCycle: { cycle: BillingCycle; count: number; mrr: number; percentage: number }[];
  revenueHistory: { date: string; mrr: number; arr: number }[];
  churnHistory: { date: string; churned: number; churnRate: number }[];
  failedPayments: { date: string; count: number; amountCents: number }[];
  upcomingRenewals: { date: string; count: number; estimatedRevenueCents: number }[];
}

// ============================================
// APP HEALTH TYPES
// ============================================

export type ErrorType = 'crash' | 'exception' | 'network_error' | 'validation_error';

export interface AppError {
  id: string;
  parentId: string | null;
  errorType: ErrorType;
  errorMessage: string | null;
  errorStack: string | null;
  component: string | null;
  screen: string | null;
  deviceType: string | null;
  platform: string | null;
  osVersion: string | null;
  appVersion: string | null;
  occurredAt: string;
}

export interface FeatureUsage {
  featureName: string;
  uniqueUsers: number;
  totalUses: number;
  lastUsed: string;
  deviceTypes: number;
  platforms: number;
  trend: number; // percentage change from previous period
}

export interface AppHealthAnalytics {
  crashRate: number; // crashes per 1000 sessions
  crashRateTrend: number;
  errorCount: number;
  errorsByType: { type: ErrorType; count: number; percentage: number }[];
  errorsByScreen: { screen: string; count: number; percentage: number }[];
  errorsByPlatform: { platform: Platform; count: number; crashRate: number }[];
  errorsByVersion: { version: string; count: number; crashRate: number }[];
  topErrors: AppError[];
  featureUsage: FeatureUsage[];
  sessionHealth: {
    avgDuration: number;
    avgDurationTrend: number;
    abnormalSessions: number;
    bounceRate: number;
  };
}

// ============================================
// ENGAGEMENT TYPES
// ============================================

export interface EngagementSnapshot {
  id: string;
  snapshotDate: string;
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  returningUsers: number;
  tasksCreated: number;
  tasksCompleted: number;
  rewardsCreated: number;
  rewardsRedeemed: number;
  exercisesCompleted: number;
  avgSessionDurationSeconds: number;
  avgSessionsPerUser: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
}

export interface UserStreak {
  id: string;
  parentId: string;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface EngagementAnalytics {
  dau: number;
  dauTrend: number;
  wau: number;
  wauTrend: number;
  mau: number;
  mauTrend: number;
  dauWauRatio: number; // stickiness
  dauMauRatio: number;
  avgSessionDuration: number;
  avgSessionDurationTrend: number;
  avgSessionsPerUser: number;
  retentionCohorts: {
    cohort: string;
    d1: number;
    d7: number;
    d14: number;
    d30: number;
    d60: number;
    d90: number;
  }[];
  engagementHistory: { date: string; dau: number; wau: number; mau: number }[];
  taskMetrics: {
    created: number;
    completed: number;
    completionRate: number;
    trend: number;
  };
  rewardMetrics: {
    created: number;
    redeemed: number;
    redemptionRate: number;
    trend: number;
  };
  learningMetrics: {
    exercisesStarted: number;
    exercisesCompleted: number;
    completionRate: number;
    trend: number;
  };
  habitFormation: {
    usersWithStreaks: number;
    avgStreakLength: number;
    topStreakTypes: { type: string; avgStreak: number; usersCount: number }[];
  };
}

// ============================================
// ADMIN & SUPPORT TYPES
// ============================================

export type AdminActionType = 'view' | 'edit' | 'delete' | 'flag' | 'reset' | 'export' | 'note';

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  actionType: AdminActionType;
  targetType: string | null;
  targetId: string | null;
  actionData: Record<string, unknown>;
  ipAddress: string | null;
  reversible: boolean;
  reversedAt: string | null;
  reversedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export type SupportNoteType = 'general' | 'issue' | 'resolution' | 'escalation';

export interface SupportNote {
  id: string;
  parentId: string;
  adminEmail: string;
  noteType: SupportNoteType;
  content: string;
  tags: string[];
  isInternal: boolean;
  createdAt: string;
}

export type FlagType = 'at_risk' | 'churned' | 'vip' | 'support_needed' | 'abuse_suspected';

export interface UserFlag {
  id: string;
  parentId: string;
  flagType: FlagType;
  flagReason: string | null;
  flaggedBy: string;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  email: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

// ============================================
// DASHBOARD STATE TYPES
// ============================================

export type AdminRole = 'superadmin' | 'admin' | 'support' | 'analyst';

export type AdminPage =
  | 'overview'
  | 'analytics'
  | 'users'
  | 'user-detail'
  | 'onboarding'
  | 'subscriptions'
  | 'app-health'
  | 'engagement'
  | 'support'
  | 'operations'
  | 'exports'
  | 'settings'
  | 'email-system';

export interface DashboardFilters {
  timeRange: TimeRange;
  customDateRange: DateRange | null;
  platform: Platform | 'all';
  segment: UserSegment;
  country: string | 'all';
}

export interface UserPreferences {
  defaultTimeRange: TimeRange;
  defaultPage: AdminPage;
  savedFilters: Record<string, DashboardFilters>;
  pinnedMetrics: string[];
  collapsedSections: string[];
  theme: 'dark' | 'light';
}

// ============================================
// METRIC & TREND TYPES
// ============================================

export interface MetricValue {
  value: number;
  previousValue: number;
  change: number; // absolute change
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  isGood: boolean; // whether the trend direction is positive
}

export interface OverviewMetrics {
  totalUsers: MetricValue;
  activeUsers: MetricValue;
  mrr: MetricValue;
  churnRate: MetricValue;
  onboardingRate: MetricValue;
  taskCompletionRate: MetricValue;
  avgSessionDuration: MetricValue;
  nps: MetricValue;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface Anomaly {
  id: string;
  metricName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  acknowledged: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AnalyticsResponse<T> {
  data: T;
  generatedAt: string;
  cacheExpiry: string;
  timeRange: DateRange;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
  lastFetched: string | null;
}

// ============================================
// EXPORT TYPES
// ============================================

export type ExportFormat = 'csv' | 'pdf' | 'json';

export interface ExportRequest {
  id: string;
  type: string;
  filters: DashboardFilters;
  format: ExportFormat;
  requestedBy: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}
