import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Settings, LogOut } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { menuGroups } from "./menuGroups";
import logoSenyum from "../../assets/logo-senyum.png";

// ─── NavIcon Helper ──────────────────────────────────────────────────────────
function NavIcon({ icon: IconComponent, className = "" }) {
  if (!IconComponent) return null;
  return <IconComponent className={className || "w-4 h-4"} strokeWidth={2} />;
}

// ─── Avatar (shared juga dipakai di topbar) ───────────────────────────────────
function Avatar({ url, name, size = "w-7 h-7", textSize = "text-[10px]", rounded = "rounded-lg" }) {
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

// ─── Sidebar Persistence ──────────────────────────────────────────────────────
const GROUPS_KEY = 'sidebar-groups-open';

function getInitialGroupsOpen() {
  try {
    const stored = localStorage.getItem(GROUPS_KEY);
    return stored ? JSON.parse(stored) : {
      masterData: true,
      transaksi: true,
      laporan: false,
      manajemen: false,
      logs: false
    };
  } catch {
    return { masterData: true, transaksi: true, laporan: false, manajemen: false, logs: false };
  }
}

// ─── Single Nav Item ──────────────────────────────────────────────────────────
function SidebarItem({ item, collapsed, badge }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      className={({ isActive }) =>
        `group/item flex items-center rounded-xl text-[12.5px] font-semibold transition-all duration-300 relative min-w-0
        ${isActive
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'}
        ${collapsed
          ? 'w-10 h-10 justify-center p-2 mx-auto group-hover/sidebar:w-full group-hover/sidebar:px-2.5 group-hover/sidebar:py-[5px] group-hover/sidebar:gap-2.5 group-hover/sidebar:justify-start group-hover/sidebar:mx-0'
          : 'w-full px-2.5 py-[5px] gap-2.5'}`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--color-primary)] transition-all duration-300
                ${collapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}
            />
          )}

          {/* Icon */}
          <div className={`relative w-5 h-5 flex items-center justify-center shrink-0 transition-colors duration-200
              ${isActive
              ? 'text-[var(--color-primary)]'
              : 'text-[var(--color-text-muted)] group-hover/item:text-[var(--color-text)]'}`}
          >
            <NavIcon icon={item.icon} className="w-[18px] h-[18px]" />
            {/* Badge dot (collapsed mode) */}
            {badge > 0 && collapsed && (
              <span className="absolute -top-1 -right-1 w-[7px] h-[7px] bg-red-500 rounded-full border border-[var(--color-surface)] group-hover/sidebar:hidden" />
            )}
          </div>

          <span className={`truncate leading-normal text-left transition-all duration-300
              ${collapsed ? 'w-0 opacity-0 group-hover/sidebar:w-36 group-hover/sidebar:opacity-100 overflow-hidden' : 'w-auto opacity-100'}`}
          >
            {item.label}
          </span>

          {/* Badge (expanded mode) */}
          {badge > 0 && !collapsed && (
            <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center leading-none">
              {badge > 99 ? '99+' : badge}
            </span>
          )}

          {/* Tooltip for collapsed mode */}
          {collapsed && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 scale-95 pointer-events-none group-hover/item:opacity-100 group-hover/item:scale-100 transition-all duration-200 z-[9999] whitespace-nowrap group-hover/sidebar:hidden">
              {item.label}
              {badge > 0 && <span className="ml-1.5 px-1 bg-red-500 rounded text-[8px]">{badge}</span>}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Collapsible Group ────────────────────────────────────────────────────────
function SidebarGroup({ group, items, collapsed, isOpen, onToggle, badges = {} }) {
  const location = useLocation();

  const hasActiveChild = useMemo(() =>
    items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/')),
    [items, location.pathname]
  );

  const showChildren = isOpen || hasActiveChild;

  // Total badge count untuk group (kalau collapsed)
  const groupBadgeTotal = useMemo(() =>
    items.reduce((sum, item) => sum + (badges[item.path] || 0), 0),
    [items, badges]
  );

  return (
    <div className="relative group/grp flex flex-col">
      <button
        type="button"
        onClick={collapsed ? undefined : onToggle}
        className={`flex items-center justify-between rounded-xl min-w-0 outline-none transition-all duration-300 relative
            ${collapsed
            ? 'w-10 h-10 justify-center mx-auto hover:bg-[var(--color-surface-alt)] group-hover/sidebar:w-full group-hover/sidebar:px-2.5 group-hover/sidebar:py-[5px] group-hover/sidebar:justify-between group-hover/sidebar:mx-0'
            : 'w-full justify-between px-2.5 py-[5px]'}
            ${(!collapsed && hasActiveChild)
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-text-muted)]/70 hover:text-[var(--color-text-muted)]'}`}
      >
        <div className="flex items-center min-w-0">
          {/* Group Icon (collapsed) */}
          <div className={`relative flex items-center justify-center shrink-0 transition-all duration-300
              ${collapsed ? 'w-5 opacity-100 group-hover/sidebar:w-0 group-hover/sidebar:opacity-0 group-hover/sidebar:overflow-hidden' : 'w-0 opacity-0 overflow-hidden'}`}
          >
            <NavIcon icon={group.icon} className="w-4 h-4 text-[var(--color-text-muted)]/70" />
            {/* Group badge dot (collapsed) */}
            {groupBadgeTotal > 0 && collapsed && (
              <span className="absolute -top-1 -right-1 w-[7px] h-[7px] bg-red-500 rounded-full border border-[var(--color-surface)] group-hover/sidebar:hidden" />
            )}
          </div>

          {/* Group Label */}
          <span className={`truncate text-left leading-normal transition-all duration-300
              ${collapsed
              ? 'w-0 opacity-0 group-hover/sidebar:w-36 group-hover/sidebar:opacity-100 overflow-hidden text-[9px] font-black tracking-widest uppercase text-[var(--color-text-muted)]/70'
              : 'text-[9px] font-black tracking-widest uppercase text-[var(--color-text-muted)]/70'}`}
          >
            {group.label === 'Master Data' ? 'DATA MASTER' : group.label.toUpperCase()}
          </span>
        </div>

        {/* Chevron */}
        <div className={`w-2.5 flex items-center justify-center shrink-0 transition-all duration-300
            ${collapsed ? 'w-0 opacity-0 group-hover/sidebar:w-2.5 group-hover/sidebar:opacity-100 overflow-hidden' : 'w-2.5 opacity-100'}`}
        >
          <NavIcon
            icon={showChildren ? ChevronDown : ChevronRight}
            className="text-[10px] shrink-0 text-[var(--color-text-muted)]/70"
          />
        </div>

        {/* Tooltip for collapsed mode */}
        {collapsed && (
          <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 scale-95 pointer-events-none group-hover/grp:opacity-100 group-hover/grp:scale-100 transition-all duration-200 z-[9999] whitespace-nowrap group-hover/sidebar:hidden">
            {group.label}
            {groupBadgeTotal > 0 && <span className="ml-1.5 px-1 bg-red-500 rounded text-[8px]">{groupBadgeTotal}</span>}
          </div>
        )}
      </button>

      {/* Submenu items */}
      <div className={`pl-0.5 space-y-[1px] mt-0.5 transition-all duration-300 origin-top
          ${collapsed ? 'h-0 opacity-0 overflow-hidden group-hover/sidebar:h-auto group-hover/sidebar:opacity-100 group-hover/sidebar:mt-1' : ''}`}
      >
        {showChildren && items.map(item => (
          <SidebarItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            badge={badges[item.path] || 0}
          />
        ))}
      </div>
    </div>
  );
}



// ─── Main Sidebar Component ──────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle, badges = {} }) {
  // badges: { '/liabilities': 3, '/transactions': 1 } — pass dari parent/store
  const { user, logout } = useAuthStore();
  const role = user?.role?.toLowerCase() || '';

  const navRef = useRef(null);
  const [showScrollFade, setShowScrollFade] = useState(false);

  // Restore scroll top
  useLayoutEffect(() => {
    try {
      const savedScroll = sessionStorage.getItem('sidebar-scroll-top');
      if (savedScroll && navRef.current) {
        navRef.current.scrollTop = Number(savedScroll);
      }
    } catch { /* ignore */ }
  }, [collapsed]);

  // Save scroll + update fade indicator
  const handleScroll = useCallback((e) => {
    try {
      sessionStorage.setItem('sidebar-scroll-top', String(e.currentTarget.scrollTop));
    } catch { /* ignore */ }

    const el = e.currentTarget;
    const canScrollMore = el.scrollTop + el.clientHeight < el.scrollHeight - 8;
    setShowScrollFade(canScrollMore);
  }, []);

  // Init fade state
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const canScrollMore = el.scrollTop + el.clientHeight < el.scrollHeight - 8;
    setShowScrollFade(canScrollMore);
  }, [collapsed]);

  // Groups open/close state
  const [groupsOpen, setGroupsOpen] = useState(getInitialGroupsOpen);

  useEffect(() => {
    try {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(groupsOpen));
    } catch { /* ignore */ }
  }, [groupsOpen]);

  const toggleGroup = useCallback((key) => {
    setGroupsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Filter by role
  const visibleGroups = useMemo(() => {
    return menuGroups.filter(group => {
      if (group.adminOnly && role !== 'admin') return false;
      return true;
    });
  }, [role]);

  const sidebarW = collapsed
    ? 'w-[56px] hover:w-[220px] shadow-none hover:shadow-[10px_0_40px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[10px_0_40px_-6px_rgba(0,0,0,0.45)]'
    : 'w-[220px]';

  const handleLogout = useCallback(async () => {
    await logout?.();
  }, [logout]);

  return (
    <aside
      className={`hidden lg:flex flex-col fixed top-0 h-screen z-50 bg-[var(--color-surface)] ${sidebarW}
          transition-all duration-300 ease-in-out group/sidebar
          left-0 border-r border-[var(--color-border)]`}
    >
      {/* ── Logo Section ── */}
      <div className={`shrink-0 border-b border-[var(--color-border)] ${collapsed ? 'px-2 py-3 group-hover/sidebar:px-3.5 group-hover/sidebar:py-3' : 'px-3.5 py-3'} transition-all duration-300`}>
        <div className={`flex items-center ${collapsed ? 'justify-center group-hover/sidebar:justify-start group-hover/sidebar:gap-2.5' : 'gap-2.5'} transition-all duration-300`}>
          <img
            src={logoSenyum}
            alt="Logo Senyum"
            className="w-8 h-8 object-contain shrink-0 rounded-xl"
          />
          <div className={`min-w-0 flex flex-col transition-all duration-300
              ${collapsed ? 'w-0 opacity-0 group-hover/sidebar:w-36 group-hover/sidebar:opacity-100 overflow-hidden' : 'w-auto opacity-100'}`}
          >
            <p className="text-[13px] font-extrabold text-[var(--color-text)] leading-tight truncate font-heading">
              SenyumMu
            </p>
            <p className="text-[8px] font-bold tracking-widest uppercase text-[var(--color-text-muted)] whitespace-nowrap mt-0.5">
              Koperasi Sekolah
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="relative flex-1 min-h-0">
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className={`h-full overflow-y-auto overflow-x-hidden py-2.5 space-y-0.5 scrollbar-none transition-all duration-300
              ${collapsed ? 'px-1.5 group-hover/sidebar:px-2.5' : 'px-2.5'}`}
        >
          {visibleGroups.map(group => {
            if (group.type === 'single') {
              return <SidebarItem key={group.path} item={group} collapsed={collapsed} badge={badges[group.path] || 0} />;
            }
            if (group.items.length === 0) return null;
            return (
              <SidebarGroup
                key={group.id}
                group={group}
                items={group.items}
                collapsed={collapsed}
                isOpen={groupsOpen[group.id] ?? true}
                onToggle={() => toggleGroup(group.id)}
                badges={badges}
              />
            );
          })}
        </nav>

        {/* Scroll fade indicator */}
        {showScrollFade && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--color-surface))'
            }}
          />
        )}
      </div>
    </aside>
  );
}