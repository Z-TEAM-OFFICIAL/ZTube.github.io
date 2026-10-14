/**
 * Comprehensive Cookie Management Utility for ZTube Platform
 * Supports reading, writing, updating, and clearing cookies with RFC 6265 compliance,
 * SameSite & Max-Age security attributes, fallback storage, and structured JSON parsing.
 */

export interface CookieConsentPreferences {
  status: 'accepted' | 'declined' | 'customized';
  essential: boolean; // Always true
  categoriesAndFiltering: boolean; // Retains active category, filter pills, history
  locationalPersonalization: boolean; // Retains detected/chosen location and regional algorithm
  analyticsAndTelemetry: boolean; // Retains compression and latency metrics
  updatedAt: string;
}

export const DEFAULT_COOKIE_CONSENT: CookieConsentPreferences = {
  status: 'accepted',
  essential: true,
  categoriesAndFiltering: true,
  locationalPersonalization: true,
  analyticsAndTelemetry: true,
  updatedAt: new Date().toISOString(),
};

/**
 * Read a cookie by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(';');
  for (let i = 0; i < parts.length; i++) {
    let c = parts[i].trim();
    if (c.indexOf(target) === 0) {
      try {
        return decodeURIComponent(c.substring(target.length));
      } catch {
        return c.substring(target.length);
      }
    }
  }
  return null;
}

/**
 * Set a cookie with specified name, value, expiration days, path, and SameSite attribute
 */
export function setCookie(
  name: string,
  value: string,
  days = 365,
  path = '/',
  sameSite: 'Lax' | 'Strict' | 'None' = 'Lax'
): void {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${d.toUTCString()}`;
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${encodedName}=${encodedValue}; ${expires}; path=${path}; SameSite=${sameSite}`;

  // Also mirror to localStorage as resilient offline fallback
  try {
    localStorage.setItem(`cookie_mirror_${name}`, value);
  } catch {
    // ignore
  }
}

/**
 * Delete a cookie by expiring it in the past
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return;
  const encodedName = encodeURIComponent(name);
  document.cookie = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax`;
  try {
    localStorage.removeItem(`cookie_mirror_${name}`);
  } catch {
    // ignore
  }
}

/**
 * Retrieve all currently set cookies as a key-value record
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const cookies: Record<string, string> = {};
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = decodeURIComponent(trimmed.slice(0, eqIdx).trim());
      const val = decodeURIComponent(trimmed.slice(eqIdx + 1).trim());
      cookies[key] = val;
    }
  }
  return cookies;
}

/**
 * Category Preference Cookie
 */
export const CATEGORY_COOKIE_NAME = 'ztube_category_pref';

export interface CategoryCookiePayload {
  selectedCategory: string;
  favoriteCategories: string[];
  lastSelectedAt: string;
}

export function getCategoryCookie(): CategoryCookiePayload | null {
  const raw = getCookie(CATEGORY_COOKIE_NAME);
  if (!raw) {
    try {
      const fallback = localStorage.getItem(`cookie_mirror_${CATEGORY_COOKIE_NAME}`);
      if (fallback) return JSON.parse(fallback);
    } catch {
      // ignore
    }
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      selectedCategory: raw,
      favoriteCategories: [],
      lastSelectedAt: new Date().toISOString(),
    };
  }
}

export function setCategoryCookie(payload: CategoryCookiePayload): void {
  setCookie(CATEGORY_COOKIE_NAME, JSON.stringify(payload), 365);
}

/**
 * Location Preference Cookie
 */
export const LOCATION_COOKIE_NAME = 'ztube_location_pref';

export interface LocationCookiePayload {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timezone: string;
  flag: string;
  latitude?: number;
  longitude?: number;
  locationalAlgorithmEnabled: boolean;
  algorithmMode: 'nearby_boost' | 'local_only' | 'distance_strict' | 'standard';
  autoDetected: boolean;
  updatedAt: string;
}

export function getLocationCookie(): LocationCookiePayload | null {
  const raw = getCookie(LOCATION_COOKIE_NAME);
  if (!raw) {
    try {
      const fallback = localStorage.getItem(`cookie_mirror_${LOCATION_COOKIE_NAME}`);
      if (fallback) return JSON.parse(fallback);
    } catch {
      // ignore
    }
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocationCookie(payload: LocationCookiePayload): void {
  setCookie(LOCATION_COOKIE_NAME, JSON.stringify(payload), 365);
}

/**
 * Cookie Consent Preferences Cookie
 */
export const COOKIE_CONSENT_NAME = 'ztube_cookie_consent';

export function getCookieConsent(): CookieConsentPreferences {
  const raw = getCookie(COOKIE_CONSENT_NAME);
  if (!raw) {
    try {
      const fallback = localStorage.getItem(`cookie_mirror_${COOKIE_CONSENT_NAME}`);
      if (fallback) return JSON.parse(fallback);
    } catch {
      // ignore
    }
    return DEFAULT_COOKIE_CONSENT;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COOKIE_CONSENT;
  }
}

export function setCookieConsent(preferences: CookieConsentPreferences): void {
  setCookie(COOKIE_CONSENT_NAME, JSON.stringify(preferences), 365);
}
