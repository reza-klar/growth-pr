import React from 'react';
import { PullRequestItem } from '../types';
import { PRRow } from './PRRow';
import { RefreshCw, FolderSearch } from 'lucide-react';

interface PRTableProps {
  prs: PullRequestItem[];
  isLoading: boolean;
}

export const PRTable: React.FC<PRTableProps> = ({ prs, isLoading }) => {
  if (isLoading && prs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-950 border border-slate-800 rounded-xl">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-300">Fetching Pull Requests...</p>
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-950 border border-slate-800 rounded-xl text-center">
        <FolderSearch className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Pull Requests found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No open PRs match your current filter criteria or tracked repositories.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Repository</th>
              <th scope="col" className="px-4 py-3">Pull Request</th>
              <th scope="col" className="px-4 py-3">Author / Created</th>
              <th scope="col" className="px-4 py-3">Status & CI</th>
              <th scope="col" className="px-4 py-3">Activity</th>
              <th scope="col" className="px-4 py-3">Last Interaction</th>
              <th scope="col" className="px-4 py-3 text-right">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {prs.map((pr) => (
              <PRRow key={pr.id} pr={pr} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
