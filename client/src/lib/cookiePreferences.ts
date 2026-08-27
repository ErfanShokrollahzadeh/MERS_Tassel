export const COOKIE_PREFERENCES_KEY = 'mers-cookie-preferences-v1';
export const OPEN_COOKIE_SETTINGS_EVENT = 'mers:open-cookie-settings';
export const COOKIE_PREFERENCES_CHANGED_EVENT = 'mers:cookie-preferences-changed';

export type CookiePreferences = {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
};

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

export function readCookiePreferences(): CookiePreferences | null {
  try {
    const saved = window.localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!saved) return null;
    const value = JSON.parse(saved) as Partial<CookiePreferences>;
    if (value.version !== 1 || value.necessary !== true) return null;
    return {
      version: 1,
      necessary: true,
      analytics: value.analytics === true,
      marketing: value.marketing === true,
      savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCookiePreferences(preferences: Pick<CookiePreferences, 'analytics' | 'marketing'>) {
  const value: CookiePreferences = {
    version: 1,
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(value));
  document.cookie = `mers-cookie-consent=${value.analytics ? 'analytics-' : ''}${value.marketing ? 'marketing-' : ''}v1;path=/;max-age=31536000;samesite=lax`;
  window.dispatchEvent(new CustomEvent<CookiePreferences>(COOKIE_PREFERENCES_CHANGED_EVENT, { detail: value }));
  return value;
}
