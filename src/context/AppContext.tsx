import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  db,
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  UserProfile,
  SubscriptionTier,
  AdLevelTier,
  PlayerColorTheme,
  VideoItem,
  CommunityPostItem,
  CommentItem,
  AdCampaignItem,
  CreditTransactionItem,
  SubscriptionItem,
  PlaylistItem,
  TelemetryEventItem,
  SiteSettings,
  PageRoute,
  DEFAULT_SITE_SETTINGS,
  AppNotification,
  TutorialState,
  WatchLaterEntry,
  CategoryItem,
  INITIAL_DEFAULT_CATEGORIES,
} from '../types';
import {
  getCookie,
  setCookie,
  getCategoryCookie,
  setCategoryCookie,
  getLocationCookie,
  setLocationCookie,
  getCookieConsent,
  setCookieConsent,
  CookieConsentPreferences,
  DEFAULT_COOKIE_CONSENT,
  LocationCookiePayload,
} from '../utils/cookieUtils';
import {
  detectUserLocation,
  evaluateVideoLocation,
  rankVideosWithLocationalAlgorithm,
  KNOWN_GEO_HUBS,
  WORLDWIDE_HUB,
  GeoHub,
  VideoLocationEvaluation,
} from '../utils/locationalAlgorithm';

/**
 * Helper to parse MM:SS or HH:MM:SS duration string into total seconds
 */
export function parseDurationToSeconds(durationStr: string): number {
  const parts = String(durationStr || '0:45')
    .trim()
    .split(':')
    .map((n) => parseInt(n, 10) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 45;
}

interface AppContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  allUsers: UserProfile[];
  isAdmin: boolean;
  authReady: boolean;
  accessToken: string | null;
  subscriberCredits: number;
  subscriptionTier: SubscriptionTier;
  subscribersCount: number;
  backendApiKey: string;
  userAge: number;
  setBackendApiKeyAndAge: (apiKey: string, age: number) => Promise<void>;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  videos: VideoItem[];
  recommendedVideos: (VideoItem & { affinityScore: number; affinityReasons: string[] })[];
  categories: CategoryItem[];
  addCategory: (category: Omit<CategoryItem, 'id' | 'createdAt'>) => Promise<string>;
  categoryVideoCounts: Record<string, number>;
  userLocation: LocationCookiePayload;
  setUserLocation: (loc: LocationCookiePayload) => void;
  setUserLocationHub: (hubId: string) => void;
  locationalAlgorithmEnabled: boolean;
  setLocationalAlgorithmEnabled: (enabled: boolean) => void;
  locationAlgorithmMode: LocationCookiePayload['algorithmMode'];
  setLocationAlgorithmMode: (mode: LocationCookiePayload['algorithmMode']) => void;
  cookieConsent: CookieConsentPreferences;
  updateCookieConsent: (prefs: Partial<CookieConsentPreferences>) => void;
  isCookieBannerOpen: boolean;
  setIsCookieBannerOpen: (open: boolean) => void;
  isCookieSettingsModalOpen: boolean;
  setIsCookieSettingsModalOpen: (open: boolean) => void;
  locationalRankedVideos: (VideoItem & { locationEvaluation: VideoLocationEvaluation })[];
  posts: CommunityPostItem[];
  comments: CommentItem[];
  adCampaigns: AdCampaignItem[];
  creditTransactions: CreditTransactionItem[];
  subscriptions: SubscriptionItem[];
  telemetryEvents: TelemetryEventItem[];
  siteSettings: SiteSettings;
  currentRoute: PageRoute;
  selectedVideoId: string | null;
  missingResourceType: string;
  searchQuery: string;
  selectedCategory: string;
  watchHistoryIds: string[];
  watchHistoryEnabled: boolean;
  setWatchHistoryEnabled: (enabled: boolean) => void;
  clearWatchHistory: () => void;
  removeFromWatchHistory: (videoId: string) => void;
  playlists: PlaylistItem[];
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
  createPlaylist: (title: string, description?: string, isPublic?: boolean, initialVideoId?: string) => string;
  deletePlaylist: (playlistId: string) => void;
  toggleVideoInPlaylist: (playlistId: string, videoId: string) => boolean;
  viewedVideoIdsByCurrentUser: string[];
  savedVideoIds: string[];
  favoriteVideoIds: string[];
  watchLaterEntries: WatchLaterEntry[];
  watchLaterVideoIds: string[];
  isVideoInWatchLater: (videoId: string) => boolean;
  isVideoSaved: (videoId: string) => boolean;
  isVideoFavorited: (videoId: string) => boolean;
  isVideoWatched: (videoId: string) => boolean;
  toggleWatchLater: (videoId: string) => boolean;
  removeFromWatchLater: (videoId: string) => boolean;
  reorderWatchLater: (fromIndex: number, toIndex: number) => void;
  moveWatchLaterItemToPosition: (videoId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  removeWatchedFromWatchLater: () => number;
  clearWatchLater: () => void;
  autoRemoveWatchLaterOnFinish: boolean;
  setAutoRemoveWatchLaterOnFinish: (enabled: boolean) => void;
  activeQueueMode: 'off' | 'watch-later';
  setActiveQueueMode: (mode: 'off' | 'watch-later') => void;
  queueShuffle: boolean;
  setQueueShuffle: (shuffle: boolean) => void;
  queueLoop: boolean;
  setQueueLoop: (loop: boolean) => void;
  activeQueueVideoIds: string[];
  startWatchLaterQueue: (shuffle?: boolean, startVideoId?: string, customVideoIds?: string[]) => void;
  handleVideoPlaybackEnded: (videoId: string) => void;
  userLikesPerVideo: Record<string, number>;
  userLikesPerPost: Record<string, number>;
  userDislikedVideoIds: string[];
  userDislikedPostIds: string[];
  darkMode: boolean;
  liquidGlass: boolean;
  rgbCursorEnabled: boolean;
  textScale: 'sm' | 'md' | 'lg';
  isUploadModalOpen: boolean;
  preselectedShortSoundId: string | null;
  setPreselectedShortSoundId: (id: string | null) => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  pushNotification: (input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  tutorialState: TutorialState;
  startTutorial: () => void;
  skipTutorial: () => void;
  replayTutorial: () => void;
  setTutorialStep: (step: number) => void;
  completeTutorial: () => void;
  dismissImportContextTip: () => void;
  dismissWatchContextTip: () => void;
  navigate: (route: PageRoute, videoId?: string, resourceType?: string) => void;
  triggerResourceNotFound: (resourceType: string) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
  setDarkMode: (dark: boolean) => void;
  setLiquidGlass: (glass: boolean) => void;
  setRgbCursorEnabled: (enabled: boolean) => void;
  setTextScale: (scale: 'sm' | 'md' | 'lg') => void;
  setIsUploadModalOpen: (open: boolean) => void;
  toggleSavedVideo: (videoId: string) => void;
  toggleFavoriteVideo: (videoId: string) => void;
  removeFavoriteVideo: (videoId: string) => boolean;
  addVideo: (video: Omit<VideoItem, 'id' | 'views' | 'likes' | 'createdAt'>) => Promise<string>;
  updateVideo: (id: string, updates: Partial<VideoItem>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<boolean>;
  toggleLikeVideo: (id: string) => Promise<{ status: 'liked' | 'max_reached'; count: number }>;
  removeLikeVideo: (id: string) => Promise<boolean>;
  toggleDislikeVideo: (id: string) => Promise<void>;
  removeDislikeVideo: (id: string) => Promise<boolean>;
  addCommunityPost: (input: {
    content: string;
    imageWebpUrl?: string;
    webpStats?: string;
  }) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<{ status: 'liked' | 'max_reached'; count: number }>;
  removeLikePost: (postId: string) => Promise<boolean>;
  toggleDislikePost: (postId: string) => Promise<void>;
  removeDislikePost: (postId: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<void>;
  addComment: (videoId: string, text: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleSubscription: (
    channelId: string,
    channelName: string,
    channelAvatar?: string
  ) => Promise<{ status: 'subscribed' | 'unsubscribed' | 'self_blocked' }>;
  removeSubscription: (channelId: string, channelName: string) => Promise<boolean>;
  updateSiteSettings: (updates: Partial<SiteSettings>) => Promise<void>;
  claimMonthlySubscriberDividend: () => Promise<number>;
  donateSubscriberCredits: (
    recipientUid: string,
    recipientName: string,
    amount: number,
    note: string
  ) => Promise<void>;
  purchaseAdCampaignWithCredits: (input: {
    title: string;
    sponsorName: string;
    ctaUrl: string;
    adLevel: AdLevelTier;
    costCredits: number;
  }) => Promise<void>;
  purchasePremiumSubscription: (tier: 'base' | 'plus') => Promise<void>;
  updateSubscriberCountForDemo: (newCount: number) => Promise<void>;
  logTelemetryEvent: (event: {
    eventType: string;
    component: string;
    latencyMs: number;
    compressionSavedKb: number;
    codec?: string;
    status: 'ok' | 'warn' | 'error';
    details: string;
  }) => Promise<void>;
  miniPlayerVideoId: string | null;
  setMiniPlayerVideoId: (id: string | null) => void;
  playerColorTheme: PlayerColorTheme;
  setPlayerColorTheme: (theme: PlayerColorTheme) => Promise<void>;
  dynamicBackgroundEnabled: boolean;
  setDynamicBackgroundEnabled: (enabled: boolean) => Promise<void>;
  dynamicBackgroundAudioReactive: boolean;
  setDynamicBackgroundAudioReactive: (enabled: boolean) => Promise<void>;
  dynamicBackgroundAutoDisabledReason: string | null;
  dynamicBackgroundEffectiveActive: boolean;
  publicHmacId: string;
  refreshPublicHmacId: () => Promise<void>;
  toggleUserIdentityOptIn: (optIn: boolean) => Promise<void>;
  togglePhoneVerifiedOptional: (verified: boolean) => Promise<void>;
  autoAwardCreatorVisitCredit: (
    video: VideoItem,
    dwellSeconds: number,
    hasRealInteraction: boolean
  ) => Promise<{ awarded: boolean; reason?: string; entry?: any }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [firestoreVideos, setFirestoreVideos] = useState<VideoItem[]>([]);
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaignItem[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransactionItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEventItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [missingResourceType, setMissingResourceType] = useState<string>('video');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Categories state (seeded with default rich categories, synchronized with Firestore)
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategoryState] = useState<string>(() => {
    try {
      const cookiePref = getCategoryCookie();
      return cookiePref?.selectedCategory || 'All';
    } catch {
      return 'All';
    }
  });

  // 2. Locational Algorithm state & Cookies
  const [userLocation, setUserLocationState] = useState<LocationCookiePayload>(() => {
    try {
      const savedLoc = getLocationCookie();
      if (savedLoc) return savedLoc;
      const detected = detectUserLocation();
      setLocationCookie(detected);
      return detected;
    } catch {
      return detectUserLocation();
    }
  });

  const [locationalAlgorithmEnabled, setLocationalAlgorithmEnabledState] = useState<boolean>(() => {
    try {
      const cookie = getLocationCookie();
      return cookie ? cookie.locationalAlgorithmEnabled : true;
    } catch {
      return true;
    }
  });

  const [locationAlgorithmMode, setLocationAlgorithmModeState] = useState<
    LocationCookiePayload['algorithmMode']
  >(() => {
    try {
      const cookie = getLocationCookie();
      return cookie ? cookie.algorithmMode : 'nearby_boost';
    } catch {
      return 'nearby_boost';
    }
  });

  // 3. Cookies Consent & Preferences state
  const [cookieConsent, setCookieConsentState] = useState<CookieConsentPreferences>(() => {
    try {
      return getCookieConsent();
    } catch {
      return DEFAULT_COOKIE_CONSENT;
    }
  });

  const [isCookieBannerOpen, setIsCookieBannerOpen] = useState<boolean>(() => {
    try {
      return !getCookie('ztube_cookie_consent');
    } catch {
      return false;
    }
  });

  const [isCookieSettingsModalOpen, setIsCookieSettingsModalOpen] = useState<boolean>(false);

  // Local storage for API Key & Age fallback
  const [localApiKey, setLocalApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('ztube_backend_api_key') || '';
    } catch {
      return '';
    }
  });
  const [localUserAge, setLocalUserAge] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('ztube_user_age') || 16);
    } catch {
      return 16;
    }
  });

  const [watchHistoryIds, setWatchHistoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ztube_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [watchHistoryEnabled, setWatchHistoryEnabledState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('ztube_watch_history_enabled');
      return raw === null ? true : raw === 'true';
    } catch {
      return true;
    }
  });

  const [playlists, setPlaylists] = useState<PlaylistItem[]>(() => {
    try {
      const saved = localStorage.getItem('ztube_playlists_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'pl_watch_queue',
        title: 'Watch Queue & Favorites Mix',
        description: 'Curated ZTube playlist for technical deep-dives, gaming sessions, and music.',
        ownerId: 'local_user',
        ownerName: 'You',
        videoIds: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pl_tutorials_study',
        title: 'Tutorials & Engineering Study',
        description: 'Saved coding tutorials, hardware teardowns, and architecture guides.',
        ownerId: 'local_user',
        ownerName: 'You',
        videoIds: [],
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  });
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // 1 View Per User tracking map: { [uid_or_device]: string[] }
  const [viewedByUserMap, setViewedByUserMap] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem('ztube_unique_views_per_user');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [savedVideoIds, setSavedVideoIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ztube_saved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteVideoIds, setFavoriteVideoIds] = useState<string[]>(() => {
    try {
      const fav = localStorage.getItem('ztube_favorites');
      return fav ? JSON.parse(fav) : [];
    } catch {
      return [];
    }
  });

  // Watch Later Hybrid State (localStorage + Firestore Dual-Sync)
  const [watchLaterEntries, setWatchLaterEntries] = useState<WatchLaterEntry[]>(() => {
    try {
      const raw = localStorage.getItem('ztube_watch_later_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate any legacy ztube_saved items into Watch Later on first load
      const legacySaved = localStorage.getItem('ztube_saved');
      if (legacySaved) {
        const ids: string[] = JSON.parse(legacySaved);
        if (Array.isArray(ids) && ids.length > 0) {
          const now = new Date().toISOString();
          return ids.map((videoId, idx) => ({
            videoId,
            addedAt: now,
            position: idx,
          }));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [autoRemoveWatchLaterOnFinish, setAutoRemoveWatchLaterOnFinishState] = useState<boolean>(
    () => {
      try {
        return localStorage.getItem('ztube_watch_later_auto_remove') === 'true';
      } catch {
        return false;
      }
    }
  );

  // Active Queue Playback State for Watch Later
  const [activeQueueMode, setActiveQueueMode] = useState<'off' | 'watch-later'>('off');
  const [queueShuffle, setQueueShuffle] = useState<boolean>(false);
  const [queueLoop, setQueueLoop] = useState<boolean>(false);
  const [activeQueueVideoIds, setActiveQueueVideoIds] = useState<string[]>([]);

  // Track how many times the current user has liked each video (1 max for Free/Base, 2 max for Plus)
  const [userLikesPerVideo, setUserLikesPerVideo] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('ztube_video_likes_map');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [userLikesPerPost, setUserLikesPerPost] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('ztube_post_likes_map');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [userDislikedVideoIds, setUserDislikedVideoIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('ztube_video_dislikes_list');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [userDislikedPostIds, setUserDislikedPostIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('ztube_post_dislikes_list');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [liquidGlass, setLiquidGlass] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ztube_liquid_glass') === 'true';
    } catch {
      return false;
    }
  });
  const [rgbCursorEnabled, setRgbCursorEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ztube_rgb_cursor') === 'true';
    } catch {
      return false;
    }
  });
  const [textScale, setTextScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [preselectedShortSoundId, setPreselectedShortSoundId] = useState<string | null>(null);
  const [miniPlayerVideoId, setMiniPlayerVideoId] = useState<string | null>(null);
  const [publicHmacId, setPublicHmacId] = useState<string>('v1_hmac_pending_derivation');
  const [localPlayerColorTheme, setLocalPlayerColorTheme] = useState<PlayerColorTheme>(() => {
    try {
      const saved = localStorage.getItem('ztube_player_color_theme') as PlayerColorTheme | null;
      if (saved === 'neon_green' || saved === 'sunset_red' || saved === 'midnight_blue') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'neon_green';
  });

  // Dynamic Background (default OFF) & Opt-In Audio-Reactive Mode (default OFF)
  const [localDynamicBgEnabled, setLocalDynamicBgEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ztube_dynamic_bg_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [localDynamicBgAudioReactive, setLocalDynamicBgAudioReactive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ztube_dynamic_bg_audio_reactive') === 'true';
    } catch {
      return false;
    }
  });
  const [dynamicBackgroundAutoDisabledReason, setDynamicBackgroundAutoDisabledReason] =
    useState<string | null>(null);

  // Detect Reduced Motion, Battery Saver / Low Battery, and Low-End Device hardware to auto-disable Dynamic Background
  useEffect(() => {
    let isMounted = true;
    let batteryCleanup: (() => void) | null = null;

    const evaluateEnvironmentGuards = (batteryState?: {
      charging: boolean;
      level: number;
    }) => {
      if (!isMounted) return;

      // 1. Reduced Motion check
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setDynamicBackgroundAutoDisabledReason(
          'Auto-disabled: Reduced motion preference is enabled (prefers-reduced-motion: reduce).'
        );
        return;
      }

      // 2. Network Data Saver / Battery Saver hint
      const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
        getBattery?: () => Promise<{
          charging: boolean;
          level: number;
          addEventListener: (ev: string, cb: () => void) => void;
          removeEventListener: (ev: string, cb: () => void) => void;
        }>;
      };

      if (nav.connection?.saveData) {
        setDynamicBackgroundAutoDisabledReason(
          'Auto-disabled: Browser Battery / Data Saver mode is active.'
        );
        return;
      }

      // 3. Battery Saver / Low Battery check (< 20% and discharging)
      if (batteryState && !batteryState.charging && batteryState.level <= 0.2) {
        setDynamicBackgroundAutoDisabledReason(
          `Auto-disabled: Battery saver / low battery (${Math.round(
            batteryState.level * 100
          )}% discharging).`
        );
        return;
      }

      // 4. Low-end device check (<= 2 logical cores or <= 2 GB RAM)
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;
      const memoryGb = nav.deviceMemory || 8;
      if (cores <= 2 || memoryGb <= 2) {
        setDynamicBackgroundAutoDisabledReason(
          `Auto-disabled: Low-end device hardware detected (${cores} cores, ${memoryGb}GB RAM).`
        );
        return;
      }

      setDynamicBackgroundAutoDisabledReason(null);
    };

    evaluateEnvironmentGuards();

    const mq =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    const onMqChange = () => evaluateEnvironmentGuards();
    if (mq && mq.addEventListener) {
      mq.addEventListener('change', onMqChange);
    }

    const navWithBattery = navigator as Navigator & {
      getBattery?: () => Promise<{
        charging: boolean;
        level: number;
        addEventListener: (ev: string, cb: () => void) => void;
        removeEventListener: (ev: string, cb: () => void) => void;
      }>;
    };

    if (typeof navWithBattery.getBattery === 'function') {
      navWithBattery
        .getBattery()
        .then((batt) => {
          if (!isMounted) return;
          const onBatteryUpdate = () =>
            evaluateEnvironmentGuards({ charging: batt.charging, level: batt.level });
          onBatteryUpdate();
          batt.addEventListener('levelchange', onBatteryUpdate);
          batt.addEventListener('chargingchange', onBatteryUpdate);
          batteryCleanup = () => {
            batt.removeEventListener('levelchange', onBatteryUpdate);
            batt.removeEventListener('chargingchange', onBatteryUpdate);
          };
        })
        .catch(() => {
          // ignore if Battery Status API unsupported
        });
    }

    return () => {
      isMounted = false;
      if (mq && mq.removeEventListener) {
        mq.removeEventListener('change', onMqChange);
      }
      if (batteryCleanup) batteryCleanup();
    };
  }, []);

  // Notification System State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem('ztube_notifications_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      {
        id: 'notif_welcome_1',
        title: 'Right-Click Removal & RGB Cursor Ready',
        message:
          'Right-click any Like, Dislike, Favorite, or Subscribe button to remove your entry. Toggle the Green/Blue/Red cursor in Settings.',
        kind: 'system',
        targetRoute: 'docs',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_shorts_audio_2',
        title: 'Shorts Sounds & Multi-Language Audio Active',
        message:
          'Press C on any video for Creator/AI Captions, switch Creator Audio Tracks in any language, or remix Shorts sounds.',
        kind: 'short_sound',
        targetRoute: 'shorts',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const pushNotification = (input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications((prev) => {
      const next: AppNotification[] = [
        {
          ...input,
          id: `ntf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 35);
      try {
        localStorage.setItem('ztube_notifications_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem('ztube_notifications_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem('ztube_notifications_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    try {
      localStorage.setItem('ztube_notifications_v1', JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  // Contextual, Non-Intrusive Accessible Tutorial State (stored locally, never nags after Skip)
  const [tutorialState, setTutorialState] = useState<TutorialState>(() => {
    try {
      const raw = localStorage.getItem('ztube_tutorial_state_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {
      status: 'unseen',
      stepIndex: 0,
      seenImportContextTip: false,
      seenWatchContextTip: false,
    };
  });

  const saveTutorialState = (updater: (prev: TutorialState) => TutorialState) => {
    setTutorialState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('ztube_tutorial_state_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const startTutorial = () => {
    saveTutorialState((prev) => ({ ...prev, status: 'active', stepIndex: 0 }));
  };

  const skipTutorial = () => {
    saveTutorialState((prev) => ({ ...prev, status: 'skipped' }));
  };

  const replayTutorial = () => {
    saveTutorialState(() => ({
      status: 'active',
      stepIndex: 0,
      seenImportContextTip: false,
      seenWatchContextTip: false,
    }));
  };

  const setTutorialStep = (step: number) => {
    saveTutorialState((prev) => ({ ...prev, stepIndex: Math.max(0, step) }));
  };

  const completeTutorial = () => {
    saveTutorialState((prev) => ({ ...prev, status: 'completed' }));
  };

  const dismissImportContextTip = () => {
    saveTutorialState((prev) => ({ ...prev, seenImportContextTip: true }));
  };

  const dismissWatchContextTip = () => {
    saveTutorialState((prev) => ({ ...prev, seenWatchContextTip: true }));
  };

  const setRgbCursorEnabled = (enabled: boolean) => {
    setRgbCursorEnabledState(enabled);
    try {
      localStorage.setItem('ztube_rgb_cursor', String(enabled));
    } catch {
      // ignore
    }
  };

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.email === 'eric.leslie.ford14@gmail.com';
  }, [user]);

  const userProfile = useMemo(() => {
    if (!user) return null;
    return allUsers.find((u) => u.uid === user.uid) || null;
  }, [user, allUsers]);

  const subscriberCredits = userProfile?.subscriberCredits ?? 0;
  const subscriptionTier: SubscriptionTier = userProfile?.subscriptionTier ?? 'free';
  const subscribersCount = userProfile?.subscribersCount ?? 0;
  const backendApiKey = userProfile?.apiKey || localApiKey;
  const userAge = userProfile?.userAge || localUserAge;

  const activeViewerKey = user?.uid || 'guest_viewer';
  const viewedVideoIdsByCurrentUser = viewedByUserMap[activeViewerKey] || [];

  /**
   * Personalized Taste & Recommendation Algorithm ("Algorithm to detect what you like and get what you like")
   * Computes real-time affinity weights from:
   * - Liked videos (+35 pts for matching category, +15 pts per matching tag, +20 pts for matching creator)
   * - Favorited (Heart) videos (+40 pts for matching category, +18 pts per matching tag)
   * - Watch History (+20 pts for matching category, +10 pts per matching tag)
   * - Subscribed Channels (+30 pts for matching creator)
   */
  const recommendedVideos = useMemo(() => {
    const catScores: Record<string, number> = {};
    const tagScores: Record<string, number> = {};
    const creatorScores: Record<string, number> = {};

    // 1. Analyze liked videos
    Object.entries(userLikesPerVideo).forEach(([vidId, count]) => {
      if (count <= 0) return;
      const v = firestoreVideos.find((item) => item.id === vidId);
      if (!v) return;
      catScores[v.category] = (catScores[v.category] || 0) + 35 * count;
      creatorScores[v.authorName.toLowerCase()] =
        (creatorScores[v.authorName.toLowerCase()] || 0) + 25 * count;
      (v.tags || []).forEach((t) => {
        const key = t.toLowerCase();
        tagScores[key] = (tagScores[key] || 0) + 15 * count;
      });
    });

    // 2. Analyze Heart Favorited videos
    favoriteVideoIds.forEach((vidId) => {
      const v = firestoreVideos.find((item) => item.id === vidId);
      if (!v) return;
      catScores[v.category] = (catScores[v.category] || 0) + 40;
      creatorScores[v.authorName.toLowerCase()] =
        (creatorScores[v.authorName.toLowerCase()] || 0) + 30;
      (v.tags || []).forEach((t) => {
        const key = t.toLowerCase();
        tagScores[key] = (tagScores[key] || 0) + 18;
      });
    });

    // 3. Analyze Watch History
    watchHistoryIds.forEach((vidId, idx) => {
      const v = firestoreVideos.find((item) => item.id === vidId);
      if (!v) return;
      const recencyBoost = Math.max(1, 5 - Math.floor(idx / 3));
      catScores[v.category] = (catScores[v.category] || 0) + 12 * recencyBoost;
      (v.tags || []).forEach((t) => {
        const key = t.toLowerCase();
        tagScores[key] = (tagScores[key] || 0) + 8 * recencyBoost;
      });
    });

    // 4. Analyze Subscribed Channels
    subscriptions.forEach((sub) => {
      creatorScores[sub.channelName.toLowerCase()] =
        (creatorScores[sub.channelName.toLowerCase()] || 0) + 35;
    });

    return firestoreVideos
      .map((v) => {
        let score = 10 + Math.min(25, v.views * 2 + v.likes * 5);
        const reasons: string[] = [];

        if (catScores[v.category]) {
          score += catScores[v.category];
          reasons.push(`Matches your ${v.category} interest`);
        }

        const creatorBoost = creatorScores[v.authorName.toLowerCase()];
        if (creatorBoost) {
          score += creatorBoost;
          reasons.push(`From ${v.authorName}`);
        }

        let matchedTagCount = 0;
        (v.tags || []).forEach((t) => {
          const tScore = tagScores[t.toLowerCase()];
          if (tScore) {
            score += tScore;
            matchedTagCount++;
          }
        });
        if (matchedTagCount > 0) {
          reasons.push(`${matchedTagCount} matching topic tag${matchedTagCount > 1 ? 's' : ''}`);
        }

        if (favoriteVideoIds.includes(v.id)) {
          score += 20;
          reasons.push('In your Heart Favorites');
        }

        if (reasons.length === 0) {
          reasons.push('Discovery match based on global engagement');
        }

        return {
          ...v,
          affinityScore: Math.min(99, Math.round(score)),
          affinityReasons: reasons.slice(0, 2),
        };
      })
      .sort((a, b) => b.affinityScore - a.affinityScore);
  }, [firestoreVideos, userLikesPerVideo, favoriteVideoIds, watchHistoryIds, subscriptions]);

  const categoryVideoCounts = useMemo(() => {
    const counts: Record<string, number> = { All: firestoreVideos.length };
    categories.forEach((c) => {
      counts[c.name] = firestoreVideos.filter(
        (v) => (v.category || '').toLowerCase() === c.name.toLowerCase()
      ).length;
    });
    return counts;
  }, [categories, firestoreVideos]);

  const locationalRankedVideos = useMemo(() => {
    return rankVideosWithLocationalAlgorithm(
      firestoreVideos,
      userLocation,
      locationalAlgorithmEnabled ? locationAlgorithmMode : 'standard'
    );
  }, [firestoreVideos, userLocation, locationalAlgorithmEnabled, locationAlgorithmMode]);

  // Listen to Categories collection in Firestore (with initial bootstrap seeding)
  useEffect(() => {
    const q = query(collection(db, 'categories'), where('displayOrder', '>=', 0));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          try {
            for (const cat of INITIAL_DEFAULT_CATEGORIES) {
              await setDoc(doc(db, 'categories', cat.id), cat).catch(() => {});
            }
          } catch {
            // ignore
          }
          return;
        }
        const loaded: CategoryItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<CategoryItem, 'id'>) });
        });
        loaded.sort((a, b) => a.displayOrder - b.displayOrder);
        setCategories(loaded);
      },
      (err) => {
        console.warn('Categories listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  const setSelectedCategory = (cat: string) => {
    const clean = String(cat || 'All').trim();
    setSelectedCategoryState(clean);
    try {
      setCategoryCookie({
        selectedCategory: clean,
        favoriteCategories: [],
        lastSelectedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  };

  const setUserLocation = (loc: LocationCookiePayload) => {
    setUserLocationState(loc);
    try {
      setLocationCookie(loc);
    } catch {
      // ignore
    }
  };

  const setUserLocationHub = (hubId: string) => {
    const targetHub =
      hubId === 'hub_global'
        ? WORLDWIDE_HUB
        : KNOWN_GEO_HUBS.find((h) => h.id === hubId) || KNOWN_GEO_HUBS[0];
    const updatedLoc: LocationCookiePayload = {
      ...userLocation,
      country: targetHub.country,
      countryCode: targetHub.countryCode,
      city: targetHub.city,
      region: targetHub.region,
      flag: targetHub.flag,
      latitude: targetHub.lat,
      longitude: targetHub.lng,
      autoDetected: false,
      updatedAt: new Date().toISOString(),
    };
    setUserLocation(updatedLoc);
  };

  const setLocationalAlgorithmEnabled = (enabled: boolean) => {
    const clean = Boolean(enabled);
    setLocationalAlgorithmEnabledState(clean);
    const updatedLoc: LocationCookiePayload = {
      ...userLocation,
      locationalAlgorithmEnabled: clean,
    };
    setUserLocation(updatedLoc);
  };

  const setLocationAlgorithmMode = (mode: LocationCookiePayload['algorithmMode']) => {
    setLocationAlgorithmModeState(mode);
    const updatedLoc: LocationCookiePayload = {
      ...userLocation,
      algorithmMode: mode,
    };
    setUserLocation(updatedLoc);
  };

  const updateCookieConsent = (prefs: Partial<CookieConsentPreferences>) => {
    const merged: CookieConsentPreferences = {
      ...cookieConsent,
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    setCookieConsentState(merged);
    setCookieConsent(merged);
    setIsCookieBannerOpen(false);
  };

  const addCategory = async (
    categoryInput: Omit<CategoryItem, 'id' | 'createdAt'>
  ): Promise<string> => {
    const slug = (
      categoryInput.slug ||
      categoryInput.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    ).slice(0, 60);
    const catId = `cat_${slug}`;
    const record: CategoryItem = {
      id: catId,
      slug,
      name: categoryInput.name.trim().slice(0, 60),
      icon: categoryInput.icon ? categoryInput.icon.slice(0, 10) : '📁',
      description: categoryInput.description
        ? categoryInput.description.trim().slice(0, 280)
        : `Videos in ${categoryInput.name}`,
      color: categoryInput.color || '#FF0033',
      displayOrder:
        typeof categoryInput.displayOrder === 'number'
          ? categoryInput.displayOrder
          : categories.length,
      videoCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'categories', catId), record);
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(() => {});
      return catId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${catId}`);
      return catId;
    }
  };

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      document.body.className =
        'bg-[#0F0F0F] text-[#F1F1F1] antialiased selection:bg-[#FF0033] selection:text-white';
    } else {
      html.classList.remove('dark');
      document.body.className =
        'bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-[#FF0033] selection:text-white';
    }
  }, [darkMode]);

  useEffect(() => {
    const html = document.documentElement;
    if (liquidGlass) {
      html.classList.add('liquid-glass-theme');
    } else {
      html.classList.remove('liquid-glass-theme');
    }
    try {
      localStorage.setItem('ztube_liquid_glass', String(liquidGlass));
    } catch {
      // ignore
    }
  }, [liquidGlass]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('text-scale-sm', 'text-scale-md', 'text-scale-lg');
    html.classList.add(`text-scale-${textScale}`);
  }, [textScale]);

  const refreshPublicHmacId = async () => {
    try {
      const res = await fetch('/api/identity/public-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'guest_session',
          email: user?.email || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.publicHmacId) {
          setPublicHmacId(data.publicHmacId);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshPublicHmacId();
  }, [user?.uid, user?.email]);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (u, token) => {
        setUser(u);
        setAccessToken(token);
        setAuthReady(true);

        try {
          let derivedHmac = '';
          try {
            const idRes = await fetch('/api/identity/public-id', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: u.uid, email: u.email || '' }),
            });
            if (idRes.ok) {
              const idData = await idRes.json();
              derivedHmac = idData.publicHmacId || '';
              if (derivedHmac) setPublicHmacId(derivedHmac);
            }
          } catch {
            // ignore
          }

          const userDocRef = doc(db, 'users', u.uid);
          const existingSnap = await getDoc(userDocRef).catch(() => null);
          if (!existingSnap || !existingSnap.exists()) {
            await setDoc(userDocRef, {
              uid: u.uid,
              ...(derivedHmac ? { publicHmacId: derivedHmac.slice(0, 115) } : {}),
              displayName: (u.displayName || u.email?.split('@')[0] || 'User').slice(0, 95),
              photoURL: (u.photoURL || '').slice(0, 480),
              role: u.email === 'eric.leslie.ford14@gmail.com' ? 'admin' : 'user',
              subscribersCount: 0,
              subscriberCredits: 0,
              subscriptionTier: 'free',
              identityOptIn: false,
              phoneVerifiedOptional: false,
              createdAt: new Date().toISOString(),
            });
          } else {
            await updateDoc(userDocRef, {
              ...(derivedHmac ? { publicHmacId: derivedHmac.slice(0, 115) } : {}),
              displayName: (u.displayName || u.email?.split('@')[0] || 'User').slice(0, 95),
              photoURL: (u.photoURL || '').slice(0, 480),
            });
          }
        } catch (err) {
          console.warn('Profile sync notice:', err);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setAuthReady(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to Users collection (Users start with 0 subscribers and 0 credits)
  useEffect(() => {
    const q = query(collection(db, 'users'), where('uid', '!=', ''));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: UserProfile[] = [];
        snap.forEach((d) => {
          const data = d.data();
          loaded.push({
            uid: data.uid || d.id,
            publicHmacId: data.publicHmacId,
            displayName: data.displayName || 'Creator',
            photoURL: data.photoURL,
            role: data.role === 'admin' ? 'admin' : 'user',
            subscribersCount: typeof data.subscribersCount === 'number' ? data.subscribersCount : 0,
            subscriberCredits: typeof data.subscriberCredits === 'number' ? data.subscriberCredits : 0,
            subscriptionTier:
              data.subscriptionTier === 'plus' || data.subscriptionTier === 'base'
                ? data.subscriptionTier
                : 'free',
            subscriptionExpiresAt: data.subscriptionExpiresAt,
            lastMonthlyDividendClaim: data.lastMonthlyDividendClaim,
            apiKey: data.apiKey,
            userAge: typeof data.userAge === 'number' ? data.userAge : 16,
            identityOptIn: Boolean(data.identityOptIn),
            phoneVerifiedOptional: Boolean(data.phoneVerifiedOptional),
            watchLaterJson: typeof data.watchLaterJson === 'string' ? data.watchLaterJson : undefined,
            autoRemoveWatchLaterOnFinish:
              typeof data.autoRemoveWatchLaterOnFinish === 'boolean'
                ? data.autoRemoveWatchLaterOnFinish
                : undefined,
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
        setAllUsers(loaded);
      },
      (err) => {
        console.warn('Users listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Ensure signed-in user document starts with 0 credits and 0 subscribers (never self-selected)
  useEffect(() => {
    if (!user || allUsers.length === 0) return;
    const found = allUsers.find((u) => u.uid === user.uid);
    if (!found) {
      setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          publicHmacId,
          displayName: (user.displayName || user.email?.split('@')[0] || 'Creator').slice(0, 95),
          photoURL: (user.photoURL || '').slice(0, 480),
          role: user.email === 'eric.leslie.ford14@gmail.com' ? 'admin' : 'user',
          subscribersCount: 0,
          subscriberCredits: 0,
          subscriptionTier: 'free',
          identityOptIn: false,
          phoneVerifiedOptional: false,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }
  }, [user, allUsers, publicHmacId]);

  // Listen to Videos collection
  useEffect(() => {
    const q = query(collection(db, 'videos'), where('views', '>=', 0));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: VideoItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<VideoItem, 'id'>) });
        });
        loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setFirestoreVideos(loaded);
      },
      (err) => {
        console.warn('Videos listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedVideoId && firestoreVideos.length > 0) {
      setSelectedVideoId(firestoreVideos[0].id);
    }
  }, [firestoreVideos, selectedVideoId]);

  // Listen to Community Posts collection
  useEffect(() => {
    const q = query(collection(db, 'posts'), where('likes', '>=', 0));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: CommunityPostItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<CommunityPostItem, 'id'>) });
        });
        loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setPosts(loaded);
      },
      (err) => {
        console.warn('Posts listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Listen to Comments collection (sort Priority Plus Member comments to the top!)
  useEffect(() => {
    const q = query(collection(db, 'comments'), where('likes', '>=', 0));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: CommentItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<CommentItem, 'id'>) });
        });
        loaded.sort((a, b) => {
          const aPri = a.isPriorityMember ? 1 : 0;
          const bPri = b.isPriorityMember ? 1 : 0;
          if (aPri !== bPri) return bPri - aPri;
          return b.createdAt.localeCompare(a.createdAt);
        });
        setComments(loaded);
      },
      (err) => {
        console.warn('Comments listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Listen to Ad Campaigns collection
  useEffect(() => {
    const q = query(collection(db, 'ad_campaigns'), where('impressions', '>=', 0));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: AdCampaignItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<AdCampaignItem, 'id'>) });
        });
        loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setAdCampaigns(loaded);
      },
      (err) => {
        console.warn('Ad campaigns listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Listen to Credit Transactions collection
  useEffect(() => {
    const q = query(collection(db, 'credit_transactions'), where('amount', '>=', 0));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: CreditTransactionItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<CreditTransactionItem, 'id'>) });
        });
        loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setCreditTransactions(loaded);
      },
      (err) => {
        console.warn('Credit transactions listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Listen to Telemetry Events collection
  useEffect(() => {
    const q = query(collection(db, 'telemetry_events'), where('latencyMs', '>=', 0));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: TelemetryEventItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<TelemetryEventItem, 'id'>) });
        });
        loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setTelemetryEvents(loaded);
      },
      (err) => {
        console.warn('Telemetry listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Listen to SiteSettings
  useEffect(() => {
    const docRef = doc(db, 'site_settings', 'global');
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setSiteSettings(snap.data() as SiteSettings);
        }
      },
      (err) => {
        console.warn('Site settings listener notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Listen to user's Subscriptions when authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setSubscriptions([]);
      return;
    }
    const q = query(collection(db, 'subscriptions'), where('subscriberId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: SubscriptionItem[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<SubscriptionItem, 'id'>) });
        });
        setSubscriptions(loaded);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'subscriptions');
      }
    );
    return () => unsub();
  }, [authReady, user]);

  const signIn = async () => {
    const res = await googleSignIn();
    if (res) {
      setUser(res.user);
      const tok = await getAccessToken();
      setAccessToken(tok);
    }
  };

  const signOutUser = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  const setBackendApiKeyAndAge = async (apiKey: string, age: number) => {
    const safeAge = Math.max(7, Math.round(age));
    setLocalApiKey(apiKey);
    setLocalUserAge(safeAge);
    try {
      localStorage.setItem('ztube_backend_api_key', apiKey);
      localStorage.setItem('ztube_user_age', String(safeAge));
    } catch {
      // ignore
    }
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          apiKey: apiKey.slice(0, 115),
          userAge: safeAge,
        });
      } catch (err) {
        console.warn('Could not persist API key to user profile:', err);
      }
    }
  };

  const recordCreditTransaction = async (tx: Omit<CreditTransactionItem, 'id' | 'createdAt'>) => {
    const txId = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      await setDoc(doc(db, 'credit_transactions', txId), {
        ...tx,
        amount: Math.max(0, Number(tx.amount.toFixed(4))),
        note: tx.note.slice(0, 290),
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Credit tx log notice:', err);
    }
  };

  const logTelemetryEvent = async (event: {
    eventType: string;
    component: string;
    latencyMs: number;
    compressionSavedKb: number;
    codec?: string;
    status: 'ok' | 'warn' | 'error';
    details: string;
  }) => {
    if (!user) return;
    const eventId = `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload: Omit<TelemetryEventItem, 'id'> = {
      eventType: event.eventType.slice(0, 60),
      component: event.component.slice(0, 60),
      latencyMs: Math.max(0, Number(event.latencyMs.toFixed(2))),
      compressionSavedKb: Math.max(0, Number(event.compressionSavedKb.toFixed(2))),
      ...(event.codec ? { codec: event.codec.slice(0, 58) } : {}),
      status: event.status,
      actorId: user.uid,
      details: event.details.slice(0, 480),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'telemetry_events', eventId), payload);
    } catch (err) {
      console.warn('Telemetry write skipped:', err);
    }
  };

  const setWatchHistoryEnabled = (enabled: boolean) => {
    const clean = Boolean(enabled);
    setWatchHistoryEnabledState(clean);
    try {
      localStorage.setItem('ztube_watch_history_enabled', String(clean));
    } catch {
      // ignore
    }
  };

  const clearWatchHistory = () => {
    setWatchHistoryIds([]);
    try {
      localStorage.setItem('ztube_history', JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  const removeFromWatchHistory = (videoId: string) => {
    setWatchHistoryIds((prev) => {
      const next = prev.filter((id) => id !== videoId);
      try {
        localStorage.setItem('ztube_history', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const createPlaylist = (
    title: string,
    description = '',
    isPublic = true,
    initialVideoId?: string
  ): string => {
    const cleanTitle = title.trim().slice(0, 80) || 'Untitled Playlist';
    const newId = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newPlaylist: PlaylistItem = {
      id: newId,
      title: cleanTitle,
      description: description.trim().slice(0, 240),
      ownerId: user?.uid || 'local_user',
      ownerName: user?.displayName || user?.email?.split('@')[0] || 'You',
      videoIds: initialVideoId ? [initialVideoId] : [],
      isPublic,
      createdAt: now,
      updatedAt: now,
    };
    setPlaylists((prev) => {
      const next = [newPlaylist, ...prev];
      try {
        localStorage.setItem('ztube_playlists_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlaylist),
    }).catch(() => {});
    return newId;
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== playlistId);
      try {
        localStorage.setItem('ztube_playlists_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
    }
  };

  const toggleVideoInPlaylist = (playlistId: string, videoId: string): boolean => {
    let added = false;
    setPlaylists((prev) => {
      const next = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.videoIds.includes(videoId);
        added = !exists;
        const nextIds = exists
          ? pl.videoIds.filter((id) => id !== videoId)
          : [...pl.videoIds, videoId];
        const updated = {
          ...pl,
          videoIds: nextIds,
          updatedAt: new Date().toISOString(),
        };
        fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {});
        return updated;
      });
      try {
        localStorage.setItem('ztube_playlists_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    return added;
  };

  const navigate = (route: PageRoute, videoId?: string, resourceType?: string) => {
    if (resourceType) {
      setMissingResourceType(resourceType);
    }
    if (videoId) {
      setSelectedVideoId(videoId);
      if (watchHistoryEnabled) {
        setWatchHistoryIds((prev) => {
          const next = [videoId, ...prev.filter((id) => id !== videoId)].slice(0, 50);
          localStorage.setItem('ztube_history', JSON.stringify(next));
          return next;
        });
      }
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerResourceNotFound = (resourceType: string) => {
    setMissingResourceType(resourceType);
    setCurrentRoute('not-found');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // O(1) Memoized Set Lookups for Watch Later, Saved, Favorites, and Watched Status
  const watchLaterVideoIds = useMemo(
    () => watchLaterEntries.map((entry) => entry.videoId),
    [watchLaterEntries]
  );

  const watchLaterSet = useMemo(() => new Set(watchLaterVideoIds), [watchLaterVideoIds]);
  const savedVideoSet = useMemo(() => new Set(savedVideoIds), [savedVideoIds]);
  const favoriteVideoSet = useMemo(() => new Set(favoriteVideoIds), [favoriteVideoIds]);
  const watchedVideoSet = useMemo(() => {
    const combined = new Set<string>(viewedVideoIdsByCurrentUser);
    for (const id of watchHistoryIds) {
      combined.add(id);
    }
    for (const entry of watchLaterEntries) {
      if (entry.watchedAt) {
        combined.add(entry.videoId);
      }
    }
    return combined;
  }, [viewedVideoIdsByCurrentUser, watchHistoryIds, watchLaterEntries]);

  const isVideoInWatchLater = React.useCallback(
    (videoId: string) => watchLaterSet.has(videoId),
    [watchLaterSet]
  );
  const isVideoSaved = React.useCallback(
    (videoId: string) => savedVideoSet.has(videoId),
    [savedVideoSet]
  );
  const isVideoFavorited = React.useCallback(
    (videoId: string) => favoriteVideoSet.has(videoId),
    [favoriteVideoSet]
  );
  const isVideoWatched = React.useCallback(
    (videoId: string) => watchedVideoSet.has(videoId),
    [watchedVideoSet]
  );

  // Sync helper to persist Watch Later entries to localStorage + Firestore (if signed in)
  const persistWatchLaterEntries = React.useCallback(
    (nextEntries: WatchLaterEntry[], autoRemoveOverride?: boolean) => {
      const normalized = nextEntries
        .slice(0, 250)
        .map((item, idx) => ({
          videoId: item.videoId,
          addedAt: item.addedAt || new Date().toISOString(),
          position: idx,
          ...(item.watchedAt ? { watchedAt: item.watchedAt } : {}),
        }));
      try {
        localStorage.setItem('ztube_watch_later_v1', JSON.stringify(normalized));
        localStorage.setItem(
          'ztube_saved',
          JSON.stringify(normalized.map((item) => item.videoId))
        );
      } catch {
        // ignore
      }
      setSavedVideoIds(normalized.map((item) => item.videoId));

      if (user) {
        const serialized = JSON.stringify(normalized).slice(0, 58000);
        updateDoc(doc(db, 'users', user.uid), {
          watchLaterJson: serialized,
          ...(typeof autoRemoveOverride === 'boolean'
            ? { autoRemoveWatchLaterOnFinish: autoRemoveOverride }
            : {}),
        }).catch(() => {});
      }
    },
    [user]
  );

  // Reconcile Firestore userProfile.watchLaterJson when signing in or syncing across sessions
  const hydratedWatchLaterUidRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!user || !userProfile) {
      hydratedWatchLaterUidRef.current = null;
      return;
    }
    if (hydratedWatchLaterUidRef.current === user.uid) return;
    hydratedWatchLaterUidRef.current = user.uid;

    if (typeof userProfile.autoRemoveWatchLaterOnFinish === 'boolean') {
      setAutoRemoveWatchLaterOnFinishState(userProfile.autoRemoveWatchLaterOnFinish);
      try {
        localStorage.setItem(
          'ztube_watch_later_auto_remove',
          String(userProfile.autoRemoveWatchLaterOnFinish)
        );
      } catch {
        // ignore
      }
    }

    if (userProfile.watchLaterJson) {
      try {
        const remoteEntries = JSON.parse(userProfile.watchLaterJson) as WatchLaterEntry[];
        if (Array.isArray(remoteEntries)) {
          setWatchLaterEntries((localPrev) => {
            const mergedMap = new Map<string, WatchLaterEntry>();
            for (const rem of remoteEntries) {
              if (rem && typeof rem.videoId === 'string') {
                mergedMap.set(rem.videoId, rem);
              }
            }
            for (const loc of localPrev) {
              if (loc && typeof loc.videoId === 'string' && !mergedMap.has(loc.videoId)) {
                mergedMap.set(loc.videoId, loc);
              }
            }
            const merged = Array.from(mergedMap.values()).map((item, idx) => ({
              ...item,
              position: idx,
            }));
            try {
              localStorage.setItem('ztube_watch_later_v1', JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
        }
      } catch {
        // ignore malformed json
      }
    } else if (watchLaterEntries.length > 0) {
      // Push existing local Watch Later entries to Firestore on initial login
      persistWatchLaterEntries(watchLaterEntries);
    }
  }, [user, userProfile, persistWatchLaterEntries, watchLaterEntries]);

  const toggleWatchLater = React.useCallback(
    (videoId: string): boolean => {
      let added = false;
      setWatchLaterEntries((prev) => {
        const exists = prev.some((item) => item.videoId === videoId);
        added = !exists;
        const next = exists
          ? prev.filter((item) => item.videoId !== videoId)
          : [
              {
                videoId,
                addedAt: new Date().toISOString(),
                position: 0,
              },
              ...prev,
            ];
        const normalized = next.map((item, idx) => ({ ...item, position: idx }));
        persistWatchLaterEntries(normalized);
        return normalized;
      });
      return added;
    },
    [persistWatchLaterEntries]
  );

  const removeFromWatchLater = React.useCallback(
    (videoId: string): boolean => {
      if (!watchLaterSet.has(videoId)) return false;
      setWatchLaterEntries((prev) => {
        const next = prev
          .filter((item) => item.videoId !== videoId)
          .map((item, idx) => ({ ...item, position: idx }));
        persistWatchLaterEntries(next);
        return next;
      });
      setActiveQueueVideoIds((prev) => prev.filter((id) => id !== videoId));
      return true;
    },
    [watchLaterSet, persistWatchLaterEntries]
  );

  const reorderWatchLater = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      setWatchLaterEntries((prev) => {
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex >= prev.length ||
          fromIndex === toIndex
        ) {
          return prev;
        }
        const copy = [...prev];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        const normalized = copy.map((item, idx) => ({ ...item, position: idx }));
        persistWatchLaterEntries(normalized);
        return normalized;
      });
    },
    [persistWatchLaterEntries]
  );

  const moveWatchLaterItemToPosition = React.useCallback(
    (videoId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      setWatchLaterEntries((prev) => {
        const idx = prev.findIndex((item) => item.videoId === videoId);
        if (idx === -1) return prev;
        let targetIdx = idx;
        if (direction === 'up') targetIdx = Math.max(0, idx - 1);
        else if (direction === 'down') targetIdx = Math.min(prev.length - 1, idx + 1);
        else if (direction === 'top') targetIdx = 0;
        else if (direction === 'bottom') targetIdx = prev.length - 1;
        if (targetIdx === idx) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(idx, 1);
        copy.splice(targetIdx, 0, moved);
        const normalized = copy.map((item, i) => ({ ...item, position: i }));
        persistWatchLaterEntries(normalized);
        return normalized;
      });
    },
    [persistWatchLaterEntries]
  );

  const removeWatchedFromWatchLater = React.useCallback((): number => {
    let removedCount = 0;
    setWatchLaterEntries((prev) => {
      const remaining = prev.filter((item) => {
        const isWatched = watchedVideoSet.has(item.videoId) || Boolean(item.watchedAt);
        if (isWatched) {
          removedCount++;
          return false;
        }
        return true;
      });
      const normalized = remaining.map((item, idx) => ({ ...item, position: idx }));
      persistWatchLaterEntries(normalized);
      return normalized;
    });
    return removedCount;
  }, [watchedVideoSet, persistWatchLaterEntries]);

  const clearWatchLater = React.useCallback(() => {
    setWatchLaterEntries([]);
    setActiveQueueVideoIds([]);
    setActiveQueueMode('off');
    persistWatchLaterEntries([]);
  }, [persistWatchLaterEntries]);

  const setAutoRemoveWatchLaterOnFinish = React.useCallback(
    (enabled: boolean) => {
      const clean = Boolean(enabled);
      setAutoRemoveWatchLaterOnFinishState(clean);
      try {
        localStorage.setItem('ztube_watch_later_auto_remove', String(clean));
      } catch {
        // ignore
      }
      if (user) {
        updateDoc(doc(db, 'users', user.uid), {
          autoRemoveWatchLaterOnFinish: clean,
        }).catch(() => {});
      }
    },
    [user]
  );

  const startWatchLaterQueue = React.useCallback(
    (shuffle = false, startVideoId?: string, customVideoIds?: string[]) => {
      const baseIds =
        customVideoIds && customVideoIds.length > 0
          ? [...customVideoIds]
          : watchLaterEntries.map((e) => e.videoId);
      if (baseIds.length === 0) return;

      let orderedIds = [...baseIds];
      if (shuffle) {
        for (let i = orderedIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [orderedIds[i], orderedIds[j]] = [orderedIds[j], orderedIds[i]];
        }
        if (startVideoId && orderedIds.includes(startVideoId)) {
          orderedIds = [startVideoId, ...orderedIds.filter((id) => id !== startVideoId)];
        }
      } else if (startVideoId && orderedIds.includes(startVideoId)) {
        const idx = orderedIds.indexOf(startVideoId);
        orderedIds = [...orderedIds.slice(idx), ...orderedIds.slice(0, idx)];
      }

      setQueueShuffle(shuffle);
      setActiveQueueMode('watch-later');
      setActiveQueueVideoIds(orderedIds);
      const firstId = orderedIds[0];
      if (firstId) {
        setSelectedVideoId(firstId);
        setCurrentRoute('watch');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [watchLaterEntries]
  );

  const handleVideoPlaybackEnded = React.useCallback(
    (videoId: string) => {
      const wasInWatchLater = watchLaterSet.has(videoId);
      const currentQueueList =
        activeQueueVideoIds.length > 0 ? activeQueueVideoIds : watchLaterVideoIds;
      const currentIndex = currentQueueList.indexOf(videoId);

      // Determine next video in queue before potential removal
      let nextVideoId: string | null = null;
      if (activeQueueMode === 'watch-later' && currentQueueList.length > 0) {
        if (currentIndex !== -1 && currentIndex + 1 < currentQueueList.length) {
          nextVideoId = currentQueueList[currentIndex + 1];
        } else if (queueLoop && currentQueueList.length > 1) {
          nextVideoId = currentQueueList[0];
        }
      }

      if (wasInWatchLater) {
        if (autoRemoveWatchLaterOnFinish) {
          setWatchLaterEntries((prev) => {
            const next = prev
              .filter((item) => item.videoId !== videoId)
              .map((item, idx) => ({ ...item, position: idx }));
            persistWatchLaterEntries(next);
            return next;
          });
          setActiveQueueVideoIds((prev) => prev.filter((id) => id !== videoId));
          const finishedVideo = firestoreVideos.find((v) => v.id === videoId);
          pushNotification({
            title: 'Auto-Removed from Watch Later',
            message: `"${
              finishedVideo?.title || 'Finished video'
            }" was completed and automatically removed from your Watch Later queue.`,
            kind: 'video',
            targetRoute: 'watch-later',
          });
        } else {
          // Mark watched timestamp on the WatchLaterEntry
          setWatchLaterEntries((prev) => {
            const next = prev.map((item) =>
              item.videoId === videoId
                ? { ...item, watchedAt: item.watchedAt || new Date().toISOString() }
                : item
            );
            persistWatchLaterEntries(next);
            return next;
          });
        }
      }

      if (nextVideoId && nextVideoId !== videoId) {
        setSelectedVideoId(nextVideoId);
        setCurrentRoute('watch');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [
      watchLaterSet,
      activeQueueVideoIds,
      watchLaterVideoIds,
      activeQueueMode,
      queueLoop,
      autoRemoveWatchLaterOnFinish,
      persistWatchLaterEntries,
      firestoreVideos,
    ]
  );

  const toggleSavedVideo = React.useCallback(
    (videoId: string) => {
      toggleWatchLater(videoId);
    },
    [toggleWatchLater]
  );

  const toggleFavoriteVideo = React.useCallback((videoId: string) => {
    setFavoriteVideoIds((prev) => {
      const exists = prev.includes(videoId);
      const next = exists ? prev.filter((id) => id !== videoId) : [videoId, ...prev];
      localStorage.setItem('ztube_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavoriteVideo = React.useCallback(
    (videoId: string): boolean => {
      if (!favoriteVideoSet.has(videoId)) return false;
      setFavoriteVideoIds((prev) => {
        const next = prev.filter((id) => id !== videoId);
        localStorage.setItem('ztube_favorites', JSON.stringify(next));
        return next;
      });
      return true;
    },
    [favoriteVideoSet]
  );

  const addVideo = async (
    input: Omit<VideoItem, 'id' | 'views' | 'likes' | 'createdAt'>
  ): Promise<string> => {
    const startTime = performance.now();
    let activeUser = user;
    if (!activeUser) {
      const res = await googleSignIn();
      if (res) {
        activeUser = res.user;
        setUser(res.user);
      }
    }
    if (!activeUser) throw new Error('Please sign in with Google to publish or sync videos.');

    // Enforce 4-minute (240 seconds) maximum limit for Shorts
    if (input.isShort) {
      const totalSeconds = parseDurationToSeconds(input.duration || '0:45');
      if (totalSeconds > 240) {
        throw new Error(
          `Shorts are strictly limited to 4 minutes (04:00 max). This clip is ${input.duration} (${totalSeconds}s). Please trim duration to ≤ 04:00 or switch to Widescreen Video.`
        );
      }
    }

    const newId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanTags = (input.tags || [])
      .map((t) => String(t).trim().slice(0, 45))
      .filter((t) => t.length > 0)
      .slice(0, 10);
    const cleanPublicHmac = (publicHmacId || '').trim().slice(0, 115);

    const payload: Omit<VideoItem, 'id'> = {
      title: (input.title.trim() || 'Untitled Video').slice(0, 155),
      description: (input.description || '').trim().slice(0, 3900),
      thumbnailUrl: (input.thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80').slice(0, 740000),
      videoUrl: (input.videoUrl.trim() || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4').slice(0, 580),
      ...(input.youtubeId ? { youtubeId: input.youtubeId.trim().slice(0, 60) } : {}),
      category: (input.category || 'Engineering').trim().slice(0, 60),
      tags: cleanTags,
      duration: (input.duration || '00:45').trim().slice(0, 18),
      views: 0,
      likes: 0,
      dislikes: 0,
      isShort: Boolean(input.isShort),
      isMemberOnly: Boolean(input.isMemberOnly),
      memberCreditsEarned: 0,
      minAgeRating: Math.max(7, Math.min(21, Number(input.minAgeRating || 7))),
      ...(input.aiSafetyNote ? { aiSafetyNote: input.aiSafetyNote.trim().slice(0, 380) } : {}),
      isVolumetricVr: Boolean(input.isVolumetricVr),
      serverDownloadedTranscoded: Boolean(input.serverDownloadedTranscoded),
      ...(input.captionTracksJson
        ? { captionTracksJson: input.captionTracksJson.slice(0, 11800) }
        : {}),
      ...(input.audioTracksJson
        ? { audioTracksJson: input.audioTracksJson.slice(0, 11800) }
        : {}),
      ...(input.shortSoundId ? { shortSoundId: input.shortSoundId.slice(0, 75) } : {}),
      ...(input.shortSoundTitle ? { shortSoundTitle: input.shortSoundTitle.slice(0, 115) } : {}),
      ...(input.shortSoundArtist ? { shortSoundArtist: input.shortSoundArtist.slice(0, 95) } : {}),
      creatorIdentityDetectionOptIn: Boolean(input.creatorIdentityDetectionOptIn),
      ...(input.creatorCastCredits
        ? { creatorCastCredits: input.creatorCastCredits.trim().slice(0, 580) }
        : {}),
      authorId: activeUser.uid,
      ...(cleanPublicHmac ? { authorPublicHmacId: cleanPublicHmac } : {}),
      authorName: (
        input.authorName?.trim() ||
        activeUser.displayName ||
        activeUser.email?.split('@')[0] ||
        'Authenticated User'
      ).slice(0, 95),
      ...(activeUser.photoURL ? { authorAvatar: activeUser.photoURL.slice(0, 480) } : {}),
      ...(input.locationTag ? { locationTag: input.locationTag.trim().slice(0, 140) } : {}),
      ...(input.compressionCodec
        ? { compressionCodec: input.compressionCodec.trim().slice(0, 75) }
        : {}),
      ...(input.compressionRatio
        ? { compressionRatio: input.compressionRatio.trim().slice(0, 75) }
        : {}),
      ...(typeof input.originalSizeMb === 'number' && !Number.isNaN(input.originalSizeMb)
        ? { originalSizeMb: Math.max(0, input.originalSizeMb) }
        : {}),
      ...(typeof input.compressedSizeMb === 'number' && !Number.isNaN(input.compressedSizeMb)
        ? { compressedSizeMb: Math.max(0, input.compressedSizeMb) }
        : {}),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'videos', newId), payload);
      pushNotification({
        title: payload.isShort ? 'New Short Published' : 'New Video Published',
        message: `"${payload.title}" is now live under channel ${payload.authorName}.`,
        kind: payload.isShort ? 'short_sound' : 'video',
        targetRoute: payload.isShort ? 'shorts' : 'watch',
        targetVideoId: newId,
      });
      const savedKb =
        payload.originalSizeMb && payload.compressedSizeMb
          ? Math.max(0, (payload.originalSizeMb - payload.compressedSizeMb) * 1024)
          : 540;
      await logTelemetryEvent({
        eventType: payload.isShort ? 'SHORT_AV1_WEBM_INGEST' : 'VIDEO_AV1_WEBM_INGEST',
        component: payload.serverDownloadedTranscoded
          ? 'YouTube_Server_Downloader_AV1_Transcoder'
          : 'YouTube_AV1_WebM_Pipeline',
        latencyMs: performance.now() - startTime,
        compressionSavedKb: savedKb,
        codec: payload.compressionCodec || 'AV1 WebM + WebP',
        status: 'ok',
        details: `Published "${payload.title}" [Age ${payload.minAgeRating}+] ${
          payload.serverDownloadedTranscoded ? '[Server Downloaded & Converted from YT]' : ''
        }`,
      });
      return newId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `videos/${newId}`);
    }
  };

  const updateVideo = async (id: string, updates: Partial<VideoItem>) => {
    const existing = firestoreVideos.find((v) => v.id === id);
    if (!existing) return;

    const merged = {
      ...existing,
      ...updates,
    };
    const { id: _unused, ...docData } = merged;

    try {
      await setDoc(doc(db, 'videos', id), docData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `videos/${id}`);
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `videos/${id}`);
    }
  };

  /**
   * 1 View Per User Enforcement:
   * Checks if the current user has already viewed this video.
   * Only increments the view count (and pays +0.001 Subscriber Credits on Member-Only videos)
   * on the user's FIRST view!
   */
  const incrementViews = async (id: string): Promise<boolean> => {
    const viewerKey = user?.uid || 'guest_viewer';
    const alreadyViewedList = viewedByUserMap[viewerKey] || [];
    if (alreadyViewedList.includes(id)) {
      return false; // Already counted 1 view for this user!
    }

    const updatedList = [...alreadyViewedList, id];
    setViewedByUserMap((prev) => {
      const nextMap = { ...prev, [viewerKey]: updatedList };
      try {
        localStorage.setItem('ztube_unique_views_per_user', JSON.stringify(nextMap));
      } catch {
        // ignore
      }
      return nextMap;
    });

    if (!user) return false;
    const existing = firestoreVideos.find((v) => v.id === id);
    if (!existing) return false;
    try {
      const isMemberVid = Boolean(existing.isMemberOnly);
      const newEarned = Number(
        ((existing.memberCreditsEarned || 0) + (isMemberVid ? 0.001 : 0)).toFixed(4)
      );

      await updateDoc(doc(db, 'videos', id), {
        views: existing.views + 1,
        ...(isMemberVid ? { memberCreditsEarned: newEarned } : {}),
      });

      if (isMemberVid) {
        const creatorUser = allUsers.find((u) => u.uid === existing.authorId);
        if (creatorUser) {
          const updatedCreatorCredits = Number((creatorUser.subscriberCredits + 0.001).toFixed(4));
          await updateDoc(doc(db, 'users', creatorUser.uid), {
            subscriberCredits: updatedCreatorCredits,
          });
          await recordCreditTransaction({
            fromUid: user.uid,
            fromName: user.displayName || 'Plus Viewer',
            toUid: creatorUser.uid,
            toName: creatorUser.displayName,
            amount: 0.001,
            txType: 'member_video_payout',
            note: `+0.001 Subscriber Credit royalty for unique Member-Only view on "${existing.title}"`,
          });
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Like Cap Enforcement:
   * - Free & Base users can only like a video ONCE (maxLikes = 1)
   * - Plus subscribers can like a video TWICE (Double-Like power, maxLikes = 2)
   */
  const toggleLikeVideo = async (
    id: string
  ): Promise<{ status: 'liked' | 'max_reached'; count: number }> => {
    if (!user) {
      navigate('auth');
      return { status: 'max_reached', count: 0 };
    }
    const existing = firestoreVideos.find((v) => v.id === id);
    if (!existing) return { status: 'max_reached', count: 0 };

    const maxAllowedLikes = subscriptionTier === 'plus' ? 2 : 1;
    const currentLikesByUser = userLikesPerVideo[id] || 0;

    if (currentLikesByUser >= maxAllowedLikes) {
      return { status: 'max_reached', count: currentLikesByUser };
    }

    const nextCount = currentLikesByUser + 1;
    setUserLikesPerVideo((prev) => {
      const updated = { ...prev, [id]: nextCount };
      localStorage.setItem('ztube_video_likes_map', JSON.stringify(updated));
      return updated;
    });

    try {
      await updateDoc(doc(db, 'videos', id), {
        likes: existing.likes + 1,
      });
      return { status: 'liked', count: nextCount };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `videos/${id}`);
    }
  };

  /**
   * Right-Click on Like button removes the user's entered like(s)
   */
  const removeLikeVideo = async (id: string): Promise<boolean> => {
    const currentLikesByUser = userLikesPerVideo[id] || 0;
    if (currentLikesByUser <= 0) return false;

    const existing = firestoreVideos.find((v) => v.id === id);
    setUserLikesPerVideo((prev) => {
      const updated = { ...prev };
      delete updated[id];
      localStorage.setItem('ztube_video_likes_map', JSON.stringify(updated));
      return updated;
    });

    if (existing && user) {
      try {
        await updateDoc(doc(db, 'videos', id), {
          likes: Math.max(0, existing.likes - currentLikesByUser),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `videos/${id}`);
      }
    }
    return true;
  };

  const toggleDislikeVideo = async (id: string) => {
    if (!user) {
      navigate('auth');
      return;
    }
    const existing = firestoreVideos.find((v) => v.id === id);
    if (!existing) return;
    if (userDislikedVideoIds.includes(id)) return;

    setUserDislikedVideoIds((prev) => {
      const next = [...prev, id];
      localStorage.setItem('ztube_video_dislikes_list', JSON.stringify(next));
      return next;
    });

    try {
      await updateDoc(doc(db, 'videos', id), {
        dislikes: (existing.dislikes || 0) + 1,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `videos/${id}`);
    }
  };

  /**
   * Right-Click on Dislike button removes the user's entered dislike
   */
  const removeDislikeVideo = async (id: string): Promise<boolean> => {
    if (!userDislikedVideoIds.includes(id)) return false;
    setUserDislikedVideoIds((prev) => {
      const next = prev.filter((item) => item !== id);
      localStorage.setItem('ztube_video_dislikes_list', JSON.stringify(next));
      return next;
    });

    const existing = firestoreVideos.find((v) => v.id === id);
    if (existing && user) {
      try {
        await updateDoc(doc(db, 'videos', id), {
          dislikes: Math.max(0, (existing.dislikes || 0) - 1),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `videos/${id}`);
      }
    }
    return true;
  };

  const addCommunityPost = async (input: {
    content: string;
    imageWebpUrl?: string;
    webpStats?: string;
  }) => {
    const startTime = performance.now();
    const activeUser = user;
    if (!activeUser) {
      navigate('auth');
      return;
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload: Omit<CommunityPostItem, 'id'> = {
      authorId: activeUser.uid,
      authorName: (activeUser.displayName || activeUser.email?.split('@')[0] || 'Creator').slice(
        0,
        95
      ),
      ...(activeUser.photoURL ? { authorAvatar: activeUser.photoURL.slice(0, 480) } : {}),
      content: input.content.trim().slice(0, 2450),
      ...(input.imageWebpUrl ? { imageWebpUrl: input.imageWebpUrl.slice(0, 740000) } : {}),
      ...(input.webpStats ? { webpStats: input.webpStats.slice(0, 115) } : {}),
      likes: 0,
      dislikes: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'posts', postId), payload);
      await logTelemetryEvent({
        eventType: 'COMMUNITY_POST_WEBP',
        component: 'CommunityPostEngine',
        latencyMs: performance.now() - startTime,
        compressionSavedKb: input.imageWebpUrl ? 215.4 : 12.0,
        codec: 'WebP Lossy/Perceptual Quantizer',
        status: 'ok',
        details: `Published community post ${input.webpStats ? `(${input.webpStats})` : ''}`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `posts/${postId}`);
    }
  };

  const toggleLikePost = async (
    postId: string
  ): Promise<{ status: 'liked' | 'max_reached'; count: number }> => {
    if (!user) {
      navigate('auth');
      return { status: 'max_reached', count: 0 };
    }
    const existing = posts.find((p) => p.id === postId);
    if (!existing) return { status: 'max_reached', count: 0 };

    const maxAllowedLikes = subscriptionTier === 'plus' ? 2 : 1;
    const currentLikes = userLikesPerPost[postId] || 0;
    if (currentLikes >= maxAllowedLikes) {
      return { status: 'max_reached', count: currentLikes };
    }

    const nextCount = currentLikes + 1;
    setUserLikesPerPost((prev) => {
      const updated = { ...prev, [postId]: nextCount };
      localStorage.setItem('ztube_post_likes_map', JSON.stringify(updated));
      return updated;
    });

    try {
      await updateDoc(doc(db, 'posts', postId), {
        likes: existing.likes + 1,
      });
      return { status: 'liked', count: nextCount };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const removeLikePost = async (postId: string): Promise<boolean> => {
    const currentLikes = userLikesPerPost[postId] || 0;
    if (currentLikes <= 0) return false;
    setUserLikesPerPost((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      localStorage.setItem('ztube_post_likes_map', JSON.stringify(updated));
      return updated;
    });
    const existing = posts.find((p) => p.id === postId);
    if (existing && user) {
      try {
        await updateDoc(doc(db, 'posts', postId), {
          likes: Math.max(0, existing.likes - currentLikes),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
      }
    }
    return true;
  };

  const toggleDislikePost = async (postId: string) => {
    if (!user) {
      navigate('auth');
      return;
    }
    const existing = posts.find((p) => p.id === postId);
    if (!existing) return;
    if (userDislikedPostIds.includes(postId)) return;
    setUserDislikedPostIds((prev) => {
      const next = [...prev, postId];
      localStorage.setItem('ztube_post_dislikes_list', JSON.stringify(next));
      return next;
    });
    try {
      await updateDoc(doc(db, 'posts', postId), {
        dislikes: existing.dislikes + 1,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const removeDislikePost = async (postId: string): Promise<boolean> => {
    if (!userDislikedPostIds.includes(postId)) return false;
    setUserDislikedPostIds((prev) => {
      const next = prev.filter((id) => id !== postId);
      localStorage.setItem('ztube_post_dislikes_list', JSON.stringify(next));
      return next;
    });
    const existing = posts.find((p) => p.id === postId);
    if (existing && user) {
      try {
        await updateDoc(doc(db, 'posts', postId), {
          dislikes: Math.max(0, existing.dislikes - 1),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
      }
    }
    return true;
  };

  const deletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const addComment = async (videoId: string, text: string) => {
    if (!user) {
      navigate('auth');
      return;
    }
    const cleanText = text.trim().slice(0, 1450);
    if (!cleanText) return;

    const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isPriority = subscriptionTier === 'plus';
    const payload: Omit<CommentItem, 'id'> = {
      videoId,
      authorId: user.uid,
      authorName: (user.displayName || user.email?.split('@')[0] || 'User').slice(0, 95),
      ...(user.photoURL ? { authorAvatar: user.photoURL.slice(0, 480) } : {}),
      text: cleanText,
      likes: 0,
      isPriorityMember: isPriority,
      memberTier: subscriptionTier,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'comments', commentId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `comments/${commentId}`);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  /**
   * Self-Subscription Prevention:
   * Users cannot subscribe to their own channel (enforced both here in client logic and in firestore.rules)
   */
  const toggleSubscription = async (
    channelId: string,
    channelName: string,
    channelAvatar?: string
  ): Promise<{ status: 'subscribed' | 'unsubscribed' | 'self_blocked' }> => {
    if (!user) {
      navigate('auth');
      return { status: 'self_blocked' };
    }
    const userDisplayLower = (user.displayName || '').trim().toLowerCase();
    if (
      channelId === user.uid ||
      (userDisplayLower && channelName.trim().toLowerCase() === userDisplayLower)
    ) {
      return { status: 'self_blocked' };
    }

    const cleanChannelId = channelId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const subId = `${user.uid}_${cleanChannelId}`.slice(0, 120);
    const existing = subscriptions.find((s) => s.id === subId || s.channelId === cleanChannelId);

    try {
      if (existing) {
        await deleteDoc(doc(db, 'subscriptions', existing.id));
        return { status: 'unsubscribed' };
      } else {
        await setDoc(doc(db, 'subscriptions', subId), {
          subscriberId: user.uid,
          channelId: cleanChannelId,
          channelName: channelName.slice(0, 95),
          ...(channelAvatar ? { channelAvatar: channelAvatar.slice(0, 480) } : {}),
          createdAt: new Date().toISOString(),
        });
        pushNotification({
          title: `Subscribed to ${channelName}`,
          message: `You are now subscribed to ${channelName}. Right-click the Subscribe button anytime to remove your subscription.`,
          kind: 'video',
          targetRoute: 'subscriptions',
        });
        return { status: 'subscribed' };
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `subscriptions/${subId}`);
    }
  };

  /**
   * Right-Click on Subscribe button removes the subscription if subscribed
   */
  const removeSubscription = async (
    channelId: string,
    channelName: string
  ): Promise<boolean> => {
    if (!user) return false;
    const cleanChannelId = channelId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const subId = `${user.uid}_${cleanChannelId}`.slice(0, 120);
    const existing = subscriptions.find(
      (s) =>
        s.id === subId ||
        s.channelId === cleanChannelId ||
        s.channelName.toLowerCase() === channelName.toLowerCase()
    );
    if (!existing) return false;
    try {
      await deleteDoc(doc(db, 'subscriptions', existing.id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `subscriptions/${existing.id}`);
    }
  };

  const claimMonthlySubscriberDividend = async (): Promise<number> => {
    if (!user || !userProfile) {
      navigate('auth');
      return 0;
    }
    const subCount = Math.max(100, userProfile.subscribersCount || 100);
    const dividend = Number(((subCount / 100) * 0.1).toFixed(3));
    const nextCredits = Number((userProfile.subscriberCredits + dividend).toFixed(4));

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        subscriberCredits: nextCredits,
        lastMonthlyDividendClaim: new Date().toISOString(),
      });
      await recordCreditTransaction({
        fromUid: user.uid,
        fromName: 'ZTube Treasury',
        toUid: user.uid,
        toName: userProfile.displayName,
        amount: dividend,
        txType: 'monthly_dividend',
        note: `Monthly Subscriber Credit Yield (${subCount.toLocaleString()} subscribers × 0.1 per 100)`,
      });
      return dividend;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const donateSubscriberCredits = async (
    recipientUid: string,
    recipientName: string,
    amount: number,
    note: string
  ) => {
    if (!user || !userProfile) {
      navigate('auth');
      return;
    }
    const cleanAmount = Number(amount.toFixed(4));
    if (cleanAmount <= 0) throw new Error('Donation amount must be greater than 0 credits.');
    if (userProfile.subscriberCredits < cleanAmount) {
      throw new Error('Insufficient Subscriber Credits for this donation.');
    }

    const senderNewBalance = Number((userProfile.subscriberCredits - cleanAmount).toFixed(4));
    await updateDoc(doc(db, 'users', user.uid), {
      subscriberCredits: senderNewBalance,
    });

    const recipientUser = allUsers.find((u) => u.uid === recipientUid);
    if (recipientUser && recipientUser.uid !== user.uid) {
      const recipientNewBalance = Number((recipientUser.subscriberCredits + cleanAmount).toFixed(4));
      await updateDoc(doc(db, 'users', recipientUser.uid), {
        subscriberCredits: recipientNewBalance,
      });
    }

    await recordCreditTransaction({
      fromUid: user.uid,
      fromName: userProfile.displayName,
      toUid: recipientUid,
      toName: recipientName,
      amount: cleanAmount,
      txType: 'donation',
      note: note || `Donated ${cleanAmount} Subscriber Credits to ${recipientName}`,
    });
  };

  const purchaseAdCampaignWithCredits = async (input: {
    title: string;
    sponsorName: string;
    ctaUrl: string;
    adLevel: AdLevelTier;
    costCredits: number;
  }) => {
    if (!user || !userProfile) {
      navigate('auth');
      return;
    }
    if (userProfile.subscriberCredits < input.costCredits) {
      throw new Error(
        `Insufficient Subscriber Credits. You need ${input.costCredits} credits (current balance: ${userProfile.subscriberCredits.toFixed(3)}).`
      );
    }

    const nextBalance = Number((userProfile.subscriberCredits - input.costCredits).toFixed(4));
    await updateDoc(doc(db, 'users', user.uid), {
      subscriberCredits: nextBalance,
    });

    const campaignId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload: Omit<AdCampaignItem, 'id'> = {
      creatorId: user.uid,
      creatorName: userProfile.displayName.slice(0, 95),
      title: input.title.trim().slice(0, 115),
      sponsorName: input.sponsorName.trim().slice(0, 75),
      ctaUrl: input.ctaUrl.trim().slice(0, 290),
      adLevel: input.adLevel,
      creditsSpent: input.costCredits,
      impressions: 1,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'ad_campaigns', campaignId), payload);

    if (input.adLevel === 'level_1_basic') {
      await updateSiteSettings({
        adRow3RightActive: true,
        adRow3Title: payload.title,
        adRow3Sponsor: `${payload.sponsorName} (Level 1 Basic Ad)`,
        adRow3CtaUrl: payload.ctaUrl,
      });
    } else if (input.adLevel === 'level_2_mid') {
      await updateSiteSettings({
        adRow2MiddleActive: true,
        adRow2Title: payload.title,
        adRow2Sponsor: `${payload.sponsorName} (Level 2 Mid-Row Ad)`,
        adRow2CtaUrl: payload.ctaUrl,
      });
    } else if (input.adLevel === 'level_3_prime') {
      await updateSiteSettings({
        adRow1LeftActive: true,
        adRow1Title: payload.title,
        adRow1Sponsor: `${payload.sponsorName} (Level 3 Top-Left Prime Ad)`,
        adRow1CtaUrl: payload.ctaUrl,
      });
    }

    await recordCreditTransaction({
      fromUid: user.uid,
      fromName: userProfile.displayName,
      toUid: 'ztube_ad_exchange',
      toName: 'ZTube Ad Exchange',
      amount: input.costCredits,
      txType: 'ad_campaign',
      note: `Launched ${input.adLevel} campaign: "${payload.title}"`,
    });
  };

  const purchasePremiumSubscription = async (tier: 'base' | 'plus') => {
    if (!user || !userProfile) {
      navigate('auth');
      return;
    }
    const cost = tier === 'plus' ? 50 : 20;
    if (userProfile.subscriberCredits < cost) {
      throw new Error(
        `Insufficient Subscriber Credits. ${
          tier === 'plus' ? 'Plus Mode' : 'Base'
        } requires ${cost} Subscriber Credits/month (your balance: ${userProfile.subscriberCredits.toFixed(3)}).`
      );
    }

    const nextBalance = Number((userProfile.subscriberCredits - cost).toFixed(4));
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await updateDoc(doc(db, 'users', user.uid), {
      subscriberCredits: nextBalance,
      subscriptionTier: tier,
      subscriptionExpiresAt: expires,
    });

    await recordCreditTransaction({
      fromUid: user.uid,
      fromName: userProfile.displayName,
      toUid: 'ztube_membership',
      toName: 'ZTube Premium Memberships',
      amount: cost,
      txType: 'subscription',
      note: `Activated ${tier === 'plus' ? 'ZTube Plus Mode (50 Credits/mo)' : 'ZTube Base Ad-Free (20 Credits/mo)'}`,
    });
  };

  const updateSubscriberCountForDemo = async (_newCount: number) => {
    // Users cannot select their own subscriber amount.
    throw new Error('Security Policy: Users cannot select or edit their own subscriber amount.');
  };

  const playerColorTheme: PlayerColorTheme =
    siteSettings.playerColorTheme || localPlayerColorTheme || 'neon_green';

  const setPlayerColorTheme = async (theme: PlayerColorTheme) => {
    setLocalPlayerColorTheme(theme);
    try {
      localStorage.setItem('ztube_player_color_theme', theme);
    } catch {
      // ignore
    }
    setSiteSettings((prev) => ({ ...prev, playerColorTheme: theme }));
    if (user) {
      try {
        await setDoc(
          doc(db, 'site_settings', 'global'),
          {
            ...siteSettings,
            playerColorTheme: theme,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {
        // ignore if non-admin or guest
      }
    }
  };

  const dynamicBackgroundEnabled: boolean =
    typeof siteSettings.dynamicBackgroundEnabled === 'boolean'
      ? siteSettings.dynamicBackgroundEnabled
      : localDynamicBgEnabled;

  const dynamicBackgroundAudioReactive: boolean =
    typeof siteSettings.dynamicBackgroundAudioReactive === 'boolean'
      ? siteSettings.dynamicBackgroundAudioReactive
      : localDynamicBgAudioReactive;

  const dynamicBackgroundEffectiveActive: boolean =
    Boolean(dynamicBackgroundEnabled) && !dynamicBackgroundAutoDisabledReason;

  const setDynamicBackgroundEnabled = async (enabled: boolean) => {
    const clean = Boolean(enabled);
    setLocalDynamicBgEnabled(clean);
    try {
      localStorage.setItem('ztube_dynamic_bg_enabled', String(clean));
    } catch {
      // ignore
    }
    setSiteSettings((prev) => ({ ...prev, dynamicBackgroundEnabled: clean }));
    if (user) {
      try {
        await setDoc(
          doc(db, 'site_settings', 'global'),
          {
            ...siteSettings,
            dynamicBackgroundEnabled: clean,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {
        // ignore
      }
    }
  };

  const setDynamicBackgroundAudioReactive = async (enabled: boolean) => {
    const clean = Boolean(enabled);
    setLocalDynamicBgAudioReactive(clean);
    try {
      localStorage.setItem('ztube_dynamic_bg_audio_reactive', String(clean));
    } catch {
      // ignore
    }
    setSiteSettings((prev) => ({ ...prev, dynamicBackgroundAudioReactive: clean }));
    if (user) {
      try {
        await setDoc(
          doc(db, 'site_settings', 'global'),
          {
            ...siteSettings,
            dynamicBackgroundAudioReactive: clean,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {
        // ignore
      }
    }
  };

  const toggleUserIdentityOptIn = async (optIn: boolean) => {
    if (!user) {
      navigate('auth');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        identityOptIn: Boolean(optIn),
      });
    } catch (err) {
      console.warn('Could not update identityOptIn:', err);
    }
  };

  const togglePhoneVerifiedOptional = async (verified: boolean) => {
    if (!user) {
      navigate('auth');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phoneVerifiedOptional: Boolean(verified),
      });
    } catch (err) {
      console.warn('Could not update phoneVerifiedOptional:', err);
    }
  };

  const autoAwardCreatorVisitCredit = async (
    video: VideoItem,
    dwellSeconds: number,
    hasRealInteraction: boolean
  ): Promise<{ awarded: boolean; reason?: string; entry?: any }> => {
    if (!user || !video) {
      return {
        awarded: false,
        reason: 'Viewer must be signed in with Google & verified email to trigger creator credit.',
      };
    }

    // Build stable device fingerprint from browser traits
    const deviceFingerprint = [
      navigator.userAgent || 'ua',
      navigator.language || 'en',
      screen?.width || 1920,
      screen?.height || 1080,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    ].join('|');

    try {
      const res = await fetch('/api/credits/auto-award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerUid: user.uid,
          viewerEmail: user.email || '',
          emailVerified: Boolean(user.emailVerified !== false),
          googleSignedIn: Boolean(
            user.providerData?.some((p) => p.providerId === 'google.com') ?? true
          ),
          phoneVerifiedOptional: Boolean(userProfile?.phoneVerifiedOptional),
          creatorUid: video.authorId,
          creatorName: video.authorName,
          videoId: video.id,
          videoTitle: video.title,
          dwellSeconds,
          hasRealInteraction,
          deviceFingerprint,
        }),
      });
      const data = await res.json();
      if (res.ok && data.awarded) {
        // Auto-claim +1 credit directly into the creator's user profile in Firestore
        const creatorProfile = allUsers.find((u) => u.uid === video.authorId);
        if (creatorProfile && creatorProfile.uid !== user.uid) {
          const nextCredits = Number(((creatorProfile.subscriberCredits || 0) + 1).toFixed(4));
          try {
            await updateDoc(doc(db, 'users', creatorProfile.uid), {
              subscriberCredits: nextCredits,
            });
          } catch {
            // ignore if rules restrict cross-user write
          }
        }
        await recordCreditTransaction({
          fromUid: user.uid,
          fromName: userProfile?.displayName || user.displayName || 'Verified Viewer',
          toUid: video.authorId,
          toName: video.authorName,
          amount: 1,
          txType: 'member_video_payout',
          note: `Auto-claimed +1 credit: Unique verified user viewed "${video.title.slice(0, 60)}" (${dwellSeconds}s dwell + verified interaction)`,
        });
        pushNotification({
          title: 'Auto-Claimed +1 Creator Credit',
          message: `Verified unique view on "${video.title}" (+1 credit auto-claimed to ${video.authorName}).`,
          kind: 'credits',
          targetRoute: 'ads-credits',
        });
      }
      return {
        awarded: Boolean(data.awarded),
        reason: data.error || data.reason || data.entry?.reason,
        entry: data.entry,
      };
    } catch (err: any) {
      return { awarded: false, reason: err.message || 'Auto-award check failed' };
    }
  };

  const updateSiteSettings = async (updates: Partial<SiteSettings>) => {
    if (!user) {
      navigate('auth');
      return;
    }
    const merged: SiteSettings = {
      ...siteSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setSiteSettings(merged);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_settings/global');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        allUsers,
        isAdmin,
        authReady,
        accessToken,
        subscriberCredits,
        subscriptionTier,
        subscribersCount,
        backendApiKey,
        userAge,
        setBackendApiKeyAndAge,
        signIn,
        signOutUser,
        videos: firestoreVideos,
        recommendedVideos,
        categories,
        addCategory,
        categoryVideoCounts,
        userLocation,
        setUserLocation,
        setUserLocationHub,
        locationalAlgorithmEnabled,
        setLocationalAlgorithmEnabled,
        locationAlgorithmMode,
        setLocationAlgorithmMode,
        cookieConsent,
        updateCookieConsent,
        isCookieBannerOpen,
        setIsCookieBannerOpen,
        isCookieSettingsModalOpen,
        setIsCookieSettingsModalOpen,
        locationalRankedVideos,
        posts,
        comments,
        adCampaigns,
        creditTransactions,
        subscriptions,
        telemetryEvents,
        siteSettings,
        currentRoute,
        selectedVideoId,
        missingResourceType,
        searchQuery,
        selectedCategory,
        watchHistoryIds,
        watchHistoryEnabled,
        setWatchHistoryEnabled,
        clearWatchHistory,
        removeFromWatchHistory,
        playlists,
        activePlaylistId,
        setActivePlaylistId,
        createPlaylist,
        deletePlaylist,
        toggleVideoInPlaylist,
        viewedVideoIdsByCurrentUser,
        savedVideoIds,
        favoriteVideoIds,
        watchLaterEntries,
        watchLaterVideoIds,
        isVideoInWatchLater,
        isVideoSaved,
        isVideoFavorited,
        isVideoWatched,
        toggleWatchLater,
        removeFromWatchLater,
        reorderWatchLater,
        moveWatchLaterItemToPosition,
        removeWatchedFromWatchLater,
        clearWatchLater,
        autoRemoveWatchLaterOnFinish,
        setAutoRemoveWatchLaterOnFinish,
        activeQueueMode,
        setActiveQueueMode,
        queueShuffle,
        setQueueShuffle,
        queueLoop,
        setQueueLoop,
        activeQueueVideoIds,
        startWatchLaterQueue,
        handleVideoPlaybackEnded,
        userLikesPerVideo,
        userLikesPerPost,
        userDislikedVideoIds,
        userDislikedPostIds,
        darkMode,
        liquidGlass,
        rgbCursorEnabled,
        textScale,
        isUploadModalOpen,
        preselectedShortSoundId,
        setPreselectedShortSoundId,
        notifications,
        unreadNotificationCount,
        pushNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        tutorialState,
        startTutorial,
        skipTutorial,
        replayTutorial,
        setTutorialStep,
        completeTutorial,
        dismissImportContextTip,
        dismissWatchContextTip,
        navigate,
        triggerResourceNotFound,
        setSearchQuery,
        setSelectedCategory,
        setDarkMode,
        setLiquidGlass,
        setRgbCursorEnabled,
        setTextScale,
        setIsUploadModalOpen,
        toggleSavedVideo,
        toggleFavoriteVideo,
        removeFavoriteVideo,
        addVideo,
        updateVideo,
        deleteVideo,
        incrementViews,
        toggleLikeVideo,
        removeLikeVideo,
        toggleDislikeVideo,
        removeDislikeVideo,
        addCommunityPost,
        toggleLikePost,
        removeLikePost,
        toggleDislikePost,
        removeDislikePost,
        deletePost,
        addComment,
        deleteComment,
        toggleSubscription,
        removeSubscription,
        updateSiteSettings,
        claimMonthlySubscriberDividend,
        donateSubscriberCredits,
        purchaseAdCampaignWithCredits,
        purchasePremiumSubscription,
        updateSubscriberCountForDemo,
        logTelemetryEvent,
        miniPlayerVideoId,
        setMiniPlayerVideoId,
        playerColorTheme,
        setPlayerColorTheme,
        dynamicBackgroundEnabled,
        setDynamicBackgroundEnabled,
        dynamicBackgroundAudioReactive,
        setDynamicBackgroundAudioReactive,
        dynamicBackgroundAutoDisabledReason,
        dynamicBackgroundEffectiveActive,
        publicHmacId,
        refreshPublicHmacId,
        toggleUserIdentityOptIn,
        togglePhoneVerifiedOptional,
        autoAwardCreatorVisitCredit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
