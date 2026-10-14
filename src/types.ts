export type SubscriptionTier = 'free' | 'base' | 'plus';
export type AdLevelTier = 'level_1_basic' | 'level_2_mid' | 'level_3_prime';
export type PlayerColorTheme = 'neon_green' | 'sunset_red' | 'midnight_blue';

export type HomeDurationFilter = 'all' | 'shorts_under_4m' | 'mid_4_to_20m' | 'long_over_20m';
export type HomeSortOption = 'newest' | 'most_viewed' | 'most_liked';
export type AdminRbacRole = 'viewer_auditor' | 'content_moderator' | 'trust_safety_lead' | 'super_admin';

export const ZTUBE_VIDEO_CATEGORIES = [
  'Gaming',
  'Tutorials',
  'Music',
  'Engineering',
  'Hardware',
  'Travel',
  'Culinary',
  'Design',
  'Science',
  'Entertainment',
  'Podcasts',
  'Sports',
] as const;

export type ZTubeCategory = (typeof ZTUBE_VIDEO_CATEGORIES)[number];

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  description?: string;
  color?: string;
  displayOrder: number;
  videoCount?: number;
  createdAt: string;
}

export const INITIAL_DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat_all',
    slug: 'all',
    name: 'All',
    icon: '✨',
    description: 'Complete library of videos and shorts across all genres',
    color: '#FF0033',
    displayOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_gaming',
    slug: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    description: 'Esports, game walkthroughs, livestreams, and reviews',
    color: '#10B981',
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_tutorials',
    slug: 'tutorials',
    name: 'Tutorials',
    icon: '💡',
    description: 'Step-by-step guides, masterclasses, and coding tutorials',
    color: '#3B82F6',
    displayOrder: 2,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_music',
    slug: 'music',
    name: 'Music',
    icon: '🎵',
    description: 'High-fidelity audio masters, music videos, and remixes',
    color: '#EC4899',
    displayOrder: 3,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_engineering',
    slug: 'engineering',
    name: 'Engineering',
    icon: '⚙️',
    description: 'Software architecture, civil engineering, robotics, and CAD',
    color: '#8B5CF6',
    displayOrder: 4,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_hardware',
    slug: 'hardware',
    name: 'Hardware',
    icon: '🖥️',
    description: 'Silicon benchmarks, GPU teardowns, and custom rigs',
    color: '#F59E0B',
    displayOrder: 5,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_travel',
    slug: 'travel',
    name: 'Travel',
    icon: '✈️',
    description: 'Global exploration, city walking tours, and 4K vistas',
    color: '#14B8A6',
    displayOrder: 6,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_culinary',
    slug: 'culinary',
    name: 'Culinary',
    icon: '🍳',
    description: 'Gastronomy, culinary techniques, and street food journeys',
    color: '#F97316',
    displayOrder: 7,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_design',
    slug: 'design',
    name: 'Design',
    icon: '🎨',
    description: 'UI/UX craft, typography, motion graphics, and 3D modeling',
    color: '#06B6D4',
    displayOrder: 8,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_science',
    slug: 'science',
    name: 'Science',
    icon: '🔬',
    description: 'Quantum physics, astrophysics, biology, and breakthroughs',
    color: '#6366F1',
    displayOrder: 9,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_entertainment',
    slug: 'entertainment',
    name: 'Entertainment',
    icon: '🍿',
    description: 'Cinema, animation, comedy, and storytelling',
    color: '#D946EF',
    displayOrder: 10,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_podcasts',
    slug: 'podcasts',
    name: 'Podcasts',
    icon: '🎙️',
    description: 'Interviews, conversations, and technical roundtable discussions',
    color: '#84CC16',
    displayOrder: 11,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_sports',
    slug: 'sports',
    name: 'Sports',
    icon: '⚽',
    description: 'Athletic highlights, training sessions, and extreme sports',
    color: '#EF4444',
    displayOrder: 12,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export interface GeminiPersonIdentification {
  id: string;
  name: string;
  roleOrCharacter: string;
  sourceCategory:
    | 'creator_cast_credit'
    | 'public_database_imdb_wikidata_tmdb'
    | 'public_figure_source'
    | 'opted_in_ztube_user';
  sourceCitation: string;
  confidencePercent: number;
  aiGeneratedLabel: 'AI-generated';
  disputed?: boolean;
  disputeReason?: string;
  removedBySubject?: boolean;
}

export interface VideoStrikeItem {
  id: string;
  videoId: string;
  videoTitle: string;
  creatorPublicId: string;
  reason: string;
  issuedByRole: AdminRbacRole;
  issuedAt: string;
  status: 'active' | 'appealed' | 'revoked';
  appealNote?: string;
  appealedAt?: string;
}

export interface AdminAuditLogEntry {
  id: string;
  actorPublicId: string;
  actorRole: AdminRbacRole;
  action: string;
  target: string;
  reason: string;
  environment: 'production' | 'staging';
  mfaVerified: boolean;
  timestamp: string;
}

export interface CreditLedgerEntry {
  id: string;
  timestamp: string;
  viewerPublicId: string;
  creatorPublicId: string;
  creatorName: string;
  videoId: string;
  videoTitle: string;
  amount: number;
  dwellSeconds: number;
  verifiedEmailAndGoogle: boolean;
  phoneVerifiedOptional: boolean;
  deviceFingerprintMasked: string;
  status: 'auto_claimed' | 'blocked_abuse' | 'clawed_back';
  reason: string;
}

export interface CaptionCue {
  startSec: number;
  endSec: number;
  text: string;
}

export interface CaptionTrack {
  id: string;
  label: string;
  lang: string;
  isAiGenerated: boolean;
  creatorName?: string;
  cues: CaptionCue[];
}

export interface CreatorAudioTrack {
  id: string;
  languageCode: string;
  languageLabel: string;
  creatorLabel: string;
  audioUrl?: string;
  isDefault?: boolean;
  voicePitch?: number;
  voiceRate?: number;
  sampleSummaryText?: string;
}

export interface ShortSoundPreset {
  id: string;
  title: string;
  artist: string;
  category: string;
  bpm: number;
  freqHz: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: 'video' | 'short_sound' | 'caption_audio' | 'credits' | 'system';
  targetRoute?: PageRoute;
  targetVideoId?: string;
  read: boolean;
  createdAt: string;
}

export interface TutorialState {
  status: 'unseen' | 'active' | 'skipped' | 'completed';
  stepIndex: number;
  seenImportContextTip: boolean;
  seenWatchContextTip: boolean;
}

export interface YoutubeAccountVideoItem {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

export interface UserProfile {
  uid: string;
  publicHmacId?: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  subscribersCount: number;
  subscriberCredits: number;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string;
  lastMonthlyDividendClaim?: string;
  apiKey?: string;
  userAge?: number;
  identityOptIn?: boolean;
  phoneVerifiedOptional?: boolean;
  watchLaterJson?: string;
  autoRemoveWatchLaterOnFinish?: boolean;
  createdAt: string;
}

export interface WatchLaterEntry {
  videoId: string;
  addedAt: string;
  position: number;
  watchedAt?: string;
}

export type WatchLaterSortOption =
  | 'custom'
  | 'date_added_newest'
  | 'date_added_oldest'
  | 'duration_shortest'
  | 'duration_longest'
  | 'popularity'
  | 'added_newest'
  | 'added_oldest'
  | 'duration_Asc'
  | 'duration_desc'
  | 'views_desc';

export type WatchLaterFilterStatus = 'all' | 'unwatched' | 'watched';


export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  youtubeId?: string;
  category: string;
  tags: string[];
  duration: string;
  views: number;
  likes: number;
  dislikes?: number;
  isShort?: boolean;
  isMemberOnly?: boolean;
  memberCreditsEarned?: number;
  minAgeRating?: number;
  aiSafetyNote?: string;
  isVolumetricVr?: boolean;
  serverDownloadedTranscoded?: boolean;
  captionTracksJson?: string;
  audioTracksJson?: string;
  shortSoundId?: string;
  shortSoundTitle?: string;
  shortSoundArtist?: string;
  creatorIdentityDetectionOptIn?: boolean;
  creatorCastCredits?: string;
  authorId: string;
  authorPublicHmacId?: string;
  authorName: string;
  authorAvatar?: string;
  locationTag?: string;
  compressionCodec?: string;
  compressionRatio?: string;
  originalSizeMb?: number;
  compressedSizeMb?: number;
  createdAt: string;
}

export interface CommunityPostItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageWebpUrl?: string;
  webpStats?: string;
  likes: number;
  dislikes: number;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  videoId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  likes: number;
  isPriorityMember?: boolean;
  memberTier?: SubscriptionTier;
  createdAt: string;
}

export interface AdCampaignItem {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  sponsorName: string;
  ctaUrl: string;
  adLevel: AdLevelTier;
  creditsSpent: number;
  impressions: number;
  active: boolean;
  createdAt: string;
}

export interface CreditTransactionItem {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  amount: number;
  txType: 'donation' | 'ad_campaign' | 'subscription' | 'monthly_dividend' | 'member_video_payout';
  note: string;
  createdAt: string;
}

export interface SubscriptionItem {
  id: string;
  subscriberId: string;
  channelId: string;
  channelName: string;
  channelAvatar?: string;
  createdAt: string;
}

export interface PlaylistItem {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  videoIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryEventItem {
  id: string;
  eventType: string;
  component: string;
  latencyMs: number;
  compressionSavedKb: number;
  codec?: string;
  status: 'ok' | 'warn' | 'error';
  actorId: string;
  details: string;
  createdAt: string;
}

export interface GoogleContactItem {
  resourceName: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
}

export interface SiteSettings {
  adRow1LeftActive: boolean;
  adRow2MiddleActive: boolean;
  adRow3RightActive: boolean;
  adRow1Title: string;
  adRow1Sponsor: string;
  adRow1CtaUrl: string;
  adRow2Title: string;
  adRow2Sponsor: string;
  adRow2CtaUrl: string;
  adRow3Title: string;
  adRow3Sponsor: string;
  adRow3CtaUrl: string;
  enableComments: boolean;
  enableUploads: boolean;
  enableAiAnalysis: boolean;
  enableYoutubeAutoSync: boolean;
  youtubeApiKeyConfigured: boolean;
  youtubeSyncChannelHandle?: string;
  playerColorTheme?: PlayerColorTheme;
  dynamicBackgroundEnabled?: boolean;
  dynamicBackgroundAudioReactive?: boolean;
  updatedAt: string;
}

export type PageRoute =
  | 'home'
  | 'shorts'
  | 'posts'
  | 'trending'
  | 'subscriptions'
  | 'library'
  | 'watch-later'
  | 'watch'
  | 'ads-credits'
  | 'auth'
  | 'not-found'
  | 'embed-api'
  | 'docs'
  | 'profile'
  | 'admin'
  | 'telemetry'
  | 'terms'
  | 'privacy'
  | 'blueprint';

export const BUILTIN_SHORT_SOUNDS: ShortSoundPreset[] = [
  {
    id: 'snd_neon_pulse',
    title: 'Neon Sub-Bass Drift (AV1 Master)',
    artist: 'ZTube Audio Lab',
    category: 'Electronic / Synth',
    bpm: 124,
    freqHz: 220,
  },
  {
    id: 'snd_central_park_lofi',
    title: 'Central Park Twilight Lo-Fi Beat',
    artist: 'Manhattan Tape Collective',
    category: 'Lo-Fi / Chill',
    bpm: 88,
    freqHz: 261.63,
  },
  {
    id: 'snd_cyber_breakbeat',
    title: 'Hyper-Compression Breakbeat 140',
    artist: 'Codec Drumworks',
    category: 'Breakbeat / Action',
    bpm: 140,
    freqHz: 329.63,
  },
  {
    id: 'snd_acoustic_horizon',
    title: 'Warm Acoustic Studio Riff',
    artist: 'Creator Sessions',
    category: 'Acoustic / Folk',
    bpm: 102,
    freqHz: 293.66,
  },
  {
    id: 'snd_orchestral_rise',
    title: 'Cinematic Documentary Stinger',
    artist: 'ZTube Symphony',
    category: 'Cinematic',
    bpm: 96,
    freqHz: 196.0,
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  adRow1LeftActive: true,
  adRow2MiddleActive: true,
  adRow3RightActive: true,
  adRow1Title: 'Google AdSense — Row 1 Top-Left Placement Unit',
  adRow1Sponsor: 'Google AdSense Network',
  adRow1CtaUrl: 'https://adsense.google.com',
  adRow2Title: 'Sponsored Partner Campaign — Row 2 Middle Placement Unit',
  adRow2Sponsor: 'Direct Sponsored Placement',
  adRow2CtaUrl: 'https://youtube.com',
  adRow3Title: 'Google AdSense — Row 3 Right Placement Unit',
  adRow3Sponsor: 'Google AdSense Network',
  adRow3CtaUrl: 'https://adsense.google.com',
  enableComments: true,
  enableUploads: true,
  enableAiAnalysis: true,
  enableYoutubeAutoSync: true,
  youtubeApiKeyConfigured: true,
  youtubeSyncChannelHandle: '',
  playerColorTheme: 'neon_green',
  dynamicBackgroundEnabled: false,
  dynamicBackgroundAudioReactive: false,
  updatedAt: new Date().toISOString(),
};
