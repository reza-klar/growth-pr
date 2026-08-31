import React, { useState } from 'react';
import { X, Copy, Check, FileText, MessageSquare } from 'lucide-react';
import { PullRequestItem } from '../types';
import { generateMarkdownDigest, generateSlackDigest } from '../utils/exportDigest';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prs: PullRequestItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, prs }) => {
  const [format, setFormat] = useState<'markdown' | 'slack'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const content = format === 'markdown' ? generateMarkdownDigest(prs) : generateSlackDigest(prs);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Export Standup Digest</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setFormat('markdown')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  format === 'markdown'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Markdown
              </button>
              <button
                type="button"
                onClick={() => setFormat('slack')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  format === 'slack'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Slack Text
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Digest
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={content}
            rows={12}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
