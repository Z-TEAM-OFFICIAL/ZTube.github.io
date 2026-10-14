# Watch Later Queue & Library Management with Performance Optimization

Deliver a comprehensive **Watch Later** experience across ZTube with one-click saving from Video Cards and Watch Pages, dual-sync persistence across Firestore and `localStorage`, a dedicated Library management studio (supporting Play All, Shuffle, drag-and-drop/manual reordering, search/filtering, and bulk removal of watched videos), a user-controlled auto-remove on completion toggle, and end-to-end rendering and lookup optimizations.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product choices have been confirmed from your answers and are baked into this plan:

- **Confirmed Decision 1 — Hybrid Persistence (Firestore + `localStorage`)**: Watch Later items and preferences sync in real time with Firestore for authenticated users while maintaining instant `localStorage` persistence for offline/guest resilience and zero-latency startup.
- **Confirmed Decision 2 — Full Library Management & Queue Playback Suite**: The Watch Later view includes **Play All** and **Shuffle** queue modes, a **Remove Watched Videos** bulk action, **drag-and-drop + manual up/down reordering and multi-criteria sorting**, and **live search & category/status filtering**.
- **Confirmed Decision 3 — Configurable Auto-Removal on Video Completion**: Users have an explicit toggle (*Auto-remove from Watch Later when finished*) in the Watch Later header and player queue bar; when off, completed videos remain in the list with a clean `Watched` indicator until removed.

---

## 1. Overview & Core Concept

- **What It Does**: Enables viewers to curate a personal Watch Later queue from any video card, watch page, or shorts feed, and manage or binge-watch that queue from a dedicated Watch Later section inside the Library and Sidebar navigation.
- **Target Audience / Persona**: Viewers and technical learners who discover multiple long-form engineering videos, tutorials, or shorts during browsing and want a structured, low-friction queue to watch and organize at their own pace.
- **Key Value**: Eliminates lost discovery by combining instant one-click queueing (`Clock` affordance + right-click quick undo), continuous queue auto-advance, and O(1) memoized state lookups for 60fps browsing performance.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Quick-Add from Any Video Card**:
   - Hovering over a video card reveals a top-right **Watch Later** quick-action button (`Clock` icon, switching to a confirmed `Check` + `Added` state when queued) alongside the bottom action bar button.
   - Left-clicking toggles the video in Watch Later with an immediate toast/notification; right-clicking removes the entry in keeping with ZTube's right-click undo convention.
2. **Add & Queue Control on the Watch Page**:
   - The primary video action bar on the Watch Page includes a dedicated **Watch Later** button showing current queue status (`Watch Later` vs. `In Watch Later · #N`).
   - When watching a video launched from the Watch Later queue, an interactive **Watch Later Queue Panel** appears above the Up Next sidebar, showing the active queue order, `Next Up` preview, Shuffle/Loop toggles, and the *Auto-remove on completion* switch.
3. **Dedicated Watch Later Section & Library Hub**:
   - Accessible directly from the left navigation sidebar (`Watch Later` with live item count) and as a dedicated tab/section inside the **Saved Library** page.
   - Features a summary header displaying total queued videos, total estimated watch time (`hrs mins` in tabular numerals), watched vs. unwatched counts, and primary **Play All** and **Shuffle Play** CTAs.
   - Includes a management toolbar with live search input, status filter (`All` · `Unwatched` · `Watched`), sort selector (`Custom Order` · `Date Added (Newest)` · `Date Added (Oldest)` · `Duration (Shortest)` · `Duration (Longest)` · `Popularity`), a **Remove Watched** button, and the **Auto-remove when finished** toggle.
   - Each row in the Watch Later list supports HTML5 drag-and-drop and accessible Move Up / Move Down / Move to Top controls, a watched progress badge, quick Mini-Player launch, and single-click removal.

### Visual Identity & Theme

- **Aesthetic Direction**: High-craft dark/light streaming workspace (`#0F0F0F` dark canvas / `#F8FAFC` light canvas) with crisp 1px structural borders (`border-neutral-200 dark:border-neutral-800`) and zero nested card clutter.
- **Color Palette & Mood**:
  - **60% Dominant Neutral Canvas**: `#0F0F0F` (dark) / `#F8FAFC` (light).
  - **30% Structural Surfaces**: `#141417` / `#18181B` containers with subtle hairline dividers.
  - **10% Accent Budget**: ZTube Crimson (`#FF0033`) for primary CTAs (`Play All`), Neon Green (`#58f01b`) for active playback focus and verified states, and Sky/Emerald accents for queue progress.
- **Typography & Hierarchy**:
  - Crisp geometric sans-serif headings with `text-wrap: balance`, paired with clean unboxed metadata (`Author · Category · Views · Duration`) using middle-dot (`·`) separators.
  - Strict `font-mono tabular-nums` on all queue indices (`01`, `02`), video durations (`14:20`), total remaining runtime metrics, and timestamps.
- **Interactive Feedback & Motion**:
  - $\le 150\text{ms}$ compositor-only (`transform`, `opacity`) transitions on button states and drag reorder previews.
  - Clear empty state with a direct CTA to explore trending videos when the Watch Later list has no items or no search matches.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Optimistic Local State + Firestore Synchronization**
  - *Chosen Approach*: Maintain ordered `WatchLaterEntry` records (`videoId`, `addedAt`, `customOrder`, `watchedAt`) in `localStorage` for immediate 0ms UI updates, and synchronize changes with the user's Firestore profile/collection (`watchLaterVideoIds` / `watch_later`) when signed in.
  - *Why*: Guarantees instantaneous button feedback and full functionality for both guest and signed-in sessions while preserving cross-device consistency and strict Firestore security rule compliance.
  - *Alternatives Considered*: Firestore-only storage was rejected because guest users couldn't use Watch Later and network round-trips would add latency to card button toggles.
- **Decision 2: O(1) Set-Backed Membership Lookups & Memoized Component Boundaries**
  - *Chosen Approach*: Convert array-based membership checks (`watchLaterIds`, `savedVideoIds`, `favoriteVideoIds`, `viewedVideoIds`) into memoized `Set<string>` structures in `AppContext`, wrap `VideoCard` in `React.memo`, and apply `content-visibility: auto` to offscreen grid/queue items.
  - *Why*: Eliminates $O(N \times M)$ re-render cascades across the video grid whenever a single video is added to Watch Later, Favorited, or Liked.
- **Decision 3: User-Controlled Auto-Removal on Completion**
  - *Chosen Approach*: Hook into the video player's `onEnded` / completion threshold (95%+ progress or end event) to mark the video as watched and, if `autoRemoveWatchLaterOnFinish` is enabled, automatically dequeue it and advance to the next queued video.
  - *Why*: Gives power users an inbox-zero queue workflow while allowing reference viewers to keep watched tutorials marked with a `Watched` badge until they click *Remove Watched*.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        AppContext (Optimized Store)                        │
│  • watchLaterEntries: WatchLaterEntry[] (ordered, timestamped)             │
│  • O(1) Lookup Sets: watchLaterSet, savedSet, favoriteSet, watchedSet      │
│  • Queue Playback State: activeQueueMode ('off' | 'watch-later'),          │
│    queueShuffle, autoRemoveWatchLaterOnFinish                              │
│  • Dual-Sync Engine: localStorage <-> Firestore (/users/{uid} & rules)     │
└───────────────┬───────────────────────────────┬────────────────────────────┘
                │                               │
      ┌─────────▼──────────┐          ┌─────────▼──────────┐
      │ Discovery Surfaces │          │  Watch Experience  │
      ├────────────────────┤          ├────────────────────┤
      │ • Memoized         │          │ • VideoDetailsPage │
      │   VideoCard        │          │   Watch Later CTA  │
      │   - Top-right      │          │ • Active Queue     │
      │     Clock overlay  │          │   Sidebar Panel    │
      │   - Action bar btn │          │   (Next Up, Loop,  │
      │   - Right-click    │          │    Shuffle, Auto-  │
      │     quick remove   │          │    remove toggle)  │
      │ • Shorts Action    │          │ • Player onEnded   │
      │   Rail Watch Later │          │   Auto-Advance     │
      └────────────────────┘          └─────────┬──────────┘
                                                │
                ┌───────────────────────────────▼────────────────────────────┐
                │          Watch Later Library View & Sidebar Route          │
                ├────────────────────────────────────────────────────────────┤
                │ • Header: Total videos, Total runtime (tabular-nums),      │
                │   Play All CTA, Shuffle Play CTA                           │
                │ • Toolbar: Search input, Status filter (All / Unwatched /  │
                │   Watched), Sort selector, Remove Watched, Auto-Remove     │
                │ • Interactive Queue List: Drag-and-drop + Up/Down/Top      │
                │   reordering, Watched badge, Mini-Player, Remove item      │
                └────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`WatchLaterEntry`**:
  - `videoId: string` — Reference to the `VideoItem.id`.
  - `addedAt: string` — ISO timestamp when the video was saved to Watch Later.
  - `position: number` — Explicit sort index for custom drag-and-drop and manual reordering.
- **Context State & Actions**:
  - `watchLaterEntries: WatchLaterEntry[]` & `watchLaterVideoIds: string[]`
  - `isVideoInWatchLater(videoId: string): boolean` (backed by memoized `Set<string>`)
  - `toggleWatchLater(videoId: string): boolean`
  - `removeFromWatchLater(videoId: string): boolean`
  - `reorderWatchLater(fromIndex: number, toIndex: number): void`
  - `removeWatchedFromWatchLater(): number`
  - `clearWatchLater(): void`
  - `autoRemoveWatchLaterOnFinish: boolean` & `setAutoRemoveWatchLaterOnFinish(enabled: boolean): void`
  - `activeQueueSource: 'watch-later' | 'playlist' | null` & `startWatchLaterQueue(shuffle?: boolean, startVideoId?: string): void`

### Interactive Component & State Mapping

- **`VideoCard` (Memoized)**:
  - Clicking the Watch Later icon calls `toggleWatchLater(video.id)` with `e.stopPropagation()`, updating the `Set` in O(1) time and triggering a non-intrusive toast notification.
  - Right-clicking (`onContextMenu`) calls `removeFromWatchLater(video.id)` for instant undo.
- **`VideoDetailsPage` & `CustomZTubeVideoPlayer`**:
  - Action bar includes a primary **Watch Later** toggle button with live status and right-click removal.
  - When a video finishes (`onEnded`), if it is in Watch Later and `autoRemoveWatchLaterOnFinish` is active, it is automatically removed from `watchLaterEntries` and the player advances to the next video in the queue if queue playback is active.
- **`WatchLaterLibrarySection` (accessible via `watch-later` route and `saved` Library tabs)**:
  - **Play All / Shuffle Play**: Initializes the active queue with the filtered/ordered Watch Later videos and navigates to `watch` with the first (or shuffled) video.
  - **Drag-and-Drop & Manual Reorder**: HTML5 drag handlers (`onDragStart`, `onDragOver`, `onDrop`) and keyboard-accessible up/down buttons invoke `reorderWatchLater(fromIndex, toIndex)` and switch the active sort mode to `Custom Order`.
  - **Remove Watched**: Cross-references `watchLaterEntries` against `viewedVideoIdsByCurrentUser` and `watchHistoryIds`, removing all watched entries in a single batch update.
  - **Search & Filter**: Client-side memoized filtering by title, creator, category, tag, and watched status (`all` | `unwatched` | `watched`).
- **Maximum Performance Optimizations**:
  - Memoize context value and provide `Set`-based O(1) lookup helpers so card components do not re-render unnecessarily.
  - Wrap `VideoCard` and list items in `React.memo`.
  - Use `decoding="async"` alongside `loading="lazy"` on thumbnails and avatars, and apply CSS `content-visibility: auto` on long video grids and queue lists to minimize layout and paint work.
