import React, { useState, useMemo } from 'react';
import {
  Clock,
  Play,
  Shuffle,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  GripVertical,
  CheckCircle2,
  Check,
  PictureInPicture2,
  Sparkles,
  ListChecks,
  Filter,
  ArrowUpDown,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp, parseDurationToSeconds } from '../context/AppContext';
import { VideoItem, WatchLaterSortOption, WatchLaterFilterStatus } from '../types';

function formatRuntimeSummary(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  }
  if (mins > 0) {
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

export const WatchLaterLibrarySection: React.FC<{ isDedicatedPage?: boolean }> = ({
  isDedicatedPage = false,
}) => {
  const {
    videos,
    watchLaterEntries,
    isVideoWatched,
    removeFromWatchLater,
    reorderWatchLater,
    moveWatchLaterItemToPosition,
    removeWatchedFromWatchLater,
    clearWatchLater,
    autoRemoveWatchLaterOnFinish,
    setAutoRemoveWatchLaterOnFinish,
    startWatchLaterQueue,
    activeQueueMode,
    setActiveQueueMode,
    miniPlayerVideoId,
    setMiniPlayerVideoId,
    navigate,
    pushNotification,
  } = useApp();

  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<WatchLaterFilterStatus>('all');
  const [sortOption, setSortOption] = useState<WatchLaterSortOption>('custom');
  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  const [dragOverVideoId, setDragOverVideoId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Map video objects by id in O(1)
  const videoMap = useMemo(() => {
    const map = new Map<string, VideoItem>();
    for (const v of videos) {
      map.set(v.id, v);
    }
    return map;
  }, [videos]);

  // Hydrate WatchLaterEntries with their corresponding VideoItem
  const hydratedItems = useMemo(() => {
    return watchLaterEntries
      .map((entry, idx) => {
        const video = videoMap.get(entry.videoId);
        if (!video) return null;
        const watched = Boolean(entry.watchedAt) || isVideoWatched(video.id);
        const durationSec = parseDurationToSeconds(video.duration || '04:00');
        return {
          entry,
          video,
          originalIndex: idx,
          watched,
          durationSec,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [watchLaterEntries, videoMap, isVideoWatched]);

  // Aggregate stats for header
  const stats = useMemo(() => {
    let totalSec = 0;
    let unwatchedSec = 0;
    let watchedCount = 0;
    let unwatchedCount = 0;

    for (const item of hydratedItems) {
      totalSec += item.durationSec;
      if (item.watched) {
        watchedCount++;
      } else {
        unwatchedCount++;
        unwatchedSec += item.durationSec;
      }
    }

    return {
      totalCount: hydratedItems.length,
      watchedCount,
      unwatchedCount,
      totalRuntime: formatRuntimeSummary(totalSec),
      unwatchedRuntime: formatRuntimeSummary(unwatchedSec),
    };
  }, [hydratedItems]);

  // Filter & Sort items
  const visibleItems = useMemo(() => {
    const q = searchInput.trim().toLowerCase();

    const filtered = hydratedItems.filter((item) => {
      if (filterStatus === 'unwatched' && item.watched) return false;
      if (filterStatus === 'watched' && !item.watched) return false;
      if (!q) return true;
      const inTitle = item.video.title.toLowerCase().includes(q);
      const inAuthor = item.video.authorName.toLowerCase().includes(q);
      const inCategory = (item.video.category || '').toLowerCase().includes(q);
      const inTags = (item.video.tags || []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inAuthor || inCategory || inTags;
    });

    const sorted = [...filtered];
    if (sortOption === 'added_newest') {
      sorted.sort((a, b) => b.entry.addedAt.localeCompare(a.entry.addedAt));
    } else if (sortOption === 'added_oldest') {
      sorted.sort((a, b) => a.entry.addedAt.localeCompare(b.entry.addedAt));
    } else if (sortOption === 'duration_Asc') {
      sorted.sort((a, b) => a.durationSec - b.durationSec);
    } else if (sortOption === 'duration_desc') {
      sorted.sort((a, b) => b.durationSec - a.durationSec);
    } else if (sortOption === 'views_desc') {
      sorted.sort((a, b) => (b.video.views || 0) - (a.video.views || 0));
    } else {
      sorted.sort((a, b) => a.originalIndex - b.originalIndex);
    }

    return sorted;
  }, [hydratedItems, searchInput, filterStatus, sortOption]);

  const showTransientBanner = (msg: string) => {
    setFeedbackBanner(msg);
    window.setTimeout(() => {
      setFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handlePlayAll = (shuffle = false, startVideoId?: string) => {
    const targetIds = visibleItems.map((i) => i.video.id);
    if (targetIds.length === 0) return;
    startWatchLaterQueue(shuffle, startVideoId, targetIds);
  };

  const handleRemoveWatched = () => {
    const count = removeWatchedFromWatchLater();
    if (count > 0) {
      showTransientBanner(`Removed ${count} watched video${count > 1 ? 's' : ''} from Watch Later.`);
      pushNotification({
        title: 'Cleaned Up Watch Later Queue',
        message: `Removed ${count} watched video${count > 1 ? 's' : ''} from your Watch Later list.`,
        kind: 'video',
        targetRoute: 'watch-later',
      });
    } else {
      showTransientBanner('No watched videos found in your Watch Later list.');
    }
  };

  const handleDropOnItem = (targetVideoId: string) => {
    if (!draggedVideoId || draggedVideoId === targetVideoId) {
      setDraggedVideoId(null);
      setDragOverVideoId(null);
      return;
    }
    const fromIdx = watchLaterEntries.findIndex((e) => e.videoId === draggedVideoId);
    const toIdx = watchLaterEntries.findIndex((e) => e.videoId === targetVideoId);
    if (fromIdx !== -1 && toIdx !== -1) {
      if (sortOption !== 'custom') {
        setSortOption('custom');
      }
      reorderWatchLater(fromIdx, toIdx);
    }
    setDraggedVideoId(null);
    setDragOverVideoId(null);
  };

  return (
    <section
      aria-label="Watch Later Queue and Library Management"
      className="space-y-5"
    >
      {/* Top Studio Header Card */}
      <div className="p-5 sm:p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF0033]" />
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight text-balance">
                Watch Later Queue
              </h1>
              <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1E1E24] border border-neutral-200 dark:border-neutral-800 font-mono tabular-nums text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {stats.totalCount} {stats.totalCount === 1 ? 'video' : 'videos'}
              </span>
              {activeQueueMode === 'watch-later' && (
                <span className="px-2 py-0.5 rounded bg-[#58f01b]/15 border border-[#58f01b]/40 text-[#58f01b] font-mono text-[10px] font-bold">
                  QUEUE PLAYBACK ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Synced across sessions via local storage &amp; Firestore · Drag rows or use arrow controls to customize playback order
            </p>
          </div>

          {/* Primary Queue CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={visibleItems.length === 0}
              onClick={() => handlePlayAll(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] disabled:opacity-40 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All ({visibleItems.length})</span>
            </button>

            <button
              type="button"
              disabled={visibleItems.length === 0}
              onClick={() => handlePlayAll(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 transition-opacity cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle Play</span>
            </button>

            {stats.watchedCount > 0 && (
              <button
                type="button"
                onClick={handleRemoveWatched}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#18181B] text-neutral-700 dark:text-neutral-200 hover:border-[#FF0033]/50 hover:text-[#FF0033] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Remove all videos you have already watched from Watch Later"
              >
                <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                <span>Remove Watched ({stats.watchedCount})</span>
              </button>
            )}

            {stats.totalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearWatchLater();
                  showTransientBanner('Cleared all videos from Watch Later.');
                }}
                className="p-2 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-[#FF0033] hover:border-[#FF0033]/40 transition-colors cursor-pointer"
                title="Clear entire Watch Later list"
                aria-label="Clear entire Watch Later list"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Strip & Auto-Remove on Completion Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-neutral-600 dark:text-neutral-400 font-mono tabular-nums">
            <div>
              <span className="text-neutral-400 dark:text-neutral-500">Total Runtime: </span>
              <span className="font-bold text-neutral-900 dark:text-white">{stats.totalRuntime}</span>
            </div>
            <span aria-hidden="true">·</span>
            <div>
              <span className="text-neutral-400 dark:text-neutral-500">Unwatched: </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {stats.unwatchedCount} ({stats.unwatchedRuntime})
              </span>
            </div>
            <span aria-hidden="true">·</span>
            <div>
              <span className="text-neutral-400 dark:text-neutral-500">Completed: </span>
              <span className="font-bold text-sky-600 dark:text-sky-400">{stats.watchedCount}</span>
            </div>
          </div>

          {/* User Toggle for Auto-Removal on Video Completion */}
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181B] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRemoveWatchLaterOnFinish}
                onChange={(e) => {
                  setAutoRemoveWatchLaterOnFinish(e.target.checked);
                  showTransientBanner(
                    e.target.checked
                      ? 'Auto-remove on completion enabled: finished videos will automatically leave Watch Later.'
                      : 'Auto-remove on completion disabled: finished videos stay in Watch Later with a Watched badge.'
                  );
                }}
                className="rounded accent-[#FF0033] w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Auto-remove when finished watching
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                  autoRemoveWatchLaterOnFinish
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {autoRemoveWatchLaterOnFinish ? 'ON' : 'OFF'}
              </span>
            </label>

            {!isDedicatedPage && (
              <button
                type="button"
                onClick={() => navigate('watch-later')}
                className="text-xs font-semibold text-[#FF0033] hover:underline cursor-pointer shrink-0"
              >
                Open Full View →
              </button>
            )}
          </div>
        </div>

        {/* Search, Filter & Sort Toolbar */}
        {stats.totalCount > 0 && (
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Filter queue by title, creator, category, or tag..."
                aria-label="Filter Watch Later videos"
                className="w-full pl-8 pr-8 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs (All / Unwatched / Watched) */}
            <div className="md:col-span-4 flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800">
              <Filter className="w-3.5 h-3.5 text-neutral-400 ml-1.5 mr-1 shrink-0" />
              {(
                [
                  { id: 'all', label: `All (${stats.totalCount})` },
                  { id: 'unwatched', label: `Unwatched (${stats.unwatchedCount})` },
                  { id: 'watched', label: `Watched (${stats.watchedCount})` },
                ] as { id: WatchLaterFilterStatus; label: string }[]
              ).map((tab) => {
                const active = filterStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id)}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-3 flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as WatchLaterSortOption)}
                aria-label="Sort Watch Later videos"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white cursor-pointer focus:outline-none focus:border-[#FF0033]"
              >
                <option value="custom">Sort: Custom Queue Order</option>
                <option value="added_newest">Date Added (Newest First)</option>
                <option value="added_oldest">Date Added (Oldest First)</option>
                <option value="duration_Asc">Duration (Shortest First)</option>
                <option value="duration_desc">Duration (Longest First)</option>
                <option value="views_desc">Popularity (Most Views)</option>
              </select>
            </div>
          </div>
        )}

        {feedbackBanner && (
          <div className="px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{feedbackBanner}</span>
            </span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Empty States */}
      {stats.totalCount === 0 ? (
        <div className="p-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF0033]/10 border border-[#FF0033]/30 text-[#FF0033] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Your Watch Later Queue is Empty
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            Click the <strong>Watch Later</strong> clock icon on any video card, Short, or watch page to save technical deep-dives and tutorials for later binge-watching.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer"
            >
              Explore Home Feed
            </button>
            <button
              type="button"
              onClick={() => navigate('trending')}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Browse Trending
            </button>
          </div>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] text-center space-y-3">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            No queued videos match your current filter or search.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setFilterStatus('all');
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        /* Interactive Ordered Queue List */
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] overflow-hidden">
          {visibleItems.map((item, idx) => {
            const { video, entry, watched, originalIndex } = item;
            const isDragging = draggedVideoId === video.id;
            const isDragOver = dragOverVideoId === video.id;
            const addedDateLabel = new Date(entry.addedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={video.id}
                draggable
                onDragStart={() => setDraggedVideoId(video.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverVideoId !== video.id) {
                    setDragOverVideoId(video.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverVideoId === video.id) {
                    setDragOverVideoId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnItem(video.id);
                }}
                onDragEnd={() => {
                  setDraggedVideoId(null);
                  setDragOverVideoId(null);
                }}
                className={`group p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors content-auto ${
                  isDragging
                    ? 'opacity-45 bg-neutral-100 dark:bg-[#1E1E24]'
                    : isDragOver
                    ? 'bg-[#FF0033]/10 border-l-2 border-l-[#FF0033]'
                    : 'hover:bg-neutral-50 dark:hover:bg-[#18181B]'
                }`}
              >
                {/* Left: Drag Handle + Index + Thumbnail + Metadata */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 text-neutral-400 shrink-0 pt-1 sm:pt-0">
                    <span
                      title="Drag to reorder in Watch Later queue"
                      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="w-6 text-center font-mono tabular-nums text-xs font-bold text-neutral-400 dark:text-neutral-500">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Thumbnail with Play Queue Trigger */}
                  <div
                    onClick={() => handlePlayAll(false, video.id)}
                    className="relative w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shrink-0 cursor-pointer group/thumb"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-150 group-hover/thumb:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-2.5 py-1 rounded-md bg-[#FF0033] text-white text-[11px] font-bold flex items-center gap-1 shadow-lg">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play Queue</span>
                      </div>
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono tabular-nums text-[10px] font-semibold">
                      {video.duration}
                    </span>
                    {watched && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-500/90 text-neutral-950 font-mono text-[9px] font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>WATCHED</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Clean Unboxed Metadata */}
                  <div
                    onClick={() => handlePlayAll(false, video.id)}
                    className="min-w-0 flex-1 cursor-pointer space-y-1"
                  >
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#F1F1F1] leading-snug line-clamp-2 group-hover:text-[#FF0033] transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {video.authorName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{video.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {(video.views || 0).toLocaleString()} views
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-neutral-400">
                        Added {addedDateLabel}
                      </span>
                    </div>
                    {video.description && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 hidden md:block">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Reorder Controls + Mini-Player + Remove */}
                <div className="flex items-center justify-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200/60 dark:border-neutral-800/60">
                  <button
                    type="button"
                    disabled={originalIndex === 0}
                    onClick={() => {
                      if (sortOption !== 'custom') setSortOption('custom');
                      moveWatchLaterItemToPosition(video.id, 'top');
                    }}
                    title="Move to top of queue"
                    aria-label="Move to top of queue"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronsUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={originalIndex === 0}
                    onClick={() => {
                      if (sortOption !== 'custom') setSortOption('custom');
                      moveWatchLaterItemToPosition(video.id, 'up');
                    }}
                    title="Move up one position"
                    aria-label="Move up"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={originalIndex >= watchLaterEntries.length - 1}
                    onClick={() => {
                      if (sortOption !== 'custom') setSortOption('custom');
                      moveWatchLaterItemToPosition(video.id, 'down');
                    }}
                    title="Move down one position"
                    aria-label="Move down"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMiniPlayerVideoId(miniPlayerVideoId === video.id ? null : video.id)
                    }
                    title="Launch in Docked Mini-Player"
                    aria-label="Launch in Mini-Player"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      miniPlayerVideoId === video.id
                        ? 'text-[#58f01b] bg-[#58f01b]/10'
                        : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <PictureInPicture2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      removeFromWatchLater(video.id);
                      showTransientBanner(`Removed "${video.title}" from Watch Later.`);
                    }}
                    title="Remove from Watch Later"
                    aria-label={`Remove ${video.title} from Watch Later`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:text-[#FF0033] hover:bg-[#FF0033]/10 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
