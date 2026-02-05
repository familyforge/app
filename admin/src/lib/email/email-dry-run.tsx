/**
 * FamilyForge Email System - Dry Run Mode Component
 * 
 * Simulate email sending without actually delivering emails.
 * This is an ADDITIVE component that can be integrated into EmailSystemPage.
 */

import React, { useState } from 'react';
import {
  PlayCircle,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  Mail,
  X,
  RefreshCw,
  Eye,
  Download,
  FileText,
  AlertOctagon,
  Info,
  ChevronDown,
} from 'lucide-react';
import type { DryRunResult, SegmentFilters } from './types';
import { saveDryRunResult, estimateRecipientCount } from './email-api';
import { InlineEmailPreview } from './email-preview';

// ============== SAMPLE TEMPLATES ==============

const SAMPLE_TEMPLATES = [
  { 
    id: 'welcome', 
    name: 'Welcome Email', 
    subject: 'Welcome to FamilyForge! Let\'s Get Started',
    description: 'Sent when a new user signs up',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background-color:#0f0a1f;"><table width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1f;min-height:100vh;"><tr><td align="center" valign="top" style="padding:40px 20px;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: rgba(139, 92, 246, 0.15); border-radius: 24px; margin-bottom: 24px;">
          <img src="https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png" width="80" height="80" alt="FamilyForge" />
        </div>
        <div style="background: linear-gradient(135deg, rgba(30, 20, 50, 0.9), rgba(20, 15, 40, 0.95)); border-radius: 16px; padding: 32px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <h1 style="color: #ffffff; margin: 0 0 16px;">Welcome to FamilyForge!</h1>
          <p style="color: #cbd5e1; line-height: 1.6;">Hi {{parentName}},</p>
          <p style="color: #cbd5e1; line-height: 1.6;">We're thrilled to have you join the FamilyForge family! You're now part of a community dedicated to raising confident, responsible kids through rewards and growth.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{{appUrl}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1, #4f46e5); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold;">Get Started</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;"><a href="{{unsubscribeUrl}}" style="color: #8b5cf6;">Unsubscribe</a></p>
        </div>
      </div>
    </td></tr></table></body></html>`
  },
  { 
    id: 'task_reminder', 
    name: 'Task Reminder', 
    subject: '{{childName}} has tasks due today!',
    description: 'Sent when tasks are due or overdue',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background-color:#0f0a1f;"><table width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1f;min-height:100vh;"><tr><td align="center" valign="top" style="padding:40px 20px;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: rgba(139, 92, 246, 0.15); border-radius: 24px; margin-bottom: 24px;">
          <img src="https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png" width="80" height="80" alt="FamilyForge" />
        </div>
        <div style="background: linear-gradient(135deg, rgba(30, 20, 50, 0.9), rgba(20, 15, 40, 0.95)); border-radius: 16px; padding: 32px; border: 1px solid rgba(245, 158, 11, 0.3);">
          <h1 style="color: #ffffff; margin: 0 0 16px;">Task Reminder</h1>
          <p style="color: #cbd5e1; line-height: 1.6;">Hi {{parentName}},</p>
          <p style="color: #cbd5e1; line-height: 1.6;">Just a friendly reminder that <strong style="color: #f59e0b;">{{childName}}</strong> has some tasks due today. Check in to see their progress!</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{{appUrl}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold;">View Tasks</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;"><a href="{{unsubscribeUrl}}" style="color: #8b5cf6;">Unsubscribe</a></p>
        </div>
      </div>
    </td></tr></table></body></html>`
  },
  { 
    id: 'achievement', 
    name: 'Achievement Alert', 
    subject: '{{childName}} earned an achievement!',
    description: 'Celebrate when children reach milestones',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background-color:#0f0a1f;"><table width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1f;min-height:100vh;"><tr><td align="center" valign="top" style="padding:40px 20px;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.15); border-radius: 24px; margin-bottom: 24px;">
          <img src="https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png" width="80" height="80" alt="FamilyForge" />
        </div>
        <div style="background: linear-gradient(135deg, rgba(30, 20, 50, 0.9), rgba(20, 15, 40, 0.95)); border-radius: 16px; padding: 32px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <h1 style="color: #10b981; margin: 0 0 16px; text-align: center;">Achievement Unlocked!</h1>
          <p style="color: #cbd5e1; line-height: 1.6;">Hi {{parentName}},</p>
          <p style="color: #cbd5e1; line-height: 1.6;">Great news! <strong style="color: #10b981;">{{childName}}</strong> just earned a new achievement. Celebrate their progress together!</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{{appUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold;">See Achievement</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;"><a href="{{unsubscribeUrl}}" style="color: #8b5cf6;">Unsubscribe</a></p>
        </div>
      </div>
    </td></tr></table></body></html>`
  },
  { 
    id: 'weekly_report', 
    name: 'Weekly Report', 
    subject: 'Your Weekly FamilyForge Summary',
    description: 'Summary of family progress every week',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background-color:#0f0a1f;"><table width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1f;min-height:100vh;"><tr><td align="center" valign="top" style="padding:40px 20px;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: rgba(139, 92, 246, 0.15); border-radius: 24px; margin-bottom: 24px;">
          <img src="https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png" width="80" height="80" alt="FamilyForge" />
        </div>
        <div style="background: linear-gradient(135deg, rgba(30, 20, 50, 0.9), rgba(20, 15, 40, 0.95)); border-radius: 16px; padding: 32px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <h1 style="color: #ffffff; margin: 0 0 16px;">Weekly Progress Report</h1>
          <p style="color: #cbd5e1; line-height: 1.6;">Hi {{parentName}},</p>
          <p style="color: #cbd5e1; line-height: 1.6;">Here's a summary of your family's progress this week on FamilyForge. Keep up the amazing work!</p>
          <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; border-radius: 0 12px 12px 0; padding: 16px; margin: 16px 0;">
            <p style="color: #a78bfa; margin: 0; font-style: italic;">"Consistency is the key to progress. Every small step counts!"</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{{appUrl}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1, #4f46e5); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold;">View Full Report</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;"><a href="{{unsubscribeUrl}}" style="color: #8b5cf6;">Unsubscribe</a></p>
        </div>
      </div>
    </td></tr></table></body></html>`
  },
  { 
    id: 'abandoned_payment', 
    name: 'Abandoned Payment', 
    subject: 'Still thinking about FamilyForge Pro?',
    description: 'Gentle nudge after payment abandonment',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background-color:#0f0a1f;"><table width="100%" height="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0a1f;min-height:100vh;"><tr><td align="center" valign="top" style="padding:40px 20px;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: rgba(245, 158, 11, 0.15); border-radius: 24px; margin-bottom: 24px;">
          <img src="https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png" width="80" height="80" alt="FamilyForge" />
        </div>
        <div style="background: linear-gradient(135deg, rgba(30, 20, 50, 0.9), rgba(20, 15, 40, 0.95)); border-radius: 16px; padding: 32px; border: 1px solid rgba(245, 158, 11, 0.3);">
          <h1 style="color: #ffffff; margin: 0 0 16px;">You're Almost There!</h1>
          <p style="color: #cbd5e1; line-height: 1.6;">Hi {{parentName}},</p>
          <p style="color: #cbd5e1; line-height: 1.6;">We noticed you were checking out FamilyForge Pro. Unlock unlimited tasks, premium rewards, and detailed progress reports!</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{{appUrl}}/upgrade" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold;">Complete Upgrade</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;"><a href="{{unsubscribeUrl}}" style="color: #8b5cf6;">Unsubscribe</a></p>
        </div>
      </div>
    </td></tr></table></body></html>`
  },
];

// ============== TYPES ==============

interface DryRunModeProps {
  templateId: string;
  templateName: string;
  htmlContent: string;
  subject: string;
  segmentFilters?: SegmentFilters;
  currentUserEmail: string;
  onClose?: () => void;
  /** When true, renders inline instead of as a modal */
  inline?: boolean;
}

interface DryRunResultDisplayProps {
  result: DryRunResult;
  onClose?: () => void;
  onSendForReal?: () => void;
  /** When true, renders inline instead of as a modal */
  inline?: boolean;
}

// ============== DRY RUN EXECUTOR ==============

export function DryRunMode({
  templateId: initialTemplateId,
  templateName: initialTemplateName,
  htmlContent: initialHtmlContent,
  subject: initialSubject,
  segmentFilters,
  currentUserEmail,
  onClose,
  inline = false,
}: DryRunModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const selectedTemplate = SAMPLE_TEMPLATES.find(t => t.id === selectedTemplateId);
  
  // Use selected template data or fallback to props
  const templateId = selectedTemplate?.id || initialTemplateId;
  const templateName = selectedTemplate?.name || initialTemplateName;
  const htmlContent = selectedTemplate?.html || initialHtmlContent;
  const subject = selectedTemplate?.subject || initialSubject;

  const runSimulation = async () => {
    setIsRunning(true);
    setError(null);

    try {
      // Get recipient count
      const recipientCount = await estimateRecipientCount(segmentFilters);

      // Simulate processing time based on recipient count
      const processingTime = Math.ceil(recipientCount / 100); // 1 second per 100 recipients
      
      // Generate warnings
      const warnings: string[] = [];
      
      if (recipientCount === 0) {
        warnings.push('No recipients match the current segment filters. Email will not be sent to anyone.');
      }
      
      if (recipientCount > 10000) {
        warnings.push(`Large recipient list (${recipientCount.toLocaleString()}). Consider sending in batches.`);
      }

      if (!htmlContent.toLowerCase().includes('unsubscribe')) {
        warnings.push('No unsubscribe link detected. This may violate CAN-SPAM and GDPR regulations.');
      }

      if (subject.length > 60) {
        warnings.push('Subject line is longer than 60 characters. It may be truncated in some email clients.');
      }

      if (subject.includes('FREE') || subject.includes('!!!')) {
        warnings.push('Subject contains spam trigger words. This may affect deliverability.');
      }

      // Check for broken images
      const imgMatches = htmlContent.match(/src="([^"]+)"/g) || [];
      const brokenImages = imgMatches.filter(src => !src.includes('http')).length;
      if (brokenImages > 0) {
        warnings.push(`${brokenImages} image(s) may have broken/relative URLs.`);
      }

      // Simulate getting sample recipients
      const sampleRecipients = [
        { email: 'parent1@example.com', name: 'Sarah M.' },
        { email: 'parent2@example.com', name: 'John D.' },
        { email: 'parent3@example.com', name: 'Emily R.' },
        { email: 'parent4@example.com', name: 'Michael B.' },
        { email: 'parent5@example.com', name: 'Jessica L.' },
      ].slice(0, Math.min(5, recipientCount)).map((recipient) => ({
        ...recipient,
        parentingRole: null,
        childrenCount: 0,
        engagementLevel: 'low' as const,
      }));

      // Calculate estimated send time
      const estimatedMinutes = Math.ceil(recipientCount / 100); // 100 per minute
      const estimatedSendTime = estimatedMinutes < 1 
        ? 'Less than a minute'
        : estimatedMinutes < 60 
        ? `~${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`
        : `~${Math.ceil(estimatedMinutes / 60)} hour${Math.ceil(estimatedMinutes / 60) > 1 ? 's' : ''}`;

      // Build result
      const dryRunResult: Omit<DryRunResult, 'id'> = {
        templateId,
        templateName,
        executedBy: currentUserEmail,
        segmentFilters: segmentFilters ?? null,
        totalRecipients: recipientCount,
        recipients: sampleRecipients,
        estimatedSendTime,
        warnings,
        executedAt: new Date().toISOString(),
      };

      // Wait a bit to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Save result
      const savedId = await saveDryRunResult(dryRunResult);
      
      setResult({
        ...dryRunResult,
        id: savedId || 'local-' + Date.now(),
      });
    } catch (err) {
      setError('Failed to run simulation. Please try again.');
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  if (result) {
    return (
      <DryRunResultDisplay
        result={result}
        onClose={inline ? () => setResult(null) : onClose}
        inline={inline}
        onSendForReal={() => {
          // This would integrate with the actual send function
          alert('This would trigger actual email sending. Integration required.');
        }}
      />
    );
  }

  const content = (
    <div className={inline ? "bg-slate-800 rounded-xl border border-slate-700" : "bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700"}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <PlayCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Dry Run Mode</h2>
            <p className="text-sm text-slate-400">Simulate without sending real emails</p>
          </div>
        </div>
        {!inline && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Template to Test</label>
            <div className="relative">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white appearance-none cursor-pointer pr-10"
              >
                <option value="demo-template">-- Select a template --</option>
                {SAMPLE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Template Info */}
          {selectedTemplate && (
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-violet-400" />
                <span className="font-medium text-white">{templateName}</span>
              </div>
              <p className="text-sm text-slate-400 mb-2">{selectedTemplate.description}</p>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-white">Subject:</span> {subject}
              </p>
            </div>
          )}

          {/* Preview */}
          {selectedTemplate && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Email Preview</h4>
              <InlineEmailPreview htmlContent={htmlContent} previewHeight={200} />
            </div>
          )}

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium text-blue-200">What happens in Dry Run mode:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-blue-300">
                <li>No emails will actually be sent</li>
                <li>Recipients will be counted and validated</li>
                <li>Email content will be checked for issues</li>
                <li>You&apos;ll see a summary of what would happen</li>
              </ul>
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
          {!inline && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={runSimulation}
            disabled={isRunning || !selectedTemplate}
            className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            {isRunning ? 'Running Simulation...' : selectedTemplate ? 'Run Simulation' : 'Select a Template'}
          </button>
        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
}

// ============== DRY RUN RESULT DISPLAY ==============

function DryRunResultDisplay({ result, onClose, onSendForReal, inline = false }: DryRunResultDisplayProps) {
  const hasWarnings = result.warnings && result.warnings.length > 0;
  const hasCriticalWarnings = result.warnings?.some(w => 
    w.includes('unsubscribe') || w.includes('No recipients')
  );

  const content = (
    <div className={inline ? "bg-slate-800 rounded-xl overflow-hidden flex flex-col border border-slate-700" : "bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-700"}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          hasCriticalWarnings 
            ? 'bg-red-500/10 border-red-500/30' 
            : hasWarnings 
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-green-500/10 border-green-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              hasCriticalWarnings 
                ? 'bg-red-500/20' 
                : hasWarnings 
                ? 'bg-amber-500/20'
                : 'bg-green-500/20'
            }`}>
              {hasCriticalWarnings ? (
                <AlertOctagon className="w-5 h-5 text-red-400" />
              ) : hasWarnings ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Dry Run {hasCriticalWarnings ? 'Failed' : 'Complete'}
              </h2>
              <p className="text-sm text-slate-300">{result.templateName}</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-300">
                {result.totalRecipients.toLocaleString()}
              </p>
              <p className="text-xs text-blue-400">Recipients</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
              <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-purple-300">
                {result.estimatedSendTime}
              </p>
              <p className="text-xs text-purple-400">Est. Send Time</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-300">
                {result.warnings?.length || 0}
              </p>
              <p className="text-xs text-amber-400">Warnings</p>
            </div>
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300">Warnings</h4>
              {result.warnings?.map((warning, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    warning.includes('unsubscribe') || warning.includes('No recipients')
                      ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sample Recipients */}
          {result.recipients && result.recipients.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Sample Recipients (first {result.recipients.length})
              </h4>
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-300">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-300">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.recipients.map((recipient, index) => (
                      <tr key={index} className="border-t border-slate-700">
                        <td className="px-4 py-2 text-white">{recipient.email}</td>
                        <td className="px-4 py-2 text-slate-300">{recipient.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.totalRecipients > result.recipients.length && (
                  <div className="px-4 py-2 bg-slate-900/50 text-sm text-slate-400 text-center">
                    + {(result.totalRecipients - result.recipients.length).toLocaleString()} more recipients
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Execution Info */}
          <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Executed by: {result.executedBy}</span>
              <span>{new Date(result.executedAt || Date.now()).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-colors"
          >
            {inline ? 'Reset' : 'Close'}
          </button>
          
          {!hasCriticalWarnings && result.totalRecipients > 0 && (
            <button
              onClick={onSendForReal}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send For Real
            </button>
          )}
        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
}

// ============== DRY RUN BUTTON ==============

interface DryRunButtonProps {
  templateId: string;
  templateName: string;
  htmlContent: string;
  subject: string;
  segmentFilters?: SegmentFilters;
  currentUserEmail: string;
}

export function DryRunButton({
  templateId,
  templateName,
  htmlContent,
  subject,
  segmentFilters,
  currentUserEmail,
}: DryRunButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 border border-amber-500/50 bg-amber-500/10 text-amber-400 font-medium rounded-lg hover:bg-amber-500/20 transition-colors"
      >
        <PlayCircle className="w-4 h-4" />
        Dry Run
      </button>

      {showModal && (
        <DryRunMode
          templateId={templateId}
          templateName={templateName}
          htmlContent={htmlContent}
          subject={subject}
          segmentFilters={segmentFilters}
          currentUserEmail={currentUserEmail}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default DryRunMode;
