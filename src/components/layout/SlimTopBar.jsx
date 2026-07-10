import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  X,
  RotateCw,
  Globe,
  Check,
  Sparkles,
  PanelLeftOpen,
  PanelLeftClose,
  Clock,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { useTheme } from "../../context/ThemeContext";
import { getNotifications, markAsRead } from "../../services/notificationService";
import { searchablePages } from "./menuGroups"; // ← single source of truth, gak perlu re-import icon
import toast from "react-hot-toast";

// ─── Recent pages helpers (sessionStorage) ───────────────────────────────────
const RECENT_KEY = 'nav-recent-pages';
const MAX_RECENT = 4;

function getRecentPages() {
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function pushRecentPage(path) {
  try {
    const pages = getRecentPages().filter(p => p !== path);
    pages.unshift(path);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(pages.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

// Resolve path ke searchablePages entry
function resolveRecentEntries(recentPaths) {
  return recentPaths
    .map(path => searchablePages.find(p => p.path === path))
    .filter(Boolean);
}

// ─── NavIcon Helper ──────────────────────────────────────────────────────────
function NavIcon({ icon: IconComponent, className = "" }) {
  if (!IconComponent) return null;
  return <IconComponent className={className || "w-4 h-4"} strokeWidth={2} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = "w-8 h-8", textSize = "text-xs", rounded = "rounded-xl" }) {
  const [imgError, setImgError] = useState(false);
  const letter = name?.charAt(0)?.toUpperCase() || 'U';
  const showImg = url && !imgError;

  return (
    <div className={`${size} ${rounded} bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-sm overflow-hidden shrink-0`}>
      {showImg ? (
        <img src={url} alt={name || "Avatar"} onError={() => setImgError(true)} className="w-full h-full object-cover" />
      ) : (
        <span className={textSize}>{letter}</span>
      )}
    </div>
  );
}

// ─── Search Result Item ────────────────────────────────────────────────────────
function SearchResultItem({ item, isHighlighted, onClick, isRecent = false }) {
  return (
    <button
      onClick={() => onClick(item.path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left
          ${isHighlighted
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
          : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
      type="button"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
        {isRecent
          ? <Clock className="w-4 h-4" strokeWidth={2} />
          : <NavIcon icon={item.icon} className="w-4 h-4" />
        }
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-[var(--color-text)] leading-tight truncate">{item.label}</p>
        <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-0.5 truncate">
          {isRecent ? 'Baru dikunjungi' : item.desc}
        </p>
      </div>
      {item.group && (
        <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded-md bg-[var(--color-surface-alt)]">
          {item.group}
        </span>
      )}
    </button>
  );
}

// ─── Icon Button (konsisten: border + bg + hover) ───────────────────────────
function IconButton({ children, className = "", active = false, ...props }) {
  return (
    <button
      type="button"
      className={`w-8 h-8 flex items-center justify-center rounded-xl border transition
          ${active
          ? 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-primary)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-primary)]'}
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Live Clock ──────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="hidden lg:flex items-center gap-2 h-8 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 mr-1">
      <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" strokeWidth={2} />
      <span className="text-[12px] font-extrabold text-[var(--color-text)] tabular-nums">{time}</span>
      <span className="text-[var(--color-text-muted)]/40">|</span>
      <span className="text-[11px] font-semibold text-[var(--color-text-muted)] whitespace-nowrap">{date}</span>
    </div>
  );
}
// ─── Language Dropdown (topbar) ─────────────────────────────────────────────
const LANGS = [
  { code: 'id', label: 'ID', name: 'Indonesia' },
  { code: 'en', label: 'EN', name: 'English' },
];

function LanguageDropdown({ language, setLanguage, hidden }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGS.find(l => l.code === language) || LANGS[0];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={`relative ${hidden ? 'hidden' : 'block'}`} ref={ref}>
      <IconButton
        onClick={() => setOpen(v => !v)}
        active={open}
        aria-label="Ganti Bahasa"
        className="text-[11px] font-black"
      >
        {current.label}
      </IconButton>

      {open && (
        <div className="absolute mt-2 w-40 rounded-2xl glass-dropdown overflow-hidden z-50 right-0 p-1.5 animate-in fade-in zoom-in duration-150">
          {LANGS.map(item => (
            <button
              key={item.code}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
                toast.success(`Bahasa: ${item.name}`);
              }}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold transition
                  ${language === item.code
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
            >
              <span className="w-6 text-[9px] font-black text-[var(--color-text-muted)]">{item.label}</span>
              <span className="flex-1 text-left">{item.name}</span>
              {language === item.code && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SlimTopBar({ onToggleSidebar, sidebarCollapsed }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // ── State ──
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [language, setLanguage] = useState('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [recentPages, setRecentPages] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const profileRef = useRef(null);
  const notifBtnRef = useRef(null);
  const notifPanelRef = useRef(null);
  const searchRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // ── Load notifications ──
  const loadNotifications = async () => {
    try {
      setLoadingNotif(true);
      const data = await getNotifications(5);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoadingNotif(false);
    }
  };

  const handleRefreshNotifications = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Track recent pages ──
  useEffect(() => {
    pushRecentPage(location.pathname);
    setRecentPages(getRecentPages());
    setSearchQuery('');
    setSearchFocused(false);
  }, [location.pathname]);

  // ── Search results ──
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchablePages.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.desc?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  // Recent entries (exclude current page, max 4)
  const recentEntries = useMemo(() => {
    return resolveRecentEntries(
      recentPages.filter(p => p !== location.pathname)
    ).slice(0, 4);
  }, [recentPages, location.pathname]);

  const showSearchResults = searchFocused && searchQuery.trim().length > 0;
  const showRecent = searchFocused && searchQuery.trim().length === 0 && recentEntries.length > 0;
  const showSearchDropdown = showSearchResults || showRecent;

  // Semua items yang bisa di-highlight (results atau recent)
  const highlightableItems = showSearchResults ? searchResults : recentEntries;

  useEffect(() => { setHighlightIdx(0); }, [searchResults.length, showRecent]);

  // ── Close on outside click ──
  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      const isOutsideNotifBtn = notifBtnRef.current && !notifBtnRef.current.contains(e.target);
      const isOutsideNotifPanel = notifPanelRef.current && !notifPanelRef.current.contains(e.target);
      if (isOutsideNotifBtn && isOutsideNotifPanel) setNotifOpen(false);
      const isOutsideSearch = searchRef.current && !searchRef.current.contains(e.target);
      const isOutsideDropdown = searchDropdownRef.current && !searchDropdownRef.current.contains(e.target);
      if (isOutsideSearch && isOutsideDropdown) setSearchFocused(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearchNavigate = useCallback((to) => {
    setSearchQuery('');
    setSearchFocused(false);
    navigate(to);
  }, [navigate]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, highlightableItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightableItems.length > 0) {
      e.preventDefault();
      handleSearchNavigate(highlightableItems[highlightIdx]?.path);
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
      setSearchQuery('');
      searchRef.current?.querySelector('input')?.blur();
    }
  }, [highlightableItems, highlightIdx, handleSearchNavigate]);

  // ── Ctrl+K / Cmd+K ──
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
        setSearchFocused(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
      loadNotifications();
    }
    setNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleDismissNotification = async (id) => {
    await markAsRead(id);
    loadNotifications();
  };

  return (
    <>
      {/* Bell shake animation */}
      <style>{`
        @keyframes bellShake {
          0%,85%,100%{transform:rotate(0deg)}
          88%{transform:rotate(-12deg)}
          92%{transform:rotate(12deg)}
          96%{transform:rotate(-8deg)}
          98%{transform:rotate(8deg)}
        }
      `}</style>

      <header
        className={`sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border)]
            ${sidebarCollapsed ? 'lg:pl-[56px]' : 'lg:pl-[220px]'}`}
      >
        <div className="flex items-center justify-between h-14 px-3 sm:px-4 gap-2 sm:gap-4">

          {/* Left + Search */}
          <div className={`flex items-center gap-2 sm:gap-3 min-w-0 ${searchFocused ? 'flex-1' : 'flex-1'}`}>
            {/* Desktop sidebar toggle + back button — tersembunyi saat search fokus di mobile */}
            <div className={`flex items-center gap-1 shrink-0 ${searchFocused ? 'hidden sm:flex' : 'flex'}`}>
              <IconButton
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
                className="hidden lg:flex"
              >
                {sidebarCollapsed
                  ? <PanelLeftOpen className="w-4 h-4" strokeWidth={2} />
                  : <PanelLeftClose className="w-4 h-4" strokeWidth={2} />
                }
              </IconButton>

              <IconButton onClick={() => navigate(-1)} aria-label="Kembali">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </IconButton>
            </div>

            {/* Search */}
            <div className={`relative transition-all duration-200 ${searchFocused ? 'flex-1' : 'sm:flex-1'}`} ref={searchRef}>
              {/* Mobile icon button saat belum fokus */}
              {!searchFocused && (
                <IconButton
                  onClick={() => setSearchFocused(true)}
                  aria-label="Cari halaman"
                  className="sm:hidden"
                >
                  <Search className="w-4 h-4" strokeWidth={2} />
                </IconButton>
              )}

              <div className={`w-full ${searchFocused ? 'flex' : 'hidden sm:flex'} items-center gap-2 h-8 px-3 rounded-xl border transition-all
                  ${searchFocused
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:bg-[var(--color-surface)]'}`}
              >
                <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" strokeWidth={2} />
                <input
                  type="text"
                  placeholder={showRecent ? 'Cari atau pilih halaman terakhir...' : 'Cari halaman...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus={searchFocused}
                  className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                />
                {!searchFocused ? (
                  <span className="hidden sm:flex items-center gap-0.5 text-[9px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded-md border border-[var(--color-border)]">
                    <span>⌘</span><span>K</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition shrink-0"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Dropdown — search results atau recent pages */}
              {showSearchDropdown && (
                <div
                  ref={searchDropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl glass-dropdown overflow-hidden z-50 animate-in fade-in zoom-in duration-150"
                >
                  {/* Recent pages header */}
                  {showRecent && (
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                        Baru dikunjungi
                      </p>
                    </div>
                  )}

                  <div className="p-1.5">
                    {showSearchResults && searchResults.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[var(--color-text-muted)]">
                        <p className="text-[12px] font-bold">Halaman tidak ditemukan</p>
                        <p className="text-[10px] mt-1">Coba kata kunci lain</p>
                      </div>
                    ) : (
                      highlightableItems.map((item, idx) => (
                        <SearchResultItem
                          key={item.path}
                          item={item}
                          isHighlighted={idx === highlightIdx}
                          onClick={handleSearchNavigate}
                          isRecent={showRecent}
                        />
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center justify-between text-[var(--color-text-muted)]">
                    <span className="text-[9px] font-bold">↑↓ Navigasi</span>
                    <span className="text-[9px] font-bold">↵ Buka</span>
                    <span className="text-[9px] font-bold">Esc Tutup</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Theme + AI + Bell + Avatar (language pindah ke profile dropdown) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Live Clock */}
            <LiveClock />

            {/* Asisten AI */}
            <button
              onClick={() => toast('Fitur Asisten AI sedang disiapkan!', { icon: '✨' })}
              className={`w-8 h-8 sm:w-auto sm:h-8 flex items-center justify-center sm:gap-1.5 sm:px-3 rounded-xl
            bg-gradient-to-r from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20
            text-[var(--color-primary)] border border-indigo-250/30 dark:border-indigo-900/30
            hover:border-[var(--color-primary)]/40 transition text-[11px] font-extrabold shadow-sm shadow-indigo-500/5
            ${searchFocused ? 'hidden' : 'flex'}`}
              type="button"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-[var(--color-primary)] animate-pulse" strokeWidth={2} />
              <span className="hidden sm:inline">Asisten AI</span>
            </button>

            {/* Language toggle */}
            <LanguageDropdown language={language} setLanguage={setLanguage} hidden={searchFocused} />

            {/* Theme toggle */}
            <IconButton
              onClick={toggleTheme}
              aria-label={isDark ? "Mode Terang" : "Mode Gelap"}
              className={searchFocused ? 'hidden' : ''}
            >
              {isDark
                ? <Sun className="w-4 h-4" strokeWidth={2} />
                : <Moon className="w-4 h-4" strokeWidth={2} />
              }
            </IconButton>

            {/* Notification bell */}
            <div className={`relative ${searchFocused ? 'hidden' : 'block'}`} ref={notifBtnRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className={`relative w-8 h-8 flex items-center justify-center rounded-xl border transition
        ${notifOpen
                    ? 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-primary)]'}
        ${unreadCount > 0 ? 'animate-[bellShake_2s_ease-in-out_infinite]' : ''}`}
                aria-label="Notifikasi"
                type="button"
              >
                <Bell className="w-4 h-4" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border border-[var(--color-surface)]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--color-border)] mx-0.5 opacity-50" />

            {/* Profile (language switcher dipindah ke sini) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(v => !v)}
                aria-label="Menu Profil"
                className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[var(--color-surface-alt)] transition border border-transparent hover:border-[var(--color-border)]
                    ${profileOpen ? 'bg-[var(--color-surface-alt)] border-[var(--color-border)]' : ''}`}
                type="button"
              >
                <Avatar name={user?.fullName || 'User'} url={user?.avatarUrl} />
                <div className="hidden lg:flex flex-col min-w-0 max-w-[120px]">
                  <span className="text-[11px] font-extrabold text-[var(--color-text)] leading-tight truncate">{user?.fullName || 'User'}</span>
                  <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider leading-none mt-0.5 truncate">{user?.role || 'DEVELOPER'}</span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-[var(--color-text-muted)] transition-transform hidden sm:block ${profileOpen ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>

              {profileOpen && (
                <div className="absolute mt-2 w-56 rounded-2xl glass-dropdown overflow-hidden z-50 right-0">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[var(--color-border)]">
                    <p className="text-[12.5px] font-black text-[var(--color-text)] truncate">{user?.fullName || 'User'}</p>
                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">{user?.role || 'DEVELOPER'}</p>
                  </div>

                  {/* Language Switcher — compact, di dalam profile */}
                  <div className="px-3 py-2 border-b border-[var(--color-border)]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Bahasa</p>
                    <div className="flex gap-1">
                      {[
                        { code: 'id', label: 'ID' },
                        { code: 'en', label: 'EN' },
                        { code: 'ar', label: 'AR' },
                      ].map(item => (
                        <button
                          key={item.code}
                          onClick={() => {
                            setLanguage(item.code);
                            toast.success(`Bahasa: ${item.label}`);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-tight transition
                              ${language === item.code
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-alt)] transition font-semibold text-[13px] text-[var(--color-text)] text-left"
                    type="button"
                  >
                    <Settings className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span>Pengaturan</span>
                  </button>
                  <button
                    onClick={async () => { setProfileOpen(false); await logout(); navigate("/login"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-alt)] transition font-semibold text-[13px] text-red-600 text-left"
                    type="button"
                  >
                    <LogOut className="w-4 h-4 text-red-600 shrink-0" strokeWidth={2} />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      {notifOpen && (
        <div
          ref={notifPanelRef}
          className="fixed top-[56px] w-full max-w-[340px] rounded-2xl glass-dropdown overflow-hidden z-[99999] flex flex-col right-3 sm:right-4 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="px-3.5 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[var(--color-primary)]" strokeWidth={2} />
              <span className="text-[12px] font-extrabold text-[var(--color-text)]">Notifikasi</span>
            </div>
            <button
              onClick={handleRefreshNotifications}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] transition"
              disabled={refreshing}
              type="button"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto p-2 space-y-2 no-scrollbar">
            {loadingNotif ? (
              <div className="py-8 text-center text-[var(--color-text-muted)] flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-bold">Memuat...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-[var(--color-text-muted)] flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 opacity-15 mb-2.5" strokeWidth={1.5} />
                <p className="text-[11.5px] font-bold">Tidak ada notifikasi</p>
                <p className="text-[10px] mt-0.5">Semua pesan baru akan muncul di sini</p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-3 rounded-xl border transition-all hover:scale-[1.01] flex gap-2.5 min-w-0 cursor-pointer
                    ${!item.isRead
                      ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-950/30'
                      : 'bg-[var(--color-surface-alt)] border-[var(--color-border)]'}`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pe-6">
                    <p className={`text-[12px] leading-tight text-[var(--color-text)] ${!item.isRead ? 'font-bold' : 'font-semibold'}`}>{item.title}</p>
                    <p className="text-[10.5px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{item.message}</p>
                    {item.createdAt && (
                      <span className="text-[9px] font-bold tracking-wider text-[var(--color-text-muted)]/75 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md mt-1.5 inline-block">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismissNotification(item.id); }}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                    aria-label="Tutup"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="px-3.5 py-2 bg-black/5 dark:bg-white/5 border-t border-[var(--color-border)] flex items-center justify-between text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">
            <span>Realtime</span>
            <span>Senyum</span>
          </div>
        </div>
      )}
    </>
  );
}