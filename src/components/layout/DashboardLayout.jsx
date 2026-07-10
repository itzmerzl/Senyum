import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import SlimTopBar from './SlimTopBar';
import { getBreadcrumb } from './menuGroups';

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb() {
  const { pathname } = useLocation();
  const crumbs = getBreadcrumb(pathname);

  // Jangan render di dashboard — sudah ada welcome banner
  if (pathname === '/dashboard' || crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 px-1 mb-3 -mt-1"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <ChevronRight
                className="w-3 h-3 text-[var(--color-text-muted)] shrink-0 opacity-50"
                strokeWidth={2}
              />
            )}
            {isLast || !crumb.path ? (
              <span
                className={`text-[11px] font-semibold truncate ${isLast
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)]'
                  }`}
              >
                {i === 0 && (
                  <Home className="inline w-3 h-3 mr-1 -mt-0.5 opacity-60" strokeWidth={2} />
                )}
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition truncate"
              >
                {i === 0 && (
                  <Home className="inline w-3 h-3 mr-1 -mt-0.5 opacity-60" strokeWidth={2} />
                )}
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('sidebar-collapsed');
      return stored ? stored === 'true' : false;
    } catch {
      return false;
    }
  });

  // Persist collapse state
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
    } catch { /* ignore */ }
  }, [sidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Sidebar width sebagai CSS variable di :root.
  // Dibaca langsung oleh Tailwind arbitrary value di <main> (lg:ml-[var(--sidebar-width)]),
  // jadi TIDAK perlu inject <style> tag / !important setiap render.
  const sidebarW = sidebarCollapsed ? '56px' : '220px';

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', sidebarW);
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
    };
  }, [sidebarW]);

  return (
    <div className="min-h-screen bg-[var(--color-app-bg)] transition-colors" translate="no">
      {/* Mobile bottom tab bar */}
      <BottomNav />

      {/* Desktop sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Slim top bar */}
      <SlimTopBar
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Ambient glow — desktop only */}
      <div className="hidden lg:block pointer-events-none fixed top-0 left-0 right-0 bottom-0 overflow-hidden z-0 select-none">
        <div
          className="absolute rounded-full filter blur-[150px] opacity-[0.06] dark:opacity-[0.03] pulse-glow-1 transition-all duration-700 ease-in-out"
          style={{
            top: '-10%',
            left: 'calc(var(--sidebar-width, 220px) + 10%)',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute rounded-full filter blur-[120px] opacity-[0.04] dark:opacity-[0.02] pulse-glow-2 transition-all duration-700 ease-in-out"
          style={{
            bottom: '-10%',
            right: '5%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Page Content */}
      {/*
        Offset sidebar dipindah dari <style>+!important ke Tailwind arbitrary value
        yang baca CSS var langsung (lg:ml-[var(--sidebar-width,220px)]).
        Sama-sama reaktif terhadap perubahan --sidebar-width, tapi tanpa re-inject
        <style> tag baru tiap render dan tanpa selector/!important yang fragile.
      */}
      <main
        data-layout-main
        className="relative z-10 w-full px-3 sm:px-4 lg:px-5 py-3 lg:py-4 pb-24 lg:pb-6 transition-all duration-300 lg:ml-[var(--sidebar-width,220px)] lg:w-[calc(100%-var(--sidebar-width,220px))]"
      >
        <div className="mx-auto w-full max-w-[1400px] space-y-4">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}