import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamWorkloadPopover } from './TeamWorkloadPopover';
import { PullRequestItem } from '../types';

const basePR: PullRequestItem = {
  id: 'PR_1',
  number: 1,
  title: 'Test PR',
  url: 'https://github.com/org/repo/pull/1',
  repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  author: { login: 'dev', avatarUrl: 'https://github.com/dev.png', url: 'https://github.com/dev' },
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T12:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'feat/test',
  totalCommentsCount: 0,
  participants: [],
  lastInteraction: {
    user: { login: 'dev', avatarUrl: '', url: '' },
    type: 'commit',
    createdAt: '2026-09-01T10:00:00Z',
  },
  reviewDecision: 'REVIEW_REQUIRED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [],
};

const mockPRs: any[] = [
  {
    ...basePR,
    id: 'PR_1',
    number: 1,
    requestedReviewers: [
      { login: 'alex', avatarUrl: 'https://github.com/alex.png' },
      { login: 'bob', avatarUrl: 'https://github.com/bob.png' },
    ],
  },
  {
    ...basePR,
    id: 'PR_2',
    number: 2,
    requestedReviewers: [
      { login: 'alex', avatarUrl: 'https://github.com/alex.png' },
    ],
  },
  {
    ...basePR,
    id: 'PR_3',
    number: 3,
    requestedReviewers: [
      { login: 'charlie', avatarUrl: 'https://github.com/charlie.png' },
    ],
  },
];

describe('TeamWorkloadPopover', () => {
  it('aggregates requested reviewers and invokes onSelectReviewer on click', () => {
    const handleSelect = vi.fn();
    render(
      <TeamWorkloadPopover
        prs={mockPRs}
        selectedReviewer={null}
        onSelectReviewer={handleSelect}
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /Team Workload/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(screen.getByText(/4 pending/i)).toBeInTheDocument();

    fireEvent.click(triggerBtn);
    expect(screen.getByText('@alex')).toBeInTheDocument();
    expect(screen.getByText('2 pending')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('@charlie')).toBeInTheDocument();

    fireEvent.click(screen.getByText('@alex'));
    expect(handleSelect).toHaveBeenCalledWith('alex');
  });

  it('sorts teammates descending by pending review count', () => {
    render(
      <TeamWorkloadPopover
        prs={mockPRs}
        selectedReviewer={null}
        onSelectReviewer={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Team Workload/i }));

    const teammateElements = screen.getAllByText(/@(alex|bob|charlie)/);
    expect(teammateElements[0]).toHaveTextContent('@alex'); // 2 pending
  });

  it('renders empty state when there are no requested reviewers', () => {
    render(
      <TeamWorkloadPopover
        prs={[]}
        selectedReviewer={null}
        onSelectReviewer={vi.fn()}
      />
    );

    expect(screen.getByText(/0 pending/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Team Workload/i }));
    expect(screen.getByText(/All caught up!/i)).toBeInTheDocument();
    expect(screen.getByText(/No pending review requests/i)).toBeInTheDocument();
  });

  it('shows active reviewer and allows clearing filter', () => {
    const handleSelect = vi.fn();
    render(
      <TeamWorkloadPopover
        prs={mockPRs}
        selectedReviewer="alex"
        onSelectReviewer={handleSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Team Workload/i }));

    const clearBtn = screen.getByRole('button', { name: /Clear Filter/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it('closes popover on Escape key press', () => {
    render(
      <TeamWorkloadPopover
        prs={mockPRs}
        selectedReviewer={null}
        onSelectReviewer={vi.fn()}
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /Team Workload/i });
    fireEvent.click(triggerBtn);
    expect(screen.getByText('@alex')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles string array representation of requestedReviewers', () => {
    const stringPRs: any[] = [
      {
        ...basePR,
        id: 'PR_10',
        requestedReviewers: ['dan'],
      },
    ];

    render(
      <TeamWorkloadPopover
        prs={stringPRs}
        selectedReviewer={null}
        onSelectReviewer={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Team Workload/i }));
    expect(screen.getByText('@dan')).toBeInTheDocument();
    expect(screen.getAllByText('1 pending').length).toBeGreaterThanOrEqual(1);
  });
});
