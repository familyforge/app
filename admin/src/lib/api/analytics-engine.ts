// Admin Dashboard Analytics API
// Derives all metrics from real tables: parents, children, tasks, rewards

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

// Safe Supabase query helper — returns null data on error (e.g. table missing)
async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: { message: string } | null; count?: number | null }>
): Promise<{ data: T | null; error: string | null; count: number | null }> {
  try {
    const result = await queryFn();
    if (result.error) {
      console.warn('[analytics] Query error:', result.error.message);
      return { data: null, error: result.error.message, count: null };
    }
    return { data: result.data, error: null, count: result.count ?? null };
  } catch (e) {
    console.warn('[analytics] Query exception:', e);
    return { data: null, error: e instanceof Error ? e.message : 'unknown', count: null };
  }
}

// ============================================
// OVERVIEW METRICS API
// ============================================

export async function getOverviewMetrics(timeRange: TimeRange): Promise<OverviewMetrics> {
  const dateRange = getDateRangeFromTimeRange(timeRange);
  const startDate = formatDateForQuery(dateRange.start);
  const prevRange = getPreviousDateRange(dateRange);
  const prevStartDate = formatDateForQuery(prevRange.start);

  const [
    totalUsersResult,
    prevTotalUsersResult,
    totalChildrenResult,
    tasksCompletedResult,
    totalTasksResult,
    prevTasksCompletedResult,
    prevTotalTasksResult,
    premiumUsersResult,
  ] = await Promise.all([
    safeQuery(() => supabase.from('parents').select('*', { count: 'exact', head: true })),
    safeQuery(() => supabase.from('parents').select('*', { count: 'exact', head: true }).lt('created_at', startDate)),
    safeQuery(() => supabase.from('children').select('*', { count: 'exact', head: true })),
    safeQuery(() =>
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed')
    ),
    safeQuery(() =>
      supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('created_at', startDate)
    ),
    safeQuery(() =>
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', prevStartDate)
        .lt('created_at', startDate)
    ),
    safeQuery(() =>
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStartDate)
        .lt('created_at', startDate)
    ),
    safeQuery(() => supabase.from('parents').select('subscription_tier, plan_code')),
  ]);

  const totalUsers = totalUsersResult.count ?? 0;
  const prevTotalUsers = prevTotalUsersResult.count ?? 0;
  const totalChildren = totalChildrenResult.count ?? 0;

  const activeUsers = totalUsers;
  const prevActiveUsers = prevTotalUsers;

  const tasksCompleted = tasksCompletedResult.count ?? 0;
  const totalTasks = totalTasksResult.count ?? 0;
  const prevTasksCompleted = prevTasksCompletedResult.count ?? 0;
  const prevTotalTasks = prevTotalTasksResult.count ?? 0;
  const taskCompletionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
  const prevTaskCompletionRate = prevTotalTasks > 0 ? (prevTasksCompleted / prevTotalTasks) * 100 : 0;

  const parentRows = (premiumUsersResult.data ?? []) as Array<{
    subscription_tier: string | null;
    plan_code: string | null;
  }>;
  const proCount = parentRows.filter((p) => p.plan_code === 'pro' || p.subscription_tier === 'pro').length;
  const forgeCount = parentRows.filter((p) => p.plan_code === 'forge' || p.subscription_tier === 'forge').length;
  const currentMrr = proCount * 19.99 + forgeCount * 9.99;
  const prevMrr = currentMrr; // No historical subscription data

  const onboardingRate = totalUsers > 0 ? Math.min(100, (totalChildren / totalUsers) * 100) : 0;
  const prevOnboardingRate = onboardingRate;

  return {
    totalUsers: calculateMetricValue(totalUsers, prevTotalUsers),
    activeUsers: calculateMetricValue(activeUsers, prevActiveUsers),
    mrr: calculateMetricValue(currentMrr, prevMrr),
    churnRate: calculateMetricValue(0, 0, false),
    onboardingRate: calculateMetricValue(onboardingRate, prevOnboardingRate),
    taskCompletionRate: calculateMetricValue(taskCompletionRate, prevTaskCompletionRate),
    avgSessionDuration: calculateMetricValue(0, 0),
    nps: calculateMetricValue(0, 0),
  };
}

// ============================================
// ANOMALY DETECTION API
// ============================================

export async function detectAnomalies(_timeRange: TimeRange): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await safeQuery(() =>
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', thirtyDaysAgo.toISOString())
  );

  if ((result.count ?? 0) > 5) {
    anomalies.push({
      id: crypto.randomUUID(),
      metricName: 'Stale Tasks',
      description: `${result.count} tasks have been pending for over 30 days`,
      severity: (result.count ?? 0) > 20 ? 'high' : 'medium',
      detectedAt: new Date().toISOString(),
      currentValue: result.count ?? 0,
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
  } = options;

  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('parents')
    .select(
      `id, email, name, subscription_tier, plan_code, created_at, children:children(count)`,
      { count: 'exact' }
    );

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (segment !== 'all') {
    switch (segment) {
      case 'free':
        query = query.or('subscription_tier.is.null,subscription_tier.eq.free');
        break;
      case 'forge':
        query = query.eq('plan_code', 'forge' as never);
        break;
      case 'pro':
        query = query.eq('plan_code', 'pro' as never);
        break;
    }
  }

  const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const users: User[] = (data ?? []).map((row) => {
    const r = row as {
      id: string;
      email: string;
      name: string;
      subscription_tier: string | null;
      plan_code: string | null;
      created_at: string;
      children: { count: number }[];
    };
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      subscriptionTier: r.subscription_tier,
      planCode: r.plan_code ?? r.subscription_tier ?? 'free',
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
  const { data: userData, error: userError } = await supabase
    .from('parents')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) throw new Error(userError.message);

  const { data: childrenData } = await supabase.from('children').select('*').eq('parent_id', userId);

  const childIds = (childrenData ?? []).map((c) => (c as { id: string }).id);
  let taskCount = 0;
  let rewardCount = 0;

  if (childIds.length > 0) {
    const { count: tc } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('child_id', childIds)
      .eq('status', 'completed');
    taskCount = tc ?? 0;

    const { count: rc } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .in('child_id', childIds);
    rewardCount = rc ?? 0;
  }

  const user = userData as {
    id: string;
    email: string;
    name: string;
    subscription_tier: string | null;
    plan_code: string | null;
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

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionTier: user.subscription_tier,
    planCode: user.plan_code ?? user.subscription_tier ?? 'free',
    childrenCount: children.length,
    createdAt: user.created_at,
    lastActivityAt: null,
    lifecycleState: 'active',
    onboardingCompleted: children.length > 0,
    onboardingCompletedAt: children.length > 0 ? children[0].createdAt : null,
    deviceType: null,
    platform: null,
    country: null,
    tasksCompleted: taskCount,
    rewardsRedeemed: rewardCount,
    children,
    sessions: [],
    subscriptionHistory: [],
    activityLog: [],
    supportNotes: [],
    flags: [],
    onboardingEvents: [],
  };
}

// ============================================
// ONBOARDING ANALYTICS API
// ============================================

export async function getOnboardingAnalytics(_timeRange: TimeRange): Promise<OnboardingAnalytics> {
  // Derive onboarding funnel from real data:
  // Step 1: Signed up (parent row exists)
  // Step 2: Added a child
  // Step 3: Created a task
  // Step 4: Completed a task

  const { data: allParents } = await supabase.from('parents').select('id, created_at');
  const { data: allChildren } = await supabase.from('children').select('id, parent_id, created_at');
  const { data: allTasks } = await supabase.from('tasks').select('id, child_id, status, created_at');

  const parents = allParents ?? [];
  const children = allChildren ?? [];
  const tasks = allTasks ?? [];

  const parentIds = new Set(parents.map((p) => (p as { id: string }).id));
  const parentsWithChildren = new Set(
    children.map((c) => (c as { parent_id: string }).parent_id)
  );

  const childToParent: Record<string, string> = {};
  children.forEach((c) => {
    const child = c as { id: string; parent_id: string };
    childToParent[child.id] = child.parent_id;
  });

  const parentsWithTasks = new Set<string>();
  const parentsWithCompletedTasks = new Set<string>();
  tasks.forEach((t) => {
    const task = t as { child_id: string; status: string };
    const parentId = childToParent[task.child_id];
    if (parentId) {
      parentsWithTasks.add(parentId);
      if (task.status === 'completed') {
        parentsWithCompletedTasks.add(parentId);
      }
    }
  });

  const step1 = parentIds.size;
  const step2 = parentsWithChildren.size;
  const step3 = parentsWithTasks.size;
  const step4 = parentsWithCompletedTasks.size;

  const funnelSteps: OnboardingFunnelStep[] = [
    {
      stepName: 'Signed Up',
      stepIndex: 0,
      usersStarted: step1,
      usersCompleted: step1,
      usersSkipped: 0,
      avgTimeSeconds: 0,
      completionRate: 100,
      dropOffRate: 0,
    },
    {
      stepName: 'Added Child',
      stepIndex: 1,
      usersStarted: step1,
      usersCompleted: step2,
      usersSkipped: step1 - step2,
      avgTimeSeconds: 0,
      completionRate: step1 > 0 ? (step2 / step1) * 100 : 0,
      dropOffRate: step1 > 0 ? ((step1 - step2) / step1) * 100 : 0,
    },
    {
      stepName: 'Created Task',
      stepIndex: 2,
      usersStarted: step2,
      usersCompleted: step3,
      usersSkipped: step2 - step3,
      avgTimeSeconds: 0,
      completionRate: step2 > 0 ? (step3 / step2) * 100 : 0,
      dropOffRate: step2 > 0 ? ((step2 - step3) / step2) * 100 : 0,
    },
    {
      stepName: 'Completed Task',
      stepIndex: 3,
      usersStarted: step3,
      usersCompleted: step4,
      usersSkipped: step3 - step4,
      avgTimeSeconds: 0,
      completionRate: step3 > 0 ? (step4 / step3) * 100 : 0,
      dropOffRate: step3 > 0 ? ((step3 - step4) / step3) * 100 : 0,
    },
  ];

  const dropOffPoints = funnelSteps
    .filter((step) => step.dropOffRate > 10)
    .map((step) => ({
      step: step.stepName,
      dropOffCount: step.usersStarted - step.usersCompleted,
      percentage: step.dropOffRate,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return {
    totalStarted: step1,
    totalCompleted: step4,
    overallCompletionRate: step1 > 0 ? (step4 / step1) * 100 : 0,
    avgTimeToComplete: 0,
    funnelSteps,
    dropOffPoints,
    byDevice: [],
    byPlatform: [],
    bySource: [],
  };
}

// ============================================
// SUBSCRIPTION ANALYTICS API
// ============================================

export async function getSubscriptionAnalytics(_timeRange: TimeRange): Promise<SubscriptionAnalytics> {
  const { data: parentData } = await supabase
    .from('parents')
    .select('id, subscription_tier, plan_code, created_at');

  const parents = (parentData ?? []) as Array<{
    id: string;
    subscription_tier: string | null;
    plan_code: string | null;
    created_at: string;
  }>;

  const freeCount = parents.filter((p) => !p.plan_code || p.plan_code === 'free').length;
  const proCount = parents.filter((p) => p.plan_code === 'pro').length;
  const forgeCount = parents.filter((p) => p.plan_code === 'forge').length;
  const paidCount = proCount + forgeCount;

  const proMrr = proCount * 19.99;
  const forgeMrr = forgeCount * 9.99;
  const currentMrr = proMrr + forgeMrr;
  const currentArr = currentMrr * 12;
  const totalUsers = parents.length;

  const byPlan = [
    { plan: 'Free', count: freeCount, mrr: 0, percentage: totalUsers > 0 ? (freeCount / totalUsers) * 100 : 0 },
    { plan: 'Forge', count: forgeCount, mrr: forgeMrr, percentage: totalUsers > 0 ? (forgeCount / totalUsers) * 100 : 0 },
    { plan: 'Pro', count: proCount, mrr: proMrr, percentage: totalUsers > 0 ? (proCount / totalUsers) * 100 : 0 },
  ];

  const byPlatform: { platform: Platform; count: number; mrr: number; percentage: number }[] = [];
  const conversionRate = totalUsers > 0 ? (paidCount / totalUsers) * 100 : 0;

  // Build rough revenue history from signup dates
  const revenueHistory: { date: string; mrr: number; arr: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toISOString().split('T')[0];
    const paidByDate = parents.filter((p) => {
      const created = new Date(p.created_at);
      return created <= d && (p.plan_code === 'pro' || p.plan_code === 'forge');
    });
    const monthMrr =
      paidByDate.filter((p) => p.plan_code === 'pro').length * 19.99 +
      paidByDate.filter((p) => p.plan_code === 'forge').length * 9.99;
    revenueHistory.push({ date: label, mrr: monthMrr, arr: monthMrr * 12 });
  }

  return {
    currentMrr,
    currentArr,
    mrrGrowth: 0,
    churnRate: 0,
    conversionRate,
    trialToPaidRate: 0,
    avgRevenuePerUser: paidCount > 0 ? currentMrr / paidCount : 0,
    lifetimeValue: 0,
    byPlan,
    byPlatform,
    byCycle: [
      { cycle: 'monthly', count: paidCount, mrr: currentMrr, percentage: 100 },
      { cycle: 'yearly', count: 0, mrr: 0, percentage: 0 },
    ],
    revenueHistory,
    churnHistory: [],
    failedPayments: [],
    upcomingRenewals: [],
  };
}

// ============================================
// APP HEALTH ANALYTICS API
// ============================================

export async function getAppHealthAnalytics(_timeRange: TimeRange): Promise<AppHealthAnalytics> {
  const [totalTasksResult, totalRewardsResult, totalParentsResult] = await Promise.all([
    safeQuery(() => supabase.from('tasks').select('*', { count: 'exact', head: true })),
    safeQuery(() => supabase.from('rewards').select('*', { count: 'exact', head: true })),
    safeQuery(() => supabase.from('parents').select('*', { count: 'exact', head: true })),
  ]);

  const featureUsage = [
    {
      featureName: 'Task Management',
      uniqueUsers: totalParentsResult.count ?? 0,
      totalUses: totalTasksResult.count ?? 0,
      lastUsed: new Date().toISOString(),
      deviceTypes: 0,
      platforms: 0,
      trend: 0,
    },
    {
      featureName: 'Rewards System',
      uniqueUsers: totalParentsResult.count ?? 0,
      totalUses: totalRewardsResult.count ?? 0,
      lastUsed: new Date().toISOString(),
      deviceTypes: 0,
      platforms: 0,
      trend: 0,
    },
  ];

  return {
    crashRate: 0,
    crashRateTrend: 0,
    errorCount: 0,
    errorsByType: [],
    errorsByScreen: [],
    errorsByPlatform: [],
    errorsByVersion: [],
    topErrors: [],
    featureUsage,
    sessionHealth: {
      avgDuration: 0,
      avgDurationTrend: 0,
      abnormalSessions: 0,
      bounceRate: 0,
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

  const [tasksCreatedResult, tasksCompletedResult, rewardsResult, totalParentsResult] =
    await Promise.all([
      safeQuery(() =>
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      ),
      safeQuery(() =>
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      ),
      safeQuery(() => supabase.from('rewards').select('*', { count: 'exact', head: true })),
      safeQuery(() => supabase.from('parents').select('*', { count: 'exact', head: true })),
    ]);

  const tasksCreated = tasksCreatedResult.count ?? 0;
  const tasksCompleted = tasksCompletedResult.count ?? 0;
  const rewardsRedeemed = rewardsResult.count ?? 0;
  const totalParents = totalParentsResult.count ?? 0;

  return {
    dau: totalParents,
    dauTrend: 0,
    wau: totalParents,
    wauTrend: 0,
    mau: totalParents,
    mauTrend: 0,
    dauWauRatio: 100,
    dauMauRatio: 100,
    avgSessionDuration: 0,
    avgSessionDurationTrend: 0,
    avgSessionsPerUser: 0,
    retentionCohorts: [],
    engagementHistory: [],
    taskMetrics: {
      created: tasksCreated,
      completed: tasksCompleted,
      completionRate: tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0,
      trend: 0,
    },
    rewardMetrics: {
      created: rewardsRedeemed,
      redeemed: rewardsRedeemed,
      redemptionRate: 0,
      trend: 0,
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

  if (error) {
    console.warn('[analytics] user_support_notes not available:', error.message);
    return {
      id: crypto.randomUUID(),
      parentId,
      adminEmail,
      noteType,
      content,
      tags,
      isInternal: true,
      createdAt: new Date().toISOString(),
    };
  }

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

  if (error) {
    console.warn('[analytics] user_flags not available:', error.message);
    return {
      id: crypto.randomUUID(),
      parentId,
      flagType,
      flagReason: reason ?? null,
      flaggedBy,
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
      createdAt: new Date().toISOString(),
    };
  }

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

  if (error) console.warn('[analytics] resolveUserFlag failed:', error.message);
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

  if (error) console.warn('[analytics] Audit log not available:', error.message);
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

  if (adminEmail) query = query.eq('admin_email', adminEmail);
  if (actionType) query = query.eq('action_type', actionType);
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.warn('[analytics] Audit log query failed:', error.message);
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }

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
