import { AppSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../types';

export const STORAGE_KEY = 'gh_pr_dashboard_settings';

export { DEFAULT_NOTIFICATION_SETTINGS };

export const DEFAULT_SETTINGS: AppSettings = {
  token: '',
  storageType: 'local',
  repositories: [],
  presets: [],
  activePresetId: null,
  autoRefreshIntervalSeconds: 0,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
};

export function getStoredSettings(): AppSettings {
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) {
      const parsed = JSON.parse(fromSession);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...(parsed.notifications || {}),
        },
      };
    }
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal) {
      const parsed = JSON.parse(fromLocal);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...(parsed.notifications || {}),
        },
      };
    }
  } catch (err) {
    console.error('Failed to parse stored settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    const json = JSON.stringify(settings);
    if (settings.storageType === 'session') {
      sessionStorage.setItem(STORAGE_KEY, json);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, json);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save stored settings:', err);
  }
}
