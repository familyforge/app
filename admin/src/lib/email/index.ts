/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FamilyForge Email System - Admin UI Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️  IMPORTANT: These are ADMIN DASHBOARD UI utilities, NOT the email
 *     template system itself.
 * 
 * The actual email templates are in:
 *   → supabase/functions/send-email/index.ts (Email System Pro)
 *   → See supabase/functions/send-email/WARNING.md for docs
 * 
 * This module provides advanced email MANAGEMENT functionality:
 *   - Analytics dashboards
 *   - Scheduling & automation
 *   - A/B testing & segmentation
 *   - Preview & dry-run testing
 *   - Compliance monitoring
 * 
 * All components are ADDITIVE extensions to the existing EmailSystemPage
 * in App.tsx. They do not modify or replace the email templates.
 * 
 * ══════════════════════════════════════════════════════════════════════
 * INTEGRATION OPTIONS
 * ══════════════════════════════════════════════════════════════════════
 * 
 * OPTION A: Full Enhanced Experience (Recommended)
 * ------------------------------------------------
 * Use EmailSystemEnhanced as a wrapper that adds tab navigation:
 * 
 *   import { EmailSystemEnhanced } from '@/lib/email';
 * 
 *   <EmailSystemEnhanced
 *     renderTemplates={() => <YourExistingEmailContent />}
 *     selectedTemplateId={selectedId}
 *     selectedTemplateName={selectedName}
 *   />
 * 
 * 
 * OPTION B: Individual Components
 * --------------------------------
 * Add features piecemeal to your existing page.
 * 
 * 
 * OPTION C: Toolbar Only
 * ----------------------
 * Add a quick-actions toolbar:
 * 
 *   import { EmailToolbar, EmailStatusBadge } from '@/lib/email';
 * 
 * ══════════════════════════════════════════════════════════════════════
 */

// Types
export * from './types';

// Reusable Email Blocks
export * from './email-blocks';

// Database API
export * from './email-api';

// Main Enhanced Wrapper (Tab-based UI)
export { 
  EmailSystemEnhanced, 
  EmailToolbar, 
  EmailStatusBadge,
  default as EmailSystemEnhancedDefault 
} from './EmailSystemEnhanced';

// Individual UI Components  
export { EmailPreview, InlineEmailPreview, EmailThumbnail, validateEmailHtml } from './email-preview';
export { EmailAnalyticsDashboard } from './email-analytics';
export { EmailScheduler, SchedulerList, QuickScheduleButton } from './email-scheduling';
export { SegmentEditor, SegmentList, SegmentFilterBuilder, QuickSegmentSelector } from './email-segmentation';
export { ComplianceDashboard } from './email-compliance';
export { VersionHistory, SaveVersionButton, VersionCompare } from './email-versioning';
export { DryRunMode, DryRunButton } from './email-dry-run';

/**
 * DATABASE SETUP (Required):
 * Run: supabase/migrations/007_email_system_extension.sql
 * 
 * Tables created:
 * - email_template_versions: Version history 
 * - email_schedules: Scheduled jobs
 * - email_audience_segments: Audience filters
 * - email_delivery_records: Delivery tracking
 * - email_analytics_daily: Daily metrics
 * - email_system_config: Kill switch, quiet hours
 * - email_compliance_records: GDPR/CAN-SPAM
 * - email_unsubscribes: Opt-out list  
 * - email_blocks: Custom blocks
 * - email_dry_runs: Simulation results
 */
