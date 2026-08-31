import React, { useState } from 'react';
import { Plus, X, FolderGit2 } from 'lucide-react';

interface RepoInputProps {
  repositories: string[];
  onChange: (repos: string[]) => void;
}

export const RepoInput: React.FC<RepoInputProps> = ({ repositories, onChange }) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (!trimmed.includes('/') || trimmed.split('/').length !== 2) {
      setError('Repository must be in "owner/repo" format');
      return;
    }
    if (repositories.includes(trimmed)) {
      setError('Repository already added');
      return;
    }
    onChange([...repositories, trimmed]);
    setInputVal('');
    setError(null);
  };

  const handleRemove = (repo: string) => {
    onChange(repositories.filter((r) => r !== repo));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="e.g. company-org/frontend-app"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-900/60 rounded-lg border border-slate-800">
        {repositories.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No repositories added yet.</p>
        ) : (
          repositories.map((repo) => (
            <span
              key={repo}
              className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-md"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
              {repo}
              <button
                type="button"
                onClick={() => handleRemove(repo)}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                aria-label={`Remove ${repo}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
