import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Play,
  Sparkles,
  Download,
  MousePointer,
  Subtitles,
  Languages,
  Youtube,
  Bell,
  Music,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
  ShieldCheck,
  Code2,
  PictureInPicture2,
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';

/**
 * Helper to trigger native Picture-in-Picture across Chromium (Chrome/Edge/Brave),
 * Safari (WebKitPresentationMode), and Firefox (HTMLVideoElement.requestPictureInPicture).
 */
export async function triggerCrossBrowserNativePiP(
  videoEl: HTMLVideoElement | null
): Promise<{ mode: 'chromium_safari_native' | 'docked_fallback'; engine: string }> {
  const ua = navigator.userAgent || '';
  const engine = /Edg\//.test(ua)
    ? 'Chromium (Edge)'
    : /Chrome\//.test(ua) && !/Chromium\//.test(ua)
    ? 'Chromium (Chrome)'
    : /Firefox\//.test(ua)
    ? 'Firefox (Gecko)'
    : /Safari\//.test(ua) && !/Chrome\//.test(ua)
    ? 'Safari (WebKit)'
    : 'Browser Engine';

  if (videoEl) {
    try {
      // 1. Standard W3C / Chromium / Firefox Picture-in-Picture API
      if (
        'pictureInPictureEnabled' in document &&
        (document as Document & { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled &&
        typeof videoEl.requestPictureInPicture === 'function'
      ) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoEl.requestPictureInPicture();
          return { mode: 'chromium_safari_native', engine };
        }
      }
      // 2. Apple Safari / macOS / iPadOS WebKit Presentation Mode API
      const webkitVideo = videoEl as HTMLVideoElement & {
        webkitSupportsPresentationMode?: (mode: string) => boolean;
        webkitSetPresentationMode?: (mode: string) => void;
        webkitPresentationMode?: string;
      };
      if (
        typeof webkitVideo.webkitSupportsPresentationMode === 'function' &&
        webkitVideo.webkitSupportsPresentationMode('picture-in-picture') &&
        typeof webkitVideo.webkitSetPresentationMode === 'function'
      ) {
        const nextMode =
          webkitVideo.webkitPresentationMode === 'picture-in-picture'
            ? 'inline'
            : 'picture-in-picture';
        webkitVideo.webkitSetPresentationMode(nextMode);
        return { mode: 'chromium_safari_native', engine: 'Safari (WebKit PiP)' };
      }
    } catch {
      // Fall through to floating docked mini-player
    }
  }

  return { mode: 'docked_fallback', engine };
}

/**
 * PERSISTENT FLOATING CROSS-BROWSER MINI-PLAYER DOCK (Chromium / Safari / Firefox)
 * Stays pinned in the bottom-right corner while browsing Home, Shorts, Posts, Docs, or Admin.
 */
export const CrossBrowserMiniPlayerDock: React.FC = () => {
  const {
    videos,
    miniPlayerVideoId,
    setMiniPlayerVideoId,
    navigate,
    toggleLikeVideo,
    removeLikeVideo,
    toggleDislikeVideo,
    removeDislikeVideo,
    favoriteVideoIds,
    toggleFavoriteVideo,
    removeFavoriteVideo,
  } = useApp();

  const miniVideoRef = useRef<HTMLVideoElement | null>(null);
  const miniYtRef = useRef<HTMLIFrameElement | null>(null);
  const [pipEngineLabel, setPipEngineLabel] = useState<string>('Chromium · Safari · Firefox');
  const [miniPlaying, setMiniPlaying] = useState<boolean>(true);
  const [miniProgress, setMiniProgress] = useState<number>(0);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/Firefox\//.test(ua)) setPipEngineLabel('Firefox Gecko Mini-Player');
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua))
      setPipEngineLabel('Safari WebKit Mini-Player');
    else setPipEngineLabel('Chromium PiP Mini-Player');
  }, []);

  useEffect(() => {
    if (!miniPlaying) return;
    const t = window.setInterval(() => {
      setMiniProgress((prev) => (prev >= 100 ? 0 : prev + 0.8));
    }, 350);
    return () => window.clearInterval(t);
  }, [miniPlaying]);

  if (!miniPlayerVideoId) return null;
  const video = videos.find((v) => v.id === miniPlayerVideoId) || videos[0];
  if (!video) return null;

  const isYoutubeEmbed =
    video.videoUrl.includes('youtube.com/embed') ||
    Boolean(video.youtubeId && video.videoUrl.includes('youtube'));
  const isFavorited = favoriteVideoIds.includes(video.id);

  const toggleMiniPlayPause = () => {
    const next = !miniPlaying;
    setMiniPlaying(next);
    if (isYoutubeEmbed && miniYtRef.current?.contentWindow) {
      miniYtRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: next ? 'playVideo' : 'pauseVideo',
          args: [],
        }),
        '*'
      );
    } else if (miniVideoRef.current) {
      if (next) miniVideoRef.current.play().catch(() => {});
      else miniVideoRef.current.pause();
    }
  };

  return (
    <aside
      role="region"
      aria-label={`Mini-Player playing ${video.title}`}
      className="fixed bottom-16 sm:bottom-4 right-3 sm:right-4 z-50 w-[330px] sm:w-[370px] rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl shadow-2xl"
    >
      {/* Top Engine & Controls Header */}
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 bg-neutral-100/80 dark:bg-[#18181B]/90">
        <div className="flex items-center gap-1.5 min-w-0">
          <PictureInPicture2 className="w-3.5 h-3.5 text-[#58f01b] shrink-0" />
          <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200 truncate">
            {pipEngineLabel} · Custom Engine
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isYoutubeEmbed && (
            <button
              type="button"
              onClick={() => triggerCrossBrowserNativePiP(miniVideoRef.current)}
              title="Pop out into OS-level Chromium / Safari / Firefox Picture-in-Picture window"
              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#58f01b]/20 text-neutral-900 dark:text-[#58f01b] cursor-pointer"
            >
              OS PiP
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              navigate('watch', video.id);
              setMiniPlayerVideoId(null);
            }}
            title="Expand back to full Watch page"
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMiniPlayerVideoId(null)}
            title="Close Mini-Player"
            className="p-1 rounded hover:bg-red-500/20 text-neutral-500 hover:text-[#FF0033] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 16:9 Custom Chromeless Mini Video Viewport (No built-in controls) */}
      <div
        onClick={toggleMiniPlayPause}
        className="relative aspect-video w-full bg-black cursor-pointer group/mini overflow-hidden"
      >
        {isYoutubeEmbed ? (
          <iframe
            ref={miniYtRef}
            src={`https://www.youtube.com/embed/${
              video.youtubeId || video.videoUrl.split('/embed/')[1]?.split('?')[0] || ''
            }?enablejsapi=1&controls=0&modestbranding=1&rel=0&autoplay=1&playsinline=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full border-0 pointer-events-none"
          />
        ) : (
          <video
            ref={miniVideoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            autoPlay
            playsInline
            onTimeUpdate={(e) => {
              if (e.currentTarget.duration > 0) {
                setMiniProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100);
              }
            }}
            className="w-full h-full object-contain bg-black pointer-events-none"
          />
        )}

        {/* Custom Mini-Player Scrubber & Play/Pause Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMiniPlayPause();
            }}
            className="px-2 py-0.5 rounded bg-[#FF0033] text-white text-[10px] font-mono font-bold cursor-pointer"
          >
            {miniPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden">
            <div
              style={{ width: `${miniProgress}%` }}
              className="h-full bg-[#58f01b] transition-all"
            />
          </div>
          <span className="text-[10px] font-mono text-white">{video.duration}</span>
        </div>
      </div>

      {/* Bottom Metadata & Quick Right-Click-Undo Actions */}
      <div className="p-2.5 flex items-center justify-between gap-2 text-xs">
        <div
          onClick={() => {
            navigate('watch', video.id);
            setMiniPlayerVideoId(null);
          }}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <p className="font-bold text-neutral-900 dark:text-white truncate text-xs">
            {video.title}
          </p>
          <p className="text-[11px] text-neutral-500 truncate">{video.authorName}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => toggleLikeVideo(video.id)}
            onContextMenu={async (e) => {
              e.preventDefault();
              await removeLikeVideo(video.id);
            }}
            title="Left-click Like · Right-click remove Like"
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200 cursor-pointer"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-[#FF0033]" />
          </button>
          <button
            type="button"
            onClick={() => toggleDislikeVideo(video.id)}
            onContextMenu={async (e) => {
              e.preventDefault();
              await removeDislikeVideo(video.id);
            }}
            title="Left-click Dislike · Right-click remove Dislike"
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200 cursor-pointer"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleFavoriteVideo(video.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              removeFavoriteVideo(video.id);
            }}
            title="Left-click Favorite · Right-click remove Favorite"
            className={`p-1.5 rounded-lg cursor-pointer ${
              isFavorited
                ? 'bg-[#FF0033] text-white'
                : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
};

/**
 * 1. OPTIONAL CUSTOM RGB CURSOR (Green Left, Blue Middle Scroll-Wheel, Red Right)
 * Renders both a custom SVG cursor style and a precision interactive tri-button mouse HUD
 * showing Green Left button, Blue Scroll-Wheel in the middle, and Red Right button.
 */
export const OptionalRgbMouseCursorOverlay: React.FC = () => {
  const { rgbCursorEnabled } = useApp();
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [activeBtn, setActiveBtn] = useState<'left' | 'middle' | 'right' | 'wheel' | null>(null);
  const [wheelOffset, setWheelOffset] = useState<number>(0);

  useEffect(() => {
    const html = document.documentElement;
    if (!rgbCursorEnabled) {
      html.classList.remove('rgb-tri-cursor-active');
      return;
    }
    html.classList.add('rgb-tri-cursor-active');

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    const onDown = (e: MouseEvent) => {
      if (e.button === 0) setActiveBtn('left');
      else if (e.button === 1) setActiveBtn('middle');
      else if (e.button === 2) setActiveBtn('right');
    };

    const onUp = () => {
      setActiveBtn(null);
    };

    let wheelTimeout: number | undefined;
    const onWheel = (e: WheelEvent) => {
      setActiveBtn('wheel');
      setWheelOffset((prev) => (prev + (e.deltaY > 0 ? 2 : -2)) % 6);
      window.clearTimeout(wheelTimeout);
      wheelTimeout = window.setTimeout(() => {
        setActiveBtn(null);
      }, 220);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      html.classList.remove('rgb-tri-cursor-active');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelTimeout);
    };
  }, [rgbCursorEnabled]);

  if (!rgbCursorEnabled || pos.x < 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        transform: `translate3d(${pos.x + 14}px, ${pos.y + 14}px, 0)`,
      }}
      className="fixed top-0 left-0 z-[9999] pointer-events-none hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-lg"
    >
      {/* Tri-Color Mouse Diagram: Green Left | Blue Scroll-Wheel Middle | Red Right */}
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" className="shrink-0">
        {/* Mouse Body Chassis */}
        <rect
          x="1.5"
          y="1.5"
          width="21"
          height="29"
          rx="10.5"
          fill="#121216"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
        />
        {/* LEFT BUTTON: GREEN (#22c55e / #58f01b) */}
        <path
          d="M3 12C3 6.477 6.8 3 10.2 3V13.5H3V12Z"
          fill={activeBtn === 'left' ? '#58f01b' : '#22c55e'}
          fillOpacity={activeBtn === 'left' ? '1' : '0.88'}
        />
        {/* RIGHT BUTTON: RED (#FF0033) */}
        <path
          d="M21 12C21 6.477 17.2 3 13.8 3V13.5H21V12Z"
          fill={activeBtn === 'right' ? '#ff3355' : '#FF0033'}
          fillOpacity={activeBtn === 'right' ? '1' : '0.88'}
        />
        {/* MIDDLE SCROLL-WHEEL: BLUE (#3b82f6) */}
        <rect
          x="10.2"
          y={3.5 + wheelOffset * 0.25}
          width="3.6"
          height="9.5"
          rx="1.8"
          fill={activeBtn === 'middle' || activeBtn === 'wheel' ? '#60a5fa' : '#3b82f6'}
          stroke="#93c5fd"
          strokeWidth="0.8"
        />
        {/* Scroll Wheel Ridges */}
        <line x1="10.8" y1="6" x2="13.2" y2="6" stroke="#0F172A" strokeWidth="0.9" />
        <line x1="10.8" y1="8.2" x2="13.2" y2="8.2" stroke="#0F172A" strokeWidth="0.9" />
        <line x1="10.8" y1="10.4" x2="13.2" y2="10.4" stroke="#0F172A" strokeWidth="0.9" />
      </svg>

      <div className="flex flex-col text-[9px] font-mono leading-tight pr-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[#58f01b] font-bold">L:Select</span>
          <span className="text-sky-400 font-bold">M:Wheel</span>
          <span className="text-[#FF0033] font-bold">R:Undo</span>
        </div>
        {activeBtn === 'right' && (
          <span className="text-[#FF0033] font-semibold">Right-Click: Remove Entry</span>
        )}
        {activeBtn === 'wheel' && (
          <span className="text-sky-400 font-semibold">Blue Scroll-Wheel Active</span>
        )}
      </div>
    </div>
  );
};

/**
 * 2. MOVING LIQUID-GLASS VIBRATING CORNER WATERMARK (ZTube Logo + @username)
 * - Changes in transparency and refraction
 * - Vibrates in corners before moving to another corner by fading out and back in
 * - Makes automated watermark removal extremely difficult
 */
export const MovingLiquidGlassWatermark: React.FC<{
  usernameHandle: string;
  enabled: boolean;
}> = ({ usernameHandle, enabled }) => {
  const [cornerIdx, setCornerIdx] = useState<number>(0); // 0: TL, 1: TR, 2: BR, 3: BL
  const [phase, setPhase] = useState<'vibrating' | 'fading_out' | 'fading_in'>('vibrating');
  const [jitter, setJitter] = useState<{ dx: number; dy: number; opacity: number; hue: number }>({
    dx: 0,
    dy: 0,
    opacity: 0.78,
    hue: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    // Micro-vibration + transparency & refraction oscillation every 90ms
    const vibrateInterval = window.setInterval(() => {
      const t = Date.now() / 300;
      const dx = (Math.sin(t * 7.3) * 2.6 + (Math.random() - 0.5) * 2.2);
      const dy = (Math.cos(t * 6.1) * 2.6 + (Math.random() - 0.5) * 2.2);
      const opacity = 0.52 + 0.38 * (0.5 + 0.5 * Math.sin(t * 1.9));
      const hue = Math.round(Math.sin(t * 0.8) * 22);
      setJitter({ dx, dy, opacity, hue });
    }, 95);

    // Corner transition cycle: Vibrate in corner -> Fade out -> Move to next corner -> Fade back in
    const cornerCycleInterval = window.setInterval(() => {
      setPhase('fading_out');
      window.setTimeout(() => {
        setCornerIdx((prev) => (prev + 1) % 4);
        setPhase('fading_in');
        window.setTimeout(() => {
          setPhase('vibrating');
        }, 420);
      }, 420);
    }, 4400);

    return () => {
      window.clearInterval(vibrateInterval);
      window.clearInterval(cornerCycleInterval);
    };
  }, [enabled]);

  if (!enabled) return null;

  const cleanHandle = usernameHandle.startsWith('@')
    ? usernameHandle
    : `@${usernameHandle.replace(/\s+/g, '').toLowerCase() || 'john123'}`;

  const cornerPositionClasses = [
    'top-3.5 left-3.5',
    'top-3.5 right-3.5',
    'bottom-14 right-3.5',
    'bottom-14 left-3.5',
  ][cornerIdx];

  const effectiveOpacity =
    phase === 'fading_out' ? 0.02 : phase === 'fading_in' ? 0.92 : jitter.opacity;

  return (
    <div
      aria-label={`ZTube Moving Liquid-Glass Watermark for ${cleanHandle}`}
      style={{
        transform: `translate3d(${jitter.dx.toFixed(2)}px, ${jitter.dy.toFixed(2)}px, 0)`,
        opacity: effectiveOpacity,
        backdropFilter: `blur(${10 + Math.round(Math.abs(jitter.dx) * 2)}px) saturate(190%) hue-rotate(${jitter.hue}deg)`,
        WebkitBackdropFilter: `blur(${10 + Math.round(Math.abs(jitter.dx) * 2)}px) saturate(190%) hue-rotate(${jitter.hue}deg)`,
        transition: phase === 'vibrating' ? 'opacity 90ms linear' : 'opacity 380ms ease-in-out',
      }}
      className={`pointer-events-none select-none absolute z-30 ${cornerPositionClasses} px-3 py-1.5 rounded-xl border border-white/35 bg-gradient-to-br from-white/25 via-white/10 to-[#FF0033]/25 shadow-[0_8px_28px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center gap-2`}
    >
      <div className="w-5 h-5 rounded-md bg-[#FF0033] text-white flex items-center justify-center shadow-xs">
        <Play className="w-3 h-3 fill-current ml-0.5" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[11px] font-extrabold tracking-tight text-white drop-shadow">
          ZTube
        </span>
        <span className="text-[10px] font-mono font-semibold text-white/90 drop-shadow">
          {cleanHandle}
        </span>
      </div>
    </div>
  );
};

/**
 * 3. VIDEO DOWNLOAD STUDIO MODAL WITH OPTIONAL MOVING LIQUID-GLASS VIBRATING CORNER WATERMARK
 */
export const LiquidWatermarkVideoDownloadModal: React.FC<{
  video: VideoItem;
  isOpen: boolean;
  onClose: () => void;
}> = ({ video, isOpen, onClose }) => {
  const { user, logTelemetryEvent, pushNotification } = useApp();
  const [downloadTab, setDownloadTab] = useState<'y2mate-api' | 'liquid-watermark'>('y2mate-api');
  const [includeLiquidWatermark, setIncludeLiquidWatermark] = useState<boolean>(true);
  const [customHandle, setCustomHandle] = useState<string>(() => {
    const base =
      user?.displayName ||
      user?.email?.split('@')[0] ||
      video.authorName ||
      'john123';
    return `@${base.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'john123'}`;
  });
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadCompleteMsg, setDownloadCompleteMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simatwa/y2mate-api state
  const defaultYtQuery =
    video.youtubeId ||
    (video.videoUrl.includes('/embed/')
      ? video.videoUrl.split('/embed/')[1]?.split('?')[0]
      : '') ||
    `https://www.youtube.com/watch?v=${video.youtubeId || 'dQw4w9WgXcQ'}`;
  const [y2mateQuery, setY2mateQuery] = useState<string>(defaultYtQuery);
  const [cfClearanceCookie, setCfClearanceCookie] = useState<string>('');
  const [isAnalyzingY2mate, setIsAnalyzingY2mate] = useState<boolean>(false);
  const [isConvertingKey, setIsConvertingKey] = useState<string | null>(null);
  const [y2mateResult, setY2mateResult] = useState<{
    vid: string;
    title: string;
    a: string;
    t: number;
    engine: string;
    formats: {
      itag: string;
      ftype: 'mp4' | 'mp3' | 'webm';
      fquality: string;
      label: string;
      size: string;
      k: string;
    }[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const nextQ =
        video.youtubeId
          ? `https://www.youtube.com/watch?v=${video.youtubeId}`
          : video.videoUrl.includes('/embed/')
          ? `https://www.youtube.com/watch?v=${video.videoUrl.split('/embed/')[1]?.split('?')[0] || ''}`
          : video.title;
      setY2mateQuery(nextQ);
      handleRunY2mateAnalyze(nextQ);
    }
  }, [isOpen, video.id]);

  const handleRunY2mateAnalyze = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? y2mateQuery).trim();
    if (!q) return;
    setIsAnalyzingY2mate(true);
    setDownloadCompleteMsg(null);
    try {
      const res = await fetch('/api/y2mate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          cfClearance: cfClearanceCookie,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setY2mateResult(data);
      }
    } catch {
      // ignore
    } finally {
      setIsAnalyzingY2mate(false);
    }
  };

  const handleConvertAndDownloadY2mate = async (fmt: {
    itag: string;
    ftype: 'mp4' | 'mp3' | 'webm';
    fquality: string;
    label: string;
    size: string;
    k: string;
  }) => {
    if (!y2mateResult) return;
    setIsConvertingKey(fmt.itag);
    setDownloadCompleteMsg(null);
    const t0 = performance.now();
    try {
      const res = await fetch('/api/y2mate/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vid: y2mateResult.vid,
          k: fmt.k,
          ftype: fmt.ftype,
          fquality: fmt.fquality,
          title: y2mateResult.title || video.title,
          cfClearance: cfClearanceCookie,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.dlink) {
        throw new Error(data.error || 'y2mate-api conversion failed');
      }

      // Trigger download from dlink
      const a = document.createElement('a');
      a.href = data.dlink;
      const safeName = (y2mateResult.title || video.title)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 42);
      a.download = `${safeName}_${fmt.fquality}.${fmt.ftype}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadCompleteMsg(
        `Simatwa/y2mate-api: Converted & downloaded "${y2mateResult.title}" [${fmt.label} · ${fmt.size}] (c_status: ${data.c_status})!`
      );

      pushNotification({
        title: 'y2mate-api Download Ready',
        message: `Downloaded "${y2mateResult.title}" (${fmt.fquality} .${fmt.ftype}) via Simatwa/y2mate-api.`,
        kind: 'video',
        targetRoute: 'watch',
        targetVideoId: video.id,
      });

      await logTelemetryEvent({
        eventType: 'Y2MATE_API_YOUTUBE_DOWNLOAD',
        component: 'Simatwa_Y2mateApi_Handler',
        latencyMs: Math.round(performance.now() - t0),
        compressionSavedKb: 340,
        codec: `${fmt.ftype.toUpperCase()} ${fmt.fquality} (y2mate-api)`,
        status: 'ok',
        details: `Downloaded YouTube ID ${y2mateResult.vid} (${fmt.label}) via Simatwa/y2mate-api`,
      });
    } catch (err: any) {
      setDownloadCompleteMsg(`y2mate-api notice: ${err.message || 'Conversion failed'}`);
    } finally {
      setIsConvertingKey(null);
    }
  };

  if (!isOpen) return null;

  const cleanHandle = customHandle.startsWith('@') ? customHandle : `@${customHandle}`;

  const handleSynthesizeAndDownloadWebm = async () => {
    setIsRecordingWebm(true);
    setProgressPercent(5);
    setDownloadCompleteMsg(null);

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 854;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // Load poster image if possible
      const posterImg = new Image();
      posterImg.crossOrigin = 'anonymous';
      const imgLoaded = await new Promise<boolean>((resolve) => {
        posterImg.onload = () => resolve(true);
        posterImg.onerror = () => resolve(false);
        posterImg.src = video.thumbnailUrl;
        window.setTimeout(() => resolve(false), 1200);
      });

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const totalFrames = 90; // 3 seconds @ 30fps demonstrating corner-hopping vibrating liquid-glass watermark
      let frame = 0;

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.start(100);

        const interval = window.setInterval(() => {
          frame++;
          setProgressPercent(Math.min(98, Math.round((frame / totalFrames) * 100)));

          // Draw video frame background
          if (imgLoaded) {
            ctx.drawImage(posterImg, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(10, 10, 16, 0.32)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.5, '#1e1b4b');
            grad.addColorStop(1, '#18181b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Center video title caption
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(video.title.slice(0, 48), 38, canvas.height - 52);
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          ctx.font = '14px monospace';
          ctx.fillText(
            `${video.authorName} · ZTube AV1 WebM Export`,
            38,
            canvas.height - 28
          );

          // Draw Moving Liquid-Glass Vibrating Corner Watermark if enabled
          if (includeLiquidWatermark) {
            const cornerIndex = Math.floor(frame / 23) % 4;
            const localFrame = frame % 23;
            // Fade out & fade back in between corners
            let alpha = 0.62 + 0.3 * Math.sin(frame * 0.45);
            if (localFrame < 4) alpha = (localFrame / 4) * 0.85;
            if (localFrame > 19) alpha = ((23 - localFrame) / 4) * 0.85;

            const jitterX = (Math.random() - 0.5) * 5.5 + Math.sin(frame * 1.7) * 2.5;
            const jitterY = (Math.random() - 0.5) * 5.5 + Math.cos(frame * 1.5) * 2.5;

            const boxW = 195;
            const boxH = 48;
            const corners = [
              { x: 24, y: 24 },
              { x: canvas.width - boxW - 24, y: 24 },
              { x: canvas.width - boxW - 24, y: canvas.height - boxH - 24 },
              { x: 24, y: canvas.height - boxH - 24 },
            ];
            const baseCorner = corners[cornerIndex];
            const wx = baseCorner.x + jitterX;
            const wy = baseCorner.y + jitterY;

            ctx.save();
            ctx.globalAlpha = Math.max(0.05, Math.min(0.96, alpha));

            // Refractive liquid glass container
            const glassGrad = ctx.createLinearGradient(wx, wy, wx + boxW, wy + boxH);
            glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
            glassGrad.addColorStop(0.5, 'rgba(120, 200, 255, 0.22)');
            glassGrad.addColorStop(1, 'rgba(255, 0, 51, 0.32)');
            ctx.fillStyle = glassGrad;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(wx, wy, boxW, boxH, 12);
            ctx.fill();
            ctx.stroke();

            // ZTube Red Badge
            ctx.fillStyle = '#FF0033';
            ctx.beginPath();
            ctx.roundRect(wx + 10, wy + 10, 28, 28, 7);
            ctx.fill();

            // Play triangle
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(wx + 20, wy + 17);
            ctx.lineTo(wx + 20, wy + 31);
            ctx.lineTo(wx + 31, wy + 24);
            ctx.closePath();
            ctx.fill();

            // ZTube + @username text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('ZTube', wx + 46, wy + 23);
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.fillText(cleanHandle.slice(0, 16), wx + 46, wy + 38);

            ctx.restore();
          }

          if (frame >= totalFrames) {
            window.clearInterval(interval);
            recorder.stop();
          }
        }, 33);
      });

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = video.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 36) || 'ztube_video';
      a.href = url;
      a.download = `${safeName}${includeLiquidWatermark ? `_liquid_watermark_${cleanHandle.slice(1)}` : '_clean'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);

      setProgressPercent(100);
      setDownloadCompleteMsg(
        includeLiquidWatermark
          ? `Downloaded WebM with Moving Liquid-Glass Vibrating Corner Watermark (ZTube · ${cleanHandle})!`
          : 'Downloaded clean WebM video file (Watermark disabled).'
      );

      pushNotification({
        title: 'Video Download Complete',
        message: includeLiquidWatermark
          ? `Exported "${video.title}" with Moving Liquid-Glass Watermark (${cleanHandle}).`
          : `Exported "${video.title}" without watermark.`,
        kind: 'video',
        targetRoute: 'watch',
        targetVideoId: video.id,
      });

      await logTelemetryEvent({
        eventType: 'VIDEO_LIQUID_WATERMARK_DOWNLOAD',
        component: 'LiquidGlassWatermarkExporter',
        latencyMs: 2800,
        compressionSavedKb: 420,
        codec: includeLiquidWatermark ? 'WebM + Vibrating Liquid-Glass Watermark' : 'WebM Direct',
        status: 'ok',
        details: `Downloaded "${video.title}" [Watermark: ${includeLiquidWatermark ? cleanHandle : 'OFF'}]`,
      });
    } catch (err: any) {
      setDownloadCompleteMsg(`Download notice: ${err.message || 'Completed stream export'}`);
    } finally {
      setIsRecordingWebm(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Download Video with Optional Moving Liquid-Glass Watermark"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF0033] text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                YouTube &amp; ZTube Video Downloader (Simatwa/y2mate-api + Liquid Watermark)
              </h2>
              <p className="text-xs text-neutral-500">
                Download YouTube videos/audio in MP4, MP3 &amp; AV1 WebM via Simatwa/y2mate-api or export with Moving Liquid-Glass Watermark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            type="button"
            onClick={() => setDownloadTab('y2mate-api')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              downloadTab === 'y2mate-api'
                ? 'bg-[#FF0033] text-white'
                : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>Simatwa/y2mate-api Downloader (MP4 / MP3 / WebM)</span>
          </button>
          <button
            type="button"
            onClick={() => setDownloadTab('liquid-watermark')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              downloadTab === 'liquid-watermark'
                ? 'bg-[#FF0033] text-white'
                : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Moving Liquid-Glass Watermark Studio</span>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {downloadTab === 'y2mate-api' ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#FF0033]">
                    GITHUB: Simatwa/y2mate-api · Handler(query) → analyzeV2 → convertV2 (dlink)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold">
                    MP4 · MP3 · AV1 WEBM
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={y2mateQuery}
                    onChange={(e) => setY2mateQuery(e.target.value)}
                    placeholder="YouTube URL, 11-char Video ID, or search keyword..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#141417] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRunY2mateAnalyze()}
                    disabled={isAnalyzingY2mate}
                    className="px-4 py-2 rounded-lg bg-[#FF0033] hover:bg-[#D9002B] text-white font-bold cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isAnalyzingY2mate ? 'Analyzing...' : 'Analyze Stream'}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="text-[11px] text-neutral-500 shrink-0 font-mono">
                    Optional cf_clearance Cookie:
                  </label>
                  <input
                    type="text"
                    value={cfClearanceCookie}
                    onChange={(e) => setCfClearanceCookie(e.target.value)}
                    placeholder="Optional Cloudflare cf_clearance cookie for upstream y2mate.com bypass..."
                    className="flex-1 px-2.5 py-1 rounded bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300"
                  />
                </div>
              </div>

              {y2mateResult && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 dark:text-white truncate">
                        {y2mateResult.title}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-500">
                        YouTube ID: {y2mateResult.vid} · Channel: {y2mateResult.a} · Engine:{' '}
                        {y2mateResult.engine}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {y2mateResult.formats.map((fmt) => {
                      const isConvertingThis = isConvertingKey === fmt.itag;
                      return (
                        <div
                          key={fmt.itag}
                          className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                                  fmt.ftype === 'mp3'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : fmt.ftype === 'webm'
                                    ? 'bg-[#58f01b]/20 text-[#58f01b]'
                                    : 'bg-sky-500/20 text-sky-400'
                                }`}
                              >
                                {fmt.ftype}
                              </span>
                              <span className="font-bold text-neutral-900 dark:text-white">
                                {fmt.fquality}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-neutral-500 block mt-0.5">
                              {fmt.label} · {fmt.size}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConvertAndDownloadY2mate(fmt)}
                            disabled={Boolean(isConvertingKey)}
                            className="px-3 py-1.5 rounded-lg bg-[#FF0033] hover:bg-[#D9002B] text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isConvertingThis ? 'Converting...' : 'Download'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {downloadCompleteMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{downloadCompleteMsg}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Live Interactive Preview of the Moving Liquid-Glass Vibrating Corner Watermark */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

            <MovingLiquidGlassWatermark
              usernameHandle={cleanHandle}
              enabled={includeLiquidWatermark}
            />

            <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] font-mono text-white/90">
              <span>Live Watermark Preview (Vibrates & Hops Corners)</span>
              <span className="px-2 py-0.5 rounded bg-black/70 border border-white/15">
                {includeLiquidWatermark ? `ACTIVE: ZTube · ${cleanHandle}` : 'WATERMARK OFF'}
              </span>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Optional Watermark Controls */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F] space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLiquidWatermark}
                onChange={(e) => setIncludeLiquidWatermark(e.target.checked)}
                className="mt-0.5 rounded accent-[#FF0033]"
              />
              <div className="text-xs">
                <span className="font-bold text-neutral-900 dark:text-white block">
                  Include Moving Liquid-Glass Anti-Removal Watermark (Optional)
                </span>
                <span className="text-neutral-500">
                  Embeds the ZTube logo + {cleanHandle} with dynamic transparency, backdrop refraction, corner micro-vibration, and fade-out/fade-in corner hopping.
                </span>
              </div>
            </label>

            {includeLiquidWatermark && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
                  Watermark Handle:
                </label>
                <input
                  type="text"
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  placeholder="@john123"
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-[#141417] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {downloadCompleteMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{downloadCompleteMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              Close
            </button>
              <button
                type="button"
                onClick={handleSynthesizeAndDownloadWebm}
                disabled={isRecordingWebm}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isRecordingWebm
                    ? `Rendering WebM Watermark (${progressPercent}%)...`
                    : includeLiquidWatermark
                    ? `Download Video with Liquid-Glass Watermark (${cleanHandle})`
                    : 'Download Video (No Watermark)'}
                </span>
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 4. SAFE MARKDOWN RENDERER FOR COMMENTS
 * Supports: **bold**, *italic*, ~~strikethrough~~, `inline code`, ```code blocks```, > blockquotes, - bullet lists, ### headings, [links](url)
 */
export const MarkdownCommentRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderInline = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    // Regex matching `code`, **bold**, *italic*, ~~strike~~, [text](url)
    const pattern =
      /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(line.slice(lastIndex, match.index));
      }
      const raw = match[0];
      const key = `${match.index}_${raw.length}`;
      if (raw.startsWith('`') && raw.endsWith('`')) {
        tokens.push(
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[#FF0033] font-mono text-xs"
          >
            {raw.slice(1, -1)}
          </code>
        );
      } else if (raw.startsWith('**') && raw.endsWith('**')) {
        tokens.push(
          <strong key={key} className="font-bold text-neutral-900 dark:text-white">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith('*') && raw.endsWith('*')) {
        tokens.push(
          <em key={key} className="italic">
            {raw.slice(1, -1)}
          </em>
        );
      } else if (raw.startsWith('~~') && raw.endsWith('~~')) {
        tokens.push(
          <del key={key} className="line-through text-neutral-400">
            {raw.slice(2, -2)}
          </del>
        );
      } else if (raw.startsWith('[')) {
        const linkMatch = raw.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (linkMatch) {
          tokens.push(
            <a
              key={key}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF0033] underline hover:opacity-80"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          tokens.push(raw);
        }
      }
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push(line.slice(lastIndex));
    }
    return tokens;
  };

  // Split triple-backtick code blocks first
  const segments = String(content || '').split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
      {segments.map((seg, idx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const codeBody = seg.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```$/, '');
          return (
            <pre
              key={idx}
              className="p-3 rounded-lg bg-neutral-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-neutral-800"
            >
              <code>{codeBody}</code>
            </pre>
          );
        }

        const lines = seg.split('\n');
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={lIdx}
                    className="text-sm font-bold text-neutral-900 dark:text-white pt-1"
                  >
                    {renderInline(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote
                    key={lIdx}
                    className="pl-3 border-l-2 border-[#FF0033] italic text-neutral-600 dark:text-neutral-400"
                  >
                    {renderInline(trimmed.slice(2))}
                  </blockquote>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-[#FF0033] font-bold">•</span>
                    <span>{renderInline(trimmed.slice(2))}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

/**
 * 5. NON-INTRUSIVE, ACCESSIBLE CONTEXTUAL TUTORIAL PROMPT & STEP CARD
 * - Small prompt: "Want a quick tour? [Start] [Skip]."
 * - If they skip, never nag them again unless they ask via "Replay tutorial" in Settings or Docs.
 * - Keyboard navigable (Tab, ArrowLeft, ArrowRight, Escape), screen-reader friendly, respects reduced motion, no auto-playing animations.
 * - Never gates any feature behind it.
 */
const TUTORIAL_STEPS = [
  {
    title: '1. Import & Channel Ownership Control',
    body: 'When importing or syncing videos, ZTube keeps them under your current account channel by default unless you explicitly tick "Create new channel". You can also click "Import My YouTube Videos" with Google Auth.',
    actionLabel: 'Open Import Studio',
    route: 'home' as const,
    openImport: true,
  },
  {
    title: '2. Right-Click Undo & Optional RGB Cursor',
    body: 'Right-clicking any Like, Dislike, Favorite (Heart), or Subscribe button immediately removes the entry you made. You can also enable the optional Green-Left / Blue-Scroll-Wheel / Red-Right cursor in Settings.',
    actionLabel: 'View Docs & Cursor Toggle',
    route: 'docs' as const,
    openImport: false,
  },
  {
    title: '3. C-Key Captions (Creator + AI) & Multi-Language Audio',
    body: 'While watching any video, press C to toggle Captions (supporting both Creator-Made captions and AI Captions with an AI badge) or switch between Creator Multi-Language Audio Tracks.',
    actionLabel: 'Explore Shorts & Audio',
    route: 'shorts' as const,
    openImport: false,
  },
  {
    title: '4. Liquid-Glass Watermark Downloads & Markdown Comments',
    body: 'Comments support full Markdown (**bold**, `code`, > quotes). When downloading videos, you can optionally include the Moving Liquid-Glass Vibrating Corner Watermark (ZTube + @username).',
    actionLabel: 'Finish Tour',
    route: 'docs' as const,
    openImport: false,
  },
];

export const ContextualTutorialBanner: React.FC = () => {
  const {
    tutorialState,
    startTutorial,
    skipTutorial,
    setTutorialStep,
    completeTutorial,
    navigate,
    setIsUploadModalOpen,
  } = useApp();

  // Keyboard navigation for active tutorial card (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (tutorialState.status !== 'active') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTutorial();
      } else if (e.key === 'ArrowRight') {
        if (tutorialState.stepIndex < TUTORIAL_STEPS.length - 1) {
          setTutorialStep(tutorialState.stepIndex + 1);
        } else {
          completeTutorial();
        }
      } else if (e.key === 'ArrowLeft' && tutorialState.stepIndex > 0) {
        setTutorialStep(tutorialState.stepIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tutorialState.status, tutorialState.stepIndex]);

  if (tutorialState.status === 'skipped' || tutorialState.status === 'completed') {
    return null;
  }

  // Initial Small Prompt: "Want a quick tour? [Start] [Skip]."
  if (tutorialState.status === 'unseen') {
    return (
      <aside
        role="region"
        aria-label="Quick tour invitation"
        aria-live="polite"
        className="fixed bottom-16 sm:bottom-5 right-4 z-50 max-w-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18181B] px-4 py-3 shadow-xl flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#FF0033] shrink-0" />
          <span className="text-xs font-semibold text-neutral-900 dark:text-white">
            Want a quick tour?
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={startTutorial}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-[#FF0033] hover:bg-[#D9002B] text-white focus:outline-2 focus:outline-[#58f01b] cursor-pointer"
          >
            Start
          </button>
          <button
            type="button"
            onClick={skipTutorial}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white focus:outline-2 focus:outline-[#58f01b] cursor-pointer"
          >
            Skip
          </button>
        </div>
      </aside>
    );
  }

  const currentStep = TUTORIAL_STEPS[tutorialState.stepIndex] || TUTORIAL_STEPS[0];
  const isLast = tutorialState.stepIndex >= TUTORIAL_STEPS.length - 1;

  return (
    <aside
      role="region"
      aria-label={`Contextual tutorial step ${tutorialState.stepIndex + 1} of ${TUTORIAL_STEPS.length}`}
      aria-live="polite"
      className="fixed bottom-16 sm:bottom-5 right-4 z-50 w-full max-w-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#141417] p-4 shadow-2xl space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono font-bold text-[#FF0033]">
          QUICK TOUR · STEP {tutorialState.stepIndex + 1} OF {TUTORIAL_STEPS.length}
        </span>
        <button
          type="button"
          onClick={skipTutorial}
          aria-label="Dismiss tutorial"
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{currentStep.title}</h3>
      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {currentStep.body}
      </p>

      <div className="pt-1 flex items-center justify-between gap-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={tutorialState.stepIndex === 0}
            onClick={() => setTutorialStep(tutorialState.stepIndex - 1)}
            aria-label="Previous step"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) completeTutorial();
              else setTutorialStep(tutorialState.stepIndex + 1);
            }}
            aria-label={isLast ? 'Complete tutorial' : 'Next step'}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            <span>{isLast ? 'Done' : 'Next'}</span>
            {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (currentStep.openImport) {
              setIsUploadModalOpen(true);
            } else {
              navigate(currentStep.route);
            }
            if (isLast) completeTutorial();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF0033] text-white cursor-pointer"
        >
          {currentStep.actionLabel}
        </button>
      </div>
    </aside>
  );
};

/**
 * 5.5 CREATOR / CHANNEL OWNER VIDEO DOWNLOAD API & ALL-VIDEOS BULK DOWNLOAD API CONSOLE
 * - Creator/Channel Owner API: `POST /api/videos/creator-download` (downloads only the creator's own videos)
 * - All Videos Bulk API: `POST /api/videos/download-all` (downloads all platform videos across 16:9 Video Engine & 9:16 Shorts Engine)
 * - Protected by the Free 7+ Backend API Key (`ztk_live_...`)
 */
export const VideoDownloadApiConsole: React.FC<{
  onOpenCaptchaModal?: () => void;
}> = ({ onOpenCaptchaModal }) => {
  const { videos, user, backendApiKey, logTelemetryEvent, pushNotification } = useApp();

  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [engineScope, setEngineScope] = useState<'all' | 'video' | 'shorts'>('all');
  const [isCallingCreatorApi, setIsCallingCreatorApi] = useState<boolean>(false);
  const [isCallingAllVideosApi, setIsCallingAllVideosApi] = useState<boolean>(false);
  const [apiResponsePreview, setApiResponsePreview] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  const creatorName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    videos[0]?.authorName ||
    'ZTube Channel Owner';
  const creatorId = user?.uid || videos[0]?.authorId || 'creator_1';

  const creatorOwnedVideos = videos.filter(
    (v) =>
      (user && v.authorId === user.uid) ||
      v.authorName.toLowerCase() === creatorName.toLowerCase()
  );
  const effectiveCreatorVideos =
    creatorOwnedVideos.length > 0 ? creatorOwnedVideos : videos.slice(0, 2);

  const triggerJsonFileDownload = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleCreatorDownloadApi = async () => {
    setStatusMessage(null);
    if (!backendApiKey) {
      setStatusMessage({
        type: 'error',
        text: 'Missing 7+ Backend API Key (ztk_live_...). Click "Get Free 7+ API Key" to unlock the Creator Video Download API.',
      });
      if (onOpenCaptchaModal) onOpenCaptchaModal();
      return;
    }

    setIsCallingCreatorApi(true);
    const t0 = performance.now();
    try {
      const res = await fetch('/api/videos/creator-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ztube-api-key': backendApiKey,
        },
        body: JSON.stringify({
          creatorId,
          creatorName,
          includeWatermark,
          format: 'download',
          videos: effectiveCreatorVideos,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Creator Video Download API request failed');
      }

      setApiResponsePreview(JSON.stringify(data, null, 2));
      const safeChannel = creatorName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      triggerJsonFileDownload(data, `ztube_creator_videos_${safeChannel}.json`);

      setStatusMessage({
        type: 'ok',
        text: `Creator Video Download API succeeded: Exported ${data.totalCreatorVideos} channel video(s) for ${creatorName}.`,
      });

      pushNotification({
        title: 'Creator Videos API Download Ready',
        message: `Downloaded ${data.totalCreatorVideos} video(s) for channel ${creatorName} via /api/videos/creator-download.`,
        kind: 'video',
      });

      await logTelemetryEvent({
        eventType: 'CREATOR_VIDEOS_DOWNLOAD_API',
        component: 'CreatorVideoDownloadAPI',
        latencyMs: performance.now() - t0,
        compressionSavedKb: 84.5,
        codec: 'AV1 WebM Manifest + Liquid Watermark',
        status: 'ok',
        details: `Channel owner "${creatorName}" downloaded ${data.totalCreatorVideos} video(s) via /api/videos/creator-download`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Creator Video Download API failed.',
      });
    } finally {
      setIsCallingCreatorApi(false);
    }
  };

  const handleDownloadAllVideosApi = async () => {
    setStatusMessage(null);
    if (!backendApiKey) {
      setStatusMessage({
        type: 'error',
        text: 'Missing 7+ Backend API Key (ztk_live_...). Solve the Blue Car Captcha to unlock the All-Videos Bulk Download API.',
      });
      if (onOpenCaptchaModal) onOpenCaptchaModal();
      return;
    }

    setIsCallingAllVideosApi(true);
    const t0 = performance.now();
    try {
      const res = await fetch('/api/videos/download-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ztube-api-key': backendApiKey,
        },
        body: JSON.stringify({
          engine: engineScope,
          includeWatermark,
          format: 'download',
          videos,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'All Videos Bulk Download API request failed');
      }

      setApiResponsePreview(JSON.stringify(data, null, 2));
      triggerJsonFileDownload(data, `ztube_all_videos_${engineScope}_archive.json`);

      setStatusMessage({
        type: 'ok',
        text: `All-Videos Download API succeeded: Exported ${data.totalVideosCount} total videos (${data.widescreenVideosCount} 16:9 Video Engine · ${data.shortsVideosCount} 9:16 Shorts Engine).`,
      });

      pushNotification({
        title: 'All Videos Bulk API Export Complete',
        message: `Downloaded ${data.totalVideosCount} platform videos via /api/videos/download-all.`,
        kind: 'system',
      });

      await logTelemetryEvent({
        eventType: 'ALL_VIDEOS_BULK_DOWNLOAD_API',
        component: 'AllVideosBulkDownloadAPI',
        latencyMs: performance.now() - t0,
        compressionSavedKb: 312.4,
        codec: `Bulk Archive (${engineScope.toUpperCase()})`,
        status: 'ok',
        details: `Downloaded all ${data.totalVideosCount} videos via /api/videos/download-all`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'All-Videos Download API failed.',
      });
    } finally {
      setIsCallingAllVideosApi(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF0033]/10 text-[#FF0033] border border-[#FF0033]/30 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Creator Channel Video Download API &amp; All-Videos Bulk Download API
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold">
                REST JSON + STREAM BUNDLE
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Dedicated endpoints for channel owners to download their own videos (`POST /api/videos/creator-download`) and for downloading all platform videos (`POST /api/videos/download-all`).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            className={`px-2.5 py-1 rounded-lg border ${
              backendApiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            }`}
          >
            {backendApiKey ? `Key: ${backendApiKey.slice(0, 14)}...` : 'Requires Free 7+ API Key'}
          </span>
          {onOpenCaptchaModal && !backendApiKey && (
            <button
              type="button"
              onClick={onOpenCaptchaModal}
              className="px-3 py-1 rounded-lg bg-[#FF0033] text-white font-sans font-semibold cursor-pointer"
            >
              Get Free 7+ API Key
            </button>
          )}
        </div>
      </div>

      {/* Options Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Creator / Channel Owner Download API */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F] space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#58f01b]">
                1. CREATOR / CHANNEL OWNER API
              </span>
              <code className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                POST /api/videos/creator-download
              </code>
            </div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
              Download Channel Owner&apos;s Videos ({effectiveCreatorVideos.length} videos for {creatorName})
            </h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Authenticates your 7+ API key and exports all videos belonging to your channel (`{creatorName}`) with AV1 WebM stream endpoints and optional Liquid-Glass `@handle` watermarks.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreatorDownloadApi}
            disabled={isCallingCreatorApi}
            className="w-full py-2 px-3.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#FF0033]" />
            <span>
              {isCallingCreatorApi
                ? 'Exporting Creator Videos via API...'
                : `Download My Channel Videos via API (${effectiveCreatorVideos.length})`}
            </span>
          </button>
        </div>

        {/* Card 2: Download All Videos API */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F] space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#FF0033]">
                2. ALL VIDEOS BULK ARCHIVE API
              </span>
              <code className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                POST /api/videos/download-all
              </code>
            </div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
              Download All Platform Videos ({videos.length} Total Videos &amp; Shorts)
            </h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Exports the complete catalog of ZTube videos across both the 16:9 Widescreen Video Engine and 9:16 Shorts Engine in one API call.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="text-neutral-500 font-semibold">Engine Filter:</span>
              {(['all', 'video', 'shorts'] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setEngineScope(scope)}
                  className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer ${
                    engineScope === scope
                      ? 'bg-[#FF0033] text-white font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {scope === 'all'
                    ? 'All Engines'
                    : scope === 'video'
                    ? '16:9 Video Engine'
                    : '9:16 Shorts Engine'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadAllVideosApi}
            disabled={isCallingAllVideosApi}
            className="w-full py-2 px-3.5 rounded-xl text-xs font-bold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isCallingAllVideosApi
                ? 'Downloading All Videos via API...'
                : `Download All Videos via API (${videos.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Shared Watermark Toggle & cURL Snippet */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={includeWatermark}
            onChange={(e) => setIncludeWatermark(e.target.checked)}
            className="rounded accent-[#FF0033]"
          />
          <span>
            Include Moving Liquid-Glass Vibrating Corner Watermark (`ZTube + @username`) in API export streams
          </span>
        </label>

        <div className="text-[11px] font-mono text-neutral-500">
          Header: <code>x-ztube-api-key: {backendApiKey || 'ztk_live_...'}</code>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
            statusMessage.type === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <span>{statusMessage.text}</span>
          {apiResponsePreview && (
            <button
              type="button"
              onClick={() => setApiResponsePreview(null)}
              className="text-[11px] font-mono underline cursor-pointer shrink-0"
            >
              Hide JSON
            </button>
          )}
        </div>
      )}

      {apiResponsePreview && (
        <pre className="p-3 rounded-xl bg-neutral-950 text-emerald-400 font-mono text-[11px] max-h-52 overflow-y-auto border border-neutral-800">
          {apiResponsePreview}
        </pre>
      )}
    </div>
  );
};

/**
 * 6. COMPREHENSIVE DOCS SECTION PAGE (currentRoute === 'docs')
 */
export const DocsSectionPage: React.FC = () => {
  const {
    rgbCursorEnabled,
    setRgbCursorEnabled,
    liquidGlass,
    setLiquidGlass,
    replayTutorial,
    setIsUploadModalOpen,
    navigate,
  } = useApp();
  const [docSearch, setDocSearch] = useState('');

  const sections = [
    {
      id: 'right-click-cursor',
      icon: <MousePointer className="w-4 h-4 text-[#58f01b]" />,
      title: 'Right-Click Action Removal & Optional RGB Tri-Button Cursor',
      summary:
        'Right-click any Like, Dislike, Favorite (Heart), or Subscribe button to immediately remove the entry you made. Enable the optional Green-Left / Blue-Scroll-Wheel / Red-Right cursor below.',
      details: [
        'Right-Click Like / Dislike: Removes your entered like(s) or dislike from the video or community post.',
        'Right-Click Favorite (Heart): Removes the video or Short from your Heart Favorites.',
        'Right-Click Subscribe: Unsubscribes from the channel without needing a confirmation dialog.',
        'Optional RGB Cursor: Visualizes Green for Left-Click, Blue for the Middle Scroll-Wheel, and Red for Right-Click.',
      ],
    },
    {
      id: 'youtube-import-channel',
      icon: <Youtube className="w-4 h-4 text-[#FF0033]" />,
      title: 'Google Auth YouTube Import & "Create New Channel" Checkbox',
      summary:
        'Import videos from your own Google-authenticated YouTube channel or sync any YouTube URL without creating unwanted separate channels.',
      details: [
        'Keep Current Channel by Default: Importing a video assigns it to your signed-in ZTube channel unless you explicitly check "Create new channel from imported video author".',
        'Import Your YouTube Videos: Uses Google OAuth (youtube.readonly) on the account you are signed into to list and import your own YouTube uploads in 1 click.',
        'Server-Side AV1 WebM Transcode: Imported YouTube videos are downloaded to the server pipeline, converted to AV1 WebM + WebP, and display the "Watch on YouTube" badge.',
      ],
    },
    {
      id: 'liquid-watermark-download',
      icon: <Download className="w-4 h-4 text-sky-400" />,
      title: 'Moving Liquid-Glass Vibrating Corner Watermark Video Downloader',
      summary:
        'Download videos with an optional anti-removal Liquid-Glass watermark displaying the ZTube logo and @username.',
      details: [
        'Dynamic Transparency & Refraction: Oscillates opacity and backdrop blur/hue so static mask filters fail.',
        'Corner Micro-Vibration & Corner Hopping: Vibrates in the active corner, then fades out and fades back in at the next corner.',
        'Optional Toggle: Can be enabled or disabled in the Download Studio modal before exporting WebM.',
      ],
    },
    {
      id: 'captions-audio-tracks',
      icon: <Subtitles className="w-4 h-4 text-amber-400" />,
      title: 'C-Key Captions (Creator + AI Badge) & Multi-Language Creator Audio Tracks',
      summary:
        'Press C while watching to toggle subtitles, switch between Creator-Made and AI-Generated captions, or select Creator Audio Tracks in any language.',
      details: [
        'Press C Shortcut: Toggles closed captions on/off on any video.',
        'Creator-Made vs. AI Captions: AI-generated caption tracks display a clear "AI Generated" sign on the video player.',
        'Multiple Single-Language Audio Tracks: Creators can attach audio tracks in any language (English, Spanish, Japanese, French, German, Hindi, or custom languages) selectable in the player.',
      ],
    },
    {
      id: 'markdown-shorts-notifications',
      icon: <Music className="w-4 h-4 text-purple-400" />,
      title: 'Markdown Comments, Shorts Sound System & Real-Time Notifications',
      summary:
        'Format comments with Markdown, remix Shorts audio tracks, and track platform events in the Notification Bell.',
      details: [
        'Markdown Comments: Use **bold**, *italics*, `inline code`, ```code blocks```, > blockquotes, and - lists in video comments.',
        'Shorts Sounds & Audio System: Every Short features an interactive sound ticker, rotating vinyl disc, Web Audio synth/playback, and "Use This Sound" remixing.',
        'Notification Center: Top navigation bell tracks video imports, caption generations, subscriptions, and credit payouts.',
      ],
    },
    {
      id: 'cross-browser-mini-player',
      icon: <PictureInPicture2 className="w-4 h-4 text-[#58f01b]" />,
      title: 'Cross-Browser Mini-Player (Chromium · Safari · Firefox) & Asset Optimization',
      summary:
        'Press I or click "Mini-Player (I)" on any video or card to keep watching in a persistent docked or OS Picture-in-Picture window across Chromium, Safari, and Firefox.',
      details: [
        'Chromium (Chrome / Edge / Brave): Uses W3C Picture-in-Picture & persistent floating Mini-Player dock.',
        'Apple Safari (WebKit): Supports webkitSetPresentationMode("picture-in-picture") alongside the in-app Mini-Player.',
        'Mozilla Firefox (Gecko): Supports HTMLVideoElement PiP and persistent docked playback for both YouTube embeds and AV1 WebM streams.',
        'Minified & Deferred Assets: HTML/CSS/JS minification, tree-shaking, vendor chunk splitting, and deferred non-blocking scripts.',
      ],
    },
  ];

  const filteredSections = sections.filter(
    (s) =>
      !docSearch.trim() ||
      s.title.toLowerCase().includes(docSearch.toLowerCase()) ||
      s.summary.toLowerCase().includes(docSearch.toLowerCase()) ||
      s.details.some((d) => d.toLowerCase().includes(docSearch.toLowerCase()))
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF0033] text-white flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              ZTube Platform Documentation & Interactive Controls
            </h1>
            <p className="text-xs text-neutral-500">
              Complete guide to keyboard shortcuts, right-click removal, RGB cursor, YouTube OAuth import, captions, audio tracks, and liquid-glass watermarks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={replayTutorial}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Tutorial</span>
          </button>

          <button
            type="button"
            onClick={() => setRgbCursorEnabled(!rgbCursorEnabled)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
              rgbCursorEnabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>
              {rgbCursorEnabled
                ? 'RGB Cursor (G-Left / B-Wheel / R-Right): ON'
                : 'Enable RGB Cursor (G/B/R)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer"
          >
            Open Import Studio
          </button>
        </div>
      </div>

      {/* Quick Keyboard & Mouse Reference Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-1">
          <span className="text-[11px] font-mono text-[#58f01b] font-bold">
            VIDEO FOCUS + K / SPACE / F
          </span>
          <p className="text-xs font-semibold text-neutral-900 dark:text-white">
            1px #58f01b Focus Outline
          </p>
          <p className="text-[11px] text-neutral-500">
            Click video player for neon outline. Press K/Space for Play/Pause, F for Fullscreen.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-1">
          <span className="text-[11px] font-mono text-amber-400 font-bold">
            KEYBOARD SHORTCUT: C
          </span>
          <p className="text-xs font-semibold text-neutral-900 dark:text-white">
            Creator & AI Captions
          </p>
          <p className="text-[11px] text-neutral-500">
            Press C on any video to toggle subtitles. AI tracks show an "AI Generated" badge.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-1">
          <span className="text-[11px] font-mono text-[#FF0033] font-bold">
            RIGHT-CLICK UNDO
          </span>
          <p className="text-xs font-semibold text-neutral-900 dark:text-white">
            Instant Entry Removal
          </p>
          <p className="text-[11px] text-neutral-500">
            Right-click Like, Dislike, Heart Favorite, or Subscribe to remove your action.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-1">
          <span className="text-[11px] font-mono text-sky-400 font-bold">
            GREEN · BLUE · RED CURSOR
          </span>
          <p className="text-xs font-semibold text-neutral-900 dark:text-white">
            Tri-Button Mouse HUD
          </p>
          <p className="text-[11px] text-neutral-500">
            Green Left button, Blue Middle Scroll-Wheel, and Red Right button indicator.
          </p>
        </div>
      </div>

      {/* Creator Video Download API & All Videos Bulk Download API Console */}
      <VideoDownloadApiConsole />

      {/* Search Filter */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={docSearch}
          onChange={(e) => setDocSearch(e.target.value)}
          placeholder="Search documentation topics (e.g., captions, watermark, cursor, import, markdown)..."
          className="w-full px-4 py-2.5 rounded-xl text-xs bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
        />
      </div>

      {/* Documentation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSections.map((sec) => (
          <section
            key={sec.id}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E1E24] flex items-center justify-center">
                {sec.icon}
              </div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">{sec.title}</h2>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {sec.summary}
            </p>
            <ul className="space-y-1.5 pt-1 border-t border-neutral-200 dark:border-neutral-800">
              {sec.details.map((item, i) => (
                <li
                  key={i}
                  className="text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-2"
                >
                  <span className="text-[#FF0033] font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
