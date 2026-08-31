import { AppSettings } from '../types';

export const STORAGE_KEY = 'gh_pr_dashboard_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  token: '',
  storageType: 'local',
  repositories: [],
  presets: [],
  activePresetId: null,
  autoRefreshIntervalSeconds: 0,
};

export function getStoredSettings(): AppSettings {
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fromSession) };
    }
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fromLocal) };
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
