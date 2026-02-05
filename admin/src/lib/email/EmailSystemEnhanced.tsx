/**
 * EmailSystemEnhanced - Tab-based wrapper for email features
 * 
 * This component provides a tab navigation layer that includes:
 * - Templates (existing EmailSystemPage content - rendered externally)
 * - Analytics Dashboard
 * - Scheduling Management
 * - Audience Segments
 * - Compliance & Safety
 * - Version History
 * - Dry Run Mode
 * 
 * USAGE:
 * Replace the EmailSystemPage route in App.tsx with EmailSystemEnhanced,
 * or integrate individual tabs as needed.
 */

import { useState } from 'react';
import {
  Mail, BarChart3, Clock, Users, Shield, History, 
  FlaskConical, ChevronRight, Settings
} from 'lucide-react';

// Import all the extension components
import { EmailAnalyticsDashboard } from './email-analytics';
import { EmailScheduler, SchedulerList } from './email-scheduling';
import { SegmentEditor, SegmentList } from './email-segmentation';
import { ComplianceDashboard } from './email-compliance';
import { VersionHistory } from './email-versioning';
import { DryRunMode } from './email-dry-run';

type TabId = 'templates' | 'analytics' | 'scheduling' | 'segments' | 'compliance' | 'versions' | 'dryrun';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const TABS: Tab[] = [
  { 
    id: 'templates', 
    label: 'Templates', 
    icon: Mail,
    description: 'Manage email templates'
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    description: 'View delivery metrics'
  },
  { 
    id: 'scheduling', 
    label: 'Scheduling', 
    icon: Clock,
    description: 'Manage scheduled emails'
  },
  { 
    id: 'segments', 
    label: 'Segments', 
    icon: Users,
    description: 'Audience targeting'
  },
  { 
    id: 'compliance', 
    label: 'Compliance', 
    icon: Shield,
    description: 'Safety controls',
    badge: 'LIVE'
  },
  { 
    id: 'versions', 
    label: 'History', 
    icon: History,
    description: 'Version control'
  },
  { 
    id: 'dryrun', 
    label: 'Test Mode', 
    icon: FlaskConical,
    description: 'Simulation'
  },
];

interface EmailSystemEnhancedProps {
  /** Callback when Templates tab is active - render your existing EmailSystemPage here */
  renderTemplates?: () => React.ReactNode;
  /** Initial active tab */
  defaultTab?: TabId;
  /** Current admin email for compliance actions */
  currentUserEmail: string;
  /** Optional: Currently selected template for context-aware features */
  selectedTemplateId?: string;
  selectedTemplateName?: string;
  selectedTemplateContent?: string;
  selectedTemplateSubject?: string;
}

export function EmailSystemEnhanced({
  renderTemplates,
  defaultTab = 'templates',
  currentUserEmail,
  selectedTemplateId,
  selectedTemplateName,
  selectedTemplateContent,
  selectedTemplateSubject
}: EmailSystemEnhancedProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showSegmentEditor, setShowSegmentEditor] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return renderTemplates ? renderTemplates() : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <p>Pass your EmailSystemPage content via the renderTemplates prop</p>
          </div>
        );

      case 'analytics':
        return <EmailAnalyticsDashboard />;

      case 'scheduling':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Email Scheduling</h3>
                <p className="text-slate-400">Manage scheduled and recurring emails</p>
              </div>
              <button
                onClick={() => setShowScheduler(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Schedule Email
              </button>
            </div>
            <SchedulerList />
          </div>
        );

      case 'segments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Audience Segments</h3>
                <p className="text-slate-400">Create and manage targeted audience groups</p>
              </div>
              <button
                onClick={() => setShowSegmentEditor(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                New Segment
              </button>
            </div>
            <SegmentList />
          </div>
        );

      case 'compliance':
        return <ComplianceDashboard currentUserEmail={currentUserEmail} />;

      case 'versions':
        return (
          <VersionHistory 
            templateId={selectedTemplateId ?? ''} 
            templateName={selectedTemplateName ?? 'Template'}
          />
        );

      case 'dryrun':
        return (
          <DryRunMode
            templateId={selectedTemplateId || 'demo-template'}
            templateName={selectedTemplateName || 'Select a template'}
            htmlContent={selectedTemplateContent || '<p>Select a template to simulate</p>'}
            subject={selectedTemplateSubject || 'FamilyForge Update'}
            currentUserEmail={currentUserEmail}
            inline={true}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-slate-800/50 rounded-2xl p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap
                  ${isActive 
                    ? 'bg-violet-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`
                    px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase
                    ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Bar (context-aware) */}
      {selectedTemplateId && activeTab === 'templates' && (
        <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl p-4 border border-violet-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-600/30 rounded-xl">
                <Mail className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Selected Template</p>
                <p className="text-white font-medium">{selectedTemplateName || 'Template'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('versions')}
                className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={() => setActiveTab('dryrun')}
                className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                Test
              </button>
              <button
                onClick={() => setShowScheduler(true)}
                className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* Scheduler Modal */}
      {showScheduler && (
        <EmailScheduler
          templateId={selectedTemplateId || ''}
          templateName={selectedTemplateName || 'Email'}
          currentUserEmail={currentUserEmail}
          onClose={() => setShowScheduler(false)}
          onScheduled={(schedule) => {
            console.log('Scheduled:', schedule);
            setShowScheduler(false);
          }}
        />
      )}

      {/* Segment Editor Modal */}
      {showSegmentEditor && (
        <SegmentEditor
          onClose={() => setShowSegmentEditor(false)}
          onSave={(segment) => {
            console.log('Saved segment:', segment);
            setShowSegmentEditor(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Standalone Email Toolbar - Add to existing page without tab wrapper
 * 
 * This provides quick-action buttons for the enhanced features
 * that can be added alongside your existing EmailSystemPage
 */
interface EmailToolbarProps {
  selectedTemplateId?: string;
  selectedTemplateName?: string;
  selectedTemplateContent?: string;
  onOpenPreview?: () => void;
  onOpenScheduler?: () => void;
  onOpenDryRun?: () => void;
  onOpenVersions?: () => void;
}

export function EmailToolbar({
  selectedTemplateId,
  selectedTemplateName,
  selectedTemplateContent,
  onOpenPreview,
  onOpenScheduler,
  onOpenDryRun,
  onOpenVersions
}: EmailToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl">
      <span className="text-xs text-slate-500 px-2">Quick Actions:</span>
      
      {onOpenPreview && (
        <button
          onClick={onOpenPreview}
          disabled={!selectedTemplateId}
          className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
          Preview
        </button>
      )}
      
      {onOpenScheduler && (
        <button
          onClick={onOpenScheduler}
          disabled={!selectedTemplateId}
          className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          Schedule
        </button>
      )}
      
      {onOpenDryRun && (
        <button
          onClick={onOpenDryRun}
          disabled={!selectedTemplateId}
          className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Test
        </button>
      )}
      
      {onOpenVersions && (
        <button
          onClick={onOpenVersions}
          disabled={!selectedTemplateId}
          className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
      )}
    </div>
  );
}

/**
 * Email System Status Badge - Shows system health
 */
interface EmailStatusBadgeProps {
  isKillSwitchActive?: boolean;
  scheduledCount?: number;
  lastSentAt?: string;
}

export function EmailStatusBadge({
  isKillSwitchActive = false,
  scheduledCount = 0,
  lastSentAt
}: EmailStatusBadgeProps) {
  return (
    <div className="flex items-center gap-3">
      {isKillSwitchActive ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-red-400">PAUSED</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs font-medium text-emerald-400">ACTIVE</span>
        </div>
      )}
      
      {scheduledCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-slate-300">{scheduledCount} scheduled</span>
        </div>
      )}
      
      {lastSentAt && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 rounded-lg">
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400">Last: {lastSentAt}</span>
        </div>
      )}
    </div>
  );
}

export default EmailSystemEnhanced;
