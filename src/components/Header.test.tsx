import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('renders title, rate limit, and triggers refresh', () => {
    const handleRefresh = vi.fn();
    const handleOpenSettings = vi.fn();
    const handleOpenExport = vi.fn();

    render(
      <Header
        onRefresh={handleRefresh}
        onOpenSettings={handleOpenSettings}
        onOpenExport={handleOpenExport}
        isLoading={false}
        rateLimit={{ limit: 5000, remaining: 4950, resetAt: new Date().toISOString(), used: 50 }}
        lastFetched={new Date(2026, 0, 1, 12, 0, 0)}
      />
    );

    expect(screen.getByText(/GitHub PR Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Live/i)).toBeInTheDocument();
    expect(screen.getByText(/4950/i)).toBeInTheDocument();
    expect(screen.getByText(/\/ 5000/i)).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();
  });

  it('triggers onOpenSettings and onOpenExport', () => {
    const handleOpenSettings = vi.fn();
    const handleOpenExport = vi.fn();

    render(
      <Header
        onRefresh={vi.fn()}
        onOpenSettings={handleOpenSettings}
        onOpenExport={handleOpenExport}
        isLoading={false}
        rateLimit={null}
        lastFetched={null}
      />
    );

    expect(screen.getByText(/Not synced yet/i)).toBeInTheDocument();

    const settingsBtn = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsBtn);
    expect(handleOpenSettings).toHaveBeenCalled();

    const exportBtn = screen.getByRole('button', { name: /Export Standup/i });
    fireEvent.click(exportBtn);
    expect(handleOpenExport).toHaveBeenCalled();
  });

  it('disables refresh button when loading', () => {
    const handleRefresh = vi.fn();

    render(
      <Header
        onRefresh={handleRefresh}
        onOpenSettings={vi.fn()}
        onOpenExport={vi.fn()}
        isLoading={true}
        rateLimit={null}
        lastFetched={null}
      />
    );

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    expect(refreshBtn).toBeDisabled();
  });

  it('renders TeamWorkloadPopover in header and forwards onSelectReviewer', () => {
    const handleSelect = vi.fn();
    const mockPRs: any[] = [
      {
        id: 'PR_1',
        number: 1,
        title: 'PR 1',
        url: 'https://github.com/org/repo/pull/1',
        repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
        author: { login: 'dev', avatarUrl: '', url: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDraft: false,
        baseRefName: 'main',
        headRefName: 'feat',
        totalCommentsCount: 0,
        participants: [],
        lastInteraction: { user: { login: 'dev', avatarUrl: '', url: '' }, type: 'commit', createdAt: '' },
        reviewDecision: 'REVIEW_REQUIRED',
        ciStatus: 'SUCCESS',
        slaStatus: 'normal',
        labels: [],
        requestedReviewers: [{ login: 'alex', avatarUrl: 'https://github.com/alex.png' }],
      },
    ];

    render(
      <Header
        onRefresh={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenExport={vi.fn()}
        isLoading={false}
        rateLimit={null}
        lastFetched={null}
        prs={mockPRs}
        selectedReviewer={null}
        onSelectReviewer={handleSelect}
      />
    );

    const workloadBtn = screen.getByRole('button', { name: /Team Workload/i });
    expect(workloadBtn).toBeInTheDocument();
    expect(screen.getByText(/1 pending/i)).toBeInTheDocument();

    fireEvent.click(workloadBtn);
    expect(screen.getByText('@alex')).toBeInTheDocument();

    fireEvent.click(screen.getByText('@alex'));
    expect(handleSelect).toHaveBeenCalledWith('alex');
  });

  it('allows clearing active reviewer filter from header workload popover', () => {
    const handleSelect = vi.fn();
    const mockPRs: any[] = [
      {
        id: 'PR_1',
        number: 1,
        title: 'PR 1',
        url: 'https://github.com/org/repo/pull/1',
        repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
        author: { login: 'dev', avatarUrl: '', url: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDraft: false,
        baseRefName: 'main',
        headRefName: 'feat',
        totalCommentsCount: 0,
        participants: [],
        lastInteraction: { user: { login: 'dev', avatarUrl: '', url: '' }, type: 'commit', createdAt: '' },
        reviewDecision: 'REVIEW_REQUIRED',
        ciStatus: 'SUCCESS',
        slaStatus: 'normal',
        labels: [],
        requestedReviewers: [{ login: 'alex', avatarUrl: 'https://github.com/alex.png' }],
      },
    ];

    render(
      <Header
        onRefresh={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenExport={vi.fn()}
        isLoading={false}
        rateLimit={null}
        lastFetched={null}
        prs={mockPRs}
        selectedReviewer="alex"
        onSelectReviewer={handleSelect}
      />
    );

    const workloadBtn = screen.getByRole('button', { name: /Team Workload/i });
    fireEvent.click(workloadBtn);

    const clearBtn = screen.getByRole('button', { name: /Clear Filter/i });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(handleSelect).toHaveBeenCalledWith(null);
  });
});

