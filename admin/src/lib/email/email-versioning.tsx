/**
 * FamilyForge Email System - Versioning Component
 * 
 * Template version history with compare and rollback capabilities.
 * This is an ADDITIVE component that can be integrated into EmailSystemPage.
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  GitBranch,
  ArrowLeft,
  Eye,
  RotateCcw,
  CheckCircle,
  Clock,
  User,
  FileText,
  ChevronRight,
  X,
  RefreshCw,
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';
import type { EmailTemplateVersion } from './types';
import { getTemplateVersions, revertToVersion, createTemplateVersion } from './email-api';
import { InlineEmailPreview } from './email-preview';

// ============== TYPES ==============

interface VersionHistoryProps {
  templateId: string;
  templateName: string;
  currentHtml?: string;
  currentSubject?: string;
  onVersionSelect?: (version: EmailTemplateVersion) => void;
  onClose?: () => void;
  className?: string;
}

interface VersionCardProps {
  version: EmailTemplateVersion;
  isActive: boolean;
  onPreview: () => void;
  onRevert: () => void;
  onCompare?: () => void;
}

interface VersionCompareProps {
  versionA: EmailTemplateVersion;
  versionB: EmailTemplateVersion;
  onClose: () => void;
}

// ============== VERSION CARD ==============

function VersionCard({ version, isActive, onPreview, onRevert, onCompare }: VersionCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        isActive
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              isActive ? 'bg-green-500/20' : 'bg-slate-700'
            }`}
          >
            <GitBranch className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">v{version.version}</span>
              {isActive && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 mt-1">{version.subject}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {version.editorName || version.editorEmail}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(version.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {version.changelog && (
              <p className="text-sm text-slate-400 mt-2 italic">
                "{version.changelog}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            className="p-2 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          {onCompare && (
            <button
              onClick={onCompare}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Compare"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          )}
          {!isActive && (
            <button
              onClick={onRevert}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              title="Revert to this version"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== VERSION COMPARE ==============

export function VersionCompare({ versionA, versionB, onClose }: VersionCompareProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Compare Versions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Comparison */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-700 overflow-hidden">
          {/* Version A */}
          <div className="flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                  v{versionA.version}
                </span>
                <span className="text-sm text-slate-400">
                  {new Date(versionA.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium text-white mt-2">{versionA.subject}</p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {versionA.htmlContent && (
                <InlineEmailPreview htmlContent={versionA.htmlContent} previewHeight={500} />
              )}
            </div>
          </div>

          {/* Version B */}
          <div className="flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                  v{versionB.version}
                </span>
                {versionB.isActive && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
                <span className="text-sm text-slate-400">
                  {new Date(versionB.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium text-white mt-2">{versionB.subject}</p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {versionB.htmlContent && (
                <InlineEmailPreview htmlContent={versionB.htmlContent} previewHeight={500} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== VERSION PREVIEW MODAL ==============

interface VersionPreviewModalProps {
  version: EmailTemplateVersion;
  onClose: () => void;
  onRevert: () => void;
}

function VersionPreviewModal({ version, onClose, onRevert }: VersionPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded-full">
                v{version.version}
              </span>
              {version.isActive && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-white">{version.subject}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Metadata */}
          <div className="flex items-center gap-6 mb-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {version.editorName || version.editorEmail}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(version.createdAt).toLocaleString()}
            </span>
          </div>

          {version.changelog && (
            <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg mb-4">
              <p className="text-sm text-slate-300">
                <span className="font-medium text-white">Changelog:</span> {version.changelog}
              </p>
            </div>
          )}

          {/* Preview */}
          {version.htmlContent && (
            <InlineEmailPreview htmlContent={version.htmlContent} previewHeight={400} />
          )}
        </div>

        {/* Footer */}
        {!version.isActive && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={onRevert}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Revert to This Version
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== MAIN COMPONENT ==============

export function VersionHistory({
  templateId,
  templateName,
  currentHtml,
  currentSubject,
  onVersionSelect,
  onClose,
  className = '',
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<EmailTemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<EmailTemplateVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<[EmailTemplateVersion, EmailTemplateVersion] | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<EmailTemplateVersion | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  // Fetch versions
  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      try {
        const data = await getTemplateVersions(templateId);
        setVersions(data);
      } catch (error) {
        console.error('Error fetching versions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVersions();
  }, [templateId]);

  const handleRevert = async (version: EmailTemplateVersion) => {
    if (!confirm(`Revert to version ${version.version}? The current version will be preserved in history.`)) {
      return;
    }

    setIsReverting(true);
    try {
      const success = await revertToVersion(version.id, templateId);
      if (success) {
        // Refresh versions
        const data = await getTemplateVersions(templateId);
        setVersions(data);
        setPreviewVersion(null);
        onVersionSelect?.(version);
      }
    } catch (error) {
      console.error('Error reverting version:', error);
    } finally {
      setIsReverting(false);
    }
  };

  const handleCompare = (version: EmailTemplateVersion) => {
    if (!selectedForCompare) {
      setSelectedForCompare(version);
    } else if (selectedForCompare.id !== version.id) {
      setCompareVersions([selectedForCompare, version]);
      setSelectedForCompare(null);
    }
  };

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <History className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Version History</h3>
            <p className="text-sm text-slate-400">{templateName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedForCompare && (
            <span className="text-sm text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
              Select another version to compare
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No version history yet</p>
            <p className="text-sm mt-1">Edit and save the template to create versions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                isActive={version.isActive}
                onPreview={() => setPreviewVersion(version)}
                onRevert={() => handleRevert(version)}
                onCompare={versions.length > 1 ? () => handleCompare(version) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {versions.length} version{versions.length !== 1 ? 's' : ''} saved
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle className="w-3 h-3" />
            Versions are automatically saved when templates are edited
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewVersion && (
        <VersionPreviewModal
          version={previewVersion}
          onClose={() => setPreviewVersion(null)}
          onRevert={() => handleRevert(previewVersion)}
        />
      )}

      {/* Compare Modal */}
      {compareVersions && (
        <VersionCompare
          versionA={compareVersions[0]}
          versionB={compareVersions[1]}
          onClose={() => setCompareVersions(null)}
        />
      )}
    </div>
  );
}

// ============== SAVE VERSION BUTTON ==============

interface SaveVersionButtonProps {
  templateId: string;
  htmlContent: string;
  subject: string;
  currentUserEmail: string;
  currentUserName?: string;
  onSaved?: (version: EmailTemplateVersion) => void;
}

export function SaveVersionButton({
  templateId,
  htmlContent,
  subject,
  currentUserEmail,
  currentUserName,
  onSaved,
}: SaveVersionButtonProps) {
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const version = await createTemplateVersion(
        templateId,
        htmlContent,
        subject,
        currentUserEmail,
        currentUserName,
        changelog || undefined
      );
      if (version) {
        onSaved?.(version);
        setShowChangelogModal(false);
        setChangelog('');
      }
    } catch (error) {
      console.error('Error saving version:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowChangelogModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
      >
        <GitBranch className="w-4 h-4" />
        Save Version
      </button>

      {showChangelogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Save New Version</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Changelog (optional)
              </label>
              <textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Describe what changed in this version..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-slate-500 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
              <button
                onClick={() => setShowChangelogModal(false)}
                className="px-4 py-2 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Save Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VersionHistory;
