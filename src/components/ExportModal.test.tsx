import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportModal } from './ExportModal';
import { PullRequestItem } from '../types';

const samplePR: PullRequestItem = {
  id: 'PR_1',
  number: 101,
  title: 'fix: auth token expiry check',
  url: 'https://github.com/org/repo/pull/101',
  repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  author: { login: 'charlie', avatarUrl: '', url: '' },
  createdAt: '2026-08-30T10:00:00Z',
  updatedAt: '2026-08-30T12:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'fix/auth',
  totalCommentsCount: 3,
  participants: [],
  lastInteraction: {
    user: { login: 'dana', avatarUrl: '', url: '' },
    type: 'comment',
    createdAt: '2026-08-30T12:00:00Z',
  },
  reviewDecision: 'REVIEW_REQUIRED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [],
};

describe('ExportModal', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ExportModal isOpen={false} onClose={vi.fn()} prs={[samplePR]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with header, format buttons, copy button, and textarea when isOpen is true', () => {
    render(
      <ExportModal isOpen={true} onClose={vi.fn()} prs={[samplePR]} />
    );

    expect(screen.getByText('Export Standup Digest')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Markdown/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Slack Text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Digest/i })).toBeInTheDocument();

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toContain('## 📋 Pull Request Standup Digest');
    expect(textarea.value).toContain('### org/repo');
    expect(textarea.value).toContain('[#101 fix: auth token expiry check](https://github.com/org/repo/pull/101)');
  });

  it('switches between Markdown and Slack formats when toggled', () => {
    render(
      <ExportModal isOpen={true} onClose={vi.fn()} prs={[samplePR]} />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('### org/repo');

    const slackButton = screen.getByRole('button', { name: /Slack Text/i });
    fireEvent.click(slackButton);

    expect(textarea.value).toContain('*org/repo*');
    expect(textarea.value).toContain('<https://github.com/org/repo/pull/101|#101 fix: auth token expiry check>');

    const mdButton = screen.getByRole('button', { name: /Markdown/i });
    fireEvent.click(mdButton);

    expect(textarea.value).toContain('### org/repo');
    expect(textarea.value).toContain('[#101 fix: auth token expiry check](https://github.com/org/repo/pull/101)');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ExportModal isOpen={true} onClose={handleClose} prs={[samplePR]} />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('copies content to clipboard and shows temporary copied state', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(
      <ExportModal isOpen={true} onClose={vi.fn()} prs={[samplePR]} />
    );

    const copyButton = screen.getByRole('button', { name: /Copy Digest/i });
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0][0]).toContain('## 📋 Pull Request Standup Digest');
    expect(writeTextMock.mock.calls[0][0]).toContain('### org/repo');

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('handles clipboard failure gracefully without crashing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(
      <ExportModal isOpen={true} onClose={vi.fn()} prs={[samplePR]} />
    );

    const copyButton = screen.getByRole('button', { name: /Copy Digest/i });
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy to clipboard', expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
  });

  it('renders fallback when PR list is empty', () => {
    render(
      <ExportModal isOpen={true} onClose={vi.fn()} prs={[]} />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('No open pull requests.');
  });

  it('closes modal on Escape key press', () => {
    const handleClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={handleClose} prs={[]} />);
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal on backdrop click', () => {
    const handleClose = vi.fn();
    const { container } = render(<ExportModal isOpen={true} onClose={handleClose} prs={[]} />);
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
