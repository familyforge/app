/**
 * FamilyForge Email System - API Module
 * 
 * Database operations for the email system extension.
 * These functions interact with Supabase tables created by the migration.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as supabaseRaw } from '../supabase';
import type { Database, Json } from '../../../../src/lib/api/database.types';
import type {
  EmailTemplateVersion,
  EmailTemplateExtended,
  EmailSchedule,
  AudienceSegment,
  SegmentFilters,
  EmailDeliveryRecord,
  EmailAnalytics,
  EmailSystemConfig,
  DryRunResult,
  EmailBlock,
  ComplianceRecord,
  QuietHoursConfig,
  ThrottleConfig,
} from './types';

const supabase = supabaseRaw as unknown as SupabaseClient<Database>;

const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  enabled: false,
  startHour: 22,
  endHour: 7,
  timezone: 'UTC',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
};

const DEFAULT_THROTTLE: ThrottleConfig = {
  enabled: false,
  maxPerMinute: 100,
  maxPerHour: 1000,
  maxPerDay: 10000,
  batchSize: 50,
  batchDelayMs: 1000,
};

const DEFAULT_RETRY_CONFIG: EmailSystemConfig['retryConfig'] = {
  maxRetries: 3,
  retryDelayMs: 60000,
  exponentialBackoff: true,
};

// ============== SYSTEM CONFIG ==============

export async function getEmailSystemConfig(): Promise<EmailSystemConfig | null> {
  const { data, error } = await supabase
    .from('email_system_config')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) {
    console.error('Error fetching email system config:', error);
    return null;
  }

  return {
    globalKillSwitch: data.global_kill_switch ?? false,
    killSwitchEnabledAt: data.kill_switch_enabled_at,
    killSwitchEnabledBy: data.kill_switch_enabled_by,
    defaultFromName: data.default_from_name ?? 'FamilyForge',
    defaultFromEmail: data.default_from_email ?? 'hello@familyforge.app',
    defaultReplyTo: data.default_reply_to ?? 'support@familyforge.app',
    quietHours: (data.quiet_hours as typeof DEFAULT_QUIET_HOURS | null) ?? DEFAULT_QUIET_HOURS,
    throttle: (data.throttle as typeof DEFAULT_THROTTLE | null) ?? DEFAULT_THROTTLE,
    retryConfig: (data.retry_config as typeof DEFAULT_RETRY_CONFIG | null) ?? DEFAULT_RETRY_CONFIG,
    unsubscribeUrl: data.unsubscribe_url ?? 'https://familyforge.app/unsubscribe',
    companyAddress: data.company_address ?? 'FamilyForge, Inc.',
  };
}

export async function updateEmailSystemConfig(
  config: Partial<EmailSystemConfig>,
  updatedBy: string
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  if (config.globalKillSwitch !== undefined) {
    updateData.global_kill_switch = config.globalKillSwitch;
    if (config.globalKillSwitch) {
      updateData.kill_switch_enabled_at = new Date().toISOString();
      updateData.kill_switch_enabled_by = updatedBy;
    } else {
      updateData.kill_switch_enabled_at = null;
      updateData.kill_switch_enabled_by = null;
    }
  }
  if (config.defaultFromName) updateData.default_from_name = config.defaultFromName;
  if (config.defaultFromEmail) updateData.default_from_email = config.defaultFromEmail;
  if (config.defaultReplyTo) updateData.default_reply_to = config.defaultReplyTo;
  if (config.quietHours) updateData.quiet_hours = config.quietHours;
  if (config.throttle) updateData.throttle = config.throttle;
  if (config.unsubscribeUrl) updateData.unsubscribe_url = config.unsubscribeUrl;
  if (config.companyAddress) updateData.company_address = config.companyAddress;

  const { error } = await supabase
    .from('email_system_config')
    .update(updateData)
    .eq('id', 'default');

  if (error) {
    console.error('Error updating email system config:', error);
    return false;
  }
  return true;
}

// ============== TEMPLATE VERSIONS ==============

export async function getTemplateVersions(templateId: string): Promise<EmailTemplateVersion[]> {
  const { data, error } = await supabase
    .from('email_template_versions')
    .select('*')
    .eq('template_id', templateId)
    .order('version', { ascending: false });

  if (error) {
    console.error('Error fetching template versions:', error);
    return [];
  }

  return data.map(v => ({
    id: v.id,
    templateId: v.template_id,
    version: v.version,
    htmlContent: v.html_content ?? '',
    plainText: v.plain_text ?? '',
    subject: v.subject,
    editorEmail: v.editor_email,
    editorName: v.editor_name ?? '',
    changelog: v.changelog ?? '',
    createdAt: v.created_at ?? new Date().toISOString(),
    isActive: v.is_active ?? false,
  }));
}

export async function createTemplateVersion(
  templateId: string,
  htmlContent: string,
  subject: string,
  editorEmail: string,
  editorName?: string,
  changelog?: string,
  plainText?: string
): Promise<EmailTemplateVersion | null> {
  // Get the current max version
  const { data: existing } = await supabase
    .from('email_template_versions')
    .select('version')
    .eq('template_id', templateId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

  // Deactivate all other versions
  await supabase
    .from('email_template_versions')
    .update({ is_active: false })
    .eq('template_id', templateId);

  // Create new version
  const { data, error } = await supabase
    .from('email_template_versions')
    .insert({
      template_id: templateId,
      version: nextVersion,
      html_content: htmlContent,
      plain_text: plainText,
      subject,
      editor_email: editorEmail,
      editor_name: editorName,
      changelog,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating template version:', error);
    return null;
  }

  return {
    id: data.id,
    templateId: data.template_id,
    version: data.version,
    htmlContent: data.html_content ?? '',
    plainText: data.plain_text ?? '',
    subject: data.subject,
    editorEmail: data.editor_email,
    editorName: data.editor_name ?? '',
    changelog: data.changelog ?? '',
    createdAt: data.created_at ?? new Date().toISOString(),
    isActive: data.is_active ?? false,
  };
}

export async function revertToVersion(versionId: string, templateId: string): Promise<boolean> {
  // Deactivate all versions
  await supabase
    .from('email_template_versions')
    .update({ is_active: false })
    .eq('template_id', templateId);

  // Activate the selected version
  const { error } = await supabase
    .from('email_template_versions')
    .update({ is_active: true })
    .eq('id', versionId);

  if (error) {
    console.error('Error reverting version:', error);
    return false;
  }
  return true;
}

// ============== SCHEDULING ==============

export async function getScheduledEmails(status?: EmailSchedule['status']): Promise<EmailSchedule[]> {
  let query = supabase
    .from('email_schedules')
    .select('*')
    .order('scheduled_at', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching scheduled emails:', error);
    return [];
  }

  return data.map(s => ({
    id: s.id,
    templateId: s.template_id,
    scheduledAt: s.scheduled_at,
    timezone: s.timezone ?? 'UTC',
    status: (s.status ?? 'scheduled') as EmailSchedule['status'],
    recipientCount: s.recipient_count ?? 0,
    sentCount: s.sent_count ?? 0,
    failedCount: s.failed_count ?? 0,
    segmentFilters: (s.segment_filters ?? null) as SegmentFilters | null,
    createdBy: s.created_by,
    createdAt: s.created_at ?? new Date().toISOString(),
  }));
}

export async function createScheduledEmail(
  templateId: string,
  scheduledAt: string,
  timezone: string,
  createdBy: string,
  segmentFilters?: SegmentFilters
): Promise<EmailSchedule | null> {
  // Estimate recipient count based on filters
  const recipientCount = await estimateRecipientCount(segmentFilters);

  const { data, error } = await supabase
    .from('email_schedules')
    .insert({
      template_id: templateId,
      scheduled_at: scheduledAt,
      timezone,
      status: 'scheduled',
      recipient_count: recipientCount,
      segment_filters: (segmentFilters || null) as Json,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating scheduled email:', error);
    return null;
  }

  return {
    id: data.id,
    templateId: data.template_id,
    scheduledAt: data.scheduled_at,
    timezone: data.timezone ?? 'UTC',
    status: (data.status ?? 'scheduled') as EmailSchedule['status'],
    recipientCount: data.recipient_count ?? 0,
    sentCount: data.sent_count ?? 0,
    failedCount: data.failed_count ?? 0,
    segmentFilters: (data.segment_filters ?? null) as SegmentFilters | null,
    createdBy: data.created_by,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}

export async function cancelScheduledEmail(scheduleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('email_schedules')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', scheduleId)
    .eq('status', 'scheduled');

  if (error) {
    console.error('Error cancelling scheduled email:', error);
    return false;
  }
  return true;
}

// ============== AUDIENCE SEGMENTS ==============

export async function getAudienceSegments(): Promise<AudienceSegment[]> {
  const { data, error } = await supabase
    .from('email_audience_segments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audience segments:', error);
    return [];
  }

  return data.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description ?? '',
    filters: (s.filters ?? {}) as SegmentFilters,
    estimatedCount: s.estimated_count ?? 0,
    createdBy: s.created_by ?? '',
    createdAt: s.created_at ?? new Date().toISOString(),
    updatedAt: s.updated_at ?? new Date().toISOString(),
  }));
}

export async function createAudienceSegment(
  name: string,
  filters: SegmentFilters,
  description?: string,
  createdBy?: string
): Promise<AudienceSegment | null> {
  const estimatedCount = await estimateRecipientCount(filters);

  const { data, error } = await supabase
    .from('email_audience_segments')
    .insert({
      name,
      description,
      filters: filters as Json,
      estimated_count: estimatedCount,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating audience segment:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    filters: (data.filters ?? {}) as SegmentFilters,
    estimatedCount: data.estimated_count ?? 0,
    createdBy: data.created_by ?? '',
    createdAt: data.created_at ?? new Date().toISOString(),
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

export async function deleteAudienceSegment(segmentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('email_audience_segments')
    .delete()
    .eq('id', segmentId);

  if (error) {
    console.error('Error deleting audience segment:', error);
    return false;
  }
  return true;
}

// ============== ANALYTICS ==============

export async function getEmailAnalytics(
  templateId?: string,
  startDate?: string,
  endDate?: string
): Promise<EmailAnalytics[]> {
  let query = supabase
    .from('email_analytics_daily')
    .select('*')
    .order('date', { ascending: false });

  if (templateId) {
    query = query.eq('template_id', templateId);
  }
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching email analytics:', error);
    return [];
  }

  return data.map(a => {
    const totalSent = a.total_sent ?? 0;
    const totalUnsubscribed = a.total_unsubscribed ?? 0;

    return {
      templateId: a.template_id,
      period: 'day',
      totalSent,
      totalDelivered: a.total_delivered ?? 0,
      totalOpened: a.total_opened ?? 0,
      totalClicked: a.total_clicked ?? 0,
      totalBounced: a.total_bounced ?? 0,
      totalFailed: a.total_failed ?? 0,
      totalUnsubscribed,
      openRate: Number(a.open_rate ?? 0),
      clickRate: Number(a.click_rate ?? 0),
      bounceRate: Number(a.bounce_rate ?? 0),
      unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0,
      periodStart: a.date,
      periodEnd: a.date,
    };
  });
}

export async function getDeliveryRecords(
  templateId?: string,
  status?: EmailDeliveryRecord['status'],
  limit = 100
): Promise<EmailDeliveryRecord[]> {
  let query = supabase
    .from('email_delivery_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (templateId) {
    query = query.eq('template_id', templateId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching delivery records:', error);
    return [];
  }

  return data.map(r => ({
    id: r.id,
    templateId: r.template_id,
    templateVersion: r.template_version ?? 1,
    scheduleId: r.schedule_id,
    recipientEmail: r.recipient_email,
    recipientId: r.recipient_id ?? '',
    status: (r.status ?? 'pending') as EmailDeliveryRecord['status'],
    sentAt: r.sent_at,
    deliveredAt: r.delivered_at,
    openedAt: r.opened_at,
    clickedAt: r.clicked_at,
    bouncedAt: r.bounced_at,
    failedAt: r.failed_at,
    errorMessage: r.error_message,
    retryCount: r.retry_count ?? 0,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
  }));
}

// ============== COMPLIANCE ==============

export async function getComplianceRecords(
  type?: ComplianceRecord['type'],
  status?: ComplianceRecord['status']
): Promise<ComplianceRecord[]> {
  let query = supabase
    .from('email_compliance_records')
    .select('*')
    .order('requested_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching compliance records:', error);
    return [];
  }

  return data.map(c => ({
    id: c.id,
    type: c.type as ComplianceRecord['type'],
    userEmail: c.user_email,
    userId: c.user_id ?? '',
    status: (c.status ?? 'pending') as ComplianceRecord['status'],
    requestedAt: c.requested_at ?? new Date().toISOString(),
    processedAt: c.processed_at,
    processedBy: c.processed_by,
    metadata: (c.metadata ?? {}) as Record<string, unknown>,
  }));
}

export async function processComplianceRequest(
  recordId: string,
  processedBy: string,
  notes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('email_compliance_records')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      processed_by: processedBy,
      notes,
    })
    .eq('id', recordId);

  if (error) {
    console.error('Error processing compliance request:', error);
    return false;
  }
  return true;
}

export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking unsubscribe status:', error);
  }

  return !!data;
}

export async function addUnsubscribe(email: string, reason?: string, userId?: string): Promise<boolean> {
  const { error } = await supabase
    .from('email_unsubscribes')
    .insert({
      email: email.toLowerCase(),
      reason,
      user_id: userId,
      source: 'user_request',
    });

  if (error) {
    // Might already exist, which is fine
    if (error.code !== '23505') {
      console.error('Error adding unsubscribe:', error);
      return false;
    }
  }
  return true;
}

// ============== DRY RUN ==============

export async function saveDryRunResult(result: Omit<DryRunResult, 'id'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('email_dry_runs')
    .insert({
      template_id: result.templateId,
      template_name: result.templateName,
      executed_by: result.executedBy,
      segment_filters: (result.segmentFilters ?? null) as Json,
      total_recipients: result.totalRecipients,
      recipients: (result.recipients?.slice(0, 50) ?? []) as Json, // Only store first 50
      estimated_send_time: result.estimatedSendTime,
      warnings: result.warnings,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving dry run result:', error);
    return null;
  }
  return data.id;
}

export async function getDryRunResults(limit = 20): Promise<DryRunResult[]> {
  const { data, error } = await supabase
    .from('email_dry_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching dry run results:', error);
    return [];
  }

  return data.map(d => ({
    id: d.id,
    templateId: d.template_id,
    templateName: d.template_name ?? '',
    executedBy: d.executed_by,
    segmentFilters: (d.segment_filters ?? null) as SegmentFilters | null,
    totalRecipients: d.total_recipients ?? 0,
    recipients: (d.recipients ?? []) as DryRunResult['recipients'],
    estimatedSendTime: d.estimated_send_time ?? '',
    warnings: d.warnings ?? [],
    executedAt: d.created_at ?? new Date().toISOString(),
  }));
}

// ============== EMAIL BLOCKS ==============

export async function getCustomEmailBlocks(): Promise<EmailBlock[]> {
  const { data, error } = await supabase
    .from('email_blocks')
    .select('*')
    .eq('is_system', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom email blocks:', error);
    return [];
  }

  return data.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description ?? '',
    type: b.type as EmailBlock['type'],
    htmlTemplate: b.html_template,
    previewImage: b.preview_image ?? undefined,
    variables: b.variables || [],
    isSystem: b.is_system ?? false,
    createdAt: b.created_at ?? new Date().toISOString(),
    updatedAt: b.updated_at ?? new Date().toISOString(),
  }));
}

export async function saveCustomEmailBlock(
  block: Omit<EmailBlock, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>
): Promise<EmailBlock | null> {
  const { data, error } = await supabase
    .from('email_blocks')
    .insert({
      name: block.name,
      description: block.description,
      type: block.type,
      html_template: block.htmlTemplate,
      preview_image: block.previewImage,
      variables: block.variables,
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving custom email block:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    type: data.type as EmailBlock['type'],
    htmlTemplate: data.html_template,
    previewImage: data.preview_image ?? undefined,
    variables: data.variables || [],
    isSystem: data.is_system ?? false,
    createdAt: data.created_at ?? new Date().toISOString(),
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

// ============== HELPERS ==============

export async function estimateRecipientCount(filters?: SegmentFilters): Promise<number> {
  if (!filters) {
    // Count all parents (users who might receive emails)
    const { count, error } = await supabase
      .from('parents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error counting recipients:', error);
      return 0;
    }
    return count || 0;
  }

  // Build query based on filters
  let query = supabase.from('parents').select('*', { count: 'exact', head: true });

  if (filters.subscriptionTier && filters.subscriptionTier.length > 0) {
    const normalizedTiers = Array.from(
      new Set(filters.subscriptionTier.map((tier) => (tier === 'free' ? 'free' : 'premium')))
    );
    query = query.in('subscription_tier', normalizedTiers);
  }

  if (filters.registeredAfter) {
    query = query.gte('created_at', filters.registeredAfter);
  }

  if (filters.registeredBefore) {
    query = query.lte('created_at', filters.registeredBefore);
  }

  // Note: More complex filters (childAgeRange, activityLevel, etc.) 
  // would require joins and more complex queries

  const { count, error } = await query;

  if (error) {
    console.error('Error estimating recipient count:', error);
    return 0;
  }

  return count || 0;
}

export async function getRecentEmailActivity(days = 7): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('email_analytics_daily')
    .select('total_sent, total_opened, total_clicked, total_bounced')
    .gte('date', startDate.toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching recent activity:', error);
    return { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0 };
  }

  return data.reduce(
    (acc, row) => ({
      totalSent: acc.totalSent + (row.total_sent || 0),
      totalOpened: acc.totalOpened + (row.total_opened || 0),
      totalClicked: acc.totalClicked + (row.total_clicked || 0),
      totalBounced: acc.totalBounced + (row.total_bounced || 0),
    }),
    { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0 }
  );
}
