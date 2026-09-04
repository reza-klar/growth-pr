import React from 'react';
import { GitPullRequest, RefreshCw, Settings, Share2, Activity } from 'lucide-react';
import { RateLimitInfo, PullRequestItem } from '../types';
import { TeamWorkloadPopover } from './TeamWorkloadPopover';

export interface HeaderProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  isLoading: boolean;
  rateLimit: RateLimitInfo | null;
  lastFetched: Date | null;
  prs?: PullRequestItem[];
  selectedReviewer?: string | null;
  onSelectReviewer?: (login: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onOpenSettings,
  onOpenExport,
  isLoading,
  rateLimit,
  lastFetched,
  prs = [],
  selectedReviewer = null,
  onSelectReviewer = () => {},
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
              GitHub PR Dashboard
              <span className="text-[10px] uppercase font-semibold bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {lastFetched
                ? `Last updated: ${lastFetched.toLocaleTimeString()}`
                : 'Not synced yet'}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {rateLimit && (
            <div
              title={`GraphQL Rate Limit Reset: ${new Date(rateLimit.resetAt).toLocaleTimeString()}`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400"
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>
                API: <strong className="text-slate-200">{rateLimit.remaining}</strong> / {rateLimit.limit}
              </span>
            </div>
          )}

          <TeamWorkloadPopover
            prs={prs}
            selectedReviewer={selectedReviewer}
            onSelectReviewer={onSelectReviewer}
          />

          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Standup</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
