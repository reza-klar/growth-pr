import React from 'react';
import { GitBranch, MessageSquare, ExternalLink, MessageCircle } from 'lucide-react';
import { PullRequestItem } from '../types';
import { ReviewBadge, CIBadge, SLABadge } from './StatusBadges';

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const PRRow: React.FC<{ pr: PullRequestItem }> = ({ pr }) => {
  return (
    <tr className="border-b border-slate-800/80 hover:bg-slate-900/40 transition-colors group">
      {/* Repository */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <a
          href={pr.repository.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-blue-300 hover:text-blue-200"
        >
          {pr.repository.nameWithOwner}
        </a>
      </td>

      {/* PR Details */}
      <td className="px-4 py-3.5 max-w-md">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              title={pr.title}
              className="text-sm font-semibold text-slate-100 hover:text-blue-400 transition-colors inline-flex items-center gap-1 line-clamp-2 break-words"
            >
              {pr.title}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 shrink-0" />
            </a>
            <span className="text-xs text-slate-500 font-mono shrink-0">#{pr.number}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              <GitBranch className="w-3 h-3 text-slate-500" />
              <span className="text-slate-300 truncate max-w-[120px]">{pr.headRefName}</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-400">{pr.baseRefName}</span>
            </span>

            {pr.labels.map((l) => (
              <span
                key={l.name}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-700 bg-slate-900 text-slate-300"
              >
                {l.name}
              </span>
            ))}
          </div>
        </div>
      </td>

      {/* Author & Created */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={pr.author.avatarUrl || `https://github.com/${pr.author.login || 'ghost'}.png`}
            alt={pr.author.login}
            className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800"
          />
          <div>
            <a
              href={pr.author.url || `https://github.com/${pr.author.login || 'ghost'}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-slate-200 hover:underline block"
            >
              {pr.author.login}
            </a>
            <span className="text-[11px] text-slate-500">{timeAgo(pr.createdAt)}</span>
          </div>
        </div>
      </td>

      {/* Review & CI Status */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <ReviewBadge decision={pr.reviewDecision} />
          <CIBadge status={pr.ciStatus} />
        </div>
      </td>

      {/* Discussions & Participants */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{pr.totalCommentsCount}</span>
            <span className="text-slate-500 text-[11px]">comments</span>
          </div>

          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {pr.participants.slice(0, 5).map((p) => (
              <img
                key={p.login}
                src={p.avatarUrl || `https://github.com/${p.login}.png`}
                alt={p.login}
                title={`@${p.login}`}
                className="w-5 h-5 rounded-full border border-slate-800 ring-1 ring-slate-950 bg-slate-800"
              />
            ))}
            {pr.participants.length > 5 && (
              <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 flex items-center justify-center font-mono">
                +{pr.participants.length - 5}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Last Interaction */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={pr.lastInteraction.user.avatarUrl || `https://github.com/${pr.lastInteraction.user.login || 'ghost'}.png`}
            alt={pr.lastInteraction.user.login}
            className="w-5 h-5 rounded-full border border-slate-700 shrink-0 bg-slate-800"
          />
          <div className="text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-slate-200">
                @{pr.lastInteraction.user.login}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              {timeAgo(pr.lastInteraction.createdAt)}
            </span>
          </div>
        </div>
      </td>

      {/* SLA / Staleness */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <SLABadge status={pr.slaStatus} />
      </td>
    </tr>
  );
};
