import React, { useState } from 'react';
import {
  Database,
  Server,
  Layout,
  GitBranch,
  HardDrive,
  Copy,
  Check,
  Download,
  Layers,
  Megaphone,
} from 'lucide-react';

export const TechnicalSpecPage: React.FC = () => {
  const [activeDocTab, setActiveDocTab] = useState<
    | 'architecture'
    | 'wireframes'
    | 'schema'
    | 'laravel-api'
    | 'ad-engine'
    | 'cpanel-deploy'
  >('architecture');
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const downloadMarkdownSpec = () => {
    const markdownContent = `# ZTube — Complete Modern Full-Stack (Laravel 12 / PHP 8.4 & React 19.3 / Vite 8.3 / TypeScript 7.0) Technical Specification

## 1. Modernized System Architecture & Latest Package Stack (2026 Edition)
- **Frontend Runtime & Build Stack**:
  - \`react\` & \`react-dom\` (\`^19.0.1\` / \`@types/react ^19.3.0\`) with Concurrent Suspense & Transitions
  - \`typescript\` (\`^7.0.2\`) with strict type checking
  - \`vite\` (\`^8.3.0\`) & \`@vitejs/plugin-react\` (\`^6.1.1\`)
  - \`tailwindcss\` (\`^4.3.3\`) & \`@tailwindcss/vite\` (\`^4.3.3\`) CSS-first engine
  - \`@google/genai\` (\`^2.4.0\`) Unified Google Gen AI SDK (using dynamic latest model aliases \`gemini-flash-latest\` & \`gemini-pro-latest\`)
  - \`firebase\` (\`^12.11.0\`) Firestore real-time synchronization & Google OAuth
  - \`recharts\` (\`^3.10.1\`) for View Velocity & engagement telemetry visualization
  - \`motion\` (\`^12.23.24\`) & \`lucide-react\` (\`^0.546.0\`)
- **Backend Tier**:
  - Node.js / Express (\`tsx ^4.21.0\`) + PHP 8.4 / Laravel 12 REST API reference architecture
- **Core Platform Capabilities**:
  - **Web Clipboard API 'Copy Link' on Every VideoCard**: One-click direct URL sharing (\`?watch=<videoId>\`) with instant visual confirmation and fallback support.
  - **Playlists & Optional Watch History**: Create public/private playlists, quick-add videos directly from any VideoCard or Watch page, share playlist links, and toggle Optional Watch History ON/OFF (pause or clear history anytime).
  - **Video Categorization & Real-Time Upload Progress**: Assign categories (\`Gaming\`, \`Tutorials\`, \`Music\`, \`Engineering\`, \`Hardware\`, \`Travel\`, \`Culinary\`, \`Design\`, \`Science\`, or custom categories) with category filtering on Home & Profile pages, plus a real-time 0%–100% upload progress bar with completion/failure banners.
  - **Timeline Hover-Preview Thumbnail**: Hovering over any video card's progress bar displays a floating static frame preview, timestamp, and chapter title.
  - **Global Player Color Themes & Dynamic Background**: Neon Green, Sunset Red, and Midnight Blue player themes; optional 2–5 Hz dominant-color frame sampling with 500ms+ transitions, opt-in Audio-Reactive mode, fixed-contrast overlays, and automatic pause/disable on pause, off-screen, background tab, low-end hardware, battery saver, or \`prefers-reduced-motion\`.
  - **Identity, Security & Anti-Abuse Subscriber Credits**: Server-side random UUIDv7+ vault with versioned \`HMAC-SHA-256(UUIDv7+, server_secret)\` public IDs (no raw SHA-512), MFA-enforced least-privilege RBAC Admin Console with audit logs, and auto-claimed +1 creator credits with anti-abuse verification (email + Google sign-in, device fingerprint + IP rate limits, 30s dwell time + interaction, daily caps, no self-crediting, and clawback ledger).
  - **Gemini Identification Guardrails**: Uses latest Gemini models to summarize videos and identify people strictly from creator cast/credits, IMDb/Wikidata/TMDB, public figures, or opted-in ZTube users (no private facial recognition), labeled \`AI-generated\` with source, confidence %, and dispute/removal controls.

## 2. Color Scheme & Typography Plan
- **Primary Brand Accent**: YouTube Crimson (\`#FF0033\`), Neon Green (\`#58F01B\`), & Midnight Sky (\`#38BDF8\`)
- **Dark Canvas**: Obsidian (\`#0F0F0F\`), Elevated Surface (\`#141417\`), Hairline Border (\`#27272A\`)
- **Light Canvas**: Crisp Alabaster (\`#F8FAFC\`), Surface (\`#FFFFFF\`), Slate Text (\`#0F172A\`)
- **Typography**:
  - Display Headings: \`Syne\` (600/700/800)
  - UI & Body Prose: \`Plus Jakarta Sans\` (400/500/600/700)
  - Telemetry, Timestamps & View Counts: \`JetBrains Mono\` (\`tabular-nums\`)

## 3. 3-Column YouTube Grid Advertisement Placement Logic
- **Row 1, Column 1 (Index 0)**: Google AdSense Ad replaces first video on top-left
- **Row 2, Column 2 (Index 4)**: Sponsored Ad placed in the middle of the second row
- **Row 3, Column 3 (Index 8)**: Google AdSense Ad on the right of the third row
- Automatically disabled for Base (20 Cr/mo) and Plus (50 Cr/mo) subscribers.

## 4. cPanel & Cloud Production Deployment Guide
1. Upload the Laravel 12 project root to \`/home/username/ztube_core\` (outside \`public_html\`).
2. Build the Vite 8.3 + React 19 bundle (\`npm run build\`) and copy \`dist/\` into \`/home/username/public_html\`.
3. Configure MySQL 8.4 / PostgreSQL 17 database and run \`php artisan migrate --force\`.
`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ZTube_Laravel_React_Technical_Specification.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const laravelMigrationCode = `<?php
// database/migrations/2026_10_05_000001_create_ztube_core_tables.php
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('uid', 128)->unique();
            $table->string('display_name', 100);
            $table->string('email', 150)->unique();
            $table->string('photo_url', 500)->nullable();
            $table->enum('role', ['user', 'admin'])->default('user');
            $table->unsignedBigInteger('subscribers_count')->default(0);
            $table->timestamps();
        });

        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->string('public_id', 64)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('youtube_id', 32)->nullable()->index();
            $table->string('title', 160);
            $table->text('description');
            $table->string('thumbnail_url', 600);
            $table->string('video_url', 600);
            $table->string('category', 64)->index();
            $table->json('tags')->nullable();
            $table->string('duration', 20)->default('00:00');
            $table->string('location_tag', 150)->nullable();
            $table->unsignedBigInteger('views')->default(0);
            $table->unsignedBigInteger('likes')->default(0);
            $table->timestamps();
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('text', 1500);
            $table->unsignedInteger('likes')->default(0);
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscriber_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('channel_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['subscriber_id', 'channel_id']);
        });

        Schema::create('ad_placements', function (Blueprint $table) {
            $table->id();
            $table->enum('slot_key', ['row1_left_adsense', 'row2_middle_sponsored', 'row3_right_adsense'])->unique();
            $table->boolean('is_active')->default(true);
            $table->string('headline', 120);
            $table->string('sponsor_label', 80);
            $table->string('cta_url', 300);
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->timestamps();
        });

        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50)->default('youtube_data_v3');
            $table->text('encrypted_key');
            $table->string('sync_channel_handle', 100)->nullable();
            $table->boolean('auto_sync_enabled')->default(true);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }
};`;

  const laravelControllerCode = `<?php
// app/Http/Controllers/Api/VideoSyncController.php
namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Video;
use App\\Models\\ApiKey;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Str;

class VideoSyncController extends Controller
{
    /**
     * POST /api/v1/videos/youtube-sync
     * Automatically syncs video title, description, thumbnail, tags, and ISO-8601 duration from YouTube Data API v3
     */
    public function syncFromYouTube(Request $request)
    {
        $validated = $request->validate([
            'youtube_url_or_id' => 'required|string|max:255',
        ]);

        preg_match('/(?:v=|youtu\\.be\\/|embed\\/)([a-zA-Z0-9_-]{11})/', $validated['youtube_url_or_id'], $matches);
        $youtubeId = $matches[1] ?? trim($validated['youtube_url_or_id']);

        $apiKeyRecord = ApiKey::where('provider', 'youtube_data_v3')->firstOrFail();
        $apiKey = decrypt($apiKeyRecord->encrypted_key);

        $response = Http::get('https://www.googleapis.com/youtube/v3/videos', [
            'part' => 'snippet,contentDetails,statistics',
            'id'   => $youtubeId,
            'key'  => $apiKey,
        ]);

        if ($response->failed() || empty($response->json('items'))) {
            return response()->json(['message' => 'YouTube video not found or quota exceeded'], 404);
        }

        $item = $response->json('items.0');
        $snippet = $item['snippet'];

        $video = Video::updateOrCreate(
            ['youtube_id' => $youtubeId],
            [
                'public_id'     => 'vid_' . Str::lower(Str::random(10)),
                'user_id'       => $request->user()->id,
                'title'         => Str::limit($snippet['title'], 155, ''),
                'description'   => Str::limit($snippet['description'] ?? '', 3900, ''),
                'thumbnail_url' => $snippet['thumbnails']['maxres']['url']
                                   ?? $snippet['thumbnails']['high']['url'],
                'video_url'     => "https://www.youtube.com/embed/{$youtubeId}",
                'category'      => 'Engineering',
                'tags'          => array_slice($snippet['tags'] ?? ['youtube', 'synced'], 0, 10),
                'duration'      => $this->formatIsoDuration($item['contentDetails']['duration'] ?? 'PT12M30S'),
                'views'         => (int) ($item['statistics']['viewCount'] ?? 1),
                'likes'         => (int) ($item['statistics']['likeCount'] ?? 1),
            ]
        );

        return response()->json(['status' => 'synced', 'video' => $video], 201);
    }
}`;

  const cpanelHtaccessCode = `# /home/username/public_html/.htaccess (cPanel Apache Hybrid Routing for Laravel API + React SPA)
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Forward Authorization Headers to PHP Laravel Sanctum / Bearer OAuth
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Route /api/* requests to Laravel front controller
    RewriteCond %{REQUEST_URI} ^/api/ [NC]
    RewriteRule ^ index.php [L]

    # Serve existing static assets (React JS/CSS bundles, thumbnails) directly
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.html [L]
</IfModule>`;

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <p className="text-xs font-mono text-[#FF0033] font-semibold">
            MODERNIZED 2026 ENGINEERING HANDOFF & ARCHITECTURE SPECIFICATION
          </p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
            Laravel 12 + React 19.3 + Vite 8.3 + TypeScript 7.0 Technical Specification
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Updated with Web Clipboard API Copy Link, Playlists, Optional Watch History, Video Categorization, Real-Time Upload Progress, Hover Thumbnail Scrubbing, Dynamic Background, and UUIDv7+ HMAC Security
          </p>
        </div>
        <button
          onClick={downloadMarkdownSpec}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Spec (.MD)</span>
        </button>
      </div>

      {/* Section Selector */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 w-fit">
        {[
          { id: 'architecture' as const, label: '1. System Architecture & Design System', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'wireframes' as const, label: '2. UI Wireframes & UX Flowcharts', icon: <Layout className="w-3.5 h-3.5" /> },
          { id: 'schema' as const, label: '3. Database Schema & ER Diagram', icon: <Database className="w-3.5 h-3.5" /> },
          { id: 'laravel-api' as const, label: '4. Laravel Backend API & Code', icon: <Server className="w-3.5 h-3.5" /> },
          { id: 'ad-engine' as const, label: '5. Ad Placement Spec (3-Row Grid)', icon: <Megaphone className="w-3.5 h-3.5" /> },
          { id: 'cpanel-deploy' as const, label: '6. cPanel Deployment Guide', icon: <HardDrive className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveDocTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeDocTab === tab.id
                ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: System Architecture, Color Palette & Typography Plan */}
      {activeDocTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Frontend Tier (React 19 + Context API)
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Modular functional React components powered by <code className="font-mono">AppContext</code> hooks. Manages SPA routing (Home, Trending, Subscriptions, Library, Watch, Profile, Admin), dark/light mode, 3-tier accessibility text scaling, and 3-column AdSense/Sponsored grid injection.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Backend API Tier (Laravel 11 + Express Runtime)
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                RESTful JSON controllers handling YouTube Data API v3 metadata extraction, ISO-8601 duration parsing, Sanctum/Firebase JWT validation, server-side Gemini 3.1 Pro video chaptering, and Google Search & Maps grounding.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Persistence, Playlists & Privacy-First History
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Server-side UUIDv7+ vault with versioned <code className="font-mono">HMAC-SHA-256</code> public IDs, custom user Playlists (<code className="font-mono">playlists</code> &amp; <code className="font-mono">playlist_videos</code>), Optional Watch History with pause/clear controls, and Web Clipboard API direct link sharing on every <code className="font-mono">VideoCard</code>.
              </p>
            </div>
          </div>

          {/* Modern 2026 Package & Feature Matrix */}
          <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Modernized 2026 Package Versions &amp; Platform Capabilities
              </h2>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                Latest Stack Verified
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                { pkg: 'React 19.3 + Vite 8.3', desc: 'Concurrent rendering, Suspense code-splitting, and instant ESBuild/Rollup bundling.' },
                { pkg: 'TypeScript 7.0.2 + Tailwind 4.3.3', desc: 'Strict type safety and zero-runtime CSS-first @tailwindcss/vite styling.' },
                { pkg: '@google/genai 2.4.0 + Firebase 12.11', desc: 'Dynamic latest Gemini models (gemini-flash-latest / gemini-pro-latest) & Firestore sync.' },
                { pkg: 'Recharts 3.10.1 + Motion 12.23', desc: 'View Velocity analytics charts, spring physics, and 60fps UI transitions.' },
              ].map((item) => (
                <div
                  key={item.pkg}
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 space-y-1"
                >
                  <div className="font-mono font-bold text-neutral-900 dark:text-white">{item.pkg}</div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Color Palette & Typography Specification */}
          <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Color Scheme & Typography System (60-30-10 Distribution)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
              {[
                { name: 'Obsidian Canvas (60%)', hex: '#0F0F0F', bg: 'bg-[#0F0F0F] text-white border border-neutral-700' },
                { name: 'Elevated Surface (30%)', hex: '#141417', bg: 'bg-[#141417] text-white border border-neutral-700' },
                { name: 'Alabaster Light', hex: '#F8FAFC', bg: 'bg-[#F8FAFC] text-neutral-900 border border-neutral-300' },
                { name: 'YouTube Crimson (10%)', hex: '#FF0033', bg: 'bg-[#FF0033] text-white' },
                { name: 'Sponsored Amber', hex: '#F59E0B', bg: 'bg-[#F59E0B] text-neutral-950' },
                { name: 'Sync Emerald', hex: '#10B981', bg: 'bg-[#10B981] text-neutral-950' },
              ].map((sw) => (
                <div key={sw.hex} className={`p-3 rounded-lg ${sw.bg} space-y-2`}>
                  <div className="font-mono font-bold">{sw.hex}</div>
                  <div className="text-[11px] opacity-90">{sw.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Wireframes & UX Flowcharts */}
      {activeDocTab === 'wireframes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wireframe 1: Homepage 3-Column Ad-Balanced Grid */}
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Wireframe 1: Homepage Feed & 3-Column Ad Matrix
              </h3>
              <div className="p-4 rounded-lg bg-neutral-950 text-neutral-300 font-mono text-[11px] leading-relaxed overflow-x-auto">
                <pre>{`+-----------------------------------------------------------------------+
| ZTube     [Home] [Trending] [Subscriptions] [Library]   [+ Upload] (U)|
+---------------+-------------------------------------------------------+
| [Search...]   | [All] [Engineering] [Hardware] [Travel] [Culinary]    |
|               +-----------------+-----------------+-------------------+
| > Home Feed   | [ADSENSE SLOT 1]| [VIDEO CARD 1]  | [VIDEO CARD 2]    |
| > Trending    | Row 1, Top-Left | 16:9 Thumbnail  | 16:9 Thumbnail    |
| > Subscript.  +-----------------+-----------------+-------------------+
| > Library     | [VIDEO CARD 3]  | [SPONSORED AD 2]| [VIDEO CARD 4]    |
| > Admin Panel | 16:9 Thumbnail  | Row 2, Middle   | 16:9 Thumbnail    |
|               +-----------------+-----------------+-------------------+
| Theme: [Dark] | [VIDEO CARD 5]  | [VIDEO CARD 6]  | [ADSENSE SLOT 3]  |
| Text: [A-|A+] | 16:9 Thumbnail  | 16:9 Thumbnail  | Row 3, Right      |
+---------------+-----------------+-----------------+-------------------+`}</pre>
              </div>
            </div>

            {/* Wireframe 2: Watch Page & Gemini Intelligence Suite */}
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Wireframe 2: Video Watch Page & AI/Gmail Hub
              </h3>
              <div className="p-4 rounded-lg bg-neutral-950 text-neutral-300 font-mono text-[11px] leading-relaxed overflow-x-auto">
                <pre>{`+-----------------------------------------------+-----------------------+
| [ 16:9 HTML5 / YOUTUBE EMBED VIDEO PLAYER   ] | UP NEXT SIDEBAR       |
| [ Play/Pause | Timeline | Theater | 4K      ] | +-------------------+ |
+-----------------------------------------------+ | [Thumb] Video A   | |
| Video Title (Syne Bold)                       | | [Thumb] Video B   | |
| (Avatar) Creator Name [Subscribe] [Like][Save]| | [Thumb] Video C   | |
+-----------------------------------------------+ | [Thumb] Video D   | |
| GEMINI INTELLIGENCE & WORKSPACE HUB           | +-------------------+ |
| [Gemini Pro Chapters] [Search] [Maps] [Gmail] |                       |
| > Timestamped Takeaways & Grounded Citations  |                       |
+-----------------------------------------------+                       |
| COMMENTS SYSTEM (Real-Time + Flash Polish)    |                       |
| [Add Comment...] [Polish with AI] [Post]      |                       |
+-----------------------------------------------+-----------------------+`}</pre>
              </div>
            </div>
          </div>

          {/* UX Flowchart */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#FF0033]" />
              <span>UX Journey Flowchart: Video Import, AI Analysis & Gmail Share</span>
            </h3>
            <div className="p-4 rounded-lg bg-neutral-950 text-neutral-300 font-mono text-xs overflow-x-auto">
              <pre>{`[User Clicks "Upload / Sync"] ---> (Paste YouTube URL/ID) ---> [POST /api/youtube/sync]
                                                                        |
   +--------------------------------------------------------------------+
   v
[Fetches Title, Author, Thumbnail + Gemini 3.1 Flash Lite Tags/Summary]
   |
   v
[Persists to Firestore / MySQL] ---> [Appears in 3-Column Home Grid Alongside Ad Slots]
   |
   v
[Viewer Opens Watch Page] ---> [1. Runs Gemini 3.1 Pro Video Analysis]
                          ---> [2. Verifies Facts & Locations via Google Search & Maps Grounding]
                          ---> [3. Shares Digest via Gmail API with Mandatory Confirmation Modal]`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Database Schema & Entity Relationships */}
      {activeDocTab === 'schema' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Laravel 11 Database Schema Migration (users, videos, comments, subscriptions, ad_placements, api_keys)
              </h2>
              <button
                onClick={() => copyCode('migration', laravelMigrationCode)}
                className="px-3 py-1 rounded bg-neutral-100 dark:bg-[#27272A] text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedBlock === 'migration' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBlock === 'migration' ? 'Copied' : 'Copy Migration'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto leading-relaxed">
              {laravelMigrationCode}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: Laravel Backend API Endpoints & Controller Code */}
      {activeDocTab === 'laravel-api' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181B] text-neutral-500">
                  <th className="py-3 px-4">Method & Endpoint</th>
                  <th className="py-3 px-4">Controller Action</th>
                  <th className="py-3 px-4">Request Payload / Business Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                <tr>
                  <td className="py-3 px-4 text-emerald-500 font-semibold">GET /api/v1/videos</td>
                  <td className="py-3 px-4">VideoController@index</td>
                  <td className="py-3 px-4 font-sans text-neutral-600 dark:text-neutral-300">
                    Paginated video feed filtered by category, search query, or trending velocity.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sky-500 font-semibold">POST /api/v1/videos/youtube-sync</td>
                  <td className="py-3 px-4">VideoSyncController@syncFromYouTube</td>
                  <td className="py-3 px-4 font-sans text-neutral-600 dark:text-neutral-300">
                    Accepts YouTube URL/ID, queries YouTube Data API v3 + Gemini enrichment, and persists record.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sky-500 font-semibold">POST /api/v1/videos/{'{id}'}/comments</td>
                  <td className="py-3 px-4">CommentController@store</td>
                  <td className="py-3 px-4 font-sans text-neutral-600 dark:text-neutral-300">
                    Validates Sanctum/Firebase auth token and stores viewer comment under video.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-amber-500 font-semibold">PUT /api/v1/admin/ads</td>
                  <td className="py-3 px-4">AdminAdController@update</td>
                  <td className="py-3 px-4 font-sans text-neutral-600 dark:text-neutral-300">
                    Updates active status, sponsor copy, and target URLs for the 3 grid ad slots.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Sample Laravel 11 Controller: YouTube Data API v3 Auto-Sync
              </h3>
              <button
                onClick={() => copyCode('controller', laravelControllerCode)}
                className="px-3 py-1 rounded bg-neutral-100 dark:bg-[#27272A] text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedBlock === 'controller' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBlock === 'controller' ? 'Copied' : 'Copy PHP Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto leading-relaxed">
              {laravelControllerCode}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: Advertisement System Design */}
      {activeDocTab === 'ad-engine' && (
        <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Deterministic 3-Column Grid Advertisement Injection Algorithm
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            To preserve a balanced 3-item-per-row YouTube grid without displacing organic videos into orphan cells, the frontend feed engine (<code className="font-mono">buildYoutubeGridWithAds</code>) iterates through output grid indices <code className="font-mono">0..N</code> and injects enabled ad slots at deterministic coordinates while advancing the organic video cursor only on non-ad cells:
          </p>
          <ul className="list-disc list-inside text-xs text-neutral-700 dark:text-neutral-300 space-y-2">
            <li>
              <strong>Grid Index 0 (Row 1, Column 1 — Top-Left)</strong>: Injects Google AdSense Unit #1 when <code className="font-mono">adRow1LeftActive === true</code>. Organic videos 1 and 2 occupy Row 1, Columns 2 and 3.
            </li>
            <li>
              <strong>Grid Index 4 (Row 2, Column 2 — Middle)</strong>: Injects Direct Sponsored Campaign Unit #2 when <code className="font-mono">adRow2MiddleActive === true</code>. Organic videos occupy Row 2, Columns 1 and 3.
            </li>
            <li>
              <strong>Grid Index 8 (Row 3, Column 3 — Right)</strong>: Injects Google AdSense Unit #3 when <code className="font-mono">adRow3RightActive === true</code>. Organic videos occupy Row 3, Columns 1 and 2.
            </li>
          </ul>
        </div>
      )}

      {/* TAB 6: cPanel Hosting Deployment Instructions */}
      {activeDocTab === 'cpanel-deploy' && (
        <div className="space-y-5">
          <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Step-by-Step cPanel Shared / Cloud Hosting Deployment Guide
            </h2>
            <ol className="list-decimal list-inside space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <li>
                <strong>Directory Isolation</strong>: Upload the Laravel 11 backend repository to <code className="font-mono">/home/cpanel_user/ztube_core</code> so that <code className="font-mono">.env</code> and <code className="font-mono">vendor/</code> remain strictly above the public web root.
              </li>
              <li>
                <strong>Frontend Production Build</strong>: Run <code className="font-mono">npm run build</code> locally or via cPanel Terminal and copy the compiled <code className="font-mono">dist/*</code> files plus Laravel's <code className="font-mono">public/index.php</code> into <code className="font-mono">/home/cpanel_user/public_html/</code>.
              </li>
              <li>
                <strong>Database & PHP 8.3 Setup</strong>: In <strong>cPanel &gt; MultiPHP Manager</strong>, select PHP 8.3 and enable <code className="font-mono">pdo_mysql</code>, <code className="font-mono">mbstring</code>, <code className="font-mono">openssl</code>, and <code className="font-mono">curl</code>. Create the database in <strong>MySQL® Databases</strong> and run <code className="font-mono">php artisan migrate --seed --force</code>.
              </li>
              <li>
                <strong>Automated YouTube Sync Cron Job</strong>: In <strong>cPanel &gt; Cron Jobs</strong>, add a 1-minute scheduler entry: <code className="font-mono">* * * * * /usr/local/bin/php /home/cpanel_user/ztube_core/artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1</code>.
              </li>
            </ol>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Production cPanel .htaccess Configuration
                </span>
                <button
                  onClick={() => copyCode('htaccess', cpanelHtaccessCode)}
                  className="px-3 py-1 rounded bg-neutral-100 dark:bg-[#27272A] text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copiedBlock === 'htaccess' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBlock === 'htaccess' ? 'Copied' : 'Copy .htaccess'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto">
                {cpanelHtaccessCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
