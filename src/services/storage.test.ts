import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredSettings, saveStoredSettings, DEFAULT_SETTINGS, DEFAULT_NOTIFICATION_SETTINGS } from './storage';
import { AppSettings } from '../types';

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns default settings when storage is empty', () => {
    const settings = getStoredSettings();
    expect(settings.repositories).toEqual(DEFAULT_SETTINGS.repositories);
    expect(settings.token).toBe('');
    expect(settings.storageType).toBe('local');
    expect(settings.presets).toEqual([]);
    expect(settings.activePresetId).toBeNull();
    expect(settings.autoRefreshIntervalSeconds).toBe(0);
    expect(settings.notifications).toBeDefined();
    expect(settings.notifications.enabled).toBe(false);
    expect(settings.notifications.notifyReviewRequests).toBe(true);
  });

  it('saves and retrieves settings from localStorage', () => {
    const newSettings: AppSettings = {
      token: 'ghp_test123',
      storageType: 'local',
      repositories: ['owner/repo1', 'owner/repo2'],
      presets: [{ id: 'core', name: 'Core Team', repositories: ['owner/repo1'] }],
      activePresetId: 'core',
      autoRefreshIntervalSeconds: 300,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
    };
    saveStoredSettings(newSettings);
    expect(getStoredSettings()).toEqual(newSettings);
  });

  it('saves to sessionStorage when storageType is session', () => {
    const newSettings: AppSettings = {
      token: 'ghp_session_token',
      storageType: 'session',
      repositories: ['org/repo-a'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
    };
    saveStoredSettings(newSettings);
    expect(sessionStorage.getItem('gh_pr_dashboard_settings')).toBeTruthy();
    expect(localStorage.getItem('gh_pr_dashboard_settings')).toBeNull();
    expect(getStoredSettings()).toEqual(newSettings);
  });

  it('switches from session to local storage and cleans up sessionStorage', () => {
    const sessionSettings: AppSettings = {
      token: 'ghp_session_token',
      storageType: 'session',
      repositories: ['org/repo-a'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
    };
    saveStoredSettings(sessionSettings);
    expect(sessionStorage.getItem('gh_pr_dashboard_settings')).toBeTruthy();

    const localSettings: AppSettings = {
      token: 'ghp_local_token',
      storageType: 'local',
      repositories: ['org/repo-b'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 60,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
    };
    saveStoredSettings(localSettings);
    expect(localStorage.getItem('gh_pr_dashboard_settings')).toBeTruthy();
    expect(sessionStorage.getItem('gh_pr_dashboard_settings')).toBeNull();
    expect(getStoredSettings()).toEqual(localSettings);
  });

  it('handles invalid JSON gracefully and returns DEFAULT_SETTINGS', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('gh_pr_dashboard_settings', 'invalid-json{{{');
    const settings = getStoredSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('catches and logs storage quota errors without crashing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveStoredSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save stored settings:', expect.any(Error));
  });

  it('loads and saves notification settings correctly', () => {
    const customSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      notifications: {
        enabled: true,
        notifyReviewRequests: true,
        notifyCIFailures: true,
        notifyComments: false,
        notifyStalePRs: true,
      },
    };
    saveStoredSettings(customSettings);
    expect(getStoredSettings().notifications.enabled).toBe(true);
    expect(getStoredSettings().notifications.notifyComments).toBe(false);
  });

  it('populates default notification settings when stored data lacks notifications', () => {
    localStorage.setItem('gh_pr_dashboard_settings', JSON.stringify({ token: 'ghp_old', repositories: ['org/repo'] }));
    const settings = getStoredSettings();
    expect(settings.token).toBe('ghp_old');
    expect(settings.notifications).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
  });
});

