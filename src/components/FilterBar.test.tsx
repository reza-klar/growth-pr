import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from './FilterBar';
import { FilterPreset, SortOption } from '../types';

describe('FilterBar', () => {
  const defaultCounts: Record<FilterPreset, number> = {
    all: 10,
    waiting_on_me: 3,
    authored_by_me: 2,
    needs_review: 5,
    ready_to_merge: 1,
  };

  it('renders quick filter buttons with counts and handles filter change', () => {
    const handleFilterChange = vi.fn();
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={handleFilterChange}
        searchQuery=""
        onSearchChange={vi.fn()}
        sortOption="created_desc"
        onSortChange={vi.fn()}
        selectedRepo="all"
        onRepoChange={vi.fn()}
        availableRepos={['org/repo-1', 'org/repo-2']}
        counts={defaultCounts}
      />
    );

    expect(screen.getByRole('button', { name: /All Open 10/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Waiting on Me 3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Needs Review 5/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ready to Merge 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authored by Me 2/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Waiting on Me 3/i }));
    expect(handleFilterChange).toHaveBeenCalledWith('waiting_on_me');
  });

  it('handles search input changes', () => {
    const handleSearchChange = vi.fn();
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={vi.fn()}
        searchQuery="feat"
        onSearchChange={handleSearchChange}
        sortOption="created_desc"
        onSortChange={vi.fn()}
        selectedRepo="all"
        onRepoChange={vi.fn()}
        availableRepos={['org/repo-1']}
        counts={defaultCounts}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Filter by title, author, branch, or label.../i);
    expect(searchInput).toHaveValue('feat');

    fireEvent.change(searchInput, { target: { value: 'fix' } });
    expect(handleSearchChange).toHaveBeenCalledWith('fix');
  });

  it('renders repository selector when multiple repositories are available and handles repo change', () => {
    const handleRepoChange = vi.fn();
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        sortOption="created_desc"
        onSortChange={vi.fn()}
        selectedRepo="org/repo-1"
        onRepoChange={handleRepoChange}
        availableRepos={['org/repo-1', 'org/repo-2']}
        counts={defaultCounts}
      />
    );

    const select = screen.getByDisplayValue('org/repo-1');
    expect(select).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'org/repo-2' } });
    expect(handleRepoChange).toHaveBeenCalledWith('org/repo-2');
  });

  it('hides repository dropdown when only one repository or none is available', () => {
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        sortOption="created_desc"
        onSortChange={vi.fn()}
        selectedRepo="all"
        onRepoChange={vi.fn()}
        availableRepos={['org/repo-1']}
        counts={defaultCounts}
      />
    );

    expect(screen.queryByText(/All Repositories/i)).not.toBeInTheDocument();
  });

  it('handles sort option changes', () => {
    const handleSortChange = vi.fn();
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        sortOption="created_desc"
        onSortChange={handleSortChange}
        selectedRepo="all"
        onRepoChange={vi.fn()}
        availableRepos={['org/repo-1']}
        counts={defaultCounts}
      />
    );

    const sortSelect = screen.getByDisplayValue('Newest Created');
    expect(sortSelect).toBeInTheDocument();

    fireEvent.change(sortSelect, { target: { value: 'comments_desc' as SortOption } });
    expect(handleSortChange).toHaveBeenCalledWith('comments_desc');
  });
});
