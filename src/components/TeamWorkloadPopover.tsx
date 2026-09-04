import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Users, X, Check } from 'lucide-react';
import { PullRequestItem, ReviewerWorkload } from '../types';

export interface TeamWorkloadPopoverProps {
  prs: PullRequestItem[];
  selectedReviewer: string | null;
  onSelectReviewer: (login: string | null) => void;
}

export function computeReviewerWorkload(prs: PullRequestItem[]): ReviewerWorkload[] {
  const reviewerMap = new Map<string, ReviewerWorkload>();

  for (const pr of prs) {
    const rawReviewers = (pr as any).requestedReviewers || (pr as any).reviewRequests || [];
    const seenOnThisPR = new Set<string>();

    if (Array.isArray(rawReviewers)) {
      for (const item of rawReviewers) {
        const user = item?.requestedReviewer || item;
        const login: string | undefined = typeof user === 'string' ? user : user?.login;
        if (!login || seenOnThisPR.has(login)) continue;
        seenOnThisPR.add(login);

        const avatarUrl =
          (typeof user === 'object' && user?.avatarUrl) ? user.avatarUrl : `https://github.com/${login}.png`;

        const existing = reviewerMap.get(login);
        if (existing) {
          existing.pendingReviewsCount += 1;
        } else {
          reviewerMap.set(login, {
            login,
            avatarUrl,
            pendingReviewsCount: 1,
          });
        }
      }
    }
  }

  return Array.from(reviewerMap.values()).sort((a, b) => {
    if (b.pendingReviewsCount !== a.pendingReviewsCount) {
      return b.pendingReviewsCount - a.pendingReviewsCount;
    }
    return a.login.localeCompare(b.login);
  });
}

export const TeamWorkloadPopover: React.FC<TeamWorkloadPopoverProps> = ({
  prs,
  selectedReviewer,
  onSelectReviewer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const workloads = useMemo(() => computeReviewerWorkload(prs), [prs]);
  const totalPendingReviews = useMemo(
    () => workloads.reduce((sum, w) => sum + w.pendingReviewsCount, 0),
    [workloads]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer ${
          selectedReviewer
            ? 'bg-blue-950/80 border-blue-500 text-blue-200 hover:bg-blue-900/80'
            : isOpen
              ? 'bg-slate-800 border-slate-600 text-slate-100'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
        }`}
      >
        <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span>Team Workload</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
            selectedReviewer
              ? 'bg-blue-900/80 text-blue-200 border-blue-700'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          {totalPendingReviews} pending
        </span>
        {selectedReviewer && (
          <span className="text-[10px] font-semibold text-blue-300 bg-blue-900/60 border border-blue-700/60 px-1.5 py-0.5 rounded">
            @{selectedReviewer}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Team Reviewer Workload"
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/60">
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Team Workload
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {workloads.length === 0
                  ? 'No active review requests'
                  : `${workloads.length} reviewer${workloads.length === 1 ? '' : 's'} · ${totalPendingReviews} pending`}
              </p>
            </div>
            {selectedReviewer && (
              <button
                type="button"
                onClick={() => {
                  onSelectReviewer(null);
                }}
                className="px-2 py-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                aria-label="Clear Filter"
              >
                <X className="w-3 h-3" />
                Clear Filter
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
            {workloads.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">All caught up! 🎉</p>
                <p className="text-[11px] text-slate-500">No pending review requests across the team.</p>
              </div>
            ) : (
              workloads.map((reviewer) => {
                const isSelected = selectedReviewer === reviewer.login;
                return (
                  <button
                    key={reviewer.login}
                    type="button"
                    onClick={() => {
                      onSelectReviewer(isSelected ? null : reviewer.login);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/80 border border-blue-600/80 text-blue-100 shadow-sm'
                        : 'hover:bg-slate-800/70 border border-transparent text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={reviewer.avatarUrl}
                        alt={reviewer.login}
                        className="w-5 h-5 rounded-full border border-slate-700 object-cover shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://github.com/${reviewer.login}.png`;
                        }}
                      />
                      <span className="font-medium truncate">@{reviewer.login}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-blue-900 text-blue-200 border-blue-700'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {reviewer.pendingReviewsCount} pending
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {workloads.length > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-500 text-center">
              Click a teammate to filter their review queue
            </div>
          )}
        </div>
      )}
    </div>
  );
};
