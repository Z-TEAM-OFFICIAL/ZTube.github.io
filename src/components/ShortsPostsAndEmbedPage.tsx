import React, { useState, useRef } from 'react';
import {
  Smartphone,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Share2,
  Plus,
  Image as ImageIcon,
  Trash2,
  Code2,
  Copy,
  Check,
  Play,
  ExternalLink,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  KeyRound,
  Car,
  Music,
  Volume2,
  VolumeX,
  Disc3,
  Subtitles,
  Send,
  X,
  Clock,
} from 'lucide-react';
import { useApp, parseDurationToSeconds } from '../context/AppContext';
import { VideoItem, BUILTIN_SHORT_SOUNDS } from '../types';
import { CentralParkNotFoundFallback } from './SubscriberCreditsAndAuthPages';
import { BlueCarApiKeyCaptchaModal } from './ApiKeyCaptchaAndVrComponents';
import { CustomZTubeVideoPlayer } from './CustomZTubeVideoPlayer';
import {
  VideoDownloadApiConsole,
  MarkdownCommentRenderer,
} from './DocsTutorialCursorAndDownload';

/**
 * Reusable ZTube / YouTube Conditional Embedded Player Component
 * - If video is originally from YouTube (has youtubeId or youtube.com URL):
 *   Shows "Watch on YouTube" badge and Server-Downloaded + AV1 WebM Converted status!
 * - Only external/direct videos use the Custom ZTube API overlay ("Watch on [ZTube logo]", Top-Left Channel + Name underneath, Top-Right Share, Bottom-Middle Title).
 */
export const CustomEmbedPlayerFrame: React.FC<{
  video?: VideoItem | null;
  customTitle?: string;
  customChannelName?: string;
  customCreatorSubtext?: string;
  isStandaloneEmbed?: boolean;
}> = ({
  video,
  customTitle,
  customChannelName,
  customCreatorSubtext,
  isStandaloneEmbed = false,
}) => {
  const { navigate } = useApp();
  const [copiedShare, setCopiedShare] = useState(false);

  const displayTitle = video?.title || customTitle || 'Select or Upload a Video to Preview Embed';
  const displayChannel = video?.authorName || customChannelName || 'ZTube Official Channel';
  const displaySubName =
    customCreatorSubtext ||
    (video ? `@${video.authorName.replace(/\s+/g, '').toLowerCase()} · Verified Creator` : '@ztube_creator');

  const isYoutubeOrigin = Boolean(
    video &&
      (video.youtubeId ||
        video.videoUrl.includes('youtube.com/embed') ||
        video.videoUrl.includes('youtu.be'))
  );

  const handleShareEmbedLink = () => {
    const shareUrl = video
      ? `${window.location.origin}/?embed=${encodeURIComponent(video.id)}`
      : window.location.origin;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-black border border-neutral-800 shadow-2xl select-none ${
        isStandaloneEmbed ? 'h-screen w-screen rounded-none border-0' : 'rounded-xl'
      }`}
    >
      {/* Underlying Custom ZTube Video Player (No built-in browser controls) */}
      {video ? (
        <CustomZTubeVideoPlayer video={video} variant="embed" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0F0F0F] via-[#18181B] to-[#090D16] text-neutral-400 p-6">
          <Play className="w-12 h-12 text-[#FF0033] mb-2 opacity-90" />
          <p className="text-xs font-mono text-neutral-300">
            ZTube External Website Embed API Preview (AV1 WebM + WebP Poster)
          </p>
        </div>
      )}

      {/* CONDITIONAL OVERLAY:
          If originally from YouTube -> Show Custom "Watch on YouTube" + Server-Converted AV1 badge!
          Only external/non-YouTube videos show the full Custom ZTube API Overlay */}
      {isYoutubeOrigin && video ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 px-4 flex items-center justify-between gap-3">
          <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-500/40 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Server Downloaded & Converted AV1 WebM · 7+ Verified</span>
          </div>

          <a
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(
              video.youtubeId || ''
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto px-3.5 py-2 rounded-lg bg-[#0F0F0F]/90 hover:bg-black text-white border border-white/25 backdrop-blur-md flex items-center gap-2 text-xs font-semibold shadow-xl cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <span className="text-neutral-200">Watch on</span>
            <span className="inline-flex items-center gap-1 font-display font-extrabold tracking-tight text-white">
              <span className="inline-flex items-center justify-center w-5 h-3.5 rounded-xs bg-[#FF0000] text-white">
                <Play className="w-2.5 h-2.5 fill-current" />
              </span>
              <span>YouTube</span>
            </span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </a>
        </div>
      ) : (
        <>
          {/* EXTERNAL VIDEO CUSTOM API OVERLAY: Top-Left Channel + Name underneath, Top-Right Share */}
          <div className="pointer-events-none absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-start justify-between gap-4">
            <div className="pointer-events-auto flex items-start gap-3">
              {video?.authorAvatar ? (
                <img
                  src={video.authorAvatar}
                  alt={`${displayChannel} avatar`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover shadow-md border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FF0033] text-white flex items-center justify-center font-bold text-sm shadow-md border border-white/20 shrink-0">
                  {displayChannel.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight drop-shadow">
                  {displayChannel}
                </span>
                <span className="text-xs text-neutral-300 font-medium mt-0.5 drop-shadow">
                  {displaySubName}
                </span>
              </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareEmbedLink}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/65 hover:bg-black/85 border border-white/20 backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BOTTOM OVERLAY: Title on Bottom-Middle, "Watch on [ZTube logo]" on Bottom-Right */}
          <div className="pointer-events-none absolute bottom-10 inset-x-0 px-4 flex items-center justify-between gap-4">
            <div className="hidden sm:block w-40 shrink-0" />

            <div className="pointer-events-auto flex-1 text-center">
              <div className="inline-block px-4 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 max-w-xl">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {displayTitle}
                </h3>
              </div>
            </div>

            <div className="pointer-events-auto shrink-0">
              {isStandaloneEmbed ? (
                <a
                  href={
                    video
                      ? `${window.location.origin}/?watch=${encodeURIComponent(video.id)}`
                      : window.location.origin
                  }
                  target="_top"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-black/85 hover:bg-black text-white border border-white/20 backdrop-blur-md flex items-center gap-2 text-xs font-semibold shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <span className="text-neutral-200">Watch on</span>
                  <span className="inline-flex items-center gap-1 font-display font-extrabold tracking-tight text-white">
                    <span className="inline-flex items-center justify-center w-5 h-3.5 rounded-xs bg-[#FF0033] text-white">
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </span>
                    <span>ZTube</span>
                  </span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (video) {
                      navigate('watch', video.id);
                    } else {
                      navigate('home');
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-black/85 hover:bg-black text-white border border-white/20 backdrop-blur-md flex items-center gap-2 text-xs font-semibold shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <span className="text-neutral-200">Watch on</span>
                  <span className="inline-flex items-center gap-1 font-display font-extrabold tracking-tight text-white">
                    <span className="inline-flex items-center justify-center w-5 h-3.5 rounded-xs bg-[#FF0033] text-white">
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </span>
                    <span>ZTube</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 1. VERTICAL REELS / TIKTOK / YT SHORTS SNAP FEED (/shorts)
 * - Strictly enforces ≤ 4 minutes (240 seconds) limit for Shorts
 * - Vertical snap-scrolling reel experience (`snap-y snap-mandatory`) like TikTok / Instagram Reels / YT Shorts
 */
export const ShortsFeedPage: React.FC = () => {
  const {
    videos,
    favoriteVideoIds,
    toggleFavoriteVideo,
    removeFavoriteVideo,
    isVideoInWatchLater,
    toggleWatchLater,
    removeFromWatchLater,
    toggleLikeVideo,
    removeLikeVideo,
    toggleDislikeVideo,
    removeDislikeVideo,
    subscriptions,
    toggleSubscription,
    removeSubscription,
    user,
    setIsUploadModalOpen,
    setPreselectedShortSoundId,
    navigate,
    comments,
    addComment,
    deleteComment,
  } = useApp();

  const [reelIndex, setReelIndex] = useState(0);
  const [subNotice, setSubNotice] = useState<string | null>(null);
  const [filterBySoundId, setFilterBySoundId] = useState<string | null>(null);
  const [playingSynthSoundId, setPlayingSynthSoundId] = useState<string | null>(null);
  const [shortsCaptionsEnabled, setShortsCaptionsEnabled] = useState<boolean>(true);
  const [openCommentSheetVideoId, setOpenCommentSheetVideoId] = useState<string | null>(null);
  const [shortCommentDraft, setShortCommentDraft] = useState<string>('');
  const reelContainerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  const stopShortSoundPreview = () => {
    if (synthTimerRef.current) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setPlayingSynthSoundId(null);
  };

  const togglePlayShortSoundTrack = (soundId: string) => {
    if (playingSynthSoundId === soundId) {
      stopShortSoundPreview();
      return;
    }
    stopShortSoundPreview();
    const preset =
      BUILTIN_SHORT_SOUNDS.find((s) => s.id === soundId) || BUILTIN_SHORT_SOUNDS[0];
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      setPlayingSynthSoundId(soundId);

      let step = 0;
      const playNote = () => {
        if (!audioCtxRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const ratios = [1, 1.25, 1.5, 1.125];
        osc.type = 'triangle';
        osc.frequency.value = preset.freqHz * ratios[step % ratios.length];
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.34);
        step += 1;
      };
      playNote();
      synthTimerRef.current = window.setInterval(playNote, 420);
    } catch {
      setPlayingSynthSoundId(null);
    }
  };

  // Users MUST upload a video as a Short (v.isShort === true) for it to be a Short
  const validShorts = videos.filter((v) => {
    if (!v.isShort) return false;
    if (parseDurationToSeconds(v.duration) > 240) return false;
    if (filterBySoundId) {
      const sId = v.shortSoundId || BUILTIN_SHORT_SOUNDS[0].id;
      return sId === filterBySoundId;
    }
    return true;
  });
  const activeFeed = validShorts;

  const scrollToReel = (idx: number) => {
    const clamped = Math.max(0, Math.min(activeFeed.length - 1, idx));
    setReelIndex(clamped);
    const el = reelContainerRef.current?.children[clamped] as HTMLElement | undefined;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const activeCommentSheetVideo = openCommentSheetVideoId
    ? activeFeed.find((s) => s.id === openCommentSheetVideoId) || null
    : null;
  const activeSheetComments = openCommentSheetVideoId
    ? comments.filter((c) => c.videoId === openCommentSheetVideoId)
    : [];

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF0033] text-white flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                ZTube Shorts & Vertical Reels
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#FF0033]/15 text-[#FF0033] font-mono text-[10px] font-bold">
                MAX 4:00 LIMIT · TIKTOK / REELS SNAP
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Swipe or use Up/Down controls to flip through vertical AV1 WebM reels (strictly ≤ 4 minutes)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToReel(reelIndex - 1)}
            disabled={reelIndex <= 0}
            className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 disabled:opacity-40 cursor-pointer"
            title="Previous Reel"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToReel(reelIndex + 1)}
            disabled={reelIndex >= activeFeed.length - 1}
            className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 disabled:opacity-40 cursor-pointer"
            title="Next Reel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Short (≤ 4m)</span>
          </button>
        </div>
      </div>

      {subNotice && (
        <div className="max-w-md mx-auto p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-500 text-xs text-center font-medium">
          {subNotice}
        </div>
      )}

      {/* Shorts Sounds & Audio Filter Bar (like YouTube Shorts Sound Hub) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold text-[#FF0033] flex items-center gap-1 mr-1">
            <Music className="w-3.5 h-3.5" />
            <span>SHORTS SOUNDS & AUDIO:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterBySoundId(null)}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
              filterBySoundId === null
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Sounds
          </button>
          {BUILTIN_SHORT_SOUNDS.map((snd) => {
            const active = filterBySoundId === snd.id;
            const isPlaying = playingSynthSoundId === snd.id;
            return (
              <div
                key={snd.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${
                  active
                    ? 'border-[#FF0033] bg-[#FF0033]/10 text-neutral-900 dark:text-white font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181B]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setFilterBySoundId(active ? null : snd.id)}
                  className="cursor-pointer truncate max-w-[140px]"
                  title={`${snd.title} · ${snd.artist}`}
                >
                  🎵 {snd.title}
                </button>
                <button
                  type="button"
                  onClick={() => togglePlayShortSoundTrack(snd.id)}
                  title={isPlaying ? 'Stop Sound Preview' : 'Preview Shorts Sound Track'}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#FF0033] cursor-pointer"
                >
                  {isPlaying ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {activeFeed.length === 0 ? (
        <CentralParkNotFoundFallback resourceType="short" />
      ) : (
        <div
          ref={reelContainerRef}
          className="h-[calc(100vh-11rem)] overflow-y-auto snap-y snap-mandatory space-y-8 py-2 flex flex-col items-center"
        >
          {activeFeed.map((short, idx) => {
            const likes = short.likes || 0;
            const dislikes = short.dislikes || 0;
            const totalVotes = likes + dislikes;
            const likeRatioPercent =
              totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : 100;
            const isFavorited = favoriteVideoIds.includes(short.id);
            const isYt =
              short.videoUrl.includes('youtube.com/embed') ||
              Boolean(short.youtubeId && short.videoUrl.includes('youtube'));
            const isOwnChannel = Boolean(
              user &&
                (short.authorId === user.uid ||
                  (user.displayName &&
                    short.authorName.toLowerCase() === user.displayName.toLowerCase()))
            );
            const isSubscribed = subscriptions.some(
              (s) => s.channelName.toLowerCase() === short.authorName.toLowerCase()
            );

            return (
              <div
                key={short.id}
                onMouseEnter={() => setReelIndex(idx)}
                className="snap-center shrink-0 flex items-end justify-center gap-3 px-2 py-1"
              >
                {/* Dedicated 9:16 Vertical Shorts Video Engine (Strictly 342x608 9:16 — Never Oversized) */}
                <CustomZTubeVideoPlayer
                  video={short}
                  variant="short"
                  engineOverride="shorts"
                  autoPlay={idx === reelIndex}
                  loop={true}
                  captionsEnabled={shortsCaptionsEnabled}
                  onToggleCaptions={() => setShortsCaptionsEnabled((prev) => !prev)}
                  reelIndex={idx}
                  isSubscribed={isSubscribed}
                  isOwnChannel={isOwnChannel}
                  onToggleSubscribe={async () => {
                    const res = await toggleSubscription(short.authorId, short.authorName);
                    if (res.status === 'self_blocked') {
                      setSubNotice('You cannot subscribe to your own channel.');
                      setTimeout(() => setSubNotice(null), 3000);
                    }
                  }}
                  onRemoveSubscribe={async () => {
                    const removed = await removeSubscription(short.authorId, short.authorName);
                    if (removed) {
                      setSubNotice(
                        `Removed subscription to ${short.authorName} (Right-Click Undo).`
                      );
                      setTimeout(() => setSubNotice(null), 3000);
                    }
                  }}
                  onPreviewShortSound={(sndId) => togglePlayShortSoundTrack(sndId)}
                  onUseShortSound={(sndId) => {
                    setPreselectedShortSoundId(sndId);
                    setIsUploadModalOpen(true);
                  }}
                  isPlayingShortSound={
                    playingSynthSoundId === (short.shortSoundId || BUILTIN_SHORT_SOUNDS[0].id)
                  }
                  onLike={() => toggleLikeVideo(short.id)}
                  onRemoveLike={() => removeLikeVideo(short.id)}
                  onDislike={() => toggleDislikeVideo(short.id)}
                  onRemoveDislike={() => removeDislikeVideo(short.id)}
                  onFavorite={() => toggleFavoriteVideo(short.id)}
                  onRemoveFavorite={() => removeFavoriteVideo(short.id)}
                  isFavorited={isFavorited}
                  likesCount={likes}
                  dislikesCount={dislikes}
                />

                {/* Right Vertical Action Rail (TikTok / Reels style — Supports Right-Click Removal, Captions, Share, Comment Sheet!) */}
                <div className="flex flex-col items-center gap-3 pb-4 shrink-0">
                  <button
                    onClick={() => toggleFavoriteVideo(short.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const removed = removeFavoriteVideo(short.id);
                      if (removed) {
                        setSubNotice('Removed Short from Heart Favorites (Right-Click Undo).');
                        setTimeout(() => setSubNotice(null), 2600);
                      }
                    }}
                    title="Left-click to Favorite · Right-click to remove Favorite"
                    className={`p-3 rounded-full border transition-colors cursor-pointer ${
                      isFavorited
                        ? 'bg-[#FF0033] text-white border-[#FF0033]'
                        : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                  <span className="text-[10px] font-medium text-neutral-500 -mt-2">
                    {isFavorited ? 'Saved' : 'Heart'}
                  </span>

                  {/* Watch Later Button on Shorts Rail */}
                  <button
                    type="button"
                    onClick={() => {
                      const added = toggleWatchLater(short.id);
                      setSubNotice(
                        added
                          ? `Added Short "${short.title}" to Watch Later.`
                          : `Removed Short "${short.title}" from Watch Later.`
                      );
                      setTimeout(() => setSubNotice(null), 2600);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const removed = removeFromWatchLater(short.id);
                      if (removed) {
                        setSubNotice('Removed Short from Watch Later (Right-Click Undo).');
                        setTimeout(() => setSubNotice(null), 2600);
                      }
                    }}
                    title="Left-click to toggle Watch Later · Right-click to remove"
                    className={`p-3 rounded-full border transition-colors cursor-pointer ${
                      isVideoInWatchLater(short.id)
                        ? 'bg-[#FF0033] text-white border-[#FF0033]'
                        : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-medium text-neutral-500 -mt-2">
                    {isVideoInWatchLater(short.id) ? 'Queued' : 'Later'}
                  </span>

                  <button
                    onClick={() => toggleLikeVideo(short.id)}
                    onContextMenu={async (e) => {
                      e.preventDefault();
                      const removed = await removeLikeVideo(short.id);
                      if (removed) {
                        setSubNotice('Removed your Like on this Short (Right-Click Undo).');
                        setTimeout(() => setSubNotice(null), 2600);
                      }
                    }}
                    title="Left-click to Like (or Double-Tap video) · Right-click to remove Like"
                    className="p-3 rounded-full bg-neutral-100 dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4 text-[#FF0033]" />
                  </button>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-600 dark:text-neutral-300 -mt-2">
                    {likes}
                  </span>

                  <button
                    onClick={() => toggleDislikeVideo(short.id)}
                    onContextMenu={async (e) => {
                      e.preventDefault();
                      const removed = await removeDislikeVideo(short.id);
                      if (removed) {
                        setSubNotice('Removed your Dislike on this Short (Right-Click Undo).');
                        setTimeout(() => setSubNotice(null), 2600);
                      }
                    }}
                    title="Left-click to Dislike · Right-click to remove Dislike"
                    className="p-3 rounded-full bg-neutral-100 dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-600 dark:text-neutral-300 -mt-2">
                    {dislikes}
                  </span>

                  {/* Captions Toggle Button on Reel Rail */}
                  <button
                    type="button"
                    onClick={() => setShortsCaptionsEnabled((prev) => !prev)}
                    title="Toggle Short Captions (CC)"
                    className={`p-2.5 rounded-full border cursor-pointer ${
                      shortsCaptionsEnabled
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-neutral-500 -mt-2">
                    {shortsCaptionsEnabled ? 'CC On' : 'CC Off'}
                  </span>

                  {/* Share Reel Button */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/?watch=${encodeURIComponent(short.id)}`
                      );
                      setSubNotice(`Copied Short link for "${short.title}" to clipboard!`);
                      setTimeout(() => setSubNotice(null), 2500);
                    }}
                    title="Share Short"
                    className="p-2.5 rounded-full bg-neutral-100 dark:bg-[#1E1E24] text-sky-500 border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-neutral-500 -mt-2">Share</span>

                  {/* Open TikTok-Style Slide-Up Comment Sheet */}
                  <button
                    onClick={() =>
                      setOpenCommentSheetVideoId(
                        openCommentSheetVideoId === short.id ? null : short.id
                      )
                    }
                    title="Open Reel Comment Sheet"
                    className={`p-3 rounded-full border cursor-pointer ${
                      openCommentSheetVideoId === short.id
                        ? 'bg-[#58f01b] text-neutral-950 border-[#58f01b]'
                        : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-neutral-500 -mt-2">
                    {comments.filter((c) => c.videoId === short.id).length}
                  </span>

                  {/* Rotating Vinyl Sound Disc (like YouTube Shorts bottom-right sound album art) */}
                  <button
                    type="button"
                    onClick={() =>
                      togglePlayShortSoundTrack(
                        short.shortSoundId || BUILTIN_SHORT_SOUNDS[0].id
                      )
                    }
                    title="Play / Stop Short Sound Track"
                    className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-[#FF0033] text-white flex items-center justify-center shadow-md cursor-pointer"
                  >
                    <Disc3
                      className={`w-5 h-5 text-[#58f01b] ${
                        playingSynthSoundId ===
                        (short.shortSoundId || BUILTIN_SHORT_SOUNDS[0].id)
                          ? 'animate-spin'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TikTok / Reels Slide-Up Comment Sheet Drawer */}
      {activeCommentSheetVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpenCommentSheetVideoId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[75vh] rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-[#18181B]">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Reel Comments ({activeSheetComments.length})
                </h3>
                <p className="text-[11px] text-neutral-500 truncate max-w-[260px]">
                  {activeCommentSheetVideo.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenCommentSheetVideoId(null)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {activeSheetComments.length === 0 ? (
                <p className="text-center text-neutral-500 py-8">
                  No comments on this Short yet. Start the conversation below!
                </p>
              ) : (
                activeSheetComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {c.authorName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {user?.uid === c.authorId && (
                          <button
                            type="button"
                            onClick={() => deleteComment(c.id)}
                            className="text-red-500 hover:underline text-[10px] cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <MarkdownCommentRenderer content={c.text} />
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!shortCommentDraft.trim()) return;
                await addComment(activeCommentSheetVideo.id, shortCommentDraft.trim());
                setShortCommentDraft('');
              }}
              className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 bg-neutral-50 dark:bg-[#18181B]"
            >
              <input
                type="text"
                value={shortCommentDraft}
                onChange={(e) => setShortCommentDraft(e.target.value)}
                placeholder="Add a comment on this Short (Markdown supported)..."
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#FF0033] hover:bg-[#D9002B] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 2. COMMUNITY POSTS SECTION (/posts)
 */
export const CommunityPostsPage: React.FC = () => {
  const {
    posts,
    addCommunityPost,
    toggleLikePost,
    removeLikePost,
    toggleDislikePost,
    removeDislikePost,
    deletePost,
    user,
  } = useApp();

  const [postContent, setPostContent] = useState('');
  const [imageWebpUrl, setImageWebpUrl] = useState<string | undefined>(undefined);
  const [webpStats, setWebpStats] = useState<string | undefined>(undefined);
  const [webpQuality, setWebpQuality] = useState<number>(0.8);
  const [isEncodingWebp, setIsEncodingWebp] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePostImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsEncodingWebp(true);
    try {
      const originalKb = Number((file.size / 1024).toFixed(1));
      const bitmap = await createImageBitmap(file);
      const maxDim = 1080;
      let w = bitmap.width;
      let h = bitmap.height;
      if (w > maxDim || h > maxDim) {
        const r = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(bitmap, 0, 0, w, h);

      const webpData = canvas.toDataURL('image/webp', webpQuality);
      const compressedKb = Number(((webpData.length * 3) / 4 / 1024).toFixed(1));
      const savedPct =
        originalKb > 0 ? (((originalKb - compressedKb) / originalKb) * 100).toFixed(1) : '0';

      setImageWebpUrl(webpData);
      setWebpStats(`WebP ${w}x${h} · ${originalKb}KB → ${compressedKb}KB (-${savedPct}%)`);
    } catch (err) {
      console.error('Failed to encode post image to WebP:', err);
    } finally {
      setIsEncodingWebp(false);
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setIsPublishing(true);
    try {
      await addCommunityPost({
        content: postContent,
        imageWebpUrl,
        webpStats,
      });
      setPostContent('');
      setImageWebpUrl(undefined);
      setWebpStats(undefined);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
          Creator Community Posts (WebP Image Quantization)
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Share channel updates, polls, and behind-the-scenes photos automatically converted to WebP (`image/webp`).
        </p>
      </div>

      <form
        onSubmit={handlePublishPost}
        className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4"
      >
        <textarea
          rows={3}
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder={
            user
              ? `Post an update to your subscribers, ${user.displayName?.split(' ')[0] || 'Creator'}...`
              : 'Sign in with Google and write a community post...'
          }
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF0033]"
        />

        {imageWebpUrl && (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-h-80 bg-black">
              <img
                src={imageWebpUrl}
                alt="Compressed WebP attachment"
                loading="lazy"
                className="w-full h-full object-contain max-h-80"
              />
            </div>
            {webpStats && (
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {webpStats}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePostImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isEncodingWebp}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#FF0033]" />
              <span>{isEncodingWebp ? 'Converting to WebP...' : 'Attach Image (Auto-WebP)'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span>WebP Quality:</span>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.05}
                value={webpQuality}
                onChange={(e) => setWebpQuality(parseFloat(e.target.value))}
                className="w-20 accent-[#FF0033]"
              />
              <span className="font-mono">{Math.round(webpQuality * 100)}%</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPublishing || !postContent.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish Community Post'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <CentralParkNotFoundFallback resourceType="post" />
        ) : (
          posts.map((post) => {
            const total = post.likes + post.dislikes;
            const ratio = total > 0 ? Math.round((post.likes / total) * 100) : 100;
            return (
              <article
                key={post.id}
                className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={`${post.authorName} avatar`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-800 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#FF0033] text-white flex items-center justify-center font-bold text-xs">
                        {post.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">
                        {post.authorName}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {new Date(post.createdAt).toLocaleString()}
                        {post.webpStats ? ` · ${post.webpStats}` : ''}
                      </p>
                    </div>
                  </div>

                  {user && user.uid === post.authorId && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>

                {post.imageWebpUrl && (
                  <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black">
                    <img
                      src={post.imageWebpUrl}
                      alt="Community post WebP"
                      loading="lazy"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center gap-4">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => toggleLikePost(post.id)}
                      onContextMenu={async (e) => {
                        e.preventDefault();
                        await removeLikePost(post.id);
                      }}
                      title="Left-click to Like · Right-click to remove Like"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#1E1E24] text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer font-mono tabular-nums"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#FF0033]" />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => toggleDislikePost(post.id)}
                      onContextMenu={async (e) => {
                        e.preventDefault();
                        await removeDislikePost(post.id);
                      }}
                      title="Left-click to Dislike · Right-click to remove Dislike"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#1E1E24] text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer font-mono tabular-nums"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{post.dislikes}</span>
                    </button>
                  </div>

                  <div className="w-28 space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div style={{ width: `${ratio}%` }} className="h-full bg-[#FF0033]" />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 block">
                      {ratio}% Liked
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

/**
 * 3. EMBEDDING API STUDIO (/embed-api)
 * - Requires Free 7+ Backend API Key (`ztk_live_...`) generated via the Blue Car & Hidden Movement Captcha
 * - Distinguishes YouTube-origin videos ("Watch on YouTube") vs External videos ("Watch on [ZTube logo]")
 */
export const EmbedApiStudioPage: React.FC = () => {
  const { videos, selectedVideoId, backendApiKey, userAge } = useApp();
  const [embedVideoId, setEmbedVideoId] = useState<string>(selectedVideoId || '');
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);

  const selectedVideo =
    videos.find((v) => v.id === embedVideoId) ||
    videos.find((v) => v.id === selectedVideoId) ||
    videos[0] ||
    null;

  const [customChannel, setCustomChannel] = useState('ZTube Engineering Official');
  const [customSubName, setCustomSubName] = useState('Alex Mercer · Principal Architect');
  const [customTitle, setCustomTitle] = useState(
    'AV1 WebM Per-Title Compression & High-Density Video Streaming'
  );
  const [embedWidth, setEmbedWidth] = useState(800);
  const [embedHeight, setEmbedHeight] = useState(450);
  const [copiedCode, setCopiedCode] = useState(false);

  const isSelectedYoutubeOrigin = Boolean(
    selectedVideo &&
      (selectedVideo.youtubeId || selectedVideo.videoUrl.includes('youtube.com/embed'))
  );

  const embedUrl = selectedVideo
    ? `${window.location.origin}/?embed=${encodeURIComponent(selectedVideo.id)}&apiKey=${encodeURIComponent(
        backendApiKey || 'REQUIRED_7PLUS_API_KEY'
      )}`
    : `${window.location.origin}/?embed=demo&apiKey=${encodeURIComponent(
        backendApiKey || 'REQUIRED_7PLUS_API_KEY'
      )}`;

  const iframeSnippet = `<iframe width="${embedWidth}" height="${embedHeight}" src="${embedUrl}" title="${(
    selectedVideo?.title || customTitle
  ).replace(/"/g, '&quot;')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;

  const oembedEndpointUrl = `${window.location.origin}/api/embed/oembed?videoId=${encodeURIComponent(
    selectedVideo?.id || 'demo'
  )}&title=${encodeURIComponent(selectedVideo?.title || customTitle)}&author=${encodeURIComponent(
    selectedVideo?.authorName || customChannel
  )}&isYoutube=${isSelectedYoutubeOrigin}&maxwidth=${embedWidth}&maxheight=${embedHeight}&apiKey=${encodeURIComponent(
    backendApiKey || ''
  )}`;

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <p className="text-xs font-mono text-[#FF0033] font-semibold">
            7+ PROTECTED EXTERNAL WEBSITE EMBEDDING API & OEMBED SDK
          </p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
            ZTube Website Embedding API & Free 7+ Bot-Protected Key Hub
          </h1>
        </div>

        <button
          onClick={() => setShowCaptchaModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Car className="w-4 h-4" />
          <span>
            {backendApiKey
              ? `7+ API Key Active (${userAge}+) · View Captcha`
              : 'Solve Blue Car Captcha for Free 7+ API Key'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Live Embedded Player Overlay Preview
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {isSelectedYoutubeOrigin
                ? 'YouTube Origin Video → Shows "Watch on YouTube" + Server AV1 Badge'
                : 'External Video → Shows Custom API Overlay ("Watch on ZTube")'}
            </span>
          </div>

          <CustomEmbedPlayerFrame
            video={selectedVideo}
            customTitle={customTitle}
            customChannelName={customChannel}
            customCreatorSubtext={customSubName}
          />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#FF0033]" />
                <span>Configure Embed & Backend API Key</span>
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold">
                AGES 7+ ONLY
              </span>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#FF0033]" />
                  <span>Required Backend API Key (`x-ztube-api-key`)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCaptchaModal(true)}
                  className="text-[#FF0033] font-bold hover:underline cursor-pointer"
                >
                  {backendApiKey ? 'Re-verify' : 'Generate Free Key'}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={
                  backendApiKey ||
                  'Locked — Solve Blue Car & Hidden Movement Captcha to claim free key'
                }
                className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 font-mono text-[11px] text-neutral-800 dark:text-neutral-200"
              />
            </div>

            {videos.length > 0 && (
              <div>
                <label className="block text-neutral-500 mb-1">Select Published Video to Embed</label>
                <select
                  value={selectedVideo?.id || ''}
                  onChange={(e) => setEmbedVideoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                >
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} ({v.youtubeId ? 'YouTube Origin → Watch on YouTube' : 'External → Custom API'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1">Top-Left Channel Title</label>
                <input
                  type="text"
                  value={selectedVideo?.authorName || customChannel}
                  onChange={(e) => setCustomChannel(e.target.value)}
                  disabled={Boolean(selectedVideo)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Name Underneath Channel</label>
                <input
                  type="text"
                  value={customSubName}
                  onChange={(e) => setCustomSubName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  HTML5 `&lt;iframe&gt;` Embed Snippet
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(iframeSnippet);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#27272A] text-neutral-900 dark:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy HTML</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {iframeSnippet}
              </pre>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-neutral-900 dark:text-white block">
                Protected REST oEmbed JSON API (`GET /api/embed/oembed`)
              </span>
              <a
                href={oembedEndpointUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-sky-500 hover:underline break-all inline-flex items-center gap-1"
              >
                <span>{oembedEndpointUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Creator / Channel Owner Video Download API & All Videos Bulk Download API Console */}
      <VideoDownloadApiConsole onOpenCaptchaModal={() => setShowCaptchaModal(true)} />

      <BlueCarApiKeyCaptchaModal
        isOpen={showCaptchaModal}
        onClose={() => setShowCaptchaModal(false)}
      />
    </div>
  );
};
