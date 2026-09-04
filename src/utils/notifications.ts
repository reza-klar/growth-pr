import { PullRequestItem, NotificationSettings } from '../types';

export type NotificationEventType =
  | 'review_requested'
  | 'ci_failure'
  | 'new_comment'
  | 'pr_stale';

export interface NotificationEvent {
  type: NotificationEventType;
  title: string;
  body: string;
  url: string;
  pr: PullRequestItem;
}

function findMatchingPR(
  prs: PullRequestItem[],
  target: PullRequestItem
): PullRequestItem | undefined {
  return prs.find(
    (p) =>
      (p.id && target.id && p.id === target.id) ||
      (p.number === target.number &&
        p.repository?.nameWithOwner === target.repository?.nameWithOwner)
  );
}

function isAuthoredByUser(pr: PullRequestItem, currentLogin?: string): boolean {
  if (pr.isAuthoredByMe) return true;
  if (currentLogin && pr.author?.login === currentLogin) return true;
  return false;
}

export function detectPRChanges(
  previousPRs: PullRequestItem[],
  currentPRs: PullRequestItem[],
  settings: NotificationSettings,
  currentLogin?: string
): NotificationEvent[] {
  if (!settings.enabled) {
    return [];
  }

  // Baseline load or empty previous snapshot has no diff
  if (!previousPRs || previousPRs.length === 0) {
    return [];
  }

  const events: NotificationEvent[] = [];

  for (const currPR of currentPRs) {
    const prevPR = findMatchingPR(previousPRs, currPR);

    // 1. Review Requests: newly requested review on current user
    if (settings.notifyReviewRequests) {
      const prevWaiting = prevPR ? Boolean(prevPR.isWaitingOnMe) : false;
      const currWaiting = Boolean(currPR.isWaitingOnMe);

      if (!prevWaiting && currWaiting) {
        events.push({
          type: 'review_requested',
          title: `Review Requested: #${currPR.number}`,
          body: `${currPR.title} (${currPR.repository.nameWithOwner})`,
          url: currPR.url,
          pr: currPR,
        });
      }
    }

    // 2. CI Failures: authored PR transitions to FAILURE
    if (settings.notifyCIFailures) {
      const isAuthored = isAuthoredByUser(currPR, currentLogin);
      if (
        isAuthored &&
        prevPR &&
        prevPR.ciStatus !== 'FAILURE' &&
        currPR.ciStatus === 'FAILURE'
      ) {
        events.push({
          type: 'ci_failure',
          title: `CI Failed: #${currPR.number}`,
          body: `Checks failed for "${currPR.title}"`,
          url: currPR.url,
          pr: currPR,
        });
      }
    }

    // 3. New Comments: authored PR receives a new comment
    if (settings.notifyComments) {
      const isAuthored = isAuthoredByUser(currPR, currentLogin);
      if (isAuthored && prevPR) {
        const hasMoreComments = currPR.totalCommentsCount > prevPR.totalCommentsCount;
        const prevCommentTime = prevPR.lastInteraction?.createdAt
          ? new Date(prevPR.lastInteraction.createdAt).getTime()
          : 0;
        const currCommentTime = currPR.lastInteraction?.createdAt
          ? new Date(currPR.lastInteraction.createdAt).getTime()
          : 0;
        const isCommentInteractionNewer =
          currPR.lastInteraction?.type === 'comment' && currCommentTime > prevCommentTime;

        if (hasMoreComments || isCommentInteractionNewer) {
          const authorName = currPR.lastInteraction?.user?.login;
          const snippet = currPR.lastInteraction?.snippet;
          let body = `New comment on "${currPR.title}"`;
          if (authorName && snippet) {
            body = `@${authorName}: ${snippet}`;
          } else if (snippet) {
            body = snippet;
          } else if (authorName) {
            body = `@${authorName} commented on "${currPR.title}"`;
          }

          events.push({
            type: 'new_comment',
            title: `New Comment: #${currPR.number}`,
            body,
            url: currPR.url,
            pr: currPR,
          });
        }
      }
    }

    // 4. Stale PR Warnings: transitions to stale SLA status (>48h)
    if (settings.notifyStalePRs) {
      if (prevPR && prevPR.slaStatus !== 'stale' && currPR.slaStatus === 'stale') {
        events.push({
          type: 'pr_stale',
          title: `PR Stale Warning: #${currPR.number}`,
          body: `"${currPR.title}" has been inactive for over 48 hours`,
          url: currPR.url,
          pr: currPR,
        });
      }
    }
  }

  return events;
}

export function sendBrowserNotification(event: NotificationEvent): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }
  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(event.title, {
      body: event.body,
      icon: event.pr.author?.avatarUrl || undefined,
      data: { url: event.url },
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus?.();
      if (event.url) {
        window.open(event.url, '_blank');
      }
    };

    return notification;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
