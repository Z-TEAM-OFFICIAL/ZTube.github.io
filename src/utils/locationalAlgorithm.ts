/**
 * Advanced Locational Recommendation & Proximity Algorithm for ZTube Platform
 *
 * Capabilities:
 * 1. Automatic Timezone & Browser-Locale Geolocation Detection
 * 2. Optional High-Precision Browser Coordinates via Geolocation API
 * 3. Haversine Great-Circle Geographic Distance Calculation (km)
 * 4. Multi-Tiered Locational Relevance Scoring (City > Country > Continent > Distance Decay)
 * 5. Feed Filtering by Locational Modes:
 *    - 'nearby_boost': Boosts regionally proximate content while keeping global hits
 *    - 'local_only': Strictly displays videos from user's country or region
 *    - 'distance_strict': Sorts videos purely by shortest geographical distance
 *    - 'standard': Global chronological / engagement ranking with location badges
 */

import { VideoItem } from '../types';
import { LocationCookiePayload } from './cookieUtils';

export interface GeoHub {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Global';
  flag: string;
  lat: number;
  lng: number;
  timezones: string[];
}

export const KNOWN_GEO_HUBS: GeoHub[] = [
  {
    id: 'hub_nyc',
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    region: 'Americas',
    flag: '🇺🇸',
    lat: 40.7128,
    lng: -74.006,
    timezones: ['America/New_York', 'America/Detroit', 'US/Eastern'],
  },
  {
    id: 'hub_sf',
    city: 'San Francisco',
    country: 'United States',
    countryCode: 'US',
    region: 'Americas',
    flag: '🇺🇸',
    lat: 37.7749,
    lng: -122.4194,
    timezones: ['America/Los_Angeles', 'America/Vancouver', 'US/Pacific'],
  },
  {
    id: 'hub_lon',
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'Europe',
    flag: '🇬🇧',
    lat: 51.5074,
    lng: -0.1278,
    timezones: ['Europe/London', 'UTC', 'GMT'],
  },
  {
    id: 'hub_tyo',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    region: 'Asia-Pacific',
    flag: '🇯🇵',
    lat: 35.6762,
    lng: 139.6503,
    timezones: ['Asia/Tokyo'],
  },
  {
    id: 'hub_ber',
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Europe',
    flag: '🇩🇪',
    lat: 52.52,
    lng: 13.405,
    timezones: ['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich'],
  },
  {
    id: 'hub_par',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    region: 'Europe',
    flag: '🇫🇷',
    lat: 48.8566,
    lng: 2.3522,
    timezones: ['Europe/Paris', 'Europe/Brussels'],
  },
  {
    id: 'hub_syd',
    city: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    region: 'Asia-Pacific',
    flag: '🇦🇺',
    lat: -33.8688,
    lng: 151.2093,
    timezones: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane'],
  },
  {
    id: 'hub_tor',
    city: 'Toronto',
    country: 'Canada',
    countryCode: 'CA',
    region: 'Americas',
    flag: '🇨🇦',
    lat: 43.6532,
    lng: -79.3832,
    timezones: ['America/Toronto', 'America/Montreal'],
  },
  {
    id: 'hub_sel',
    city: 'Seoul',
    country: 'South Korea',
    countryCode: 'KR',
    region: 'Asia-Pacific',
    flag: '🇰🇷',
    lat: 37.5665,
    lng: 126.978,
    timezones: ['Asia/Seoul'],
  },
  {
    id: 'hub_sin',
    city: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    region: 'Asia-Pacific',
    flag: '🇸🇬',
    lat: 1.3521,
    lng: 103.8198,
    timezones: ['Asia/Singapore'],
  },
  {
    id: 'hub_sao',
    city: 'São Paulo',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'Americas',
    flag: '🇧🇷',
    lat: -23.5505,
    lng: -46.6333,
    timezones: ['America/Sao_Paulo'],
  },
  {
    id: 'hub_mum',
    city: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    region: 'Asia-Pacific',
    flag: '🇮🇳',
    lat: 19.076,
    lng: 72.8777,
    timezones: ['Asia/Kolkata', 'Asia/Calcutta'],
  },
];

export const WORLDWIDE_HUB: GeoHub = {
  id: 'hub_global',
  city: 'Worldwide',
  country: 'Global',
  countryCode: 'GLOBAL',
  region: 'Global',
  flag: '🌐',
  lat: 0,
  lng: 0,
  timezones: [],
};

/**
 * Calculates Great-Circle distance using Haversine formula (km)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === 0 && lon1 === 0 && lat2 === 0 && lon2 === 0) return 0;
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Auto-detect user's regional hub using system Timezone and Locale
 */
export function detectUserLocation(): LocationCookiePayload {
  let userTimezone = 'UTC';
  try {
    userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // fallback
  }

  // Find exact or closest matching hub by timezone
  const matchedHub =
    KNOWN_GEO_HUBS.find((h) => h.timezones.includes(userTimezone)) ||
    KNOWN_GEO_HUBS.find((h) => userTimezone.startsWith(h.timezones[0]?.split('/')[0] || '')) ||
    KNOWN_GEO_HUBS[0]; // NYC default

  return {
    country: matchedHub.country,
    countryCode: matchedHub.countryCode,
    city: matchedHub.city,
    region: matchedHub.region,
    timezone: userTimezone,
    flag: matchedHub.flag,
    latitude: matchedHub.lat,
    longitude: matchedHub.lng,
    locationalAlgorithmEnabled: true,
    algorithmMode: 'nearby_boost',
    autoDetected: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parses a video's locationTag string into structured geo elements
 */
export function parseVideoLocation(locationTag?: string): {
  city?: string;
  country?: string;
  hub?: GeoHub;
  isWorldwide: boolean;
  raw: string;
} {
  const raw = (locationTag || 'Worldwide').trim();
  if (
    !raw ||
    raw.toLowerCase() === 'worldwide' ||
    raw.toLowerCase() === 'global' ||
    raw.toLowerCase() === 'all'
  ) {
    return { isWorldwide: true, raw: 'Worldwide', hub: WORLDWIDE_HUB };
  }

  // Match against known hubs
  const lower = raw.toLowerCase();
  for (const hub of KNOWN_GEO_HUBS) {
    if (
      lower.includes(hub.city.toLowerCase()) ||
      lower.includes(hub.country.toLowerCase()) ||
      lower.includes(hub.countryCode.toLowerCase())
    ) {
      return {
        city: hub.city,
        country: hub.country,
        hub,
        isWorldwide: false,
        raw,
      };
    }
  }

  return {
    isWorldwide: false,
    raw,
  };
}

export interface VideoLocationEvaluation {
  locationalScore: number; // 0 to 100
  distanceKm?: number;
  matchType: 'local_city' | 'same_country' | 'regional' | 'global' | 'distant';
  badgeLabel: string;
  flagEmoji: string;
}

/**
 * Computes location relevance score and distance for a video given the user's location
 */
export function evaluateVideoLocation(
  video: VideoItem,
  userLoc: LocationCookiePayload
): VideoLocationEvaluation {
  const parsed = parseVideoLocation(video.locationTag);

  // If user has selected Worldwide or content is tagged Worldwide
  if (userLoc.countryCode === 'GLOBAL' || parsed.isWorldwide) {
    return {
      locationalScore: 50,
      matchType: 'global',
      badgeLabel: '🌐 Global / Worldwide',
      flagEmoji: '🌐',
    };
  }

  const userCityLower = (userLoc.city || '').toLowerCase();
  const userCountryLower = (userLoc.country || '').toLowerCase();
  const userRegionLower = (userLoc.region || '').toLowerCase();

  const tagLower = parsed.raw.toLowerCase();
  let score = 20; // baseline
  let matchType: VideoLocationEvaluation['matchType'] = 'distant';
  let badgeLabel = `📍 ${parsed.raw}`;
  let flagEmoji = '📍';

  if (parsed.hub) {
    flagEmoji = parsed.hub.flag;
  }

  // 1. Direct City Match (+50)
  if (parsed.city && parsed.city.toLowerCase() === userCityLower) {
    score += 55;
    matchType = 'local_city';
    badgeLabel = `📍 Local · ${parsed.city} (${userLoc.flag})`;
  } else if (tagLower.includes(userCityLower) && userCityLower.length > 2) {
    score += 55;
    matchType = 'local_city';
    badgeLabel = `📍 Local · ${userLoc.city}`;
  }
  // 2. Direct Country Match (+35)
  else if (
    (parsed.country && parsed.country.toLowerCase() === userCountryLower) ||
    tagLower.includes(userCountryLower) ||
    tagLower.includes(userLoc.countryCode.toLowerCase())
  ) {
    score += 38;
    matchType = 'same_country';
    badgeLabel = `📍 In ${userLoc.country} (${userLoc.flag})`;
  }
  // 3. Same Geographic Region / Continent (+20)
  else if (
    parsed.hub &&
    parsed.hub.region.toLowerCase() === userRegionLower
  ) {
    score += 22;
    matchType = 'regional';
    badgeLabel = `📍 ${parsed.hub.region} Region (${parsed.hub.flag})`;
  }

  // 4. Coordinates Distance Calculation & Decay
  let distanceKm: number | undefined;
  const userLat = userLoc.latitude;
  const userLng = userLoc.longitude;

  if (parsed.hub && userLat !== undefined && userLng !== undefined && userLat !== 0) {
    distanceKm = calculateHaversineDistanceKm(userLat, userLng, parsed.hub.lat, parsed.hub.lng);

    // Distance decay bonus: up to +25 for nearest videos (< 500km)
    if (distanceKm < 500) {
      score += 25;
      if (matchType === 'distant') matchType = 'regional';
    } else if (distanceKm < 2000) {
      score += 18;
    } else if (distanceKm < 6000) {
      score += 10;
    }
  }

  return {
    locationalScore: Math.min(100, Math.max(0, score)),
    distanceKm,
    matchType,
    badgeLabel,
    flagEmoji,
  };
}

/**
 * Filter and Rank Video items based on Locational Algorithm
 */
export function rankVideosWithLocationalAlgorithm(
  videos: VideoItem[],
  userLoc: LocationCookiePayload,
  mode: LocationCookiePayload['algorithmMode'] = 'nearby_boost'
): (VideoItem & { locationEvaluation: VideoLocationEvaluation })[] {
  const evaluated = videos.map((v) => ({
    ...v,
    locationEvaluation: evaluateVideoLocation(v, userLoc),
  }));

  if (mode === 'standard') {
    return evaluated;
  }

  if (mode === 'local_only') {
    // Strictly local/country or global
    return evaluated.filter(
      (v) =>
        v.locationEvaluation.matchType === 'local_city' ||
        v.locationEvaluation.matchType === 'same_country' ||
        v.locationEvaluation.matchType === 'global'
    );
  }

  if (mode === 'distance_strict') {
    // Sort primarily by distance ascending
    return [...evaluated].sort((a, b) => {
      const distA = a.locationEvaluation.distanceKm ?? 99999;
      const distB = b.locationEvaluation.distanceKm ?? 99999;
      return distA - distB;
    });
  }

  // 'nearby_boost' mode (Default):
  // Blends engagement (views/likes) + locational score bonus + recency
  return [...evaluated].sort((a, b) => {
    const locA = a.locationEvaluation.locationalScore;
    const locB = b.locationEvaluation.locationalScore;
    const engagementA = Math.min(50, (a.views || 0) * 0.5 + (a.likes || 0) * 1.5);
    const engagementB = Math.min(50, (b.views || 0) * 0.5 + (b.likes || 0) * 1.5);
    const compositeA = locA * 0.6 + engagementA * 0.4;
    const compositeB = locB * 0.6 + engagementB * 0.4;
    return compositeB - compositeA;
  });
}
