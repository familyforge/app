// Admin Dashboard Pages - Enterprise Analytics
// These pages use the analytics API and components

import { useEffect, useCallback, useState } from 'react';
import {
  Users,
  Activity,
  TrendingUp,
  Zap,
  Gift,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  AlertCircle,
  Smartphone,
  Target,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  MetricCard,
  AnomalyAlert,
  DataTable,
  SearchFilterBar,
  TimeRangeSelector,
  LoadingStateWrapper,
  StatusBadge,
  UserRow,
  FunnelVisualization,
  SimpleLineChart,
  SectionHeader,
  Card,
  EmptyState,
  StatGrid,
  CopyButton,
} from './components';
import {
  useFilterStore,
  useOverviewStore,
  useUsersStore,
  useOnboardingStore,
  useSubscriptionStore,
  useAppHealthStore,
  useEngagementStore,
} from './stores';
import {
  getOverviewMetrics,
  detectAnomalies,
  getUsers,
  getUserDetail,
  getOnboardingAnalytics,
  getSubscriptionAnalytics,
  getAppHealthAnalytics,
  getEngagementAnalytics,
} from './api/analytics-engine';
import type { TimeRange, User, UserDetail, LoadingState, Anomaly } from './types';

// ============================================
// OVERVIEW DASHBOARD PAGE
// ============================================

export function OverviewDashboardPage() {
  const { timeRange, setTimeRange } = useFilterStore();
  const {
    metrics,
    anomalies,
    status,
    error,
    lastFetched,
    setMetrics,
    setAnomalies,
    setStatus,
    setError,
    setLastFetched,
  } = useOverviewStore();

  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [metricsData, anomalyData] = await Promise.all([
        getOverviewMetrics(timeRange),
        detectAnomalies(timeRange),
      ]);
      setMetrics(metricsData);
      setAnomalies(anomalyData);
      setStatus('success');
      setLastFetched(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setStatus('error');
    }
  }, [timeRange, setMetrics, setAnomalies, setStatus, setError, setLastFetched]);

  useEffect(() => {
    // Auto-refresh every 5 minutes
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const acknowledgeAnomaly = (id: string) => {
    setAnomalies(anomalies.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const dismissAnomaly = (id: string) => {
    setAnomalies(anomalies.filter(a => a.id !== id));
  };

  const criticalAnomalies = anomalies.filter(a => !a.acknowledged && (a.severity === 'critical' || a.severity === 'high'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time metrics and system health</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} className={`text-slate-400 ${status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Anomaly Alerts */}
      {criticalAnomalies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertCircle className="text-red-400" size={16} />
            Attention Required ({criticalAnomalies.length})
          </h3>
          {criticalAnomalies.map((anomaly) => (
            <AnomalyAlert
              key={anomaly.id}
              anomaly={anomaly}
              onAcknowledge={acknowledgeAnomaly}
              onDismiss={dismissAnomaly}
            />
          ))}
        </div>
      )}

      <LoadingStateWrapper
        status={status}
        error={error}
        onRetry={fetchData}
        loadingText="Loading dashboard metrics..."
      >
        {metrics && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="Total Users"
                metric={metrics.totalUsers}
                icon={<Users size={18} className="text-violet-400" />}
              />
              <MetricCard
                title="Active Users"
                metric={metrics.activeUsers}
                icon={<TrendingUp size={18} className="text-emerald-400" />}
              />
              <MetricCard
                title="Task Completion Rate"
                metric={metrics.taskCompletionRate}
                format="percent"
                icon={<Zap size={18} className="text-amber-400" />}
              />
              <MetricCard
                title="Onboarding Rate"
                metric={metrics.onboardingRate}
                format="percent"
                icon={<Gift size={18} className="text-pink-400" />}
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                title="Monthly Recurring Revenue"
                metric={metrics.mrr}
                format="currency"
                icon={<CreditCard size={18} className="text-green-400" />}
              />
              <MetricCard
                title="Avg Session Duration"
                metric={metrics.avgSessionDuration}
                format="duration"
                icon={<Clock size={18} className="text-blue-400" />}
              />
              <MetricCard
                title="Churn Rate"
                metric={metrics.churnRate}
                format="percent"
                icon={<Target size={18} className="text-orange-400" />}
              />
            </div>

            {/* NPS Score Card */}
            <Card title="Net Promoter Score">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-4xl font-bold text-white">{metrics.nps.value}</p>
                  <p className={`text-sm ${metrics.nps.isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {metrics.nps.trend === 'up' ? '↑' : metrics.nps.trend === 'down' ? '↓' : '→'}{' '}
                    {Math.abs(metrics.nps.changePercent).toFixed(1)}% from last period
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg ${metrics.nps.value >= 50 ? 'bg-emerald-500/20 text-emerald-400' : metrics.nps.value >= 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                  {metrics.nps.value >= 50 ? 'Excellent' : metrics.nps.value >= 0 ? 'Good' : 'Needs Work'}
                </div>
              </div>
            </Card>

            {/* Last Updated */}
            {lastFetched && (
              <p className="text-slate-600 text-xs text-right">
                Last updated: {new Date(lastFetched).toLocaleTimeString()}
              </p>
            )}
          </>
        )}
      </LoadingStateWrapper>
    </div>
  );
}

// ============================================
// USER MANAGEMENT PAGE
// ============================================

export function UserManagementPage() {
  const { timeRange, searchQuery, setSearchQuery } = useFilterStore();
  const {
    users,
    total,
    page,
    pageSize,
    status,
    error,
    setUsers,
    setTotal,
    setPage,
    setStatus,
    setError,
  } = useUsersStore();

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userDetailStatus, setUserDetailStatus] = useState<LoadingState>('idle');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const fetchUsers = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getUsers({
        page,
        pageSize,
        search: searchQuery,
        segment: planFilter === 'all' ? undefined : planFilter as 'free' | 'forge' | 'pro',
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setUsers(result.data);
      setTotal(result.total);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setStatus('error');
    }
  }, [page, pageSize, searchQuery, planFilter, setUsers, setTotal, setStatus, setError]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const loadUserDetail = async (userId: string) => {
    setUserDetailStatus('loading');
    try {
      const detail = await getUserDetail(userId);
      setSelectedUser(detail);
      setUserDetailStatus('success');
    } catch {
      setUserDetailStatus('error');
    }
  };

  const handleUserAction = (user: User, action: string) => {
    if (action === 'view') {
      loadUserDetail(user.id);
    }
    // Handle other actions (note, flag) - would open modals
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="User Management"
        description="View and manage all platform users"
      />

      {/* Search and Filters */}
      <SearchFilterBar
        searchPlaceholder="Search by name or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={fetchUsers}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={lifecycleFilter}
              onChange={(e) => setLifecycleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm"
            >
              <option value="all">All States</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
              <option value="onboarding">Onboarding</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="forge">Forge</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span>{total.toLocaleString()} total users</span>
        <span className="text-slate-600">|</span>
        <span>Page {page} of {Math.ceil(total / pageSize)}</span>
      </div>

      {/* User Detail Drawer (would normally slide in) */}
      {selectedUser && (
        <Card
          title={selectedUser.name}
          subtitle={selectedUser.email}
          className="border-violet-500/30"
          actions={
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
            >
              ×
            </button>
          }
        >
          <LoadingStateWrapper status={userDetailStatus} error={null}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Account Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan</span>
                    <span className="text-white">{selectedUser.planCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lifecycle State</span>
                    <StatusBadge status={selectedUser.lifecycleState} variant="info" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created</span>
                    <span className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Active</span>
                    <span className="text-white">{selectedUser.lastActivityAt ? new Date(selectedUser.lastActivityAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Family Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Children</span>
                    <span className="text-white">{selectedUser.children?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tasks Completed</span>
                    <span className="text-white">{selectedUser.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rewards Redeemed</span>
                    <span className="text-white">{selectedUser.rewardsRedeemed?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Children List */}
            {selectedUser.children && selectedUser.children.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Children</h4>
                <div className="space-y-2">
                  {selectedUser.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div>
                        <span className="text-white font-medium">{child.name}</span>
                        <span className="text-slate-500 text-sm ml-2">Age {child.age}</span>
                      </div>
                      <span className="text-violet-400 font-semibold">{child.points.toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </LoadingStateWrapper>
        </Card>
      )}

      {/* Users List */}
      <LoadingStateWrapper
        status={status}
        error={error}
        onRetry={fetchUsers}
        loadingText="Loading users..."
        isEmpty={users.length === 0}
        emptyText="No users found matching your criteria"
      >
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onClick={() => loadUserDetail(user.id)}
              onAction={(action) => handleUserAction(user, action)}
            />
          ))}
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg"
            >
              Previous
            </button>
            <span className="text-slate-400 px-4">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg"
            >
              Next
            </button>
          </div>
        )}
      </LoadingStateWrapper>
    </div>
  );
}

// ============================================
// ONBOARDING ANALYTICS PAGE
// ============================================

export function OnboardingAnalyticsPage() {
  const { timeRange, setTimeRange } = useFilterStore();
  const { analytics, status, error, setAnalytics, setStatus, setError } = useOnboardingStore();

  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const data = await getOnboardingAnalytics(timeRange);
      setAnalytics(data);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding data');
      setStatus('error');
    }
  }, [timeRange, setAnalytics, setStatus, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const funnelSteps = analytics?.funnelSteps?.map((step, i, arr) => ({
    name: step.stepName,
    count: step.usersStarted,
    percentage: step.completionRate,
    dropOff: i > 0 ? arr[i - 1].usersStarted - step.usersStarted : 0,
  })) ?? [];

  // Identify biggest drop-off point
  const biggestDropOff = funnelSteps.reduce((max, step, i) => {
    if (i === 0) return max;
    const dropOffRate = step.dropOff / (funnelSteps[i - 1]?.count ?? 1);
    return dropOffRate > (max?.rate ?? 0) ? { step: step.name, rate: dropOffRate, count: step.dropOff } : max;
  }, null as { step: string; rate: number; count: number } | null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Onboarding Analytics"
          description="Track user onboarding progress and identify drop-off points"
        />
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <LoadingStateWrapper
        status={status}
        error={error}
        onRetry={fetchData}
        loadingText="Loading onboarding analytics..."
      >
        {analytics && (
          <>
            {/* Key Stats */}
            <StatGrid
              stats={[
                {
                  label: 'Total Started',
                  value: analytics.totalStarted.toLocaleString(),
                },
                {
                  label: 'Fully Onboarded',
                  value: analytics.totalCompleted.toLocaleString(),
                },
                {
                  label: 'Completion Rate',
                  value: `${analytics.overallCompletionRate.toFixed(1)}%`,
                  trend: analytics.overallCompletionRate >= 50 ? 'up' : 'down',
                  trendValue: `${analytics.overallCompletionRate >= 50 ? '+' : ''}${(analytics.overallCompletionRate - 50).toFixed(1)}% vs target`,
                },
                {
                  label: 'Avg Time to Complete',
                  value: formatDuration(analytics.avgTimeToComplete),
                },
              ]}
            />

            {/* Problem Alert */}
            {biggestDropOff && biggestDropOff.rate > 0.3 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-amber-400 font-semibold">High Drop-off Detected</h4>
                    <p className="text-slate-300 text-sm mt-1">
                      <strong>{biggestDropOff.count.toLocaleString()}</strong> users dropped off at{' '}
                      <strong>"{biggestDropOff.step}"</strong> ({(biggestDropOff.rate * 100).toFixed(1)}% of users at that
                      step). Consider simplifying this step.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Funnel Visualization */}
            <Card title="Onboarding Funnel" subtitle="User progression through setup steps">
              <FunnelVisualization steps={funnelSteps} />
            </Card>

            {/* Drop-off by Step */}
            <Card title="Step Performance">
              <DataTable
                columns={[
                  { key: 'stepName', header: 'Step' },
                  { key: 'usersStarted', header: 'Users', render: (row) => row.usersStarted.toLocaleString() },
                  {
                    key: 'completionRate',
                    header: 'Conversion',
                    render: (row) => `${row.completionRate.toFixed(1)}%`,
                  },
                  {
                    key: 'avgTimeSeconds',
                    header: 'Avg Duration',
                    render: (row) => formatDuration(row.avgTimeSeconds),
                  },
                ]}
                data={analytics.funnelSteps}
                rowKey={(row) => row.stepName}
                emptyMessage="No onboarding data available"
              />
            </Card>
          </>
        )}
      </LoadingStateWrapper>
    </div>
  );
}

// ============================================
// SUBSCRIPTION ANALYTICS PAGE
// ============================================

export function SubscriptionAnalyticsPage() {
  const { timeRange, setTimeRange } = useFilterStore();
  const { analytics, status, error, setAnalytics, setStatus, setError } = useSubscriptionStore();

  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const data = await getSubscriptionAnalytics(timeRange);
      setAnalytics(data);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
      setStatus('error');
    }
  }, [timeRange, setAnalytics, setStatus, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Subscription Intelligence"
          description="Revenue metrics, churn analysis, and subscription health"
        />
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <LoadingStateWrapper
        status={status}
        error={error}
        onRetry={fetchData}
        loadingText="Loading subscription analytics..."
      >
        {analytics && (
          <>
            {/* Revenue Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl p-5 border border-emerald-500/30">
                <p className="text-emerald-400 text-sm font-medium mb-1">Monthly Recurring Revenue</p>
                <p className="text-3xl font-bold text-white">
                  ${analytics.currentMrr.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-5 border border-blue-500/30">
                <p className="text-blue-400 text-sm font-medium mb-1">Annual Recurring Revenue</p>
                <p className="text-3xl font-bold text-white">
                  ${analytics.currentArr.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-2xl p-5 border border-violet-500/30">
                <p className="text-violet-400 text-sm font-medium mb-1">Avg Revenue / User</p>
                <p className="text-3xl font-bold text-white">
                  ${analytics.avgRevenuePerUser.toFixed(2)}
                </p>
              </div>
              <div className={`bg-gradient-to-br ${analytics.churnRate > 5 ? 'from-red-500/20 to-red-600/10 border-red-500/30' : 'from-slate-500/20 to-slate-600/10 border-slate-500/30'} rounded-2xl p-5 border`}>
                <p className={`${analytics.churnRate > 5 ? 'text-red-400' : 'text-slate-400'} text-sm font-medium mb-1`}>Churn Rate</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.churnRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Plan Distribution */}
            <Card title="Subscription Distribution">
              <div className="grid grid-cols-3 gap-4">
                {analytics.byPlan.map((plan) => (
                  <div
                    key={plan.plan}
                    className="p-4 bg-slate-700/30 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold capitalize">{plan.plan}</span>
                      <StatusBadge
                        status={`${plan.percentage.toFixed(1)}%`}
                        variant={plan.plan === 'pro' ? 'success' : plan.plan === 'forge' ? 'info' : 'neutral'}
                      />
                    </div>
                    <p className="text-2xl font-bold text-white">{plan.count.toLocaleString()}</p>
                    <p className="text-slate-500 text-sm">users</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Revenue History Chart */}
            <Card title="Revenue History">
              {analytics.revenueHistory.length > 0 ? (
                <SimpleLineChart
                  data={analytics.revenueHistory.map((item) => ({
                    label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: item.mrr,
                  }))}
                  color="#10b981"
                />
              ) : (
                <EmptyState title="No revenue history" description="Revenue data will appear here" />
              )}
            </Card>
          </>
        )}
      </LoadingStateWrapper>
    </div>
  );
}

// ============================================
// APP HEALTH PAGE
// ============================================

export function AppHealthPage() {
  const { timeRange, setTimeRange } = useFilterStore();
  const { analytics, status, error, setAnalytics, setStatus, setError } = useAppHealthStore();

  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const data = await getAppHealthAnalytics(timeRange);
      setAnalytics(data);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load app health data');
      setStatus('error');
    }
  }, [timeRange, setAnalytics, setStatus, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="App Health & Devices"
          description="Crash rates, errors, and device distribution"
        />
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <LoadingStateWrapper
        status={status}
        error={error}
        onRetry={fetchData}
        loadingText="Loading app health data..."
      >
        {analytics && (
          <>
            {/* Health Status */}
            <div className="grid grid-cols-4 gap-4">
              <div className={`bg-gradient-to-br ${analytics.crashRate <= 1 ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' : analytics.crashRate <= 5 ? 'from-amber-500/20 to-amber-600/10 border-amber-500/30' : 'from-red-500/20 to-red-600/10 border-red-500/30'} rounded-2xl p-5 border`}>
                <p className={`${analytics.crashRate <= 1 ? 'text-emerald-400' : analytics.crashRate <= 5 ? 'text-amber-400' : 'text-red-400'} text-sm font-medium mb-1`}>Crash Rate</p>
                <p className="text-3xl font-bold text-white">{analytics.crashRate.toFixed(2)}‰</p>
              </div>
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
                <p className="text-slate-400 text-sm font-medium mb-1">Total Errors</p>
                <p className="text-3xl font-bold text-white">{analytics.errorCount.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
                <p className="text-slate-400 text-sm font-medium mb-1">Bounce Rate</p>
                <p className="text-3xl font-bold text-white">{analytics.sessionHealth.bounceRate.toFixed(1)}%</p>
              </div>
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
                <p className="text-slate-400 text-sm font-medium mb-1">Avg Session Duration</p>
                <p className="text-3xl font-bold text-white">{formatDuration(analytics.sessionHealth.avgDuration)}</p>
              </div>
            </div>

            {/* Top Errors */}
            <Card title="Top Errors" subtitle="Most frequent issues">
              {analytics.topErrors.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      key: 'errorType',
                      header: 'Error Type',
                      render: (row) => (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-red-400" size={14} />
                          <span className="font-mono text-sm">{row.errorType}</span>
                        </div>
                      ),
                    },
                    { key: 'errorMessage', header: 'Message', render: (row) => row.errorMessage ?? 'Unknown' },
                    { key: 'screen', header: 'Screen', render: (row) => row.screen ?? 'N/A' },
                    {
                      key: 'occurredAt',
                      header: 'Last Seen',
                      render: (row) => new Date(row.occurredAt).toLocaleDateString(),
                    },
                  ]}
                  data={analytics.topErrors}
                  rowKey={(row) => row.id}
                />
              ) : (
                <EmptyState icon={<Smartphone size={32} />} title="No errors recorded" description="Your app is running smoothly!" />
              )}
            </Card>

            {/* Device & Platform Distribution */}
            <div className="grid grid-cols-2 gap-6">
              <Card title="Platform Distribution">
                <div className="space-y-3">
                  {analytics.errorsByPlatform.map((platform) => (
                    <div key={platform.platform} className="flex items-center gap-4">
                      <div className="w-20 text-slate-400 text-sm">{platform.platform}</div>
                      <div className="flex-1 h-8 bg-slate-700/30 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-violet-600"
                          style={{ width: `${Math.min(100, platform.count / 10)}%` }}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-white font-medium">{platform.count.toLocaleString()}</span>
                        <span className="text-slate-500 text-sm ml-1">(crash: {platform.crashRate.toFixed(1)}‰)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Feature Usage">
                <div className="space-y-3">
                  {analytics.featureUsage.slice(0, 6).map((feature) => (
                    <div key={feature.featureName} className="flex items-center gap-4">
                      <div className="flex-1 text-slate-300 text-sm truncate">{feature.featureName}</div>
                      <div className="w-20 text-right">
                        <span className="text-white font-medium">{feature.totalUses.toLocaleString()}</span>
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-slate-500 text-sm">{feature.uniqueUsers.toLocaleString()} users</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </LoadingStateWrapper>
    </div>
  );
}

// ============================================
// ENGAGEMENT ANALYTICS PAGE
// ============================================

export function EngagementAnalyticsPage() {
  const { timeRange, setTimeRange } = useFilterStore();
  const { analytics, status, error, setAnalytics, setStatus, setError } = useEngagementStore();

  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const data = await getEngagementAnalytics(timeRange);
      setAnalytics(data);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engagement data');
      setStatus('error');
    }
  }, [timeRange, setAnalytics, setStatus, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Engagement & Retention"
          description="User activity, retention cohorts, and engagement metrics"
        />
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <LoadingStateWrapper
        status={status}
        error={error}
        onRetry={fetchData}
        loadingText="Loading engagement data..."
      >
        {analytics && (
          <>
            {/* Active User Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
                <p className="text-slate-400 text-sm font-medium mb-1">Daily Active Users</p>
                <p className="text-3xl font-bold text-white">{analytics.dau.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
                <p className="text-slate-400 text-sm font-medium mb-1">Weekly Active Users</p>
                <p className="text-3xl font-bold text-white">{analytics.wau.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
                <p className="text-slate-400 text-sm font-medium mb-1">Monthly Active Users</p>
                <p className="text-3xl font-bold text-white">{analytics.mau.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-2xl p-5 border border-violet-500/30">
                <p className="text-violet-400 text-sm font-medium mb-1">DAU/MAU Ratio</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.mau > 0 ? ((analytics.dau / analytics.mau) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Retention Cohorts */}
            <Card title="Retention Cohorts" subtitle="Week-over-week retention">
              {analytics.retentionCohorts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/40">
                        <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Cohort</th>
                        <th className="text-center px-4 py-2 text-xs text-slate-500 font-semibold">D1</th>
                        <th className="text-center px-4 py-2 text-xs text-slate-500 font-semibold">D7</th>
                        <th className="text-center px-4 py-2 text-xs text-slate-500 font-semibold">D14</th>
                        <th className="text-center px-4 py-2 text-xs text-slate-500 font-semibold">D30</th>
                        <th className="text-center px-4 py-2 text-xs text-slate-500 font-semibold">D60</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.retentionCohorts.map((cohort) => (
                        <tr key={cohort.cohort} className="border-t border-slate-700/30">
                          <td className="px-4 py-3 text-sm text-white">{cohort.cohort}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <RetentionCell value={cohort.d1} />
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <RetentionCell value={cohort.d7} />
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <RetentionCell value={cohort.d14} />
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <RetentionCell value={cohort.d30} />
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <RetentionCell value={cohort.d60} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No retention data" description="Cohort data will appear as users return" />
              )}
            </Card>

            {/* Activity Stats */}
            <Card title="Task & Reward Activity">
              <StatGrid
                columns={2}
                stats={[
                  { label: 'Tasks Created', value: analytics.taskMetrics.created.toLocaleString() },
                  { label: 'Tasks Completed', value: analytics.taskMetrics.completed.toLocaleString() },
                  { label: 'Rewards Created', value: analytics.rewardMetrics.created.toLocaleString() },
                  { label: 'Rewards Redeemed', value: analytics.rewardMetrics.redeemed.toLocaleString() },
                ]}
              />
            </Card>
          </>
        )}
      </LoadingStateWrapper>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function RetentionCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-slate-600">—</span>;
  }

  const bgIntensity = Math.min(Math.floor(value / 10) * 10, 100);
  const bgColor = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-slate-500';

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium text-white ${bgColor}`}
      style={{ opacity: 0.3 + (bgIntensity / 100) * 0.7 }}
    >
      {value.toFixed(0)}%
    </span>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—';
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}
