import React from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { FilterPreset, SortOption } from '../types';

interface FilterBarProps {
  activeFilter: FilterPreset;
  onFilterChange: (filter: FilterPreset) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  availableRepos: string[];
  counts: Record<FilterPreset, number>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  selectedRepo,
  onRepoChange,
  availableRepos,
  counts,
}) => {
  const filterButtons: { id: FilterPreset; label: string }[] = [
    { id: 'all', label: 'All Open' },
    { id: 'waiting_on_me', label: 'Waiting on Me' },
    { id: 'needs_review', label: 'Needs Review' },
    { id: 'ready_to_merge', label: 'Ready to Merge' },
    { id: 'authored_by_me', label: 'Authored by Me' },
  ];

  return (
    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
      {/* Top row: Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map((btn) => {
          const isActive = activeFilter === btn.id;
          const count = counts[btn.id] || 0;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => onFilterChange(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {btn.label}
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom row: Search + Repository dropdown + Sort dropdown */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by title, author, branch, or label..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Repository Filter */}
        {availableRepos.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={selectedRepo}
              onChange={(e) => onRepoChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
            >
              <option value="all">All Repositories ({availableRepos.length})</option>
              {availableRepos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="created_desc">Newest Created</option>
            <option value="created_asc">Oldest Created</option>
            <option value="updated_desc">Recently Active</option>
            <option value="comments_desc">Most Comments</option>
            <option value="stale_desc">Most Stale / SLA</option>
          </select>
        </div>
      </div>
    </div>
  );
};
