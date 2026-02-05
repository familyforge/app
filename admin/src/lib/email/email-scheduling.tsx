/**
 * FamilyForge Email System - Scheduling Component
 * 
 * Schedule emails for future delivery with timezone support.
 * This is an ADDITIVE component that can be integrated into EmailSystemPage.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  Trash2,
  Play,
  Pause,
  Eye,
  RefreshCw,
  Info,
  Send,
} from 'lucide-react';
import type { EmailSchedule, SegmentFilters } from './types';
import { getScheduledEmails, createScheduledEmail, cancelScheduledEmail, estimateRecipientCount } from './email-api';

// ============== TYPES ==============

interface EmailSchedulerProps {
  templateId: string;
  templateName: string;
  segmentFilters?: SegmentFilters;
  onClose?: () => void;
  onScheduled?: (schedule: EmailSchedule) => void;
  currentUserEmail: string;
}

interface SchedulerListProps {
  className?: string;
  onViewSchedule?: (schedule: EmailSchedule) => void;
}

// ============== TIMEZONE LIST ==============

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'America/Phoenix', label: 'Arizona (No DST)', offset: '-07:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: '-09:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: '-10:00' },
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: '+01:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: '+10:00' },
];

// ============== SCHEDULER MODAL ==============

export function EmailScheduler({
  templateId,
  templateName,
  segmentFilters,
  onClose,
  onScheduled,
  currentUserEmail,
}: EmailSchedulerProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Estimate recipient count
  useEffect(() => {
    async function estimate() {
      const count = await estimateRecipientCount(segmentFilters);
      setRecipientCount(count);
    }
    estimate();
  }, [segmentFilters]);

  const handleSchedule = async () => {
    if (!date || !time) {
      setError('Please select a date and time');
      return;
    }

    // Parse the scheduled time
    const scheduledAt = new Date(`${date}T${time}:00`);
    const now = new Date();

    if (scheduledAt <= now) {
      setError('Scheduled time must be in the future');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const schedule = await createScheduledEmail(
        templateId,
        scheduledAt.toISOString(),
        timezone,
        currentUserEmail,
        segmentFilters
      );

      if (schedule) {
        onScheduled?.(schedule);
        onClose?.();
      } else {
        setError('Failed to create schedule. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while scheduling the email.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate local time display
  const getLocalTimeDisplay = () => {
    if (!date || !time) return '';
    try {
      const dt = new Date(`${date}T${time}:00`);
      return dt.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Schedule Email</h2>
              <p className="text-sm text-slate-400">{templateName}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Summary */}
          {date && time && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-violet-300">
                    Scheduled for {getLocalTimeDisplay()}
                  </p>
                  <p className="text-sm text-violet-400 mt-1">
                    in {TIMEZONES.find(tz => tz.value === timezone)?.label || timezone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recipients Info */}
          <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg">
            <Users className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white">
                {recipientCount !== null ? recipientCount.toLocaleString() : '...'} recipients
              </p>
              <p className="text-xs text-slate-400">
                {segmentFilters ? 'Based on segment filters' : 'All active users'}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={isSubmitting || !date || !time}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Schedule Email
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== SCHEDULER LIST ==============

export function SchedulerList({ className = '', onViewSchedule }: SchedulerListProps) {
  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  // Fetch schedules
  useEffect(() => {
    async function fetchSchedules() {
      setLoading(true);
      try {
        const data = await getScheduledEmails(
          filter === 'all' ? undefined : filter
        );
        setSchedules(data);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedules();
  }, [filter]);

  const handleCancel = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) {
      return;
    }

    const success = await cancelScheduledEmail(scheduleId);
    if (success) {
      setSchedules(prev =>
        prev.map(s => (s.id === scheduleId ? { ...s, status: 'cancelled' as const } : s))
      );
    }
  };

  const getStatusBadge = (status: EmailSchedule['status']) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      scheduled: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        icon: <Clock className="w-3 h-3" />,
      },
      processing: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        icon: <RefreshCw className="w-3 h-3 animate-spin" />,
      },
      completed: {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      cancelled: {
        bg: 'bg-slate-500/20',
        text: 'text-slate-400',
        icon: <X className="w-3 h-3" />,
      },
      failed: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        icon: <AlertTriangle className="w-3 h-3" />,
      },
    };
    const badge = badges[status] || badges.scheduled;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-white">Scheduled Emails</h3>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No scheduled emails</p>
            <p className="text-sm mt-1">Schedule an email to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{schedule.templateId}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(schedule.scheduledAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                      <span className="text-slate-600">•</span>
                      <Users className="w-3 h-3" />
                      <span>{schedule.recipientCount?.toLocaleString() || '0'} recipients</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(schedule.status)}
                  
                  {schedule.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancel(schedule.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {onViewSchedule && (
                    <button
                      onClick={() => onViewSchedule(schedule)}
                      className="p-2 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============== QUICK SCHEDULE BUTTON ==============

interface QuickScheduleButtonProps {
  templateId: string;
  templateName: string;
  currentUserEmail: string;
  segmentFilters?: SegmentFilters;
  onScheduled?: (schedule: EmailSchedule) => void;
}

export function QuickScheduleButton({
  templateId,
  templateName,
  currentUserEmail,
  segmentFilters,
  onScheduled,
}: QuickScheduleButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Schedule</span>
      </button>

      {showModal && (
        <EmailScheduler
          templateId={templateId}
          templateName={templateName}
          segmentFilters={segmentFilters}
          currentUserEmail={currentUserEmail}
          onClose={() => setShowModal(false)}
          onScheduled={(schedule) => {
            onScheduled?.(schedule);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

export default EmailScheduler;
