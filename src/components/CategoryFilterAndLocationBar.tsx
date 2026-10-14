import React, { useState, useRef } from 'react';
import {
  Compass,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Globe2,
  SlidersHorizontal,
  Navigation,
  Cookie,
  Check,
  X,
  Plus,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KNOWN_GEO_HUBS, WORLDWIDE_HUB, GeoHub } from '../utils/locationalAlgorithm';
import { getAllCookies, deleteCookie } from '../utils/cookieUtils';

export const CategoryFilterAndLocationBar: React.FC<{
  showLocationControls?: boolean;
}> = ({ showLocationControls = true }) => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    categoryVideoCounts,
    addCategory,
    userLocation,
    setUserLocation,
    setUserLocationHub,
    locationalAlgorithmEnabled,
    setLocationalAlgorithmEnabled,
    locationAlgorithmMode,
    setLocationAlgorithmMode,
    cookieConsent,
    updateCookieConsent,
    isCookieSettingsModalOpen,
    setIsCookieSettingsModalOpen,
  } = useApp();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🎬');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 280;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSavingCategory(true);
    try {
      const slug = newCatName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      await addCategory({
        slug,
        name: newCatName.trim(),
        icon: newCatIcon.trim() || '📁',
        description: newCatDesc.trim() || `Videos and tutorials in ${newCatName.trim()}`,
        color: '#FF0033',
        displayOrder: categories.length + 1,
      });
      setSelectedCategory(newCatName.trim());
      setIsAddCategoryModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
    } catch (err) {
      console.warn('Error creating category:', err);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDetectBrowserGeo = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Browser geolocation API not supported in this environment.');
      return;
    }
    setIsDetectingGeo(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGeo(false);
        const { latitude, longitude } = pos.coords;
        // Find closest hub
        let closestHub: GeoHub = KNOWN_GEO_HUBS[0];
        let minDistance = Infinity;

        for (const hub of KNOWN_GEO_HUBS) {
          const dLat = hub.lat - latitude;
          const dLng = hub.lng - longitude;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist < minDistance) {
            minDistance = dist;
            closestHub = hub;
          }
        }

        setUserLocation({
          ...userLocation,
          latitude,
          longitude,
          city: closestHub.city,
          country: closestHub.country,
          countryCode: closestHub.countryCode,
          region: closestHub.region,
          flag: closestHub.flag,
          autoDetected: true,
          updatedAt: new Date().toISOString(),
        });
        setGeoNotice(
          `Detected location near ${closestHub.city}, ${closestHub.country} (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`
        );
      },
      (err) => {
        setIsDetectingGeo(false);
        setGeoNotice(`Geolocation notice: ${err.message}. Using system timezone region.`);
      },
      { timeout: 7000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Category Navigation Bar & Quick Location Chip Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Horizontal Category Pill Carousel with Left/Right Arrows */}
        <div className="relative flex-1 min-w-0 flex items-center">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll categories left"
            className="hidden sm:flex shrink-0 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-1 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={scrollContainerRef}
            role="tablist"
            aria-label="Video categories from database"
            className="flex-1 flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/90 dark:bg-[#141417]/90 border border-neutral-200/80 dark:border-neutral-800/80 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {categories.map((cat) => {
              const active =
                selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
                (cat.slug === 'all' && selectedCategory.toLowerCase() === 'all');
              const count = categoryVideoCounts[cat.name] ?? (cat.name === 'All' ? categoryVideoCounts.All : 0);

              return (
                <button
                  key={cat.id || cat.slug}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat.name)}
                  title={cat.description || cat.name}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs ring-1 ring-[#FF0033]/50'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <span className="text-sm leading-none shrink-0">{cat.icon || '📁'}</span>
                  <span>{cat.name}</span>
                  {typeof count === 'number' && count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                        active
                          ? 'bg-[#FF0033] text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Button to Add Category into Database Table */}
            <button
              type="button"
              onClick={() => setIsAddCategoryModalOpen(true)}
              title="Add a custom category to the database"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:text-[#FF0033] dark:hover:text-[#FF0033] hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 shrink-0 flex items-center gap-1 cursor-pointer transition-colors border border-dashed border-neutral-300 dark:border-neutral-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll categories right"
            className="hidden sm:flex shrink-0 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 ml-1 cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Location Selector Pill & Cookie Settings Trigger */}
        {showLocationControls && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Location Pill */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              title="Open Location & Locational Algorithm Settings"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                locationalAlgorithmEnabled && userLocation.countryCode !== 'GLOBAL'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#141417] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
              }`}
            >
              <span className="text-sm leading-none shrink-0">{userLocation.flag || '📍'}</span>
              <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">
                {userLocation.countryCode === 'GLOBAL'
                  ? 'Worldwide Feed'
                  : `${userLocation.city}, ${userLocation.countryCode}`}
              </span>
              <span className="text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500">
                {locationalAlgorithmEnabled ? userLocation.algorithmMode.replace('_', ' ') : 'Off'}
              </span>
            </button>

            {/* Cookie Preferences Trigger Pill */}
            <button
              type="button"
              onClick={() => setIsCookieSettingsModalOpen(true)}
              title="Manage Cookies & Personalization"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-[#141417] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Cookie className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Cookies</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD CATEGORY TO DATABASE TABLE */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Add Video Category
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Saves to the Firestore 'categories' database table
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. AI & Robotics, Documentaries, Anime"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF0033]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Icon (Emoji or Symbol)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    maxLength={4}
                    placeholder="🎬"
                    className="w-16 px-3 py-2 text-center text-sm rounded-lg bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                  <div className="flex flex-wrap gap-1 text-sm">
                    {['🎮', '🎵', '⚙️', '🖥️', '🍳', '🎨', '🔬', '✈️', '🍿', '💡', '🤖', '⚽'].map(
                      (emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCatIcon(emoji)}
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer text-xs"
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Curated videos and deep dives in this topic..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#FF0033]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingCategory ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOCATIONAL ALGORITHM & REGION CONTROLS */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Locational Algorithm & Region Selector
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Recommends and filters videos based on geographical proximity & local trends
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Master Toggle */}
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Locational Algorithm Active
                </p>
                <p className="text-[11px] text-neutral-500">
                  Calculates Haversine distance and boosts videos matching your region
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationalAlgorithmEnabled}
                  onChange={(e) => setLocationalAlgorithmEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Algorithm Ranking Mode:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    id: 'nearby_boost',
                    title: 'Nearby Boost (Recommended)',
                    desc: 'Boosts local creators while preserving global hits',
                  },
                  {
                    id: 'local_only',
                    title: 'Local Only',
                    desc: 'Filters exclusively to your country and region',
                  },
                  {
                    id: 'distance_strict',
                    title: 'Sort by Distance',
                    desc: 'Orders strictly by shortest km distance',
                  },
                  {
                    id: 'standard',
                    title: 'Worldwide Standard',
                    desc: 'Global unweighted feed with location tags',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setLocationAlgorithmMode(mode.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      locationAlgorithmMode === mode.id
                        ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {mode.title}
                      </span>
                      {locationAlgorithmMode === mode.id && (
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-snug">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Detect Location Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleDetectBrowserGeo}
                disabled={isDetectingGeo}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-500 ${isDetectingGeo ? 'animate-spin' : ''}`} />
                <span>{isDetectingGeo ? 'Detecting GPS...' : 'Detect via GPS / Browser'}</span>
              </button>
              {geoNotice && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono truncate max-w-[240px]">
                  {geoNotice}
                </p>
              )}
            </div>

            {/* Hub Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Or Select Region / Geo Hub:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* Worldwide option */}
                <button
                  type="button"
                  onClick={() => setUserLocationHub(WORLDWIDE_HUB.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                    userLocation.countryCode === 'GLOBAL'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1E1E24]'
                  }`}
                >
                  <span className="text-base">🌐</span>
                  <div className="truncate">
                    <p className="font-bold truncate text-neutral-900 dark:text-white">Worldwide</p>
                    <p className="text-[10px] text-neutral-500">Global</p>
                  </div>
                </button>

                {KNOWN_GEO_HUBS.map((hub) => {
                  const isSelected =
                    userLocation.countryCode === hub.countryCode &&
                    userLocation.city.toLowerCase() === hub.city.toLowerCase();
                  return (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => setUserLocationHub(hub.id)}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1E1E24]'
                      }`}
                    >
                      <span className="text-base">{hub.flag}</span>
                      <div className="truncate">
                        <p className="font-bold truncate text-neutral-900 dark:text-white">
                          {hub.city}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">{hub.country}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diagnostic Footer */}
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-[#0F0F0F] text-[11px] space-y-1 font-mono text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Active Region:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {userLocation.city}, {userLocation.country} ({userLocation.flag})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Timezone:</span>
                <span>{userLocation.timezone}</span>
              </div>
              <div className="flex justify-between">
                <span>Cookie Saved:</span>
                <span className="text-emerald-500">ztube_location_pref</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COOKIE SETTINGS & AUDIT MODAL */}
      {isCookieSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    ZTube Cookie Settings & Privacy
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Control category filtering, locational preferences, and session cookies
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCookieSettingsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Category 1: Essential */}
              <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F0F0F] flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Strictly Necessary Cookies
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Required for Google Auth sessions, CSRF protection, and stream security.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  ALWAYS ACTIVE
                </span>
              </div>

              {/* Category 2: Category & Filter Preferences */}
              <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Category & Filter Preferences (ztube_category_pref)
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Saves your chosen category, watch duration filters, and sorting choices across visits.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={cookieConsent.categoriesAndFiltering}
                    onChange={(e) =>
                      updateCookieConsent({ categoriesAndFiltering: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF0033]" />
                </label>
              </div>

              {/* Category 3: Locational Personalization */}
              <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Locational Personalization (ztube_location_pref)
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Stores your regional hub and proximity algorithm mode for local content recommendations.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={cookieConsent.locationalPersonalization}
                    onChange={(e) =>
                      updateCookieConsent({ locationalPersonalization: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF0033]" />
                </label>
              </div>

              {/* Category 4: Analytics & Telemetry */}
              <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Compression & Kinematic Telemetry
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Stores HTTP Brotli compression savings and anonymized anti-bot movement traces.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={cookieConsent.analyticsAndTelemetry}
                    onChange={(e) =>
                      updateCookieConsent({ analyticsAndTelemetry: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF0033]" />
                </label>
              </div>
            </div>

            {/* Currently Set Cookies Inspector */}
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-[#0F0F0F] text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-700 dark:text-neutral-300">
                  Active ZTube Cookies in Browser
                </span>
                <button
                  type="button"
                  onClick={() => {
                    deleteCookie('ztube_category_pref');
                    deleteCookie('ztube_location_pref');
                    deleteCookie('ztube_cookie_consent');
                    updateCookieConsent({ status: 'declined' });
                  }}
                  className="text-[#FF0033] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All Cookies</span>
                </button>
              </div>
              <div className="space-y-1 font-mono text-neutral-500 max-h-24 overflow-y-auto">
                <div>• ztube_category_pref: "{selectedCategory}"</div>
                <div>• ztube_location_pref: "{userLocation.city}, {userLocation.countryCode}"</div>
                <div>• ztube_cookie_consent: "{cookieConsent.status}"</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  updateCookieConsent({
                    status: 'accepted',
                    categoriesAndFiltering: true,
                    locationalPersonalization: true,
                    analyticsAndTelemetry: true,
                  });
                  setIsCookieSettingsModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer"
              >
                Accept All Cookies
              </button>
              <button
                type="button"
                onClick={() => setIsCookieSettingsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Cookie Consent Floating Banner at bottom of page
 */
export const CookieConsentBanner: React.FC = () => {
  const { isCookieBannerOpen, setIsCookieBannerOpen, updateCookieConsent, setIsCookieSettingsModalOpen } =
    useApp();

  if (!isCookieBannerOpen) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 max-w-md p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-md shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-2.5">
        <Cookie className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
            Cookies, Categories & Location Personalization
          </h4>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
            ZTube uses cookies to preserve your video category filters, locational recommendation preferences, and smooth video playback.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setIsCookieSettingsModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
        >
          Customize
        </button>
        <button
          type="button"
          onClick={() => updateCookieConsent({ status: 'declined', locationalPersonalization: false })}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={() =>
            updateCookieConsent({
              status: 'accepted',
              categoriesAndFiltering: true,
              locationalPersonalization: true,
              analyticsAndTelemetry: true,
            })
          }
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white cursor-pointer"
        >
          Accept All
        </button>
      </div>
    </div>
  );
};
