// Admin Workflow Components - Support & Operations
// Support notes, user flags, audit log, and admin tools

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Flag,
  History,
  AlertTriangle,
  Check,
  X,
  Send,
  Loader2,
  User,
  Clock,
  Shield,
  FileText,
} from 'lucide-react';
import {
  Card,
  DataTable,
  SearchFilterBar,
  LoadingStateWrapper,
  StatusBadge,
  SectionHeader,
  EmptyState,
} from './components';
import { useSupportStore, useFilterStore } from './stores';
import {
  addSupportNote,
  addUserFlag,
  resolveUserFlag,
  getAuditLog,
} from './api/analytics-engine';
import type { SupportNote, UserFlag, AdminAuditLog, LoadingState, FlagType, SupportNoteType, AdminActionType } from './types';

// ============================================
// ADD NOTE MODAL
// ============================================

interface AddNoteModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: SupportNote) => void;
}

export function AddNoteModal({ userId, userName, isOpen, onClose, onSave }: AddNoteModalProps) {
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<SupportNoteType>('general');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      // Note: In production, adminEmail would come from auth context
      const note = await addSupportNote(userId, 'admin@familyforge.app', content, noteType);
      if (note) {
        onSave(note);
        setContent('');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <MessageSquare size={18} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Add Support Note</h3>
              <p className="text-slate-500 text-sm">{userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Note Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as SupportNoteType)}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
            >
              <option value="general">General</option>
              <option value="issue">Issue Report</option>
              <option value="resolution">Resolution</option>
              <option value="escalation">Escalation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Note</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADD FLAG MODAL
// ============================================

interface AddFlagModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (flag: UserFlag) => void;
}

export function AddFlagModal({ userId, userName, isOpen, onClose, onSave }: AddFlagModalProps) {
  const [flagType, setFlagType] = useState<FlagType>('support_needed');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Note: In production, flaggedBy would come from auth context
      const flag = await addUserFlag(userId, flagType, 'admin@familyforge.app', reason || undefined);
      if (flag) {
        onSave(flag);
        setReason('');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const flagDescriptions: Record<FlagType, string> = {
    vip: 'Mark as a high-value/important user',
    at_risk: 'User might churn soon',
    churned: 'User has already left',
    support_needed: 'Requires support follow-up',
    abuse_suspected: 'Suspected abuse or fraud',
  };

  const flagColors: Record<FlagType, string> = {
    vip: 'text-amber-400',
    at_risk: 'text-orange-400',
    churned: 'text-slate-400',
    support_needed: 'text-blue-400',
    abuse_suspected: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Flag size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Flag User</h3>
              <p className="text-slate-500 text-sm">{userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-3">Flag Type</label>
            <div className="space-y-2">
              {(['vip', 'at_risk', 'churned', 'support_needed', 'abuse_suspected'] as const).map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    flagType === type
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="flagType"
                    value={type}
                    checked={flagType === type}
                    onChange={() => setFlagType(type)}
                    className="sr-only"
                  />
                  <Flag size={16} className={flagColors[type]} />
                  <div className="flex-1">
                    <span className="text-white font-medium capitalize">{type.replace('_', ' ')}</span>
                    <p className="text-slate-500 text-xs mt-0.5">{flagDescriptions[type]}</p>
                  </div>
                  {flagType === type && <Check size={16} className="text-violet-400" />}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you flagging this user?"
              rows={2}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
            Add Flag
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AUDIT LOG PAGE
// ============================================

export function AuditLogPage() {
  const [entries, setEntries] = useState<AdminAuditLog[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const { searchQuery, setSearchQuery } = useFilterStore();
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getAuditLog({
        page,
        pageSize,
        actionType: actionFilter === 'all' ? undefined : actionFilter as AdminActionType,
      });
      setEntries(result.data);
      setTotal(result.total);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
      setStatus('error');
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actionVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    user_view: 'neutral',
    user_edit: 'info',
    note_add: 'info',
    flag_add: 'warning',
    flag_resolve: 'success',
    export_data: 'neutral',
    settings_change: 'warning',
    login: 'neutral',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Audit Log"
        description="Complete history of admin actions"
      />

      {/* Search and Filters */}
      <SearchFilterBar
        searchPlaceholder="Search by admin or action..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={fetchData}
        filters={
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm"
          >
            <option value="all">All Actions</option>
            <option value="user_view">User View</option>
            <option value="user_edit">User Edit</option>
            <option value="note_add">Note Added</option>
            <option value="flag_add">Flag Added</option>
            <option value="flag_resolve">Flag Resolved</option>
            <option value="export_data">Data Export</option>
            <option value="settings_change">Settings Change</option>
          </select>
        }
      />

      <LoadingStateWrapper
        status={status}
        error={error}
        onRetry={fetchData}
        loadingText="Loading audit log..."
        isEmpty={entries.length === 0}
        emptyText="No audit entries found"
      >
        <DataTable
          columns={[
            {
              key: 'createdAt',
              header: 'Time',
              width: '180px',
              render: (row) => (
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span>{new Date(row.createdAt).toLocaleString()}</span>
                </div>
              ),
            },
            {
              key: 'adminEmail',
              header: 'Admin',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-violet-400" />
                  <span className="text-white">{row.adminEmail}</span>
                </div>
              ),
            },
            {
              key: 'actionType',
              header: 'Action',
              render: (row) => (
                <StatusBadge
                  status={row.actionType.replace('_', ' ')}
                  variant={actionVariants[row.actionType] ?? 'neutral'}
                />
              ),
            },
            {
              key: 'targetType',
              header: 'Target',
              render: (row) => (
                <span className="text-slate-400">
                  {row.targetType && row.targetId 
                    ? `${row.targetType}: ${row.targetId.slice(0, 8)}...`
                    : '—'}
                </span>
              ),
            },
            {
              key: 'actionData',
              header: 'Details',
              render: (row) => (
                <span className="text-slate-500 text-sm truncate max-w-xs block">
                  {row.actionData && Object.keys(row.actionData).length > 0 ? JSON.stringify(row.actionData).slice(0, 50) : '—'}
                </span>
              ),
            },
            {
              key: 'ipAddress',
              header: 'IP',
              width: '120px',
              render: (row) => (
                <span className="text-slate-500 font-mono text-xs">{row.ipAddress ?? '—'}</span>
              ),
            },
          ]}
          data={entries}
          rowKey={(row) => row.id}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
        />
      </LoadingStateWrapper>
    </div>
  );
}

// ============================================
// SUPPORT NOTES VIEWER
// ============================================

interface SupportNotesViewerProps {
  notes: SupportNote[];
  loading?: boolean;
  onAddNote?: () => void;
}

export function SupportNotesViewer({ notes, loading = false, onAddNote }: SupportNotesViewerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  const noteTypeColors: Record<SupportNoteType, string> = {
    general: 'bg-slate-500',
    issue: 'bg-amber-500',
    resolution: 'bg-emerald-500',
    escalation: 'bg-red-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Support Notes ({notes.length})</h4>
        {onAddNote && (
          <button
            onClick={onAddNote}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-sm font-medium rounded-lg transition-colors"
          >
            <MessageSquare size={14} />
            Add Note
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="text-slate-500 text-sm py-4 text-center">No notes yet</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${noteTypeColors[note.noteType]}`} />
                  <span className="text-slate-400 text-xs capitalize">{note.noteType.replace('_', ' ')}</span>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-white text-sm">{note.content}</p>
              <p className="text-slate-500 text-xs mt-2">— {note.adminEmail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// USER FLAGS VIEWER
// ============================================

interface UserFlagsViewerProps {
  flags: UserFlag[];
  loading?: boolean;
  onAddFlag?: () => void;
  onResolveFlag?: (flagId: string) => void;
}

export function UserFlagsViewer({ flags, loading = false, onAddFlag, onResolveFlag }: UserFlagsViewerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  const activeFlags = flags.filter((f) => !f.resolved);
  const resolvedFlags = flags.filter((f) => f.resolved);

  const flagColors: Record<FlagType, { bg: string; border: string; text: string }> = {
    vip: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
    at_risk: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' },
    churned: { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-400' },
    support_needed: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
    abuse_suspected: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">User Flags</h4>
        {onAddFlag && (
          <button
            onClick={onAddFlag}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-colors"
          >
            <Flag size={14} />
            Add Flag
          </button>
        )}
      </div>

      {/* Active Flags */}
      {activeFlags.length > 0 && (
        <div className="space-y-2">
          {activeFlags.map((flag) => {
            const colors = flagColors[flag.flagType];
            return (
              <div
                key={flag.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center gap-3">
                  <Flag size={16} className={colors.text} />
                  <div>
                    <span className={`font-medium capitalize ${colors.text}`}>
                      {flag.flagType.replace('_', ' ')}
                    </span>
                    {flag.flagReason && (
                      <p className="text-slate-400 text-xs mt-0.5">{flag.flagReason}</p>
                    )}
                  </div>
                </div>
                {onResolveFlag && (
                  <button
                    onClick={() => onResolveFlag(flag.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Resolve flag"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved Flags */}
      {resolvedFlags.length > 0 && (
        <div className="mt-4">
          <p className="text-slate-500 text-xs mb-2">Resolved ({resolvedFlags.length})</p>
          <div className="space-y-1">
            {resolvedFlags.slice(0, 3).map((flag) => (
              <div key={flag.id} className="flex items-center gap-2 text-xs text-slate-500">
                <Check size={12} className="text-emerald-400" />
                <span className="capitalize">{flag.flagType.replace('_', ' ')}</span>
                <span>— resolved {new Date(flag.resolvedAt!).toLocaleDateString()}</span>
              </div>
            ))}
            {resolvedFlags.length > 3 && (
              <p className="text-slate-600 text-xs">+{resolvedFlags.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {flags.length === 0 && (
        <p className="text-slate-500 text-sm py-4 text-center">No flags</p>
      )}
    </div>
  );
}

// ============================================
// DATA EXPORT TOOL
// ============================================

interface ExportOption {
  id: string;
  label: string;
  description: string;
  format: 'csv' | 'json';
}

export function DataExportTool() {
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const exportOptions: ExportOption[] = [
    { id: 'users', label: 'Users', description: 'All parent accounts with profile data', format: 'csv' },
    { id: 'children', label: 'Children', description: 'All children profiles and points', format: 'csv' },
    { id: 'tasks', label: 'Tasks', description: 'Task history and completions', format: 'csv' },
    { id: 'rewards', label: 'Rewards', description: 'Reward redemptions', format: 'csv' },
    { id: 'subscriptions', label: 'Subscriptions', description: 'Subscription history and MRR data', format: 'csv' },
    { id: 'analytics', label: 'Analytics', description: 'Full analytics snapshot', format: 'json' },
  ];

  const toggleExport = (id: string) => {
    setSelectedExports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedExports.length === 0) return;
    setExporting(true);
    
    // Simulate export - in production this would call an API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Download a sample file
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: selectedExports }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `familyforge-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExporting(false);
    setSelectedExports([]);
  };

  return (
    <Card title="Data Export" subtitle="Export data for analysis or compliance">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {exportOptions.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                selectedExports.includes(opt.id)
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedExports.includes(opt.id)}
                onChange={() => toggleExport(opt.id)}
                className="mt-1"
              />
              <div>
                <span className="text-white font-medium">{opt.label}</span>
                <span className="ml-2 text-xs text-slate-500 uppercase">{opt.format}</span>
                <p className="text-slate-500 text-sm mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <p className="text-slate-500 text-sm">
            {selectedExports.length} export{selectedExports.length !== 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleExport}
            disabled={selectedExports.length === 0 || exporting}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {exporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText size={16} />
                Export Selected
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
