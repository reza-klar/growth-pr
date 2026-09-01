import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyToken,
  fetchRepoPRs,
  buildBatchedGraphQLQuery,
  transformGraphQLPR,
} from './github';

describe('github api service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildBatchedGraphQLQuery', () => {
    it('creates valid aliased query for multiple repos', () => {
      const query = buildBatchedGraphQLQuery(['ownerA/repo1', 'ownerB/repo2']);
      expect(query).toContain('repo_0: repository(owner: "ownerA", name: "repo1")');
      expect(query).toContain('repo_1: repository(owner: "ownerB", name: "repo2")');
      expect(query).toContain('rateLimit');
      expect(query).toContain('viewer');
    });

    it('ignores invalid repository names', () => {
      const query = buildBatchedGraphQLQuery(['invalid-format', '   ', 'owner/repo']);
      expect(query).not.toContain('repo_0: repository(owner: "invalid-format"');
      expect(query).toContain('repo_2: repository(owner: "owner", name: "repo")');
    });
  });

  describe('verifyToken', () => {
    it('returns user profile on valid response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            viewer: {
              login: 'octocat',
              name: 'Mona Lisa Octocat',
            },
          },
        }),
      });

      const user = await verifyToken('ghp_valid_token');
      expect(user.login).toBe('octocat');
      expect(user.name).toBe('Mona Lisa Octocat');
      expect(globalThis.fetch).toHaveBeenCalledWith('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ghp_valid_token',
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('viewer'),
      });
    });

    it('throws descriptive error on invalid token HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Bad credentials' }),
      });

      await expect(verifyToken('invalid')).rejects.toThrow('Bad credentials');
    });

    it('throws fallback error when HTTP error json parsing fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('JSON error');
        },
      });

      await expect(verifyToken('invalid')).rejects.toThrow('HTTP error 500: Internal Server Error');
    });

    it('throws error when GraphQL response returns errors array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Your token does not have permission' }],
        }),
      });

      await expect(verifyToken('token')).rejects.toThrow('Your token does not have permission');
    });
  });

  describe('fetchRepoPRs', () => {
    it('trims whitespace and newlines from token and repository names', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            viewer: { login: 'octocat' },
            rateLimit: { limit: 5000, remaining: 4900, resetAt: '2026-08-31T00:00:00Z', used: 100 },
          },
        }),
      });

      await fetchRepoPRs('  ghp_token_with_spaces \n', ['  owner/repo1  ']);
      expect(globalThis.fetch).toHaveBeenCalledWith('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ghp_token_with_spaces',
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      });
    });

    it('chunks large repository lists into groups of 4', async () => {
      const twentyRepos = Array.from({ length: 20 }, (_, i) => `org/repo-${i}`);
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            viewer: { login: 'octocat' },
            rateLimit: { limit: 5000, remaining: 4900, resetAt: '2026-08-31T00:00:00Z', used: 100 },
          },
        }),
      });

      await fetchRepoPRs('token', twentyRepos);
      // 20 repos chunked by 4 -> 5 calls
      expect(globalThis.fetch).toHaveBeenCalledTimes(5);
    });

    it('gracefully continues and warns when response contains partial GraphQL errors', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Could not resolve to a Repository with the name non-existent' }],
          data: {
            viewer: { login: 'octocat' },
            rateLimit: { limit: 5000, remaining: 4900, resetAt: '2026-08-31T00:00:00Z', used: 100 },
            repo_0: {
              nameWithOwner: 'owner/valid-repo',
              url: 'https://github.com/owner/valid-repo',
              pullRequests: {
                nodes: [
                  {
                    id: 'PR_1',
                    number: 1,
                    title: 'test',
                    url: 'https://github.com/owner/valid-repo/pull/1',
                    author: { login: 'alice' },
                    createdAt: '2026-08-31T00:00:00Z',
                    updatedAt: '2026-08-31T00:00:00Z',
                  },
                ],
              },
            },
          },
        }),
      });

      const result = await fetchRepoPRs('token', ['owner/valid-repo', 'owner/non-existent']);
      expect(result.prs.length).toBe(1);
      expect(result.prs[0].repository.nameWithOwner).toBe('owner/valid-repo');
      expect(warnSpy).toHaveBeenCalledWith(
        'GraphQL partial error encountered for chunk:',
        expect.any(Array)
      );
    });

    it('fetches PRs for repos and transforms payload with rate limit', async () => {
      const mockPayload = {
        data: {
          viewer: { login: 'current-user' },
          rateLimit: { limit: 5000, remaining: 4990, resetAt: '2026-09-01T00:00:00Z', used: 10 },
          repo_0: {
            nameWithOwner: 'ownerA/repo1',
            url: 'https://github.com/ownerA/repo1',
            pullRequests: {
              nodes: [
                {
                  id: 'pr_1',
                  number: 101,
                  title: 'Fix issue',
                  url: 'https://github.com/ownerA/repo1/pull/101',
                  isDraft: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  baseRefName: 'main',
                  headRefName: 'fix-1',
                  author: { login: 'alice', avatarUrl: 'https://github.com/alice.png', url: 'https://github.com/alice' },
                  reviewDecision: 'APPROVED',
                  reviewRequests: { nodes: [] },
                  labels: { nodes: [{ name: 'bug', color: 'd73a4a' }] },
                  comments: { totalCount: 2 },
                  reviews: { totalCount: 1 },
                  participants: { nodes: [{ login: 'alice' }] },
                  timelineItems: { nodes: [] },
                  commits: { nodes: [{ commit: { statusCheckRollup: { state: 'SUCCESS' } } }] },
                },
              ],
            },
          },
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPayload,
      });

      const result = await fetchRepoPRs('token', ['ownerA/repo1']);
      expect(result.rateLimit.remaining).toBe(4990);
      expect(result.prs).toHaveLength(1);
      expect(result.prs[0].number).toBe(101);
      expect(result.prs[0].repository.nameWithOwner).toBe('ownerA/repo1');
      expect(result.prs[0].totalCommentsCount).toBe(3);
      expect(result.prs[0].reviewDecision).toBe('APPROVED');
      expect(result.prs[0].ciStatus).toBe('SUCCESS');
    });

    it('collects warnings when fetch response is not ok without throwing uncaught rejection', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'API rate limit exceeded' }),
      });

      const result = await fetchRepoPRs('token', ['ownerA/repo1']);
      expect(result.prs).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('API rate limit exceeded');
    });
  });

  describe('transformGraphQLPR', () => {
    it('sets reviewDecision to DRAFT when isDraft is true', () => {
      const pr = transformGraphQLPR({
        id: '1',
        number: 1,
        title: 'Draft PR',
        isDraft: true,
        reviewDecision: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: { login: 'alice' },
        repository: { nameWithOwner: 'owner/repo', url: 'https://github.com/owner/repo' },
      });
      expect(pr.reviewDecision).toBe('DRAFT');
      expect(pr.isDraft).toBe(true);
    });

    it('maps review decisions accurately', () => {
      const prApproved = transformGraphQLPR({
        id: '1',
        number: 1,
        reviewDecision: 'APPROVED',
        createdAt: new Date().toISOString(),
      });
      expect(prApproved.reviewDecision).toBe('APPROVED');

      const prChangesReq = transformGraphQLPR({
        id: '2',
        number: 2,
        reviewDecision: 'CHANGES_REQUESTED',
        createdAt: new Date().toISOString(),
      });
      expect(prChangesReq.reviewDecision).toBe('CHANGES_REQUESTED');

      const prOther = transformGraphQLPR({
        id: '3',
        number: 3,
        reviewDecision: null,
        createdAt: new Date().toISOString(),
      });
      expect(prOther.reviewDecision).toBe('REVIEW_REQUIRED');
    });

    it('maps CI statuses properly', () => {
      const successPR = transformGraphQLPR({
        commits: { nodes: [{ commit: { statusCheckRollup: { state: 'SUCCESS' } } }] },
      });
      expect(successPR.ciStatus).toBe('SUCCESS');

      const failurePR = transformGraphQLPR({
        commits: { nodes: [{ commit: { statusCheckRollup: { state: 'FAILURE' } } }] },
      });
      expect(failurePR.ciStatus).toBe('FAILURE');

      const errorPR = transformGraphQLPR({
        commits: { nodes: [{ commit: { statusCheckRollup: { state: 'ERROR' } } }] },
      });
      expect(errorPR.ciStatus).toBe('FAILURE');

      const pendingPR = transformGraphQLPR({
        commits: { nodes: [{ commit: { statusCheckRollup: { state: 'PENDING' } } }] },
      });
      expect(pendingPR.ciStatus).toBe('PENDING');

      const expectedPR = transformGraphQLPR({
        commits: { nodes: [{ commit: { statusCheckRollup: { state: 'EXPECTED' } } }] },
      });
      expect(expectedPR.ciStatus).toBe('PENDING');

      const neutralPR = transformGraphQLPR({
        commits: { nodes: [] },
      });
      expect(neutralPR.ciStatus).toBe('NEUTRAL');
    });

    it('extracts the most recent interaction from timelineItems', () => {
      const node = {
        author: { login: 'author1' },
        createdAt: '2026-08-30T10:00:00Z',
        timelineItems: {
          nodes: [
            {
              __typename: 'PullRequestCommit',
              commit: {
                committedDate: '2026-08-30T11:00:00Z',
                author: { user: { login: 'committer', avatarUrl: 'committer.png', url: 'committer_url' } },
                message: 'initial commit',
              },
            },
            {
              __typename: 'PullRequestReview',
              createdAt: '2026-08-30T12:00:00Z',
              author: { login: 'reviewer1', avatarUrl: 'rev1.png', url: 'rev1_url' },
              bodyText: 'Please change this line and add comments for clarity in the implementation.',
              state: 'CHANGES_REQUESTED',
            },
            {
              __typename: 'IssueComment',
              createdAt: '2026-08-30T13:00:00Z',
              author: { login: 'commenter1', avatarUrl: 'com1.png', url: 'com1_url' },
              bodyText: 'I have updated the code as requested. Ready for re-review!',
            },
          ],
        },
      };

      const pr = transformGraphQLPR(node);
      expect(pr.lastInteraction.type).toBe('comment');
      expect(pr.lastInteraction.user.login).toBe('commenter1');
      expect(pr.lastInteraction.snippet).toBe('I have updated the code as requested. Ready for re-review!');
      expect(pr.lastInteraction.createdAt).toBe('2026-08-30T13:00:00Z');
    });

    it('calculates SLA status correctly based on time elapsed', () => {
      const now = Date.now();
      const recentDate = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const warningDate = new Date(now - 30 * 60 * 60 * 1000).toISOString(); // 30 hours ago
      const staleDate = new Date(now - 60 * 60 * 60 * 1000).toISOString(); // 60 hours ago

      const normalPR = transformGraphQLPR({
        createdAt: recentDate,
        updatedAt: recentDate,
      });
      expect(normalPR.slaStatus).toBe('normal');

      const warningPR = transformGraphQLPR({
        createdAt: warningDate,
        updatedAt: warningDate,
      });
      expect(warningPR.slaStatus).toBe('warning');

      const stalePR = transformGraphQLPR({
        createdAt: staleDate,
        updatedAt: staleDate,
      });
      expect(stalePR.slaStatus).toBe('stale');
    });

    it('determines isWaitingOnMe and isAuthoredByMe correctly', () => {
      const node = {
        author: { login: 'reza' },
        reviewRequests: {
          nodes: [
            { requestedReviewer: { login: 'reviewer-user' } },
          ],
        },
      };

      const prForAuthor = transformGraphQLPR(node, 'reza');
      expect(prForAuthor.isAuthoredByMe).toBe(true);
      expect(prForAuthor.isWaitingOnMe).toBe(false);

      const prForReviewer = transformGraphQLPR(node, 'reviewer-user');
      expect(prForReviewer.isAuthoredByMe).toBe(false);
      expect(prForReviewer.isWaitingOnMe).toBe(true);

      const prForOther = transformGraphQLPR(node, 'other-user');
      expect(prForOther.isAuthoredByMe).toBe(false);
      expect(prForOther.isWaitingOnMe).toBe(false);
    });
  });
});
