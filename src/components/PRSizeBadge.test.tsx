import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PRSizeBadge } from './PRSizeBadge';

describe('PRSizeBadge', () => {
  it('renders size label and diff numbers', () => {
    render(<PRSizeBadge additions={45} deletions={12} sizeCategory="S" />);
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('+45 / -12')).toBeInTheDocument();
  });

  it('renders correctly for XS category with emerald styling', () => {
    render(<PRSizeBadge additions={10} deletions={5} sizeCategory="XS" />);
    const badge = screen.getByText('XS').closest('span[title]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-emerald-300');
    expect(screen.getByText('+10 / -5')).toBeInTheDocument();
  });

  it('renders correctly for M category with sky styling', () => {
    render(<PRSizeBadge additions={150} deletions={20} sizeCategory="M" />);
    const badge = screen.getByText('M').closest('span[title]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-sky-300');
    expect(screen.getByText('+150 / -20')).toBeInTheDocument();
  });

  it('renders correctly for L category with amber styling', () => {
    render(<PRSizeBadge additions={500} deletions={80} sizeCategory="L" />);
    const badge = screen.getByText('L').closest('span[title]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-amber-300');
    expect(screen.getByText('+500 / -80')).toBeInTheDocument();
  });

  it('renders correctly for XL category with rose styling', () => {
    render(<PRSizeBadge additions={1200} deletions={300} sizeCategory="XL" />);
    const badge = screen.getByText('XL').closest('span[title]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-rose-300');
    expect(screen.getByText('+1200 / -300')).toBeInTheDocument();
  });

  it('returns null when sizeCategory is undefined', () => {
    const { container } = render(<PRSizeBadge additions={10} deletions={5} />);
    expect(container.firstChild).toBeNull();
  });

  it('defaults additions and deletions to 0 when omitted', () => {
    render(<PRSizeBadge sizeCategory="XS" />);
    expect(screen.getByText('+0 / -0')).toBeInTheDocument();
  });

  it('provides a detailed tooltip title', () => {
    render(<PRSizeBadge additions={45} deletions={12} sizeCategory="S" />);
    expect(screen.getByTitle('Size: S (+45 / -12 lines across files)')).toBeInTheDocument();
  });
});

describe('PRRow integration with PRSizeBadge', () => {
  const mockPR = {
    id: 'PR_1',
    number: 42,
    title: 'feat: add user analytics tracking',
    url: 'https://github.com/org/repo/pull/42',
    repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
    author: { login: 'alice', avatarUrl: 'https://github.com/alice.png', url: 'https://github.com/alice' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDraft: false,
    baseRefName: 'main',
    headRefName: 'feat/analytics',
    totalCommentsCount: 7,
    participants: [],
    lastInteraction: {
      user: { login: 'bob', avatarUrl: 'https://github.com/bob.png', url: 'https://github.com/bob' },
      type: 'comment' as const,
      createdAt: new Date().toISOString(),
    },
    reviewDecision: 'APPROVED' as const,
    ciStatus: 'SUCCESS' as const,
    slaStatus: 'normal' as const,
    labels: [],
  };

  it('renders size badge in PRRow when sizeCategory is present', async () => {
    const { PRRow } = await import('./PRRow');
    render(
      <table>
        <tbody>
          <PRRow
            pr={{
              ...mockPR,
              additions: 120,
              deletions: 35,
              sizeCategory: 'M',
            }}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('+120 / -35')).toBeInTheDocument();
  });

  it('renders without error when sizeCategory is not present in PRRow', async () => {
    const { PRRow } = await import('./PRRow');
    render(
      <table>
        <tbody>
          <PRRow pr={mockPR} />
        </tbody>
      </table>
    );
    expect(screen.getByText('feat: add user analytics tracking')).toBeInTheDocument();
    expect(screen.queryByText('+0 / -0')).not.toBeInTheDocument();
  });
});

