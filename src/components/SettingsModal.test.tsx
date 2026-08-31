import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from './SettingsModal';
import { RepoInput } from './RepoInput';
import { DEFAULT_SETTINGS } from '../services/storage';
import * as githubService from '../services/github';

vi.mock('../services/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/github')>();
  return {
    ...actual,
    verifyToken: vi.fn(),
  };
});

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SettingsModal
        isOpen={false}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onSave={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders settings dialog with token input and repository list when isOpen is true', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, repositories: ['my-org/core-repo'] }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/Settings & Authentication/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ghp_ or github_pat_/i)).toBeInTheDocument();
    expect(screen.getByText('my-org/core-repo')).toBeInTheDocument();
  });

  it('calls onSave and onClose when save button is clicked with modified values', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        settings={DEFAULT_SETTINGS}
        onSave={handleSave}
      />
    );

    const tokenInput = screen.getByPlaceholderText(/ghp_ or github_pat_/i);
    fireEvent.change(tokenInput, { target: { value: 'ghp_secrettoken123' } });

    const sessionRadio = screen.getByLabelText(/Session Only/i);
    fireEvent.click(sessionRadio);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '300' } });

    const saveBtn = screen.getByRole('button', { name: /Save & Apply/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      token: 'ghp_secrettoken123',
      storageType: 'session',
      repositories: [],
      autoRefreshIntervalSeconds: 300,
    });
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel button or close X button is clicked', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        settings={DEFAULT_SETTINGS}
        onSave={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        settings={DEFAULT_SETTINGS}
        onSave={vi.fn()}
      />
    );

    const closeBtn = screen.getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('verifies token successfully and displays user login', async () => {
    vi.mocked(githubService.verifyToken).mockResolvedValueOnce({
      login: 'octocat',
      name: 'The Octocat',
    });

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, token: 'ghp_validtoken' }}
        onSave={vi.fn()}
      />
    );

    const testBtn = screen.getByRole('button', { name: /Test/i });
    fireEvent.click(testBtn);

    expect(githubService.verifyToken).toHaveBeenCalledWith('ghp_validtoken');
    await waitFor(() => {
      expect(screen.getByText(/Valid token for user/i)).toBeInTheDocument();
      expect(screen.getByText('@octocat')).toBeInTheDocument();
    });
  });

  it('handles token verification failure and displays error message', async () => {
    vi.mocked(githubService.verifyToken).mockRejectedValueOnce(new Error('Bad credentials'));

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, token: 'ghp_invalidtoken' }}
        onSave={vi.fn()}
      />
    );

    const testBtn = screen.getByRole('button', { name: /Test/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/Bad credentials/i)).toBeInTheDocument();
    });
  });

  it('shows error if testing token with empty input', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, token: '' }}
        onSave={vi.fn()}
      />
    );

    const tokenInput = screen.getByPlaceholderText(/ghp_ or github_pat_/i);
    fireEvent.change(tokenInput, { target: { value: '   ' } });
    const testBtn = screen.getByRole('button', { name: /Test/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a token first/i)).toBeInTheDocument();
    });
  });
});

describe('RepoInput', () => {
  it('renders empty message when no repositories are provided', () => {
    render(<RepoInput repositories={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/No repositories added yet/i)).toBeInTheDocument();
  });

  it('adds a valid repository when clicking Add button or pressing Enter', () => {
    const handleChange = vi.fn();
    render(<RepoInput repositories={['owner/repo-a']} onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/e\.g\. company-org\/frontend-app/i);
    fireEvent.change(input, { target: { value: 'owner/repo-b' } });

    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addBtn);

    expect(handleChange).toHaveBeenCalledWith(['owner/repo-a', 'owner/repo-b']);
  });

  it('adds a valid repository on Enter key', () => {
    const handleChange = vi.fn();
    render(<RepoInput repositories={[]} onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/e\.g\. company-org\/frontend-app/i);
    fireEvent.change(input, { target: { value: 'facebook/react' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith(['facebook/react']);
  });

  it('shows error when format is invalid (not owner/repo)', () => {
    const handleChange = vi.fn();
    render(<RepoInput repositories={[]} onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/e\.g\. company-org\/frontend-app/i);
    fireEvent.change(input, { target: { value: 'invalid-format' } });

    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/Repository must be in "owner\/repo" format/i)).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('shows error when repository is already added', () => {
    const handleChange = vi.fn();
    render(<RepoInput repositories={['facebook/react']} onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/e\.g\. company-org\/frontend-app/i);
    fireEvent.change(input, { target: { value: 'facebook/react' } });

    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/Repository already added/i)).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('removes repository when clicking remove button on chip', () => {
    const handleChange = vi.fn();
    render(<RepoInput repositories={['owner/repo-a', 'owner/repo-b']} onChange={handleChange} />);

    const removeButtons = screen.getAllByRole('button').filter(btn => btn.textContent !== ' Add');
    fireEvent.click(removeButtons[0]);

    expect(handleChange).toHaveBeenCalledWith(['owner/repo-b']);
  });
});
