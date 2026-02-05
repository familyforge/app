/**
 * FamilyForge Email System - Audience Segmentation Component
 * 
 * Build and manage audience segments for targeted email campaigns.
 * This is an ADDITIVE component that can be integrated into EmailSystemPage.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Filter,
  Plus,
  Trash2,
  Save,
  X,
  Calendar,
  Star,
  Activity,
  Baby,
  Crown,
  RefreshCw,
  Eye,
  Edit2,
  Copy,
  CheckCircle,
} from 'lucide-react';
import type { AudienceSegment, SegmentFilters, ParentingRole, EngagementLevel } from './types';
import { getAudienceSegments, createAudienceSegment, deleteAudienceSegment, estimateRecipientCount } from './email-api';

// ============== TYPES ==============

interface SegmentEditorProps {
  segment?: AudienceSegment;
  onSave?: (segment: AudienceSegment) => void;
  onClose?: () => void;
  currentUserEmail?: string;
}

interface SegmentListProps {
  className?: string;
  onSelectSegment?: (segment: AudienceSegment) => void;
  selectedSegmentId?: string;
}

interface SegmentFilterBuilderProps {
  filters: SegmentFilters;
  onChange: (filters: SegmentFilters) => void;
  className?: string;
}

// ============== FILTER OPTIONS ==============

const SUBSCRIPTION_OPTIONS = [
  { value: 'free', label: 'Free', icon: <Users className="w-4 h-4" /> },
  { value: 'premium', label: 'Premium', icon: <Crown className="w-4 h-4" /> },
];

const PARENTING_ROLE_OPTIONS: { value: ParentingRole; label: string }[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'other', label: 'Other' },
];

const ENGAGEMENT_LEVEL_OPTIONS: { value: EngagementLevel; label: string; color: string }[] = [
  { value: 'high', label: 'Highly Active', color: 'text-green-600' },
  { value: 'medium', label: 'Moderately Active', color: 'text-blue-600' },
  { value: 'low', label: 'Low Activity', color: 'text-amber-600' },
  { value: 'inactive', label: 'Inactive', color: 'text-red-600' },
];

// ============== FILTER BUILDER ==============

export function SegmentFilterBuilder({ filters, onChange, className = '' }: SegmentFilterBuilderProps) {
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Estimate recipient count when filters change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsEstimating(true);
      const count = await estimateRecipientCount(filters);
      setEstimatedCount(count);
      setIsEstimating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const updateFilter = <K extends keyof SegmentFilters>(key: K, value: SegmentFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayValue = <T,>(key: keyof SegmentFilters, value: T) => {
    const current = (filters[key] as T[] | undefined) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Estimated Count Banner */}
      <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-violet-400" />
          <div>
            <p className="text-sm font-medium text-violet-300">Estimated Recipients</p>
            <p className="text-xs text-violet-400">Based on current filters</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-violet-400">
          {isEstimating ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            estimatedCount?.toLocaleString() ?? '...'
          )}
        </span>
      </div>

      {/* Subscription Tier */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-slate-400" />
            Subscription Tier
          </div>
        </label>
        <div className="flex flex-wrap gap-2">
          {SUBSCRIPTION_OPTIONS.map((option) => {
            const isSelected = filters.subscriptionTier?.includes(option.value as 'free' | 'premium');
            return (
              <button
                key={option.value}
                onClick={() => toggleArrayValue('subscriptionTier', option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
                {isSelected && <CheckCircle className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Parenting Role */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Parenting Role
          </div>
        </label>
        <div className="flex flex-wrap gap-2">
          {PARENTING_ROLE_OPTIONS.map((option) => {
            const isSelected = filters.parentingRole?.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleArrayValue('parentingRole', option.value)}
                className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                  isSelected
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Engagement Level */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Engagement Level
          </div>
        </label>
        <div className="flex flex-wrap gap-2">
          {ENGAGEMENT_LEVEL_OPTIONS.map((option) => {
            const isSelected = filters.engagementLevel?.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleArrayValue('engagementLevel', option.value)}
                className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                  isSelected
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className={option.color}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Children Count */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <Baby className="w-4 h-4 text-slate-400" />
            Children Count
          </div>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Minimum Children</label>
            <input
              type="number"
              min="0"
              max="10"
              value={filters.childrenCount?.min ?? ''}
              onChange={(e) =>
                updateFilter('childrenCount', {
                  min: e.target.value ? Number(e.target.value) : 0,
                  max: filters.childrenCount?.max ?? 10,
                })
              }
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Maximum Children</label>
            <input
              type="number"
              min="0"
              max="10"
              value={filters.childrenCount?.max ?? ''}
              onChange={(e) =>
                updateFilter('childrenCount', {
                  min: filters.childrenCount?.min ?? 0,
                  max: e.target.value ? Number(e.target.value) : 10,
                })
              }
              placeholder="10"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Registration Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Registration Date
          </div>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Registered After</label>
            <input
              type="date"
              value={filters.registeredAfter?.split('T')[0] ?? ''}
              onChange={(e) =>
                updateFilter('registeredAfter', e.target.value ? `${e.target.value}T00:00:00Z` : undefined)
              }
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Registered Before</label>
            <input
              type="date"
              value={filters.registeredBefore?.split('T')[0] ?? ''}
              onChange={(e) =>
                updateFilter('registeredBefore', e.target.value ? `${e.target.value}T23:59:59Z` : undefined)
              }
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="pt-2">
        <button
          onClick={() => onChange({})}
          className="text-sm text-slate-400 hover:text-slate-300 underline"
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}

// ============== SEGMENT EDITOR ==============

export function SegmentEditor({ segment, onSave, onClose, currentUserEmail }: SegmentEditorProps) {
  const [name, setName] = useState(segment?.name || '');
  const [description, setDescription] = useState(segment?.description || '');
  const [filters, setFilters] = useState<SegmentFilters>(segment?.filters || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a segment name');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const newSegment = await createAudienceSegment(
        name,
        filters,
        description || undefined,
        currentUserEmail
      );

      if (newSegment) {
        onSave?.(newSegment);
        onClose?.();
      } else {
        setError('Failed to save segment. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Filter className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {segment ? 'Edit Segment' : 'Create Audience Segment'}
            </h2>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Segment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Premium Parents with Toddlers"
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this segment..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          {/* Filters */}
          <div className="border-t border-slate-700 pt-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Filter Criteria</h3>
            <SegmentFilterBuilder filters={filters} onChange={setFilters} />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Segment
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== SEGMENT LIST ==============

export function SegmentList({ className = '', onSelectSegment, selectedSegmentId }: SegmentListProps) {
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  // Fetch segments
  useEffect(() => {
    async function fetchSegments() {
      setLoading(true);
      try {
        const data = await getAudienceSegments();
        setSegments(data);
      } catch (error) {
        console.error('Error fetching segments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSegments();
  }, []);

  const handleDelete = async (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) {
      return;
    }

    const success = await deleteAudienceSegment(segmentId);
    if (success) {
      setSegments((prev) => prev.filter((s) => s.id !== segmentId));
    }
  };

  const countActiveFilters = (filters: SegmentFilters): number => {
    let count = 0;
    if (filters.subscriptionTier?.length) count++;
    if (filters.parentingRole?.length) count++;
    if (filters.engagementLevel?.length) count++;
    if (filters.childrenCount) count++;
    if (filters.registeredAfter || filters.registeredBefore) count++;
    return count;
  };

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-white">Audience Segments</h3>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Segment
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : segments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No segments created yet</p>
            <button
              onClick={() => setShowEditor(true)}
              className="text-sm text-violet-400 hover:underline mt-2"
            >
              Create your first segment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {segments.map((segment) => {
              const isSelected = segment.id === selectedSegmentId;
              const filterCount = countActiveFilters(segment.filters);
              
              return (
                <div
                  key={segment.id}
                  onClick={() => onSelectSegment?.(segment)}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-violet-500/10 border-violet-500/50'
                      : 'bg-slate-900/50 border-slate-700 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">{segment.name}</p>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        )}
                      </div>
                      {segment.description && (
                        <p className="text-sm text-slate-400 truncate mt-1">{segment.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {segment.estimatedCount?.toLocaleString() || '0'} users
                        </span>
                        <span className="flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          {filterCount} filter{filterCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(segment.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <SegmentEditor
          onClose={() => setShowEditor(false)}
          onSave={(newSegment) => {
            setSegments((prev) => [newSegment, ...prev]);
            setShowEditor(false);
          }}
        />
      )}
    </div>
  );
}

// ============== QUICK SEGMENT SELECTOR ==============

interface QuickSegmentSelectorProps {
  value?: SegmentFilters;
  onChange: (filters: SegmentFilters, segmentName?: string) => void;
  className?: string;
}

export function QuickSegmentSelector({ value, onChange, className = '' }: QuickSegmentSelectorProps) {
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getAudienceSegments().then(setSegments);
  }, []);

  const handleSelect = (segment: AudienceSegment | null) => {
    if (segment) {
      setSelectedId(segment.id);
      onChange(segment.filters, segment.name);
    } else {
      setSelectedId(null);
      onChange({});
    }
  };

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Target Audience
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSelect(null)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            !selectedId
              ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Users
        </button>
        {segments.map((segment) => (
          <button
            key={segment.id}
            onClick={() => handleSelect(segment)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              selectedId === segment.id
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {segment.name}
            <span className="ml-1 text-xs opacity-70">
              ({segment.estimatedCount?.toLocaleString() || '0'})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SegmentEditor;
