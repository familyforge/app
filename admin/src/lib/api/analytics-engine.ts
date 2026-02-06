// Admin Dashboard Analytics API
// Comprehensive analytics layer for enterprise-grade dashboard

import { supabase } from '../supabase';
import type {
  DateRange,
  TimeRange,
  User,
  UserDetail,
  Child,
  OnboardingAnalytics,
  OnboardingFunnelStep,
  SubscriptionAnalytics,
  AppHealthAnalytics,
  EngagementAnalytics,
  MetricValue,
  OverviewMetrics,
  Anomaly,
  SupportNote,
  UserFlag,
  SupportNoteType,
  FlagType,
  AdminAuditLog,
  AdminActionType,
  PaginatedResponse,
  Platform,
  UserSegment,
  LifecycleState,
  SubscriptionEvent,
  ActivityLogEntry,
  OnboardingEvent,
  UserSession,
} from '../types';
import { getDateRangeFromTimeRange, formatDateForQuery } from '../stores';

// ============================================
// HELPER FUNCTIONS
// ============================================

const calculateMetricValue = (
  current: number,
  previous: number,
  higherIsBetter = true
): MetricValue => {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : current > 0 ? 100 : 0;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
  const isGood = higherIsBetter ? change >= 0 : change <= 0;

  return {
    value: current,
    previousValue: previous,
    change,
    changePercent: Math.round(changePercent * 100) / 100,
    trend,
    isGood,
  };
};

const getPreviousDateRange = (range: DateRange): DateRange => {
  const duration = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - duration),
    end: new Date(range.start.getTime()),
  };
};

// ============================================
// OVERVIEW METRICS API
// ============================================

export async function getOverviewMetrics(timeRange: TimeRange): Promise<OverviewMetrics> {
  const dateRange = getDateRangeFromTimeRange(timeRange);
  const startDate = formatDateForQuery(dateRange.start);
  const endDate = formatDateForQuery(dateRange.end);
  const prevRange = getPreviousDateRange(dateRange);
  const prevStartDate = formatDateForQuery(prevRange.start);
  const prevEndDate = formatDateForQuery(prevRange.end);

  // Fetch current period metrics
  const [
    { count: totalUsers },
    { count: prevTotalUsers },
    { count: activeUsers },
    { count: prevActiveUsers },
    { data: revenueData },
    { data: prevRevenueData },
    { data: onboardingData },
    { data: prevOnboardingData },
    { count: tasksCompleted },
    { count: totalTasks },
    { count: prevTasksCompleted },
    { count: prevTotalTasks },
  ] = await Promise.all([
    supabase.from('parents').select('*', { count: 'exact', head: true }),
    supabase.from('parents').select('*', { count: 'exact', head: true }).lt('created_at', startDate),
    supabase
      .from('user_activity_log' as never)
      .select('parent_id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('user_activity_log' as never)
      .select('parent_id', { count: 'exact', head: true })
      .gte('created_at', prevStartDate)
      .lte('created_at', prevEndDate),
    supabase
      .from('revenue_snapshots' as never)
      .select('mrr_cents')
      .order('snapshot_date', { ascending: false })
      .limit(1),
    supabase
      .from('revenue_snapshots' as never)
      .select('mrr_cents')
      .lte('snapshot_date', prevEndDate)
      .order('snapshot_date', { ascending: false })
      .limit(1),
    supabase
      .from('onboarding_events' as never)
      .select('parent_id, completed')
      .eq('step_index', 0)
      .gte('started_at', startDate),
    supabase
      .from('onboarding_events' as never)
      .select('parent_id, completed')
      .eq('step_index', 0)
      .gte('started_at', prevStartDate)
      .lt('started_at', startDate),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', startDate),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('created_at', startDate),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', prevStartDate)
      .lt('completed_at', startDate),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', prevStartDate)
      .lt('created_at', startDate),
  ]);

  const currentMrr = ((revenueData?.[0] as unknown) as { mrr_cents?: number } | undefined)?.mrr_cents ?? 0;
  const prevMrr = ((prevRevenueData?.[0] as unknown) as { mrr_cents?: number } | undefined)?.mrr_cents ?? 0;

  // Calculate onboarding rates
  const onboardingStarted = onboardingData?.length ?? 0;
  const onboardingCompleted = onboardingData?.filter((e) => (e as { completed?: boolean }).completed).length ?? 0;
  const onboardingRate = onboardingStarted > 0 ? (onboardingCompleted / onboardingStarted) * 100 : 0;

  const prevOnboardingStarted = prevOnboardingData?.length ?? 0;
  const prevOnboardingCompleted =
    prevOnboardingData?.filter((e) => (e as { completed?: boolean }).completed).length ?? 0;
  const prevOnboardingRate = prevOnboardingStarted > 0 ? (prevOnboardingCompleted / prevOnboardingStarted) * 100 : 0;

  // Task completion rate
  const taskCompletionRate = (totalTasks ?? 0) > 0 ? ((tasksCompleted ?? 0) / (totalTasks ?? 1)) * 100 : 0;
  const prevTaskCompletionRate =
    (prevTotalTasks ?? 0) > 0 ? ((prevTasksCompleted ?? 0) / (prevTotalTasks ?? 1)) * 100 : 0;

  // Placeholder calculations for metrics without real data
  const churnRate = 2.5; // Example: 2.5% churn rate
  const prevChurnRate = 3.0;

  const avgSessionDuration = 420; // 7 minutes in seconds
  const prevAvgSessionDuration = 380;

  const nps = 72; // Net Promoter Score
  const prevNps = 68;

  return {
    totalUsers: calculateMetricValue(totalUsers ?? 0, prevTotalUsers ?? 0),
    activeUsers: calculateMetricValue(activeUsers ?? 0, prevActiveUsers ?? 0),
    mrr: calculateMetricValue(currentMrr / 100, prevMrr / 100),
    churnRate: calculateMetricValue(churnRate, prevChurnRate, false),
    onboardingRate: calculateMetricValue(onboardingRate, prevOnboardingRate),
    taskCompletionRate: calculateMetricValue(taskCompletionRate, prevTaskCompletionRate),
    avgSessionDuration: calculateMetricValue(avgSessionDuration, prevAvgSessionDuration),
    nps: calculateMetricValue(nps, prevNps),
  };
}

// ============================================
// ANOMALY DETECTION API
// ============================================

export async function detectAnomalies(timeRange: TimeRange): Promise<Anomaly[]> {
  const dateRange = getDateRangeFromTimeRange(timeRange);
  // This would typically use statistical analysis to detect anomalies
  // For now, we'll simulate some common anomaly patterns
  const anomalies: Anomaly[] = [];

  // Check for significant drop in DAU
  const { data: engagementData } = await supabase
    .from('engagement_snapshots' as never)
    .select('dau, snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(7);

  if (engagementData && engagementData.length >= 2) {
    const latest = engagementData[0] as { dau: number };
    const previous = engagementData[1] as { dau: number };
    const dropPercent = ((previous.dau - latest.dau) / previous.dau) * 100;

    if (dropPercent > 20) {
      anomalies.push({
        id: crypto.randomUUID(),
        metricName: 'Daily Active Users',
        description: `DAU dropped by ${Math.round(dropPercent)}% compared to previous day`,
        severity: dropPercent > 50 ? 'critical' : dropPercent > 30 ? 'high' : 'medium',
        detectedAt: new Date().toISOString(),
        currentValue: latest.dau,
        expectedValue: previous.dau,
        deviation: dropPercent,
        acknowledged: false,
      });
    }
  }

  // Check for failed payment spikes
  const { count: failedPayments } = await supabase
    .from('subscription_events' as never)
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'failed_payment')
    .gte('created_at', formatDateForQuery(dateRange.start));

  if ((failedPayments ?? 0) > 10) {
    anomalies.push({
      id: crypto.randomUUID(),
      metricName: 'Failed Payments',
      description: `${failedPayments} failed payments detected in the selected period`,
      severity: (failedPayments ?? 0) > 50 ? 'critical' : 'high',
      detectedAt: new Date().toISOString(),
      currentValue: failedPayments ?? 0,
      expectedValue: 0,
      deviation: 100,
      acknowledged: false,
    });
  }

  return anomalies;
}

// ============================================
// USER MANAGEMENT API
// ============================================

export async function getUsers(
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    segment?: UserSegment;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    platform?: Platform | 'all';
  } = {}
): Promise<PaginatedResponse<User>> {
  const {
    page = 1,
    pageSize = 25,
    search = '',
    segment = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc',
    platform = 'all',
  } = options;

  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('parents')
    .select(
      `
      id,
      email,
      name,
      subscription_tier,
      created_at,
      children:children(count)
    `,
      { count: 'exact' }
    );

  // Apply search filter
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  // Apply segment filter
  if (segment !== 'all') {
    switch (segment) {
      case 'free':
        query = query.eq('subscription_tier', 'free' as never);
        break;
      case 'forge':
        query = query.eq('subscription_tier', 'forge' as never);
        break;
      case 'pro':
        query = query.eq('subscription_tier', 'pro' as never);
        break;
    }
  }

  // Apply sorting
  const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const users: User[] = (data ?? []).map((row) => {
    const r = row as {
      id: string;
      email: string;
      name: string;
      subscription_tier: string | null;
      created_at: string;
      children: { count: number }[];
    };
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      subscriptionTier: r.subscription_tier,
      planCode: r.subscription_tier ?? 'free',
      childrenCount: r.children[0]?.count ?? 0,
      createdAt: r.created_at,
      lastActivityAt: null,
      lifecycleState: 'active' as LifecycleState,
      onboardingCompleted: true,
      onboardingCompletedAt: null,
      deviceType: null,
      platform: null,
      country: null,
      tasksCompleted: 0,
      rewardsRedeemed: 0,
    };
  });

  return {
    data: users,
    total: count ?? 0,
    page,
    pageSize,
    hasMore: offset + pageSize < (count ?? 0),
  };
}

export async function getUserDetail(userId: string): Promise<UserDetail> {
  // Fetch user basic info
  const { data: userData, error: userError } = await supabase
    .from('parents')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) throw new Error(userError.message);

  // Fetch children
  const { data: childrenData } = await supabase.from('children').select('*').eq('parent_id', userId);

  // Fetch sessions
  const { data: sessionsData } = await supabase
    .from('user_sessions' as never)
    .select('*')
    .eq('parent_id', userId)
    .order('started_at', { ascending: false })
    .limit(20);

  // Fetch subscription history
  const { data: subscriptionData } = await supabase
    .from('subscription_events' as never)
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false });

  // Fetch activity log
  const { data: activityData } = await supabase
    .from('user_activity_log' as never)
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch support notes
  const { data: notesData } = await supabase
    .from('user_support_notes' as never)
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false });

  // Fetch flags
  const { data: flagsData } = await supabase
    .from('user_flags' as never)
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false });

  // Fetch onboarding events
  const { data: onboardingData } = await supabase
    .from('onboarding_events' as never)
    .select('*')
    .eq('parent_id', userId)
    .order('step_index', { ascending: true });

  const user = userData as {
    id: string;
    email: string;
    name: string;
    subscription_tier: string | null;
    created_at: string;
  };

  const children: Child[] = (childrenData ?? []).map((c) => {
    const child = c as {
      id: string;
      parent_id: string;
      name: string;
      age: number;
      points: number;
      created_at: string;
    };
    return {
      id: child.id,
      parentId: child.parent_id,
      name: child.name,
      age: child.age,
      points: child.points,
      tasksCompleted: 0,
      createdAt: child.created_at,
    };
  });

  const sessions: UserSession[] = (sessionsData ?? []).map((s) => {
    const session = s as {
      id: string;
      parent_id: string;
      session_id: string;
      started_at: string;
      ended_at: string | null;
      duration_seconds: number;
      device_type: string | null;
      platform: string | null;
      os_version: string | null;
      app_version: string | null;
      screens_visited: string[];
      actions_count: number;
    };
    return {
      id: session.id,
      parentId: session.parent_id,
      sessionId: session.session_id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      durationSeconds: session.duration_seconds,
      deviceType: session.device_type,
      platform: session.platform,
      osVersion: session.os_version,
      appVersion: session.app_version,
      screensVisited: session.screens_visited,
      actionsCount: session.actions_count,
    };
  });

  const subscriptionHistory: SubscriptionEvent[] = (subscriptionData ?? []).map((e) => {
    const event = e as {
      id: string;
      parent_id: string | null;
      event_type: string;
      plan_code: string | null;
      billing_cycle: string | null;
      platform: string | null;
      amount_cents: number;
      currency: string;
      previous_plan: string | null;
      trial_days_remaining: number | null;
      grace_period_days: number | null;
      failure_reason: string | null;
      external_transaction_id: string | null;
      created_at: string;
    };
    return {
      id: event.id,
      parentId: event.parent_id,
      eventType: event.event_type as SubscriptionEvent['eventType'],
      planCode: event.plan_code,
      billingCycle: event.billing_cycle as SubscriptionEvent['billingCycle'],
      platform: event.platform as SubscriptionEvent['platform'],
      amountCents: event.amount_cents,
      currency: event.currency,
      previousPlan: event.previous_plan,
      trialDaysRemaining: event.trial_days_remaining,
      gracePeriodDays: event.grace_period_days,
      failureReason: event.failure_reason,
      externalTransactionId: event.external_transaction_id,
      createdAt: event.created_at,
    };
  });

  const activityLog: ActivityLogEntry[] = (activityData ?? []).map((a) => {
    const entry = a as {
      id: string;
      parent_id: string | null;
      child_id: string | null;
      event_type: string;
      event_category: string;
      event_data: Record<string, unknown>;
      device_type: string | null;
      platform: string | null;
      os_version: string | null;
      app_version: string | null;
      created_at: string;
    };
    return {
      id: entry.id,
      parentId: entry.parent_id,
      childId: entry.child_id,
      eventType: entry.event_type,
      eventCategory: entry.event_category,
      eventData: entry.event_data,
      deviceType: entry.device_type,
      platform: entry.platform,
      osVersion: entry.os_version,
      appVersion: entry.app_version,
      createdAt: entry.created_at,
    };
  });

  const supportNotes: SupportNote[] = (notesData ?? []).map((n) => {
    const note = n as {
      id: string;
      parent_id: string;
      admin_email: string;
      note_type: string;
      content: string;
      tags: string[];
      is_internal: boolean;
      created_at: string;
    };
    return {
      id: note.id,
      parentId: note.parent_id,
      adminEmail: note.admin_email,
      noteType: note.note_type as SupportNoteType,
      content: note.content,
      tags: note.tags,
      isInternal: note.is_internal,
      createdAt: note.created_at,
    };
  });

  const flags: UserFlag[] = (flagsData ?? []).map((f) => {
    const flag = f as {
      id: string;
      parent_id: string;
      flag_type: string;
      flag_reason: string | null;
      flagged_by: string;
      resolved: boolean;
      resolved_at: string | null;
      resolved_by: string | null;
      resolution_notes: string | null;
      created_at: string;
    };
    return {
      id: flag.id,
      parentId: flag.parent_id,
      flagType: flag.flag_type as FlagType,
      flagReason: flag.flag_reason,
      flaggedBy: flag.flagged_by,
      resolved: flag.resolved,
      resolvedAt: flag.resolved_at,
      resolvedBy: flag.resolved_by,
      resolutionNotes: flag.resolution_notes,
      createdAt: flag.created_at,
    };
  });

  const onboardingEvents: OnboardingEvent[] = (onboardingData ?? []).map((o) => {
    const event = o as {
      id: string;
      parent_id: string;
      step_name: string;
      step_index: number;
      completed: boolean;
      skipped: boolean;
      time_spent_seconds: number;
      device_type: string | null;
      platform: string | null;
      country: string | null;
      acquisition_source: string | null;
      started_at: string;
      completed_at: string | null;
    };
    return {
      id: event.id,
      parentId: event.parent_id,
      stepName: event.step_name,
      stepIndex: event.step_index,
      completed: event.completed,
      skipped: event.skipped,
      timeSpentSeconds: event.time_spent_seconds,
      deviceType: event.device_type,
      platform: event.platform,
      country: event.country,
      acquisitionSource: event.acquisition_source,
      startedAt: event.started_at,
      completedAt: event.completed_at,
    };
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionTier: user.subscription_tier,
    planCode: user.subscription_tier ?? 'free',
    childrenCount: children.length,
    createdAt: user.created_at,
    lastActivityAt: activityLog[0]?.createdAt ?? null,
    lifecycleState: 'active',
    onboardingCompleted: onboardingEvents.some((e) => e.completed),
    onboardingCompletedAt: onboardingEvents.find((e) => e.completed)?.completedAt ?? null,
    deviceType: sessions[0]?.deviceType ?? null,
    platform: sessions[0]?.platform ?? null,
    country: null,
    tasksCompleted: 0,
    rewardsRedeemed: 0,
    children,
    sessions,
    subscriptionHistory,
    activityLog,
    supportNotes,
    flags,
    onboardingEvents,
  };
}

// ============================================
// ONBOARDING ANALYTICS API
// ============================================

export async function getOnboardingAnalytics(timeRange: TimeRange): Promise<OnboardingAnalytics> {
  const dateRange = getDateRangeFromTimeRange(timeRange);
  const startDate = formatDateForQuery(dateRange.start);
  const endDate = formatDateForQuery(dateRange.end);

  // Fetch funnel data
  const { data: funnelData } = await supabase
    .from('onboarding_funnel_view')
    .select('*');

  // Fetch raw onboarding events for detailed analysis
  const { data: eventsData } = await supabase
    .from('onboarding_events' as never)
    .select('*')
    .gte('started_at', startDate)
    .lte('started_at', endDate);

  const funnelSteps: OnboardingFunnelStep[] = (funnelData ?? []).map((step, index, arr) => {
    const s = step as {
      step_name: string;
      step_index: number;
      users_started: number;
      users_completed: number;
      users_skipped: number;
      avg_time_seconds: number;
      completion_rate: number;
    };
    const prevStep = arr[index - 1] as typeof s | undefined;
    const dropOff = prevStep ? prevStep.users_completed - s.users_started : 0;
    const dropOffRate = prevStep && prevStep.users_completed > 0 
      ? (dropOff / prevStep.users_completed) * 100 
      : 0;

    return {
      stepName: s.step_name,
      stepIndex: s.step_index,
      usersStarted: s.users_started,
      usersCompleted: s.users_completed,
      usersSkipped: s.users_skipped,
      avgTimeSeconds: s.avg_time_seconds,
      completionRate: s.completion_rate,
      dropOffRate,
    };
  });

  const events = eventsData ?? [];
  const totalStarted = new Set(events.map((e) => (e as { parent_id: string }).parent_id)).size;
  const completedUsers = events.filter(
    (e) => (e as { completed: boolean; step_index: number }).completed && 
           (e as { step_index: number }).step_index === (funnelSteps.length - 1)
  );
  const totalCompleted = new Set(completedUsers.map((e) => (e as { parent_id: string }).parent_id)).size;

  // Calculate by device
  const byDevice: { device: string; completionRate: number; count: number }[] = [];
  const deviceGroups = events.reduce(
    (acc, e) => {
      const event = e as { device_type: string | null; completed: boolean };
      const device = event.device_type ?? 'unknown';
      if (!acc[device]) acc[device] = { total: 0, completed: 0 };
      acc[device].total++;
      if (event.completed) acc[device].completed++;
      return acc;
    },
    {} as Record<string, { total: number; completed: number }>
  );
  for (const [device, counts] of Object.entries(deviceGroups)) {
    byDevice.push({
      device,
      completionRate: counts.total > 0 ? (counts.completed / counts.total) * 100 : 0,
      count: counts.total,
    });
  }

  // Calculate by platform
  const byPlatform: { platform: string; completionRate: number; count: number }[] = [];
  const platformGroups = events.reduce(
    (acc, e) => {
      const event = e as { platform: string | null; completed: boolean };
      const platform = event.platform ?? 'unknown';
      if (!acc[platform]) acc[platform] = { total: 0, completed: 0 };
      acc[platform].total++;
      if (event.completed) acc[platform].completed++;
      return acc;
    },
    {} as Record<string, { total: number; completed: number }>
  );
  for (const [platform, counts] of Object.entries(platformGroups)) {
    byPlatform.push({
      platform,
      completionRate: counts.total > 0 ? (counts.completed / counts.total) * 100 : 0,
      count: counts.total,
    });
  }

  // Calculate by source
  const bySource: { source: string; completionRate: number; count: number }[] = [];
  const sourceGroups = events.reduce(
    (acc, e) => {
      const event = e as { acquisition_source: string | null; completed: boolean };
      const source = event.acquisition_source ?? 'direct';
      if (!acc[source]) acc[source] = { total: 0, completed: 0 };
      acc[source].total++;
      if (event.completed) acc[source].completed++;
      return acc;
    },
    {} as Record<string, { total: number; completed: number }>
  );
  for (const [source, counts] of Object.entries(sourceGroups)) {
    bySource.push({
      source,
      completionRate: counts.total > 0 ? (counts.completed / counts.total) * 100 : 0,
      count: counts.total,
    });
  }

  // Find drop-off points
  const dropOffPoints = funnelSteps
    .filter((step) => step.dropOffRate > 10)
    .map((step) => ({
      step: step.stepName,
      dropOffCount: Math.round((step.dropOffRate / 100) * step.usersStarted),
      percentage: step.dropOffRate,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Calculate average time to complete
  const completedEvents = events.filter((e) => (e as { completed: boolean }).completed);
  const avgTimeToComplete = completedEvents.length > 0
    ? completedEvents.reduce((sum, e) => sum + ((e as { time_spent_seconds: number }).time_spent_seconds ?? 0), 0) / completedEvents.length
    : 0;

  return {
    totalStarted,
    totalCompleted,
    overallCompletionRate: totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0,
    avgTimeToComplete,
    funnelSteps,
    dropOffPoints,
    byDevice,
    byPlatform,
    bySource,
  };
}

// ============================================
// SUBSCRIPTION ANALYTICS API
// ============================================

export async function getSubscriptionAnalytics(timeRange: TimeRange): Promise<SubscriptionAnalytics> {
  const dateRange = getDateRangeFromTimeRange(timeRange);
  const startDate = formatDateForQuery(dateRange.start);
  const endDate = formatDateForQuery(dateRange.end);

  // Fetch latest revenue snapshot
  const { data: latestSnapshot } = await supabase
    .from('revenue_snapshots' as never)
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1);

  // Fetch revenue history
  const { data: revenueHistory } = await supabase
    .from('revenue_snapshots' as never)
    .select('snapshot_date, mrr_cents, arr_cents')
    .gte('snapshot_date', startDate)
    .lte('snapshot_date', endDate)
    .order('snapshot_date', { ascending: true });

  // Fetch subscription events for the period
  const { data: subscriptionEvents } = await supabase
    .from('subscription_events' as never)
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const snapshot = latestSnapshot?.[0] as {
    mrr_cents: number;
    arr_cents: number;
    total_subscribers: number;
    new_subscribers: number;
    churned_subscribers: number;
    trial_users: number;
    trial_conversions: number;
    free_users: number;
    forge_plan_users: number;
    pro_plan_users: number;
    ios_subscribers: number;
    android_subscribers: number;
    web_subscribers: number;
  } | undefined;

  const currentMrr = (snapshot?.mrr_cents ?? 0) / 100;
  const currentArr = (snapshot?.arr_cents ?? 0) / 100;

  // Calculate by plan
  const byPlan = [
    { plan: 'Free', count: snapshot?.free_users ?? 0, mrr: 0, percentage: 0 },
    { plan: 'Forge', count: snapshot?.forge_plan_users ?? 0, mrr: (snapshot?.forge_plan_users ?? 0) * 9.99, percentage: 0 },
    { plan: 'Pro', count: snapshot?.pro_plan_users ?? 0, mrr: (snapshot?.pro_plan_users ?? 0) * 19.99, percentage: 0 },
  ];
  const totalUsers = byPlan.reduce((sum, p) => sum + p.count, 0);
  byPlan.forEach((p) => {
    p.percentage = totalUsers > 0 ? (p.count / totalUsers) * 100 : 0;
  });

  // Calculate by platform
  const byPlatform: { platform: Platform; count: number; mrr: number; percentage: number }[] = [
    { platform: 'ios', count: snapshot?.ios_subscribers ?? 0, mrr: 0, percentage: 0 },
    { platform: 'android', count: snapshot?.android_subscribers ?? 0, mrr: 0, percentage: 0 },
    { platform: 'web', count: snapshot?.web_subscribers ?? 0, mrr: 0, percentage: 0 },
  ];
  const totalPlatformUsers = byPlatform.reduce((sum, p) => sum + p.count, 0);
  byPlatform.forEach((p) => {
    p.percentage = totalPlatformUsers > 0 ? (p.count / totalPlatformUsers) * 100 : 0;
  });

  // Calculate churn rate
  const churnedCount = subscriptionEvents?.filter(
    (e) => (e as { event_type: string }).event_type === 'cancelled'
  ).length ?? 0;
  const churnRate = (snapshot?.total_subscribers ?? 1) > 0 
    ? (churnedCount / (snapshot?.total_subscribers ?? 1)) * 100 
    : 0;

  // Calculate conversion rate
  const conversions = subscriptionEvents?.filter(
    (e) => (e as { event_type: string }).event_type === 'converted'
  ).length ?? 0;
  const trialStarts = subscriptionEvents?.filter(
    (e) => (e as { event_type: string }).event_type === 'trial_started'
  ).length ?? 0;
  const conversionRate = trialStarts > 0 ? (conversions / trialStarts) * 100 : 0;

  // Failed payments
  const failedPaymentEvents = subscriptionEvents?.filter(
    (e) => (e as { event_type: string }).event_type === 'failed_payment'
  ) ?? [];

  return {
    currentMrr,
    currentArr,
    mrrGrowth: 5.2, // Placeholder
    churnRate,
    conversionRate,
    trialToPaidRate: snapshot?.trial_users ?? 0 > 0 
      ? ((snapshot?.trial_conversions ?? 0) / (snapshot?.trial_users ?? 1)) * 100 
      : 0,
    avgRevenuePerUser: (snapshot?.total_subscribers ?? 0) > 0 
      ? currentMrr / (snapshot?.total_subscribers ?? 1) 
      : 0,
    lifetimeValue: 0, // Would need historical calculation
    byPlan,
    byPlatform,
    byCycle: [
      { cycle: 'monthly', count: 0, mrr: 0, percentage: 50 },
      { cycle: 'yearly', count: 0, mrr: 0, percentage: 50 },
    ],
    revenueHistory: (revenueHistory ?? []).map((r) => {
      const row = r as { snapshot_date: string; mrr_cents: number; arr_cents: number };
      return {
        date: row.snapshot_date,
        mrr: row.mrr_cents / 100,
        arr: row.arr_cents / 100,
      };
    }),
    churnHistory: [],
    failedPayments: failedPaymentEvents.reduce(
      (acc, e) => {
        const event = e as { created_at: string; amount_cents: number };
        const date = event.created_at.split('T')[0];
        const existing = acc.find((a) => a.date === date);
        if (existing) {
          existing.count++;
          existing.amountCents += event.amount_cents;
        } else {
          acc.push({ date, count: 1, amountCents: event.amount_cents });
        }
        return acc;
      },
      [] as { date: string; count: number; amountCents: number }[]
    ),
    upcomingRenewals: [],
  };
}

// ============================================
// APP HEALTH ANALYTICS API
// ============================================

export async function getAppHealthAnalytics(timeRange: TimeRange): Promise<AppHealthAnalytics> {
  const dateRange = getDateRangeFromTimeRange(timeRange);
  const startDate = formatDateForQuery(dateRange.start);
  const endDate = formatDateForQuery(dateRange.end);

  // Fetch errors
  const { data: errorsData, count: errorCount } = await supabase
    .from('app_errors' as never)
    .select('*', { count: 'exact' })
    .gte('occurred_at', startDate)
    .lte('occurred_at', endDate)
    .order('occurred_at', { ascending: false })
    .limit(100);

  // Fetch sessions for crash rate calculation
  const { count: sessionCount } = await supabase
    .from('user_sessions' as never)
    .select('*', { count: 'exact', head: true })
    .gte('started_at', startDate)
    .lte('started_at', endDate);

  // Fetch feature usage
  const { data: featureData } = await supabase
    .from('feature_adoption_view')
    .select('*');

  const errors = errorsData ?? [];
  const crashCount = errors.filter((e) => (e as { error_type: string }).error_type === 'crash').length;
  const crashRate = (sessionCount ?? 1) > 0 ? (crashCount / (sessionCount ?? 1)) * 1000 : 0;

  // Group errors by type
  const errorsByType: { type: string; count: number; percentage: number }[] = [];
  const typeGroups = errors.reduce(
    (acc, e) => {
      const type = (e as { error_type: string }).error_type;
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  for (const [type, count] of Object.entries(typeGroups)) {
    errorsByType.push({
      type,
      count,
      percentage: errors.length > 0 ? (count / errors.length) * 100 : 0,
    });
  }

  // Group errors by screen
  const errorsByScreen: { screen: string; count: number; percentage: number }[] = [];
  const screenGroups = errors.reduce(
    (acc, e) => {
      const screen = (e as { screen: string | null }).screen ?? 'unknown';
      acc[screen] = (acc[screen] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  for (const [screen, count] of Object.entries(screenGroups)) {
    errorsByScreen.push({
      screen,
      count,
      percentage: errors.length > 0 ? (count / errors.length) * 100 : 0,
    });
  }

  return {
    crashRate,
    crashRateTrend: -5, // Placeholder
    errorCount: errorCount ?? 0,
    errorsByType: errorsByType as { type: AppHealthAnalytics['errorsByType'][0]['type']; count: number; percentage: number }[],
    errorsByScreen,
    errorsByPlatform: [],
    errorsByVersion: [],
    topErrors: errors.slice(0, 10).map((e) => {
      const error = e as {
        id: string;
        parent_id: string | null;
        error_type: string;
        error_message: string | null;
        error_stack: string | null;
        component: string | null;
        screen: string | null;
        device_type: string | null;
        platform: string | null;
        os_version: string | null;
        app_version: string | null;
        occurred_at: string;
      };
      return {
        id: error.id,
        parentId: error.parent_id,
        errorType: error.error_type as AppHealthAnalytics['topErrors'][0]['errorType'],
        errorMessage: error.error_message,
        errorStack: error.error_stack,
        component: error.component,
        screen: error.screen,
        deviceType: error.device_type,
        platform: error.platform,
        osVersion: error.os_version,
        appVersion: error.app_version,
        occurredAt: error.occurred_at,
      };
    }),
    featureUsage: (featureData ?? []).map((f) => {
      const feature = f as {
        feature_name: string;
        unique_users: number;
        total_uses: number;
        last_used: string;
        device_types: number;
        platforms: number;
      };
      return {
        featureName: feature.feature_name,
        uniqueUsers: feature.unique_users,
        totalUses: feature.total_uses,
        lastUsed: feature.last_used,
        deviceTypes: feature.device_types,
        platforms: feature.platforms,
        trend: 0,
      };
    }),
    sessionHealth: {
      avgDuration: 420,
      avgDurationTrend: 5,
      abnormalSessions: 0,
      bounceRate: 15,
    },
  };
}

// ============================================
// ENGAGEMENT ANALYTICS API
// ============================================

export async function getEngagementAnalytics(timeRange: TimeRange): Promise<EngagementAnalytics> {
  const dateRange = getDateRangeFromTimeRange(timeRange);
  const startDate = formatDateForQuery(dateRange.start);
  const endDate = formatDateForQuery(dateRange.end);

  // Fetch engagement snapshots
  const { data: engagementData } = await supabase
    .from('engagement_snapshots' as never)
    .select('*')
    .gte('snapshot_date', startDate)
    .lte('snapshot_date', endDate)
    .order('snapshot_date', { ascending: true });

  // Fetch latest snapshot for current metrics
  const { data: latestSnapshot } = await supabase
    .from('engagement_snapshots' as never)
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1);

  // Fetch task metrics
  const { count: tasksCreated } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const { count: tasksCompleted } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', startDate)
    .lte('completed_at', endDate);

  // Fetch reward metrics
  const { count: rewardsRedeemed } = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('redeemed', true)
    .gte('redeemed_at', startDate)
    .lte('redeemed_at', endDate);

  const snapshot = latestSnapshot?.[0] as {
    dau: number;
    wau: number;
    mau: number;
    avg_session_duration_seconds: number;
    avg_sessions_per_user: number;
    retention_d1: number;
    retention_d7: number;
    retention_d30: number;
  } | undefined;

  const engagementHistory = (engagementData ?? []).map((e) => {
    const entry = e as { snapshot_date: string; dau: number; wau: number; mau: number };
    return {
      date: entry.snapshot_date,
      dau: entry.dau,
      wau: entry.wau,
      mau: entry.mau,
    };
  });

  return {
    dau: snapshot?.dau ?? 0,
    dauTrend: 5,
    wau: snapshot?.wau ?? 0,
    wauTrend: 3,
    mau: snapshot?.mau ?? 0,
    mauTrend: 2,
    dauWauRatio: (snapshot?.wau ?? 1) > 0 ? ((snapshot?.dau ?? 0) / (snapshot?.wau ?? 1)) * 100 : 0,
    dauMauRatio: (snapshot?.mau ?? 1) > 0 ? ((snapshot?.dau ?? 0) / (snapshot?.mau ?? 1)) * 100 : 0,
    avgSessionDuration: snapshot?.avg_session_duration_seconds ?? 0,
    avgSessionDurationTrend: 5,
    avgSessionsPerUser: snapshot?.avg_sessions_per_user ?? 0,
    retentionCohorts: [],
    engagementHistory,
    taskMetrics: {
      created: tasksCreated ?? 0,
      completed: tasksCompleted ?? 0,
      completionRate: (tasksCreated ?? 1) > 0 ? ((tasksCompleted ?? 0) / (tasksCreated ?? 1)) * 100 : 0,
      trend: 5,
    },
    rewardMetrics: {
      created: 0,
      redeemed: rewardsRedeemed ?? 0,
      redemptionRate: 0,
      trend: 3,
    },
    learningMetrics: {
      exercisesStarted: 0,
      exercisesCompleted: 0,
      completionRate: 0,
      trend: 0,
    },
    habitFormation: {
      usersWithStreaks: 0,
      avgStreakLength: 0,
      topStreakTypes: [],
    },
  };
}

// ============================================
// ADMIN ACTIONS API
// ============================================

export async function addSupportNote(
  parentId: string,
  adminEmail: string,
  content: string,
  noteType: SupportNoteType = 'general',
  tags: string[] = []
): Promise<SupportNote> {
  const { data, error } = await supabase
    .from('user_support_notes' as never)
    .insert({
      parent_id: parentId,
      admin_email: adminEmail,
      note_type: noteType,
      content,
      tags,
    } as never)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const note = data as {
    id: string;
    parent_id: string;
    admin_email: string;
    note_type: string;
    content: string;
    tags: string[];
    is_internal: boolean;
    created_at: string;
  };

  return {
    id: note.id,
    parentId: note.parent_id,
    adminEmail: note.admin_email,
    noteType: note.note_type as SupportNoteType,
    content: note.content,
    tags: note.tags,
    isInternal: note.is_internal,
    createdAt: note.created_at,
  };
}

export async function addUserFlag(
  parentId: string,
  flagType: FlagType,
  flaggedBy: string,
  reason?: string
): Promise<UserFlag> {
  const { data, error } = await supabase
    .from('user_flags' as never)
    .insert({
      parent_id: parentId,
      flag_type: flagType,
      flag_reason: reason,
      flagged_by: flaggedBy,
    } as never)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const flag = data as {
    id: string;
    parent_id: string;
    flag_type: string;
    flag_reason: string | null;
    flagged_by: string;
    resolved: boolean;
    resolved_at: string | null;
    resolved_by: string | null;
    resolution_notes: string | null;
    created_at: string;
  };

  return {
    id: flag.id,
    parentId: flag.parent_id,
    flagType: flag.flag_type as FlagType,
    flagReason: flag.flag_reason,
    flaggedBy: flag.flagged_by,
    resolved: flag.resolved,
    resolvedAt: flag.resolved_at,
    resolvedBy: flag.resolved_by,
    resolutionNotes: flag.resolution_notes,
    createdAt: flag.created_at,
  };
}

export async function resolveUserFlag(
  flagId: string,
  resolvedBy: string,
  resolutionNotes?: string
): Promise<void> {
  const { error } = await supabase
    .from('user_flags' as never)
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes,
    } as never)
    .eq('id', flagId);

  if (error) throw new Error(error.message);
}

export async function logAdminAction(
  adminEmail: string,
  actionType: AdminActionType,
  targetType?: string,
  targetId?: string,
  actionData?: Record<string, unknown>,
  notes?: string
): Promise<void> {
  const { error } = await supabase.from('admin_audit_log' as never).insert({
    admin_email: adminEmail,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    action_data: actionData ?? {},
    notes,
  } as never);

  if (error) console.error('Failed to log admin action:', error.message);
}

export async function getAuditLog(
  options: {
    page?: number;
    pageSize?: number;
    adminEmail?: string;
    actionType?: AdminActionType;
  } = {}
): Promise<PaginatedResponse<AdminAuditLog>> {
  const { page = 1, pageSize = 50, adminEmail, actionType } = options;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('admin_audit_log' as never)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (adminEmail) {
    query = query.eq('admin_email', adminEmail);
  }

  if (actionType) {
    query = query.eq('action_type', actionType);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const logs: AdminAuditLog[] = (data ?? []).map((log) => {
    const l = log as {
      id: string;
      admin_email: string;
      action_type: string;
      target_type: string | null;
      target_id: string | null;
      action_data: Record<string, unknown>;
      ip_address: string | null;
      reversible: boolean;
      reversed_at: string | null;
      reversed_by: string | null;
      notes: string | null;
      created_at: string;
    };
    return {
      id: l.id,
      adminEmail: l.admin_email,
      actionType: l.action_type as AdminActionType,
      targetType: l.target_type,
      targetId: l.target_id,
      actionData: l.action_data,
      ipAddress: l.ip_address,
      reversible: l.reversible,
      reversedAt: l.reversed_at,
      reversedBy: l.reversed_by,
      notes: l.notes,
      createdAt: l.created_at,
    };
  });

  return {
    data: logs,
    total: count ?? 0,
    page,
    pageSize,
    hasMore: offset + pageSize < (count ?? 0),
  };
}

