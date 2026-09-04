import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  detectPRChanges,
  sendBrowserNotification,
  requestNotificationPermission,
  getNotificationPermission,
  NotificationEvent,
} from './notifications';
import { useNotificationWatcher } from '../hooks/useNotificationWatcher';
import { PullRequestItem, NotificationSettings } from '../types';

const defaultSettings: NotificationSettings = {
  enabled: true,
  notifyReviewRequests: true,
  notifyCIFailures: true,
  notifyComments: true,
  notifyStalePRs: true,
};

const samplePR: PullRequestItem = {
  id: 'PR_1',
  number: 101,
  title: 'Add authentication feature',
  url: 'https://github.com/acme/repo/pull/101',
  repository: {
    nameWithOwner: 'acme/repo',
    url: 'https://github.com/acme/repo',
  },
  author: {
    login: 'alice',
    avatarUrl: 'https://github.com/alice.png',
    url: 'https://github.com/alice',
  },
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T12:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'feat/auth',
  totalCommentsCount: 2,
  participants: [],
  lastInteraction: {
    user: { login: 'bob', avatarUrl: 'https://github.com/bob.png', url: 'https://github.com/bob' },
    type: 'comment',
    createdAt: '2026-09-01T12:00:00Z',
    snippet: 'Looks great so far!',
  },
  reviewDecision: 'REVIEW_REQUIRED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [],
  isWaitingOnMe: false,
  isAuthoredByMe: false,
};

describe('detectPRChanges', () => {
  describe('Review Requests (notifyReviewRequests)', () => {
    it('detects when a review is newly requested on current user', () => {
      const prev = [{ ...samplePR, isWaitingOnMe: false }];
      const curr = [{ ...samplePR, isWaitingOnMe: true }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events).toContainEqual(
        expect.objectContaining({
          type: 'review_requested',
          url: samplePR.url,
          pr: expect.objectContaining({ id: 'PR_1' }),
        })
      );
      expect(events[0].title).toMatch(/review requested/i);
    });

    it('detects when a newly added PR has review requested on current user', () => {
      const existingPR: PullRequestItem = { ...samplePR, id: 'PR_0', number: 100 };
      const newPR: PullRequestItem = { ...samplePR, id: 'PR_2', number: 102, isWaitingOnMe: true };
      const prev = [existingPR];
      const curr = [existingPR, newPR];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events).toContainEqual(
        expect.objectContaining({
          type: 'review_requested',
          pr: expect.objectContaining({ id: 'PR_2' }),
        })
      );
    });

    it('does not detect review request if review was already requested in previous snapshot', () => {
      const prev = [{ ...samplePR, isWaitingOnMe: true }];
      const curr = [{ ...samplePR, isWaitingOnMe: true }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events.filter((e) => e.type === 'review_requested')).toHaveLength(0);
    });

    it('does not detect review request if isWaitingOnMe transitioned to false', () => {
      const prev = [{ ...samplePR, isWaitingOnMe: true }];
      const curr = [{ ...samplePR, isWaitingOnMe: false }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events.filter((e) => e.type === 'review_requested')).toHaveLength(0);
    });

    it('does not detect review request if notifyReviewRequests is false', () => {
      const prev = [{ ...samplePR, isWaitingOnMe: false }];
      const curr = [{ ...samplePR, isWaitingOnMe: true }];
      const events = detectPRChanges(
        prev,
        curr,
        { ...defaultSettings, notifyReviewRequests: false },
        'myuser'
      );

      expect(events.filter((e) => e.type === 'review_requested')).toHaveLength(0);
    });
  });

  describe('CI Failures (notifyCIFailures)', () => {
    it('detects when CI status transitions to FAILURE on PR authored by current user', () => {
      const prev = [{ ...samplePR, isAuthoredByMe: true, ciStatus: 'PENDING' as const }];
      const curr = [{ ...samplePR, isAuthoredByMe: true, ciStatus: 'FAILURE' as const }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'alice');

      expect(events).toContainEqual(
        expect.objectContaining({
          type: 'ci_failure',
          url: samplePR.url,
        })
      );
      expect(events[0].title).toMatch(/ci/i);
    });

    it('detects CI failure when author matches currentLogin even if isAuthoredByMe flag is false', () => {
      const prev = [{ ...samplePR, author: { ...samplePR.author, login: 'myuser' }, isAuthoredByMe: false, ciStatus: 'SUCCESS' as const }];
      const curr = [{ ...samplePR, author: { ...samplePR.author, login: 'myuser' }, isAuthoredByMe: false, ciStatus: 'FAILURE' as const }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events).toContainEqual(
        expect.objectContaining({
          type: 'ci_failure',
        })
      );
    });

    it('does not detect CI failure if PR is not authored by current user', () => {
      const prev = [{ ...samplePR, author: { ...samplePR.author, login: 'bob' }, isAuthoredByMe: false, ciStatus: 'SUCCESS' as const }];
      const curr = [{ ...samplePR, author: { ...samplePR.author, login: 'bob' }, isAuthoredByMe: false, ciStatus: 'FAILURE' as const }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events.filter((e) => e.type === 'ci_failure')).toHaveLength(0);
    });

    it('does not detect CI failure if CI status was already FAILURE in previous snapshot', () => {
      const prev = [{ ...samplePR, isAuthoredByMe: true, ciStatus: 'FAILURE' as const }];
      const curr = [{ ...samplePR, isAuthoredByMe: true, ciStatus: 'FAILURE' as const }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'alice');

      expect(events.filter((e) => e.type === 'ci_failure')).toHaveLength(0);
    });

    it('does not detect CI failure if notifyCIFailures is false', () => {
      const prev = [{ ...samplePR, isAuthoredByMe: true, ciStatus: 'SUCCESS' as const }];
      const curr = [{ ...samplePR, isAuthoredByMe: true, ciStatus: 'FAILURE' as const }];
      const events = detectPRChanges(
        prev,
        curr,
        { ...defaultSettings, notifyCIFailures: false },
        'alice'
      );

      expect(events.filter((e) => e.type === 'ci_failure')).toHaveLength(0);
    });
  });

  describe('New Comments (notifyComments)', () => {
    it('detects when a new comment is posted on PR authored by current user', () => {
      const prev = [
        {
          ...samplePR,
          isAuthoredByMe: true,
          totalCommentsCount: 2,
          lastInteraction: {
            user: { login: 'bob', avatarUrl: '', url: '' },
            type: 'comment' as const,
            createdAt: '2026-09-01T12:00:00Z',
            snippet: 'First comment',
          },
        },
      ];
      const curr = [
        {
          ...samplePR,
          isAuthoredByMe: true,
          totalCommentsCount: 3,
          lastInteraction: {
            user: { login: 'charlie', avatarUrl: '', url: '' },
            type: 'comment' as const,
            createdAt: '2026-09-01T13:00:00Z',
            snippet: 'Please update the docs',
          },
        },
      ];
      const events = detectPRChanges(prev, curr, defaultSettings, 'alice');

      expect(events).toContainEqual(
        expect.objectContaining({
          type: 'new_comment',
          url: samplePR.url,
        })
      );
      expect(events[0].body).toContain('Please update the docs');
    });

    it('does not detect new comment if PR is not authored by current user', () => {
      const prev = [{ ...samplePR, isAuthoredByMe: false, totalCommentsCount: 1 }];
      const curr = [
        {
          ...samplePR,
          isAuthoredByMe: false,
          totalCommentsCount: 2,
          lastInteraction: {
            user: { login: 'charlie', avatarUrl: '', url: '' },
            type: 'comment' as const,
            createdAt: '2026-09-01T14:00:00Z',
          },
        },
      ];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events.filter((e) => e.type === 'new_comment')).toHaveLength(0);
    });

    it('does not detect comment if comment timestamp and count have not changed', () => {
      const prev = [{ ...samplePR, isAuthoredByMe: true, totalCommentsCount: 2 }];
      const curr = [{ ...samplePR, isAuthoredByMe: true, totalCommentsCount: 2 }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'alice');

      expect(events.filter((e) => e.type === 'new_comment')).toHaveLength(0);
    });

    it('does not detect new comment if notifyComments is false', () => {
      const prev = [{ ...samplePR, isAuthoredByMe: true, totalCommentsCount: 1 }];
      const curr = [
        {
          ...samplePR,
          isAuthoredByMe: true,
          totalCommentsCount: 2,
          lastInteraction: {
            user: { login: 'charlie', avatarUrl: '', url: '' },
            type: 'comment' as const,
            createdAt: '2026-09-01T14:00:00Z',
          },
        },
      ];
      const events = detectPRChanges(
        prev,
        curr,
        { ...defaultSettings, notifyComments: false },
        'alice'
      );

      expect(events.filter((e) => e.type === 'new_comment')).toHaveLength(0);
    });
  });

  describe('Stale PR Warnings (notifyStalePRs)', () => {
    it('detects when a PR transitions to stale status', () => {
      const prev = [{ ...samplePR, slaStatus: 'normal' as const }];
      const curr = [{ ...samplePR, slaStatus: 'stale' as const }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events).toContainEqual(
        expect.objectContaining({
          type: 'pr_stale',
          url: samplePR.url,
        })
      );
      expect(events[0].title).toMatch(/stale/i);
    });

    it('does not detect stale warning if PR was already stale in previous snapshot', () => {
      const prev = [{ ...samplePR, slaStatus: 'stale' as const }];
      const curr = [{ ...samplePR, slaStatus: 'stale' as const }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events.filter((e) => e.type === 'pr_stale')).toHaveLength(0);
    });

    it('does not detect stale warning if PR transitioned from normal to warning only', () => {
      const prev = [{ ...samplePR, slaStatus: 'normal' as const }];
      const curr = [{ ...samplePR, slaStatus: 'warning' as const }];
      const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');

      expect(events.filter((e) => e.type === 'pr_stale')).toHaveLength(0);
    });

    it('does not detect stale warning if notifyStalePRs is false', () => {
      const prev = [{ ...samplePR, slaStatus: 'normal' as const }];
      const curr = [{ ...samplePR, slaStatus: 'stale' as const }];
      const events = detectPRChanges(
        prev,
        curr,
        { ...defaultSettings, notifyStalePRs: false },
        'myuser'
      );

      expect(events.filter((e) => e.type === 'pr_stale')).toHaveLength(0);
    });
  });

  describe('Global Settings & Edge Cases', () => {
    it('returns empty array if settings.enabled is false', () => {
      const prev = [{ ...samplePR, isWaitingOnMe: false }];
      const curr = [{ ...samplePR, isWaitingOnMe: true }];
      const events = detectPRChanges(
        prev,
        curr,
        { ...defaultSettings, enabled: false },
        'myuser'
      );

      expect(events).toEqual([]);
    });

    it('returns empty array if previousPRs is empty (initial baseline load)', () => {
      const curr = [{ ...samplePR, isWaitingOnMe: true, ciStatus: 'FAILURE' as const }];
      const events = detectPRChanges([], curr, defaultSettings, 'myuser');

      expect(events).toEqual([]);
    });

    it('can detect multiple distinct event types in the same batch', () => {
      const pr1: PullRequestItem = { ...samplePR, id: 'PR_1', isWaitingOnMe: false };
      const pr2: PullRequestItem = {
        ...samplePR,
        id: 'PR_2',
        isAuthoredByMe: true,
        ciStatus: 'SUCCESS' as const,
      };

      const prev = [pr1, pr2];
      const curr = [
        { ...pr1, isWaitingOnMe: true },
        { ...pr2, ciStatus: 'FAILURE' as const },
      ];

      const events = detectPRChanges(prev, curr, defaultSettings, 'alice');
      expect(events).toHaveLength(2);
      expect(events.map((e) => e.type)).toEqual(
        expect.arrayContaining(['review_requested', 'ci_failure'])
      );
    });
  });
});

describe('sendBrowserNotification & Permission Helpers', () => {
  let originalNotification: any;

  beforeEach(() => {
    originalNotification = (globalThis as any).Notification;
  });

  afterEach(() => {
    (globalThis as any).Notification = originalNotification;
    vi.restoreAllMocks();
  });

  it('sends native Notification when permission is granted', () => {
    const mockNotificationCtor = vi.fn().mockImplementation(function (title, options) {
      return { title, options, onclick: null };
    });
    (mockNotificationCtor as any).permission = 'granted';
    (globalThis as any).Notification = mockNotificationCtor;

    const event: NotificationEvent = {
      type: 'review_requested',
      title: 'Review Requested: #101',
      body: 'Add auth feature',
      url: 'https://github.com/acme/repo/pull/101',
      pr: samplePR,
    };

    const notification = sendBrowserNotification(event);
    expect(mockNotificationCtor).toHaveBeenCalledWith(
      'Review Requested: #101',
      expect.objectContaining({
        body: 'Add auth feature',
      })
    );
    expect(notification).not.toBeNull();
  });

  it('triggers window.open and window.focus when notification is clicked', () => {
    let clickHandler: any = null;
    const mockNotificationInstance = {
      set onclick(fn: any) {
        clickHandler = fn;
      },
      get onclick() {
        return clickHandler;
      },
    };
    const mockNotificationCtor = vi.fn().mockReturnValue(mockNotificationInstance);
    (mockNotificationCtor as any).permission = 'granted';
    (globalThis as any).Notification = mockNotificationCtor;

    const focusSpy = vi.spyOn(window, 'focus').mockImplementation(() => {});
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const event: NotificationEvent = {
      type: 'review_requested',
      title: 'Review Requested',
      body: 'Desc',
      url: 'https://github.com/acme/repo/pull/101',
      pr: samplePR,
    };

    sendBrowserNotification(event);
    expect(clickHandler).toBeTypeOf('function');

    // Simulate click
    clickHandler({ preventDefault: vi.fn() });
    expect(focusSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('https://github.com/acme/repo/pull/101', '_blank');
  });

  it('returns null and does not fire notification if permission is not granted', () => {
    const mockNotificationCtor = vi.fn();
    (mockNotificationCtor as any).permission = 'denied';
    (globalThis as any).Notification = mockNotificationCtor;

    const event: NotificationEvent = {
      type: 'ci_failure',
      title: 'CI Failed',
      body: 'Build broke',
      url: 'https://github.com/acme/repo/pull/101',
      pr: samplePR,
    };

    const result = sendBrowserNotification(event);
    expect(result).toBeNull();
    expect(mockNotificationCtor).not.toHaveBeenCalled();
  });

  it('returns permission via getNotificationPermission and requestNotificationPermission', async () => {
    const mockNotificationCtor = vi.fn();
    (mockNotificationCtor as any).permission = 'default';
    (mockNotificationCtor as any).requestPermission = vi.fn().mockResolvedValue('granted');
    (globalThis as any).Notification = mockNotificationCtor;

    expect(getNotificationPermission()).toBe('default');
    const res = await requestNotificationPermission();
    expect(res).toBe('granted');
    expect((mockNotificationCtor as any).requestPermission).toHaveBeenCalled();
  });
});

describe('useNotificationWatcher Hook', () => {
  let originalNotification: any;

  beforeEach(() => {
    originalNotification = (globalThis as any).Notification;
    const mockNotificationCtor = vi.fn().mockImplementation(function (title, options) {
      return { title, options, onclick: null };
    });
    (mockNotificationCtor as any).permission = 'granted';
    (globalThis as any).Notification = mockNotificationCtor;
  });

  afterEach(() => {
    (globalThis as any).Notification = originalNotification;
    vi.restoreAllMocks();
  });

  it('initializes snapshot without firing notifications on first render', () => {
    const onNotification = vi.fn();
    renderHook(
      ({ prs }) =>
        useNotificationWatcher({
          prs,
          settings: defaultSettings,
          currentLogin: 'alice',
          onNotification,
        }),
      { initialProps: { prs: [samplePR] } }
    );

    expect(onNotification).not.toHaveBeenCalled();
  });

  it('detects changes and notifies on subsequent PR update', () => {
    const onNotification = vi.fn();
    const prevPR: PullRequestItem = { ...samplePR, isWaitingOnMe: false };
    const nextPR: PullRequestItem = { ...samplePR, isWaitingOnMe: true };

    const { rerender } = renderHook(
      ({ prs }) =>
        useNotificationWatcher({
          prs,
          settings: defaultSettings,
          currentLogin: 'alice',
          onNotification,
        }),
      { initialProps: { prs: [prevPR] } }
    );

    expect(onNotification).not.toHaveBeenCalled();

    rerender({ prs: [nextPR] });
    expect(onNotification).toHaveBeenCalledTimes(1);
    expect(onNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'review_requested' })
    );
  });

  it('does not fire notifications if settings.enabled is false', () => {
    const onNotification = vi.fn();
    const prevPR: PullRequestItem = { ...samplePR, isWaitingOnMe: false };
    const nextPR: PullRequestItem = { ...samplePR, isWaitingOnMe: true };

    const { rerender } = renderHook(
      ({ prs }) =>
        useNotificationWatcher({
          prs,
          settings: { ...defaultSettings, enabled: false },
          currentLogin: 'alice',
          onNotification,
        }),
      { initialProps: { prs: [prevPR] } }
    );

    rerender({ prs: [nextPR] });
    expect(onNotification).not.toHaveBeenCalled();
  });
});
