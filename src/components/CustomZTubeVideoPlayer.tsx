import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Subtitles,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Share2,
  Sparkles,
  Languages,
  Smartphone,
  Monitor,
  Music,
  Disc3,
  Keyboard,
  HelpCircle,
} from 'lucide-react';
import {
  VideoItem,
  CaptionTrack,
  CreatorAudioTrack,
  PlayerColorTheme,
  BUILTIN_SHORT_SOUNDS,
} from '../types';
import { parseDurationToSeconds, useApp } from '../context/AppContext';
import {
  MovingLiquidGlassWatermark,
  triggerCrossBrowserNativePiP,
} from './DocsTutorialCursorAndDownload';

export interface CustomVideoPlayerProps {
  video: VideoItem;
  variant?: 'watch' | 'short' | 'mini' | 'embed' | 'vr';
  engineOverride?: 'video' | 'shorts';
  onEngineChange?: (engine: 'video' | 'shorts') => void;
  autoPlay?: boolean;
  loop?: boolean;
  captionsEnabled?: boolean;
  onToggleCaptions?: () => void;
  activeCaptionTrack?: CaptionTrack;
  parsedCaptionTracks?: CaptionTrack[];
  onSelectCaptionTrack?: (trackId: string) => void;
  activeAudioTrack?: CreatorAudioTrack;
  parsedAudioTracks?: CreatorAudioTrack[];
  onSelectAudioTrack?: (track: CreatorAudioTrack) => void;
  liveLiquidWatermarkEnabled?: boolean;
  usernameHandle?: string;
  onOpenMiniPlayer?: () => void;
  onToggleTheater?: () => void;
  theaterMode?: boolean;
  onLike?: () => void;
  onRemoveLike?: () => void;
  onDislike?: () => void;
  onRemoveDislike?: () => void;
  onFavorite?: () => void;
  onRemoveFavorite?: () => void;
  isFavorited?: boolean;
  likesCount?: number;
  dislikesCount?: number;
  externalVideoRef?: React.MutableRefObject<HTMLVideoElement | null>;
  // Shorts-specific props when running in 9:16 Shorts Engine
  reelIndex?: number;
  isSubscribed?: boolean;
  isOwnChannel?: boolean;
  onToggleSubscribe?: () => void;
  onRemoveSubscribe?: () => void;
  onPreviewShortSound?: (soundId: string) => void;
  onUseShortSound?: (soundId: string) => void;
  isPlayingShortSound?: boolean;
}

function formatSecondsToClock(sec: number): string {
  const clean = Math.max(0, Math.floor(sec || 0));
  const hrs = Math.floor(clean / 3600);
  const mins = Math.floor((clean % 3600) / 60);
  const secs = clean % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const CustomZTubeVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  video,
  variant = 'watch',
  engineOverride,
  onEngineChange,
  autoPlay = false,
  loop = false,
  captionsEnabled = false,
  onToggleCaptions,
  activeCaptionTrack,
  parsedCaptionTracks = [],
  onSelectCaptionTrack,
  activeAudioTrack,
  parsedAudioTracks = [],
  onSelectAudioTrack,
  liveLiquidWatermarkEnabled = false,
  usernameHandle = 'john123',
  onOpenMiniPlayer,
  onToggleTheater,
  theaterMode = false,
  onLike,
  onRemoveLike,
  onDislike,
  onRemoveDislike,
  onFavorite,
  onRemoveFavorite,
  isFavorited = false,
  likesCount = 0,
  dislikesCount = 0,
  externalVideoRef,
  reelIndex,
  isSubscribed = false,
  isOwnChannel = false,
  onToggleSubscribe,
  onRemoveSubscribe,
  onPreviewShortSound,
  onUseShortSound,
  isPlayingShortSound = false,
}) => {
  const {
    playerColorTheme,
    setPlayerColorTheme,
    dynamicBackgroundEnabled,
    setDynamicBackgroundEnabled,
    dynamicBackgroundAudioReactive,
    setDynamicBackgroundAudioReactive,
    dynamicBackgroundAutoDisabledReason,
    dynamicBackgroundEffectiveActive,
    handleVideoPlaybackEnded,
  } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const hideUiTimerRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const [doubleTapHeartBurst, setDoubleTapHeartBurst] = useState(false);

  // Dynamic Background & Audio-Reactive Sampling State
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const posterImageRef = useRef<HTMLImageElement | null>(null);
  const audioAnalyserRef = useRef<{
    ctx: AudioContext;
    analyser: AnalyserNode;
    dataArray: Uint8Array;
  } | null>(null);
  const lastAudioShiftTimestampRef = useRef<number>(0);
  const currentTintRgbRef = useRef<{
    r1: number;
    g1: number;
    b1: number;
    r2: number;
    g2: number;
    b2: number;
  }>({ r1: 88, g1: 240, b1: 27, r2: 255, g2: 0, b2: 51 });

  const [isPlayerInViewport, setIsPlayerInViewport] = useState<boolean>(true);
  const [isTabBackgrounded, setIsTabBackgrounded] = useState<boolean>(false);
  const [dynamicBgTint, setDynamicBgTint] = useState<{
    primaryRgba: string;
    secondaryRgba: string;
    energyLevel: number;
    sampleHz: number;
  }>({
    primaryRgba: 'rgba(88, 240, 27, 0.38)',
    secondaryRgba: 'rgba(255, 0, 51, 0.30)',
    energyLevel: 0,
    sampleHz: 3,
  });

  const themePalette = {
    neon_green: {
      label: 'Neon Green',
      barBg: 'bg-[#58f01b]',
      thumbBg: 'bg-[#58f01b]',
      accentText: 'text-[#58f01b]',
      borderFocus: 'border-[#58f01b] ring-2 ring-[#58f01b]/40',
      buttonBg: 'bg-[#58f01b] text-neutral-950',
      volumeAccent: 'accent-[#58f01b]',
    },
    sunset_red: {
      label: 'Sunset Red',
      barBg: 'bg-[#FF0033]',
      thumbBg: 'bg-[#FF0033]',
      accentText: 'text-[#FF0033]',
      borderFocus: 'border-[#FF0033] ring-2 ring-[#FF0033]/40',
      buttonBg: 'bg-[#FF0033] text-white',
      volumeAccent: 'accent-[#FF0033]',
    },
    midnight_blue: {
      label: 'Midnight Blue',
      barBg: 'bg-sky-400',
      thumbBg: 'bg-sky-400',
      accentText: 'text-sky-400',
      borderFocus: 'border-sky-400 ring-2 ring-sky-400/40',
      buttonBg: 'bg-sky-500 text-white',
      volumeAccent: 'accent-sky-400',
    },
  }[playerColorTheme || 'neon_green'];

  // Determine whether to run the 16:9 Widescreen Video Engine or the 9:16 Shorts Vertical Engine
  const [internalEngine, setInternalEngine] = useState<'video' | 'shorts'>(
    variant === 'short' ? 'shorts' : 'video'
  );

  useEffect(() => {
    if (engineOverride) {
      setInternalEngine(engineOverride);
    } else if (variant === 'short') {
      setInternalEngine('shorts');
    } else {
      setInternalEngine('video');
    }
  }, [variant, engineOverride, video.id]);

  const activeEngine: 'video' | 'shorts' = engineOverride || internalEngine;

  const switchEngine = (next: 'video' | 'shorts') => {
    setInternalEngine(next);
    if (onEngineChange) onEngineChange(next);
  };

  const isYoutubeOrigin = Boolean(
    video.youtubeId ||
      video.videoUrl.includes('youtube.com/embed') ||
      video.videoUrl.includes('youtu.be')
  );

  const totalDurationSec = Math.max(15, parseDurationToSeconds(video.duration || '04:00'));

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(totalDurationSec);
  const [bufferedPercent, setBufferedPercent] = useState<number>(35);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [qualityPreset, setQualityPreset] = useState<string>('1080p60 AV1');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);
  const [showShortcutGuideOverlay, setShowShortcutGuideOverlay] = useState<boolean>(false);
  const [internalCaptionsEnabled, setInternalCaptionsEnabled] = useState<boolean>(captionsEnabled);
  const [shortcutToast, setShortcutToast] = useState<{
    keyLabel: string;
    actionLabel: string;
  } | null>(null);
  const shortcutToastTimerRef = useRef<number | null>(null);
  const [hoverTimeSec, setHoverTimeSec] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number>(0);
  const [centerPulseAction, setCenterPulseAction] = useState<'play' | 'pause' | null>(null);

  useEffect(() => {
    setInternalCaptionsEnabled(captionsEnabled);
  }, [captionsEnabled]);

  const effectiveCaptionsEnabled = onToggleCaptions ? captionsEnabled : internalCaptionsEnabled;

  const triggerShortcutToast = useCallback((keyLabel: string, actionLabel: string) => {
    setShortcutToast({ keyLabel, actionLabel });
    if (shortcutToastTimerRef.current) {
      window.clearTimeout(shortcutToastTimerRef.current);
    }
    shortcutToastTimerRef.current = window.setTimeout(() => {
      setShortcutToast(null);
    }, 1150);
  }, []);

  // Auto-Hide UI state (wakes on pointer movement, touch, or keyboard activity; auto-hides after 2.2s)
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  const scheduleAutoHide = useCallback(() => {
    if (hideUiTimerRef.current) {
      window.clearTimeout(hideUiTimerRef.current);
      hideUiTimerRef.current = null;
    }
    hideUiTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2200);
  }, []);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  useEffect(() => {
    if (isPlaying && !showSettingsPopover) {
      scheduleAutoHide();
    } else {
      setControlsVisible(true);
      if (hideUiTimerRef.current) {
        window.clearTimeout(hideUiTimerRef.current);
        hideUiTimerRef.current = null;
      }
    }
    return () => {
      if (hideUiTimerRef.current) {
        window.clearTimeout(hideUiTimerRef.current);
      }
    };
  }, [isPlaying, showSettingsPopover, scheduleAutoHide]);

  // Keep UI visible if settings popover or keyboard shortcut visual guide is open; otherwise obey controlsVisible (which auto-hides after 2.2s)
  const shouldShowUi = showSettingsPopover || showShortcutGuideOverlay || controlsVisible;

  useEffect(() => {
    const parsedDur = Math.max(15, parseDurationToSeconds(video.duration || '04:00'));
    setDurationSec(parsedDur);
    setCurrentTimeSec(0);
    setIsPlaying(autoPlay);
    setControlsVisible(true);
  }, [video.id, video.duration, autoPlay]);

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      wakeControls();
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [wakeControls]);

  // Preload video poster image for cross-origin / YouTube frame color extraction fallback
  useEffect(() => {
    if (!video.thumbnailUrl) {
      posterImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = video.thumbnailUrl;
    img.onload = () => {
      posterImageRef.current = img;
    };
    img.onerror = () => {
      posterImageRef.current = null;
    };
  }, [video.thumbnailUrl]);

  // Track whether the player is on-screen (IntersectionObserver) and whether the browser tab is backgrounded
  useEffect(() => {
    const onVisChange = () => {
      setIsTabBackgrounded(document.hidden || document.visibilityState !== 'visible');
    };
    onVisChange();
    document.addEventListener('visibilitychange', onVisChange);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            setIsPlayerInViewport(entry.isIntersecting && entry.intersectionRatio > 0.05);
          }
        },
        { threshold: [0, 0.05, 0.25] }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      if (observer) observer.disconnect();
    };
  }, []);

  // Dynamic Background Sampling Loop (3 Hz = 333ms interval, within 2–5 Hz spec)
  // Pauses automatically when video is paused, off-screen, tab is backgrounded, or auto-disabled by reduced motion/battery saver/low-end hardware.
  const isSamplingActive =
    dynamicBackgroundEffectiveActive &&
    isPlaying &&
    isPlayerInViewport &&
    !isTabBackgrounded;

  useEffect(() => {
    if (!isSamplingActive) return;

    const SAMPLE_HZ = 3; // 3 Hz (333ms interval, strictly inside 2–5 Hz)
    const INTERVAL_MS = Math.round(1000 / SAMPLE_HZ);

    const sampleDominantFrameAndAudio = () => {
      if (document.hidden) return;

      let r1 = 88;
      let g1 = 240;
      let b1 = 27;
      let r2 = 255;
      let g2 = 0;
      let b2 = 51;
      let extractedFromCanvas = false;

      if (!sampleCanvasRef.current) {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 9;
        sampleCanvasRef.current = c;
      }

      const canvas = sampleCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        try {
          if (
            !isYoutubeOrigin &&
            htmlVideoRef.current &&
            htmlVideoRef.current.readyState >= 2
          ) {
            ctx.drawImage(htmlVideoRef.current, 0, 0, 16, 9);
            const data = ctx.getImageData(0, 0, 16, 9).data;
            let sumR1 = 0,
              sumG1 = 0,
              sumB1 = 0,
              cnt1 = 0;
            let sumR2 = 0,
              sumG2 = 0,
              sumB2 = 0,
              cnt2 = 0;
            for (let i = 0; i < data.length; i += 4) {
              const pxIdx = i / 4;
              if (pxIdx < 72) {
                sumR1 += data[i];
                sumG1 += data[i + 1];
                sumB1 += data[i + 2];
                cnt1++;
              } else {
                sumR2 += data[i];
                sumG2 += data[i + 1];
                sumB2 += data[i + 2];
                cnt2++;
              }
            }
            if (cnt1 > 0 && cnt2 > 0) {
              r1 = Math.round(sumR1 / cnt1);
              g1 = Math.round(sumG1 / cnt1);
              b1 = Math.round(sumB1 / cnt1);
              r2 = Math.round(sumR2 / cnt2);
              g2 = Math.round(sumG2 / cnt2);
              b2 = Math.round(sumB2 / cnt2);
              extractedFromCanvas = true;
            }
          } else if (posterImageRef.current) {
            // Sample moving sub-window across the poster frame based on current playback timestamp
            const img = posterImageRef.current;
            const phase = (currentTimeSec * 0.25) % 1;
            const sx = Math.floor(phase * Math.max(1, img.naturalWidth * 0.4));
            const sy = Math.floor(((currentTimeSec * 0.15) % 1) * Math.max(1, img.naturalHeight * 0.4));
            const sw = Math.max(16, Math.floor(img.naturalWidth * 0.6));
            const sh = Math.max(9, Math.floor(img.naturalHeight * 0.6));
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 16, 9);
            const data = ctx.getImageData(0, 0, 16, 9).data;
            let sumR1 = 0,
              sumG1 = 0,
              sumB1 = 0,
              cnt1 = 0;
            let sumR2 = 0,
              sumG2 = 0,
              sumB2 = 0,
              cnt2 = 0;
            for (let i = 0; i < data.length; i += 4) {
              const pxIdx = i / 4;
              if (pxIdx < 72) {
                sumR1 += data[i];
                sumG1 += data[i + 1];
                sumB1 += data[i + 2];
                cnt1++;
              } else {
                sumR2 += data[i];
                sumG2 += data[i + 1];
                sumB2 += data[i + 2];
                cnt2++;
              }
            }
            if (cnt1 > 0 && cnt2 > 0) {
              r1 = Math.round(sumR1 / cnt1);
              g1 = Math.round(sumG1 / cnt1);
              b1 = Math.round(sumB1 / cnt1);
              r2 = Math.round(sumR2 / cnt2);
              g2 = Math.round(sumG2 / cnt2);
              b2 = Math.round(sumB2 / cnt2);
              extractedFromCanvas = true;
            }
          }
        } catch {
          extractedFromCanvas = false;
        }
      }

      if (!extractedFromCanvas) {
        // Deterministic frame-progression dominant color fallback when cross-origin tainting blocks getImageData
        const seed = video.id
          .split('')
          .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
        const t = currentTimeSec * 0.45 + (seed % 30);
        r1 = Math.round(115 + 85 * Math.sin(t * 0.7));
        g1 = Math.round(110 + 90 * Math.cos(t * 0.55 + 1.2));
        b1 = Math.round(145 + 85 * Math.sin(t * 0.6 + 2.4));
        r2 = Math.round(135 + 85 * Math.cos(t * 0.65 + 0.8));
        g2 = Math.round(95 + 85 * Math.sin(t * 0.5 + 2.1));
        b2 = Math.round(125 + 90 * Math.cos(t * 0.75 + 3.1));
      }

      // Optional Audio-Reactive Mode with Capped Shift Rate & Reduced-Motion Compliance
      let energy = 0;
      if (dynamicBackgroundAudioReactive && !isMuted && volume > 0) {
        let measuredAudio = false;
        if (audioAnalyserRef.current) {
          try {
            const { analyser, dataArray } = audioAnalyserRef.current;
            analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            energy = Math.min(1, sum / (dataArray.length * 190));
            measuredAudio = energy > 0.01;
          } catch {
            measuredAudio = false;
          }
        }
        if (!measuredAudio) {
          // Envelope follower based on playback cadence & volume
          const wave =
            0.5 +
            0.3 * Math.sin(currentTimeSec * 3.1) +
            0.2 * Math.cos(currentTimeSec * 1.9);
          energy = Math.max(0.08, Math.min(0.95, wave * volume));
        }

        // Capped shift rate: limit audio-reactive boost delta to max 18 RGB units per sample
        const now = performance.now();
        const elapsedSec = Math.max(0.1, (now - (lastAudioShiftTimestampRef.current || now)) / 1000);
        lastAudioShiftTimestampRef.current = now;
        const cappedBoost = Math.min(18, Math.round(energy * 32 * Math.min(1, elapsedSec * 3)));

        r1 = Math.min(255, r1 + cappedBoost);
        g1 = Math.min(255, g1 + Math.round(cappedBoost * 0.75));
        b2 = Math.min(255, b2 + cappedBoost);
      }

      // Smooth exponential moving average + capped per-sample RGB delta (max 22 units/tick) to prevent flicker
      const prev = currentTintRgbRef.current;
      const clampDelta = (currVal: number, targetVal: number, maxStep = 22) => {
        const diff = targetVal - currVal;
        if (Math.abs(diff) <= maxStep) return targetVal;
        return Math.round(currVal + Math.sign(diff) * maxStep);
      };

      const nextRgb = {
        r1: clampDelta(prev.r1, r1),
        g1: clampDelta(prev.g1, g1),
        b1: clampDelta(prev.b1, b1),
        r2: clampDelta(prev.r2, r2),
        g2: clampDelta(prev.g2, g2),
        b2: clampDelta(prev.b2, b2),
      };
      currentTintRgbRef.current = nextRgb;

      const alpha1 = dynamicBackgroundAudioReactive
        ? (0.36 + energy * 0.16).toFixed(2)
        : '0.38';
      const alpha2 = dynamicBackgroundAudioReactive
        ? (0.30 + energy * 0.14).toFixed(2)
        : '0.30';

      setDynamicBgTint({
        primaryRgba: `rgba(${nextRgb.r1}, ${nextRgb.g1}, ${nextRgb.b1}, ${alpha1})`,
        secondaryRgba: `rgba(${nextRgb.r2}, ${nextRgb.g2}, ${nextRgb.b2}, ${alpha2})`,
        energyLevel: Number(energy.toFixed(2)),
        sampleHz: SAMPLE_HZ,
      });
    };

    sampleDominantFrameAndAudio();
    const timer = window.setInterval(sampleDominantFrameAndAudio, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [
    isSamplingActive,
    isYoutubeOrigin,
    video.id,
    currentTimeSec,
    dynamicBackgroundAudioReactive,
    isMuted,
    volume,
  ]);

  const sendYoutubeCommand = (func: string, args: unknown[] = []) => {
    if (ytIframeRef.current?.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    }
  };

  useEffect(() => {
    if (!isPlaying || !isYoutubeOrigin) return;
    const interval = window.setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = prev + 0.25 * playbackSpeed;
        if (next >= durationSec) {
          if (loop || activeEngine === 'shorts') {
            sendYoutubeCommand('seekTo', [0, true]);
            return 0;
          }
          setIsPlaying(false);
          if (variant === 'watch' || variant === 'mini') {
            window.setTimeout(() => handleVideoPlaybackEnded(video.id), 0);
          }
          return durationSec;
        }
        return next;
      });
      setBufferedPercent((prev) => Math.min(100, prev + 0.5));
    }, 250);
    return () => window.clearInterval(interval);
  }, [
    isPlaying,
    isYoutubeOrigin,
    durationSec,
    playbackSpeed,
    loop,
    activeEngine,
    variant,
    video.id,
    handleVideoPlaybackEnded,
  ]);

  const triggerCenterPulse = (action: 'play' | 'pause') => {
    setCenterPulseAction(action);
    window.setTimeout(() => {
      setCenterPulseAction(null);
    }, 380);
  };

  const togglePlayPause = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    triggerCenterPulse(next ? 'play' : 'pause');
    wakeControls();

    if (isYoutubeOrigin) {
      sendYoutubeCommand(next ? 'playVideo' : 'pauseVideo');
    } else if (htmlVideoRef.current) {
      if (next) {
        htmlVideoRef.current.play().catch(() => {});
      } else {
        htmlVideoRef.current.pause();
      }
    }
  };

  const seekToSeconds = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(durationSec, targetSec));
    setCurrentTimeSec(clamped);
    wakeControls();
    if (isYoutubeOrigin) {
      sendYoutubeCommand('seekTo', [Math.floor(clamped), true]);
    } else if (htmlVideoRef.current) {
      htmlVideoRef.current.currentTime = clamped;
    }
  };

  const skipRelative = (deltaSec: number) => {
    seekToSeconds(currentTimeSec + deltaSec);
  };

  const handleVolumeChange = (nextVol: number) => {
    const clamped = Math.max(0, Math.min(1, nextVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    wakeControls();
    if (isYoutubeOrigin) {
      sendYoutubeCommand('unMute');
      sendYoutubeCommand('setVolume', [Math.round(clamped * 100)]);
    } else if (htmlVideoRef.current) {
      htmlVideoRef.current.muted = clamped === 0;
      htmlVideoRef.current.volume = clamped;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    wakeControls();
    if (isYoutubeOrigin) {
      sendYoutubeCommand(nextMuted ? 'mute' : 'unMute');
    } else if (htmlVideoRef.current) {
      htmlVideoRef.current.muted = nextMuted;
    }
  };

  const handleChangeSpeed = (spd: number) => {
    setPlaybackSpeed(spd);
    wakeControls();
    if (isYoutubeOrigin) {
      sendYoutubeCommand('setPlaybackRate', [spd]);
    } else if (htmlVideoRef.current) {
      htmlVideoRef.current.playbackRate = spd;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    wakeControls();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleToggleCaptionsUnified = () => {
    wakeControls();
    if (onToggleCaptions) {
      onToggleCaptions();
    } else {
      setInternalCaptionsEnabled((prev) => !prev);
    }
  };

  const executeKeyboardShortcut = (e: KeyboardEvent | React.KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      target?.isContentEditable
    ) {
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key;
    if (key === 'j' || key === 'J' || key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      skipRelative(-10);
      triggerShortcutToast('J', 'Rewind -10s');
    } else if (key === 'k' || key === 'K' || key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
      triggerShortcutToast('K', !isPlaying ? 'Play Video' : 'Pause Video');
    } else if (key === 'l' || key === 'L' || key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      skipRelative(10);
      triggerShortcutToast('L', 'Forward +10s');
    } else if (key === 'm' || key === 'M') {
      e.preventDefault();
      e.stopPropagation();
      const willMute = !isMuted;
      toggleMute();
      triggerShortcutToast('M', willMute ? 'Muted Audio' : 'Unmuted Audio');
    } else if (key === 'f' || key === 'F') {
      e.preventDefault();
      e.stopPropagation();
      const willFs = !isFullscreen;
      toggleFullscreen();
      triggerShortcutToast('F', willFs ? 'Entered Fullscreen' : 'Exited Fullscreen');
    } else if (key === 'c' || key === 'C') {
      e.preventDefault();
      e.stopPropagation();
      const nextCc = !effectiveCaptionsEnabled;
      handleToggleCaptionsUnified();
      triggerShortcutToast('C', nextCc ? 'Captions ON' : 'Captions OFF');
    } else if (key === 'i' || key === 'I') {
      if (onOpenMiniPlayer) {
        e.preventDefault();
        e.stopPropagation();
        onOpenMiniPlayer();
        triggerShortcutToast('I', 'Mini-Player');
      }
    } else if (key === '?') {
      e.preventDefault();
      e.stopPropagation();
      setShowShortcutGuideOverlay((prev) => !prev);
      wakeControls();
    } else if (key === 'Escape' && showShortcutGuideOverlay) {
      e.preventDefault();
      e.stopPropagation();
      setShowShortcutGuideOverlay(false);
    }
  };

  // Global Keyboard Shortcut Manager (active across the page whenever this player is in the active view)
  const shortcutHandlerRef = useRef(executeKeyboardShortcut);
  shortcutHandlerRef.current = executeKeyboardShortcut;

  useEffect(() => {
    if (variant === 'mini') return;
    const onGlobalKeyDown = (ev: KeyboardEvent) => {
      if (!isPlayerInViewport && !isFullscreen) return;
      shortcutHandlerRef.current(ev);
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [variant, isPlayerInViewport, isFullscreen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    wakeControls();
    // Handled by the global keyboard shortcut manager on window (or directly if stopPropagation was used)
    if (variant === 'mini') {
      executeKeyboardShortcut(e);
    }
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    wakeControls();
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPercent(pct * 100);
    setHoverTimeSec(pct * durationSec);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekToSeconds(pct * durationSec);
  };

  const progressPercent =
    durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0;

  const defaultFallbackCue = {
    startSec: 0,
    endSec: 99999,
    text: `${video.title} — ${video.authorName} [Auto-Synchronized Captions Active · Press C to toggle]`,
  };

  const activeCue = effectiveCaptionsEnabled
    ? activeCaptionTrack
      ? activeCaptionTrack.cues.find(
          (c) =>
            (Math.floor(currentTimeSec) % 36) >= c.startSec &&
            (Math.floor(currentTimeSec) % 36) <= c.endSec
        ) ||
        activeCaptionTrack.cues[0] ||
        defaultFallbackCue
      : defaultFallbackCue
    : null;

  const renderKeyboardShortcutVisualGuide = () => {
    const shortcuts = [
      {
        key: 'J',
        label: 'Rewind 10s',
        desc: 'Jump backward 10 seconds in the timeline',
        onTrigger: () => {
          skipRelative(-10);
          triggerShortcutToast('J', 'Rewind -10s');
        },
      },
      {
        key: 'K',
        label: isPlaying ? 'Pause Video' : 'Play Video',
        desc: 'Toggle Play / Pause playback (or Spacebar)',
        onTrigger: () => {
          togglePlayPause();
          triggerShortcutToast('K', !isPlaying ? 'Play Video' : 'Pause Video');
        },
      },
      {
        key: 'L',
        label: 'Forward 10s',
        desc: 'Jump forward 10 seconds in the timeline',
        onTrigger: () => {
          skipRelative(10);
          triggerShortcutToast('L', 'Forward +10s');
        },
      },
      {
        key: 'M',
        label: isMuted ? 'Unmute Audio' : 'Mute Audio',
        desc: `Toggle player audio mute (${isMuted ? 'Currently Muted' : 'Audio Active'})`,
        onTrigger: () => {
          const willMute = !isMuted;
          toggleMute();
          triggerShortcutToast('M', willMute ? 'Muted Audio' : 'Unmuted Audio');
        },
      },
      {
        key: 'F',
        label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
        desc: 'Toggle immersive fullscreen viewport mode',
        onTrigger: () => {
          const willFs = !isFullscreen;
          toggleFullscreen();
          triggerShortcutToast('F', willFs ? 'Entered Fullscreen' : 'Exited Fullscreen');
        },
      },
      {
        key: 'C',
        label: effectiveCaptionsEnabled ? 'Captions: ON' : 'Captions: OFF',
        desc: 'Toggle creator or AI-generated closed captions',
        onTrigger: () => {
          const nextCc = !effectiveCaptionsEnabled;
          handleToggleCaptionsUnified();
          triggerShortcutToast('C', nextCc ? 'Captions ON' : 'Captions OFF');
        },
      },
    ];

    return (
      <>
        {/* Live Key-Press HUD Feedback Pill */}
        {shortcutToast && (
          <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-xl bg-black/90 border border-[#58f01b]/70 backdrop-blur-md shadow-2xl flex items-center gap-2 text-white">
            <kbd className="px-2 py-0.5 rounded bg-[#58f01b] text-neutral-950 font-mono text-xs font-extrabold">
              {shortcutToast.keyLabel}
            </kbd>
            <span className="text-xs font-mono font-semibold">{shortcutToast.actionLabel}</span>
          </div>
        )}

        {/* Interactive Overlay Visual Guide for Global Keyboard Shortcuts */}
        {showShortcutGuideOverlay && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Global Video Player Keyboard Shortcuts Visual Guide"
            onClick={(e) => {
              e.stopPropagation();
              setShowShortcutGuideOverlay(false);
            }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-white/20 bg-neutral-950/95 p-4 sm:p-5 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${themePalette.buttonBg} flex items-center justify-center`}>
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Global Player Keyboard Shortcuts Guide
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Press any key globally while watching (or click a shortcut card below to test)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShortcutGuideOverlay(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#FF0033] text-xs font-mono font-semibold text-white cursor-pointer"
                >
                  Close (Esc)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {shortcuts.map((sc) => (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={sc.onTrigger}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#58f01b]/60 text-left flex items-center gap-3 transition-colors cursor-pointer group/sc"
                  >
                    <kbd
                      className={`w-9 h-9 rounded-lg font-mono text-sm font-extrabold flex items-center justify-center shrink-0 border border-white/25 bg-neutral-900 group-hover/sc:bg-[#58f01b] group-hover/sc:text-neutral-950 transition-colors ${themePalette.accentText}`}
                    >
                      {sc.key}
                    </kbd>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{sc.label}</div>
                      <div className="text-[10px] text-neutral-400 leading-tight line-clamp-2">
                        {sc.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-neutral-400">
                <span>NAVIGATION: J (-10s) · K (Play/Pause) · L (+10s)</span>
                <span>CONTROLS: M (Mute) · F (Fullscreen) · C (Captions) · ? (Guide)</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const chromelessYoutubeSrc = (() => {
    const ytId =
      video.youtubeId ||
      video.videoUrl.split('/embed/')[1]?.split('?')[0] ||
      '';
    const params = new URLSearchParams({
      enablejsapi: '1',
      controls: '0',
      modestbranding: '1',
      rel: '0',
      iv_load_policy: '3',
      playsinline: '1',
      disablekb: '1',
      ...(autoPlay ? { autoplay: '1' } : {}),
      ...((loop || activeEngine === 'shorts') && ytId ? { loop: '1', playlist: ytId } : {}),
    });
    return `https://www.youtube.com/embed/${ytId}?${params.toString()}`;
  })();

  // Shared Settings Popover (Speed, AV1 Quality, Captions, Audio Tracks)
  const renderSettingsPopover = () => {
    if (!showSettingsPopover) return null;
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-14 right-3 z-40 w-72 rounded-2xl bg-neutral-950/95 border border-white/20 backdrop-blur-xl p-3.5 text-white text-xs space-y-3 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="font-mono text-[11px] font-bold text-[#58f01b]">
            {activeEngine === 'shorts'
              ? '9:16 SHORTS ENGINE SETTINGS'
              : '16:9 VIDEO ENGINE SETTINGS'}
          </span>
          <button
            type="button"
            onClick={() => setShowSettingsPopover(false)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Engine Mode Switcher inside Settings */}
        {variant !== 'mini' && variant !== 'embed' && (
          <div className="space-y-1">
            <span className="text-[11px] text-neutral-400 block">Player Engine Architecture</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => switchEngine('video')}
                className={`py-1.5 px-2 rounded-lg font-mono text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                  activeEngine === 'video'
                    ? 'bg-[#FF0033] text-white font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>16:9 Video Engine</span>
              </button>
              <button
                type="button"
                onClick={() => switchEngine('shorts')}
                className={`py-1.5 px-2 rounded-lg font-mono text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                  activeEngine === 'shorts'
                    ? 'bg-[#FF0033] text-white font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>9:16 Shorts Engine</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Site Player Color Theme Switcher */}
        <div className="space-y-1">
          <span className="text-[11px] text-neutral-400 block">
            Global Player Color Theme ({themePalette.label})
          </span>
          <div className="grid grid-cols-3 gap-1">
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
                className={`py-1.5 px-1.5 rounded-lg font-mono text-[10px] flex items-center justify-center gap-1 cursor-pointer border ${
                  playerColorTheme === th.id
                    ? 'bg-white/20 text-white font-bold border-white/50'
                    : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/15'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${th.dot}`} />
                <span className="truncate">{th.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Dynamic Background (2-5 Hz Frame Sampling + 500ms+ Smooth Transition) & Opt-In Audio-Reactive Mode */}
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-300 font-semibold">
              Dynamic Background (3 Hz · 700ms)
            </span>
            <button
              type="button"
              disabled={Boolean(dynamicBackgroundAutoDisabledReason)}
              onClick={() => setDynamicBackgroundEnabled(!dynamicBackgroundEnabled)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer disabled:opacity-40 ${
                dynamicBackgroundEffectiveActive
                  ? 'bg-[#58f01b] text-neutral-950'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20'
              }`}
            >
              {dynamicBackgroundAutoDisabledReason
                ? 'AUTO-DISABLED'
                : dynamicBackgroundEnabled
                ? 'ON'
                : 'OFF (Default)'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400">
              Opt-In Audio-Reactive Energy Tint
            </span>
            <button
              type="button"
              disabled={!dynamicBackgroundEffectiveActive}
              onClick={() =>
                setDynamicBackgroundAudioReactive(!dynamicBackgroundAudioReactive)
              }
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer disabled:opacity-40 ${
                dynamicBackgroundEffectiveActive && dynamicBackgroundAudioReactive
                  ? 'bg-[#FF0033] text-white'
                  : 'bg-white/10 text-neutral-400 hover:bg-white/20'
              }`}
            >
              {dynamicBackgroundEffectiveActive && dynamicBackgroundAudioReactive
                ? 'AUDIO ON'
                : 'OFF'}
            </button>
          </div>

          {dynamicBackgroundAutoDisabledReason && (
            <p className="text-[9px] font-mono text-amber-400 leading-tight">
              {dynamicBackgroundAutoDisabledReason}
            </p>
          )}
        </div>

        {/* Playback Speed */}
        <div className="space-y-1">
          <span className="text-[11px] text-neutral-400 block">Playback Speed</span>
          <div className="grid grid-cols-5 gap-1">
            {[0.5, 1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => handleChangeSpeed(spd)}
                className={`py-1 rounded font-mono text-[11px] cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-[#FF0033] text-white font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* AV1 WebM Quality Ladder */}
        <div className="space-y-1">
          <span className="text-[11px] text-neutral-400 block">AV1 WebM Transcode Ladder</span>
          <div className="grid grid-cols-3 gap-1">
            {['4K AV1 HDR', '1080p60 AV1', '720p WebM'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQualityPreset(q)}
                className={`py-1 px-1.5 rounded font-mono text-[10px] cursor-pointer ${
                  qualityPreset === q
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Captions Track Selector */}
        {parsedCaptionTracks.length > 0 && onSelectCaptionTrack && (
          <div className="space-y-1">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Subtitles className="w-3 h-3 text-amber-400" />
              <span>Captions Track (Shortcut: C)</span>
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {parsedCaptionTracks.map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => onSelectCaptionTrack(tr.id)}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between cursor-pointer ${
                    captionsEnabled && activeCaptionTrack?.id === tr.id
                      ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{tr.label}</span>
                  {tr.isAiGenerated && (
                    <span className="px-1 rounded bg-amber-400 text-neutral-950 font-mono text-[9px] font-bold">
                      AI
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Creator Multi-Language Audio Track Selector */}
        {parsedAudioTracks.length > 0 && onSelectAudioTrack && (
          <div className="space-y-1">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Languages className="w-3 h-3 text-sky-400" />
              <span>Creator Single-Language Audio Track</span>
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {parsedAudioTracks.map((at) => (
                <button
                  key={at.id}
                  type="button"
                  onClick={() => onSelectAudioTrack(at)}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] cursor-pointer truncate ${
                    activeAudioTrack?.id === at.id
                      ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  🔊 {at.languageLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Shared Fullscreen Action Dock (like.dislike.favorite.share.settings.shrink) — Auto-Hides with UI
  const renderFullscreenHud = () => {
    if (!isFullscreen) return null;
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-20 inset-x-0 flex flex-col items-center justify-center px-4 z-30 transition-all duration-300 ${
          shouldShowUi
            ? 'opacity-100 translate-y-0 pointer-events-none'
            : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <div
          className={`inline-flex flex-wrap items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-black/85 border border-[#58f01b]/60 backdrop-blur-xl shadow-2xl text-white text-xs ${
            shouldShowUi ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={onLike}
            onContextMenu={(e) => {
              e.preventDefault();
              if (onRemoveLike) onRemoveLike();
            }}
            title="Left-click Like · Right-click remove Like"
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-[#FF0033]" />
            <span>Like ({likesCount})</span>
          </button>

          <button
            type="button"
            onClick={onDislike}
            onContextMenu={(e) => {
              e.preventDefault();
              if (onRemoveDislike) onRemoveDislike();
            }}
            title="Left-click Dislike · Right-click remove Dislike"
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Dislike ({dislikesCount})</span>
          </button>

          <button
            type="button"
            onClick={onFavorite}
            onContextMenu={(e) => {
              e.preventDefault();
              if (onRemoveFavorite) onRemoveFavorite();
            }}
            title="Left-click Favorite · Right-click remove Favorite"
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              isFavorited ? 'bg-[#FF0033] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
            <span>Favorite</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/?watch=${encodeURIComponent(video.id)}`
              );
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsPopover((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#58f01b]" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg bg-[#FF0033] hover:bg-[#D9002B] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Shrink</span>
          </button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // ENGINE 2: CUSTOM 9:16 SHORTS VERTICAL VIDEO ENGINE (NEVER OVERSIZED + AUTO-HIDING UI)
  // ============================================================================
  if (activeEngine === 'shorts') {
    const shortSoundId = video.shortSoundId || BUILTIN_SHORT_SOUNDS[0].id;
    const shortSoundTitle = video.shortSoundTitle || BUILTIN_SHORT_SOUNDS[0].title;
    const shortSoundArtist = video.shortSoundArtist || video.authorName;

    return (
      <div className="relative mx-auto w-[306px] sm:w-[342px] shrink-0">
        {/* Surrounding Dynamic Background Ambient Layer (Sampled at 3 Hz with smooth 700ms >= 500ms transitions) */}
        {dynamicBackgroundEffectiveActive && (
          <div
            aria-hidden="true"
            style={{
              background: `radial-gradient(circle at 30% 25%, ${dynamicBgTint.primaryRgba}, ${dynamicBgTint.secondaryRgba} 65%, transparent 100%)`,
              transition: 'background 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease, transform 700ms ease',
              transform: dynamicBackgroundAudioReactive
                ? `scale(${(1.03 + dynamicBgTint.energyLevel * 0.05).toFixed(3)})`
                : 'scale(1.03)',
            }}
            className="pointer-events-none absolute -inset-6 rounded-[2rem] blur-2xl opacity-90 z-0"
          />
        )}
        <div
          ref={containerRef}
          tabIndex={0}
          onFocus={() => {
            setIsFocused(true);
            wakeControls();
          }}
          onBlur={() => setIsFocused(false)}
          onMouseMove={wakeControls}
          onMouseDown={wakeControls}
          onTouchStart={wakeControls}
          onMouseLeave={() => {
            if (!showSettingsPopover) setControlsVisible(false);
          }}
          onKeyDown={handleKeyDown}
          aria-label={`ZTube 9:16 Shorts Video Engine: ${video.title}. Press K or Space to Play/Pause.`}
          className={`video-focus-neon group relative z-10 w-[306px] sm:w-[342px] h-[544px] sm:h-[608px] aspect-[9/16] mx-auto rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-2xl select-none shrink-0 ${
            isFocused ? 'video-focus-neon-active' : ''
          } ${!shouldShowUi && isPlaying ? 'cursor-none' : 'cursor-pointer'}`}
        >
        {/* Strictly Locked 9:16 Absolute Media Layer (Never expands parent height!) — Tap to Pause, Double-Tap to Like */}
        <div
          onClick={() => {
            containerRef.current?.focus();
            const now = Date.now();
            if (now - lastTapTimeRef.current < 280) {
              // Double-tap Like!
              if (onLike) onLike();
              setDoubleTapHeartBurst(true);
              window.setTimeout(() => setDoubleTapHeartBurst(false), 750);
            } else {
              togglePlayPause();
            }
            lastTapTimeRef.current = now;
          }}
          className="absolute inset-0 w-full h-full bg-black overflow-hidden"
        >
          {isYoutubeOrigin ? (
            <iframe
              ref={ytIframeRef}
              src={chromelessYoutubeSrc}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.02]"
            />
          ) : (
            <video
              ref={(el) => {
                htmlVideoRef.current = el;
                if (externalVideoRef) externalVideoRef.current = el;
              }}
              key={video.videoUrl}
              src={video.videoUrl}
              poster={video.thumbnailUrl}
              autoPlay={autoPlay}
              loop={true}
              playsInline
              onTimeUpdate={(e) => {
                setCurrentTimeSec(e.currentTarget.currentTime);
                if (e.currentTarget.buffered.length > 0 && e.currentTarget.duration > 0) {
                  const end = e.currentTarget.buffered.end(e.currentTarget.buffered.length - 1);
                  setBufferedPercent(Math.min(100, (end / e.currentTarget.duration) * 100));
                }
              }}
              onLoadedMetadata={(e) => {
                if (e.currentTarget.duration && isFinite(e.currentTarget.duration)) {
                  setDurationSec(e.currentTarget.duration);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="absolute inset-0 w-full h-full object-cover bg-black pointer-events-none"
            />
          )}

          {/* Poster Overlay before initial play */}
          {!isPlaying && currentTimeSec === 0 && video.thumbnailUrl && (
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/65" />
              <div
                className={`relative z-10 w-14 h-14 rounded-full bg-[#FF0033]/95 text-white flex items-center justify-center shadow-[0_0_32px_rgba(255,0,51,0.75)] border border-white/30 transition-all duration-300 ${
                  shouldShowUi ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Center Play / Pause Animated Pulse */}
          {centerPulseAction && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
              <div className={`w-14 h-14 rounded-full bg-black/75 border ${themePalette.borderFocus} ${themePalette.accentText} flex items-center justify-center animate-ping`}>
                {centerPulseAction === 'play' ? (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                ) : (
                  <Pause className="w-6 h-6 fill-current" />
                )}
              </div>
            </div>
          )}

          {/* Double-Tap Like Heart Burst Animation */}
          {doubleTapHeartBurst && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
              <div className="w-20 h-20 rounded-full bg-[#FF0033]/30 backdrop-blur-sm flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(255,0,51,0.85)]">
                <Heart className="w-11 h-11 text-[#FF0033] fill-current" />
              </div>
            </div>
          )}

          {/* Optional Moving Liquid-Glass Watermark */}
          <MovingLiquidGlassWatermark
            usernameHandle={usernameHandle}
            enabled={liveLiquidWatermarkEnabled}
          />

          {/* Closed Captions inside 9:16 Shorts Engine */}
          {effectiveCaptionsEnabled && activeCue && (
            <div className="pointer-events-none absolute bottom-36 inset-x-3 flex flex-col items-center justify-center z-20">
              <div className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-center shadow-xl">
                <p className="text-xs font-semibold text-white leading-snug">{activeCue.text}</p>
              </div>
            </div>
          )}
        </div>

        {renderKeyboardShortcutVisualGuide()}

        {/* SHORTS ENGINE TOP BAR (Auto-Hides smoothly after 2.2s of inactivity) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between gap-1.5 z-20 transition-all duration-300 ${
            shouldShowUi
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-3 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlayPause}
              title="Play / Pause Short (K or Space)"
              className="p-1.5 rounded-full bg-black/60 hover:bg-[#FF0033] text-white border border-white/15 backdrop-blur-md cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              title="Mute / Unmute Short (M)"
              className="p-1.5 rounded-full bg-black/60 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-[#FF0033]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border backdrop-blur-md ${
                isFocused
                  ? 'bg-[#58f01b]/20 text-[#58f01b] border-[#58f01b]'
                  : 'bg-black/60 text-white border-white/15'
              }`}
            >
              {typeof reelIndex === 'number' ? `SHORTS #${reelIndex + 1}` : 'SHORTS ENGINE 9:16'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {variant === 'watch' && (
              <button
                type="button"
                onClick={() => switchEngine('video')}
                title="Switch to 16:9 Widescreen Video Engine"
                className="px-2 py-1 rounded-full bg-black/70 hover:bg-[#FF0033] text-white border border-white/20 text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Monitor className="w-2.5 h-2.5" />
                <span>16:9 Video</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleCaptionsUnified}
              title="Toggle Captions (Shortcut: C)"
              className={`p-1.5 rounded-full border cursor-pointer ${
                effectiveCaptionsEnabled
                  ? 'bg-amber-500 text-neutral-950 border-amber-400'
                  : 'bg-black/60 text-white border-white/15'
              }`}
            >
              <Subtitles className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setShowShortcutGuideOverlay((prev) => !prev)}
              title="Keyboard Shortcuts Visual Guide (J, K, L, M, F, C or ?)"
              aria-label="Keyboard Shortcuts Guide"
              className={`p-1.5 rounded-full border cursor-pointer ${
                showShortcutGuideOverlay
                  ? 'bg-[#58f01b] text-neutral-950 border-[#58f01b]'
                  : 'bg-black/60 hover:bg-white/20 text-white border-white/15'
              }`}
            >
              <Keyboard className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsPopover((prev) => !prev)}
              title="Shorts Engine Settings"
              className="p-1.5 rounded-full bg-black/60 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Fullscreen Short (F)"
              className="p-1.5 rounded-full bg-black/60 hover:bg-[#FF0033] text-white border border-white/15 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {renderFullscreenHud()}
        {renderSettingsPopover()}

        {/* SHORTS ENGINE BOTTOM CREATOR, FOLLOW & SOUND TICKER OVERLAY (Auto-Hides smoothly) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-2.5 inset-x-0 px-3.5 pt-8 pb-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-white space-y-2 z-20 transition-all duration-300 ${
            shouldShowUi
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {video.authorAvatar ? (
                <img
                  src={video.authorAvatar}
                  alt={`${video.authorName} avatar`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#FF0033] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-white/20">
                  {video.authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">
                  @{video.authorName.replace(/\s+/g, '').toLowerCase()}
                </p>
                <p className="text-[10px] text-neutral-300 font-mono tabular-nums">
                  {video.views.toLocaleString()} views · {formatSecondsToClock(currentTimeSec)} /{' '}
                  {formatSecondsToClock(durationSec)}
                </p>
              </div>
            </div>

            {!isOwnChannel && onToggleSubscribe && (
              <button
                type="button"
                onClick={onToggleSubscribe}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (onRemoveSubscribe) onRemoveSubscribe();
                }}
                title="Left-click Follow · Right-click remove Follow"
                className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 cursor-pointer ${
                  isSubscribed ? 'bg-white/20 text-white' : 'bg-[#FF0033] text-white'
                }`}
              >
                {isSubscribed ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <p className="text-xs font-semibold line-clamp-2 leading-snug">{video.title}</p>

          {/* Interactive Shorts Sound Bar */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (onPreviewShortSound) onPreviewShortSound(shortSoundId);
              }}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-mono text-white flex items-center gap-1.5 truncate max-w-[195px] cursor-pointer"
              title="Preview Short Sound Track"
            >
              <Music className="w-3 h-3 text-[#58f01b] shrink-0" />
              <span className="truncate">
                {shortSoundTitle} · {shortSoundArtist}
              </span>
            </button>

            {onUseShortSound && (
              <button
                type="button"
                onClick={() => onUseShortSound(shortSoundId)}
                className="px-2.5 py-1 rounded-full bg-[#FF0033] hover:bg-[#D9002B] text-white text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                title="Create a Short with this Sound"
              >
                <Disc3 className={`w-3 h-3 ${isPlayingShortSound ? 'animate-spin' : ''}`} />
                <span>Use Sound</span>
              </button>
            )}
          </div>
        </div>

        {/* SHORTS ENGINE BOTTOM-EDGE SCRUBBER BAR (Auto-Hides with UI) */}
        <div
          ref={scrubberRef}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setHoverTimeSec(null)}
          onClick={handleScrubberClick}
          className={`absolute bottom-0 inset-x-0 h-2.5 bg-white/20 cursor-pointer z-30 flex items-center group/scrub transition-opacity duration-300 ${
            shouldShowUi ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {hoverTimeSec !== null && (
            <div
              style={{ left: `${Math.max(10, Math.min(90, hoverPercent))}%` }}
              className="pointer-events-none absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] font-mono text-white whitespace-nowrap"
            >
              {formatSecondsToClock(hoverTimeSec)}
            </div>
          )}
          <div
            style={{ width: `${bufferedPercent}%` }}
            className="h-full bg-white/30 transition-all"
          />
          <div
            style={{ width: `${progressPercent}%` }}
            className={`absolute left-0 top-0 h-full ${themePalette.barBg} transition-all`}
          />
          <div
            style={{ left: `${progressPercent}%` }}
            className={`absolute -translate-x-1/2 w-3 h-3 rounded-full ${themePalette.thumbBg} shadow opacity-0 group-hover/scrub:opacity-100 transition-opacity`}
          />
        </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ENGINE 1: CUSTOM 16:9 WIDESCREEN VIDEO ENGINE (AUTO-HIDING UI + DYNAMIC BACKGROUND)
  // ============================================================================
  return (
    <div className="relative w-full">
      {/* Surrounding Dynamic Background Ambient Tint (Sampled at 3 Hz [2–5 Hz] with smooth 700ms [500ms+] transitions) */}
      {dynamicBackgroundEffectiveActive && variant !== 'mini' && (
        <div
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse at 35% 30%, ${dynamicBgTint.primaryRgba}, ${dynamicBgTint.secondaryRgba} 62%, transparent 98%)`,
            transition:
              'background 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease, transform 700ms ease',
            transform: dynamicBackgroundAudioReactive
              ? `scale(${(1.02 + dynamicBgTint.energyLevel * 0.045).toFixed(3)})`
              : 'scale(1.02)',
          }}
          className="pointer-events-none absolute -inset-5 sm:-inset-8 rounded-3xl blur-2xl opacity-95 z-0"
        />
      )}

      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => {
          setIsFocused(true);
          wakeControls();
        }}
        onBlur={() => setIsFocused(false)}
        onMouseMove={wakeControls}
        onMouseDown={wakeControls}
        onTouchStart={wakeControls}
        onMouseLeave={() => {
          if (!showSettingsPopover) setControlsVisible(false);
        }}
        onKeyDown={handleKeyDown}
        aria-label={`ZTube 16:9 Widescreen Video Engine: ${video.title}. Press K or Space to Play/Pause, F for Fullscreen, C for Captions.`}
        className={`video-focus-neon group relative z-10 w-full aspect-video max-h-[72vh] rounded-xl overflow-hidden bg-black border shadow-2xl select-none ${
          isFocused ? `${themePalette.borderFocus} video-focus-neon-active` : 'border-neutral-800'
        } ${!shouldShowUi && isPlaying ? 'cursor-none' : 'cursor-pointer'}`}
      >
      {/* 1. STRICTLY LOCKED 16:9 ABSOLUTE MEDIA LAYER */}
      <div
        onClick={() => {
          containerRef.current?.focus();
          togglePlayPause();
        }}
        className="absolute inset-0 w-full h-full bg-black overflow-hidden"
      >
        {isYoutubeOrigin ? (
          <iframe
            ref={ytIframeRef}
            src={chromelessYoutubeSrc}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.01]"
          />
        ) : (
          <video
            ref={(el) => {
              htmlVideoRef.current = el;
              if (externalVideoRef) externalVideoRef.current = el;
            }}
            key={video.videoUrl}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            autoPlay={autoPlay}
            loop={loop}
            playsInline
            onTimeUpdate={(e) => {
              setCurrentTimeSec(e.currentTarget.currentTime);
              if (e.currentTarget.buffered.length > 0 && e.currentTarget.duration > 0) {
                const end = e.currentTarget.buffered.end(e.currentTarget.buffered.length - 1);
                setBufferedPercent(Math.min(100, (end / e.currentTarget.duration) * 100));
              }
            }}
            onLoadedMetadata={(e) => {
              if (e.currentTarget.duration && isFinite(e.currentTarget.duration)) {
                setDurationSec(e.currentTarget.duration);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              if (variant === 'watch' || variant === 'mini') {
                handleVideoPlaybackEnded(video.id);
              }
            }}
            className="absolute inset-0 w-full h-full object-contain bg-black pointer-events-none"
          />
        )}

        {/* Poster Overlay before initial play on Watch/Embed */}
        {!isPlaying && currentTimeSec === 0 && video.thumbnailUrl && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60" />
            <div
              className={`relative z-10 w-16 h-16 rounded-2xl bg-[#FF0033]/95 hover:bg-[#FF0033] text-white flex items-center justify-center shadow-[0_0_40px_rgba(255,0,51,0.65)] border border-white/30 transition-all duration-300 ${
                shouldShowUi ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Center Play / Pause Animated Feedback Pulse */}
        {centerPulseAction && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-black/75 border border-[#58f01b] text-[#58f01b] flex items-center justify-center animate-ping">
              {centerPulseAction === 'play' ? (
                <Play className="w-7 h-7 fill-current ml-0.5" />
              ) : (
                <Pause className="w-7 h-7 fill-current" />
              )}
            </div>
          </div>
        )}

        {/* Optional Moving Liquid-Glass Vibrating Corner Watermark */}
        <MovingLiquidGlassWatermark
          usernameHandle={usernameHandle}
          enabled={liveLiquidWatermarkEnabled}
        />

        {/* Synchronized Closed Captions Overlay (Creator-Made + AI Generated Sign) */}
        {effectiveCaptionsEnabled && activeCue && (
          <div
            className={`pointer-events-none absolute inset-x-4 flex flex-col items-center justify-center z-20 transition-all duration-300 ${
              shouldShowUi ? 'bottom-16' : 'bottom-5'
            }`}
          >
            <div className="max-w-2xl px-3.5 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-center shadow-2xl space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-mono text-neutral-300">
                  {activeCaptionTrack?.label || 'English (Auto-Synced)'}
                </span>
                {activeCaptionTrack?.isAiGenerated ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/25 border border-amber-400/50 text-amber-300 font-mono text-[9px] font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AI GENERATED CAPTIONS</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-mono text-[9px] font-bold">
                    CREATOR-MADE CAPTIONS
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                {activeCue.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {renderKeyboardShortcutVisualGuide()}

      {/* 2. TOP WIDESCREEN ENGINE HUD BAR (Fixed-Contrast Overlay · Auto-Hides after 2.2s of inactivity) */}
      {variant !== 'mini' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/95 via-black/75 to-transparent flex flex-wrap items-center justify-between gap-2 z-20 transition-all duration-300 ${
            shouldShowUi
              ? 'opacity-100 translate-y-0 pointer-events-none'
              : 'opacity-0 -translate-y-3 pointer-events-none'
          }`}
        >
          <div
            className={`flex flex-wrap items-center gap-1.5 ${
              shouldShowUi ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold backdrop-blur-md border transition-colors ${
                isFocused
                  ? 'bg-[#58f01b]/20 text-[#58f01b] border-[#58f01b]'
                  : 'bg-black/65 text-neutral-200 border-white/15'
              }`}
            >
              {isFocused
                ? '16:9 VIDEO ENGINE (#58f01b) · K/Space · F · C · J/L'
                : 'ZTube 16:9 Video Engine · Auto-Hide UI Active'}
            </span>
            <span className="hidden sm:inline-block px-2 py-1 rounded-md bg-black/65 border border-white/15 text-[10px] font-mono text-emerald-400">
              {qualityPreset}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 ${
              shouldShowUi ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            {variant === 'watch' && (
              <div className="inline-flex items-center rounded-lg bg-black/75 border border-white/20 p-0.5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => switchEngine('video')}
                  className="px-2 py-1 rounded-md bg-[#FF0033] text-white font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Active: 16:9 Widescreen Video Engine"
                >
                  <Monitor className="w-3 h-3" />
                  <span>16:9 Video Engine</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchEngine('shorts')}
                  className="px-2 py-1 rounded-md text-neutral-300 hover:text-white font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                  title="Switch to 9:16 Vertical Shorts Engine"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>9:16 Shorts Engine</span>
                </button>
              </div>
            )}

            {isYoutubeOrigin && (
              <a
                href={`https://www.youtube.com/watch?v=${encodeURIComponent(
                  video.youtubeId || ''
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-black/80 hover:bg-black text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5 text-[11px] font-semibold shadow-md"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3 h-3 text-[#FF0033]" />
              </a>
            )}
          </div>
        </div>
      )}

      {renderFullscreenHud()}
      {renderSettingsPopover()}

      {/* 3. BOTTOM WIDESCREEN VIDEO ENGINE CONTROL DECK (Fixed-Contrast Overlay · Auto-Hides after 2.2s of inactivity) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 z-20 bg-neutral-950/90 backdrop-blur-md border-t border-white/15 px-3 pt-3.5 pb-2.5 space-y-2 transition-all duration-300 ${
          shouldShowUi
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        {/* Interactive Timeline Scrubber */}
        <div
          ref={scrubberRef}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setHoverTimeSec(null)}
          onClick={handleScrubberClick}
          className="group/scrub relative h-2 w-full rounded-full bg-white/20 cursor-pointer flex items-center"
        >
          {hoverTimeSec !== null && (
            <div
              style={{ left: `${Math.max(6, Math.min(94, hoverPercent))}%` }}
              className="pointer-events-none absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] font-mono text-white whitespace-nowrap shadow-md"
            >
              {formatSecondsToClock(hoverTimeSec)}
            </div>
          )}

          <div
            style={{ width: `${bufferedPercent}%` }}
            className="h-full rounded-full bg-white/30 transition-all"
          />

          <div
            style={{ width: `${progressPercent}%` }}
            className={`absolute left-0 top-0 h-full rounded-full ${themePalette.barBg} transition-all`}
          />

          <div
            style={{ left: `${progressPercent}%` }}
            className={`absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full shadow-md transition-transform group-hover/scrub:scale-125 ${themePalette.thumbBg}`}
          />
        </div>

        {/* Transport & Feature Controls Row */}
        <div className="flex items-center justify-between gap-2 text-white text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title="Play / Pause (K or Spacebar)"
              className={`p-1.5 rounded-lg ${themePalette.buttonBg} transition-colors cursor-pointer`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => skipRelative(-10)}
              title="Rewind 10s (J or Left Arrow)"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => skipRelative(10)}
              title="Forward 10s (L or Right Arrow)"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-200 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                title="Mute / Unmute (M)"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-200 cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#FF0033]" />
                ) : (
                  <Volume2 className={`w-3.5 h-3.5 ${themePalette.accentText}`} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                aria-label="Volume"
                className={`w-14 sm:w-20 ${themePalette.volumeAccent} cursor-pointer`}
              />
            </div>

            <span className="font-mono tabular-nums text-[11px] text-neutral-200 pl-1">
              {formatSecondsToClock(currentTimeSec)}{' '}
              <span className="text-neutral-500">/</span> {formatSecondsToClock(durationSec)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={handleToggleCaptionsUnified}
              title="Toggle Creator or AI Captions (Shortcut: C)"
              aria-label="Toggle Captions (C)"
              className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                effectiveCaptionsEnabled
                  ? 'bg-amber-500 text-neutral-950'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CC</span>
            </button>

            <button
              type="button"
              onClick={() => setShowShortcutGuideOverlay((prev) => !prev)}
              title="Keyboard Shortcuts Visual Guide (J, K, L, M, F, C or ?)"
              aria-label="Keyboard Shortcuts Visual Guide"
              className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                showShortcutGuideOverlay
                  ? 'bg-[#58f01b] text-neutral-950'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keys</span>
            </button>

            {onOpenMiniPlayer && (
              <button
                type="button"
                onClick={async () => {
                  await triggerCrossBrowserNativePiP(htmlVideoRef.current);
                  onOpenMiniPlayer();
                }}
                title="Cross-Browser Mini-Player for Chromium / Safari / Firefox (Shortcut: I)"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <PictureInPicture2 className="w-3.5 h-3.5 text-[#58f01b]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSettingsPopover((prev) => !prev)}
              title="Custom Player Settings (Engine, Speed, AV1 Quality, Audio Tracks)"
              className={`px-2 py-1 rounded-lg font-mono text-[10px] flex items-center gap-1 cursor-pointer ${
                showSettingsPopover
                  ? 'bg-[#58f01b] text-neutral-950 font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{playbackSpeed}x</span>
            </button>

            {onToggleTheater && (
              <button
                type="button"
                onClick={onToggleTheater}
                title="Toggle Theater Mode"
                className="hidden sm:flex px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white cursor-pointer"
              >
                {theaterMode ? 'Standard' : 'Theater'}
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Full-Screen Mode (Shortcut: F)"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-[#FF0033] text-white cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
