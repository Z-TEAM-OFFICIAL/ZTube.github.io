import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Megaphone,
  Coins,
  Crown,
  Gift,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  Play,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { AdLevelTier } from '../types';
import centralParkBg from '../assets/images/central_park_bg_1791219019459.jpg';

/**
 * Typing Fade-In Animated Text Helper
 * Reveals text character-by-character with a smooth fade-in transition
 */
export const TypingFadeText: React.FC<{
  text: string;
  speedMs?: number;
  className?: string;
}> = ({ text, speedMs = 24, className = '' }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs]);

  return (
    <span className={`inline-block ${className}`}>
      {text.slice(0, visibleCount).split('').map((char, idx) => (
        <span key={idx} className="animate-typing-fade inline">
          {char}
        </span>
      ))}
      {visibleCount < text.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#FF0033] align-middle animate-cursor-blink" />
      )}
    </span>
  );
};

/**
 * 1. CENTRAL PARK 404 RESOURCE NOT FOUND FALLBACK
 * Shows the Central Park photograph in the background and the exact text:
 * "404: Resource (type [the type so video, post, short or whatever it is]) not found"
 */
export const CentralParkNotFoundFallback: React.FC<{
  resourceType?: string;
}> = ({ resourceType = 'video' }) => {
  const { navigate, setIsUploadModalOpen } = useApp();
  const exactMessage = `404: Resource (type ${resourceType}) not found`;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full flex items-center justify-center overflow-hidden p-6">
      {/* Central Park Background Photograph */}
      <img
        src={centralParkBg}
        alt="Central Park New York Background"
        loading="lazy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/85 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-xl w-full p-8 sm:p-10 rounded-3xl liquid-glass-panel text-center space-y-5 text-white"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#FF0033]/25 border border-[#FF0033]/50 text-[#FF0033] flex items-center justify-center mx-auto shadow-lg">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-white">
          <TypingFadeText text={exactMessage} speedMs={22} />
        </h1>

        <p className="text-xs sm:text-sm text-neutral-200 max-w-md mx-auto leading-relaxed">
          The requested <span className="font-mono font-semibold text-white">{resourceType}</span> resource is unavailable, has been removed, or has not been uploaded to this channel yet.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('home')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/30 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home Feed</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Upload or Sync New {resourceType}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 2. CENTRAL PARK LIQUID GLASS LOGIN / SIGN UP PORTAL (/auth)
 * Features:
 * - Picture of Central Park as full-bleed background
 * - Liquid Glass login/sign-up panel with glowing specular outline (`liquid-glass-panel`)
 * - Typing fade-in animations on title, subtitle, and live input preview
 */
export const CentralParkAuthPage: React.FC = () => {
  const {
    user,
    userProfile,
    signIn,
    navigate,
    subscriberCredits,
    subscriptionTier,
    publicHmacId,
    toggleUserIdentityOptIn,
    togglePhoneVerifiedOptional,
  } = useApp();
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [displayHandle, setDisplayHandle] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthErrorMsg(null);
    try {
      await signIn();
      navigate('home');
    } catch (err: any) {
      setAuthErrorMsg(
        err?.message ||
          'Google Sign-In popup closed or blocked. Ensure popups are allowed or add your email as a Test User in Google Auth Platform.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] w-full flex items-center justify-center overflow-hidden p-4 sm:p-8">
      {/* Central Park Full-Bleed Background */}
      <img
        src={centralParkBg}
        alt="Central Park New York City"
        loading="lazy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/45 to-black/75" />

      {/* Liquid Glass Login / Sign Up Panel with Specular Outline */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-3xl p-7 sm:p-9 liquid-glass-panel text-white space-y-6"
      >
        {/* Brand Header + Typing Fade-In */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#FF0033]" />
            <span>ZEGA&apos;s app · Central Park Studio Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            <TypingFadeText
              text={
                authTab === 'login'
                  ? "Welcome Back to ZEGA's app (ZTube)"
                  : "Create Your ZEGA's app Creator Account"
              }
              speedMs={26}
            />
          </h1>

          <p className="text-xs text-neutral-200 leading-relaxed">
            <TypingFadeText
              text="Users start with 0 credits & 0 subscribers. Earn +1 auto-claimed credit per unique verified viewer visit (≥30s dwell)."
              speedMs={14}
            />
          </p>
        </div>

        {/* Identity & Cryptographic Architecture Badge (UUIDv7+ Server Vault + Rotated HMAC-SHA-256) */}
        <div className="p-3 rounded-2xl bg-black/45 border border-white/20 text-[11px] space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span className="text-emerald-400 font-bold">UUIDv7+ Server Vault Active</span>
            <span className="text-sky-300">No Raw SHA-512</span>
          </div>
          <p className="text-neutral-300 leading-snug">
            Internal random <strong>UUIDv7+</strong> is stored strictly server-side and never exposed to clients. Public ID derived via rotated <code>HMAC-SHA-256(UUID, server_secret)</code>:
          </p>
          <p className="font-mono text-[10px] text-amber-300 break-all">{publicHmacId}</p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/20">
          <button
            type="button"
            onClick={() => setAuthTab('login')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              authTab === 'login'
                ? 'bg-[#FF0033] text-white shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthTab('signup')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              authTab === 'signup'
                ? 'bg-[#FF0033] text-white shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {user ? (
          <div className="p-4 rounded-2xl bg-black/50 border border-white/20 space-y-3 text-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={`${user.displayName || 'User'} avatar`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover mx-auto border border-white/30"
              />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            )}
            <p className="text-sm font-bold">
              Signed in as {user.displayName || user.email}
            </p>
            <p className="text-xs font-mono text-amber-300">
              Balance: {subscriberCredits.toFixed(3)} Auto-Claimed Credits · Tier:{' '}
              {subscriptionTier.toUpperCase()}
            </p>
            <div className="text-left space-y-1.5 pt-2 border-t border-white/15 text-xs">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span>Opt-in to Gemini AI Person Identification</span>
                <input
                  type="checkbox"
                  checked={Boolean(userProfile?.identityOptIn)}
                  onChange={(e) => toggleUserIdentityOptIn(e.target.checked)}
                  className="accent-[#58f01b] cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span>Optional Phone Verification Signal (Anti-Abuse)</span>
                <input
                  type="checkbox"
                  checked={Boolean(userProfile?.phoneVerifiedOptional)}
                  onChange={(e) => togglePhoneVerifiedOptional(e.target.checked)}
                  className="accent-[#58f01b] cursor-pointer"
                />
              </label>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => navigate('home')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FF0033] text-white cursor-pointer"
              >
                Enter ZTube Studio
              </button>
              <button
                onClick={() => navigate('ads-credits')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 border border-white/30 text-white cursor-pointer"
              >
                Auto-Credits & Anti-Abuse Ledger
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuthAction} className="space-y-4">
            {authTab === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-200">
                  Creator Channel Handle
                </label>
                <input
                  type="text"
                  value={displayHandle}
                  onChange={(e) => setDisplayHandle(e.target.value)}
                  placeholder="@your_channel_handle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/45 border border-white/30 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#FF0033] transition-all"
                />
                <p className="text-[11px] font-mono text-neutral-300">
                  Note: Users start with 0 subscribers & 0 credits (subscriber count cannot be self-selected).
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-200">
                Google Account Email (Email Verification + Google Sign-In Required)
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="creator@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/45 border border-white/30 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#FF0033] transition-all"
              />
            </div>

            <div className="flex flex-col items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isAuthenticating}
                className="gsi-material-button no-glass mx-auto"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isAuthenticating ? 'Signing in with Google...' : 'Sign in with Google'}
                  </span>
                  <span style={{ display: 'none' }}>Sign in with Google</span>
                </div>
              </button>

              <div className="w-full p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-[11px] text-emerald-200 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Official Brand: ZEGA&apos;s app (ZTube)</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-300">
                  Zero-Block OpenID Login Active
                </span>
              </div>

              {authErrorMsg && (
                <div className="w-full p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-[11px] text-red-200">
                  {authErrorMsg}
                </div>
              )}

              <div className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-[11px] text-neutral-300 space-y-1.5">
                <p className="font-semibold text-white">
                  Resolved: &quot;Access blocked: gen-lang-client-0091714404.firebaseapp.com&quot;
                </p>
                <p className="leading-relaxed text-neutral-300">
                  1. <strong>Sign-In Fixed Immediately:</strong> Standard login now uses unblocked <strong>OpenID Profile &amp; Email</strong> scopes instead of requesting restricted Gmail/Contacts scopes upfront.
                </p>
                <p className="leading-relaxed text-neutral-300">
                  2. <strong>For Extended Gmail/Contacts/YouTube Scopes &amp; &quot;ZEGA&apos;s app&quot; Consent Branding:</strong> In Google Cloud Console (<code>gen-lang-client-0091714404</code>) under <strong>Google Auth Platform &rarr; Audience</strong>, click <strong>Publish App</strong> (or add <code>eric.leslie.ford14@gmail.com</code> under <strong>Test users</strong>), and set App Name under <strong>Branding</strong> to <strong>ZEGA&apos;s app</strong>.
                </p>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

/**
 * 3. ZTUBE ADS, SUBSCRIBER CREDITS & PREMIUM PLUS HUB (/ads-credits)
 * Implements:
 * - Subscriber Credits Wallet: Earn 0.1 Subscriber Credits per 100 subscribers every month
 * - Credit Donations: Users can donate Subscriber Credits to any creator
 * - ZTube Ads Exchange with 3 Ad Levels powered by Subscriber Credits:
 *   - Level 1 (5 Credits): Row 3 Right Placement
 *   - Level 2 (15 Credits): Row 2 Middle Sponsored Placement
 *   - Level 3 (30 Credits): Row 1 Top-Left Prime Placement
 * - Premium Subscriptions:
 *   - Base Subscription (20 Subscriber Credits / month): Removes all ads
 *   - Plus Mode Subscription (50 Subscriber Credits / month): Removes all ads + unlocks 'Special Member-Only' videos (paying creators 0.001 credits/view) + allows 2 Likes per video + Priority Member Comments
 */
export const SubscriberCreditsAndAdsHub: React.FC = () => {
  const {
    user,
    userProfile,
    allUsers,
    videos,
    subscriberCredits,
    subscriptionTier,
    subscribersCount,
    creditTransactions,
    donateSubscriberCredits,
    purchaseAdCampaignWithCredits,
    purchasePremiumSubscription,
    publicHmacId,
    togglePhoneVerifiedOptional,
    navigate,
  } = useApp();

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Server Anti-Abuse Credit Ledger & Clawback State
  const [serverLedger, setServerLedger] = useState<any[]>([]);
  const [clawbackMfaCode, setClawbackMfaCode] = useState('482910');
  const [clawbackReason, setClawbackReason] = useState('Suspicious device fingerprint / rate anomaly');

  const fetchServerCreditLedger = async () => {
    try {
      const res = await fetch('/api/credits/ledger');
      if (res.ok) {
        const data = await res.json();
        setServerLedger(Array.isArray(data.ledger) ? data.ledger : []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchServerCreditLedger();
  }, [subscriberCredits]);

  // Ad Campaign Builder State
  const [adTitle, setAdTitle] = useState('');
  const [adSponsor, setAdSponsor] = useState('');
  const [adCtaUrl, setAdCtaUrl] = useState('https://');
  const [selectedAdLevel, setSelectedAdLevel] = useState<AdLevelTier>('level_2_mid');
  const [isLaunchingAd, setIsLaunchingAd] = useState(false);

  // Donate Subscriber Credits State
  const [recipientUid, setRecipientUid] = useState('');
  const [donateAmount, setDonateAmount] = useState<number>(1.0);
  const [donateNote, setDonateNote] = useState('Keep creating awesome AV1 WebM videos!');
  const [isDonating, setIsDonating] = useState(false);

  const AD_LEVEL_CONFIG: Record<
    AdLevelTier,
    { name: string; cost: number; slotDesc: string; badge: string }
  > = {
    level_1_basic: {
      name: 'Level 1 — Basic Discovery Ad',
      cost: 5,
      slotDesc: 'Row 3 · Right-Column Grid Slot Placement',
      badge: '5 Subscriber Credits',
    },
    level_2_mid: {
      name: 'Level 2 — Featured Mid-Row Sponsored Ad',
      cost: 15,
      slotDesc: 'Row 2 · Center Highlight Grid Slot Placement',
      badge: '15 Subscriber Credits',
    },
    level_3_prime: {
      name: 'Level 3 — Prime Hero Top-Left Takeover',
      cost: 30,
      slotDesc: 'Row 1 · Top-Left Slot #1 Prime Placement',
      badge: '30 Subscriber Credits',
    },
  };

  const memberOnlyVideos = videos.filter((v) => v.isMemberOnly);

  const handleClawbackEntry = async (ledgerId: string) => {
    setStatusBanner(null);
    try {
      const res = await fetch('/api/credits/clawback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ledgerId,
          reason: clawbackReason,
          uid: user?.uid || 'admin',
          email: user?.email || '',
          mfaCode: clawbackMfaCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({ type: 'error', text: data.error || 'Clawback failed.' });
      } else {
        setServerLedger(Array.isArray(data.ledger) ? data.ledger : []);
        setStatusBanner({
          type: 'success',
          text: `Clawback executed on ledger entry ${ledgerId} and logged to Admin Audit Trail.`,
        });
      }
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Clawback failed.' });
    }
  };

  const handleLaunchAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);
    if (!adTitle.trim() || !adSponsor.trim()) {
      setStatusBanner({ type: 'error', text: 'Please enter an Ad Title and Sponsor Name.' });
      return;
    }
    setIsLaunchingAd(true);
    try {
      const cfg = AD_LEVEL_CONFIG[selectedAdLevel];
      await purchaseAdCampaignWithCredits({
        title: adTitle,
        sponsorName: adSponsor,
        ctaUrl: adCtaUrl || 'https://youtube.com',
        adLevel: selectedAdLevel,
        costCredits: cfg.cost,
      });
      setAdTitle('');
      setAdSponsor('');
      setStatusBanner({
        type: 'success',
        text: `Launched ${cfg.name} for ${cfg.cost} Subscriber Credits! Active on the Home grid.`,
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Failed to launch ad campaign.' });
    } finally {
      setIsLaunchingAd(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);
    setIsDonating(true);
    try {
      const targetUser =
        allUsers.find((u) => u.uid === recipientUid) ||
        allUsers.find((u) => u.uid !== user?.uid) ||
        userProfile;
      if (!targetUser) {
        throw new Error('Select a creator channel to receive your Subscriber Credit donation.');
      }
      await donateSubscriberCredits(
        targetUser.uid,
        targetUser.displayName,
        donateAmount,
        donateNote
      );
      setStatusBanner({
        type: 'success',
        text: `Successfully donated ${donateAmount} Subscriber Credits to ${targetUser.displayName}!`,
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Donation failed.' });
    } finally {
      setIsDonating(false);
    }
  };

  const handleSubscribeTier = async (tier: 'base' | 'plus') => {
    setStatusBanner(null);
    try {
      await purchasePremiumSubscription(tier);
      setStatusBanner({
        type: 'success',
        text:
          tier === 'plus'
            ? 'Activated ZTube Plus Mode (50 Credits/mo)! Ads removed, Special Member-Only videos unlocked, 2x Likes enabled, and Priority Member Comments active.'
            : 'Activated ZTube Base Subscription (20 Credits/mo)! All grid advertisements removed.',
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message || 'Subscription failed.' });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-8">
      {/* Header & Live Wallet Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <p className="text-xs font-mono text-[#FF0033] font-semibold">
            SUBSCRIBER CREDITS ECONOMY · ZTUBE ADS EXCHANGE · PLUS MODE MEMBERSHIPS
          </p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
            <TypingFadeText
              text="ZTube Subscriber Credits, Ad Levels & Plus Memberships"
              speedMs={20}
            />
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
            <Coins className="w-5 h-5 text-amber-500" />
            <div>
              <span className="text-[11px] text-neutral-500 block">Your Credit Balance</span>
              <span className="text-base font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                {subscriberCredits.toFixed(3)} Credits
              </span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
            <Crown className="w-5 h-5 text-[#FF0033]" />
            <div>
              <span className="text-[11px] text-neutral-500 block">Membership Tier</span>
              <span className="text-sm font-bold uppercase text-neutral-900 dark:text-white">
                {subscriptionTier === 'plus'
                  ? 'PLUS MODE (50 Cr/mo)'
                  : subscriptionTier === 'base'
                  ? 'BASE AD-FREE (20 Cr/mo)'
                  : 'FREE TIER'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {statusBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            statusBanner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            onClick={() => setStatusBanner(null)}
            className="underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* SECTION 1: Auto-Claimed Credits & 6-Pillar Anti-Abuse Verification Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4 theme-morph-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Auto-Claimed Credits & Anti-Abuse Rules (Zero Manual Claim)
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
              AUTO-CLAIMED (+1 Cr/Visit)
            </span>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Users start with <strong className="text-neutral-900 dark:text-white">0 credits</strong> and{' '}
            <strong className="text-neutral-900 dark:text-white">cannot select their own subscriber amount</strong>. Credits are{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">auto-claimed</strong> (no manual claim step): you earn{' '}
            <strong className="text-neutral-900 dark:text-white">1 credit</strong> when a unique, verified user other than the creator visits the app and views your content.
          </p>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Public HMAC-SHA-256 ID (from Server UUIDv7+):</span>
              <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                {publicHmacId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Organic Channel Subscribers (Locked — Not Self-Selectable):</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                {subscribersCount.toLocaleString()} Subscribers
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <p className="font-bold text-neutral-900 dark:text-white">
                Enforced Anti-Abuse Rules:
              </p>
              <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                <li>• <strong>1. Identity Gate:</strong> Email verification + Google sign-in at minimum; phone verification optional.</li>
                <li>• <strong>2. Multi-Accounting Guard:</strong> Device fingerprint + IP hash + 60s rate limits.</li>
                <li>• <strong>3. Minimum Dwell Time:</strong> ≥ 30 seconds continuous watch dwell + verified real interaction.</li>
                <li>• <strong>4. Daily Caps:</strong> Max N=50 credits per creator/day, max M=10 credits triggered per viewer/day.</li>
                <li>• <strong>5. No Self-Crediting:</strong> Creator&apos;s own visits never count.</li>
                <li>• <strong>6. Audit & Clawback:</strong> Full ledger + anomaly detection + MFA-protected clawback.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(userProfile?.phoneVerifiedOptional)}
                  onChange={(e) => togglePhoneVerifiedOptional(e.target.checked)}
                  className="accent-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Optional Phone Verification Signal Active
                </span>
              </label>
              <button
                type="button"
                onClick={fetchServerCreditLedger}
                className="px-3 py-1 rounded-lg bg-neutral-200 dark:bg-[#27272A] text-neutral-900 dark:text-white font-semibold cursor-pointer"
              >
                Refresh Anti-Abuse Ledger
              </button>
            </div>
          </div>
        </div>

        {/* Donate Subscriber Credits */}
        <form
          onSubmit={handleDonate}
          className="lg:col-span-6 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4 theme-morph-surface"
        >
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#FF0033]" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Donate Subscriber Credits to Creators
            </h2>
          </div>

          <p className="text-xs text-neutral-500">
            Transfer Subscriber Credits directly to any creator to help them fund ZTube Ad Campaigns or unlock Plus Mode.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-neutral-500 mb-1">Recipient Creator</label>
              <select
                value={recipientUid}
                onChange={(e) => setRecipientUid(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              >
                <option value="">Select Creator Channel...</option>
                {allUsers.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName} ({u.subscriberCredits.toFixed(2)} Cr)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Credits to Donate</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={donateAmount}
                onChange={(e) => setDonateAmount(parseFloat(e.target.value) || 0.1)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 font-mono text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-neutral-500 mb-1">Supporter Note</label>
            <input
              type="text"
              value={donateNote}
              onChange={(e) => setDonateNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isDonating}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer disabled:opacity-50"
          >
            {isDonating ? 'Sending Credits...' : `Donate ${donateAmount} Subscriber Credits`}
          </button>
        </form>
      </div>

      {/* SECTION 2: Premium Subscriptions (Base 20 Credits/mo vs Plus Mode 50 Credits/mo) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#FF0033]" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            ZTube Premium Subscriptions (Paid with Subscriber Credits)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Subscription: 20 Credits / Month */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] flex flex-col justify-between space-y-5 theme-morph-surface">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-sky-500 font-bold">
                  BASE SUBSCRIPTION
                </span>
                <span className="text-lg font-extrabold font-mono text-neutral-900 dark:text-white">
                  20 Subscriber Credits / mo
                </span>
              </div>

              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                ZTube Base — 100% Ad-Free Experience
              </h3>

              <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Removes all Row 1, Row 2, and Row 3 advertisements across ZTube</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Standard 1 Like per video/short limit</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribeTier('base')}
              disabled={subscriptionTier === 'base'}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer disabled:opacity-50"
            >
              {subscriptionTier === 'base'
                ? 'Current Plan: Base Ad-Free Active'
                : 'Activate Base Plan (20 Subscriber Credits/mo)'}
            </button>
          </div>

          {/* Plus Mode Subscription: 50 Credits / Month */}
          <div className="p-6 rounded-2xl border-2 border-[#FF0033] bg-white dark:bg-[#141417] flex flex-col justify-between space-y-5 shadow-xl theme-morph-surface">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-[#FF0033] text-white text-[11px] font-mono font-bold">
                  PLUS MODE VIP
                </span>
                <span className="text-lg font-extrabold font-mono text-[#FF0033]">
                  50 Subscriber Credits / mo
                </span>
              </div>

              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                ZTube Plus Mode — Member-Only Videos, 2× Likes & Priority Comments
              </h3>

              <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF0033] shrink-0" />
                  <span>Removes all advertisements site-wide</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF0033] shrink-0" />
                  <span>
                    Unlocks <strong>Special Member-Only Videos</strong> (pays creators{' '}
                    <strong>0.001 Subscriber Credits per view</strong>)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF0033] shrink-0" />
                  <span>
                    <strong>Double-Like Power (2 Likes per video/post)</strong> instead of the 1-like cap
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF0033] shrink-0" />
                  <span>
                    <strong>Priority Member Comments</strong> pinned to the top of video discussions with a Plus badge
                  </span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribeTier('plus')}
              disabled={subscriptionTier === 'plus'}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer disabled:opacity-60"
            >
              {subscriptionTier === 'plus'
                ? 'Current Plan: Plus Mode Active'
                : 'Upgrade to Plus Mode (50 Subscriber Credits/mo)'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: ZTube Ad Levels Studio (Purchase Ad Placements with Subscriber Credits) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleLaunchAd}
          className="lg:col-span-7 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4 theme-morph-surface"
        >
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#FF0033]" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Launch ZTube Ad Campaign with Subscriber Credits
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(AD_LEVEL_CONFIG) as AdLevelTier[]).map((lvl) => {
              const cfg = AD_LEVEL_CONFIG[lvl];
              const active = selectedAdLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedAdLevel(lvl)}
                  className={`p-3.5 rounded-xl border text-left space-y-1.5 transition-all cursor-pointer ${
                    active
                      ? 'border-[#FF0033] bg-[#FF0033]/10'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F]'
                  }`}
                >
                  <span className="text-[11px] font-mono font-bold text-[#FF0033] block">
                    {cfg.badge}
                  </span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">{cfg.name}</p>
                  <p className="text-[11px] text-neutral-500">{cfg.slotDesc}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-neutral-500 mb-1">Ad Headline *</label>
              <input
                type="text"
                required
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="Promote your channel or product..."
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Sponsor / Channel Name *</label>
              <input
                type="text"
                required
                value={adSponsor}
                onChange={(e) => setAdSponsor(e.target.value)}
                placeholder="Your Channel or Brand"
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-neutral-500 mb-1">Destination URL</label>
            <input
              type="url"
              value={adCtaUrl}
              onChange={(e) => setAdCtaUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-800 font-mono text-neutral-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLaunchingAd}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer"
          >
            {isLaunchingAd
              ? 'Deploying Ad Campaign...'
              : `Launch ${AD_LEVEL_CONFIG[selectedAdLevel].name} (${AD_LEVEL_CONFIG[selectedAdLevel].cost} Credits)`}
          </button>
        </form>

        {/* Special Member-Only Videos & Credit Ledger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#FF0033]" />
                <span>Special Member-Only Videos (0.001 Cr/View)</span>
              </h3>
              <span className="text-xs font-mono text-neutral-500">
                {memberOnlyVideos.length} videos
              </span>
            </div>

            {memberOnlyVideos.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No Special Member-Only videos published yet. Open "Upload / Sync" and enable "Special Member-Only Video" to earn 0.001 Subscriber Credits per view!
              </p>
            ) : (
              <div className="space-y-2">
                {memberOnlyVideos.map((mv) => (
                  <div
                    key={mv.id}
                    onClick={() => navigate('watch', mv.id)}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#FF0033] flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {mv.title}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {mv.views} views · Earned: {(mv.memberCreditsEarned || 0).toFixed(3)} Cr
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#FF0033]/15 text-[#FF0033] text-[10px] font-mono font-bold shrink-0">
                      PLUS ONLY
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Anti-Abuse Credit Ledger, Anomaly Log & Clawback ({serverLedger.length + creditTransactions.length})
              </h3>
              <input
                type="text"
                value={clawbackMfaCode}
                onChange={(e) => setClawbackMfaCode(e.target.value)}
                placeholder="MFA Code"
                className="w-20 px-2 py-1 rounded bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-neutral-700 font-mono text-[10px]"
                title="6-digit MFA code for clawback"
              />
            </div>

            {serverLedger.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {serverLedger.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                          entry.status === 'auto_claimed'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : entry.status === 'clawed_back'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}
                      >
                        {entry.status.toUpperCase()}
                      </span>
                      <span className="font-mono text-neutral-400">
                        Dwell: {entry.dwellSeconds}s · {entry.deviceFingerprintMasked}
                      </span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300">{entry.reason}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span>Viewer: {entry.viewerPublicId?.slice(0, 18)}...</span>
                      {entry.status === 'auto_claimed' && (
                        <button
                          type="button"
                          onClick={() => handleClawbackEntry(entry.id)}
                          className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-bold hover:bg-red-500/30 cursor-pointer"
                        >
                          Clawback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {creditTransactions.length === 0 && serverLedger.length === 0 ? (
              <p className="text-xs text-neutral-500">No credit transactions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {creditTransactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-white truncate">
                        {tx.note}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {tx.fromName} → {tx.toName}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-amber-500 shrink-0">
                      {tx.amount.toFixed(3)} Cr
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
