import { describe, it, expect } from 'vitest';
import { generateMarkdownDigest, generateSlackDigest } from './exportDigest';
import { PullRequestItem } from '../types';

const samplePR1: PullRequestItem = {
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

const samplePR2: PullRequestItem = {
  id: 'PR_2',
  number: 202,
  title: 'feat: add dark mode theme',
  url: 'https://github.com/org/ui-kit/pull/202',
  repository: { nameWithOwner: 'org/ui-kit', url: 'https://github.com/org/ui-kit' },
  author: { login: 'alice', avatarUrl: '', url: '' },
  createdAt: '2026-08-30T09:00:00Z',
  updatedAt: '2026-08-30T14:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'feat/theme',
  totalCommentsCount: 7,
  participants: [],
  lastInteraction: {
    user: { login: 'bob', avatarUrl: '', url: '' },
    type: 'review',
    createdAt: '2026-08-30T14:00:00Z',
  },
  reviewDecision: 'APPROVED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [],
};

const samplePR3: PullRequestItem = {
  id: 'PR_3',
  number: 102,
  title: 'refactor: simplify database queries',
  url: 'https://github.com/org/repo/pull/102',
  repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  author: { login: 'eve', avatarUrl: '', url: '' },
  createdAt: '2026-08-30T11:00:00Z',
  updatedAt: '2026-08-30T15:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'refactor/db',
  totalCommentsCount: 0,
  participants: [],
  lastInteraction: {
    user: { login: 'eve', avatarUrl: '', url: '' },
    type: 'commit',
    createdAt: '2026-08-30T15:00:00Z',
  },
  reviewDecision: 'CHANGES_REQUESTED',
  ciStatus: 'FAILURE',
  slaStatus: 'warning',
  labels: [],
};

describe('exportDigest', () => {
  describe('generateMarkdownDigest', () => {
    it('returns "No open pull requests." when PR list is empty', () => {
      const result = generateMarkdownDigest([]);
      expect(result).toBe('No open pull requests.');
    });

    it('generates markdown digest correctly for a single PR', () => {
      const md = generateMarkdownDigest([samplePR1]);
      expect(md).toContain('## 📋 Pull Request Standup Digest');
      expect(md).toContain('### org/repo');
      expect(md).toContain('[#101 fix: auth token expiry check](https://github.com/org/repo/pull/101)');
      expect(md).toContain('@charlie');
      expect(md).toContain('⏳ Needs Review');
      expect(md).toContain('💬 3 comments');
      expect(md).toContain('last active: @dana');
    });

    it('shows ✅ Approved status for approved PRs in markdown digest', () => {
      const md = generateMarkdownDigest([samplePR2]);
      expect(md).toContain('✅ Approved');
      expect(md).toContain('### org/ui-kit');
      expect(md).toContain('[#202 feat: add dark mode theme](https://github.com/org/ui-kit/pull/202)');
      expect(md).toContain('@alice');
      expect(md).toContain('💬 7 comments');
      expect(md).toContain('last active: @bob');
    });

    it('groups multiple PRs by repository in markdown digest', () => {
      const md = generateMarkdownDigest([samplePR1, samplePR2, samplePR3]);
      expect(md).toContain('### org/repo');
      expect(md).toContain('### org/ui-kit');
      expect(md).toContain('#101 fix: auth token expiry check');
      expect(md).toContain('#102 refactor: simplify database queries');
      expect(md).toContain('#202 feat: add dark mode theme');
    });
    it('escapes brackets in PR titles for markdown links', () => {
      const prWithBrackets: PullRequestItem = {
        ...samplePR1,
        title: '[WIP] [HOTFIX] update login flow [urgent]',
      };
      const md = generateMarkdownDigest([prWithBrackets]);
      expect(md).toContain('\\[WIP\\] \\[HOTFIX\\] update login flow \\[urgent\\]');
    });
  });

  describe('generateSlackDigest', () => {
    it('returns "No open pull requests." when PR list is empty', () => {
      const result = generateSlackDigest([]);
      expect(result).toBe('No open pull requests.');
    });

    it('generates slack digest correctly for a single PR', () => {
      const slack = generateSlackDigest([samplePR1]);
      expect(slack).toContain('*📋 Pull Request Standup Digest');
      expect(slack).toContain('*org/repo*');
      expect(slack).toContain('<https://github.com/org/repo/pull/101|#101 fix: auth token expiry check>');
      expect(slack).toContain('by @charlie ⏳');
      expect(slack).toContain('💬 3 | Last: @dana');
    });

    it('shows ✅ status emoji for approved PRs in slack digest', () => {
      const slack = generateSlackDigest([samplePR2]);
      expect(slack).toContain('*org/ui-kit*');
      expect(slack).toContain('<https://github.com/org/ui-kit/pull/202|#202 feat: add dark mode theme>');
      expect(slack).toContain('by @alice ✅');
      expect(slack).toContain('💬 7 | Last: @bob');
    });

    it('escapes HTML entities (<, >, &) in PR titles for Slack links', () => {
      const prWithHtml: PullRequestItem = {
        ...samplePR1,
        title: 'fix: <User> & <Admin> permissions',
      };
      const slack = generateSlackDigest([prWithHtml]);
      expect(slack).toContain('&lt;User&gt; &amp; &lt;Admin&gt;');
    });

    it('groups multiple PRs by repository in slack digest', () => {
      const slack = generateSlackDigest([samplePR1, samplePR2, samplePR3]);
      expect(slack).toContain('*org/repo*');
      expect(slack).toContain('*org/ui-kit*');
      expect(slack).toContain('<https://github.com/org/repo/pull/101|#101 fix: auth token expiry check>');
      expect(slack).toContain('<https://github.com/org/repo/pull/102|#102 refactor: simplify database queries>');
      expect(slack).toContain('<https://github.com/org/ui-kit/pull/202|#202 feat: add dark mode theme>');
    });
  });
});
