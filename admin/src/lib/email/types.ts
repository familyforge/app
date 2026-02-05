// Email System Types - Additive Extension
// These types extend the existing Email System without modifying it

export type EmailCategory = 
  | 'system_critical'
  | 'educational'
  | 'motivational'
  | 'weekly_summary'
  | 'reminder'
  | 'reward'
  | 'onboarding'
  | 'engagement'
  | 'conversion'
  | 'reports'
  | 'custom';

export type ParentingRole = 'father' | 'mother' | 'other';

export type EngagementLevel = 'high' | 'medium' | 'low' | 'inactive';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';

// Email Template with versioning support
export interface EmailTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  htmlContent: string;
  plainText: string;
  subject: string;
  editorEmail: string;
  editorName: string;
  changelog: string;
  createdAt: string;
  isActive: boolean;
}

// Extended template metadata
export interface EmailTemplateExtended {
  id: string;
  name: string;
  description: string;
  trigger: string;
  category: EmailCategory;
  currentVersion: number;
  versions: EmailTemplateVersion[];
  createdAt: string;
  updatedAt: string;
  isEnabled: boolean;
}

// Scheduling configuration
export interface EmailSchedule {
  id: string;
  templateId: string;
  scheduledAt: string; // ISO datetime
  timezone: string;
  status: 'scheduled' | 'processing' | 'completed' | 'cancelled' | 'failed';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  segmentFilters?: SegmentFilters | null;
  createdBy: string;
  createdAt: string;
}

// Quiet hours configuration
export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
  timezone: string;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
}

// Throttling configuration
export interface ThrottleConfig {
  enabled: boolean;
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
  batchSize: number;
  batchDelayMs: number;
}

// Audience segmentation filters
export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  filters: SegmentFilters;
  estimatedCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentFilters {
  parentingRole?: ParentingRole[];
  childrenCount?: { min?: number; max?: number };
  engagementLevel?: EngagementLevel[];
  taskCompletionRate?: { min?: number; max?: number };
  lastActiveWithinDays?: number;
  inactiveDays?: number;
  countries?: string[];
  languages?: string[];
  subscriptionTier?: ('free' | 'premium')[];
  registeredAfter?: string;
  registeredBefore?: string;
}

// Email delivery record
export interface EmailDeliveryRecord {
  id: string;
  templateId: string;
  templateVersion: number;
  recipientEmail: string;
  recipientId: string;
  status: DeliveryStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  metadata: Record<string, unknown>;
}

// Analytics metrics
export interface EmailAnalytics {
  templateId: string;
  period: 'day' | 'week' | 'month' | 'all';
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  periodStart?: string;
  periodEnd?: string;
}

// Global email system configuration
export interface EmailSystemConfig {
  globalKillSwitch: boolean;
  killSwitchEnabledAt: string | null;
  killSwitchEnabledBy: string | null;
  defaultFromName: string;
  defaultFromEmail: string;
  defaultReplyTo: string;
  quietHours: QuietHoursConfig;
  throttle: ThrottleConfig;
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
  };
  unsubscribeUrl: string;
  companyAddress: string;
}

// Dry-run result
export interface DryRunResult {
  id: string;
  templateId: string;
  templateName: string;
  executedAt: string;
  executedBy: string;
  segmentFilters: SegmentFilters | null;
  totalRecipients: number;
  recipients: Array<{
    email: string;
    name: string;
    parentingRole: ParentingRole | null;
    childrenCount: number;
    engagementLevel: EngagementLevel;
  }>;
  estimatedSendTime: string;
  warnings: string[];
}

// Reusable email block
export interface EmailBlock {
  id: string;
  name: string;
  description: string;
  type: 'header' | 'cta' | 'quote' | 'steps' | 'footer' | 'divider' | 'feature_card' | 'testimonial';
  htmlTemplate: string;
  previewImage?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean; // System blocks are built-in and cannot be deleted
}

// AI prompt modifier
export interface PromptModifier {
  id: string;
  label: string;
  description: string;
  promptAddition: string;
  icon: string;
}

// Compliance record
export interface ComplianceRecord {
  id: string;
  type: 'unsubscribe' | 'data_export' | 'data_deletion' | 'consent_update';
  userEmail: string;
  userId: string;
  requestedAt: string;
  processedAt: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
}

// Email preview configuration
export interface EmailPreviewConfig {
  templateId: string;
  version?: number;
  previewData: Record<string, string>;
  recipientEmail?: string;
}

// Brand constants for email design
export const EMAIL_BRAND = {
  logoUrl: 'https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png',
  primaryColor: '#8b5cf6',
  secondaryColor: '#4f46e5',
  accentColor: '#f59e0b', // Gold accent
  accentGreen: '#10b981',
  accentGold: '#f59e0b',
  backgroundColor: '#0f0a1f',
  cardBackground: 'rgba(30, 20, 50, 0.9)',
  textPrimary: '#ffffff',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textAccent: '#a78bfa',
  textDark: '#2d1b4e', // Dark text for light backgrounds
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  companyName: 'FamilyForge',
  tagline: 'Rewards & Growth for Kids',
  appUrl: 'https://familyforge.app',
  supportEmail: 'support@familyforge.app',
} as const;
