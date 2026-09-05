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
  let parsed: Partial<AppSettings> | null = null;

  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) {
      parsed = JSON.parse(fromSession);
    }
  } catch (err) {
    console.error('Failed to parse settings from sessionStorage:', err);
  }

  if (!parsed) {
    try {
      const fromLocal = localStorage.getItem(STORAGE_KEY);
      if (fromLocal) {
        parsed = JSON.parse(fromLocal);
      }
    } catch (err) {
      console.error('Failed to parse settings from localStorage:', err);
    }
  }

  if (parsed) {
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(parsed.notifications || {}),
      },
    };
  }

  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: AppSettings): boolean {
  try {
    const json = JSON.stringify(settings);
    if (settings.storageType === 'session') {
      sessionStorage.setItem(STORAGE_KEY, json);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, json);
      sessionStorage.removeItem(STORAGE_KEY);
    }
    return true;
  } catch (err) {
    console.error('Failed to save stored settings:', err);
    return false;
  }
}
