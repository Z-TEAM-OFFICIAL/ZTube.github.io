import React, { useState } from 'react';
import {
  Search,
  Upload,
  Sun,
  Moon,
  LogOut,
  FileCode2,
  ShieldAlert,
  Menu,
  Flame,
  Home,
  Users,
  FolderKanban,
  User as UserIcon,
  Activity,
  Scale,
  Lock,
  Smartphone,
  MessageSquare,
  Code2,
  Sparkles,
  Coins,
  Crown,
  X,
  Bell,
  BookOpen,
  MousePointer,
  RotateCcw,
  Clock,
  Cookie,
  Compass,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { PageRoute } from '../types';

interface NavbarSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
}

export const TopNavbar: React.FC<{ onOpenMobileDrawer?: () => void }> = ({
  onOpenMobileDrawer,
}) => {
  const {
    user,
    signOutUser,
    currentRoute,
    navigate,
    siteSettings,
    subscriberCredits,
    subscriptionTier,
    setIsUploadModalOpen,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    watchLaterEntries,
    setIsCookieSettingsModalOpen,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);

  const navItems: { id: PageRoute; label: string; badge?: number }[] = [
    { id: 'home', label: 'Home' },
    { id: 'shorts', label: 'Shorts' },
    { id: 'watch-later', label: 'Watch Later', badge: watchLaterEntries.length },
    { id: 'posts', label: 'Posts' },
    { id: 'ads-credits', label: 'ZTube Ads & Plus' },
    { id: 'docs', label: 'Docs' },
    { id: 'admin', label: 'Admin Studio' },
  ];

  return (
    <header className="sticky top-0 z-40 h-14 px-3 sm:px-4 lg:px-6 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md theme-morph-surface">
      <div className="flex items-center gap-2">
        {onOpenMobileDrawer && (
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            aria-label="Open mobile navigation menu"
            className="sm:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Zone 1: Brand Title */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
          className="text-lg sm:text-xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-white focus-visible:outline-2 focus-visible:outline-[#FF0033]"
        >
          ZTube
        </a>
      </div>

      {/* Zone 2: 6 Clean Text Navigation Links */}
      <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2 lg:gap-4 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'border-[#FF0033] text-neutral-900 dark:text-white font-semibold'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF0033]/15 text-[#FF0033] font-mono tabular-nums text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions + Notifications + Subscriber Credit Balance */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Notification Bell & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="Open notifications"
            className="relative p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 px-1.5 min-w-[16px] h-4 rounded-full bg-[#FF0033] text-white font-mono text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Notifications ({unreadNotificationCount} unread)
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    Mark all read
                  </button>
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="text-[#FF0033] hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-neutral-500 text-center">
                    No notifications right now.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.targetRoute) {
                          navigate(n.targetRoute, n.targetVideoId);
                        }
                        setNotifOpen(false);
                      }}
                      className={`w-full p-3.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-[#1E1E24] cursor-pointer flex items-start gap-2.5 ${
                        !n.read ? 'bg-[#FF0033]/5' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.read ? 'bg-[#FF0033]' : 'bg-transparent'
                        }`}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                          {n.message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cookie Settings Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsCookieSettingsModalOpen(true)}
          title="Cookie Settings, Location & Privacy"
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Cookie className="w-4 h-4 text-amber-500" />
        </button>

        <button
          onClick={() => navigate('ads-credits')}
          title="Subscriber Credits & Plus Membership"
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white cursor-pointer"
        >
          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{subscriberCredits.toFixed(1)} Cr</span>
          {subscriptionTier !== 'free' && (
            <span className="hidden sm:inline ml-1 px-1.5 py-0.2 rounded bg-[#FF0033] text-white text-[10px] uppercase">
              {subscriptionTier}
            </span>
          )}
        </button>

        {siteSettings.enableUploads && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF0033] hover:bg-[#D9002B] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Upload</span>
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('profile')}
              className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={`${user.displayName || 'User'} avatar`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : null}
              <span>{user.displayName?.split(' ')[0] || 'Profile'}</span>
            </button>
            <button
              onClick={signOutUser}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('auth')}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF0033]" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

export const LeftSidebar: React.FC<
  NavbarSidebarProps & {
    mobileDrawerOpen?: boolean;
    setMobileDrawerOpen?: (open: boolean) => void;
  }
> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileDrawerOpen = false,
  setMobileDrawerOpen,
}) => {
  const {
    currentRoute,
    navigate,
    darkMode,
    setDarkMode,
    liquidGlass,
    setLiquidGlass,
    rgbCursorEnabled,
    setRgbCursorEnabled,
    replayTutorial,
    textScale,
    setTextScale,
    searchQuery,
    setSearchQuery,
    subscriptions,
    watchLaterEntries,
    categories,
    selectedCategory,
    setSelectedCategory,
    categoryVideoCounts,
    setIsCookieSettingsModalOpen,
    userLocation,
  } = useApp();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    if (currentRoute !== 'home' && currentRoute !== 'trending') {
      navigate('home');
    }
    if (setMobileDrawerOpen) setMobileDrawerOpen(false);
  };

  const navLinks: { id: PageRoute; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home Feed', icon: <Home className="w-4 h-4 shrink-0" /> },
    { id: 'shorts', label: 'ZTube Shorts (≤4m)', icon: <Smartphone className="w-4 h-4 shrink-0" /> },
    {
      id: 'watch-later',
      label: 'Watch Later',
      icon: <Clock className="w-4 h-4 shrink-0 text-[#FF0033]" />,
      badge: watchLaterEntries.length,
    },
    { id: 'library', label: 'Library & Favorites', icon: <FolderKanban className="w-4 h-4 shrink-0" /> },
    { id: 'posts', label: 'Community Posts', icon: <MessageSquare className="w-4 h-4 shrink-0" /> },
    { id: 'ads-credits', label: 'ZTube Ads & Plus Credits', icon: <Crown className="w-4 h-4 shrink-0 text-[#FF0033]" /> },
    { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4 shrink-0" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'docs', label: 'Docs & Shortcuts Guide', icon: <BookOpen className="w-4 h-4 shrink-0 text-sky-400" /> },
    { id: 'embed-api', label: 'Embed & 7+ API Key', icon: <Code2 className="w-4 h-4 shrink-0" /> },
    { id: 'auth', label: 'Central Park Login', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
    { id: 'profile', label: 'Your Channel', icon: <UserIcon className="w-4 h-4 shrink-0" /> },
    { id: 'telemetry', label: 'Telemetry & Captcha Logs', icon: <Activity className="w-4 h-4 shrink-0" /> },
    { id: 'admin', label: 'Admin Control Panel', icon: <ShieldAlert className="w-4 h-4 shrink-0" /> },
    { id: 'blueprint', label: 'Laravel Tech Spec', icon: <FileCode2 className="w-4 h-4 shrink-0" /> },
  ];

  const legalLinks: { id: PageRoute; label: string; icon: React.ReactNode }[] = [
    { id: 'terms', label: 'Terms of Service', icon: <Scale className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'privacy', label: 'Privacy Policy', icon: <Lock className="w-3.5 h-3.5 shrink-0" /> },
  ];

  return (
    <>
      {/* Mobile Slide-Over Drawer for Phones (< sm) */}
      {mobileDrawerOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileDrawerOpen && setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />
          <div className="relative z-10 w-72 max-w-[82vw] bg-white dark:bg-[#0F0F0F] border-r border-neutral-200 dark:border-neutral-800 h-full overflow-y-auto p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold font-display text-neutral-900 dark:text-white">
                  ZTube Menu
                </span>
                <button
                  onClick={() => setMobileDrawerOpen && setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="search"
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search videos, tags..."
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-lg bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="space-y-1">
                {navLinks.map((item) => {
                  const active = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.id);
                        if (setMobileDrawerOpen) setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                        active
                          ? 'bg-neutral-900 text-white dark:bg-[#27272A]'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#FF0033] text-white font-mono tabular-nums text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Categories Section */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="px-3 pb-1 flex items-center justify-between text-xs font-semibold text-neutral-500">
                  <span>Categories</span>
                  <span className="text-[10px] font-mono">{categories.length}</span>
                </div>
                <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                    const count = categoryVideoCounts[cat.name] ?? (cat.name === 'All' ? undefined : 0);
                    return (
                      <button
                        key={`mob_${cat.id}`}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          navigate('home');
                          if (setMobileDrawerOpen) setMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF0033]/15 text-[#FF0033] font-bold'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#18181B]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{cat.icon || '📁'}</span>
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {typeof count === 'number' && count > 0 && (
                          <span className="text-[10px] font-mono text-neutral-400">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Theme</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#18181B]"
                >
                  {darkMode ? 'Dark' : 'Light'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Liquid Glass</span>
                <button
                  onClick={() => setLiquidGlass(!liquidGlass)}
                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#18181B]"
                >
                  {liquidGlass ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>RGB Cursor (G/B/R)</span>
                <button
                  onClick={() => setRgbCursorEnabled(!rgbCursorEnabled)}
                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#18181B]"
                >
                  {rgbCursorEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Cookie Settings</span>
                <button
                  onClick={() => {
                    setIsCookieSettingsModalOpen(true);
                    if (setMobileDrawerOpen) setMobileDrawerOpen(false);
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#18181B] text-amber-500 font-semibold flex items-center gap-1"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>Manage</span>
                </button>
              </div>
              <button
                onClick={() => {
                  replayTutorial();
                  if (setMobileDrawerOpen) setMobileDrawerOpen(false);
                }}
                className="w-full py-1.5 rounded bg-[#FF0033]/10 text-[#FF0033] font-semibold text-center"
              >
                Replay Tutorial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop & Tablet Collapsible Sidebar */}
      <motion.aside
        aria-label="Sidebar navigation and accessibility controls"
        animate={{ width: sidebarCollapsed ? 68 : 260 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0F0F0F] sidebar-spring hidden sm:flex flex-col justify-between min-h-[calc(100vh-3.5rem)] overflow-hidden"
      >
        <div className="p-3 space-y-5">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9, rotate: sidebarCollapsed ? 90 : 0 }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle Sidebar"
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </motion.button>
            {!sidebarCollapsed && (
              <motion.form
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleSearchSubmit}
                className="flex-1 relative"
              >
                <input
                  type="search"
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search videos, tags..."
                  aria-label="Search videos"
                  className="w-full pl-3 pr-8 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            )}
          </div>

          <div className="space-y-1">
            {navLinks.map((item, idx) => {
              const active = currentRoute === item.id;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.018 }}
                  whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
                  onClick={() => navigate(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-neutral-900 text-white dark:bg-[#27272A] dark:text-white font-semibold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#18181B] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full min-w-0 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.icon}
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#FF0033]/15 text-[#FF0033] font-mono tabular-nums text-[10px] font-bold shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {!sidebarCollapsed && (
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="px-3 pb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Explore Categories
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {categories.length}
                </span>
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  const count =
                    categoryVideoCounts[cat.name] ?? (cat.name === 'All' ? undefined : 0);
                  return (
                    <button
                      key={`desk_${cat.id}`}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        navigate('home');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF0033]/15 text-[#FF0033] font-bold'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm shrink-0">{cat.icon || '📁'}</span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {typeof count === 'number' && count > 0 && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!sidebarCollapsed && subscriptions.length > 0 && (
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <p className="px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Subscribed Channels
              </p>
              <div className="space-y-1">
                {subscriptions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => navigate('subscriptions')}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#18181B] transition-colors cursor-pointer"
                  >
                    {sub.channelAvatar ? (
                      <img
                        src={sub.channelAvatar}
                        alt={`${sub.channelName} avatar`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#FF0033]/20 text-[#FF0033] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {sub.channelName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{sub.channelName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
              {legalLinks.map((item) => {
                const active = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      active
                        ? 'text-[#FF0033] font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Theme Mode
                </span>
                <motion.button
                  whileTap={{ scale: 0.92, rotate: 15 }}
                  onClick={() => setDarkMode(!darkMode)}
                  aria-label="Toggle Dark or Light Mode"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-[#18181B] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-colors cursor-pointer"
                >
                  {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{darkMode ? 'Dark' : 'Light'}</span>
                </motion.button>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Liquid Glass Buttons
                </span>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setLiquidGlass(!liquidGlass)}
                  aria-label="Toggle Liquid Glass Button Theme"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    liquidGlass
                      ? 'bg-[#FF0033] text-white border-[#FF0033]'
                      : 'bg-neutral-100 dark:bg-[#18181B] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{liquidGlass ? 'Glass ON' : 'Standard'}</span>
                </motion.button>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  RGB Cursor (G/B/R)
                </span>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setRgbCursorEnabled(!rgbCursorEnabled)}
                  aria-label="Toggle Green Left Blue Middle Red Right Cursor"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    rgbCursorEnabled
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                      : 'bg-neutral-100 dark:bg-[#18181B] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>{rgbCursorEnabled ? 'G·B·R ON' : 'Default'}</span>
                </motion.button>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Cookie Settings
                </span>
                <button
                  type="button"
                  onClick={() => setIsCookieSettingsModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-[#18181B] text-amber-500 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 cursor-pointer"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>{userLocation.flag || '🍪'} Manage</span>
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Quick Tour
                </span>
                <button
                  type="button"
                  onClick={replayTutorial}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-[#18181B] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 hover:border-[#FF0033] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-[#FF0033]" />
                  <span>Replay tutorial</span>
                </button>
              </div>

              <div className="space-y-1.5 px-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block">
                  Text Size (Accessibility)
                </span>
                <div
                  role="group"
                  aria-label="Text size selector"
                  className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-[#18181B] rounded-lg border border-neutral-200 dark:border-neutral-800"
                >
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setTextScale(sz)}
                      className={`py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        textScale === sz
                          ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {sz === 'sm' ? 'A-' : sz === 'md' ? 'A' : 'A+'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9, rotate: 20 }}
                onClick={() => setDarkMode(!darkMode)}
                title="Toggle Dark/Light Theme"
                className="w-full flex justify-center p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setLiquidGlass(!liquidGlass)}
                title="Toggle Liquid Glass Theme"
                className="w-full flex justify-center p-2 rounded-lg text-neutral-500 hover:text-[#FF0033] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCookieSettingsModalOpen(true)}
                title="Cookie Settings & Location"
                className="w-full flex justify-center p-2 rounded-lg text-neutral-500 hover:text-amber-500 cursor-pointer"
              >
                <Cookie className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Fixed Bottom Mobile Tab Bar for Phones (< sm) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-5 items-center px-1"
      >
        {(
          [
            { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
            { id: 'shorts', label: 'Shorts', icon: <Smartphone className="w-4 h-4" /> },
            { id: 'posts', label: 'Posts', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'ads-credits', label: 'Plus/Ads', icon: <Crown className="w-4 h-4" /> },
            { id: 'library', label: 'Library', icon: <FolderKanban className="w-4 h-4" /> },
          ] as { id: PageRoute; label: string; icon: React.ReactNode }[]
        ).map((tab) => {
          const active = currentRoute === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium cursor-pointer ${
                active
                  ? 'text-[#FF0033] font-bold'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
