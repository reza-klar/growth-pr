import React, { useState } from 'react';
import { X, Key, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';
import { RepoInput } from './RepoInput';
import { verifyToken } from '../services/github';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [token, setToken] = useState(settings.token);
  const [storageType, setStorageType] = useState(settings.storageType);
  const [repositories, setRepositories] = useState(settings.repositories);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(
    settings.autoRefreshIntervalSeconds
  );

  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    success: boolean;
    user?: string;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestToken = async () => {
    if (!token.trim()) {
      setVerifyStatus({ success: false, error: 'Please enter a token first' });
      return;
    }
    setVerifying(true);
    setVerifyStatus(null);
    try {
      const user = await verifyToken(token.trim());
      setVerifyStatus({ success: true, user: user.login });
    } catch (err: any) {
      setVerifyStatus({ success: false, error: err.message || 'Token validation failed' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      token: token.trim(),
      storageType,
      repositories,
      autoRefreshIntervalSeconds: autoRefreshInterval,
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            <h2 id="settings-dialog-title" className="text-lg font-semibold text-slate-100">Settings & Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Token Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200">
                GitHub Personal Access Token (PAT)
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:org"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                Generate Token ↗
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_ or github_pat_..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestToken}
                disabled={verifying || !token}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {verifying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                )}
                Test
              </button>
            </div>

            {verifyStatus && (
              <div
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
                  verifyStatus.success
                    ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border border-rose-800 text-rose-300'
                }`}
              >
                {verifyStatus.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Valid token for user <strong>@{verifyStatus.user}</strong>.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{verifyStatus.error}</span>
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-slate-400">
              Requires <code>repo</code> or <code>read:org</code> scope. If using SAML SSO, click <em>Configure SSO</em> on your token in GitHub settings.
            </p>
          </div>

          {/* Storage Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Storage Preference</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="radio"
                  name="storage"
                  checked={storageType === 'local'}
                  onChange={() => setStorageType('local')}
                  className="text-blue-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">
                  <strong>Local Storage</strong> (Persists across browser restarts)
                </span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="radio"
                  name="storage"
                  checked={storageType === 'session'}
                  onChange={() => setStorageType('session')}
                  className="text-blue-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200">
                  <strong>Session Only</strong> (Cleared when tab closes)
                </span>
              </label>
            </div>
          </div>

          {/* Repositories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Tracked Repositories (<code>owner/repo</code>)
            </label>
            <RepoInput repositories={repositories} onChange={setRepositories} />
          </div>

          {/* Auto Refresh */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Auto Refresh Interval</label>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={0}>Disabled (Manual refresh only)</option>
              <option value={60}>Every 1 minute</option>
              <option value={180}>Every 3 minutes</option>
              <option value={300}>Every 5 minutes</option>
              <option value={600}>Every 10 minutes</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow transition-colors cursor-pointer"
            >
              Save & Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
