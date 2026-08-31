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
});
