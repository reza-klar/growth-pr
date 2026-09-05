import { useEffect, useRef } from 'react';
import { PullRequestItem, NotificationSettings } from '../types';
import {
  detectPRChanges,
  sendBrowserNotification,
  NotificationEvent,
} from '../utils/notifications';

export interface UseNotificationWatcherOptions {
  prs: PullRequestItem[];
  settings: NotificationSettings;
  currentLogin?: string;
  onNotification?: (event: NotificationEvent) => void;
}

export function useNotificationWatcher(
  prsOrOptions: PullRequestItem[] | UseNotificationWatcherOptions,
  settingsParam?: NotificationSettings,
  currentLoginParam?: string
) {
  let prs: PullRequestItem[];
  let settings: NotificationSettings | undefined;
  let currentLogin: string | undefined;
  let onNotification: ((event: NotificationEvent) => void) | undefined;

  if (Array.isArray(prsOrOptions)) {
    prs = prsOrOptions;
    settings = settingsParam;
    currentLogin = currentLoginParam;
  } else {
    prs = prsOrOptions.prs;
    settings = prsOrOptions.settings;
    currentLogin = prsOrOptions.currentLogin;
    onNotification = prsOrOptions.onNotification;
  }

  const previousPRsRef = useRef<PullRequestItem[] | null>(null);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    // Initial snapshot baseline: do not send notifications on initial load
    if (previousPRsRef.current === null) {
      previousPRsRef.current = prs;
      return;
    }

    if (settings?.enabled) {
      const events = detectPRChanges(previousPRsRef.current, prs, settings, currentLogin);
      for (const event of events) {
        sendBrowserNotification(event);
        onNotificationRef.current?.(event);
      }
    }

    previousPRsRef.current = prs;
  }, [prs, settings, currentLogin]);
}
