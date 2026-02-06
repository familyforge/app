// Admin Dashboard UI Components
// Enterprise-grade reusable components

import { type ReactNode, useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Flag,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import type { MetricValue, LoadingState, TimeRange, Anomaly, User } from './types';
import { useFilterStore } from './stores';

// ============================================
// METRIC CARD COMPONENT
// ============================================

interface MetricCardProps {
  title: string;
  metric: MetricValue;
  format?: 'number' | 'currency' | 'percent' | 'duration';
  icon?: ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

export function MetricCard({
  title,
  metric,
  format = 'number',
  icon,
  loading = false,
  onClick,
}: MetricCardProps) {
  const formatValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'duration':
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}m ${seconds}s`;
      default:
        return value.toLocaleString();
    }
  };

  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={`group relative bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 transition-all ${
        onClick ? 'cursor-pointer hover:border-violet-500/40 hover:bg-slate-800/80' : ''
      }`}
      onClick={onClick}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          {icon && (
            <div className="p-2 rounded-xl bg-slate-700/50 border border-slate-600/30">{icon}</div>
          )}
          {!loading && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                metric.isGood
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : metric.trend === 'stable'
                  ? 'bg-slate-600/30 text-slate-400 border border-slate-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              <TrendIcon size={12} />
              <span>{Math.abs(metric.changePercent).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        {loading ? (
          <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white tracking-tight">{formatValue(metric.value)}</p>
        )}

        {/* Label */}
        <p className="text-slate-400 text-sm mt-1">{title}</p>

        {/* Previous value comparison */}
        {!loading && metric.previousValue !== metric.value && (
          <p className="text-slate-500 text-xs mt-2">
            vs {formatValue(metric.previousValue)} previous period
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// ANOMALY ALERT COMPONENT
// ============================================

interface AnomalyAlertProps {
  anomaly: Anomaly;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function AnomalyAlert({ anomaly, onAcknowledge, onDismiss }: AnomalyAlertProps) {
  const severityColors = {
    low: 'border-blue-500/30 bg-blue-500/10',
    medium: 'border-amber-500/30 bg-amber-500/10',
    high: 'border-orange-500/30 bg-orange-500/10',
    critical: 'border-red-500/30 bg-red-500/10',
  };

  const severityTextColors = {
    low: 'text-blue-400',
    medium: 'text-amber-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <div className={`rounded-xl p-4 border ${severityColors[anomaly.severity]}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`${severityTextColors[anomaly.severity]} shrink-0 mt-0.5`} size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${severityTextColors[anomaly.severity]}`}>
              {anomaly.metricName}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${severityColors[anomaly.severity]} ${severityTextColors[anomaly.severity]}`}
            >
              {anomaly.severity}
            </span>
          </div>
          <p className="text-slate-300 text-sm">{anomaly.description}</p>
          <p className="text-slate-500 text-xs mt-1">
            Detected {new Date(anomaly.detectedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onAcknowledge && !anomaly.acknowledged && (
            <button
              onClick={() => onAcknowledge(anomaly.id)}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title="Acknowledge"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(anomaly.id)}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title="Dismiss"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// DATA TABLE COMPONENT
// ============================================

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  actions?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowKey,
  pagination,
  actions,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden">
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden">
        <div className="p-12 text-center">
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                className={`border-t border-slate-700/40 transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-700/30' : 'hover:bg-slate-700/20'
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-sm text-slate-300">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/40">
          <p className="text-slate-500 text-sm">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
            <span className="text-slate-400 text-sm px-2">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SEARCH & FILTER BAR
// ============================================

interface SearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  onExport?: () => void;
}

export function SearchFilterBar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  actions,
  onRefresh,
  onExport,
}: SearchFilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {/* Filters */}
      {filters}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      {actions}

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className="text-slate-400" />
        </button>
      )}

      {/* Export */}
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 transition-colors"
          title="Export"
        >
          <Download size={16} className="text-slate-400" />
        </button>
      )}
    </div>
  );
}

// ============================================
// TIME RANGE SELECTOR
// ============================================

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const options: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// LOADING STATE WRAPPER
// ============================================

interface LoadingStateProps {
  status: LoadingState;
  error?: string | null;
  onRetry?: () => void;
  children: ReactNode;
  loadingText?: string;
  emptyText?: string;
  isEmpty?: boolean;
}

export function LoadingStateWrapper({
  status,
  error,
  onRetry,
  children,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  isEmpty = false,
}: LoadingStateProps) {
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">{loadingText}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-red-400 text-sm mb-3">{error ?? 'An error occurred'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-slate-500 text-sm">{emptyText}</p>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================
// STATUS BADGE
// ============================================

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export function StatusBadge({ status, variant = 'neutral' }: StatusBadgeProps) {
  const variantClasses = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    neutral: 'bg-slate-600/30 text-slate-400 border-slate-500/30',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
      {status}
    </span>
  );
}

// ============================================
// USER ROW COMPONENT
// ============================================

interface UserRowProps {
  user: User;
  onClick?: () => void;
  onAction?: (action: string) => void;
}

export function UserRow({ user, onClick, onAction }: UserRowProps) {
  const lifecycleVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    active: 'success',
    inactive: 'warning',
    churned: 'error',
    onboarding: 'info',
    signed_up: 'neutral',
    onboarded: 'success',
  };

  const planVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    free: 'neutral',
    forge: 'info',
    pro: 'success',
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 transition-all ${
        onClick ? 'cursor-pointer hover:border-violet-500/40 hover:bg-slate-800/60' : ''
      }`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
        {user.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-medium truncate">{user.name}</h4>
          <StatusBadge status={user.planCode} variant={planVariants[user.planCode] ?? 'neutral'} />
        </div>
        <p className="text-slate-500 text-sm truncate">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-white font-semibold">{user.childrenCount}</p>
          <p className="text-slate-500 text-xs">Children</p>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">{user.tasksCompleted}</p>
          <p className="text-slate-500 text-xs">Tasks</p>
        </div>
        <StatusBadge
          status={user.lifecycleState.replace('_', ' ')}
          variant={lifecycleVariants[user.lifecycleState] ?? 'neutral'}
        />
      </div>

      {/* Actions */}
      {onAction && (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAction('view')}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            title="View details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onAction('note')}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            title="Add note"
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={() => onAction('flag')}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            title="Flag user"
          >
            <Flag size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// FUNNEL VISUALIZATION
// ============================================

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropOff: number;
}

interface FunnelVisualizationProps {
  steps: FunnelStep[];
  loading?: boolean;
}

export function FunnelVisualization({ steps, loading = false }: FunnelVisualizationProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-slate-700/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const widthPercent = (step.count / maxCount) * 100;
        const isLastStep = index === steps.length - 1;

        return (
          <div key={step.name} className="relative">
            {/* Bar */}
            <div className="relative h-14 bg-slate-800/60 rounded-xl overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500/30 to-violet-500/10 transition-all duration-500"
                style={{ width: `${widthPercent}%` }}
              />
              <div className="relative flex items-center justify-between h-full px-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-xs font-bold text-violet-300">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium">{step.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white font-semibold">{step.count.toLocaleString()}</span>
                  <span className="text-slate-400">{step.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Drop-off indicator */}
            {!isLastStep && step.dropOff > 0 && (
              <div className="flex items-center gap-2 ml-8 mt-1 text-xs">
                <TrendingDown size={12} className="text-red-400" />
                <span className="text-red-400">-{step.dropOff.toLocaleString()} dropped</span>
                <span className="text-slate-500">
                  ({((step.dropOff / step.count) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// SIMPLE LINE CHART (SVG-based)
// ============================================

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showLabels?: boolean;
  loading?: boolean;
}

export function SimpleLineChart({
  data,
  height = 120,
  color = '#8b5cf6',
  showLabels = true,
  loading = false,
}: LineChartProps) {
  if (loading || data.length === 0) {
    return (
      <div className="bg-slate-800/40 rounded-xl p-4" style={{ height }}>
        <div className="h-full bg-slate-700/30 rounded animate-pulse" />
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;
  const padding = 20;
  const chartHeight = height - padding * 2;
  const chartWidth = 100; // percentage

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((d.value - minValue) / range) * chartHeight + padding;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaPathD = `${pathD} L ${chartWidth},${chartHeight + padding} L 0,${chartHeight + padding} Z`;

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <line
            key={pct}
            x1="0%"
            x2="100%"
            y1={padding + (chartHeight * pct) / 100}
            y2={padding + (chartHeight * pct) / 100}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4"
          />
        ))}

        {/* Area fill */}
        <path d={areaPathD} fill={`${color}10`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />

        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = chartHeight - ((d.value - minValue) / range) * chartHeight + padding;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={y}
              r="3"
              fill={color}
              className="hover:r-5 transition-all cursor-pointer"
            >
              <title>
                {d.label}: {d.value.toLocaleString()}
              </title>
            </circle>
          );
        })}
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between px-1 mt-2 text-xs text-slate-500">
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ title, subtitle, children, actions, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`bg-slate-800/40 rounded-2xl border border-slate-700/40 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
          <div>
            {title && <h3 className="text-white font-semibold">{title}</h3>}
            {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="mb-4 text-slate-600">{icon}</div>}
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================
// STAT GRID
// ============================================

interface StatItem {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface StatGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export function StatGrid({ stats, columns = 4 }: StatGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{stat.label}</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">{stat.value}</span>
            {stat.trend && stat.trendValue && (
              <span
                className={`text-xs font-medium flex items-center gap-0.5 ${
                  stat.trend === 'up'
                    ? 'text-emerald-400'
                    : stat.trend === 'down'
                    ? 'text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {stat.trend === 'up' ? (
                  <TrendingUp size={12} />
                ) : stat.trend === 'down' ? (
                  <TrendingDown size={12} />
                ) : (
                  <Minus size={12} />
                )}
                {stat.trendValue}
              </span>
            )}
          </div>
          {stat.subtext && <p className="text-slate-500 text-xs mt-1">{stat.subtext}</p>}
        </div>
      ))}
    </div>
  );
}

// ============================================
// COPY BUTTON
// ============================================

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}
