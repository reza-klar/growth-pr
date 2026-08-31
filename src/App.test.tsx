import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import * as storage from './services/storage';
import * as github from './services/github';
import { PullRequestItem } from './types';

const mockPR1: PullRequestItem = {
  id: 'PR_1',
  number: 100,
  title: 'refactor: modularize API services',
  url: 'https://github.com/acme/web-app/pull/100',
  repository: { nameWithOwner: 'acme/web-app', url: 'https://github.com/acme/web-app' },
  author: { login: 'dev1', avatarUrl: '', url: '' },
  createdAt: '2026-08-30T10:00:00Z',
  updatedAt: '2026-08-30T12:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'refactor/api',
  totalCommentsCount: 4,
  participants: [{ login: 'dev1', avatarUrl: '', url: '' }],
  lastInteraction: {
    user: { login: 'reviewer1', avatarUrl: '', url: '' },
    type: 'comment',
    createdAt: '2026-08-30T12:00:00Z',
  },
  reviewDecision: 'APPROVED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [{ name: 'frontend', color: '3b82f6' }],
  isWaitingOnMe: false,
  isAuthoredByMe: true,
};

const mockPR2: PullRequestItem = {
  id: 'PR_2',
  number: 101,
  title: 'fix: resolve race condition in worker',
  url: 'https://github.com/acme/backend/pull/101',
  repository: { nameWithOwner: 'acme/backend', url: 'https://github.com/acme/backend' },
  author: { login: 'dev2', avatarUrl: '', url: '' },
  createdAt: '2026-08-28T08:00:00Z',
  updatedAt: '2026-08-28T09:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'fix/worker-bug',
  totalCommentsCount: 1,
  participants: [{ login: 'dev2', avatarUrl: '', url: '' }],
  lastInteraction: {
    user: { login: 'dev2', avatarUrl: '', url: '' },
    type: 'commit',
    createdAt: '2026-08-28T09:00:00Z',
  },
  reviewDecision: 'REVIEW_REQUIRED',
  ciStatus: 'FAILURE',
  slaStatus: 'stale',
  labels: [{ name: 'bug', color: 'ef4444' }],
  isWaitingOnMe: true,
  isAuthoredByMe: false,
};

describe('App Main Dashboard Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prompts to configure settings when no token or repos are set', () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: '',
      storageType: 'local',
      repositories: [],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    render(<App />);
    expect(screen.getByText(/Configure GitHub Access/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Settings/i })).toBeInTheDocument();
  });

  it('opens Settings modal when clicking Open Settings button or header settings button', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: '',
      storageType: 'local',
      repositories: [],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }));
    expect(screen.getByText(/Settings & Authentication/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText(/Settings & Authentication/i)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Settings/i));
    expect(screen.getByText(/Settings & Authentication/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText(/Settings & Authentication/i)).not.toBeInTheDocument();
    });
  });

  it('fetches and displays PR list when configured', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app', 'acme/backend'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    const fetchSpy = vi.spyOn(github, 'fetchRepoPRs').mockResolvedValue({
      prs: [mockPR1, mockPR2],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
    });

    render(<App />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('ghp_mock_token', ['acme/web-app', 'acme/backend']);
      expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
      expect(screen.getByText(/fix: resolve race condition in worker/i)).toBeInTheDocument();
      expect(screen.getAllByText('acme/web-app').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('acme/backend').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles manual refresh via Header button', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    const fetchSpy = vi.spyOn(github, 'fetchRepoPRs').mockResolvedValue({
      prs: [mockPR1],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('displays error banner when fetch fails and allows retry', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    const fetchSpy = vi.spyOn(github, 'fetchRepoPRs')
      .mockRejectedValueOnce(new Error('Bad credentials or rate limit exceeded'))
      .mockResolvedValueOnce({
        prs: [mockPR1],
        rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
      });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Bad credentials or rate limit exceeded/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
      expect(screen.queryByText(/Bad credentials or rate limit exceeded/i)).not.toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('opens and closes the ExportModal', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    vi.spyOn(github, 'fetchRepoPRs').mockResolvedValue({
      prs: [mockPR1],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Export Standup/i }));

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Export Standup Digest/i)).not.toBeInTheDocument();
    });
  });

  it('filters PRs by preset filters', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app', 'acme/backend'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    vi.spyOn(github, 'fetchRepoPRs').mockResolvedValue({
      prs: [mockPR1, mockPR2],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
      expect(screen.getByText(/fix: resolve race condition in worker/i)).toBeInTheDocument();
    });

    // Filter by "Waiting on Me"
    fireEvent.click(screen.getByRole('button', { name: /Waiting on Me/i }));
    expect(screen.queryByText(/refactor: modularize API services/i)).not.toBeInTheDocument();
    expect(screen.getByText(/fix: resolve race condition in worker/i)).toBeInTheDocument();

    // Filter by "Authored by Me"
    fireEvent.click(screen.getByRole('button', { name: /Authored by Me/i }));
    expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
    expect(screen.queryByText(/fix: resolve race condition in worker/i)).not.toBeInTheDocument();

    // Filter by "Needs Review"
    fireEvent.click(screen.getByRole('button', { name: /Needs Review/i }));
    expect(screen.queryByText(/refactor: modularize API services/i)).not.toBeInTheDocument();
    expect(screen.getByText(/fix: resolve race condition in worker/i)).toBeInTheDocument();

    // Filter by "Ready to Merge"
    fireEvent.click(screen.getByRole('button', { name: /Ready to Merge/i }));
    expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
    expect(screen.queryByText(/fix: resolve race condition in worker/i)).not.toBeInTheDocument();
  });

  it('filters PRs by text search and repository dropdown', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app', 'acme/backend'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    vi.spyOn(github, 'fetchRepoPRs').mockResolvedValue({
      prs: [mockPR1, mockPR2],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
      expect(screen.getByText(/fix: resolve race condition in worker/i)).toBeInTheDocument();
    });

    // Search query
    const searchInput = screen.getByPlaceholderText(/Filter by title, author, branch, or label.../i);
    fireEvent.change(searchInput, { target: { value: 'race condition' } });

    expect(screen.queryByText(/refactor: modularize API services/i)).not.toBeInTheDocument();
    expect(screen.getByText(/fix: resolve race condition in worker/i)).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
    expect(screen.getByText(/fix: resolve race condition in worker/i)).toBeInTheDocument();

    // Repo dropdown filter
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'acme/web-app' } });
    expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
    expect(screen.queryByText(/fix: resolve race condition in worker/i)).not.toBeInTheDocument();
  });

  it('auto-refreshes periodically based on interval setting', async () => {
    vi.useFakeTimers();

    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 60,
    });

    const fetchSpy = vi.spyOn(github, 'fetchRepoPRs').mockResolvedValue({
      prs: [mockPR1],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
    });

    render(<App />);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
