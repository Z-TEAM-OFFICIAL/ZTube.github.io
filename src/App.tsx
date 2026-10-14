import React, { useState, useMemo, useEffect, Suspense } from 'react';
import {
  Flame,
  Users,
  FolderKanban,
  Upload,
  Play,
  Activity,
  Scale,
  Lock,
  FileCode2,
  Heart,
  Code2,
  Sparkles,
  Crown,
  AlertCircle,
  KeyRound,
  Glasses,
  SlidersHorizontal,
  Clock,
  ArrowUpDown,
  ListMusic,
  Plus,
  Trash2,
  Link2,
  Check,
  History,
} from 'lucide-react';
import { AppProvider, useApp, parseDurationToSeconds } from './context/AppContext';
import { HomeDurationFilter, HomeSortOption, ZTUBE_VIDEO_CATEGORIES } from './types';
import { TopNavbar, LeftSidebar } from './components/NavbarSidebar';
import {
  buildYoutubeGridWithAds,
  VideoCard,
  AdGridCard,
} from './components/VideoGridWithAds';
import { VideoDetailsPage } from './components/VideoDetailsPage';
import { UploadImportModal } from './components/UploadImportModal';
import {
  ShortsFeedPage,
  CommunityPostsPage,
  EmbedApiStudioPage,
  CustomEmbedPlayerFrame,
} from './components/ShortsPostsAndEmbedPage';
import {
  CentralParkAuthPage,
  CentralParkNotFoundFallback,
  SubscriberCreditsAndAdsHub,
} from './components/SubscriberCreditsAndAuthPages';
import {
  BlueCarApiKeyCaptchaModal,
  VrArVolumetricPlayerModal,
} from './components/ApiKeyCaptchaAndVrComponents';
import {
  DocsSectionPage,
  ContextualTutorialBanner,
  OptionalRgbMouseCursorOverlay,
  CrossBrowserMiniPlayerDock,
  VideoDownloadApiConsole,
} from './components/DocsTutorialCursorAndDownload';
import { WatchLaterLibrarySection } from './components/WatchLaterLibrarySection';
import {
  CategoryFilterAndLocationBar,
  CookieConsentBanner,
} from './components/CategoryFilterAndLocationBar';

// Deferred non-critical route bundles loaded asynchronously on demand
const AdminPanelPage = React.lazy(() =>
  import('./components/AdminPanelPage').then((m) => ({ default: m.AdminPanelPage }))
);
const TechnicalSpecPage = React.lazy(() =>
  import('./components/TechnicalSpecPage').then((m) => ({ default: m.TechnicalSpecPage }))
);
const TelemetryPage = React.lazy(() =>
  import('./components/TelemetryAndLegalPages').then((m) => ({ default: m.TelemetryPage }))
);
const TermsOfServicePage = React.lazy(() =>
  import('./components/TelemetryAndLegalPages').then((m) => ({ default: m.TermsOfServicePage }))
);
const PrivacyPolicyPage = React.lazy(() =>
  import('./components/TelemetryAndLegalPages').then((m) => ({ default: m.PrivacyPolicyPage }))
);

const CATEGORIES = ['All', ...ZTUBE_VIDEO_CATEGORIES];

export const ZTUBE_ANDROID_BUILD_PROMPT = `Build a native Android application (Kotlin + Jetpack Compose + Material 3 + Media3 ExoPlayer + Firebase Auth/Firestore) for the ZTube Video Platform with the following core architecture and features:

1. Custom Dual-Engine ExoPlayer (No Default MediaController UI):
   - 16:9 Widescreen Video Engine & 9:16 Vertical Shorts Reel Engine (ViewPager2 vertical swipe feed, tap-to-pause, double-tap heart animation, auto-hiding HUD after 2.2s, synchronized Creator & AI-Generated Closed Captions, multi-language creator audio track selector, and Picture-in-Picture mini-player via Android PipParams).
   - Global Player Color Theme setting (Neon Green #58F01B, Sunset Red #FF0033, Midnight Blue #38BDF8) + Optional Dynamic Background (3 Hz Palette API frame color sampling with 700ms animated transitions, opt-in Audio-Reactive Visualizer energy mode with capped shift rate, fixed-contrast overlays, and automatic pause on lifecycle ON_PAUSE / PowerManager Battery Saver / AnimatorDurationScale reduced-motion).
   - Interactive timeline progress bar on every video card with a static hover/scrub-preview thumbnail card and chapter markers.

2. Video Categorization, Filtering & Real-Time Upload Progress:
   - Assign categories during upload ('Gaming', 'Tutorials', 'Music', 'Engineering', 'Hardware', 'Travel', 'Culinary', 'Design', 'Science', or custom categories).
   - Category filter chips + Duration filter dropdown (Shorts < 4m, Mid 4-20m, Long > 20m) + Sort by dropdown (Newest, Most Viewed, Most Liked) on the Home Feed, Trending Feed, and User Profile Channel screen.
   - Real-time chunked Video Upload Progress Indicator (0% to 100% LinearProgressIndicator with live byte/stage telemetry) and clear Success or Failure completion banners.

3. Identity, Security & Anti-Abuse Subscriber Credits:
   - Server-side random UUIDv7+ vault (never exposed to client); public IDs derived via versioned HMAC-SHA-256(UUIDv7+, server_secret) with periodic secret rotation (no raw SHA-512).
   - Least-privilege RBAC Admin Console with mandatory TOTP MFA, logged audit reasons, appealable video strikes, ad removal, and staging-only metric override guards.
   - Users start with 0 subscribers (not self-selectable) and 0 credits. Auto-claimed +1 credit per unique verified viewer visit (>= 30s dwell time + real touch interaction, Google Sign-In + verified email, device fingerprint + IP rate limits, daily caps, no self-crediting, and MFA-gated clawback ledger).

4. Gemini Multimodal AI & Creator APIs:
   - Latest Gemini model integration for video summaries, timestamped chapters, and opt-in Person Identification (strictly from creator cast/credits, IMDb/Wikidata/TMDB, public figures, or opted-in ZTube users—no private facial recognition—with source, confidence %, 'AI-generated' badge, and one-tap dispute/removal).
   - Creator Channel Video Download API & All-Videos Bulk Archive API with optional Moving Liquid-Glass corner watermark.`;

const MainShell: React.FC = () => {
  const {
    currentRoute,
    navigate,
    triggerResourceNotFound,
    missingResourceType,
    videos,
    recommendedVideos,
    categories,
    userLocation,
    locationalAlgorithmEnabled,
    locationAlgorithmMode,
    locationalRankedVideos,
    siteSettings,
    subscriptionTier,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    subscriptions,
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
    savedVideoIds,
    favoriteVideoIds,
    pushNotification,
    liquidGlass,
    setLiquidGlass,
    rgbCursorEnabled,
    setRgbCursorEnabled,
    replayTutorial,
    user,
    backendApiKey,
    setIsUploadModalOpen,
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [useAffinitySort, setUseAffinitySort] = useState(true);
  const [durationFilter, setDurationFilter] = useState<HomeDurationFilter>('all');
  const [homeSortBy, setHomeSortBy] = useState<HomeSortOption>('newest');
  const [profileSelectedCategory, setProfileSelectedCategory] = useState<string>('All');
  const [copiedAndroidPrompt, setCopiedAndroidPrompt] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState<string>('');
  const [newPlaylistPublic, setNewPlaylistPublic] = useState<boolean>(true);
  const [copiedPlaylistId, setCopiedPlaylistId] = useState<string | null>(null);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [showVrDemoModal, setShowVrDemoModal] = useState(false);

  // Merge built-in categories ('Gaming', 'Tutorials', 'Music', etc.) with any custom categories assigned to uploaded videos
  const availableCategories = useMemo(() => {
    const set = new Set<string>(CATEGORIES);
    for (const v of videos) {
      if (v.category && v.category.trim()) {
        set.add(v.category.trim());
      }
    }
    return Array.from(set);
  }, [videos]);

  // Sync video categories with the backend category store (/api/videos/categories)
  useEffect(() => {
    if (videos.length === 0) return;
    const latest = videos[0];
    fetch('/api/videos/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: latest.id,
        title: latest.title,
        category: latest.category || 'Gaming',
        authorId: latest.authorId,
        authorName: latest.authorName,
        duration: latest.duration,
        isShort: Boolean(latest.isShort),
      }),
    }).catch(() => {});
  }, [videos.length]);

  // Detect standalone external website embed mode via ?embed=<videoId> or ?watch=<videoId>
  const embedParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('embed');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const watchParam = params.get('watch');
    if (watchParam) {
      navigate('watch', watchParam);
    }
  }, []);

  // Filter videos by search query, category, location, and Duration (< 4m, 4-20m, > 20m), and sort by Newest, Most Viewed, Most Liked (or Locational/Affinity)
  const filteredVideos = useMemo(() => {
    let baseList = videos;
    if (useAffinitySort) {
      baseList = recommendedVideos;
    } else if (locationalAlgorithmEnabled && locationAlgorithmMode !== 'standard') {
      baseList = locationalRankedVideos;
    }

    const filtered = baseList.filter((v) => {
      const matchesCat =
        selectedCategory.toLowerCase() === 'all' ||
        (v.category || '').toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.authorName.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q) ||
        (v.locationTag || '').toLowerCase().includes(q) ||
        (v.tags || []).some((t) => t.toLowerCase().includes(q));

      const durSec = parseDurationToSeconds(v.duration);
      let matchesDuration = true;
      if (durationFilter === 'shorts_under_4m') {
        matchesDuration = durSec < 240;
      } else if (durationFilter === 'mid_4_to_20m') {
        matchesDuration = durSec >= 240 && durSec <= 1200;
      } else if (durationFilter === 'long_over_20m') {
        matchesDuration = durSec > 1200;
      }

      return matchesCat && matchesSearch && matchesDuration;
    });

    const sorted = [...filtered];
    if (homeSortBy === 'most_viewed') {
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (homeSortBy === 'most_liked') {
      sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (homeSortBy === 'newest') {
      if (!useAffinitySort && (!locationalAlgorithmEnabled || locationAlgorithmMode === 'standard')) {
        sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    }
    return sorted;
  }, [
    videos,
    recommendedVideos,
    locationalRankedVideos,
    locationalAlgorithmEnabled,
    locationAlgorithmMode,
    useAffinitySort,
    selectedCategory,
    searchQuery,
    durationFilter,
    homeSortBy,
  ]);

  // Trending videos sorted by views descending
  const trendingVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => b.views - a.views);
  }, [filteredVideos]);

  // Home feed slots with 3-column YouTube ad injection (automatically ad-free for Base/Plus subscribers)
  const homeGridSlots = useMemo(() => {
    return buildYoutubeGridWithAds(filteredVideos, siteSettings, subscriptionTier);
  }, [filteredVideos, siteSettings, subscriptionTier]);

  const userVideos = useMemo(() => {
    if (!user) return [];
    return videos.filter((v) => v.authorId === user.uid);
  }, [videos, user]);

  // If rendered inside an external website's <iframe> via ?embed=<videoId>
  if (embedParam) {
    const embeddedVideo = videos.find((v) => v.id === embedParam) || videos[0] || null;
    return <CustomEmbedPlayerFrame video={embeddedVideo} isStandaloneEmbed={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col theme-morph-surface">
      <OptionalRgbMouseCursorOverlay />
      <TopNavbar onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />

      <div className="flex-1 flex">
        <LeftSidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          mobileDrawerOpen={mobileDrawerOpen}
          setMobileDrawerOpen={setMobileDrawerOpen}
        />

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <main className="flex-1 min-w-0 pb-20 md:pb-12">
            {/* ROUTE: HOME FEED */}
            {currentRoute === 'home' && (
              <div className="max-w-[1440px] mx-auto px-3.5 sm:px-4 lg:px-6 py-4 sm:py-5 space-y-5">
                {/* Database-Driven Interactive Category Filter & Locational Algorithm Bar */}
                <CategoryFilterAndLocationBar />

                {/* Feed Filters & Controls Bar (Duration Dropdown & Quick Feature Bar) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="flex flex-wrap items-center gap-2">

                    {/* Duration Dropdown Filter in Home Feed Category Bar (Shorts < 4m, Mid 4-20m, Long > 20m) */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-xs">
                      <Clock className="w-3.5 h-3.5 text-[#FF0033] shrink-0" />
                      <label htmlFor="home-duration-filter" className="text-neutral-500 font-medium">
                        Duration:
                      </label>
                      <select
                        id="home-duration-filter"
                        aria-label="Filter videos by duration"
                        value={durationFilter}
                        onChange={(e) => setDurationFilter(e.target.value as HomeDurationFilter)}
                        className="bg-transparent font-semibold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-white dark:bg-[#141417]">
                          All Lengths
                        </option>
                        <option value="shorts_under_4m" className="bg-white dark:bg-[#141417]">
                          Shorts (&lt; 4m)
                        </option>
                        <option value="mid_4_to_20m" className="bg-white dark:bg-[#141417]">
                          Mid (4–20m)
                        </option>
                        <option value="long_over_20m" className="bg-white dark:bg-[#141417]">
                          Long (&gt; 20m)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Recommendation Algorithm Toggle ("Detect What You Like") */}
                    <button
                      onClick={() => setUseAffinitySort(!useAffinitySort)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
                        useAffinitySort
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-neutral-100 dark:bg-[#141417] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                      }`}
                      title="Toggle personalized recommendation algorithm based on your likes, favorites, and watch history"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{useAffinitySort ? 'Algorithm: For You Active' : 'Algorithm: Standard'}</span>
                    </button>

                    {/* Sort By Dropdown next to Recommendation Toggle (Newest, Most Viewed, Most Liked) */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#58f01b] shrink-0" />
                      <label htmlFor="home-sort-by" className="text-neutral-500 font-medium">
                        Sort by:
                      </label>
                      <select
                        id="home-sort-by"
                        aria-label="Sort videos by"
                        value={homeSortBy}
                        onChange={(e) => {
                          const nextSort = e.target.value as HomeSortOption;
                          setHomeSortBy(nextSort);
                          if (nextSort !== 'newest') {
                            setUseAffinitySort(false);
                          }
                        }}
                        className="bg-transparent font-semibold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                      >
                        <option value="newest" className="bg-white dark:bg-[#141417]">
                          Newest
                        </option>
                        <option value="most_viewed" className="bg-white dark:bg-[#141417]">
                          Most Viewed
                        </option>
                        <option value="most_liked" className="bg-white dark:bg-[#141417]">
                          Most Liked
                        </option>
                      </select>
                    </div>

                    {/* Free 7+ API Key & Blue Car Captcha Trigger */}
                    <button
                      onClick={() => setShowCaptchaModal(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{backendApiKey ? 'API Key (7+ Verified)' : 'Free 7+ API Key (Car Captcha)'}</span>
                    </button>

                    {/* VR / AR Room & Volumetric Player Trigger */}
                    <button
                      onClick={() => setShowVrDemoModal(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#141417] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Glasses className="w-3.5 h-3.5 text-[#58f01b]" />
                      <span>VR / AR Room Mode</span>
                    </button>

                    <button
                      onClick={() => navigate('ads-credits')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF0033]/10 text-[#FF0033] border border-[#FF0033]/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>
                        {subscriptionTier === 'plus'
                          ? 'Plus Mode Active (2× Likes)'
                          : subscriptionTier === 'base'
                          ? 'Base Ad-Free Active'
                          : 'ZTube Ads & Plus Credits'}
                      </span>
                    </button>

                    <button
                      onClick={() => setLiquidGlass(!liquidGlass)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
                        liquidGlass
                          ? 'bg-[#FF0033] text-white border-[#FF0033]'
                          : 'bg-neutral-100 dark:bg-[#141417] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{liquidGlass ? 'Liquid Glass: ON' : 'Liquid Glass'}</span>
                    </button>

                    <button
                      onClick={() => setRgbCursorEnabled(!rgbCursorEnabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
                        rgbCursorEnabled
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                          : 'bg-neutral-100 dark:bg-[#141417] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                      }`}
                      title="Toggle Optional Green-Left / Blue-Scroll-Wheel / Red-Right Cursor"
                    >
                      <span>{rgbCursorEnabled ? 'RGB Cursor (G·B·R): ON' : 'RGB Cursor (G·B·R)'}</span>
                    </button>

                    <button
                      onClick={() => navigate('docs')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#141417] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 cursor-pointer"
                    >
                      <span>Docs & C-Captions</span>
                    </button>

                    {searchQuery && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500 shrink-0">
                        <span>Filtering by: "{searchQuery}"</span>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-[#FF0033] hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3-Column Balanced YouTube Video & Ad Grid */}
                {videos.length === 0 ? (
                  <div className="space-y-6">
                    <div className="p-6 sm:p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] text-center space-y-4">
                      <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                        No Videos Published Yet (Zero Placeholder Mode Active)
                      </h2>
                      <p className="text-xs text-neutral-500 max-w-xl mx-auto leading-relaxed">
                        Sync any real YouTube video/Short (automatically downloaded to the server, converted & compressed to AV1 WebM), test the Free 7+ API Key with the Blue Car Escape & Hidden Movement Captcha, or launch the VR / AR Room Volumetric Player below.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                        <button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Sync & Server-Convert YouTube Video / 4m Short</span>
                        </button>
                        <button
                          onClick={() => setShowCaptchaModal(true)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-blue-500/40 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Free 7+ API Key (Blue Car Captcha)</span>
                        </button>
                        <button
                          onClick={() => setShowVrDemoModal(true)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Glasses className="w-3.5 h-3.5 text-[#58f01b]" />
                          <span>VR / AR Room & Volumetric Player</span>
                        </button>
                        <button
                          onClick={() => navigate('ads-credits')}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5 text-[#FF0033]" />
                          <span>Subscriber Credits & ZTube Ads</span>
                        </button>
                        <button
                          onClick={() => navigate('auth')}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Central Park Liquid Glass Login</span>
                        </button>
                        <button
                          onClick={() => triggerResourceNotFound('video')}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-[#FF0033]" />
                          <span>Preview 404 Video Fallback</span>
                        </button>
                      </div>
                    </div>

                    {/* Show Active Ad Placement Slots Preview in 3-Column Layout (unless user has Base or Plus Ad-Free Subscription) */}
                    {subscriptionTier === 'free' &&
                      (siteSettings.adRow1LeftActive ||
                        siteSettings.adRow2MiddleActive ||
                        siteSettings.adRow3RightActive) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-mono text-neutral-500">
                              ACTIVE 3-COLUMN AD PLACEMENTS (ROW 1 LEFT · ROW 2 MIDDLE · ROW 3 RIGHT)
                            </p>
                            <button
                              onClick={() => navigate('ads-credits')}
                              className="text-xs text-[#FF0033] font-semibold hover:underline cursor-pointer"
                            >
                              Remove Ads (20 Cr/mo) or Buy Ad Slot →
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {siteSettings.adRow1LeftActive && (
                              <AdGridCard
                                adKind="adsense-top-left"
                                title={siteSettings.adRow1Title}
                                sponsor={siteSettings.adRow1Sponsor}
                                ctaUrl={siteSettings.adRow1CtaUrl}
                                slotLabel="Row 1 · Top-Left AdSense Placement"
                              />
                            )}
                            {siteSettings.adRow2MiddleActive && (
                              <AdGridCard
                                adKind="sponsored-middle-row2"
                                title={siteSettings.adRow2Title}
                                sponsor={siteSettings.adRow2Sponsor}
                                ctaUrl={siteSettings.adRow2CtaUrl}
                                slotLabel="Row 2 · Middle Sponsored Placement"
                              />
                            )}
                            {siteSettings.adRow3RightActive && (
                              <AdGridCard
                                adKind="adsense-right-row3"
                                title={siteSettings.adRow3Title}
                                sponsor={siteSettings.adRow3Sponsor}
                                ctaUrl={siteSettings.adRow3CtaUrl}
                                slotLabel="Row 3 · Right AdSense Placement"
                              />
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : homeGridSlots.length === 0 ? (
                  <CentralParkNotFoundFallback resourceType="video" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7">
                    {homeGridSlots.map((slot, index) => {
                      if (slot.type === 'ad') {
                        return (
                          <AdGridCard
                            key={`ad_${slot.adKind}_${index}`}
                            adKind={slot.adKind}
                            title={slot.title}
                            sponsor={slot.sponsor}
                            ctaUrl={slot.ctaUrl}
                            slotLabel={slot.slotLabel}
                          />
                        );
                      }
                      return <VideoCard key={slot.video.id} video={slot.video} />;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ROUTE: ZTUBE ADS, SUBSCRIBER CREDITS & PLUS SUBSCRIPTION HUB */}
            {currentRoute === 'ads-credits' && <SubscriberCreditsAndAdsHub />}

            {/* ROUTE: CENTRAL PARK LIQUID GLASS LOGIN / SIGN UP */}
            {currentRoute === 'auth' && <CentralParkAuthPage />}

            {/* ROUTE: CENTRAL PARK 404 RESOURCE NOT FOUND FALLBACK */}
            {currentRoute === 'not-found' && (
              <CentralParkNotFoundFallback resourceType={missingResourceType} />
            )}

            {/* ROUTE: SHORTS FEED */}
            {currentRoute === 'shorts' && <ShortsFeedPage />}

            {/* ROUTE: COMMUNITY POSTS */}
            {currentRoute === 'posts' && <CommunityPostsPage />}

            {/* ROUTE: EMBEDDING API STUDIO */}
            {currentRoute === 'embed-api' && <EmbedApiStudioPage />}

            {/* ROUTE: TRENDING */}
            {currentRoute === 'trending' && (
              <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <Flame className="w-5 h-5 text-[#FF0033]" />
                  <div>
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                      Trending Across ZTube
                    </h1>
                    <p className="text-xs text-neutral-500">
                      Ranked by real-time unique-viewer velocity and creator engagement
                    </p>
                  </div>
                </div>
                {trendingVideos.length === 0 ? (
                  <CentralParkNotFoundFallback resourceType="video" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7">
                    {trendingVideos.map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ROUTE: SUBSCRIPTIONS */}
            {currentRoute === 'subscriptions' && (
              <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-[#FF0033]" />
                    <div>
                      <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                        Your Channel Subscriptions
                      </h1>
                      <p className="text-xs text-neutral-500">
                        Latest uploads from creators you follow (self-subscriptions disabled)
                      </p>
                    </div>
                  </div>
                </div>

                {subscriptions.length === 0 ? (
                  <div className="p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      You haven't subscribed to any channels yet.
                    </p>
                    <p className="text-xs text-neutral-500">
                      Open any video by another creator and click "Subscribe" next to the channel name.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7">
                    {videos
                      .filter((v) =>
                        subscriptions.some(
                          (s) => s.channelName.toLowerCase() === v.authorName.toLowerCase()
                        )
                      )
                      .map((v) => (
                        <VideoCard key={v.id} video={v} />
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ROUTE: DEDICATED WATCH LATER STUDIO */}
            {currentRoute === 'watch-later' && (
              <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
                <WatchLaterLibrarySection isDedicatedPage />
              </div>
            )}

            {/* ROUTE: LIBRARY, WATCH LATER, PLAYLISTS, HEART FAVORITES & OPTIONAL WATCH HISTORY */}
            {currentRoute === 'library' && (
              <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-8">
                {/* Watch Later Queue Studio Section inside Library */}
                <WatchLaterLibrarySection />

                {/* Playlists Studio Section */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ListMusic className="w-5 h-5 text-[#FF0033]" />
                      <div>
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                          Your Playlists ({playlists.length})
                        </h1>
                        <p className="text-xs text-neutral-500">
                          Create custom playlists, add videos from any card, copy shareable playlist links, or launch continuous playback
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Create Playlist Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newPlaylistName.trim()) return;
                      const createdId = createPlaylist(
                        newPlaylistName.trim(),
                        newPlaylistDesc.trim(),
                        newPlaylistPublic
                      );
                      setActivePlaylistId(createdId);
                      setNewPlaylistName('');
                      setNewPlaylistDesc('');
                    }}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                  >
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                        Playlist Title *
                      </label>
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="e.g., Late Night Gaming & Synth Mix"
                        className="w-full px-3 py-2 rounded-lg text-xs bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={newPlaylistDesc}
                        onChange={(e) => setNewPlaylistDesc(e.target.value)}
                        placeholder="Notes or theme for this playlist..."
                        className="w-full px-3 py-2 rounded-lg text-xs bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPlaylistPublic}
                          onChange={(e) => setNewPlaylistPublic(e.target.checked)}
                          className="rounded accent-[#FF0033]"
                        />
                        <span>Public</span>
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Playlist</span>
                      </button>
                    </div>
                  </form>

                  {/* Playlists Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map((pl) => {
                      const plVideos = videos.filter((v) => pl.videoIds.includes(v.id));
                      const isSelected = activePlaylistId === pl.id;
                      return (
                        <div
                          key={pl.id}
                          className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-[#FF0033] bg-[#FF0033]/5 dark:bg-[#FF0033]/10'
                              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417]'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {pl.title}
                                  </h3>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    {pl.isPublic ? 'Public' : 'Private'}
                                  </span>
                                </div>
                                {pl.description && (
                                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                                    {pl.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-mono font-bold text-[#FF0033] shrink-0">
                                {plVideos.length} videos
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/70 dark:border-neutral-800">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePlaylistId(isSelected ? null : pl.id)
                                }
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer"
                              >
                                {isSelected ? 'Hide Videos' : 'View Playlist'}
                              </button>
                              {plVideos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => navigate('watch', plVideos[0].id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FF0033] text-white flex items-center gap-1 cursor-pointer"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Play All</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = `${window.location.origin}${window.location.pathname}?playlist=${encodeURIComponent(
                                    pl.id
                                  )}`;
                                  try {
                                    await navigator.clipboard.writeText(url);
                                  } catch {
                                    // fallback
                                  }
                                  setCopiedPlaylistId(pl.id);
                                  pushNotification({
                                    title: 'Playlist Link Copied',
                                    message: `Copied ${url} to clipboard via Web Clipboard API.`,
                                    kind: 'video',
                                    targetRoute: 'library',
                                  });
                                  window.setTimeout(() => setCopiedPlaylistId(null), 2000);
                                }}
                                title="Copy Playlist Share Link (Web Clipboard API)"
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedPlaylistId === pl.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="w-3 h-3" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => deletePlaylist(pl.id)}
                                title="Delete Playlist"
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#FF0033] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded Playlist Videos View */}
                  {activePlaylistId && (() => {
                    const activePl = playlists.find((p) => p.id === activePlaylistId);
                    if (!activePl) return null;
                    const activePlVideos = videos.filter((v) => activePl.videoIds.includes(v.id));
                    return (
                      <div className="p-5 rounded-xl border border-[#FF0033]/40 bg-white dark:bg-[#141417] space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#FF0033] font-bold">
                              ACTIVE PLAYLIST
                            </span>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                              {activePl.title} ({activePlVideos.length} videos)
                            </h3>
                          </div>
                          { videos.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <select
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  toggleVideoInPlaylist(activePl.id, e.target.value);
                                  e.target.value = '';
                                }}
                                defaultValue=""
                                className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                              >
                                <option value="" disabled>
                                  + Quick-add or remove video...
                                </option>
                                {videos.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {activePl.videoIds.includes(v.id) ? '✓ Remove: ' : '+ Add: '}
                                    {v.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        {activePlVideos.length === 0 ? (
                          <p className="text-xs text-neutral-500">
                            This playlist has no videos yet. Click the Playlist icon on any VideoCard or use the selector above to add videos.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7">
                            {activePlVideos.map((v) => (
                              <VideoCard key={v.id} video={v} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Heart Favorites Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                    <Heart className="w-5 h-5 text-[#FF0033] fill-current" />
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                      Favorite Videos & Shorts ({favoriteVideoIds.length})
                    </h2>
                  </div>
                  {videos.filter((v) => favoriteVideoIds.includes(v.id)).length === 0 ? (
                    <p className="text-xs text-neutral-500">
                      No favorite videos or Shorts yet. Click the Heart icon on any video or Short to favorite it.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7">
                      {videos
                        .filter((v) => favoriteVideoIds.includes(v.id))
                        .map((v) => (
                          <VideoCard key={v.id} video={v} />
                        ))}
                    </div>
                  )}
                </div>

                {/* Optional Watch History Section */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-[#58f01b]" />
                      <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                          Optional Watch History ({watchHistoryIds.length})
                        </h2>
                        <p className="text-xs text-neutral-500">
                          {watchHistoryEnabled
                            ? 'Watch history recording is ON. You can pause or clear history anytime.'
                            : 'Watch history recording is PAUSED (Optional privacy mode active).'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWatchHistoryEnabled(!watchHistoryEnabled)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          watchHistoryEnabled
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {watchHistoryEnabled
                          ? 'Watch History: ON (Click to Pause)'
                          : 'Watch History: OFF / Paused (Click to Enable)'}
                      </button>

                      {watchHistoryIds.length > 0 && (
                        <button
                          type="button"
                          onClick={clearWatchHistory}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-[#FF0033] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Watch History</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {!watchHistoryEnabled && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400">
                      Optional Watch History is currently paused. Videos you watch while paused will not be added to your watch history.
                    </div>
                  )}

                  {videos.filter((v) => watchHistoryIds.includes(v.id)).length === 0 ? (
                    <p className="text-xs text-neutral-500">No watch history recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7">
                      {videos
                        .filter((v) => watchHistoryIds.includes(v.id))
                        .map((v) => (
                          <div key={v.id} className="relative group/hist">
                            <VideoCard video={v} />
                            <button
                              type="button"
                              onClick={() => removeFromWatchHistory(v.id)}
                              title="Remove this video from Watch History"
                              className="mt-1.5 text-[11px] font-mono text-neutral-400 hover:text-[#FF0033] flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove from history</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ROUTE: USER PROFILE / CHANNEL STUDIO */}
            {currentRoute === 'profile' && (
              <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-6">
                {!user ? (
                  <CentralParkAuthPage />
                ) : (
                  <>
                    <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={`${user.displayName || 'User'} avatar`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#FF0033] text-white flex items-center justify-center font-bold text-xl">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                            {user.displayName || user.email?.split('@')[0]}
                          </h1>
                          <p className="text-xs text-neutral-500 font-mono">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowCaptchaModal(true)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-blue-500/40 text-blue-600 dark:text-blue-400 cursor-pointer"
                        >
                          {backendApiKey ? `API Key: ${backendApiKey.slice(0, 12)}...` : 'Get Free 7+ API Key'}
                        </button>
                        <button
                          onClick={() => navigate('ads-credits')}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white cursor-pointer"
                        >
                          Manage Subscriber Credits & Plus
                        </button>
                        <button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload / Sync YouTube Video</span>
                        </button>
                      </div>
                    </div>

                    {/* Creator / Channel Owner Video Download API & All Videos Bulk Download API */}
                    <VideoDownloadApiConsole onOpenCaptchaModal={() => setShowCaptchaModal(true)} />

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                        <div>
                          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                            Your Uploaded &amp; Synced Channel Videos ({userVideos.length})
                          </h2>
                          <p className="text-xs text-neutral-500">
                            Browse and filter your channel uploads by category (Gaming, Tutorials, Music, Engineering, and more)
                          </p>
                        </div>

                        {/* User Profile Category Dropdown + Filter Bar */}
                        <div className="flex items-center gap-2 text-xs">
                          <label
                            htmlFor="profile-category-select"
                            className="text-neutral-500 font-medium"
                          >
                            Filter Category:
                          </label>
                          <select
                            id="profile-category-select"
                            value={profileSelectedCategory}
                            onChange={(e) => setProfileSelectedCategory(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-900 dark:text-white cursor-pointer"
                          >
                            {availableCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Profile Page Interactive Category Filter Pills */}
                      <div
                        role="tablist"
                        aria-label="Filter user profile videos by category"
                        className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar"
                      >
                        {availableCategories.map((cat) => {
                          const active = profileSelectedCategory === cat;
                          const catCount =
                            cat === 'All'
                              ? userVideos.length
                              : userVideos.filter(
                                  (v) => (v.category || '').toLowerCase() === cat.toLowerCase()
                                ).length;
                          return (
                            <button
                              key={cat}
                              role="tab"
                              aria-selected={active}
                              onClick={() => setProfileSelectedCategory(cat)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                active
                                  ? 'bg-[#FF0033] text-white shadow-xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              <span>{cat}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                  active
                                    ? 'bg-black/30 text-white'
                                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                                }`}
                              >
                                {catCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {userVideos.length === 0 ? (
                        <p className="text-xs text-neutral-500">
                          You have not published any videos under your account yet. Click &ldquo;Upload / Sync YouTube Video&rdquo; above to assign a category and watch real-time upload progress.
                        </p>
                      ) : userVideos.filter(
                          (v) =>
                            profileSelectedCategory === 'All' ||
                            (v.category || '').toLowerCase() ===
                              profileSelectedCategory.toLowerCase()
                        ).length === 0 ? (
                        <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] text-center space-y-2">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            No channel videos in the &ldquo;{profileSelectedCategory}&rdquo; category yet.
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setProfileSelectedCategory('All')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white cursor-pointer"
                            >
                              Show All Categories ({userVideos.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsUploadModalOpen(true)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF0033] text-white cursor-pointer"
                            >
                              Upload a {profileSelectedCategory} Video
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7">
                          {userVideos
                            .filter(
                              (v) =>
                                profileSelectedCategory === 'All' ||
                                (v.category || '').toLowerCase() ===
                                  profileSelectedCategory.toLowerCase()
                            )
                            .map((v) => (
                              <VideoCard key={v.id} video={v} />
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Ready-to-Use Prompt to Make an Android Version of ZTube */}
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#58f01b] font-bold">
                            ANDROID NATIVE VERSION PROMPT (KOTLIN + JETPACK COMPOSE + MEDIA3 EXOPLAYER)
                          </span>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                            Prompt to Build the Native Android Version of ZTube
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(ZTUBE_ANDROID_BUILD_PROMPT);
                            setCopiedAndroidPrompt(true);
                            setTimeout(() => setCopiedAndroidPrompt(false), 2500);
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer"
                        >
                          {copiedAndroidPrompt ? 'Copied Android Prompt!' : 'Copy Android Build Prompt'}
                        </button>
                      </div>
                      <pre className="p-3.5 rounded-xl bg-neutral-950 text-neutral-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed border border-neutral-800 max-h-60 overflow-y-auto">
                        {ZTUBE_ANDROID_BUILD_PROMPT}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ROUTE: VIDEO DETAILS & WATCH PAGE */}
            {currentRoute === 'watch' && <VideoDetailsPage />}

            <Suspense
              fallback={
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                  Loading deferred module...
                </div>
              }
            >
              {/* ROUTE: TELEMETRY & COMPRESSION OBSERVABILITY */}
              {currentRoute === 'telemetry' && <TelemetryPage />}

              {/* ROUTE: TERMS OF SERVICE */}
              {currentRoute === 'terms' && <TermsOfServicePage />}

              {/* ROUTE: PRIVACY POLICY */}
              {currentRoute === 'privacy' && <PrivacyPolicyPage />}

              {/* ROUTE: ADMIN PANEL */}
              {currentRoute === 'admin' && <AdminPanelPage />}

              {/* ROUTE: DOCS & SHORTCUTS GUIDE */}
              {currentRoute === 'docs' && <DocsSectionPage />}

              {/* ROUTE: LARAVEL + REACT TECHNICAL SPECIFICATION */}
              {currentRoute === 'blueprint' && <TechnicalSpecPage />}
            </Suspense>
          </main>

          {/* Non-Intrusive Accessible Contextual Tutorial Prompt & Step Card */}
          <ContextualTutorialBanner />

          {/* Persistent Cross-Browser Mini-Player Dock (Chromium / Safari / Firefox) */}
          <CrossBrowserMiniPlayerDock />

          {/* Clean Platform Footer */}
          <footer className="border-t border-neutral-200 dark:border-neutral-800 px-4 lg:px-6 py-4 mb-14 md:mb-0 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} ZTube Video Platform</span>
            <div className="flex flex-wrap items-center gap-5">
              <button
                onClick={() => navigate('docs')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-semibold text-sky-500"
              >
                <span>Docs & Shortcuts</span>
              </button>
              <button
                onClick={replayTutorial}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Replay Tutorial</span>
              </button>
              <button
                onClick={() => setShowCaptchaModal(true)}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                <span>Free 7+ API Key (Car Captcha)</span>
              </button>
              <button
                onClick={() => navigate('ads-credits')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-[#FF0033]" />
                <span>ZTube Ads & Subscriber Credits</span>
              </button>
              <button
                onClick={() => triggerResourceNotFound('video')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>404 Fallback Demo</span>
              </button>
              <button
                onClick={() => navigate('embed-api')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Website Embedding API</span>
              </button>
              <button
                onClick={() => navigate('terms')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </button>
              <button
                onClick={() => navigate('privacy')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </button>
              <button
                onClick={() => navigate('telemetry')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Telemetry & Compression</span>
              </button>
              <button
                onClick={() => navigate('blueprint')}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Laravel Tech Spec</span>
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Free 7+ API Key & Blue Car Captcha Modal */}
      <BlueCarApiKeyCaptchaModal
        isOpen={showCaptchaModal}
        onClose={() => setShowCaptchaModal(false)}
      />

      {/* VR / AR Room & Volumetric Player Demo Modal */}
      <VrArVolumetricPlayerModal
        isOpen={showVrDemoModal}
        video={
          videos[0] || {
            id: 'vr_demo',
            title: 'ZTube Spatial VR / AR Room & Volumetric 6DoF Demo',
            description:
              'Resizable spatial screen with camera AR room passthrough and 3D volumetric point-cloud rendering.',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
            videoUrl: '',
            category: 'Science',
            tags: ['vr', 'ar', 'volumetric'],
            duration: '03:45',
            views: 1,
            likes: 1,
            dislikes: 0,
            isVolumetricVr: true,
            minAgeRating: 7,
            authorId: 'system',
            authorName: 'ZTube Spatial Lab',
            createdAt: new Date().toISOString(),
          }
        }
        onClose={() => setShowVrDemoModal(false)}
      />

      {/* Upload & YouTube Auto-Sync Modal */}
      <UploadImportModal />

      {/* Floating Cookie Consent & Preference Banner */}
      <CookieConsentBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}
