import React, { useState, useEffect, useRef } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  Code2,
  Share2,
  Bookmark,
  Check,
  Sparkles,
  Globe,
  MapPin,
  Mail,
  Send,
  Trash2,
  ExternalLink,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  AlertCircle,
  RefreshCw,
  Crown,
  Lock,
  Settings,
  Glasses,
  Users,
  KeyRound,
  ShieldCheck,
  Subtitles,
  Languages,
  Download,
  Plus,
  PictureInPicture2,
  Monitor,
  Smartphone,
  Clock,
  Shuffle,
  Repeat,
  SkipForward,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { getAccessToken, googleSignIn } from '../firebase';
import {
  CaptionTrack,
  CreatorAudioTrack,
  GeminiPersonIdentification,
  PlayerColorTheme,
} from '../types';
import { CustomEmbedPlayerFrame } from './ShortsPostsAndEmbedPage';
import { CardTimelineHoverScrubber } from './VideoGridWithAds';
import { CentralParkNotFoundFallback } from './SubscriberCreditsAndAuthPages';
import {
  BlueCarApiKeyCaptchaModal,
  GoogleContactsSharePanel,
  VrArVolumetricPlayerModal,
} from './ApiKeyCaptchaAndVrComponents';
import {
  MarkdownCommentRenderer,
  MovingLiquidGlassWatermark,
  LiquidWatermarkVideoDownloadModal,
  triggerCrossBrowserNativePiP,
} from './DocsTutorialCursorAndDownload';
import { CustomZTubeVideoPlayer } from './CustomZTubeVideoPlayer';

interface ProVideoAnalysis {
  executiveSummary: string;
  chapters: { timestamp: string; heading: string; keyTakeaway: string }[];
  technicalInsights: string[];
  audienceRetentionHooks: string;
  accessibilityTranscriptSnippet: string;
}

export const VideoDetailsPage: React.FC = () => {
  const {
    videos,
    recommendedVideos,
    selectedVideoId,
    navigate,
    user,
    signIn,
    comments,
    addComment,
    deleteComment,
    subscriptions,
    toggleSubscription,
    removeSubscription,
    toggleLikeVideo,
    removeLikeVideo,
    toggleDislikeVideo,
    removeDislikeVideo,
    savedVideoIds,
    toggleSavedVideo,
    watchLaterEntries,
    watchLaterVideoIds,
    isVideoInWatchLater,
    toggleWatchLater,
    removeFromWatchLater,
    autoRemoveWatchLaterOnFinish,
    setAutoRemoveWatchLaterOnFinish,
    activeQueueMode,
    setActiveQueueMode,
    queueShuffle,
    queueLoop,
    setQueueLoop,
    activeQueueVideoIds,
    startWatchLaterQueue,
    favoriteVideoIds,
    toggleFavoriteVideo,
    removeFavoriteVideo,
    subscriptionTier,
    userLikesPerVideo,
    viewedVideoIdsByCurrentUser,
    backendApiKey,
    siteSettings,
    incrementViews,
    updateVideo,
    pushNotification,
    miniPlayerVideoId,
    setMiniPlayerVideoId,
    playerColorTheme,
    setPlayerColorTheme,
    userProfile,
    allUsers,
    toggleUserIdentityOptIn,
    autoAwardCreatorVisitCredit,
    setSelectedCategory,
  } = useApp();

  const video = selectedVideoId
    ? videos.find((v) => v.id === selectedVideoId)
    : videos[0];

  const [theaterMode, setTheaterMode] = useState(false);
  const [useEmbedOverlayMode, setUseEmbedOverlayMode] = useState(false);
  const [watchPlayerEngine, setWatchPlayerEngine] = useState<'video' | 'shorts'>('video');
  const [isPlayerFocused, setIsPlayerFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsSettingsMenu, setShowFsSettingsMenu] = useState(false);
  const [isPlayingHtmlVideo, setIsPlayingHtmlVideo] = useState(false);

  const [showVrArModal, setShowVrArModal] = useState(false);
  const [showApiKeyCaptchaModal, setShowApiKeyCaptchaModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [liveLiquidWatermarkEnabled, setLiveLiquidWatermarkEnabled] = useState(false);
  const [likeNotice, setLikeNotice] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [commentText, setCommentText] = useState('');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [isPolishingComment, setIsPolishingComment] = useState(false);

  // Captions (C key) & Multi-Language Creator Audio Tracks State
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(false);
  const [activeCaptionTrackId, setActiveCaptionTrackId] = useState<string>('cap_creator_en');
  const [captionTickSec, setCaptionTickSec] = useState<number>(0);
  const [isGeneratingAiCaptions, setIsGeneratingAiCaptions] = useState<boolean>(false);
  const [showCaptionAudioStudio, setShowCaptionAudioStudio] = useState<boolean>(false);
  const [customCreatorCueInput, setCustomCreatorCueInput] = useState<string>('');
  const [customCreatorCaptionLang, setCustomCreatorCaptionLang] = useState<string>('English');

  const [activeAudioTrackId, setActiveAudioTrackId] = useState<string>('aud_orig_en');
  const [newCreatorAudioLang, setNewCreatorAudioLang] = useState<string>('');
  const [newCreatorAudioCode, setNewCreatorAudioCode] = useState<string>('es-ES');

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [activeIntelTab, setActiveIntelTab] = useState<
    | 'pro-analysis'
    | 'gemini-identification'
    | 'view-velocity'
    | 'search-grounding'
    | 'maps-grounding'
    | 'contacts-share'
    | 'gmail-hub'
  >('gemini-identification');

  const [proAnalysis, setProAnalysis] = useState<ProVideoAnalysis | null>(null);
  const [isAnalyzingPro, setIsAnalyzingPro] = useState(false);

  // Gemini Video Summary & Privacy-Safe Person Identification State
  const [geminiIdSummary, setGeminiIdSummary] = useState<string>('');
  const [geminiPeople, setGeminiPeople] = useState<GeminiPersonIdentification[]>([]);
  const [isIdentifyingPeople, setIsIdentifyingPeople] = useState(false);
  const [geminiIdError, setGeminiIdError] = useState<string | null>(null);
  const [creatorOptInLocal, setCreatorOptInLocal] = useState<boolean>(true);
  const [creatorCastCreditsInput, setCreatorCastCreditsInput] = useState<string>('');
  const [disputeReasonInput, setDisputeReasonInput] = useState<Record<string, string>>({});

  // Anti-Abuse Auto-Claimed Credit Dwell & Real Interaction Tracker (30s minimum dwell + real interaction)
  const [dwellSeconds, setDwellSeconds] = useState<number>(0);
  const [hasRealInteraction, setHasRealInteraction] = useState<boolean>(false);
  const [autoCreditStatus, setAutoCreditStatus] = useState<{
    state: 'tracking' | 'awarded' | 'blocked' | 'self_visit';
    message: string;
  }>({
    state: 'tracking',
    message: 'Tracking 30s minimum dwell time & real interaction for auto-claimed creator credit...',
  });
  const autoAwardAttemptedRef = useRef<string | null>(null);

  const [searchQueryInput, setSearchQueryInput] = useState('');
  const [searchGroundingResult, setSearchGroundingResult] = useState<{
    text: string;
    sources: { title: string; uri: string }[];
  } | null>(null);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  const [mapsQueryInput, setMapsQueryInput] = useState('');
  const [mapsGroundingResult, setMapsGroundingResult] = useState<{
    text: string;
    places: { title: string; uri: string; reviewSnippets?: string[] }[];
  } | null>(null);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [gmailInboxMessages, setGmailInboxMessages] = useState<
    { id: string; snippet: string; subject: string; from: string }[]
  >([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  useEffect(() => {
    if (video) {
      incrementViews(video.id);
      setProAnalysis(null);
      setGeminiIdSummary('');
      setGeminiPeople([]);
      setGeminiIdError(null);
      setCreatorOptInLocal(video.creatorIdentityDetectionOptIn ?? true);
      setCreatorCastCreditsInput(
        video.creatorCastCredits || `Creator & Host: ${video.authorName} (${video.category})`
      );
      setSearchGroundingResult(null);
      setMapsGroundingResult(null);
      setSearchQueryInput(video.title);
      setMapsQueryInput(video.locationTag || video.title);
      setDwellSeconds(0);
      setHasRealInteraction(false);
      autoAwardAttemptedRef.current = null;
      if (user?.uid && user.uid === video.authorId) {
        setAutoCreditStatus({
          state: 'self_visit',
          message: "No Self-Crediting: Creator's own visits do not count toward auto-claimed credits.",
        });
      } else {
        setAutoCreditStatus({
          state: 'tracking',
          message: 'Anti-Abuse Dwell Gate: 0/30s dwell time · Interact with player/page to verify.',
        });
      }
      if (user?.email && !recipientEmail) {
        setRecipientEmail(user.email);
      }
    }
  }, [video?.id]);

  // Track real user interaction (pointer move, click, keydown, scroll) + 1s dwell counter for Auto-Claimed Credits
  useEffect(() => {
    const markInteraction = () => setHasRealInteraction(true);
    window.addEventListener('pointerdown', markInteraction, { passive: true });
    window.addEventListener('keydown', markInteraction, { passive: true });
    window.addEventListener('scroll', markInteraction, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', markInteraction);
      window.removeEventListener('keydown', markInteraction);
      window.removeEventListener('scroll', markInteraction);
    };
  }, []);

  useEffect(() => {
    if (!video) return;
    const timer = window.setInterval(() => {
      setDwellSeconds((prev) => {
        const next = prev + 1;
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [video?.id]);

  useEffect(() => {
    if (!video) return;
    if (user?.uid && user.uid === video.authorId) {
      setAutoCreditStatus({
        state: 'self_visit',
        message: "No Self-Crediting: Creator's own visits do not count toward auto-claimed credits.",
      });
      return;
    }
    if (dwellSeconds < 30) {
      setAutoCreditStatus({
        state: 'tracking',
        message: `Auto-Credit Dwell Gate: ${dwellSeconds}/30s (${
          hasRealInteraction ? 'Real interaction verified ✓' : 'Awaiting pointer/key interaction...'
        })`,
      });
      return;
    }
    if (
      dwellSeconds >= 30 &&
      hasRealInteraction &&
      autoAwardAttemptedRef.current !== video.id
    ) {
      autoAwardAttemptedRef.current = video.id;
      autoAwardCreatorVisitCredit(video, dwellSeconds, true).then((res) => {
        if (res.awarded) {
          setAutoCreditStatus({
            state: 'awarded',
            message: `Auto-Claimed +1 Credit to ${video.authorName} (Verified unique user, ≥30s dwell, fingerprint & IP passed).`,
          });
        } else {
          setAutoCreditStatus({
            state: 'blocked',
            message: res.reason || 'Credit not awarded (already counted today or sign-in required).',
          });
        }
      });
    }
  }, [dwellSeconds, hasRealInteraction, video?.id, user?.uid]);

  // Listen for native fullscreenchange events
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Global 'C' key listener to toggle Captions and 'I' key listener to launch Mini-Player
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCaptionsEnabled((prev) => !prev);
      } else if ((e.key === 'i' || e.key === 'I') && video) {
        e.preventDefault();
        setMiniPlayerVideoId(miniPlayerVideoId === video.id ? null : video.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [video?.id, miniPlayerVideoId]);

  // Advance synchronized subtitle cue clock when captions are enabled
  useEffect(() => {
    if (!captionsEnabled) return;
    const timer = window.setInterval(() => {
      if (htmlVideoRef.current && !htmlVideoRef.current.paused) {
        setCaptionTickSec(Math.floor(htmlVideoRef.current.currentTime) % 36);
      } else {
        setCaptionTickSec((prev) => (prev + 1) % 36);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [captionsEnabled]);

  if (!video) {
    return <CentralParkNotFoundFallback resourceType="video" />;
  }

  // Parse Creator-Made & AI Captions tracks for this video
  const parsedCaptionTracks: CaptionTrack[] = (() => {
    try {
      if (video.captionTracksJson) {
        const arr = JSON.parse(video.captionTracksJson);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'cap_creator_en',
        label: `English (${video.authorName} Creator Subtitles)`,
        lang: 'en',
        isAiGenerated: false,
        creatorName: video.authorName,
        cues: [
          { startSec: 0, endSec: 10, text: `${video.title} — Official Creator Subtitle Track.` },
          {
            startSec: 10,
            endSec: 22,
            text: `Filmed & mastered by ${video.authorName} (${video.category}). Press C anytime to toggle captions.`,
          },
          {
            startSec: 22,
            endSec: 36,
            text: 'Switch between Creator-Made Captions, AI Captions, and Multi-Language Audio Tracks below.',
          },
        ],
      },
      {
        id: 'cap_ai_auto',
        label: 'English (AI Auto-Captions)',
        lang: 'en',
        isAiGenerated: true,
        creatorName: 'Gemini AI Subtitle Engine',
        cues: [
          { startSec: 0, endSec: 12, text: `[Auto-Transcribed] ${video.title} by ${video.authorName}.` },
          {
            startSec: 12,
            endSec: 24,
            text: `[Auto-Transcribed] Key topic tags: ${(video.tags || []).join(', ') || video.category}.`,
          },
          {
            startSec: 24,
            endSec: 36,
            text: '[Auto-Transcribed] Streamed via ZTube AV1 WebM custom perceptual compression.',
          },
        ],
      },
    ];
  })();

  const activeCaptionTrack =
    parsedCaptionTracks.find((t) => t.id === activeCaptionTrackId) || parsedCaptionTracks[0];
  const activeCaptionCue =
    activeCaptionTrack?.cues.find(
      (c) => captionTickSec >= c.startSec && captionTickSec <= c.endSec
    ) || activeCaptionTrack?.cues[0];

  // Parse Multiple Single-Language Creator Audio Tracks
  const parsedAudioTracks: CreatorAudioTrack[] = (() => {
    try {
      if (video.audioTracksJson) {
        const arr = JSON.parse(video.audioTracksJson);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'aud_orig_en',
        languageCode: 'en-US',
        languageLabel: 'English (Creator Original Master)',
        creatorLabel: `${video.authorName} · Original`,
        isDefault: true,
      },
      {
        id: 'aud_creator_es',
        languageCode: 'es-ES',
        languageLabel: 'Español (Creator Single-Language Track)',
        creatorLabel: `${video.authorName} · Spanish Dub`,
        isDefault: false,
      },
      {
        id: 'aud_creator_ja',
        languageCode: 'ja-JP',
        languageLabel: '日本語 (Creator Single-Language Track)',
        creatorLabel: `${video.authorName} · Japanese Dub`,
        isDefault: false,
      },
      {
        id: 'aud_creator_fr',
        languageCode: 'fr-FR',
        languageLabel: 'Français (Creator Single-Language Track)',
        creatorLabel: `${video.authorName} · French Dub`,
        isDefault: false,
      },
    ];
  })();

  const activeAudioTrack =
    parsedAudioTracks.find((a) => a.id === activeAudioTrackId) || parsedAudioTracks[0];

  const handleSelectCreatorAudioTrack = (track: CreatorAudioTrack) => {
    setActiveAudioTrackId(track.id);
    setLikeNotice(`Switched audio track to: ${track.languageLabel} (${track.languageCode})`);
    // Speak a brief synchronized confirmation in that language track if Web Speech API is available
    if ('speechSynthesis' in window && !track.isDefault) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(
          track.sampleSummaryText || `${video.title} — ${track.languageLabel}`
        );
        utter.lang = track.languageCode;
        utter.rate = track.voiceRate || 1.0;
        utter.pitch = track.voicePitch || 1.0;
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore
      }
    }
  };

  const handleGenerateAiCaptionsOnWatchPage = async () => {
    setIsGeneratingAiCaptions(true);
    try {
      const res = await fetch('/api/ai/generate-captions-and-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          targetLanguageLabel: customCreatorCaptionLang || 'English',
          targetLanguageCode: (customCreatorCaptionLang || 'en').slice(0, 2).toLowerCase(),
        }),
      });
      const data = await res.json();
      const newTrack: CaptionTrack = {
        id: `cap_ai_${Date.now()}`,
        label: `${customCreatorCaptionLang || 'English'} (AI Captions)`,
        lang: (customCreatorCaptionLang || 'en').slice(0, 2).toLowerCase(),
        isAiGenerated: true,
        creatorName: 'Gemini AI Subtitle Engine',
        cues: Array.isArray(data.cues) ? data.cues : [],
      };
      const updated = [...parsedCaptionTracks, newTrack];
      await updateVideo(video.id, { captionTracksJson: JSON.stringify(updated) });
      setActiveCaptionTrackId(newTrack.id);
      setCaptionsEnabled(true);
      pushNotification({
        title: 'AI Captions Generated',
        message: `Added AI-generated (${customCreatorCaptionLang}) captions to "${video.title}".`,
        kind: 'caption_audio',
        targetRoute: 'watch',
        targetVideoId: video.id,
      });
    } catch {
      // ignore
    } finally {
      setIsGeneratingAiCaptions(false);
    }
  };

  const handleAddCreatorMadeCaptionOnWatchPage = async () => {
    if (!customCreatorCueInput.trim()) return;
    const lines = customCreatorCueInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const cues = lines.map((text, idx) => ({
      startSec: idx * 10,
      endSec: (idx + 1) * 10,
      text,
    }));
    const newTrack: CaptionTrack = {
      id: `cap_creator_${Date.now()}`,
      label: `${customCreatorCaptionLang || 'Custom'} (Creator-Made)`,
      lang: (customCreatorCaptionLang || 'en').slice(0, 2).toLowerCase(),
      isAiGenerated: false,
      creatorName: user?.displayName || video.authorName,
      cues,
    };
    const updated = [...parsedCaptionTracks, newTrack];
    await updateVideo(video.id, { captionTracksJson: JSON.stringify(updated) });
    setActiveCaptionTrackId(newTrack.id);
    setCaptionsEnabled(true);
    setCustomCreatorCueInput('');
  };

  const handleAddCustomAudioLanguageTrackOnWatchPage = async () => {
    const cleanLang = newCreatorAudioLang.trim() || newCreatorAudioCode;
    if (!cleanLang) return;
    const newAudio: CreatorAudioTrack = {
      id: `aud_custom_${Date.now()}`,
      languageCode: newCreatorAudioCode,
      languageLabel: `${cleanLang} (Creator Single-Language Track)`,
      creatorLabel: `${user?.displayName || video.authorName} · ${cleanLang}`,
      isDefault: false,
    };
    const updated = [...parsedAudioTracks, newAudio];
    await updateVideo(video.id, { audioTracksJson: JSON.stringify(updated) });
    setNewCreatorAudioLang('');
    handleSelectCreatorAudioTrack(newAudio);
  };

  const isLockedMemberVideo =
    Boolean(video.isMemberOnly) &&
    subscriptionTier !== 'plus' &&
    video.authorId !== user?.uid;
  const userCurrentLikes = userLikesPerVideo[video.id] || 0;
  const maxLikesAllowed = subscriptionTier === 'plus' ? 2 : 1;

  const videoComments = comments.filter((c) => c.videoId === video.id);
  const inWatchLater = isVideoInWatchLater(video.id);
  const watchLaterPositionIndex = watchLaterEntries.findIndex((e) => e.videoId === video.id);
  const isFavorited = favoriteVideoIds.includes(video.id);
  const likesCount = video.likes || 0;
  const dislikesCount = video.dislikes || 0;
  const totalVotes = likesCount + dislikesCount;
  const likeRatioPercent = totalVotes > 0 ? Math.round((likesCount / totalVotes) * 100) : 100;

  // Check if current user owns this channel (Self-subscription prevention!)
  const isOwnChannel = Boolean(
    user &&
      (video.authorId === user.uid ||
        (user.displayName &&
          video.authorName.trim().toLowerCase() === user.displayName.trim().toLowerCase()))
  );

  const isSubscribed = subscriptions.some(
    (s) => s.channelName.toLowerCase() === video.authorName.toLowerCase()
  );

  const isYoutubeEmbed =
    video.videoUrl.includes('youtube.com/embed') ||
    Boolean(video.youtubeId && video.videoUrl.includes('youtube'));

  const toggleFullscreenPlayer = async () => {
    if (!playerContainerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await playerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const togglePlayPauseOnFocusedPlayer = () => {
    if (htmlVideoRef.current) {
      if (htmlVideoRef.current.paused) {
        htmlVideoRef.current.play().catch(() => {});
        setIsPlayingHtmlVideo(true);
      } else {
        htmlVideoRef.current.pause();
        setIsPlayingHtmlVideo(false);
      }
    } else if (ytIframeRef.current?.contentWindow) {
      // Send YouTube IFrame Player API postMessage command
      const nextPlaying = !isPlayingHtmlVideo;
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextPlaying ? 'playVideo' : 'pauseVideo',
          args: [],
        }),
        '*'
      );
      setIsPlayingHtmlVideo(nextPlaying);
    }
  };

  // Keyboard shortcuts while focused on the video container:
  // - 'F' or 'f' -> Toggle Full-Screen
  // - 'K', 'k', or Spacebar (' ') -> Play / Pause
  const handlePlayerKeyDown = (_e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handled globally by CustomZTubeVideoPlayer's global keyboard shortcut manager (J, K, L, M, F, C, ?)
  };

  const handleRunProVideoAnalysis = async () => {
    setIsAnalyzingPro(true);
    try {
      const res = await fetch('/api/ai/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          category: video.category,
          tags: video.tags,
          authorName: video.authorName,
          duration: video.duration,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProAnalysis(data);
      }
    } catch (err) {
      console.error('Video analysis error:', err);
    } finally {
      setIsAnalyzingPro(false);
    }
  };

  const handleRunSearchGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchingWeb(true);
    try {
      const res = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQueryInput,
          videoTitle: video.title,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSearchGroundingResult(data);
      }
    } catch (err) {
      console.error('Search grounding error:', err);
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const handleRunMapsGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchingMaps(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2500 })
          );
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          // ignore
        }
      }

      const res = await fetch('/api/ai/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationQuery: mapsQueryInput || video.locationTag || video.title,
          videoTitle: video.title,
          latitude,
          longitude,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMapsGroundingResult(data);
      }
    } catch (err) {
      console.error('Maps grounding error:', err);
    } finally {
      setIsSearchingMaps(false);
    }
  };

  const handlePolishComment = async () => {
    setIsPolishingComment(true);
    try {
      const res = await fetch('/api/ai/fast-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          draftComment: commentText,
        }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setCommentText(data.suggestion);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPolishingComment(false);
    }
  };

  // Run Gemini Video Summary & Privacy-Safe Person Identification (Latest Gemini Model)
  const handleRunGeminiIdentification = async () => {
    setGeminiIdError(null);
    if (!creatorOptInLocal) {
      setGeminiIdError(
        'Creator Identity-Detection Opt-In is currently disabled for this video. Enable Creator Opt-In first.'
      );
      return;
    }

    setIsIdentifyingPeople(true);
    try {
      const optedInUsers = allUsers
        .filter((u) => u.identityOptIn)
        .map((u) => u.displayName);
      if (userProfile?.identityOptIn && userProfile.displayName) {
        optedInUsers.push(userProfile.displayName);
      }

      const res = await fetch('/api/ai/identify-video-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          description: video.description,
          authorName: video.authorName,
          creatorIdentityDetectionOptIn: creatorOptInLocal,
          creatorCastCredits: creatorCastCreditsInput,
          optedInZTubeUsers: Array.from(new Set(optedInUsers)),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeminiIdError(data.error || 'Could not run Gemini Identification.');
      } else {
        setGeminiIdSummary(data.videoSummary || '');
        setGeminiPeople(Array.isArray(data.identifications) ? data.identifications : []);
      }
    } catch (err: any) {
      setGeminiIdError(err.message || 'Gemini Identification failed.');
    } finally {
      setIsIdentifyingPeople(false);
    }
  };

  const handleDisputeOrRemoveIdentification = async (
    identificationId: string,
    action: 'dispute' | 'remove'
  ) => {
    const reason =
      disputeReasonInput[identificationId]?.trim() ||
      (action === 'remove'
        ? 'Removed by identified subject request'
        : 'Disputed accuracy/attribution by identified subject');
    try {
      const res = await fetch('/api/ai/dispute-identification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificationId, action, reason }),
      });
      if (res.ok) {
        if (action === 'remove') {
          setGeminiPeople((prev) => prev.filter((p) => p.id !== identificationId));
        } else {
          setGeminiPeople((prev) =>
            prev.map((p) =>
              p.id === identificationId
                ? { ...p, disputed: true, disputeReason: reason }
                : p
            )
          );
        }
      }
    } catch {
      // ignore
    }
  };

  // Generate 14-day Daily View Velocity & Engagement Trend Data for Recharts LineChart
  const viewVelocityChartData = (() => {
    const baseViews = Math.max(24, video.views || 48);
    const baseLikes = Math.max(8, video.likes || 14);
    const seed = video.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const points: {
      day: string;
      dailyViews: number;
      engagementScore: number;
      uniqueVerifiedViews: number;
    }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400 * 1000);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const wave = Math.sin((i + (seed % 7)) * 0.65) * 0.28 + 1;
      const growthFactor = (14 - i) / 14;
      const dailyViews = Math.max(
        5,
        Math.round((baseViews * 0.14 + growthFactor * baseViews * 0.25) * wave)
      );
      const engagementScore = Math.max(
        3,
        Math.round((baseLikes * 0.35 + dailyViews * 0.32) * (0.9 + ((seed + i) % 5) * 0.06))
      );
      const uniqueVerifiedViews = Math.max(2, Math.round(dailyViews * 0.78));
      points.push({
        day: label,
        dailyViews,
        engagementScore,
        uniqueVerifiedViews,
      });
    }
    return points;
  })();

  const handleLoadGmailAlerts = async () => {
    setGmailStatus(null);
    let token = await getAccessToken();
    if (!token) {
      const authRes = await googleSignIn([
        'https://www.googleapis.com/auth/gmail.readonly',
      ]).catch(() => null);
      token = authRes?.accessToken || (await getAccessToken());
    }
    if (!token) {
      setGmailStatus({
        type: 'error',
        msg: 'Please grant Gmail read access (or ensure your email is added under Test Users in Google Cloud OAuth Consent Screen for ZEGA\'s app).',
      });
      return;
    }

    setIsLoadingInbox(true);
    try {
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=4',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!listRes.ok) {
        throw new Error('Could not fetch Gmail messages. Re-authenticate with Google if token expired.');
      }
      const listData = await listRes.json();
      const messages = listData.messages || [];
      const details: { id: string; snippet: string; subject: string; from: string }[] = [];

      for (const m of messages.slice(0, 4)) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const headers = msgData.payload?.headers || [];
          const subj = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Sender';
          details.push({
            id: m.id,
            snippet: msgData.snippet || '',
            subject: subj,
            from,
          });
        }
      }
      setGmailInboxMessages(details);
    } catch (err: any) {
      setGmailStatus({ type: 'error', msg: err.message || 'Failed to read Gmail messages.' });
    } finally {
      setIsLoadingInbox(false);
    }
  };

  const executeConfirmedGmailSend = async () => {
    setShowSendConfirmModal(false);
    setGmailStatus(null);
    let token = await getAccessToken();
    if (!token) {
      const authRes = await googleSignIn([
        'https://www.googleapis.com/auth/gmail.send',
      ]).catch(() => null);
      token = authRes?.accessToken || (await getAccessToken());
    }
    if (!token) {
      setGmailStatus({
        type: 'error',
        msg: 'Please authorize Gmail send access (or use the Backend Contacts Share API if OAuth consent screen is in Testing mode).',
      });
      return;
    }

    setIsSendingGmail(true);
    try {
      const subject = `ZTube Video Digest: ${video.title}`;
      const bodyLines = [
        `Hi there,`,
        ``,
        `I wanted to share this video from ZTube with you:`,
        `Title: ${video.title}`,
        `Creator: ${video.authorName} · Category: ${video.category} · Duration: ${video.duration}`,
        emailNote ? `Personal Note: ${emailNote}` : '',
        proAnalysis ? `\nGemini Pro Executive Summary:\n${proAnalysis.executiveSummary}` : '',
        ``,
        `Watch on ZTube: ${window.location.origin}/?watch=${encodeURIComponent(video.id)}`,
      ]
        .filter(Boolean)
        .join('\r\n');

      const mimeMessage = [
        `To: ${recipientEmail.trim()}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        bodyLines,
      ].join('\r\n');

      const base64UrlEncoded = btoa(unescape(encodeURIComponent(mimeMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: base64UrlEncoded }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || 'Gmail API rejected send request.');
      }

      setGmailStatus({
        type: 'success',
        msg: `Email digest successfully sent to ${recipientEmail} via Gmail!`,
      });
      setEmailNote('');
    } catch (err: any) {
      setGmailStatus({
        type: 'error',
        msg: err.message || 'Failed to send email via Gmail.',
      });
    } finally {
      setIsSendingGmail(false);
    }
  };

  // Up Next list powered by the personalized recommendation algorithm!
  const relatedVideos = recommendedVideos.filter((v) => v.id !== video.id);

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
      <div className={`grid grid-cols-1 ${theaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6`}>
        {/* Left / Primary Video & Intelligence Column */}
        <div className={theaterMode ? 'col-span-1' : 'lg:col-span-8 space-y-5'}>
          {/* Video Player Viewport:
              - Shows #58f01b 1px outline when focused
              - Supports F for Full-Screen and K / Spacebar for Play/Pause while focused
              - Includes Full-Screen Action HUD: like · dislike · favorite · share · settings · shrink */}
          {isLockedMemberVideo ? (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#0F0F0F] via-[#18181B] to-[#1F1218] border-2 border-[#FF0033] shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF0033]/20 border border-[#FF0033]/50 text-[#FF0033] flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <span className="px-2.5 py-0.5 rounded bg-[#FF0033] text-white text-[10px] font-mono font-bold uppercase">
                  SPECIAL MEMBER-ONLY VIDEO · +0.001 CREDITS/VIEW TO CREATOR
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Upgrade to ZTube Plus Mode (50 Subscriber Credits/mo) to Watch
                </h2>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  This exclusive video by <strong>{video.authorName}</strong> requires a ZTube Plus Mode subscription. Watching Member-Only videos pays the creator <strong>0.001 Subscriber Credits per view</strong>!
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate('ads-credits')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Unlock with Plus Mode (50 Subscriber Credits/mo)</span>
                </button>
              </div>
            </div>
          ) : useEmbedOverlayMode ? (
            <CustomEmbedPlayerFrame video={video} />
          ) : (
            <CustomZTubeVideoPlayer
              video={video}
              variant="watch"
              engineOverride={watchPlayerEngine}
              onEngineChange={(eng) => setWatchPlayerEngine(eng)}
              captionsEnabled={captionsEnabled}
              onToggleCaptions={() => setCaptionsEnabled((prev) => !prev)}
              activeCaptionTrack={activeCaptionTrack}
              parsedCaptionTracks={parsedCaptionTracks}
              onSelectCaptionTrack={(trackId) => {
                setActiveCaptionTrackId(trackId);
                setCaptionsEnabled(true);
              }}
              activeAudioTrack={activeAudioTrack}
              parsedAudioTracks={parsedAudioTracks}
              onSelectAudioTrack={handleSelectCreatorAudioTrack}
              liveLiquidWatermarkEnabled={liveLiquidWatermarkEnabled}
              usernameHandle={
                user?.displayName || user?.email?.split('@')[0] || video.authorName || 'john123'
              }
              onOpenMiniPlayer={() =>
                setMiniPlayerVideoId(miniPlayerVideoId === video.id ? null : video.id)
              }
              onToggleTheater={() => setTheaterMode((prev) => !prev)}
              theaterMode={theaterMode}
              onLike={() => toggleLikeVideo(video.id)}
              onRemoveLike={async () => {
                const removed = await removeLikeVideo(video.id);
                if (removed) setLikeNotice('Removed your Like entry (Right-Click Undo).');
              }}
              onDislike={() => toggleDislikeVideo(video.id)}
              onRemoveDislike={async () => {
                const removed = await removeDislikeVideo(video.id);
                if (removed) setLikeNotice('Removed your Dislike entry (Right-Click Undo).');
              }}
              onFavorite={() => toggleFavoriteVideo(video.id)}
              onRemoveFavorite={() => {
                const removed = removeFavoriteVideo(video.id);
                if (removed) setLikeNotice('Removed from Heart Favorites (Right-Click Undo).');
              }}
              isFavorited={isFavorited}
              likesCount={likesCount}
              dislikesCount={dislikesCount}
              externalVideoRef={htmlVideoRef}
            />
          )}

          {/* Player Control Bar & Speed / VR Mode / Full-Screen / Theater / Embed Overlay Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 text-neutral-600 dark:text-neutral-400">
              <span className="font-mono tabular-nums">Duration: {video.duration}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {video.serverDownloadedTranscoded
                  ? 'Server-Downloaded & Converted AV1 WebM'
                  : video.compressionCodec || 'AV1 WebM + WebP'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                Age {video.minAgeRating || 7}+ Rated
              </span>
              {viewedVideoIdsByCurrentUser.includes(video.id) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px] text-sky-500">
                    1/1 Unique User View Counted
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Dual Custom Player Engine Switcher: 16:9 Video Engine vs 9:16 Shorts Engine */}
              <div className="inline-flex items-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1E1E24] p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setUseEmbedOverlayMode(false);
                    setWatchPlayerEngine('video');
                  }}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    !useEmbedOverlayMode && watchPlayerEngine === 'video'
                      ? 'bg-[#FF0033] text-white'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Use 16:9 Widescreen Video Engine"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Video Engine (16:9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseEmbedOverlayMode(false);
                    setWatchPlayerEngine('shorts');
                  }}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    !useEmbedOverlayMode && watchPlayerEngine === 'shorts'
                      ? 'bg-[#FF0033] text-white'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Use 9:16 Vertical Shorts Engine"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Shorts Engine (9:16)</span>
                </button>
              </div>

              {/* Toggle Captions (Shortcut: C) */}
              <button
                type="button"
                onClick={() => setCaptionsEnabled((prev) => !prev)}
                className={`px-2.5 py-1 rounded border flex items-center gap-1 font-semibold cursor-pointer ${
                  captionsEnabled
                    ? 'bg-amber-500 text-neutral-950 border-amber-500'
                    : 'bg-white dark:bg-[#27272A] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                }`}
                title="Toggle Creator-Made or AI Captions (Keyboard Shortcut: C)"
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>{captionsEnabled ? 'Captions: ON (C)' : 'Captions (C)'}</span>
              </button>

              {/* Open Captions & Multi-Language Creator Audio Track Selector */}
              <button
                type="button"
                onClick={() => setShowCaptionAudioStudio((prev) => !prev)}
                className="px-2.5 py-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1 font-semibold cursor-pointer"
                title="Switch Creator/AI Captions or Multi-Language Creator Audio Tracks"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Audio ({parsedAudioTracks.length}) & CC</span>
              </button>

              <button
                type="button"
                onClick={togglePlayPauseOnFocusedPlayer}
                className="px-2.5 py-1 rounded bg-white dark:bg-[#27272A] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:border-[#58f01b] flex items-center gap-1 cursor-pointer"
                title="Play / Pause (K or Spacebar while player focused)"
              >
                {isPlayingHtmlVideo ? (
                  <Pause className="w-3.5 h-3.5 text-[#58f01b]" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[#58f01b]" />
                )}
                <span>Play/Pause (K)</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreenPlayer}
                className="px-2.5 py-1 rounded bg-white dark:bg-[#27272A] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:border-[#58f01b] flex items-center gap-1 cursor-pointer"
                title="Full-Screen with Like/Dislike/Favorite/Share/Settings/Shrink HUD (Shortcut: F)"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#58f01b]" />
                <span>Full-Screen (F)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const res = await triggerCrossBrowserNativePiP(htmlVideoRef.current);
                  setMiniPlayerVideoId(video.id);
                  if (res.mode === 'chromium_safari_native') {
                    setLikeNotice(`Activated ${res.engine} Native Picture-in-Picture + Floating Mini-Player!`);
                  } else {
                    setLikeNotice(`Activated ${res.engine} Docked Mini-Player! Browse Home or Shorts while watching.`);
                  }
                }}
                className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/35 hover:bg-purple-500/25 flex items-center gap-1 font-semibold cursor-pointer"
                title="Launch Mini-Player for Chromium / Safari / Firefox (Keyboard Shortcut: I)"
              >
                <PictureInPicture2 className="w-3.5 h-3.5" />
                <span>Mini-Player (I)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVrArModal(true)}
                className="px-2.5 py-1 rounded bg-[#58f01b]/15 text-neutral-900 dark:text-[#58f01b] border border-[#58f01b]/40 hover:bg-[#58f01b]/25 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Glasses className="w-3.5 h-3.5" />
                <span>VR / AR Room Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setUseEmbedOverlayMode(!useEmbedOverlayMode)}
                className="px-2.5 py-1 rounded bg-white dark:bg-[#27272A] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:border-[#FF0033] flex items-center gap-1 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-[#FF0033]" />
                <span>{useEmbedOverlayMode ? 'Standard Player' : 'Embed Overlay'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheaterMode(!theaterMode)}
                className="px-2.5 py-1 rounded bg-white dark:bg-[#27272A] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 flex items-center gap-1 cursor-pointer"
              >
                {theaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{theaterMode ? 'Standard' : 'Theater'}</span>
              </button>
            </div>
          </div>

          {/* EXPANDABLE CAPTIONS (CREATOR + AI) & MULTI-LANGUAGE CREATOR AUDIO TRACK PANEL */}
          {showCaptionAudioStudio && (
            <div className="p-4 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Creator-Made Captions & AI Captions (C key) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Subtitles className="w-4 h-4 text-amber-500" />
                      <span>Closed Captions (Shortcut: C)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiCaptionsOnWatchPage}
                      disabled={isGeneratingAiCaptions}
                      className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isGeneratingAiCaptions ? 'Generating...' : '+ Generate AI Captions'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {parsedCaptionTracks.map((tr) => {
                      const active = captionsEnabled && activeCaptionTrack.id === tr.id;
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          onClick={() => {
                            setActiveCaptionTrackId(tr.id);
                            setCaptionsEnabled(true);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                            active
                              ? 'border-amber-500 bg-amber-500/15 text-neutral-900 dark:text-white font-bold'
                              : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18181B]'
                          }`}
                        >
                          <span>{tr.label}</span>
                          {tr.isAiGenerated && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-neutral-950 font-mono text-[9px] font-bold">
                              AI GENERATED
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={customCreatorCaptionLang}
                      onChange={(e) => setCustomCreatorCaptionLang(e.target.value)}
                      placeholder="Language (e.g. English, Español)"
                      className="w-28 px-2 py-1 rounded bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700"
                    />
                    <input
                      type="text"
                      value={customCreatorCueInput}
                      onChange={(e) => setCustomCreatorCueInput(e.target.value)}
                      placeholder="Add creator-made caption text..."
                      className="flex-1 px-2 py-1 rounded bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddCreatorMadeCaptionOnWatchPage}
                      className="px-2.5 py-1 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold cursor-pointer"
                    >
                      + Creator CC
                    </button>
                  </div>
                </div>

                {/* Right: Multiple Single-Language Creator Audio Tracks in Any Language */}
                <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 pt-3 md:pt-0 md:pl-4">
                  <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-sky-500" />
                    <span>Multiple Single-Language Creator Audio Tracks</span>
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {parsedAudioTracks.map((at) => {
                      const active = activeAudioTrack.id === at.id;
                      return (
                        <button
                          key={at.id}
                          type="button"
                          onClick={() => handleSelectCreatorAudioTrack(at)}
                          className={`px-2.5 py-1.5 rounded-lg border font-mono text-[11px] cursor-pointer ${
                            active
                              ? 'border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold'
                              : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18181B]'
                          }`}
                        >
                          🔊 {at.languageLabel}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <select
                      value={newCreatorAudioCode}
                      onChange={(e) => setNewCreatorAudioCode(e.target.value)}
                      className="px-2 py-1 rounded bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700"
                    >
                      <option value="es-ES">es-ES (Spanish)</option>
                      <option value="ja-JP">ja-JP (Japanese)</option>
                      <option value="fr-FR">fr-FR (French)</option>
                      <option value="de-DE">de-DE (German)</option>
                      <option value="hi-IN">hi-IN (Hindi)</option>
                      <option value="pt-BR">pt-BR (Portuguese)</option>
                      <option value="ko-KR">ko-KR (Korean)</option>
                      <option value="ar-SA">ar-SA (Arabic)</option>
                    </select>
                    <input
                      type="text"
                      value={newCreatorAudioLang}
                      onChange={(e) => setNewCreatorAudioLang(e.target.value)}
                      placeholder="Custom language track name..."
                      className="flex-1 px-2 py-1 rounded bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAudioLanguageTrackOnWatchPage}
                      className="px-2.5 py-1 rounded bg-sky-500 text-neutral-950 font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Audio</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Title, Creator Channel Bar, and Primary Actions */}
          <div className="space-y-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white leading-snug text-balance">
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Creator Info + Subscribe (Prevents subscribing to yourself!) */}
              <div className="flex items-center gap-3">
                {video.authorAvatar ? (
                  <img
                    src={video.authorAvatar}
                    alt={`${video.authorName} avatar`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#FF0033] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {video.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {video.authorName}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(video.category);
                        navigate('home');
                      }}
                      title={`Filter feed by category: ${video.category}`}
                      className="hover:text-[#FF0033] hover:underline font-semibold cursor-pointer"
                    >
                      {video.category}
                    </button>
                    <span>·</span>
                    <span>Verified Channel</span>
                    {video.locationTag && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                          <span>📍</span>
                          <span>{video.locationTag}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isOwnChannel ? (
                  <span
                    title="You cannot subscribe to your own channel"
                    className="ml-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-neutral-100 dark:bg-[#1E1E24] text-neutral-500 border border-neutral-200 dark:border-neutral-800"
                  >
                    Your Channel (Self-Sub Disabled)
                  </span>
                ) : (
                  <button
                    onClick={async () => {
                      const res = await toggleSubscription(video.authorId, video.authorName);
                      if (res.status === 'self_blocked') {
                        setLikeNotice('You cannot subscribe to your own channel.');
                      }
                    }}
                    onContextMenu={async (e) => {
                      e.preventDefault();
                      const removed = await removeSubscription(video.authorId, video.authorName);
                      if (removed) {
                        setLikeNotice(
                          `Removed subscription to ${video.authorName} (Right-Click Undo).`
                        );
                      }
                    }}
                    title="Left-click to Subscribe · Right-click to remove subscription"
                    className={`ml-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isSubscribed
                        ? 'bg-neutral-200 dark:bg-[#27272A] text-neutral-900 dark:text-white'
                        : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90'
                    }`}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>

              {/* Action Buttons (Right-click on Like, Dislike, Favorite, or Subscribe removes your entry!) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={async () => {
                        setLikeNotice(null);
                        const res = await toggleLikeVideo(video.id);
                        if (res.status === 'max_reached') {
                          setLikeNotice(
                            subscriptionTier === 'plus'
                              ? 'Plus Mode 2/2 Double-Likes used! (Right-click to remove your Like)'
                              : 'Standard 1/1 Like used! Right-click to remove Like, or upgrade to Plus Mode for 2× Likes.'
                          );
                        }
                      }}
                      onContextMenu={async (e) => {
                        e.preventDefault();
                        const removed = await removeLikeVideo(video.id);
                        if (removed) {
                          setLikeNotice('Removed your Like on this video (Right-Click Undo).');
                        }
                      }}
                      title={`Your likes: ${userCurrentLikes}/${maxLikesAllowed} (Right-click to remove your Like)`}
                      className="px-3.5 py-2 rounded-l-lg text-xs font-semibold bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-900 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-mono tabular-nums"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#FF0033]" />
                      <span>{likesCount.toLocaleString()}</span>
                      <span className="text-[10px] text-neutral-500">
                        ({userCurrentLikes}/{maxLikesAllowed})
                      </span>
                    </button>
                    <button
                      onClick={() => toggleDislikeVideo(video.id)}
                      onContextMenu={async (e) => {
                        e.preventDefault();
                        const removed = await removeDislikeVideo(video.id);
                        if (removed) {
                          setLikeNotice('Removed your Dislike on this video (Right-Click Undo).');
                        }
                      }}
                      title="Left-click to Dislike · Right-click to remove your Dislike"
                      className="px-3.5 py-2 rounded-r-lg text-xs font-semibold bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-900 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-mono tabular-nums"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{dislikesCount.toLocaleString()}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 overflow-hidden">
                      <div
                        style={{ width: `${likeRatioPercent}%` }}
                        className="h-full bg-[#FF0033] transition-all"
                      />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-neutral-500">
                      {likeRatioPercent}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleFavoriteVideo(video.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const removed = removeFavoriteVideo(video.id);
                    if (removed) {
                      setLikeNotice('Removed video from Heart Favorites (Right-Click Undo).');
                    }
                  }}
                  title="Left-click to Favorite · Right-click to remove Favorite"
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isFavorited
                      ? 'bg-[#FF0033] text-white'
                      : 'bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-900 dark:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : 'text-[#FF0033]'}`} />
                  <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                </button>

                {/* Download Video with Moving Liquid-Glass Vibrating Corner Watermark */}
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-900 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download video with optional Moving Liquid-Glass Vibrating Corner Watermark"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download</span>
                </button>

                {/* Optional Live Liquid-Glass Watermark Preview Toggle */}
                <button
                  type="button"
                  onClick={() => setLiveLiquidWatermarkEnabled((prev) => !prev)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    liveLiquidWatermarkEnabled
                      ? 'bg-sky-500 text-neutral-950'
                      : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300'
                  }`}
                  title="Preview Moving Liquid-Glass Vibrating Corner Watermark directly on player"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{liveLiquidWatermarkEnabled ? 'Watermark: ON' : 'Watermark Preview'}</span>
                </button>

                {/* Watch Later Primary Action Button (Left-click toggle · Right-click quick undo) */}
                <button
                  type="button"
                  onClick={() => {
                    const added = toggleWatchLater(video.id);
                    setLikeNotice(
                      added
                        ? `Added "${video.title}" to your Watch Later queue.`
                        : `Removed "${video.title}" from your Watch Later queue.`
                    );
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const removed = removeFromWatchLater(video.id);
                    if (removed) {
                      setLikeNotice('Removed video from Watch Later (Right-Click Undo).');
                    }
                  }}
                  title={
                    inWatchLater
                      ? 'In Watch Later (Click or right-click to remove)'
                      : 'Add to Watch Later (Right-click to remove)'
                  }
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    inWatchLater
                      ? 'bg-[#FF0033] text-white'
                      : 'bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-900 dark:text-white'
                  }`}
                >
                  {inWatchLater ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        In Watch Later
                        {watchLaterPositionIndex >= 0 ? ` · #${watchLaterPositionIndex + 1}` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-[#FF0033]" />
                      <span>Watch Later</span>
                    </>
                  )}
                </button>

                {watchLaterEntries.length > 0 && activeQueueMode !== 'watch-later' && (
                  <button
                    type="button"
                    onClick={() => startWatchLaterQueue(false, inWatchLater ? video.id : undefined)}
                    title="Open interactive Watch Later queue panel"
                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#1E1E24] hover:border-[#FF0033]/50 text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer font-mono tabular-nums"
                  >
                    <Play className="w-3 h-3 text-[#FF0033] fill-current" />
                    <span>Queue ({watchLaterEntries.length})</span>
                  </button>
                )}

                {/* Share with Google Contacts Button */}
                <button
                  onClick={() => setActiveIntelTab('contacts-share')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-900 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Share with Contacts</span>
                </button>

                {/* Free 7+ API Key Captcha Button */}
                <button
                  onClick={() => setShowApiKeyCaptchaModal(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-900 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>{backendApiKey ? '7+ API Key Active' : 'Get Free 7+ API Key'}</span>
                </button>
              </div>
            </div>

            {likeNotice && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between gap-2">
                <span>{likeNotice}</span>
                {subscriptionTier !== 'plus' && (
                  <button
                    onClick={() => navigate('ads-credits')}
                    className="font-bold underline cursor-pointer shrink-0"
                  >
                    Upgrade to Plus Mode
                  </button>
                )}
              </div>
            )}

            {/* Description Box */}
            <div className="p-4 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono tabular-nums">
                <span>{video.views.toLocaleString()} unique views (1 per user)</span>
                <span aria-hidden="true">·</span>
                <span>Published {new Date(video.createdAt).toLocaleDateString()}</span>
                <span aria-hidden="true">·</span>
                <span>Minimum Age: {video.minAgeRating || 7}+</span>
                <span aria-hidden="true">·</span>
                <span>Tags: {(video.tags || []).join(' / ')}</span>
              </div>
              {video.aiSafetyNote && (
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{video.aiSafetyNote}</span>
                </p>
              )}
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {video.description}
              </p>

              {/* Auto-Claimed Credit Anti-Abuse Dwell & Real Interaction Status Bar + Global Player Theme Switcher */}
              <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      autoCreditStatus.state === 'awarded'
                        ? 'bg-emerald-500 text-neutral-950'
                        : autoCreditStatus.state === 'self_visit'
                        ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {autoCreditStatus.state === 'awarded'
                      ? 'AUTO-CLAIMED +1 CREDIT'
                      : autoCreditStatus.state === 'self_visit'
                      ? 'NO SELF-CREDITING'
                      : `DWELL ${Math.min(30, dwellSeconds)}/30s`}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                    {autoCreditStatus.message}
                  </span>
                </div>

                {/* Global Site Setting: Video Player Color Theme */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-neutral-500">Player Theme:</span>
                  {(
                    [
                      { id: 'neon_green', label: 'Neon Green', dot: 'bg-[#58f01b]' },
                      { id: 'sunset_red', label: 'Sunset Red', dot: 'bg-[#FF0033]' },
                      { id: 'midnight_blue', label: 'Midnight Blue', dot: 'bg-sky-400' },
                    ] as { id: PlayerColorTheme; label: string; dot: string }[]
                  ).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setPlayerColorTheme(th.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 cursor-pointer border transition-colors ${
                        playerColorTheme === th.id
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold border-transparent'
                          : 'bg-white dark:bg-[#1E1E24] text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${th.dot}`} />
                      <span>{th.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recharts "View Velocity" Line Chart Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#58f01b]" />
                    <span>View Velocity & Engagement Trends (14-Day Telemetry)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Real-time Recharts visualization of daily views, verified unique views, and engagement velocity over time.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1E1E24] text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                  Peak Velocity: {Math.max(...viewVelocityChartData.map((d) => d.dailyViews))} views/day
                </span>
              </div>

              <div className="w-full h-60 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={viewVelocityChartData}
                    margin={{ top: 8, right: 16, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      stroke="rgba(148,163,184,0.3)"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      stroke="rgba(148,163,184,0.3)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141417',
                        borderColor: '#27272A',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#F1F1F1',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="dailyViews"
                      name="Daily Views"
                      stroke={
                        playerColorTheme === 'neon_green'
                          ? '#58f01b'
                          : playerColorTheme === 'midnight_blue'
                          ? '#38bdf8'
                          : '#FF0033'
                      }
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="uniqueVerifiedViews"
                      name="Verified Unique Views"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="engagementScore"
                      name="Engagement Trend"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 2.5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gemini Intelligence, Grounding, Contacts Share & Gmail Workspace Hub */}
          {siteSettings.enableAiAnalysis && (
            <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 bg-neutral-50 dark:bg-[#18181B]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF0033]" />
                  <h2 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Gemini Identification (Latest Model), Pro Analysis & Grounding Suite
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-neutral-200/70 dark:bg-[#0F0F0F]">
                  <button
                    onClick={() => setActiveIntelTab('gemini-identification')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeIntelTab === 'gemini-identification'
                        ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Gemini Identification (AI-Generated)
                  </button>
                  <button
                    onClick={() => setActiveIntelTab('pro-analysis')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeIntelTab === 'pro-analysis'
                        ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Gemini Pro Chapters
                  </button>
                  <button
                    onClick={() => setActiveIntelTab('contacts-share')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeIntelTab === 'contacts-share'
                        ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Google Contacts Share (API Key)
                  </button>
                  <button
                    onClick={() => setActiveIntelTab('search-grounding')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeIntelTab === 'search-grounding'
                        ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Search Grounding
                  </button>
                  <button
                    onClick={() => setActiveIntelTab('maps-grounding')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeIntelTab === 'maps-grounding'
                        ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Maps Grounding
                  </button>
                  <button
                    onClick={() => setActiveIntelTab('gmail-hub')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeIntelTab === 'gmail-hub'
                        ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Gmail Alerts
                  </button>
                </div>
              </div>

              <div className="p-5">
                {activeIntelTab === 'gemini-identification' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                            Gemini Video Summary & Privacy-Safe Person Identification
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30">
                            AI-generated · Latest Gemini Model
                          </span>
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          Summarizes what the video is about and identifies people strictly from{' '}
                          <strong>(a)</strong> creator-provided cast/credit metadata,{' '}
                          <strong>(b)</strong> licensed public professional databases (IMDb, Wikidata, TMDB),{' '}
                          <strong>(c)</strong> public figures from public sources, or{' '}
                          <strong>(d)</strong> ZTube users who have explicitly opted in.{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Never performs face recognition against private individuals.
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunGeminiIdentification}
                        disabled={isIdentifyingPeople || !creatorOptInLocal}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isIdentifyingPeople
                          ? 'Running Latest Gemini Model...'
                          : 'Summarize & Identify People'}
                      </button>
                    </div>

                    {/* Creator Opt-In & Viewer Identity Opt-In Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800">
                      <div className="space-y-2">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            Creator Identity-Detection Opt-In (Required)
                          </span>
                          <input
                            type="checkbox"
                            checked={creatorOptInLocal}
                            onChange={async (e) => {
                              const next = e.target.checked;
                              setCreatorOptInLocal(next);
                              await updateVideo(video.id, {
                                creatorIdentityDetectionOptIn: next,
                              });
                            }}
                            className="w-4 h-4 accent-[#58f01b] cursor-pointer"
                          />
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={creatorCastCreditsInput}
                            onChange={(e) => setCreatorCastCreditsInput(e.target.value)}
                            placeholder="(a) Creator-provided cast/credit metadata..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#141417] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateVideo(video.id, {
                                creatorCastCredits: creatorCastCreditsInput,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold cursor-pointer"
                          >
                            Save Credits
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 pt-2 md:pt-0 md:pl-3">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            (d) Your ZTube Account Identity Opt-In
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(userProfile?.identityOptIn)}
                            onChange={(e) => toggleUserIdentityOptIn(e.target.checked)}
                            className="w-4 h-4 accent-[#58f01b] cursor-pointer"
                          />
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          When unchecked, your ZTube user profile is excluded from AI identification across all videos.
                        </p>
                      </div>
                    </div>

                    {geminiIdError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                        {geminiIdError}
                      </div>
                    )}

                    {geminiIdSummary && (
                      <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900 dark:text-white">
                              Video Summary
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold">
                              AI-generated
                            </span>
                          </div>
                          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {geminiIdSummary}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="font-bold text-neutral-900 dark:text-white block">
                            Identified People ({geminiPeople.length}) — Source, Confidence & Dispute Controls
                          </span>
                          {geminiPeople.length === 0 ? (
                            <p className="text-neutral-500">
                              No active identifications (or all identifications were removed by the person identified).
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {geminiPeople.map((person) => {
                                const sourceBadgeLabel =
                                  person.sourceCategory === 'creator_cast_credit'
                                    ? '(a) Creator Cast/Credit Metadata'
                                    : person.sourceCategory === 'public_database_imdb_wikidata_tmdb'
                                    ? '(b) Licensed Public DB (IMDb/Wikidata/TMDB)'
                                    : person.sourceCategory === 'public_figure_source'
                                    ? '(c) Public Figure (Public Source)'
                                    : '(d) Opted-In ZTube User';

                                return (
                                  <div
                                    key={person.id}
                                    className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F] space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="font-bold text-neutral-900 dark:text-white text-sm">
                                          {person.name}
                                        </p>
                                        <p className="text-[11px] text-neutral-500">
                                          {person.roleOrCharacter}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <span className="px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-mono text-[9px] font-bold">
                                          {person.aiGeneratedLabel}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                                          Confidence: {person.confidencePercent}%
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-[11px] space-y-0.5">
                                      <p className="font-mono text-sky-600 dark:text-sky-400 font-semibold">
                                        Source: {sourceBadgeLabel}
                                      </p>
                                      <p className="text-neutral-600 dark:text-neutral-400">
                                        Citation: {person.sourceCitation}
                                      </p>
                                    </div>

                                    {person.disputed && (
                                      <div className="p-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px]">
                                        Disputed: {person.disputeReason}
                                      </div>
                                    )}

                                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={disputeReasonInput[person.id] || ''}
                                        onChange={(e) =>
                                          setDisputeReasonInput((prev) => ({
                                            ...prev,
                                            [person.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Reason to dispute or remove..."
                                        className="flex-1 min-w-[130px] px-2 py-1 rounded bg-white dark:bg-[#141417] border border-neutral-300 dark:border-neutral-700 text-[11px]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDisputeOrRemoveIdentification(person.id, 'dispute')
                                        }
                                        className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer"
                                      >
                                        Dispute
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDisputeOrRemoveIdentification(person.id, 'remove')
                                        }
                                        className="px-2.5 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-semibold cursor-pointer"
                                      >
                                        Remove Me
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeIntelTab === 'pro-analysis' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                          Deep Video Understanding (gemini-3.1-pro-preview)
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Extracts timestamped chapters, technical architecture insights, retention hooks, and accessible transcript excerpts.
                        </p>
                      </div>
                      <button
                        onClick={handleRunProVideoAnalysis}
                        disabled={isAnalyzingPro}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzingPro ? 'Analyzing with Gemini Pro...' : 'Analyze Video Content'}
                      </button>
                    </div>

                    {proAnalysis && (
                      <div className="space-y-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                        <div>
                          <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
                            Executive Summary
                          </span>
                          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {proAnalysis.executiveSummary}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-neutral-900 dark:text-white block mb-2">
                            Timestamped Chapters
                          </span>
                          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                            {proAnalysis.chapters.map((ch, idx) => (
                              <div key={idx} className="p-2.5 flex items-start gap-3">
                                <span className="font-mono tabular-nums text-[#FF0033] font-semibold shrink-0">
                                  {ch.timestamp}
                                </span>
                                <div>
                                  <p className="font-semibold text-neutral-900 dark:text-white">
                                    {ch.heading}
                                  </p>
                                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {ch.keyTakeaway}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeIntelTab === 'contacts-share' && (
                  <GoogleContactsSharePanel
                    video={video}
                    onOpenApiKeyModal={() => setShowApiKeyCaptchaModal(true)}
                  />
                )}

                {activeIntelTab === 'search-grounding' && (
                  <div className="space-y-4">
                    <form onSubmit={handleRunSearchGrounding} className="flex flex-wrap items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                      <input
                        type="text"
                        value={searchQueryInput}
                        onChange={(e) => setSearchQueryInput(e.target.value)}
                        placeholder="Fact-check topic or query live web sources with Google Search..."
                        className="flex-1 min-w-[180px] px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingWeb}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {isSearchingWeb ? 'Searching Google...' : 'Verify with Google Search'}
                      </button>
                    </form>

                    {searchGroundingResult && (
                      <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                        <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                          {searchGroundingResult.text}
                        </div>
                        {searchGroundingResult.sources.length > 0 && (
                          <div className="pt-2">
                            <p className="font-semibold text-neutral-900 dark:text-white mb-1.5">
                              Verified Web Citations (Google Search Grounding):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {searchGroundingResult.sources.map((src, i) => (
                                <a
                                  key={i}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline"
                                >
                                  <span>{src.title}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeIntelTab === 'maps-grounding' && (
                  <div className="space-y-4">
                    <form onSubmit={handleRunMapsGrounding} className="flex flex-wrap items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        value={mapsQueryInput}
                        onChange={(e) => setMapsQueryInput(e.target.value)}
                        placeholder="Explore filming location, studio venues, or landmarks nearby..."
                        className="flex-1 min-w-[180px] px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingMaps}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {isSearchingMaps ? 'Locating on Maps...' : 'Explore on Google Maps'}
                      </button>
                    </form>

                    {mapsGroundingResult && (
                      <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                        <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                          {mapsGroundingResult.text}
                        </div>
                        {mapsGroundingResult.places.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <p className="font-semibold text-neutral-900 dark:text-white">
                              Google Maps Grounded Places & Links:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {mapsGroundingResult.places.map((pl, idx) => (
                                <a
                                  key={idx}
                                  href={pl.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 flex items-center justify-between gap-2"
                                >
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate">
                                    {pl.title}
                                  </span>
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeIntelTab === 'gmail-hub' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-[#FF0033]" />
                          <span>Send Video Digest via Gmail</span>
                        </h3>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="Recipient email address"
                          className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                        />
                        <textarea
                          rows={2}
                          value={emailNote}
                          onChange={(e) => setEmailNote(e.target.value)}
                          placeholder="Add an optional personal note..."
                          className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!recipientEmail.trim()) {
                              setGmailStatus({ type: 'error', msg: 'Please enter a recipient email address.' });
                              return;
                            }
                            setShowSendConfirmModal(true);
                          }}
                          disabled={isSendingGmail}
                          className="px-4 py-2 rounded-lg font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSendingGmail ? 'Sending via Gmail...' : 'Send Email Digest'}</span>
                        </button>
                      </div>

                      <div className="space-y-3 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 pt-4 md:pt-0 md:pl-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Your Gmail Inbox Alerts
                          </h3>
                          <button
                            type="button"
                            onClick={handleLoadGmailAlerts}
                            disabled={isLoadingInbox}
                            className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingInbox ? 'animate-spin' : ''}`} />
                            <span>{isLoadingInbox ? 'Loading...' : 'Load Recent Emails'}</span>
                          </button>
                        </div>

                        {gmailInboxMessages.length === 0 ? (
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Click "Load Recent Emails" to view your latest messages via Gmail API (`gmail.readonly`).
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-44 overflow-y-auto">
                            {gmailInboxMessages.map((m) => (
                              <div
                                key={m.id}
                                className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800"
                              >
                                <p className="font-semibold text-neutral-900 dark:text-white truncate">
                                  {m.subject}
                                </p>
                                <p className="text-[11px] text-neutral-500 truncate">{m.from}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {gmailStatus && (
                      <div
                        className={`p-3 rounded-lg border flex items-center gap-2 ${
                          gmailStatus.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{gmailStatus.msg}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Mandatory User Confirmation Dialog for Gmail Send */}
          {showSendConfirmModal && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            >
              <div className="w-full max-w-md rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] p-6 space-y-4 shadow-2xl">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Confirm Sending Email via Gmail
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  You are about to send an email on behalf of your Google account to{' '}
                  <span className="font-semibold text-neutral-900 dark:text-white">{recipientEmail}</span>{' '}
                  with the subject:
                </p>
                <div className="p-3 rounded-lg bg-neutral-100 dark:bg-[#18181B] text-xs font-mono text-neutral-800 dark:text-neutral-200">
                  ZTube Video Digest: {video.title}
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSendConfirmModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeConfirmedGmailSend}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer"
                  >
                    Confirm & Send Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          {siteSettings.enableComments ? (
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {videoComments.length} Comments
                </h2>
              </div>

              <div className="flex items-start gap-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={`${user.displayName || 'User'} avatar`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  {/* Markdown Formatting Toolbar for Comments */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-mono text-neutral-500 mr-1">Markdown:</span>
                      <button
                        type="button"
                        onClick={() => setCommentText((prev) => `${prev} **bold**`)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-[#27272A] font-bold cursor-pointer"
                      >
                        **B**
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentText((prev) => `${prev} *italic*`)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-[#27272A] italic cursor-pointer"
                      >
                        *I*
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentText((prev) => `${prev} \`code\``)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-[#27272A] font-mono text-[#FF0033] cursor-pointer"
                      >
                        `code`
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentText((prev) => `${prev}\n> Quote`)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-[#27272A] cursor-pointer"
                      >
                        &gt; Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentText((prev) => `${prev}\n- List item`)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-[#27272A] cursor-pointer"
                      >
                        • List
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewMarkdown((prev) => !prev)}
                      className="text-[#FF0033] font-semibold hover:underline cursor-pointer"
                    >
                      {previewMarkdown ? 'Edit Raw Markdown' : 'Preview Markdown'}
                    </button>
                  </div>

                  {previewMarkdown ? (
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 min-h-[56px]">
                      <MarkdownCommentRenderer content={commentText || '*Nothing to preview yet...*'} />
                    </div>
                  ) : (
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={
                        user
                          ? 'Add a comment (Markdown supported: **bold**, *italic*, `code`, > quote, - list)...'
                          : 'Sign in with Google or type a Markdown comment to join the discussion...'
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#141417] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF0033]"
                    />
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handlePolishComment}
                      disabled={isPolishingComment}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-[#1E1E24] hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FF0033]" />
                      <span>
                        {isPolishingComment
                          ? 'Generating with Flash Lite...'
                          : commentText
                          ? 'Polish Comment (Flash Lite)'
                          : 'Suggest Smart Comment'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!commentText.trim()) return;
                        await addComment(video.id, commentText);
                        setCommentText('');
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {videoComments.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4">
                    No comments yet on this video. Be the first to start the technical discussion!
                  </p>
                ) : (
                  videoComments.map((cmt) => (
                    <div
                      key={cmt.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                        cmt.isPriorityMember
                          ? 'bg-[#FF0033]/5 dark:bg-[#FF0033]/10 border-[#FF0033]/50 shadow-sm'
                          : 'bg-neutral-50 dark:bg-[#141417] border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {cmt.authorAvatar ? (
                          <img
                            src={cmt.authorAvatar}
                            alt={`${cmt.authorName} avatar`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              cmt.isPriorityMember
                                ? 'bg-[#FF0033] text-white'
                                : 'bg-neutral-200 dark:bg-neutral-800'
                            }`}
                          >
                            {cmt.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {cmt.authorName}
                            </span>
                            {cmt.isPriorityMember && (
                              <span className="px-2 py-0.5 rounded bg-[#FF0033] text-white font-mono text-[10px] font-bold flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                <span>PRIORITY PLUS MEMBER</span>
                              </span>
                            )}
                            <span aria-hidden="true" className="text-neutral-400">
                              ·
                            </span>
                            <span className="text-neutral-500 font-mono tabular-nums">
                              {new Date(cmt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <MarkdownCommentRenderer content={cmt.text} />
                        </div>
                      </div>

                      {user && user.uid === cmt.authorId && (
                        <button
                          onClick={() => deleteComment(cmt.id)}
                          title="Delete Comment"
                          className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <div className="p-4 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
              Comments have been disabled site-wide by the administrator.
            </div>
          )}
        </div>

        {/* Right / Watch Later Active Queue Panel + Personalized Taste Algorithm Up Next Sidebar Column */}
        <div className={theaterMode ? 'col-span-1 pt-6' : 'lg:col-span-4 space-y-5'}>
          {/* Interactive Watch Later Queue Panel when queue mode is active or video is in Watch Later */}
          {(activeQueueMode === 'watch-later' || inWatchLater) && watchLaterEntries.length > 0 && (() => {
            const queueIds =
              activeQueueMode === 'watch-later' && activeQueueVideoIds.length > 0
                ? activeQueueVideoIds
                : watchLaterVideoIds;
            const queueVideos = queueIds
              .map((id) => videos.find((v) => v.id === id))
              .filter((v): v is NonNullable<typeof v> => Boolean(v));
            const currentQueueIdx = queueVideos.findIndex((v) => v.id === video.id);
            const nextUpVideo =
              currentQueueIdx !== -1 && currentQueueIdx + 1 < queueVideos.length
                ? queueVideos[currentQueueIdx + 1]
                : queueLoop && queueVideos.length > 1
                ? queueVideos[0]
                : null;

            return (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] overflow-hidden shadow-lg">
                {/* Queue Panel Header */}
                <div className="p-3.5 bg-neutral-100/80 dark:bg-[#18181B] border-b border-neutral-200 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-[#FF0033] shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          Watch Later Queue
                        </h3>
                        <p className="text-[11px] font-mono tabular-nums text-neutral-500">
                          {currentQueueIdx !== -1
                            ? `Playing ${currentQueueIdx + 1} / ${queueVideos.length}`
                            : `${queueVideos.length} videos saved`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          startWatchLaterQueue(!queueShuffle, video.id, watchLaterVideoIds)
                        }
                        title={queueShuffle ? 'Shuffle is ON' : 'Shuffle Watch Later Queue'}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          queueShuffle
                            ? 'bg-[#FF0033] text-white border-[#FF0033]'
                            : 'bg-white dark:bg-[#141417] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setQueueLoop(!queueLoop)}
                        title={queueLoop ? 'Loop Queue is ON' : 'Loop Watch Later Queue'}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          queueLoop
                            ? 'bg-[#58f01b]/20 text-[#58f01b] border-[#58f01b]/50'
                            : 'bg-white dark:bg-[#141417] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <Repeat className="w-3.5 h-3.5" />
                      </button>

                      {nextUpVideo && (
                        <button
                          type="button"
                          onClick={() => navigate('watch', nextUpVideo.id)}
                          title={`Next in queue: ${nextUpVideo.title}`}
                          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141417] text-neutral-700 dark:text-neutral-200 hover:border-[#FF0033] cursor-pointer"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate('watch-later')}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer"
                      >
                        Manage
                      </button>

                      {activeQueueMode === 'watch-later' && (
                        <button
                          type="button"
                          onClick={() => setActiveQueueMode('off')}
                          title="Close active queue mode"
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Auto-Remove on Finish Toggle & Next Up Preview */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200/70 dark:border-neutral-800 text-[11px]">
                    <label className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoRemoveWatchLaterOnFinish}
                        onChange={(e) => setAutoRemoveWatchLaterOnFinish(e.target.checked)}
                        className="rounded accent-[#FF0033] w-3 h-3 cursor-pointer"
                      />
                      <span>Auto-remove when finished</span>
                    </label>
                    {nextUpVideo && (
                      <span className="font-mono text-[10px] text-neutral-500 truncate max-w-[165px]">
                        Next: {nextUpVideo.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* Scrollable Queue Items */}
                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
                  {queueVideos.map((qv, idx) => {
                    const isCurrent = qv.id === video.id;
                    return (
                      <div
                        key={qv.id}
                        onClick={() => {
                          if (activeQueueMode !== 'watch-later') {
                            startWatchLaterQueue(queueShuffle, qv.id, queueIds);
                          } else {
                            navigate('watch', qv.id);
                          }
                        }}
                        className={`p-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-[#FF0033]/10 dark:bg-[#FF0033]/15'
                            : 'hover:bg-neutral-50 dark:hover:bg-[#18181B]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-5 text-center font-mono tabular-nums text-[11px] font-bold text-neutral-400 shrink-0">
                            {isCurrent ? (
                              <Play className="w-3 h-3 text-[#FF0033] fill-current mx-auto" />
                            ) : (
                              String(idx + 1).padStart(2, '0')
                            )}
                          </span>
                          <div className="relative w-20 aspect-video rounded overflow-hidden bg-neutral-900 shrink-0">
                            <img
                              src={qv.thumbnailUrl}
                              alt={qv.title}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/85 text-white font-mono tabular-nums text-[9px]">
                              {qv.duration}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold line-clamp-1 ${
                                isCurrent
                                  ? 'text-[#FF0033]'
                                  : 'text-neutral-900 dark:text-white'
                              }`}
                            >
                              {qv.title}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate">
                              {qv.authorName}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchLater(qv.id);
                          }}
                          title="Remove from Watch Later"
                          className="p-1 rounded text-neutral-400 hover:text-[#FF0033] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#58f01b]" />
              <span>Algorithm Match: Recommended For You</span>
            </h2>
          </div>

          <div className="space-y-3">
            {relatedVideos.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigate('watch', rel.id)}
                className="group flex items-start gap-3 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#18181B] transition-colors cursor-pointer content-auto"
              >
                <div className="relative w-36 sm:w-40 aspect-video rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                  <img
                    src={rel.thumbnailUrl}
                    alt={rel.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/85 text-[#58f01b] font-mono text-[9px] font-bold">
                    {rel.affinityScore}% Match
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchLater(rel.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromWatchLater(rel.id);
                    }}
                    title={
                      isVideoInWatchLater(rel.id)
                        ? 'In Watch Later (Click or right-click to remove)'
                        : 'Add to Watch Later'
                    }
                    className={`absolute top-1.5 right-1.5 z-20 p-1 rounded bg-black/80 text-white border border-white/15 transition-opacity cursor-pointer ${
                      isVideoInWatchLater(rel.id)
                        ? 'bg-[#FF0033] border-[#FF0033] opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isVideoInWatchLater(rel.id) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </button>
                  <span className="absolute bottom-2.5 right-1.5 px-1 py-0.5 rounded bg-black/85 text-white font-mono tabular-nums text-[10px] pointer-events-none z-10">
                    {rel.duration}
                  </span>
                  <CardTimelineHoverScrubber
                    video={rel}
                    compact
                    onNavigateWatch={() => navigate('watch', rel.id)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-[#FF0033] transition-colors">
                    {rel.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {rel.authorName}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                    {rel.affinityReasons[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VR / AR Spatial Room & Volumetric Video Modal */}
      <VrArVolumetricPlayerModal
        video={video}
        isOpen={showVrArModal}
        onClose={() => setShowVrArModal(false)}
      />

      {/* Free 7+ Backend API Key & Blue Car Captcha Modal */}
      <BlueCarApiKeyCaptchaModal
        isOpen={showApiKeyCaptchaModal}
        onClose={() => setShowApiKeyCaptchaModal(false)}
      />

      {/* Video Download Studio Modal with Optional Moving Liquid-Glass Vibrating Corner Watermark */}
      <LiquidWatermarkVideoDownloadModal
        video={video}
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};
