/**
 * FamilyForge Email System - Compliance & Safety Dashboard
 * 
 * Global kill switch, quiet hours, throttling, and compliance request management.
 * This is an ADDITIVE component that can be integrated into EmailSystemPage.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Power,
  Moon,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Settings,
  FileText,
  Mail,
  Trash2,
  Eye,
  AlertOctagon,
  Activity,
  Download,
  UserMinus,
} from 'lucide-react';
import type { EmailSystemConfig, ComplianceRecord, QuietHoursConfig, ThrottleConfig } from './types';
import { getEmailSystemConfig, updateEmailSystemConfig, getComplianceRecords, processComplianceRequest } from './email-api';

// ============== TYPES ==============

interface ComplianceDashboardProps {
  currentUserEmail: string;
  className?: string;
}

interface KillSwitchCardProps {
  config: EmailSystemConfig | null;
  onToggle: (enabled: boolean) => void;
  loading?: boolean;
}

interface QuietHoursCardProps {
  config: QuietHoursConfig;
  onChange: (config: QuietHoursConfig) => void;
}

interface ThrottleCardProps {
  config: ThrottleConfig;
  onChange: (config: ThrottleConfig) => void;
}

// ============== KILL SWITCH CARD ==============

function KillSwitchCard({ config, onToggle, loading }: KillSwitchCardProps) {
  const isEnabled = config?.globalKillSwitch ?? false;

  return (
    <div
      className={`p-6 rounded-xl border-2 transition-colors ${
        isEnabled
          ? 'bg-red-500/10 border-red-500/50'
          : 'bg-emerald-500/10 border-emerald-500/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl ${
              isEnabled ? 'bg-red-500/20' : 'bg-emerald-500/20'
            }`}
          >
            {isEnabled ? (
              <AlertOctagon className="w-8 h-8 text-red-400" />
            ) : (
              <Power className="w-8 h-8 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Email System {isEnabled ? 'DISABLED' : 'Active'}
            </h3>
            <p className={`text-sm mt-1 ${isEnabled ? 'text-red-300' : 'text-emerald-300'}`}>
              {isEnabled
                ? 'All email sending is currently halted. No emails will be delivered.'
                : 'Email system is operational. Emails are being sent normally.'}
            </p>
            {isEnabled && config?.killSwitchEnabledAt && (
              <p className="text-xs text-red-400 mt-2">
                Disabled on {new Date(config.killSwitchEnabledAt).toLocaleString()}
                {config.killSwitchEnabledBy && ` by ${config.killSwitchEnabledBy}`}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => onToggle(!isEnabled)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isEnabled
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          } disabled:opacity-50`}
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isEnabled ? (
            'Enable Sending'
          ) : (
            'STOP ALL EMAILS'
          )}
        </button>
      </div>
    </div>
  );
}

// ============== QUIET HOURS CARD ==============

function QuietHoursCard({ config, onChange }: QuietHoursCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onChange(localConfig);
    setIsEditing(false);
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Moon className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Quiet Hours</h3>
            <p className="text-sm text-slate-400">Pause sending during specific hours</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-3 h-3 rounded-full ${
            config.enabled ? 'bg-emerald-500' : 'bg-slate-500'
          }`}
        />
        <span className="text-sm text-slate-400">
          {config.enabled
            ? `Active: ${config.startHour}:00 - ${config.endHour}:00 (${config.timezone})`
            : 'Disabled'}
        </span>
      </div>

      {isEditing && (
        <div className="space-y-4 border-t border-slate-700 pt-4">
          {/* Enable Toggle */}
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Enable Quiet Hours</span>
            <button
              onClick={() => setLocalConfig({ ...localConfig, enabled: !localConfig.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                localConfig.enabled ? 'bg-violet-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  localConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Hour</label>
              <select
                value={localConfig.startHour}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, startHour: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Hour</label>
              <select
                value={localConfig.endHour}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, endHour: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Active Days</label>
            <div className="flex gap-2">
              {daysOfWeek.map((day, index) => {
                const isActive = localConfig.daysOfWeek?.includes(index);
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const days = localConfig.daysOfWeek || [];
                      const updated = isActive
                        ? days.filter((d) => d !== index)
                        : [...days, index];
                      setLocalConfig({ ...localConfig, daysOfWeek: updated });
                    }}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// ============== THROTTLE CARD ==============

function ThrottleCard({ config, onChange }: ThrottleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onChange(localConfig);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Rate Limiting</h3>
            <p className="text-sm text-slate-400">Control email sending rate</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Status */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <p className="text-2xl font-bold text-white">{config.maxPerMinute}</p>
          <p className="text-xs text-slate-400">Per Minute</p>
        </div>
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <p className="text-2xl font-bold text-white">{config.maxPerHour}</p>
          <p className="text-xs text-slate-400">Per Hour</p>
        </div>
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <p className="text-2xl font-bold text-white">{config.maxPerDay}</p>
          <p className="text-xs text-slate-400">Per Day</p>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-4 border-t border-slate-700 pt-4 mt-4">
          {/* Enable Toggle */}
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Enable Rate Limiting</span>
            <button
              onClick={() => setLocalConfig({ ...localConfig, enabled: !localConfig.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                localConfig.enabled ? 'bg-violet-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  localConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {/* Limits */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Per Minute</label>
              <input
                type="number"
                value={localConfig.maxPerMinute}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, maxPerMinute: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Per Hour</label>
              <input
                type="number"
                value={localConfig.maxPerHour}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, maxPerHour: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Per Day</label>
              <input
                type="number"
                value={localConfig.maxPerDay}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, maxPerDay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Batch Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Batch Size</label>
              <input
                type="number"
                value={localConfig.batchSize}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, batchSize: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Batch Delay (ms)</label>
              <input
                type="number"
                value={localConfig.batchDelayMs}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, batchDelayMs: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// ============== COMPLIANCE REQUESTS TABLE ==============

interface ComplianceTableProps {
  records: ComplianceRecord[];
  onProcess: (recordId: string) => void;
  loading?: boolean;
}

function ComplianceTable({ records, onProcess, loading }: ComplianceTableProps) {
  const getTypeBadge = (type: ComplianceRecord['type']) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      unsubscribe: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <UserMinus className="w-3 h-3" /> },
      data_export: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Download className="w-3 h-3" /> },
      data_deletion: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: <Trash2 className="w-3 h-3" /> },
      consent_update: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle className="w-3 h-3" /> },
    };
    const badge = badges[type] || badges.unsubscribe;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {type.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status: ComplianceRecord['status']) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      processing: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
      failed: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {status}
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
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No compliance requests</p>
        <p className="text-sm mt-1">All good! No pending requests.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-slate-700">
            <th className="pb-3 font-medium text-slate-400 text-sm">Type</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">User Email</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">Status</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">Requested</th>
            <th className="pb-3 font-medium text-slate-400 text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
              <td className="py-3">{getTypeBadge(record.type)}</td>
              <td className="py-3 text-sm text-white">{record.userEmail}</td>
              <td className="py-3">{getStatusBadge(record.status)}</td>
              <td className="py-3 text-sm text-slate-400">
                {new Date(record.requestedAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                {record.status === 'pending' && (
                  <button
                    onClick={() => onProcess(record.id)}
                    className="text-sm text-violet-400 hover:text-violet-300 font-medium"
                  >
                    Process
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============== MAIN COMPONENT ==============

export function ComplianceDashboard({ currentUserEmail, className = '' }: ComplianceDashboardProps) {
  const [config, setConfig] = useState<EmailSystemConfig | null>(null);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [configData, recordsData] = await Promise.all([
          getEmailSystemConfig(),
          getComplianceRecords(),
        ]);
        setConfig(configData);
        setComplianceRecords(recordsData);
      } catch (error) {
        console.error('Error fetching compliance data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleKillSwitchToggle = async (enabled: boolean) => {
    if (enabled && !confirm('⚠️ This will STOP ALL email sending immediately. Are you sure?')) {
      return;
    }
    if (!enabled && !confirm('Re-enable email sending?')) {
      return;
    }

    setKillSwitchLoading(true);
    const success = await updateEmailSystemConfig({ globalKillSwitch: enabled }, currentUserEmail);
    if (success) {
      setConfig((prev) =>
        prev
          ? {
              ...prev,
              globalKillSwitch: enabled,
              killSwitchEnabledAt: enabled ? new Date().toISOString() : null,
              killSwitchEnabledBy: enabled ? currentUserEmail : null,
            }
          : null
      );
    }
    setKillSwitchLoading(false);
  };

  const handleQuietHoursChange = async (quietHours: QuietHoursConfig) => {
    const success = await updateEmailSystemConfig({ quietHours }, currentUserEmail);
    if (success && config) {
      setConfig({ ...config, quietHours });
    }
  };

  const handleThrottleChange = async (throttle: ThrottleConfig) => {
    const success = await updateEmailSystemConfig({ throttle }, currentUserEmail);
    if (success && config) {
      setConfig({ ...config, throttle });
    }
  };

  const handleProcessRequest = async (recordId: string) => {
    const success = await processComplianceRequest(recordId, currentUserEmail);
    if (success) {
      setComplianceRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status: 'completed' as const } : r))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/20 rounded-lg">
          <Shield className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Compliance & Safety</h2>
          <p className="text-sm text-slate-400">Manage email system safety and GDPR compliance</p>
        </div>
      </div>

      {/* Kill Switch */}
      <KillSwitchCard
        config={config}
        onToggle={handleKillSwitchToggle}
        loading={killSwitchLoading}
      />

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuietHoursCard
          config={config?.quietHours || { enabled: false, startHour: 22, endHour: 7, timezone: 'UTC', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }}
          onChange={handleQuietHoursChange}
        />
        <ThrottleCard
          config={config?.throttle || { enabled: false, maxPerMinute: 100, maxPerHour: 1000, maxPerDay: 10000, batchSize: 50, batchDelayMs: 1000 }}
          onChange={handleThrottleChange}
        />
      </div>

      {/* Compliance Requests */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Compliance Requests</h3>
          </div>
          <span className="text-sm text-slate-400">
            {complianceRecords.filter((r) => r.status === 'pending').length} pending
          </span>
        </div>
        <ComplianceTable
          records={complianceRecords}
          onProcess={handleProcessRequest}
        />
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Unsubscribe URL</span>
          </div>
          <p className="text-xs text-blue-400 break-all">
            {config?.unsubscribeUrl || 'Not configured'}
          </p>
        </div>
        <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">From Address</span>
          </div>
          <p className="text-xs text-emerald-400">
            {config?.defaultFromName} &lt;{config?.defaultFromEmail}&gt;
          </p>
        </div>
        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Company Address</span>
          </div>
          <p className="text-xs text-amber-400">
            {config?.companyAddress || 'Not configured'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ComplianceDashboard;
