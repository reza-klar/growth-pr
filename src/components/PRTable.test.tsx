import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PRTable } from './PRTable';
import { PullRequestItem } from '../types';

const mockPR: PullRequestItem = {
  id: 'PR_1',
  number: 42,
  title: 'feat: add user analytics tracking',
  url: 'https://github.com/org/repo/pull/42',
  repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  author: { login: 'alice', avatarUrl: 'https://github.com/alice.png', url: 'https://github.com/alice' },
  createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  updatedAt: new Date().toISOString(),
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'feat/analytics',
  totalCommentsCount: 7,
  participants: [
    { login: 'alice', avatarUrl: 'https://github.com/alice.png', url: 'https://github.com/alice' },
    { login: 'bob', avatarUrl: 'https://github.com/bob.png', url: 'https://github.com/bob' },
  ],
  lastInteraction: {
    user: { login: 'bob', avatarUrl: 'https://github.com/bob.png', url: 'https://github.com/bob' },
    type: 'comment',
    createdAt: new Date(Date.now() - 60000 * 15).toISOString(),
    snippet: 'Looks great! One minor question.',
  },
  reviewDecision: 'APPROVED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [{ name: 'enhancement', color: 'a2eeef' }],
};

describe('PRTable', () => {
  it('renders table headers and PR data accurately', () => {
    render(<PRTable prs={[mockPR]} isLoading={false} />);

    expect(screen.getByText(/feat: add user analytics tracking/i)).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('org/repo')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // comment count
    expect(screen.getByText('feat/analytics')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('enhancement')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true and prs is empty', () => {
    render(<PRTable prs={[]} isLoading={true} />);
    expect(screen.getByText(/Fetching Pull Requests.../i)).toBeInTheDocument();
  });

  it('renders table when isLoading is true but prs are already loaded', () => {
    render(<PRTable prs={[mockPR]} isLoading={true} />);
    expect(screen.getByText(/feat: add user analytics tracking/i)).toBeInTheDocument();
    expect(screen.queryByText(/Fetching Pull Requests.../i)).not.toBeInTheDocument();
  });

  it('renders empty state when no PRs match and not loading', () => {
    render(<PRTable prs={[]} isLoading={false} />);
    expect(screen.getByText(/No Pull Requests found/i)).toBeInTheDocument();
  });

  it('renders participant overflow badge when there are more than 5 participants', () => {
    const prWithManyParticipants: PullRequestItem = {
      ...mockPR,
      participants: [
        { login: 'p1', avatarUrl: 'https://github.com/p1.png', url: 'https://github.com/p1' },
        { login: 'p2', avatarUrl: 'https://github.com/p2.png', url: 'https://github.com/p2' },
        { login: 'p3', avatarUrl: 'https://github.com/p3.png', url: 'https://github.com/p3' },
        { login: 'p4', avatarUrl: 'https://github.com/p4.png', url: 'https://github.com/p4' },
        { login: 'p5', avatarUrl: 'https://github.com/p5.png', url: 'https://github.com/p5' },
        { login: 'p6', avatarUrl: 'https://github.com/p6.png', url: 'https://github.com/p6' },
        { login: 'p7', avatarUrl: 'https://github.com/p7.png', url: 'https://github.com/p7' },
      ],
    };
    render(<PRTable prs={[prWithManyParticipants]} isLoading={false} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders SLA warning and stale badges', () => {
    const warningPR: PullRequestItem = {
      ...mockPR,
      id: 'PR_2',
      slaStatus: 'warning',
    };
    const stalePR: PullRequestItem = {
      ...mockPR,
      id: 'PR_3',
      slaStatus: 'stale',
    };
    render(<PRTable prs={[warningPR, stalePR]} isLoading={false} />);
    expect(screen.getByText(/> 24h idle/i)).toBeInTheDocument();
    expect(screen.getByText(/Stale > 48h/i)).toBeInTheDocument();
  });
});
