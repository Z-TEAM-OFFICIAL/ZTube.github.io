import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Video,
  Megaphone,
  KeyRound,
  Sliders,
  Trash2,
  Edit3,
  RefreshCw,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Palette,
  Gavel,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VideoItem, PlayerColorTheme } from '../types';
import { VideoDownloadApiConsole } from './DocsTutorialCursorAndDownload';

export const AdminPanelPage: React.FC = () => {
  const {
    user,
    videos,
    comments,
    siteSettings,
    updateSiteSettings,
    updateVideo,
    deleteVideo,
    setIsUploadModalOpen,
    navigate,
    rgbCursorEnabled,
    setRgbCursorEnabled,
    replayTutorial,
    playerColorTheme,
    setPlayerColorTheme,
    dynamicBackgroundEnabled,
    setDynamicBackgroundEnabled,
    dynamicBackgroundAudioReactive,
    setDynamicBackgroundAudioReactive,
    dynamicBackgroundAutoDisabledReason,
    publicHmacId,
    refreshPublicHmacId,
  } = useApp();

  const [activeSection, setActiveSection] = useState<
    'rbac-security' | 'analytics' | 'videos' | 'ads' | 'api-sync' | 'features'
  >('rbac-security');

  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Engineering');

  // Quick YouTube Import inside Admin
  const [quickYtUrl, setQuickYtUrl] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Server-Side RBAC Admin Role, MFA, Audit Logs, Strikes & Staging Guard State
  const [adminSession, setAdminSession] = useState<{
    isAdmin: boolean;
    role: string | null;
    permissions: string[];
    mfaRequired: boolean;
    mfaVerified: boolean;
    mfaDemoHintCode?: string;
    stagingMode: boolean;
    publicHmacId: string;
    secretVersion: string;
  } | null>(null);
  const [mfaCodeInput, setMfaCodeInput] = useState('482910');
  const [auditReasonInput, setAuditReasonInput] = useState(
    'Routine compliance & policy review'
  );
  const [strikeVideoId, setStrikeVideoId] = useState('');
  const [strikeReason, setStrikeReason] = useState(
    'Copyright / Community Policy Violation'
  );
  const [appealStrikeId, setAppealStrikeId] = useState('');
  const [appealText, setAppealText] = useState(
    'We hold licensed distribution rights and creator opt-in documentation.'
  );
  const [strikesList, setStrikesList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [adminFeedback, setAdminFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchAdminSessionAndStrikes = async () => {
    try {
      const [sessRes, strikesRes] = await Promise.all([
        fetch('/api/admin/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user?.uid || 'admin',
            email: user?.email || '',
          }),
        }),
        fetch('/api/admin/strikes'),
      ]);
      if (sessRes.ok) {
        const data = await sessRes.json();
        setAdminSession(data);
      }
      if (strikesRes.ok) {
        const sData = await strikesRes.json();
        setStrikesList(Array.isArray(sData.strikes) ? sData.strikes : []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAdminSessionAndStrikes();
  }, [user?.uid, user?.email]);

  const handleVerifyAdminMfa = async () => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          reason: auditReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ type: 'error', text: data.error || 'MFA verification failed.' });
      } else {
        setAdminFeedback({
          type: 'success',
          text: `MFA verified for role "${data.role}". Least-privilege RBAC unlocked & audit-logged.`,
        });
        await fetchAdminSessionAndStrikes();
      }
    } catch (err: any) {
      setAdminFeedback({ type: 'error', text: err.message || 'MFA error' });
    }
  };

  const handleIssueVideoStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);
    const targetVid = videos.find((v) => v.id === strikeVideoId) || videos[0];
    if (!targetVid) return;
    try {
      const res = await fetch('/api/admin/strikes/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          videoId: targetVid.id,
          videoTitle: targetVid.title,
          reason: strikeReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ type: 'error', text: data.error || 'Failed to issue strike.' });
      } else {
        setStrikesList(Array.isArray(data.strikes) ? data.strikes : []);
        setAdminFeedback({
          type: 'success',
          text: `Issued appealable video strike (${data.strike.id}) on "${targetVid.title}" and recorded audit log.`,
        });
      }
    } catch (err: any) {
      setAdminFeedback({ type: 'error', text: err.message || 'Strike error' });
    }
  };

  const handleSubmitStrikeAppeal = async (strikeId: string) => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/strikes/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strikeId,
          appealReason: appealText,
          uid: user?.uid || 'creator',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStrikesList(Array.isArray(data.strikes) ? data.strikes : []);
        setAdminFeedback({
          type: 'success',
          text: `Appeal submitted for strike ${strikeId}. Status updated to appeal_submitted.`,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleResolveStrikeAppeal = async (
    strikeId: string,
    resolution: 'appeal_upheld_removed' | 'appeal_rejected'
  ) => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/strikes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          strikeId,
          resolution,
          reason: auditReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ type: 'error', text: data.error || 'Resolution failed.' });
      } else {
        setStrikesList(Array.isArray(data.strikes) ? data.strikes : []);
        setAdminFeedback({
          type: 'success',
          text: `Strike ${strikeId} resolved as ${resolution} and audit-logged.`,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleAdminRemoveAdSlot = async (slotName: string, settingKey: keyof typeof siteSettings) => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/ads/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          adSlotId: slotName,
          reason: auditReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ type: 'error', text: data.error || 'Ad removal denied.' });
      } else {
        await updateSiteSettings({ [settingKey]: false });
        setAdminFeedback({
          type: 'success',
          text: `Removed advertisement slot "${slotName}" and logged action in Admin Audit Log.`,
        });
      }
    } catch (err: any) {
      setAdminFeedback({ type: 'error', text: err.message });
    }
  };

  const handleAttemptEditSubOrLikeCount = async (metricType: 'subscribers' | 'likes') => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/metrics/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          targetId: 'channel_or_video',
          metricType,
          newValue: 99999,
          reason: auditReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({
          type: 'error',
          text: data.error || 'Blocked in production environment.',
        });
      } else {
        setAdminFeedback({
          type: 'success',
          text: `[STAGING ONLY] ${metricType} override simulated and audit-logged.`,
        });
      }
    } catch (err: any) {
      setAdminFeedback({ type: 'error', text: err.message });
    }
  };

  const handleToggleStagingEnvironment = async () => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/environment/toggle-staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          stagingMode: !adminSession?.stagingMode,
          reason: auditReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ type: 'error', text: data.error });
      } else {
        await fetchAdminSessionAndStrikes();
        setAdminFeedback({
          type: 'success',
          text: `Environment switched to ${data.stagingMode ? 'STAGING' : 'PRODUCTION'} and audit-logged.`,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleFetchScopedAuditLogs = async () => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/audit-logs/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          reason: auditReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ type: 'error', text: data.error || 'Audit log query denied.' });
      } else {
        setAuditLogsList(Array.isArray(data.logs) ? data.logs : []);
        setAdminFeedback({
          type: 'success',
          text: `Scoped metadata access granted (reason logged). Loaded ${data.logs?.length || 0} audit records.`,
        });
      }
    } catch (err: any) {
      setAdminFeedback({ type: 'error', text: err.message });
    }
  };

  const handleRotateHmacSecret = async () => {
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/identity/rotate-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: mfaCodeInput,
          reason: auditReasonInput || 'Periodic HMAC-SHA-256 secret rotation',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ type: 'error', text: data.error || 'Secret rotation failed.' });
      } else {
        await refreshPublicHmacId();
        await fetchAdminSessionAndStrikes();
        setAdminFeedback({
          type: 'success',
          text: `Rotated server HMAC-SHA-256 secret to version ${data.activeVersion}. Public identifiers updated without exposing server UUIDv7+.`,
        });
      }
    } catch (err: any) {
      setAdminFeedback({ type: 'error', text: err.message });
    }
  };

  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
  const totalLikes = videos.reduce((acc, v) => acc + v.likes, 0);
  const activeAdsCount =
    (siteSettings.adRow1LeftActive ? 1 : 0) +
    (siteSettings.adRow2MiddleActive ? 1 : 0) +
    (siteSettings.adRow3RightActive ? 1 : 0);

  const startEditingVideo = (v: VideoItem) => {
    setEditingVideoId(v.id);
    setEditTitle(v.title);
    setEditCategory(v.category);
  };

  const saveVideoEdit = async (id: string) => {
    await updateVideo(id, { title: editTitle, category: editCategory });
    setEditingVideoId(null);
  };

  const dailyTrafficSeries = [
    { day: 'Mon', views: 41200, watchHours: 3120, ctr: '6.4%', rpm: '$8.40' },
    { day: 'Tue', views: 53800, watchHours: 4290, ctr: '7.1%', rpm: '$9.10' },
    { day: 'Wed', views: 48900, watchHours: 3810, ctr: '6.8%', rpm: '$8.85' },
    { day: 'Thu', views: 64100, watchHours: 5140, ctr: '7.9%', rpm: '$9.60' },
    { day: 'Fri', views: 72400, watchHours: 6020, ctr: '8.3%', rpm: '$10.20' },
    { day: 'Sat', views: 88900, watchHours: 7490, ctr: '8.9%', rpm: '$11.05' },
    { day: 'Sun', views: 94200, watchHours: 8110, ctr: '9.2%', rpm: '$11.40' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <p className="text-xs font-mono text-neutral-500">
            Admin Console / Site-Wide Governance & Analytics
          </p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
            ZTube Studio & Platform Administration
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import / Upload Video</span>
          </button>
          <button
            onClick={() => navigate('blueprint')}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            View Laravel Tech Spec
          </button>
        </div>
      </div>

      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417]">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Total Platform Views (28d)
          </span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
            {totalViews.toLocaleString()}
          </p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            +18.4% vs previous 28 days
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417]">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Indexed Videos & Likes
          </span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
            {videos.length} Videos · {totalLikes.toLocaleString()} Likes
          </p>
          <span className="text-xs text-neutral-500 font-mono mt-1 block">
            {comments.length} Active Discussions
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417]">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            3-Column Grid Ad Placements
          </span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums mt-1">
            {activeAdsCount} / 3 Active Slots
          </p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 block">
            Row 1 Left · Row 2 Mid · Row 3 Right
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417]">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            YouTube Data API v3 Sync Status
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            Connected
          </p>
          <span className="text-xs text-neutral-500 font-mono mt-1 block">
            Channel: {siteSettings.youtubeSyncChannelHandle || '@LaravelCreatorsOfficial'}
          </span>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 w-fit">
        <button
          onClick={() => setActiveSection('rbac-security')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSection === 'rbac-security'
              ? 'bg-[#FF0033] text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Identity, RBAC, MFA, Strikes & Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveSection('analytics')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSection === 'analytics'
              ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>YouTube Analytics</span>
        </button>

        <button
          onClick={() => setActiveSection('ads')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSection === 'ads'
              ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Advertisement Controls (3-Row Grid)</span>
        </button>

        <button
          onClick={() => setActiveSection('videos')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSection === 'videos'
              ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Full Video Management</span>
        </button>

        <button
          onClick={() => setActiveSection('api-sync')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSection === 'api-sync'
              ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>YouTube Data API & Sync</span>
        </button>

        <button
          onClick={() => setActiveSection('features')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSection === 'features'
              ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>One-Click Feature Toggles</span>
        </button>
      </div>

      {adminFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            adminFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <span>{adminFeedback.text}</span>
          <button
            onClick={() => setAdminFeedback(null)}
            className="underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 0: Identity & Security (UUIDv7+, Rotated HMAC-SHA-256, Least-Privilege RBAC, MFA, Strikes & Audit Logs) */}
      {activeSection === 'rbac-security' && (
        <div className="space-y-6">
          {/* Top Identity & MFA Gate Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    UUIDv7+ Server Vault & Versioned HMAC-SHA-256 Public IDs
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold">
                  NO RAW SHA-512
                </span>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed">
                User UUIDs are random <strong>UUIDv7+</strong> (enhanced UUIDv7 with monotonic sub-millisecond counter + CSPRNG entropy), stored strictly server-side and <strong>never exposed to clients</strong>. Public-facing identifiers are derived as{' '}
                <code className="font-mono text-[#FF0033]">
                  HMAC-SHA-256(UUID, server_secret)
                </code>{' '}
                with a version prefix (<code className="font-mono">{adminSession?.secretVersion || 'v1'}</code>) and rotated periodically.
              </p>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Internal Server UUIDv7+:</span>
                  <span className="text-red-500 font-bold">
                    [REDACTED SERVER-SIDE ONLY — NEVER SENT TO CLIENT]
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-neutral-500">Derived Public Identifier:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
                    {publicHmacId}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateHmacSecret}
                  className="px-3.5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
                >
                  Rotate HMAC-SHA-256 Server Secret Version
                </button>
              </div>
            </div>

            {/* Server-Side RBAC Admin Role, MFA & Mandatory Logged Reason */}
            <div className="lg:col-span-6 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Server-Side RBAC Role Table & Mandatory MFA Gate
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Keyed by server UUIDv7+. Admin list is never sent to client; no endpoint enumerates admins.
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold ${
                    adminSession?.mfaVerified
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}
                >
                  {adminSession?.mfaVerified
                    ? `MFA VERIFIED (${adminSession.role})`
                    : 'MFA REQUIRED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-1">
                    6-Digit TOTP MFA Code (Demo: {adminSession?.mfaDemoHintCode || '482910'})
                  </label>
                  <input
                    type="text"
                    value={mfaCodeInput}
                    onChange={(e) => setMfaCodeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 font-mono text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">
                    Mandatory Audit Reason (Required for All Admin Actions)
                  </label>
                  <input
                    type="text"
                    value={auditReasonInput}
                    onChange={(e) => setAuditReasonInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyAdminMfa}
                  className="px-4 py-2 rounded-lg bg-[#FF0033] hover:bg-[#D9002B] text-white text-xs font-bold cursor-pointer"
                >
                  Verify Admin MFA & Log Session
                </button>
                <button
                  type="button"
                  onClick={handleFetchScopedAuditLogs}
                  className="px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-900 dark:text-white cursor-pointer"
                >
                  Query Scoped Audit Logs (Requires Reason)
                </button>
              </div>
            </div>
          </div>

          {/* Appeals-able Video Strikes + Production vs Staging Subscriber/Like Guard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[#FF0033]" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Appealable Video Strikes & Admin Ad Removal
                  </h2>
                </div>
                <span className="text-xs font-mono text-neutral-500">
                  {strikesList.length} Strikes Logged
                </span>
              </div>

              <form onSubmit={handleIssueVideoStrike} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <select
                  value={strikeVideoId}
                  onChange={(e) => setStrikeVideoId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  placeholder="Strike reason..."
                  className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#FF0033] text-white font-bold cursor-pointer"
                >
                  Issue Appealable Strike
                </button>
              </form>

              {/* Quick Audit-Logged Ad Removal Buttons */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-neutral-500 font-semibold">Audit-Logged Ad Removal:</span>
                <button
                  type="button"
                  onClick={() => handleAdminRemoveAdSlot('Row_1_Left_Ad', 'adRow1LeftActive')}
                  className="px-2.5 py-1 rounded bg-red-500/15 text-red-500 font-semibold cursor-pointer"
                >
                  Remove Row 1 Ad
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminRemoveAdSlot('Row_2_Middle_Ad', 'adRow2MiddleActive')}
                  className="px-2.5 py-1 rounded bg-red-500/15 text-red-500 font-semibold cursor-pointer"
                >
                  Remove Row 2 Ad
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminRemoveAdSlot('Row_3_Right_Ad', 'adRow3RightActive')}
                  className="px-2.5 py-1 rounded bg-red-500/15 text-red-500 font-semibold cursor-pointer"
                >
                  Remove Row 3 Ad
                </button>
              </div>

              {/* Active Strikes & Creator Appeals Table */}
              {strikesList.length > 0 && (
                <div className="space-y-2 pt-2">
                  {strikesList.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {st.videoTitle} ({st.id})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono text-[10px] font-bold">
                          {st.status}
                        </span>
                      </div>
                      <p className="text-neutral-500">Reason: {st.reason}</p>
                      {st.appealReason && (
                        <p className="text-sky-500 font-medium">
                          Creator Appeal: &ldquo;{st.appealReason}&rdquo;
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {st.status === 'active_strike' && (
                          <button
                            type="button"
                            onClick={() => handleSubmitStrikeAppeal(st.id)}
                            className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-500 font-semibold cursor-pointer"
                          >
                            Submit Creator Appeal
                          </button>
                        )}
                        {st.status === 'appeal_submitted' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleResolveStrikeAppeal(st.id, 'appeal_upheld_removed')
                              }
                              className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-500 font-semibold cursor-pointer"
                            >
                              Approve Appeal (Remove Strike)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleResolveStrikeAppeal(st.id, 'appeal_rejected')
                              }
                              className="px-2.5 py-1 rounded bg-red-500/20 text-red-500 font-semibold cursor-pointer"
                            >
                              Reject Appeal
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Production Lock on Subscriber / Like Counts vs Staging Environment */}
            <div className="lg:col-span-5 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Production Subscriber/Like Lock
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                    adminSession?.stagingMode
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                  }`}
                >
                  ENV: {adminSession?.stagingMode ? 'STAGING' : 'PRODUCTION (LOCKED)'}
                </span>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed">
                <strong>Policy Enforcement:</strong> Admins <strong>cannot edit subscriber or like counts in production</strong> — that capability exists only in a staging environment. Every attempt is audit-logged with actor, target, reason, and timestamp.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAttemptEditSubOrLikeCount('subscribers')}
                  className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-[#27272A] text-neutral-900 dark:text-white text-xs font-semibold cursor-pointer"
                >
                  Test Edit Subscriber Count
                </button>
                <button
                  type="button"
                  onClick={() => handleAttemptEditSubOrLikeCount('likes')}
                  className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-[#27272A] text-neutral-900 dark:text-white text-xs font-semibold cursor-pointer"
                >
                  Test Edit Like Count
                </button>
                <button
                  type="button"
                  onClick={handleToggleStagingEnvironment}
                  className="px-3 py-2 rounded-lg border border-amber-500/50 text-amber-500 text-xs font-semibold cursor-pointer"
                >
                  Toggle Staging / Production Mode
                </button>
              </div>

              {/* Scoped Admin Audit Log Viewer */}
              {auditLogsList.length > 0 && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5 max-h-48 overflow-y-auto">
                  <span className="text-[11px] font-mono font-bold text-neutral-500 block">
                    Immutable Admin Audit Log ({auditLogsList.length} entries):
                  </span>
                  {auditLogsList.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono space-y-0.5"
                    >
                      <div className="flex justify-between text-neutral-900 dark:text-white font-bold">
                        <span>{log.action}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-neutral-500">
                        Actor: {log.actorPublicId?.slice(0, 18)}... · Role: {log.actorRole} · Target: {log.target}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400">Reason: {log.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Analytics Visualization (Google/YouTube Analytics Style) */}
      {activeSection === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  7-Day Audience Retention & Watch Time Velocity
                </h2>
                <p className="text-xs text-neutral-500">
                  Real-time telemetry across Home Feed, Trending, and Embedded Players
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-500 font-semibold">
                Avg CTR: 7.8% · RPM: $9.80
              </span>
            </div>

            {/* Clean SVG Bar/Area Visualization */}
            <div className="pt-4 pb-2">
              <div className="grid grid-cols-7 gap-3 items-end h-44 pt-6 px-2 border-b border-neutral-200 dark:border-neutral-800">
                {dailyTrafficSeries.map((item) => {
                  const heightPercent = Math.round((item.views / 100000) * 100);
                  return (
                    <div key={item.day} className="flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-mono tabular-nums text-neutral-500">
                        {(item.views / 1000).toFixed(1)}k
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-[#FF0033]/80 to-[#FF0033] transition-all"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7 gap-3 pt-2 text-center">
                {dailyTrafficSeries.map((item) => (
                  <span key={item.day} className="text-xs font-mono text-neutral-500">
                    {item.day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Daily Revenue & Impression Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                    <th className="py-2 font-medium">Day</th>
                    <th className="py-2 font-medium text-right">Views</th>
                    <th className="py-2 font-medium text-right">Watch Hrs</th>
                    <th className="py-2 font-medium text-right">CTR</th>
                    <th className="py-2 font-medium text-right">Ad RPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono tabular-nums">
                  {dailyTrafficSeries.map((row) => (
                    <tr key={row.day} className="hover:bg-neutral-50 dark:hover:bg-[#18181B]">
                      <td className="py-2.5 font-sans font-medium text-neutral-900 dark:text-white">
                        {row.day}
                      </td>
                      <td className="py-2.5 text-right text-neutral-700 dark:text-neutral-300">
                        {row.views.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-neutral-700 dark:text-neutral-300">
                        {row.watchHours.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                        {row.ctr}
                      </td>
                      <td className="py-2.5 text-right text-neutral-900 dark:text-white font-semibold">
                        {row.rpm}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Advertisement Controls (3-Column Grid Placement Logic) */}
      {activeSection === 'ads' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                YouTube 3-Column Grid Advertisement Matrix
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Each row contains 3 items (videos or ads) maintaining visual balance. Toggle any slot below to immediately update the Home Feed.
              </p>
            </div>
            <button
              onClick={() => navigate('home')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer"
            >
              Preview Live Feed Grid
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Slot 1: Row 1 Top-Left (AdSense) */}
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-[#FF0033] font-semibold">
                    SLOT 1 · ROW 1, TOP-LEFT (INDEX 0)
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                    Google AdSense Primary Unit
                  </h3>
                </div>
                <button
                  onClick={() =>
                    updateSiteSettings({ adRow1LeftActive: !siteSettings.adRow1LeftActive })
                  }
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    siteSettings.adRow1LeftActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {siteSettings.adRow1LeftActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-1">Ad Headline</label>
                  <input
                    type="text"
                    value={siteSettings.adRow1Title}
                    onChange={(e) => updateSiteSettings({ adRow1Title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">AdSense Network / Sponsor Label</label>
                  <input
                    type="text"
                    value={siteSettings.adRow1Sponsor}
                    onChange={(e) => updateSiteSettings({ adRow1Sponsor: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Slot 2: Row 2 Middle (Sponsored Ad) */}
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-amber-500 font-semibold">
                    SLOT 2 · ROW 2, MIDDLE (INDEX 4)
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                    Direct Sponsored Partner Unit
                  </h3>
                </div>
                <button
                  onClick={() =>
                    updateSiteSettings({ adRow2MiddleActive: !siteSettings.adRow2MiddleActive })
                  }
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    siteSettings.adRow2MiddleActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {siteSettings.adRow2MiddleActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-1">Campaign Headline</label>
                  <input
                    type="text"
                    value={siteSettings.adRow2Title}
                    onChange={(e) => updateSiteSettings({ adRow2Title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Sponsor Brand Name</label>
                  <input
                    type="text"
                    value={siteSettings.adRow2Sponsor}
                    onChange={(e) => updateSiteSettings({ adRow2Sponsor: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Slot 3: Row 3 Right (AdSense) */}
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-sky-500 font-semibold">
                    SLOT 3 · ROW 3, RIGHT (INDEX 8)
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                    Google AdSense Right-Column Unit
                  </h3>
                </div>
                <button
                  onClick={() =>
                    updateSiteSettings({ adRow3RightActive: !siteSettings.adRow3RightActive })
                  }
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    siteSettings.adRow3RightActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {siteSettings.adRow3RightActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-1">Ad Headline</label>
                  <input
                    type="text"
                    value={siteSettings.adRow3Title}
                    onChange={(e) => updateSiteSettings({ adRow3Title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">AdSense Network / Sponsor Label</label>
                  <input
                    type="text"
                    value={siteSettings.adRow3Sponsor}
                    onChange={(e) => updateSiteSettings({ adRow3Sponsor: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Full Video Management Table */}
      {activeSection === 'videos' && (
        <div className="space-y-5">
          <VideoDownloadApiConsole />
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Video Catalog Management ({videos.length} Total Videos)
            </h2>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF0033] text-white cursor-pointer"
            >
              + Import New Video
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 bg-neutral-50 dark:bg-[#18181B]">
                  <th className="py-3 px-4 font-medium">Video Title</th>
                  <th className="py-3 px-4 font-medium">Creator</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium text-right">Duration</th>
                  <th className="py-3 px-4 font-medium text-right">Views</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50 dark:hover:bg-[#18181B]">
                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white max-w-md">
                      {editingVideoId === v.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-neutral-100 dark:bg-black border border-neutral-300 dark:border-neutral-700"
                        />
                      ) : (
                        <button
                          onClick={() => navigate('watch', v.id)}
                          className="flex items-center gap-2.5 text-left hover:text-[#FF0033] transition-colors cursor-pointer"
                        >
                          {v.thumbnailUrl && (
                            <img
                              src={v.thumbnailUrl}
                              alt={v.title}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-12 h-7 rounded object-cover shrink-0 bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                            />
                          )}
                          <span className="line-clamp-1">{v.title}</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-2">
                        {v.authorAvatar ? (
                          <img
                            src={v.authorAvatar}
                            alt={`${v.authorName} avatar`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {v.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{v.authorName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {editingVideoId === v.id ? (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="px-2 py-1 rounded bg-neutral-100 dark:bg-black border border-neutral-300 dark:border-neutral-700"
                        >
                          <option value="Gaming">Gaming</option>
                          <option value="Tutorials">Tutorials</option>
                          <option value="Music">Music</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Travel">Travel</option>
                          <option value="Culinary">Culinary</option>
                          <option value="Design">Design</option>
                          <option value="Science">Science</option>
                        </select>
                      ) : (
                        v.category
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-500">
                      {v.duration}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                      {v.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {editingVideoId === v.id ? (
                          <button
                            onClick={() => saveVideoEdit(v.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditingVideo(v)}
                            title="Edit Video"
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteVideo(v.id)}
                          title="Delete Video"
                          className="p-1.5 text-neutral-500 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* SECTION 4: YouTube Data API v3 Integration & Sync Controls */}
      {activeSection === 'api-sync' && (
        <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-5">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              YouTube Data API v3 Sync Engine & Channel Import Controls
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Server-side credentials are managed securely via environment secrets. Configure target channel handles and trigger manual metadata sync jobs below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-3">
              <span className="font-semibold text-neutral-900 dark:text-white block">
                Target YouTube Channel Handle for Auto-Import
              </span>
              <input
                type="text"
                value={siteSettings.youtubeSyncChannelHandle || '@LaravelCreatorsOfficial'}
                onChange={(e) =>
                  updateSiteSettings({ youtubeSyncChannelHandle: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-500">Cron Schedule (Laravel Task Scheduler)</span>
                <span className="font-mono text-emerald-500">Every 15 Minutes</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-3">
              <span className="font-semibold text-neutral-900 dark:text-white block">
                Test Instant YouTube Metadata Sync
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickYtUrl}
                  onChange={(e) => setQuickYtUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    setSyncMessage('Opening Video Sync Studio with YouTube metadata pre-loader...');
                    setTimeout(() => {
                      setSyncMessage(null);
                      setIsUploadModalOpen(true);
                    }, 500);
                  }}
                  className="px-4 py-2 rounded-lg font-semibold bg-[#FF0033] text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Open Sync Studio</span>
                </button>
              </div>
              {syncMessage && (
                <p className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{syncMessage}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: One-Click Site-Wide Feature Toggles */}
      {activeSection === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: 'enableComments' as const,
              title: 'Public Comments System',
              desc: 'Allow authenticated viewers to post, polish, and read comments under videos.',
            },
            {
              key: 'enableUploads' as const,
              title: 'Creator Video Uploads & YouTube Imports',
              desc: 'Show the Upload / Sync button in the top navigation bar.',
            },
            {
              key: 'enableAiAnalysis' as const,
              title: 'Gemini Pro Video Analysis & Grounding Hub',
              desc: 'Enable Gemini 3.1 Pro video chaptering, Google Search fact-checking, and Google Maps location grounding.',
            },
            {
              key: 'enableYoutubeAutoSync' as const,
              title: 'Automated YouTube Metadata Sync',
              desc: 'Automatically fetch thumbnail, tags, title, and description when importing YouTube URLs.',
            },
          ].map((feat) => {
            const enabled = siteSettings[feat.key];
            return (
              <div
                key={feat.key}
                className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {feat.desc}
                  </p>
                </div>
                <button
                  onClick={() => updateSiteSettings({ [feat.key]: !enabled })}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            );
          })}

          {/* Optional RGB Tri-Button Cursor & Replay Tutorial Settings Cards */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Optional Custom RGB Cursor (Green Left · Blue Scroll-Wheel · Red Right)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Displays a custom tri-color mouse cursor and interactive scroll-wheel / right-click undo HUD.
              </p>
            </div>
            <button
              onClick={() => setRgbCursorEnabled(!rgbCursorEnabled)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                rgbCursorEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {rgbCursorEnabled ? 'RGB Cursor ON' : 'Default Cursor'}
            </button>
          </div>

          {/* Global Site Setting: Video Player Color Theme (Neon Green, Sunset Red, Midnight Blue) */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#58f01b]" />
                <span>Global Video Player Color Theme</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Applies globally to the custom video player interface (16:9 Widescreen Engine, 9:16 Shorts Engine & Mini-Player).
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'neon_green', label: 'Neon Green', dot: 'bg-[#58f01b]' },
                  { id: 'sunset_red', label: 'Sunset Red', dot: 'bg-[#FF0033]' },
                  { id: 'midnight_blue', label: 'Midnight Blue', dot: 'bg-[#38bdf8]' },
                ] as { id: PlayerColorTheme; label: string; dot: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPlayerColorTheme(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer ${
                    playerColorTheme === t.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Site Setting: Dynamic Background (2–5 Hz Frame Sampling + Audio-Reactive Mode) */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Optional Dynamic Background (2–5 Hz Frame Sampling · Default Off)
                </h3>
                {dynamicBackgroundAutoDisabledReason && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 font-mono text-[10px] font-bold">
                    Auto-Disabled: {dynamicBackgroundAutoDisabledReason}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Tints the player's surrounding background to the dominant colors of the current video frame, sampled at 3 Hz (2–5 Hz) with smooth 700ms (500ms+) transitions. Includes opt-in Audio-reactive energy mode with capped shift rate, fixed-contrast overlay, and automatic pause/off-screen/battery-saver/reduced-motion compliance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDynamicBackgroundEnabled(!dynamicBackgroundEnabled)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  dynamicBackgroundEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {dynamicBackgroundEnabled ? 'Dynamic Background: ON' : 'Dynamic Background: OFF'}
              </button>
              <button
                type="button"
                disabled={!dynamicBackgroundEnabled}
                onClick={() =>
                  setDynamicBackgroundAudioReactive(!dynamicBackgroundAudioReactive)
                }
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                  dynamicBackgroundAudioReactive && dynamicBackgroundEnabled
                    ? 'bg-[#FF0033] text-white'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {dynamicBackgroundAudioReactive ? 'Audio-Reactive: ON' : 'Audio-Reactive: OFF'}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Contextual Quick Tour & Onboarding Tutorial
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Replay the accessible, keyboard-navigable quick tour anytime.
              </p>
            </div>
            <button
              onClick={replayTutorial}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] text-white cursor-pointer shrink-0"
            >
              Replay Tutorial
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
