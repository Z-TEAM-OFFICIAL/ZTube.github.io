import React, { useState, useRef } from 'react';
import {
  Play,
  ExternalLink,
  Bookmark,
  Check,
  Heart,
  Crown,
  Lock,
  PictureInPicture2,
  Link2,
  ListPlus,
  Plus,
  Clock,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { VideoItem, SiteSettings, SubscriptionTier } from '../types';
import { useApp, parseDurationToSeconds } from '../context/AppContext';
import { evaluateVideoLocation } from '../utils/locationalAlgorithm';

function formatSecondsToClock(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export type GridSlot =
  | {
      type: 'video';
      video: VideoItem;
    }
  | {
      type: 'ad';
      adKind: 'adsense-top-left' | 'sponsored-middle-row2' | 'adsense-right-row3';
      title: string;
      sponsor: string;
      ctaUrl: string;
      slotLabel: string;
    };

/**
 * Builds the exact 3-column YouTube grid sequence:
 * - Row 1, Column 1 (Index 0): Google AdSense Ad replaces first video on top-left (when active)
 * - Row 2, Column 2 (Index 4): Sponsored Ad placed in the middle of the second row (when active)
 * - Row 3, Column 3 (Index 8): Google AdSense Ad on the right of the third row (when active)
 * - Only renders slots when real videos or active ad placements are present.
 */
export function buildYoutubeGridWithAds(
  videos: VideoItem[],
  settings: SiteSettings,
  subscriptionTier: SubscriptionTier = 'free'
): GridSlot[] {
  if (videos.length === 0) {
    return [];
  }

  // Base (20 Credits/mo) & Plus Mode (50 Credits/mo) subscriptions remove all advertisements!
  if (subscriptionTier === 'base' || subscriptionTier === 'plus') {
    return videos.map((v) => ({
      type: 'video',
      video: v,
    }));
  }

  const slots: GridSlot[] = [];
  let videoCursor = 0;
  let slotIndex = 0;

  while (videoCursor < videos.length && slotIndex < 60) {
    if (slotIndex === 0 && settings.adRow1LeftActive) {
      slots.push({
        type: 'ad',
        adKind: 'adsense-top-left',
        title: settings.adRow1Title,
        sponsor: settings.adRow1Sponsor,
        ctaUrl: settings.adRow1CtaUrl,
        slotLabel: 'Row 1 · Top-Left AdSense Placement',
      });
      slotIndex++;
      continue;
    }

    if (slotIndex === 4 && settings.adRow2MiddleActive) {
      slots.push({
        type: 'ad',
        adKind: 'sponsored-middle-row2',
        title: settings.adRow2Title,
        sponsor: settings.adRow2Sponsor,
        ctaUrl: settings.adRow2CtaUrl,
        slotLabel: 'Row 2 · Middle Sponsored Placement',
      });
      slotIndex++;
      continue;
    }

    if (slotIndex === 8 && settings.adRow3RightActive) {
      slots.push({
        type: 'ad',
        adKind: 'adsense-right-row3',
        title: settings.adRow3Title,
        sponsor: settings.adRow3Sponsor,
        ctaUrl: settings.adRow3CtaUrl,
        slotLabel: 'Row 3 · Right AdSense Placement',
      });
      slotIndex++;
      continue;
    }

    slots.push({
      type: 'video',
      video: videos[videoCursor],
    });
    videoCursor++;
    slotIndex++;
  }

  // If Row 2 or Row 3 ad falls right at the end of the current row, include it to complete the 3-column row
  if (slotIndex === 4 && settings.adRow2MiddleActive) {
    slots.push({
      type: 'ad',
      adKind: 'sponsored-middle-row2',
      title: settings.adRow2Title,
      sponsor: settings.adRow2Sponsor,
      ctaUrl: settings.adRow2CtaUrl,
      slotLabel: 'Row 2 · Middle Sponsored Placement',
    });
  } else if (slotIndex === 8 && settings.adRow3RightActive) {
    slots.push({
      type: 'ad',
      adKind: 'adsense-right-row3',
      title: settings.adRow3Title,
      sponsor: settings.adRow3Sponsor,
      ctaUrl: settings.adRow3CtaUrl,
      slotLabel: 'Row 3 · Right AdSense Placement',
    });
  }

  return slots;
}

export const CardTimelineHoverScrubber: React.FC<{
  video: VideoItem;
  imgError?: boolean;
  compact?: boolean;
  onNavigateWatch?: () => void;
}> = ({ video, imgError = false, compact = false, onNavigateWatch }) => {
  const { playerColorTheme } = useApp();
  const [hoverProgressRatio, setHoverProgressRatio] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const totalDurationSec = Math.max(15, parseDurationToSeconds(video.duration || '04:00'));
  const hoverTimeSec =
    hoverProgressRatio !== null ? Math.round(hoverProgressRatio * totalDurationSec) : null;
  const hoverPercent = hoverProgressRatio !== null ? hoverProgressRatio * 100 : 0;

  const hoverSegmentIndex =
    hoverProgressRatio !== null ? Math.min(4, Math.floor(hoverProgressRatio * 5)) : 0;
  const segmentLabels = [
    '01 · Intro & Hook',
    '02 · Architecture & Setup',
    '03 · Core Implementation',
    '04 · Benchmarks & Edge Cases',
    '05 · Recap & Takeaways',
  ];
  const segmentCropPositions = ['15% 25%', '35% 45%', '50% 50%', '70% 40%', '85% 65%'];
  const segmentFilterStyles = [
    'contrast(1.04) brightness(1.02)',
    'contrast(1.08) saturate(1.12)',
    'contrast(1.06) brightness(0.98) saturate(1.08)',
    'contrast(1.1) saturate(1.18)',
    'contrast(1.05) brightness(1.04)',
  ];

  const themeAccentBg =
    playerColorTheme === 'sunset_red'
      ? 'bg-[#FF0033]'
      : playerColorTheme === 'midnight_blue'
      ? 'bg-sky-400'
      : 'bg-[#58f01b]';
  const themeAccentBorder =
    playerColorTheme === 'sunset_red'
      ? 'border-[#FF0033]'
      : playerColorTheme === 'midnight_blue'
      ? 'border-sky-400'
      : 'border-[#58f01b]';

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverProgressRatio(ratio);
  };

  return (
    <>
      {hoverProgressRatio !== null && hoverTimeSec !== null && (
        <div
          style={{ left: `${Math.max(24, Math.min(76, hoverPercent))}%` }}
          className={`pointer-events-none absolute ${
            compact ? 'bottom-3.5 w-28' : 'bottom-5 w-36 sm:w-40'
          } -translate-x-1/2 z-30 rounded-lg overflow-hidden bg-neutral-950/95 border ${themeAccentBorder} shadow-[0_8px_28px_rgba(0,0,0,0.85)] transition-all duration-75`}
        >
          <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
            {!imgError && video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={`Timeline preview at ${formatSecondsToClock(hoverTimeSec)}`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{
                  objectPosition: segmentCropPositions[hoverSegmentIndex],
                  filter: segmentFilterStyles[hoverSegmentIndex],
                  transform: `scale(${1.14 + hoverSegmentIndex * 0.03})`,
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">
                <Play className="w-4 h-4 text-[#FF0033]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
            {!compact && (
              <span className="absolute top-1 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-neutral-200 border border-white/15">
                STATIC PREVIEW
              </span>
            )}
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/90 text-white font-mono tabular-nums text-[9px] font-bold border border-white/15">
              {formatSecondsToClock(hoverTimeSec)}
            </span>
          </div>
          <div className="px-1.5 py-1 bg-neutral-950 flex items-center justify-between gap-1 border-t border-white/10">
            <span className="text-[9px] font-mono text-neutral-300 truncate">
              {segmentLabels[hoverSegmentIndex]}
            </span>
            {!compact && (
              <span className="text-[8px] font-mono text-neutral-500 tabular-nums shrink-0">
                {Math.round(hoverPercent)}%
              </span>
            )}
          </div>
        </div>
      )}

      <div
        ref={progressBarRef}
        role="slider"
        aria-label={`Timeline preview scrubber for ${video.title}`}
        aria-valuemin={0}
        aria-valuemax={totalDurationSec}
        aria-valuenow={hoverTimeSec ?? 0}
        onMouseMove={handleProgressBarMouseMove}
        onMouseEnter={handleProgressBarMouseMove}
        onMouseLeave={() => setHoverProgressRatio(null)}
        onClick={(e) => {
          if (onNavigateWatch) {
            e.stopPropagation();
            onNavigateWatch();
          }
        }}
        className="absolute bottom-0 inset-x-0 h-3 flex items-end z-20 cursor-pointer group/cardscrub"
      >
        <div className="relative w-full h-1 group-hover:h-1.5 group-hover/cardscrub:h-2 bg-white/25 transition-all duration-150 overflow-visible">
          {[20, 40, 60, 80].map((tick) => (
            <span
              key={tick}
              style={{ left: `${tick}%` }}
              className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-black/50 z-10"
            />
          ))}

          <div
            style={{
              width: `${hoverProgressRatio !== null ? hoverPercent : 18}%`,
            }}
            className={`h-full ${
              hoverProgressRatio !== null ? themeAccentBg : 'bg-[#FF0033]/85'
            } transition-[width] duration-75`}
          />

          {hoverProgressRatio !== null && (
            <span
              style={{ left: `${hoverPercent}%` }}
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${themeAccentBg} ring-2 ring-black shadow`}
            />
          )}
        </div>
      </div>
    </>
  );
};

export const VideoCard: React.FC<{ video: VideoItem }> = React.memo(({ video }) => {
  const {
    navigate,
    isVideoInWatchLater,
    isVideoFavorited,
    isVideoWatched,
    toggleWatchLater,
    removeFromWatchLater,
    toggleFavoriteVideo,
    removeFavoriteVideo,
    miniPlayerVideoId,
    setMiniPlayerVideoId,
    playlists,
    toggleVideoInPlaylist,
    createPlaylist,
    pushNotification,
    setSelectedCategory,
    userLocation,
  } = useApp();
  const [imgError, setImgError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const inWatchLater = isVideoInWatchLater(video.id);
  const isFavorited = isVideoFavorited(video.id);
  const isWatched = isVideoWatched(video.id);

  const locEval = React.useMemo(
    () => evaluateVideoLocation(video, userLocation),
    [video, userLocation]
  );

  const handleToggleWatchLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleWatchLater(video.id);
    pushNotification({
      title: added ? 'Added to Watch Later' : 'Removed from Watch Later',
      message: added
        ? `"${video.title}" is queued in your Watch Later list. Right-click any Watch Later button to quick-remove.`
        : `Removed "${video.title}" from your Watch Later queue.`,
      kind: 'video',
      targetRoute: 'watch-later',
      targetVideoId: video.id,
    });
  };

  const handleContextRemoveWatchLater = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const removed = removeFromWatchLater(video.id);
    if (removed) {
      pushNotification({
        title: 'Removed from Watch Later',
        message: `Removed "${video.title}" from Watch Later (Right-Click Undo).`,
        kind: 'video',
        targetRoute: 'watch-later',
      });
    }
  };

  const handleCopyVideoLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const directUrl = `${window.location.origin}${window.location.pathname}?watch=${encodeURIComponent(
      video.id
    )}`;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(directUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = directUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      pushNotification({
        title: 'Direct Video Link Copied',
        message: `Copied ${directUrl} to clipboard via Web Clipboard API.`,
        kind: 'video',
        targetRoute: 'watch',
        targetVideoId: video.id,
      });
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const likes = video.likes || 0;
  const dislikes = video.dislikes || 0;
  const totalVotes = likes + dislikes;
  const likeRatio = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : 100;

  const formattedViews =
    video.views >= 1000000
      ? `${(video.views / 1000000).toFixed(1)}M views`
      : video.views >= 1000
      ? `${(video.views / 1000).toFixed(1)}K views`
      : `${video.views} views`;

  const formattedDate = new Date(video.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="group flex flex-col cursor-pointer content-auto">
      <div
        onClick={() => navigate('watch', video.id)}
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-[#18181B] border border-neutral-200/80 dark:border-neutral-800"
      >
        {!imgError && video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-neutral-300">
            <Play className="w-8 h-8 text-[#FF0033] mb-2" />
            <span className="text-xs font-medium text-center line-clamp-2">{video.title}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />
        {video.isMemberOnly && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold flex items-center gap-1 shadow-md z-10">
            <Crown className="w-3 h-3" />
            <span>MEMBER-ONLY · +0.001 Cr/View</span>
          </span>
        )}
        {!video.isMemberOnly && isWatched && (
          <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded bg-black/80 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-semibold flex items-center gap-1 z-10 pointer-events-none">
            <CheckCircle2 className="w-3 h-3" />
            <span>Watched</span>
          </span>
        )}

        {/* Top-Right Quick Watch Later Overlay Button */}
        <button
          type="button"
          onClick={handleToggleWatchLater}
          onContextMenu={handleContextRemoveWatchLater}
          title={
            inWatchLater
              ? 'In Watch Later (Click or right-click to remove)'
              : 'Watch Later (Click to save for later)'
          }
          aria-label={inWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}
          className={`absolute top-2.5 right-2.5 z-20 px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md border transition-all duration-150 cursor-pointer ${
            inWatchLater
              ? 'bg-[#FF0033] text-white border-[#FF0033] opacity-100 shadow-md'
              : 'bg-black/80 text-white border-white/15 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black'
          }`}
        >
          {inWatchLater ? (
            <>
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Watch Later</span>
            </>
          )}
        </button>

        <span className="absolute bottom-3.5 right-2.5 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono tabular-nums text-[11px] font-medium z-10 pointer-events-none">
          {video.duration}
        </span>

        {/* Interactive Video Card Bottom Timeline Progress Bar & Static Hover-Preview Thumbnail */}
        <CardTimelineHoverScrubber
          video={video}
          imgError={imgError}
          onNavigateWatch={() => navigate('watch', video.id)}
        />
      </div>

      {/* Metadata Block — Zero-Pill Discipline (clean unboxed text with · separators) */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div
          className="flex items-start gap-3 min-w-0 flex-1"
          onClick={() => navigate('watch', video.id)}
        >
          {video.authorAvatar ? (
            <img
              src={video.authorAvatar}
              alt={`${video.authorName} avatar`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5 border border-neutral-200 dark:border-neutral-800"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              {video.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#F1F1F1] leading-snug line-clamp-2 group-hover:text-[#FF0033] transition-colors">
              {video.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {video.authorName}
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(video.category);
                }}
                className="hover:text-[#FF0033] hover:underline cursor-pointer"
                title={`Filter feed by category: ${video.category}`}
              >
                {video.category}
              </button>
              <span aria-hidden="true">·</span>
              <span
                title={locEval.badgeLabel}
                className={`inline-flex items-center gap-0.5 ${
                  locEval.matchType === 'local_city' || locEval.matchType === 'same_country'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-neutral-500'
                }`}
              >
                <span>{locEval.flagEmoji}</span>
                <span>{video.locationTag || 'Worldwide'}</span>
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
              <span>{formattedViews}</span>
              <span aria-hidden="true">·</span>
              <span>{formattedDate}</span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {Math.max(7, video.minAgeRating || 7)}+
              </span>
              {video.isVolumetricVr && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#58f01b] font-semibold">VR 6DoF</span>
                </>
              )}
              {video.youtubeId ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#FF0033]">YT AV1</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Custom API</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-1 shrink-0">
          {/* Copy Link Button using Web Clipboard API */}
          <button
            type="button"
            onClick={handleCopyVideoLink}
            title={
              copiedLink
                ? 'Direct URL copied to clipboard!'
                : 'Copy direct video URL to clipboard (Web Clipboard API)'
            }
            aria-label={copiedLink ? 'Copied video link' : 'Copy Link'}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
              copiedLink
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-neutral-100 dark:bg-[#18181B] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white hover:border-[#FF0033]/50'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 shrink-0" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Add to Playlist Button & Popover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPlaylistMenuOpen((prev) => !prev);
            }}
            title="Add to or manage Playlists"
            aria-label="Add to Playlist"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              playlistMenuOpen || playlists.some((pl) => pl.videoIds.includes(video.id))
                ? 'text-[#FF0033]'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ListPlus className="w-4 h-4" />
          </button>

          {playlistMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 z-40 w-64 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] shadow-2xl p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Save to Playlist
                </span>
                <button
                  type="button"
                  onClick={() => setPlaylistMenuOpen(false)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Done
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {playlists.map((pl) => {
                  const inPlaylist = pl.videoIds.includes(video.id);
                  return (
                    <label
                      key={pl.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1E1E24] cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={inPlaylist}
                          onChange={() => toggleVideoInPlaylist(pl.id, video.id)}
                          className="rounded accent-[#FF0033]"
                        />
                        <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                          {pl.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {pl.videoIds.length}
                      </span>
                    </label>
                  );
                })}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPlaylistTitle.trim()) return;
                  createPlaylist(newPlaylistTitle.trim(), 'Custom user playlist', true, video.id);
                  setNewPlaylistTitle('');
                }}
                className="pt-1.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="New playlist name..."
                  className="flex-1 min-w-0 px-2 py-1 rounded-lg text-xs bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded-lg bg-[#FF0033] text-white text-xs font-semibold flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create</span>
                </button>
              </form>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setMiniPlayerVideoId(miniPlayerVideoId === video.id ? null : video.id);
            }}
            title="Open in Chromium / Safari / Firefox Mini-Player"
            aria-label="Open in Mini-Player"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              miniPlayerVideoId === video.id
                ? 'text-[#58f01b]'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteVideo(video.id);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeFavoriteVideo(video.id);
            }}
            title={
              isFavorited
                ? 'Favorited (Right-click to remove Favorite)'
                : 'Favorite Video (Right-click to remove)'
            }
            aria-label={isFavorited ? 'Remove Favorite' : 'Favorite Video'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isFavorited
                ? 'text-[#FF0033]'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleToggleWatchLater}
            onContextMenu={handleContextRemoveWatchLater}
            title={
              inWatchLater
                ? 'Saved in Watch Later (Right-click to remove)'
                : 'Add to Watch Later (Right-click to remove)'
            }
            aria-label={inWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
              inWatchLater
                ? 'bg-[#FF0033]/15 text-[#FF0033] border-[#FF0033]/40'
                : 'bg-neutral-100 dark:bg-[#18181B] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white hover:border-[#FF0033]/50'
            }`}
          >
            {inWatchLater ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#FF0033] shrink-0" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Later</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subtle Like / Dislike Ratio Bar under card metadata */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div style={{ width: `${likeRatio}%` }} className="h-full bg-[#FF0033]" />
        </div>
        <span className="text-[10px] font-mono text-neutral-500 tabular-nums">{likeRatio}%</span>
      </div>
    </article>
  );
});

export const AdGridCard: React.FC<{
  adKind: 'adsense-top-left' | 'sponsored-middle-row2' | 'adsense-right-row3';
  title: string;
  sponsor: string;
  ctaUrl: string;
  slotLabel: string;
}> = ({ adKind, title, sponsor, ctaUrl, slotLabel }) => {
  const { navigate } = useApp();
  const isSponsored = adKind === 'sponsored-middle-row2';

  return (
    <article className="flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] p-3.5 transition-colors hover:border-neutral-400 dark:hover:border-neutral-700">
      <div>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-[#18181B] via-[#1E293B] to-[#0F172A] p-4 flex flex-col justify-between border border-neutral-800">
          <div className="flex items-center justify-between text-[11px] text-neutral-300 font-mono">
            <span>{isSponsored ? 'SPONSORED PARTNER' : 'GOOGLE ADSENSE'}</span>
            <span>{slotLabel}</span>
          </div>

          <div className="my-auto">
            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{title}</p>
            <p className="mt-1 text-xs text-neutral-300 truncate">{sponsor}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[11px] text-amber-400 font-medium">
              Verified Placement · Active
            </span>
            <button
              onClick={() => navigate('admin')}
              className="text-[11px] text-neutral-300 hover:text-white underline cursor-pointer"
            >
              Configure Slot
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#F1F1F1] leading-snug line-clamp-1">
              {title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Ad</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{sponsor}</span>
            </div>
          </div>

          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
