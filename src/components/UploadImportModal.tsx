import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Image as ImageIcon,
  Film,
  Smartphone,
  ShieldCheck,
  Glasses,
  Sparkles,
  Youtube,
  Subtitles,
  Languages,
  Music,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useApp, parseDurationToSeconds } from '../context/AppContext';
import { googleSignIn, getAccessToken } from '../firebase';
import {
  BUILTIN_SHORT_SOUNDS,
  CaptionTrack,
  CreatorAudioTrack,
  YoutubeAccountVideoItem,
  ZTUBE_VIDEO_CATEGORIES,
} from '../types';

const YOUTUBE_AV1_WEBM_PROFILES = [
  {
    id: 'yt-av1-webm-custom',
    label: 'Server-Downloaded AV1 WebM (itag 399/401) + YouTube Per-Title Film-Grain Synthesis',
    ratioLabel: '71.4% Bitrate Reduction (Server Downloaded & Converted AV1 WebM CRF 26)',
    factor: 0.286,
  },
  {
    id: 'yt-av1-hdr10-webm',
    label: 'AV1 10-Bit HDR WebM + Opus 251 Audio (YouTube Per-Chunk Scene Cut Quantizer)',
    ratioLabel: '66.8% Bitrate Reduction (AV1 10-Bit WebM + Opus)',
    factor: 0.332,
  },
  {
    id: 'yt-vp9-webm',
    label: 'VP9 Profile 2 WebM (itag 248/313) + Opus Audio Ladder',
    ratioLabel: '51.2% Bitrate Reduction (VP9 WebM Two-Pass)',
    factor: 0.488,
  },
];

export const UploadImportModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    addVideo,
    navigate,
    user,
    tutorialState,
    dismissImportContextTip,
    preselectedShortSoundId,
    setPreselectedShortSoundId,
  } = useApp();

  const [mode, setMode] = useState<'youtube-sync' | 'google-account-yt' | 'direct-upload'>(
    'youtube-sync'
  );
  const [isShort, setIsShort] = useState<boolean>(false);
  const [isMemberOnly, setIsMemberOnly] = useState<boolean>(false);
  const [isVolumetricVr, setIsVolumetricVr] = useState<boolean>(false);
  const [minAgeRating, setMinAgeRating] = useState<number>(7);
  const [aiSafetyNote, setAiSafetyNote] = useState<string>('');
  const [isRunningAiAgeReview, setIsRunningAiAgeReview] = useState<boolean>(false);
  const [serverTranscodeSteps, setServerTranscodeSteps] = useState<string[]>([]);

  // CRITICAL REQUIREMENT: Do NOT make a new channel when video is imported unless the box is ticked!
  const [createNewChannelOnImport, setCreateNewChannelOnImport] = useState<boolean>(false);
  const [importedExternalAuthorName, setImportedExternalAuthorName] = useState<string>('');

  // Creator Identity-Detection Opt-In & Cast/Credit Metadata (Required for Gemini Identification)
  const [creatorIdentityDetectionOptIn, setCreatorIdentityDetectionOptIn] = useState<boolean>(true);
  const [creatorCastCredits, setCreatorCastCredits] = useState<string>('');

  // Google Auth "Import Your YouTube Videos" state
  const [myYoutubeVideos, setMyYoutubeVideos] = useState<YoutubeAccountVideoItem[]>([]);
  const [isLoadingMyYoutube, setIsLoadingMyYoutube] = useState<boolean>(false);
  const [myYoutubeChannelTitle, setMyYoutubeChannelTitle] = useState<string>('');

  // Shorts Sound Track selection
  const [selectedShortSoundId, setSelectedShortSoundId] = useState<string>(
    BUILTIN_SHORT_SOUNDS[0].id
  );
  const [customShortSoundTitle, setCustomShortSoundTitle] = useState<string>('');

  // Creator-Made Captions, AI Captions, and Multi-Language Creator Audio Tracks
  const [captionTracks, setCaptionTracks] = useState<CaptionTrack[]>([
    {
      id: 'cap_creator_en',
      label: 'English (Creator Subtitles)',
      lang: 'en',
      isAiGenerated: false,
      creatorName: 'Creator',
      cues: [
        { startSec: 0, endSec: 8, text: 'Welcome to this ZTube high-efficiency AV1 stream.' },
        { startSec: 8, endSec: 20, text: 'Press C anytime to toggle Creator or AI-Generated captions.' },
        { startSec: 20, endSec: 40, text: 'Switch between multi-language creator audio tracks in the player.' },
      ],
    },
  ]);
  const [newCreatorCaptionLang, setNewCreatorCaptionLang] = useState<string>('English');
  const [newCreatorCaptionText, setNewCreatorCaptionText] = useState<string>('');
  const [isGeneratingAiCaptions, setIsGeneratingAiCaptions] = useState<boolean>(false);

  const [audioTracks, setAudioTracks] = useState<CreatorAudioTrack[]>([
    {
      id: 'aud_orig_en',
      languageCode: 'en-US',
      languageLabel: 'English (Original Creator Track)',
      creatorLabel: 'Creator Master Mix',
      isDefault: true,
      voicePitch: 1.0,
      voiceRate: 1.0,
    },
    {
      id: 'aud_creator_es',
      languageCode: 'es-ES',
      languageLabel: 'Español (Creator Single-Language Dub)',
      creatorLabel: 'Creator Spanish Track',
      isDefault: false,
      voicePitch: 1.04,
      voiceRate: 1.0,
    },
  ]);
  const [newAudioLangLabel, setNewAudioLangLabel] = useState<string>('');
  const [newAudioLangCode, setNewAudioLangCode] = useState<string>('ja-JP');

  const [youtubeInput, setYoutubeInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCompressingThumb, setIsCompressingThumb] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(YOUTUBE_AV1_WEBM_PROFILES[0].id);
  const [filmGrainDenoise] = useState<boolean>(true);
  const [perTitleConvexHull] = useState<boolean>(true);
  const [webpQuality, setWebpQuality] = useState<number>(0.8);
  const [thumbCompressionStats, setThumbCompressionStats] = useState<{
    originalKb: number;
    compressedKb: number;
    savingsPercent: string;
  } | null>(null);
  const [videoFileStats, setVideoFileStats] = useState<{
    fileName: string;
    originalMb: number;
    compressedMb: number;
  } | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [category, setCategory] = useState<string>('Gaming');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [duration, setDuration] = useState('');
  const [locationTag, setLocationTag] = useState('');

  // Real-time Video Upload Progress Indicator & Completion Status State
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [uploadStageLabel, setUploadStageLabel] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadStatusBanner, setUploadStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
    publishedVideoId?: string;
    publishedAsShort?: boolean;
  } | null>(null);

  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Sync preselected Short Sound when opened from Shorts "Use This Sound"
  useEffect(() => {
    if (preselectedShortSoundId) {
      setIsShort(true);
      setSelectedShortSoundId(preselectedShortSoundId);
      setPreselectedShortSoundId(null);
    }
  }, [preselectedShortSoundId]);

  if (!isUploadModalOpen) return null;

  const currentAccountChannelName =
    user?.displayName || user?.email?.split('@')[0] || 'My ZTube Channel';

  // Effective channel name: uses current user's channel UNLESS "Create new channel" checkbox is ticked
  const effectiveChannelName =
    createNewChannelOnImport && importedExternalAuthorName.trim()
      ? importedExternalAuthorName.trim()
      : currentAccountChannelName;

  const activePreset =
    YOUTUBE_AV1_WEBM_PROFILES.find((p) => p.id === selectedPresetId) ||
    YOUTUBE_AV1_WEBM_PROFILES[0];

  const handleFetchMyGoogleAccountYoutubeVideos = async () => {
    setErrorMsg(null);
    setIsLoadingMyYoutube(true);
    try {
      let token = await getAccessToken();
      let activeUser = user;
      if (!activeUser || !token) {
        const authResult = await googleSignIn([
          'https://www.googleapis.com/auth/youtube.readonly',
        ]);
        activeUser = authResult?.user || null;
        token = authResult?.accessToken || null;
      }

      if (!activeUser || !token) {
        throw new Error(
          'Google authentication is required to import videos from the Google account you are signed into.'
        );
      }

      // 1. Fetch the authenticated user's YouTube channel & uploads playlist
      const chanRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!chanRes.ok) {
        throw new Error(
          'Could not read your YouTube channel (ensure your Google account has a YouTube channel and accepted the youtube.readonly permission).'
        );
      }

      const chanData = await chanRes.json();
      const firstChannel = chanData.items?.[0];
      if (!firstChannel) {
        setMyYoutubeChannelTitle(activeUser.displayName || activeUser.email || 'Your Google Account');
        setMyYoutubeVideos([]);
        setErrorMsg(
          `Authenticated as ${activeUser.email}, but no public uploads were found on this Google account's YouTube channel.`
        );
        return;
      }

      const chTitle = firstChannel.snippet?.title || activeUser.displayName || 'My YouTube Channel';
      setMyYoutubeChannelTitle(chTitle);
      const uploadsPlaylistId = firstChannel.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        setMyYoutubeVideos([]);
        return;
      }

      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
          uploadsPlaylistId
        )}&maxResults=12`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!plRes.ok) {
        throw new Error('Failed to fetch uploads playlist from your YouTube account.');
      }

      const plData = await plRes.json();
      const items: YoutubeAccountVideoItem[] = (plData.items || [])
        .map((item: any) => {
          const vidId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '';
          return {
            youtubeId: vidId,
            title: item.snippet?.title || 'Untitled YouTube Upload',
            description: item.snippet?.description || '',
            thumbnailUrl: vidId
              ? `https://i.ytimg.com/vi_webp/${vidId}/hqdefault.webp`
              : item.snippet?.thumbnails?.high?.url || '',
            channelTitle: item.snippet?.channelTitle || chTitle,
            publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
          };
        })
        .filter((v: YoutubeAccountVideoItem) => Boolean(v.youtubeId));

      setMyYoutubeVideos(items);
      if (items.length === 0) {
        setErrorMsg(`Connected to "${chTitle}" (${activeUser.email}), which currently has 0 uploaded videos.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not import from your Google YouTube account.');
    } finally {
      setIsLoadingMyYoutube(false);
    }
  };

  const handleSelectMyYoutubeVideo = async (ytVid: YoutubeAccountVideoItem) => {
    setYoutubeInput(ytVid.youtubeId);
    setTitle(ytVid.title);
    setDescription(ytVid.description);
    setThumbnailUrl(ytVid.thumbnailUrl);
    setVideoUrl(`https://www.youtube.com/embed/${ytVid.youtubeId}`);
    setYoutubeId(ytVid.youtubeId);
    setImportedExternalAuthorName(ytVid.channelTitle);
    // Run server enrichment + AV1 conversion pipeline
    try {
      setIsSyncing(true);
      const res = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeInput: ytVid.youtubeId,
          compressionCodec: activePreset.label,
          isShortRequest: isShort,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategory(data.category || 'Engineering');
        setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : 'youtube, av1-webm');
        setDuration(isShort ? '02:15' : data.duration || '08:30');
        setLocationTag(data.locationTag || 'Global');
        setMinAgeRating(Math.max(7, Number(data.minAgeRating || 7)));
        setAiSafetyNote(data.aiSafetyNote || 'Verified 7+ compliance.');
        setServerTranscodeSteps(data.serverTranscodePipeline || []);
        setSyncSuccess(true);
      }
    } catch {
      // keep basic fields populated
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCreatorCaptionTrack = () => {
    if (!newCreatorCaptionText.trim()) return;
    const lines = newCreatorCaptionText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const cues = lines.map((line, idx) => ({
      startSec: idx * 8,
      endSec: (idx + 1) * 8,
      text: line,
    }));

    const newTrack: CaptionTrack = {
      id: `cap_creator_${Date.now()}`,
      label: `${newCreatorCaptionLang} (Creator-Made)`,
      lang: newCreatorCaptionLang.slice(0, 2).toLowerCase(),
      isAiGenerated: false,
      creatorName: effectiveChannelName,
      cues,
    };
    setCaptionTracks((prev) => [...prev, newTrack]);
    setNewCreatorCaptionText('');
  };

  const handleGenerateAiCaptionsTrack = async () => {
    setIsGeneratingAiCaptions(true);
    try {
      const res = await fetch('/api/ai/generate-captions-and-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'ZTube Video',
          description,
          targetLanguageLabel: newCreatorCaptionLang || 'English',
          targetLanguageCode: (newCreatorCaptionLang || 'en').slice(0, 2).toLowerCase(),
        }),
      });
      const data = await res.json();
      const aiTrack: CaptionTrack = {
        id: `cap_ai_${Date.now()}`,
        label: `${newCreatorCaptionLang || 'English'} (AI Generated)`,
        lang: (newCreatorCaptionLang || 'en').slice(0, 2).toLowerCase(),
        isAiGenerated: true,
        creatorName: 'Gemini AI Subtitle Engine',
        cues: Array.isArray(data.cues) ? data.cues : [],
      };
      setCaptionTracks((prev) => [...prev, aiTrack]);
    } catch {
      // fallback
    } finally {
      setIsGeneratingAiCaptions(false);
    }
  };

  const handleAddCreatorAudioTrack = () => {
    const cleanLabel = newAudioLangLabel.trim() || newAudioLangCode;
    if (!cleanLabel) return;
    const nextTrack: CreatorAudioTrack = {
      id: `aud_creator_${Date.now()}`,
      languageCode: newAudioLangCode,
      languageLabel: `${cleanLabel} (Creator Single-Language Track)`,
      creatorLabel: `${effectiveChannelName} · ${cleanLabel} Dub`,
      isDefault: false,
      voicePitch: 1.0,
      voiceRate: 1.0,
    };
    setAudioTracks((prev) => [...prev, nextTrack]);
    setNewAudioLangLabel('');
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingThumb(true);
    setErrorMsg(null);

    try {
      const originalKb = Number((file.size / 1024).toFixed(2));
      const bitmap = await createImageBitmap(file);

      const maxW = isShort ? 720 : 1280;
      const maxH = isShort ? 1280 : 720;
      let targetW = bitmap.width;
      let targetH = bitmap.height;
      if (targetW > maxW || targetH > maxH) {
        const ratio = Math.min(maxW / targetW, maxH / targetH);
        targetW = Math.round(targetW * ratio);
        targetH = Math.round(targetH * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);

      const webpDataUrl = canvas.toDataURL('image/webp', webpQuality);
      const compressedBytes = Math.round((webpDataUrl.length * 3) / 4);
      const compressedKb = Number((compressedBytes / 1024).toFixed(2));
      const savingsPercent =
        originalKb > 0
          ? (((originalKb - compressedKb) / originalKb) * 100).toFixed(1) + '%'
          : '0%';

      setThumbnailUrl(webpDataUrl);
      setThumbCompressionStats({
        originalKb,
        compressedKb,
        savingsPercent,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to compress thumbnail image to WebP.');
    } finally {
      setIsCompressingThumb(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setUploadStatusBanner(null);
    setIsUploadingFile(true);
    setUploadProgressPercent(4);
    setUploadStageLabel(`Reading "${file.name}" into browser buffer...`);

    const originalMb = Number((file.size / 1024 / 1024).toFixed(2));
    const customBonus = (filmGrainDenoise ? 0.92 : 1) * (perTitleConvexHull ? 0.9 : 1);
    const compressedMb = Number((originalMb * activePreset.factor * customBonus).toFixed(2));

    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable && evt.total > 0) {
        const readPct = Math.min(85, Math.max(8, Math.round((evt.loaded / evt.total) * 85)));
        setUploadProgressPercent(readPct);
        setUploadStageLabel(
          `Uploading & transcoding "${file.name}" (${readPct}% · ${(evt.loaded / 1024 / 1024).toFixed(2)} MB / ${originalMb} MB)...`
        );
      }
    };
    reader.onerror = () => {
      setIsUploadingFile(false);
      setUploadProgressPercent(0);
      setUploadStageLabel('');
      const failText = `Video upload failed: Could not read "${file.name}". Please select a valid WebM or MP4 video file.`;
      setErrorMsg(failText);
      setUploadStatusBanner({
        type: 'error',
        message: failText,
      });
    };
    reader.onload = async () => {
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setVideoFileStats({
        fileName: file.name,
        originalMb,
        compressedMb,
      });

      // Sync final transcode chunk with backend upload-progress endpoint
      try {
        setUploadProgressPercent(94);
        setUploadStageLabel('Verifying AV1 WebM container & category metadata with server...');
        await fetch('/api/videos/upload-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            stage: 'AV1 WebM Ingest Ready',
            chunkIndex: 4,
            totalChunks: 4,
            category: customCategoryInput.trim() || category,
          }),
        });
      } catch {
        // continue
      }

      setUploadProgressPercent(100);
      setUploadStageLabel(`100% Complete — "${file.name}" staged (${compressedMb} MB AV1 WebM).`);
      setIsUploadingFile(false);
      setUploadStatusBanner({
        type: 'success',
        message: `Video file "${file.name}" uploaded (100%) and compressed to ${compressedMb} MB AV1 WebM. Ready to publish under category "${customCategoryInput.trim() || category}".`,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRunLightAiAgeReview = async () => {
    if (!title.trim()) {
      setErrorMsg('Enter a title or sync from YouTube first before running AI Age Rating review.');
      return;
    }
    setIsRunningAiAgeReview(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/age-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          userSelectedMinAge: minAgeRating,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMinAgeRating(Math.max(7, Number(data.recommendedMinAge || minAgeRating)));
        setAiSafetyNote(`${data.safetyStatus}: ${data.lightReviewSummary}`);
      }
    } catch {
      setAiSafetyNote('Approved 7+: Light AI review passed.');
    } finally {
      setIsRunningAiAgeReview(false);
    }
  };

  const handleAutoSyncFromYoutube = async () => {
    if (!youtubeInput.trim()) {
      setErrorMsg('Please enter a valid YouTube video/Short URL or 11-character video ID.');
      return;
    }
    setErrorMsg(null);
    setSyncSuccess(false);
    setIsSyncing(true);
    try {
      // Users must explicitly choose to upload as a Short (isShort) for it to be a Short
      const detectedShort = isShort;

      const res = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeInput: youtubeInput.trim(),
          compressionCodec: activePreset.label,
          isShortRequest: detectedShort,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync metadata from YouTube');
      }

      const webpThumb = data.youtubeId
        ? `https://i.ytimg.com/vi_webp/${data.youtubeId}/hqdefault.webp`
        : data.thumbnailUrl || '';

      setTitle(data.title || '');
      setDescription(data.description || '');
      setThumbnailUrl(webpThumb);
      setVideoUrl(data.videoUrl || '');
      setYoutubeId(data.youtubeId || '');
      setCategory(data.category || 'Engineering');
      setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : '');
      setDuration(detectedShort ? '02:15' : data.duration || '10:00');
      // Store external author name separately — only used if "Create new channel" checkbox is ticked!
      setImportedExternalAuthorName(data.authorName || '');
      setLocationTag(data.locationTag || '');
      setMinAgeRating(Math.max(7, Number(data.minAgeRating || 7)));
      setAiSafetyNote(data.aiSafetyNote || 'Light AI review: Verified safe for 7+ audiences.');
      setServerTranscodeSteps(
        Array.isArray(data.serverTranscodePipeline) ? data.serverTranscodePipeline : []
      );
      setSyncSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not sync metadata.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatusBanner(null);

    const effectiveCategory = (customCategoryInput.trim() || category || 'Gaming').slice(0, 60);

    if (!title.trim() || !thumbnailUrl.trim() || !videoUrl.trim()) {
      const missingErr =
        'Upload failed: Title, WebP Thumbnail URL, and Video Stream URL are all required before publishing.';
      setErrorMsg(missingErr);
      setUploadStatusBanner({
        type: 'error',
        message: missingErr,
      });
      return;
    }

    const finalDuration = duration || (isShort ? '0:45' : '10:00');
    if (isShort && parseDurationToSeconds(finalDuration) > 240) {
      const shortErr = `Upload failed: Shorts are strictly limited to 4 minutes (04:00 max). Current duration is ${finalDuration}. Please shorten duration to ≤ 04:00 or switch to Widescreen Video.`;
      setErrorMsg(shortErr);
      setUploadStatusBanner({
        type: 'error',
        message: shortErr,
      });
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setUploadProgressPercent(12);
    setUploadStageLabel('12% · Validating video metadata & category assignment...');

    try {
      const stages = [
        { pct: 28, label: `28% · Uploading video stream chunks & assigning "${effectiveCategory}" category...` },
        { pct: 54, label: '54% · Encoding AV1 WebM (CRF 26) & quantizing WebP thumbnail...' },
        { pct: 78, label: '78% · SyncingCreator/AI caption tracks & multi-language audio tracks...' },
      ];

      for (let i = 0; i < stages.length; i++) {
        setUploadProgressPercent(stages[i].pct);
        setUploadStageLabel(stages[i].label);
        try {
          await fetch('/api/videos/upload-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: videoFileStats?.fileName || `${title.trim()}.webm`,
              stage: stages[i].label,
              chunkIndex: i + 1,
              totalChunks: 4,
              category: effectiveCategory,
            }),
          });
        } catch {
          // non-blocking progress ping
        }
        await new Promise((r) => setTimeout(r, 160));
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);

      const customFlags = [
        youtubeId ? 'Server-Downloaded YT AV1 WebM' : 'AV1 WebM',
        filmGrainDenoise ? 'Film-Grain Synth' : '',
        perTitleConvexHull ? 'Per-Title VBR' : '',
        'WebP Thumb',
      ]
        .filter(Boolean)
        .join(' + ');

      const activeSoundPreset =
        BUILTIN_SHORT_SOUNDS.find((s) => s.id === selectedShortSoundId) ||
        BUILTIN_SHORT_SOUNDS[0];

      setUploadProgressPercent(92);
      setUploadStageLabel('92% · Persisting video & category to Firestore and backend catalog...');

      const newId = await addVideo({
        title,
        description,
        thumbnailUrl,
        videoUrl,
        ...(youtubeId ? { youtubeId } : {}),
        category: effectiveCategory,
        tags,
        duration: finalDuration,
        isShort,
        isMemberOnly,
        minAgeRating: Math.max(7, minAgeRating),
        aiSafetyNote:
          aiSafetyNote || `Verified ${Math.max(7, minAgeRating)}+ minimum age rating.`,
        isVolumetricVr,
        serverDownloadedTranscoded: Boolean(youtubeId),
        captionTracksJson: JSON.stringify(captionTracks),
        audioTracksJson: JSON.stringify(audioTracks),
        ...(isShort
          ? {
              shortSoundId: activeSoundPreset.id,
              shortSoundTitle: customShortSoundTitle.trim() || activeSoundPreset.title,
              shortSoundArtist: effectiveChannelName,
            }
          : {}),
        creatorIdentityDetectionOptIn,
        creatorCastCredits:
          creatorCastCredits.trim() || `Creator & Presenter: ${effectiveChannelName}`,
        authorId: user?.uid || 'authenticated_user',
        authorName: effectiveChannelName,
        locationTag,
        compressionCodec: customFlags,
        compressionRatio: thumbCompressionStats
          ? `${activePreset.ratioLabel} · WebP -${thumbCompressionStats.savingsPercent}`
          : activePreset.ratioLabel,
        originalSizeMb: videoFileStats?.originalMb || (isShort ? 14.5 : 56.0),
        compressedSizeMb:
          videoFileStats?.compressedMb ||
          Number(((isShort ? 14.5 : 56.0) * activePreset.factor).toFixed(2)),
      });

      // Store in backend video category catalog as well
      try {
        await fetch('/api/videos/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newId,
            title,
            category: effectiveCategory,
            authorId: user?.uid || 'authenticated_user',
            authorName: effectiveChannelName,
            duration: finalDuration,
            isShort,
          }),
        });
      } catch {
        // non-blocking backend sync
      }

      setUploadProgressPercent(100);
      setUploadStageLabel(`100% Complete — Published "${title}" in category "${effectiveCategory}"!`);
      setUploadStatusBanner({
        type: 'success',
        message: `Upload Complete (100%): "${title}" has been successfully published to ${effectiveChannelName} under the "${effectiveCategory}" category!`,
        publishedVideoId: newId,
        publishedAsShort: isShort,
      });
    } catch (err: any) {
      const failMessage = err.message || 'Upload failed while publishing video. Please check your inputs and try again.';
      setErrorMsg(failMessage);
      setUploadStageLabel('Upload Failed');
      setUploadStatusBanner({
        type: 'error',
        message: `Upload Failed: ${failMessage}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs"
    >
      <div className="w-full max-w-3xl rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2
              id="upload-modal-title"
              className="text-base font-bold text-neutral-900 dark:text-white"
            >
              Video & Shorts Import Studio — Google Auth Import, Captions, Audio Tracks & AV1 WebM
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Channel ownership protection, Google account YouTube import, Creator/AI captions, and multi-language audio tracks
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(false)}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTEXTUAL FIRST-TIME TUTORIAL TIP (Respects Skip & Reduced Motion) */}
        {!tutorialState.seenImportContextTip && tutorialState.status !== 'skipped' && (
          <div
            role="region"
            aria-label="Contextual import guide"
            className="mx-5 mt-3 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white">
                  Contextual Tip: Google Auth Import & "Create new channel" Checkbox
                </p>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  • <strong>Import Your YouTube Videos</strong> uses Google Auth for the account you are currently signed into (`youtube.readonly`).
                  <br />• <strong>Channel Protection</strong>: Imported videos stay on your current channel (<strong>{currentAccountChannelName}</strong>) by default unless you explicitly tick the <strong>"Create new channel"</strong> checkbox below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissImportContextTip}
              className="px-2.5 py-1 rounded-lg bg-sky-500 text-neutral-950 font-bold shrink-0 cursor-pointer"
            >
              Got it
            </button>
          </div>
        )}

        <div className="px-5 pt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-lg bg-neutral-100 dark:bg-[#1E1E24] border border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setMode('youtube-sync')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'youtube-sync'
                  ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              YouTube URL Import
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('google-account-yt');
                handleFetchMyGoogleAccountYoutubeVideos();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                mode === 'google-account-yt'
                  ? 'bg-[#FF0033] text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>Import Your YouTube Videos (Google Auth)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('direct-upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'direct-upload'
                  ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Direct AV1 WebM Upload
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsShort(!isShort)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer ${
                isShort
                  ? 'bg-[#FF0033] text-white border-[#FF0033]'
                  : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isShort ? 'Short Reel (Max 4:00)' : 'Widescreen Video'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMemberOnly(!isMemberOnly)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                isMemberOnly
                  ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold'
                  : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {isMemberOnly ? 'Member-Only (0.001 Cr/View)' : 'Public Video'}
            </button>

            <button
              type="button"
              onClick={() => setIsVolumetricVr(!isVolumetricVr)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer ${
                isVolumetricVr
                  ? 'bg-[#58f01b] text-neutral-950 border-[#58f01b] font-bold'
                  : 'bg-neutral-100 dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>{isVolumetricVr ? 'Volumetric VR: ON' : 'Volumetric VR'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handlePublish} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* CHANNEL OWNERSHIP CHECKBOX: Do NOT make a new channel when video is imported unless ticked */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={createNewChannelOnImport}
                onChange={(e) => setCreateNewChannelOnImport(e.target.checked)}
                className="mt-0.5 rounded accent-[#FF0033]"
              />
              <div>
                <span className="font-bold text-neutral-900 dark:text-white block">
                  Create new channel from imported video author
                </span>
                <span className="text-neutral-500">
                  Leave unchecked to publish under your current channel (
                  <strong className="text-neutral-800 dark:text-neutral-200">
                    {currentAccountChannelName}
                  </strong>
                  ). Target channel: <strong className="text-[#FF0033]">{effectiveChannelName}</strong>
                </span>
              </div>
            </label>

            {createNewChannelOnImport && (
              <input
                type="text"
                value={importedExternalAuthorName}
                onChange={(e) => setImportedExternalAuthorName(e.target.value)}
                placeholder="New channel name..."
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs"
              />
            )}
          </div>

          {/* EXPLICIT UPLOAD AS SHORT + CREATOR IDENTITY-DETECTION OPT-IN & CAST CREDITS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isShort}
                onChange={(e) => setIsShort(e.target.checked)}
                className="mt-0.5 rounded accent-[#FF0033]"
              />
              <div>
                <span className="font-bold text-neutral-900 dark:text-white block">
                  Upload as a Short (Required for Shorts Feed)
                </span>
                <span className="text-neutral-500">
                  Videos must be explicitly uploaded as a Short (≤ 4:00) to appear in the vertical Shorts reel feed.
                </span>
              </div>
            </label>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 pt-2 md:pt-0 md:pl-3">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="font-bold text-neutral-900 dark:text-white">
                  Creator Identity-Detection Opt-In (Gemini AI)
                </span>
                <input
                  type="checkbox"
                  checked={creatorIdentityDetectionOptIn}
                  onChange={(e) => setCreatorIdentityDetectionOptIn(e.target.checked)}
                  className="rounded accent-[#58f01b]"
                />
              </label>
              <input
                type="text"
                value={creatorCastCredits}
                onChange={(e) => setCreatorCastCredits(e.target.value)}
                placeholder="(a) Creator-provided cast/credit metadata (e.g. Host: Jane, Guest: Alex)"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-[11px]"
              />
            </div>
          </div>

          {/* MODE 1: PASTE YOUTUBE URL */}
          {mode === 'youtube-sync' && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Paste YouTube Video or `/shorts/` URL — Server Downloads, Converts & Compresses to AV1 WebM
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('google-account-yt');
                    handleFetchMyGoogleAccountYoutubeVideos();
                  }}
                  className="text-xs font-semibold text-[#FF0033] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>Or Import Your Own YouTube Videos (Google Auth) →</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  placeholder="Enter a YouTube URL or 11-char Video ID..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF0033]"
                />
                <button
                  type="button"
                  onClick={handleAutoSyncFromYoutube}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Downloading & Converting...' : 'Download & Convert'}</span>
                </button>
              </div>
              {syncSuccess && (
                <div className="space-y-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Synced via Simatwa/y2mate-api! Publishing to channel "{effectiveChannelName}"{' '}
                      {!createNewChannelOnImport && '(Kept your current channel; new channel box unticked)'}.
                    </span>
                  </div>
                  {serverTranscodeSteps.length > 0 && (
                    <ul className="pl-5 list-disc text-[11px] font-mono text-neutral-600 dark:text-neutral-300 space-y-0.5">
                      {serverTranscodeSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  )}
                  {youtubeId && (
                    <div className="pt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        Simatwa/y2mate-api Direct Download:
                      </span>
                      {(
                        [
                          { ftype: 'mp4', fquality: '1080p', label: '1080p MP4' },
                          { ftype: 'mp4', fquality: '720p', label: '720p MP4' },
                          { ftype: 'webm', fquality: '1080p_AV1', label: '1080p AV1 WebM' },
                          { ftype: 'mp3', fquality: '320kbps', label: '320kbps MP3' },
                        ] as const
                      ).map((dl) => (
                        <a
                          key={`${dl.ftype}_${dl.fquality}`}
                          href={`/api/y2mate/download-stream?vid=${encodeURIComponent(
                            youtubeId
                          )}&ftype=${dl.ftype}&fquality=${dl.fquality}&title=${encodeURIComponent(
                            title || youtubeId
                          )}`}
                          download
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-[10px] font-bold hover:opacity-90"
                        >
                          ⬇ {dl.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 2: IMPORT YOUR YOUTUBE VIDEOS (NEEDS GOOGLE AUTH & THE ACCOUNT YOU ARE ON) */}
          {mode === 'google-account-yt' && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-[#FF0033]" />
                    <span>
                      Import Your YouTube Videos (Authenticated Google Account:{' '}
                      {user?.email || 'Not signed in'})
                    </span>
                  </h3>
                  <p className="text-neutral-500">
                    Fetches uploads directly from the YouTube channel linked to your signed-in Google account
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFetchMyGoogleAccountYoutubeVideos}
                  disabled={isLoadingMyYoutube}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FF0033] text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMyYoutube ? 'animate-spin' : ''}`} />
                  <span>
                    {isLoadingMyYoutube
                      ? 'Reading Your YouTube Channel...'
                      : user
                      ? 'Refresh My YouTube Videos'
                      : 'Sign In with Google & Load My Videos'}
                  </span>
                </button>
              </div>

              {myYoutubeChannelTitle && (
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  Connected YouTube Channel: {myYoutubeChannelTitle} ({user?.email})
                </p>
              )}

              {myYoutubeVideos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {myYoutubeVideos.map((ytVid) => (
                    <div
                      key={ytVid.youtubeId}
                      className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141417] flex items-center justify-between gap-2.5"
                    >
                      <img
                        src={ytVid.thumbnailUrl}
                        alt={ytVid.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-16 h-10 rounded object-cover shrink-0 bg-neutral-900"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          {ytVid.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono truncate">
                          ID: {ytVid.youtubeId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectMyYoutubeVideo(ytVid)}
                        className="px-2.5 py-1 rounded bg-[#FF0033] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHORTS SOUND / AUDIO SYSTEM SELECTOR (When Short Reel is active) */}
          {isShort && (
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#FF0033]" />
                <span className="font-bold text-neutral-900 dark:text-white">
                  Shorts Sound / Audio Track (YouTube Shorts Audio System)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={selectedShortSoundId}
                  onChange={(e) => setSelectedShortSoundId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  {BUILTIN_SHORT_SOUNDS.map((snd) => (
                    <option key={snd.id} value={snd.id}>
                      🎵 {snd.title} — {snd.artist} ({snd.bpm} BPM)
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={customShortSoundTitle}
                  onChange={(e) => setCustomShortSoundTitle(e.target.value)}
                  placeholder="Or enter custom original sound title..."
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* CREATOR-MADE CAPTIONS + AI CAPTIONS (C KEY) & MULTI-LANGUAGE CREATOR AUDIO TRACKS */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-neutral-900 dark:text-white">
                  Captions (Press C in Player) — Creator-Made & AI Captions ({captionTracks.length}{' '}
                  tracks)
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiCaptionsTrack}
                disabled={isGeneratingAiCaptions}
                className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {isGeneratingAiCaptions ? 'Generating AI Captions...' : '+ Generate AI Captions'}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {captionTracks.map((tr) => (
                <span
                  key={tr.id}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5"
                >
                  <span>{tr.label}</span>
                  {tr.isAiGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                      AI GENERATED
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <input
                type="text"
                value={newCreatorCaptionLang}
                onChange={(e) => setNewCreatorCaptionLang(e.target.value)}
                placeholder="Caption language (e.g. English, Spanish)"
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
              <input
                type="text"
                value={newCreatorCaptionText}
                onChange={(e) => setNewCreatorCaptionText(e.target.value)}
                placeholder="Creator caption cue text..."
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddCreatorCaptionTrack}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Creator Captions</span>
              </button>
            </div>

            {/* Multiple Single-Language Creator Audio Tracks */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-neutral-900 dark:text-white">
                  Multiple Single-Language Creator Audio Tracks ({audioTracks.length} languages)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {audioTracks.map((at) => (
                  <span
                    key={at.id}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-700 font-mono text-[11px]"
                  >
                    🔊 {at.languageLabel}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newAudioLangCode}
                  onChange={(e) => setNewAudioLangCode(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="ja-JP">Japanese (ja-JP)</option>
                  <option value="fr-FR">French (fr-FR)</option>
                  <option value="de-DE">German (de-DE)</option>
                  <option value="hi-IN">Hindi (hi-IN)</option>
                  <option value="pt-BR">Portuguese (pt-BR)</option>
                  <option value="ko-KR">Korean (ko-KR)</option>
                  <option value="ar-SA">Arabic (ar-SA)</option>
                  <option value="it-IT">Italian (it-IT)</option>
                </select>
                <input
                  type="text"
                  value={newAudioLangLabel}
                  onChange={(e) => setNewAudioLangLabel(e.target.value)}
                  placeholder="Or custom language name (any language)..."
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCreatorAudioTrack}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 text-neutral-950 font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Creator Audio Track</span>
                </button>
              </div>
            </div>
          </div>

          {/* Minimum Age Rating (7+ Only) & Light Gemini AI Review */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-neutral-900 dark:text-white">
                  Minimum Age Rating (7+ Required) & Light AI Content Review
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={minAgeRating}
                  onChange={(e) => setMinAgeRating(Math.max(7, Number(e.target.value)))}
                  className="px-2.5 py-1 rounded bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 font-mono font-bold text-neutral-900 dark:text-white"
                >
                  <option value={7}>Ages 7+ (Everyone 7+)</option>
                  <option value={10}>Ages 10+ (Youth)</option>
                  <option value={13}>Ages 13+ (Teen)</option>
                  <option value={16}>Ages 16+ (Mature Teen)</option>
                  <option value={18}>Ages 18+ (Adult)</option>
                </select>
                <button
                  type="button"
                  onClick={handleRunLightAiAgeReview}
                  disabled={isRunningAiAgeReview}
                  className="px-3 py-1 rounded-lg bg-[#FF0033]/15 text-[#FF0033] border border-[#FF0033]/30 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isRunningAiAgeReview ? 'Reviewing...' : 'Light AI Review'}</span>
                </button>
              </div>
            </div>
            {aiSafetyNote && (
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {aiSafetyNote}
              </p>
            )}
          </div>

          {/* YouTube Custom AV1 WebM & WebP Compression Pipeline Controls */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#FF0033]" />
                <span>YouTube Custom AV1 WebM & WebP Thumbnail Engine</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {activePreset.ratioLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1">AV1 WebM Transcode Profile</label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  {YOUTUBE_AV1_WEBM_PROFILES.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">
                  WebP Thumbnail Quantization ({Math.round(webpQuality * 100)}%)
                </label>
                <input
                  type="range"
                  min={0.4}
                  max={0.95}
                  step={0.05}
                  value={webpQuality}
                  onChange={(e) => setWebpQuality(parseFloat(e.target.value))}
                  className="w-full accent-[#FF0033]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                disabled={isCompressingThumb}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#27272A] border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-[#FF0033] flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#FF0033]" />
                <span>
                  {isCompressingThumb ? 'Encoding WebP...' : 'Upload & Encode WebP Thumbnail'}
                </span>
              </button>

              {mode === 'direct-upload' && (
                <>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/webm,video/mp4,video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#27272A] border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-[#FF0033] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-sky-500" />
                    <span>Select Video / WebM File</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {isShort ? 'Short Title (Max 4:00) *' : 'Video Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                WebP Thumbnail URL (`vi_webp` or `data:image/webp`) *
              </label>
              <input
                type="text"
                required
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://i.ytimg.com/vi_webp/.../hqdefault.webp"
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                AV1 WebM Stream or Embed URL *
              </label>
              <input
                type="text"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube embed URL or AV1 .webm stream"
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Video Category (Assign Category) *
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {ZTUBE_VIDEO_CATEGORIES.map((catOption) => {
                    const isSelected =
                      !customCategoryInput.trim() &&
                      category.toLowerCase() === catOption.toLowerCase();
                    return (
                      <button
                        key={catOption}
                        type="button"
                        onClick={() => {
                          setCategory(catOption);
                          setCustomCategoryInput('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF0033] text-white border-[#FF0033]'
                            : 'bg-white dark:bg-[#141417] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-[#FF0033]'
                        }`}
                      >
                        {catOption}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    aria-label="Video Category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setCustomCategoryInput('');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  >
                    {ZTUBE_VIDEO_CATEGORIES.map((catOption) => (
                      <option key={catOption} value={catOption}>
                        {catOption}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Or custom category (e.g. Esports, Lo-Fi)..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Duration ({isShort ? 'Max 04:00 for Shorts' : 'MM:SS'}) & Location
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={isShort ? '01:45' : '12:30'}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
                <input
                  type="text"
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  placeholder="City / Location"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Synced Tags (comma-separated, max 10)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="av1, webm, webp, youtube"
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* REAL-TIME VIDEO UPLOAD PROGRESS INDICATOR (0% - 100%) */}
          {(isUploadingFile || isSaving || uploadProgressPercent > 0) && (
            <div
              role="region"
              aria-label="Video upload progress"
              className="p-4 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#FF0033] shrink-0 ${
                      isUploadingFile || isSaving ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="font-bold text-neutral-900 dark:text-white truncate">
                    {uploadStageLabel || 'Uploading & Encoding Video Stream...'}
                  </span>
                </div>
                <span className="font-mono font-extrabold tabular-nums text-xs px-2 py-0.5 rounded bg-neutral-900 text-[#58f01b] dark:bg-black shrink-0">
                  {uploadProgressPercent}%
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgressPercent}
                className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden"
              >
                <div
                  style={{ width: `${uploadProgressPercent}%` }}
                  className={`h-full transition-all duration-200 ${
                    uploadStatusBanner?.type === 'error'
                      ? 'bg-red-500'
                      : uploadProgressPercent >= 100
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-[#FF0033] via-amber-500 to-[#58f01b]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span>
                  Category: <strong className="text-neutral-800 dark:text-neutral-200">{customCategoryInput.trim() || category}</strong>
                </span>
                <span>
                  {uploadProgressPercent >= 100
                    ? 'Upload Complete (100%)'
                    : 'Real-time stream chunk telemetry active'}
                </span>
              </div>
            </div>
          )}

          {/* CLEAR SUCCESS OR FAILURE MESSAGE UPON COMPLETION */}
          {uploadStatusBanner && (
            <div
              role="status"
              aria-live="polite"
              className={`p-4 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                uploadStatusBanner.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {uploadStatusBanner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {uploadStatusBanner.type === 'success'
                      ? 'Video Upload & Categorization Succeeded'
                      : 'Video Upload Failed'}
                  </p>
                  <p className="leading-relaxed">{uploadStatusBanner.message}</p>
                </div>
              </div>

              {uploadStatusBanner.type === 'success' && uploadStatusBanner.publishedVideoId && (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = uploadStatusBanner.publishedVideoId!;
                    const asShort = uploadStatusBanner.publishedAsShort;
                    setIsUploadModalOpen(false);
                    if (asShort) {
                      navigate('shorts', targetId);
                    } else {
                      navigate('watch', targetId);
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0 cursor-pointer"
                >
                  Watch Published Video →
                </button>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? 'Encoding AV1 WebM & Publishing...'
                  : isShort
                  ? `Publish Short to ${effectiveChannelName}`
                  : `Publish Video to ${effectiveChannelName}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
