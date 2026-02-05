/**
 * FamilyForge Email System - Analytics Dashboard Component
 * 
 * Displays email delivery stats, engagement metrics, and trends.
 * This is an ADDITIVE component that can be integrated into EmailSystemPage.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  CheckCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Download,
  ChevronDown,
  ArrowUpRight,
  Users,
} from 'lucide-react';
import type { EmailAnalytics, EmailDeliveryRecord } from './types';
import { getEmailAnalytics, getDeliveryRecords, getRecentEmailActivity } from './email-api';

// ============== TYPES ==============

interface EmailAnalyticsDashboardProps {
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red';
}

// ============== METRIC CARD ==============

function MetricCard({ label, value, change, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    purple: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/30',
    green: 'bg-emerald-500/30',
    purple: 'bg-violet-500/30',
    amber: 'bg-amber-500/30',
    red: 'bg-red-500/30',
  };

  return (
    <div className={`p-5 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            change >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== SIMPLE BAR CHART ==============

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
}

function SimpleBarChart({ data, maxValue, height = 200 }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, index) => {
        const heightPercent = (item.value / max) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${heightPercent}%`,
                minHeight: item.value > 0 ? 4 : 0,
                backgroundColor: item.color || '#6366f1',
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-slate-400 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============== DELIVERY STATUS TABLE ==============

interface DeliveryTableProps {
  records: EmailDeliveryRecord[];
  loading?: boolean;
}

function DeliveryTable({ records, loading }: DeliveryTableProps) {
  const getStatusBadge = (status: EmailDeliveryRecord['status']) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Pending' },
      sent: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Sent' },
      delivered: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Delivered' },
      opened: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Opened' },
      clicked: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Clicked' },
      bounced: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Bounced' },
      failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
      unsubscribed: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Unsubscribed' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No delivery records yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-slate-700">
            <th className="pb-3 font-medium text-slate-400 text-sm">Recipient</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">Template</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">Status</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">Sent</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">Opened</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
              <td className="py-3 text-sm text-white">{record.recipientEmail}</td>
              <td className="py-3 text-sm text-slate-400">{record.templateId}</td>
              <td className="py-3">{getStatusBadge(record.status)}</td>
              <td className="py-3 text-sm text-slate-400">
                {record.sentAt ? new Date(record.sentAt).toLocaleDateString() : '-'}
              </td>
              <td className="py-3 text-sm text-slate-400">
                {record.openedAt ? new Date(record.openedAt).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============== MAIN COMPONENT ==============

export function EmailAnalyticsDashboard({ className = '' }: EmailAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [analytics, setAnalytics] = useState<EmailAnalytics[]>([]);
  const [deliveryRecords, setDeliveryRecords] = useState<EmailDeliveryRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState<{
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
  }>({ totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0 });
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [analyticsData, deliveryData, activityData] = await Promise.all([
          getEmailAnalytics(undefined, startDate.toISOString().split('T')[0]),
          getDeliveryRecords(undefined, undefined, 50),
          getRecentEmailActivity(days),
        ]);

        setAnalytics(analyticsData);
        setDeliveryRecords(deliveryData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  // Calculate rates
  const openRate = recentActivity.totalSent > 0
    ? ((recentActivity.totalOpened / recentActivity.totalSent) * 100).toFixed(1)
    : '0';
  const clickRate = recentActivity.totalOpened > 0
    ? ((recentActivity.totalClicked / recentActivity.totalOpened) * 100).toFixed(1)
    : '0';
  const bounceRate = recentActivity.totalSent > 0
    ? ((recentActivity.totalBounced / recentActivity.totalSent) * 100).toFixed(1)
    : '0';

  // Prepare chart data from analytics
  const chartData = analytics.slice(0, 7).reverse().map((a) => {
    const labelDate = a.periodStart ?? a.periodEnd ?? new Date().toISOString();
    return {
      label: new Date(labelDate).toLocaleDateString('en-US', { weekday: 'short' }),
      value: a.totalSent,
      color: '#6366f1',
    };
  });

  // If no real data, show placeholder
  const hasData = recentActivity.totalSent > 0 || analytics.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Email Analytics</h2>
            <p className="text-sm text-slate-400">Track delivery and engagement metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">
                {timeRange === '7d' ? 'Last 7 days' : 
                 timeRange === '30d' ? 'Last 30 days' : 
                 timeRange === '90d' ? 'Last 90 days' : 'All time'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
                {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${
                      timeRange === range ? 'bg-violet-500/20 text-violet-400' : 'text-slate-300'
                    }`}
                  >
                    {range === '7d' ? 'Last 7 days' : 
                     range === '30d' ? 'Last 30 days' : 
                     range === '90d' ? 'Last 90 days' : 'All time'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors">
            <Download className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Export</span>
          </button>

          {/* Refresh Button */}
          <button 
            onClick={() => setTimeRange(timeRange)}
            className="p-2 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Emails Sent"
          value={recentActivity.totalSent.toLocaleString()}
          icon={<Mail className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          label="Open Rate"
          value={`${openRate}%`}
          icon={<Eye className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          label="Click Rate"
          value={`${clickRate}%`}
          icon={<MousePointerClick className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          label="Bounce Rate"
          value={`${bounceRate}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={Number(bounceRate) > 5 ? 'red' : 'amber'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Volume Chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4">Email Volume</h3>
          {hasData && chartData.length > 0 ? (
            <SimpleBarChart data={chartData} height={180} />
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No data for this period</p>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4">Engagement Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Opened', value: recentActivity.totalOpened, total: recentActivity.totalSent, color: '#22c55e' },
              { label: 'Clicked', value: recentActivity.totalClicked, total: recentActivity.totalOpened || 1, color: '#8b5cf6' },
              { label: 'Bounced', value: recentActivity.totalBounced, total: recentActivity.totalSent, color: '#f59e0b' },
            ].map((item) => {
              const percent = item.total > 0 ? (item.value / item.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-white">
                      {item.value.toLocaleString()} ({percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Recent Deliveries</h3>
          <button className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
            View all <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <DeliveryTable records={deliveryRecords} loading={loading} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Recipients</span>
          </div>
          <span className="text-3xl font-bold">{recentActivity.totalSent.toLocaleString()}</span>
          <p className="text-sm mt-2 opacity-80">unique emails in period</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Delivery Rate</span>
          </div>
          <span className="text-3xl font-bold">
            {recentActivity.totalSent > 0
              ? (((recentActivity.totalSent - recentActivity.totalBounced) / recentActivity.totalSent) * 100).toFixed(1)
              : '0'}%
          </span>
          <p className="text-sm mt-2 opacity-80">successfully delivered</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Best Performing</span>
          </div>
          <span className="text-xl font-bold truncate block">
            {analytics.length > 0 && analytics[0].openRate > 0
              ? `${analytics[0].openRate.toFixed(1)}% open rate`
              : 'No data yet'}
          </span>
          <p className="text-sm mt-2 opacity-80">
            {analytics.length > 0 ? analytics[0].templateId : 'Send emails to see stats'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailAnalyticsDashboard;
