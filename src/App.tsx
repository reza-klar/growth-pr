import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PRTable } from './components/PRTable';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { getStoredSettings, saveStoredSettings } from './services/storage';
import { fetchRepoPRs } from './services/github';
import { AppSettings, PullRequestItem, RateLimitInfo, FilterPreset, SortOption } from './types';
import { KeyRound, AlertCircle, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [prs, setPrs] = useState<PullRequestItem[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Filters & Sorting state
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [selectedRepo, setSelectedRepo] = useState('all');

  const loadData = useCallback(async () => {
    if (!settings.token || settings.repositories.length === 0) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    try {
      const res = await fetchRepoPRs(settings.token, settings.repositories);
      setPrs(res.prs);
      setRateLimit(res.rateLimit);
      setWarnings(res.warnings || []);
      setLastFetched(new Date());
    } catch (err: any) {
      const rawMsg = err.message || '';
      if (rawMsg.toLowerCase().includes('load failed') || rawMsg.toLowerCase().includes('failed to fetch')) {
        setError('Network / GitHub API connection interrupted. Please check your internet connection or verify that your GitHub token has SSO authorized.');
      } else {
        setError(rawMsg || 'Failed to fetch Pull Requests');
      }
    } finally {
      setIsLoading(false);
    }
  }, [settings.token, settings.repositories]);

  // Initial load
  useEffect(() => {
    if (settings.token && settings.repositories.length > 0) {
      loadData();
    }
  }, [loadData, settings.token, settings.repositories]);

  // Auto-refresh timer
  useEffect(() => {
    if (settings.autoRefreshIntervalSeconds <= 0) return;
    const interval = setInterval(() => {
      loadData();
    }, settings.autoRefreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [loadData, settings.autoRefreshIntervalSeconds]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Filter and sort calculations
  const filteredPrs = useMemo(() => {
    return prs
      .filter((pr) => {
        // Repo filter
        if (selectedRepo !== 'all' && pr.repository.nameWithOwner !== selectedRepo) {
          return false;
        }

        // Quick filter preset
        if (activeFilter === 'waiting_on_me' && !pr.isWaitingOnMe) return false;
        if (activeFilter === 'authored_by_me' && !pr.isAuthoredByMe) return false;
        if (activeFilter === 'needs_review' && pr.reviewDecision !== 'REVIEW_REQUIRED') return false;
        if (
          activeFilter === 'ready_to_merge' &&
          (pr.reviewDecision !== 'APPROVED' || pr.ciStatus === 'FAILURE')
        ) {
          return false;
        }

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = pr.title.toLowerCase().includes(q);
          const matchAuthor = pr.author.login.toLowerCase().includes(q);
          const matchHead = pr.headRefName.toLowerCase().includes(q);
          const matchRepo = pr.repository.nameWithOwner.toLowerCase().includes(q);
          const matchLabels = pr.labels.some((l) => l.name.toLowerCase().includes(q));
          if (!matchTitle && !matchAuthor && !matchHead && !matchRepo && !matchLabels) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'created_desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created_asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'updated_desc':
            return (
              new Date(b.lastInteraction.createdAt).getTime() -
              new Date(a.lastInteraction.createdAt).getTime()
            );
          case 'comments_desc':
            return b.totalCommentsCount - a.totalCommentsCount;
          case 'stale_desc': {
            const score = { stale: 3, warning: 2, normal: 1 };
            return score[b.slaStatus] - score[a.slaStatus];
          }
          default:
            return 0;
        }
      });
  }, [prs, selectedRepo, activeFilter, searchQuery, sortOption]);

  const counts: Record<FilterPreset, number> = useMemo(() => {
    return {
      all: prs.length,
      waiting_on_me: prs.filter((p) => p.isWaitingOnMe).length,
      authored_by_me: prs.filter((p) => p.isAuthoredByMe).length,
      needs_review: prs.filter((p) => p.reviewDecision === 'REVIEW_REQUIRED').length,
      ready_to_merge: prs.filter(
        (p) => p.reviewDecision === 'APPROVED' && p.ciStatus !== 'FAILURE'
      ).length,
    };
  }, [prs]);

  const isConfigured = Boolean(settings.token && settings.repositories.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        onRefresh={loadData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isLoading={isLoading}
        rateLimit={rateLimit}
        lastFetched={lastFetched}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {!isConfigured ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl max-w-xl mx-auto space-y-4 my-12">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Configure GitHub Access</h2>
            <p className="text-sm text-slate-400">
              Provide your GitHub Personal Access Token and enter the company repositories you wish
              to monitor.
            </p>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg transition-all cursor-pointer"
            >
              Open Settings
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center justify-between p-4 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="flex items-center gap-1 text-xs bg-rose-900/80 hover:bg-rose-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="p-4 bg-amber-950/60 border border-amber-800 text-amber-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>GitHub Access / Query Warnings:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-200/90 pl-1">
                  {warnings.map((w, idx) => (
                    <li key={idx} className="break-words">{w}</li>
                  ))}
                </ul>
                {warnings.some((w) => w.toLowerCase().includes('saml')) && (
                  <div className="pt-2 border-t border-amber-900/60 text-slate-300 flex items-start gap-2">
                    <span>👉</span>
                    <div>
                      <strong className="text-amber-200">SAML SSO Authorization Required:</strong> Your GitHub token needs to be authorized for your company's organization.
                      <div className="mt-1">
                        <a
                          href="https://github.com/settings/tokens"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:underline font-medium"
                        >
                          Open GitHub Token Settings ➔ Click "Configure SSO" ➔ "Authorize" <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
              selectedRepo={selectedRepo}
              onRepoChange={setSelectedRepo}
              availableRepos={settings.repositories}
              counts={counts}
            />

            <PRTable prs={filteredPrs} isLoading={isLoading} />
          </>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        prs={filteredPrs}
      />
    </div>
  );
}
