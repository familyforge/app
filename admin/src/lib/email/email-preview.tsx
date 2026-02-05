/**
 * FamilyForge Email System - Email Preview Component
 * 
 * Provides multi-device preview, test email sending, and HTML validation.
 * This is an ADDITIVE component that can be integrated into EmailSystemPage.
 */

import React, { useState, useMemo } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Send, 
  Eye,
  Code,
  AlertTriangle,
  CheckCircle,
  X,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { EMAIL_BRAND } from './types';

// ============== TYPES ==============

interface EmailPreviewProps {
  htmlContent: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  onSendTest?: (email: string) => Promise<boolean>;
  onClose?: () => void;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

// ============== DEVICE CONFIGS ==============

const DEVICE_CONFIGS: Record<DeviceType, { width: number; height: number; label: string }> = {
  desktop: { width: 600, height: 800, label: 'Desktop' },
  tablet: { width: 480, height: 640, label: 'Tablet' },
  mobile: { width: 375, height: 667, label: 'Mobile' },
};

// ============== HTML VALIDATOR ==============

export function validateEmailHtml(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for common issues
  if (!html.includes('<!DOCTYPE') && !html.includes('<!doctype')) {
    issues.push({
      type: 'warning',
      message: 'Missing DOCTYPE declaration. Some email clients may render incorrectly.',
    });
  }

  if (!html.includes('<meta') || !html.includes('viewport')) {
    issues.push({
      type: 'warning',
      message: 'Missing viewport meta tag. Mobile rendering may be affected.',
    });
  }

  if (!html.includes('font-family')) {
    issues.push({
      type: 'info',
      message: 'No font-family found. Consider adding fallback fonts.',
    });
  }

  // Check for problematic elements
  if (html.includes('<style>') && !html.includes('mso')) {
    issues.push({
      type: 'info',
      message: 'Embedded styles detected. Outlook may ignore some styles - consider using inline styles.',
    });
  }

  if (html.includes('<script')) {
    issues.push({
      type: 'error',
      message: 'JavaScript detected. Scripts are not supported in email clients.',
    });
  }

  if (html.includes('position: absolute') || html.includes('position:absolute')) {
    issues.push({
      type: 'warning',
      message: 'Absolute positioning detected. Many email clients do not support this.',
    });
  }

  if (html.includes('display: flex') || html.includes('display:flex')) {
    issues.push({
      type: 'warning',
      message: 'Flexbox detected. Use tables for better email client compatibility.',
    });
  }

  if (!html.includes('alt=')) {
    issues.push({
      type: 'warning',
      message: 'Images without alt text detected. Add alt attributes for accessibility.',
    });
  }

  // Check for links
  if (html.includes('href="http://') && !html.includes('href="https://')) {
    issues.push({
      type: 'warning',
      message: 'Non-HTTPS links detected. Use HTTPS for security.',
    });
  }

  // Check for unsubscribe link
  if (!html.toLowerCase().includes('unsubscribe')) {
    issues.push({
      type: 'error',
      message: 'No unsubscribe link found. This is required by law (CAN-SPAM, GDPR).',
    });
  }

  // Check for physical address
  if (!html.includes('address') && !html.includes('Address')) {
    issues.push({
      type: 'warning',
      message: 'No company address found. CAN-SPAM requires a physical postal address.',
    });
  }

  // Check for images
  const imgMatches = html.match(/<img[^>]*>/g) || [];
  imgMatches.forEach((img, index) => {
    if (!img.includes('width=') || !img.includes('height=')) {
      issues.push({
        type: 'info',
        message: `Image ${index + 1} missing explicit dimensions. This can cause layout shifts.`,
      });
    }
  });

  // Count issues
  if (issues.length === 0) {
    issues.push({
      type: 'info',
      message: 'No issues found! Your email looks ready to send.',
    });
  }

  return issues;
}

// ============== EXTRACT PLAIN TEXT ==============

function extractPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

// ============== COMPONENT ==============

export function EmailPreview({
  htmlContent,
  subject,
  fromName = EMAIL_BRAND.companyName,
  fromEmail = EMAIL_BRAND.supportEmail,
  onSendTest,
  onClose,
}: EmailPreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'text'>('preview');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const validationIssues = useMemo(() => validateEmailHtml(htmlContent), [htmlContent]);
  const plainText = useMemo(() => extractPlainText(htmlContent), [htmlContent]);

  const errorCount = validationIssues.filter(i => i.type === 'error').length;
  const warningCount = validationIssues.filter(i => i.type === 'warning').length;

  const handleSendTest = async () => {
    if (!testEmail || !onSendTest) return;
    
    setIsSendingTest(true);
    try {
      const success = await onSendTest(testEmail);
      if (success) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
    } finally {
      setIsSendingTest(false);
    }
  };

  const deviceConfig = DEVICE_CONFIGS[device];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Email Preview</h2>
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

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-900/50">
          {/* Device Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-lg transition-colors ${
                device === 'desktop'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
              title="Desktop"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-2 rounded-lg transition-colors ${
                device === 'tablet'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
              title="Tablet"
            >
              <Tablet className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-lg transition-colors ${
                device === 'mobile'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
              title="Mobile"
            >
              <Smartphone className="w-5 h-5" />
            </button>
            <span className="ml-2 text-sm text-slate-400">
              {deviceConfig.width}×{deviceConfig.height}
            </span>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-violet-600 text-white'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'code'
                  ? 'bg-violet-600 text-white'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
            >
              HTML
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'text'
                  ? 'bg-violet-600 text-white'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
            >
              Plain Text
            </button>
          </div>

          {/* Validation Toggle */}
          <button
            onClick={() => setShowValidation(!showValidation)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showValidation ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-700 text-slate-400'
            }`}
          >
            {errorCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : warningCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {errorCount > 0
              ? `${errorCount} Error${errorCount > 1 ? 's' : ''}`
              : warningCount > 0
              ? `${warningCount} Warning${warningCount > 1 ? 's' : ''}`
              : 'Valid'}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Preview Panel */}
          <div className="flex-1 overflow-auto p-6 bg-slate-900/50">
            {viewMode === 'preview' && (
              <div className="flex flex-col items-center">
                {/* Email Metadata */}
                <div
                  className="bg-slate-700 rounded-t-lg border border-b-0 border-slate-600 p-4 mb-0"
                  style={{ width: deviceConfig.width }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {fromName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{fromName}</div>
                      <div className="text-sm text-slate-400">&lt;{fromEmail}&gt;</div>
                    </div>
                  </div>
                  <div className="text-white font-medium">{subject}</div>
                </div>

                {/* Email Content */}
                <div
                  className="bg-white border border-slate-600 shadow-lg overflow-hidden rounded-b-lg"
                  style={{
                    width: deviceConfig.width,
                    minHeight: deviceConfig.height,
                  }}
                >
                  <iframe
                    srcDoc={htmlContent}
                    title="Email Preview"
                    className="w-full h-full border-0"
                    style={{ minHeight: deviceConfig.height }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

            {viewMode === 'code' && (
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto h-full">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {htmlContent}
                </pre>
              </div>
            )}

            {viewMode === 'text' && (
              <div className="bg-slate-700 rounded-lg p-6 overflow-auto h-full max-w-[600px] mx-auto border border-slate-600">
                <div className="mb-4 pb-4 border-b border-slate-600">
                  <div className="font-medium text-white">From: {fromName} &lt;{fromEmail}&gt;</div>
                  <div className="font-medium text-white">Subject: {subject}</div>
                </div>
                <pre className="text-sm text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                  {plainText}
                </pre>
              </div>
            )}
          </div>

          {/* Validation Panel */}
          {showValidation && (
            <div className="w-80 border-l border-slate-700 overflow-auto bg-slate-800">
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">Validation Results</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {validationIssues.length} issue{validationIssues.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="p-4 space-y-3">
                {validationIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      issue.type === 'error'
                        ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                        : issue.type === 'warning'
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {issue.type === 'error' ? (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                      ) : issue.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                      )}
                      <span>{issue.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Test Email */}
        {onSendTest && (
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Send Test Email
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-slate-500"
                    />
                  </div>
                  <button
                    onClick={handleSendTest}
                    disabled={!testEmail || isSendingTest}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      testSent
                        ? 'bg-green-600 text-white'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSendingTest ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : testSent ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {testSent ? 'Sent!' : 'Send Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== INLINE PREVIEW (for embedding) ==============

interface InlineEmailPreviewProps {
  htmlContent: string;
  previewHeight?: number;
  className?: string;
}

export function InlineEmailPreview({ 
  htmlContent, 
  previewHeight = 400,
  className = '',
}: InlineEmailPreviewProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      <iframe
        srcDoc={htmlContent}
        title="Email Preview"
        className="w-full border-0"
        style={{ height: previewHeight }}
        sandbox="allow-same-origin"
      />
    </div>
  );
}

// ============== PREVIEW THUMBNAIL ==============

interface EmailThumbnailProps {
  htmlContent: string;
  onClick?: () => void;
  selected?: boolean;
}

export function EmailThumbnail({ htmlContent, onClick, selected }: EmailThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-32 h-40 rounded-lg border-2 overflow-hidden transition-all ${
        selected
          ? 'border-violet-500 ring-2 ring-violet-500/30'
          : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="absolute inset-0 transform scale-[0.2] origin-top-left">
        <iframe
          srcDoc={htmlContent}
          title="Thumbnail"
          className="w-[600px] h-[800px] border-0 pointer-events-none"
          sandbox="allow-same-origin"
        />
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

export default EmailPreview;
