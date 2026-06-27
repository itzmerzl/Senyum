import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Cpu, Database, Info, X, Trash2, ShieldAlert,
  Wifi, WifiOff, Layers, Monitor, Play, AlertOctagon,
  Search, Shield, Check, Copy, AlertTriangle, Activity, Settings,
  Download, Sun, Moon, FileText, ArrowLeftRight, Route,
  Globe, Clock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// RouteLogger — tiny child component that tracks React Router navigations.
// Place <RouteLogger addLog={addLog} /> inside your <Router> tree if you use
// react-router-dom v6. If you don't use React Router just delete this block.
// ─────────────────────────────────────────────────────────────────────────────
export function RouteLogger({ addLog }) {
  // Dynamically import so the file doesn't crash in projects without RRD.
  const [location, setLocation] = useState(null);
  const prevPath = useRef(window.location.pathname);

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useLocation } = require('react-router-dom');
      // This will only work when rendered inside a Router context.
      // If it throws, the catch below swallows it silently.
      setLocation({ pathname: window.location.pathname });
    } catch {
      // react-router-dom not present — skip silently
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const next = window.location.pathname;
      if (prevPath.current !== next) {
        addLog({
          type: 'info',
          message: `Route: ${prevPath.current} → ${next}`,
          source: 'Router',
          timestamp: new Date().toLocaleTimeString(),
        });
        prevPath.current = next;
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [addLog]);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SystemDebugger component
// ─────────────────────────────────────────────────────────────────────────────
export function SystemDebugger() {
  const { theme, setTheme } = useTheme();

  // ── State ──────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [logs, setLogs] = useState(() => {
    // FIX: persist logs to sessionStorage so they survive Vite HMR reloads
    try {
      const saved = sessionStorage.getItem('senyum-devtools-logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [fps, setFps] = useState(60);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [memoryInfo, setMemoryInfo] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [storageUsage, setStorageUsage] = useState({ local: 0, session: 0 });
  const [triggerCrash, setTriggerCrash] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [unseenErrors, setUnseenErrors] = useState(0);   // FAB badge count
  const [perfTimings, setPerfTimings] = useState(null);  // Page load timings
  const [networkLogs, setNetworkLogs] = useState([]);    // Fetch interceptor logs
  const [panelSide, setPanelSide] = useState(           // Pinnable panel side
    () => localStorage.getItem('senyum-devtools-side') || 'right'
  );

  // ── Dev-only guard ─────────────────────────────────────────────────────────
  const isDev =
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // ── Refs ───────────────────────────────────────────────────────────────────
  const fpsFrameRef = useRef(0);
  const fpsLastTimeRef = useRef(performance.now());
  const rafIdRef = useRef(null);
  // FIX: stable log IDs via a counter ref — never use array index as key
  const logIdRef = useRef(0);

  // ── addLog — central helper ────────────────────────────────────────────────
  const addLog = useCallback((log) => {
    logIdRef.current += 1;
    const entry = { ...log, id: logIdRef.current };
    setLogs((prev) => {
      const next = [entry, ...prev].slice(0, 150);
      // Persist to sessionStorage
      try { sessionStorage.setItem('senyum-devtools-logs', JSON.stringify(next)); } catch { }
      return next;
    });
    // Bump unseen badge when the panel is closed and an error comes in
    if (log.type === 'error') {
      setIsOpen((open) => {
        if (!open) setUnseenErrors((n) => n + 1);
        return open;
      });
    }
  }, []);

  // ── Open panel — resets unseen badge ──────────────────────────────────────
  const openPanel = () => {
    setIsOpen(true);
    setUnseenErrors(0);
  };

  // ── FPS tracker ───────────────────────────────────────────────────────────
  useEffect(() => {
    const calculateFps = () => {
      fpsFrameRef.current++;
      const now = performance.now();
      if (now >= fpsLastTimeRef.current + 1000) {
        setFps(
          Math.round(
            (fpsFrameRef.current * 1000) / (now - fpsLastTimeRef.current)
          )
        );
        fpsFrameRef.current = 0;
        fpsLastTimeRef.current = now;
      }
      rafIdRef.current = requestAnimationFrame(calculateFps);
    };
    rafIdRef.current = requestAnimationFrame(calculateFps);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []);

  // ── Resize / online / storage / memory — unified cleanup ──────────────────
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      addLog({
        type: navigator.onLine ? 'success' : 'warn',
        message: navigator.onLine
          ? 'Jaringan terhubung (Online)'
          : 'Jaringan terputus (Offline)',
        source: 'Network',
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    const updateStorageStats = () => {
      let localSize = 0;
      let sessionSize = 0;
      try {
        for (const key in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, key))
            localSize += (localStorage[key].length + key.length) * 2;
        }
        for (const key in sessionStorage) {
          if (Object.prototype.hasOwnProperty.call(sessionStorage, key))
            sessionSize += (sessionStorage[key].length + key.length) * 2;
        }
      } catch { }
      setStorageUsage({
        local: (localSize / 1024).toFixed(2),
        session: (sessionSize / 1024).toFixed(2),
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    updateStorageStats();

    // FIX: unified cleanup — memory interval is declared here and cleaned below
    let memoryInterval;
    if (performance.memory) {
      const readMemory = () => ({
        used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        // FIX: correct property name (was jsHeapLimit — that doesn't exist)
        limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      });
      setMemoryInfo(readMemory());
      memoryInterval = setInterval(() => setMemoryInfo(readMemory()), 3000);
    }

    const storageInterval = setInterval(updateStorageStats, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(storageInterval);
      if (memoryInterval) clearInterval(memoryInterval);
    };
  }, [addLog]);

  // ── Page load timings (Performance API) ───────────────────────────────────
  useEffect(() => {
    const readTimings = () => {
      const [nav] = performance.getEntriesByType('navigation');
      if (nav) {
        setPerfTimings({
          dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
          connect: Math.round(nav.connectEnd - nav.connectStart),
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domReady: Math.round(nav.domContentLoadedEventEnd),
          loaded: Math.round(nav.loadEventEnd),
        });
      }
      const [fcp] = performance.getEntriesByName('first-contentful-paint');
      if (fcp) {
        setPerfTimings((prev) => ({
          ...prev,
          fcp: Math.round(fcp.startTime),
        }));
      }
    };
    // loadEventEnd may be 0 if this runs before load fires
    if (document.readyState === 'complete') {
      readTimings();
    } else {
      window.addEventListener('load', readTimings, { once: true });
    }
  }, []);

  // ── Console / global error interception ───────────────────────────────────
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    const SUPPRESSED = ['ErrorBoundary caught', 'Failed to load stats'];
    const isSuppressed = (msg) => SUPPRESSED.some((s) => msg.includes(s));

    const handleGlobalError = (event) => {
      addLog({
        type: 'error',
        message: event.message || 'Script error',
        source: event.filename
          ? `${event.filename.split('/').pop()}:${event.lineno}`
          : 'window.onerror',
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    const handlePromiseRejection = (event) => {
      addLog({
        type: 'error',
        message: `Unhandled Rejection: ${event.reason?.message || event.reason || 'Unknown reason'
          }`,
        source: 'Promise',
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    console.error = (...args) => {
      const msg = args
        .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');
      if (!isSuppressed(msg)) {
        addLog({
          type: 'error',
          message: msg,
          source: 'console.error',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      addLog({
        type: 'warn',
        message: args
          .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
          .join(' '),
        source: 'console.warn',
        timestamp: new Date().toLocaleTimeString(),
      });
      originalWarn.apply(console, args);
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) setUnseenErrors(0);
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addLog]);

  // ── Network fetch interceptor ──────────────────────────────────────────────
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const start = performance.now();
      const url =
        typeof args[0] === 'string'
          ? args[0]
          : args[0] instanceof Request
            ? args[0].url
            : String(args[0]);
      const method = (args[1]?.method || 'GET').toUpperCase();
      // Shorten URL for display
      const shortUrl = url.replace(window.location.origin, '');

      try {
        const res = await originalFetch(...args);
        const ms = Math.round(performance.now() - start);
        const entry = {
          method,
          url: shortUrl,
          status: res.status,
          ms,
          ok: res.ok,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now(),
        };
        setNetworkLogs((prev) => [entry, ...prev].slice(0, 100));
        // Also surface errors as event logs
        if (!res.ok) {
          addLog({
            type: 'error',
            message: `${method} ${shortUrl} → ${res.status} (${ms}ms)`,
            source: 'fetch',
            timestamp: entry.timestamp,
          });
        }
        return res;
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        const entry = {
          method,
          url: shortUrl,
          status: 'ERR',
          ms,
          ok: false,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now(),
        };
        setNetworkLogs((prev) => [entry, ...prev].slice(0, 100));
        addLog({
          type: 'error',
          message: `NETWORK ERROR: ${method} ${shortUrl} (${ms}ms) — ${err?.message}`,
          source: 'fetch',
          timestamp: entry.timestamp,
        });
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [addLog]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.removeItem('senyum-devtools-logs'); // keep devtools logs separate
    sessionStorage.clear();
    addLog({
      type: 'success',
      message: 'Seluruh cache localStorage & sessionStorage dibersihkan!',
      source: 'State Cleaner',
      timestamp: new Date().toLocaleTimeString(),
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleTriggerPromiseRejection = () => {
    Promise.reject(new Error('Tes Unhandled Promise Rejection'));
  };

  // FIX: async + try/catch on clipboard — won't crash on HTTP or denied perms
  const handleCopyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // Clipboard unavailable (HTTP, permissions denied) — silent fail
    }
  };

  const getBreakpoint = (width) => {
    if (width < 640) return 'xs/mobile';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  };

  // Export all logs as a .json file
  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `senyum-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate a full Markdown bug report and copy it to clipboard
  const handleGenerateBugReport = async () => {
    const errors = logs.filter((l) => l.type === 'error');
    const recentNet = networkLogs.slice(0, 10);
    const report = `## Bug Report — ${new Date().toISOString()}

### System
- URL: ${window.location.href}
- Mode: ${import.meta.env.MODE}
- Browser: ${navigator.userAgent}
- Viewport: ${windowSize.width}×${windowSize.height} (${getBreakpoint(windowSize.width)})
- Memory: ${memoryInfo?.used ?? 'N/A'} MB used / ${memoryInfo?.total ?? 'N/A'} MB allocated
- Online: ${isOnline}

### Page Load Timings
${perfTimings
        ? `- DNS: ${perfTimings.dns}ms
- TTFB: ${perfTimings.ttfb}ms
- DOM Ready: ${perfTimings.domReady}ms
- Fully Loaded: ${perfTimings.loaded}ms
- First Contentful Paint: ${perfTimings.fcp ?? 'N/A'}ms`
        : 'Not available'
      }

### Error Logs (${errors.length})
${errors.length > 0
        ? errors
          .map((e) => `- [${e.timestamp}] [${e.source}] ${e.message}`)
          .join('\n')
        : 'No errors recorded.'
      }

### Recent Network Requests (last 10)
${recentNet.length > 0
        ? recentNet
          .map((n) => `- [${n.timestamp}] ${n.method} ${n.url} → ${n.status} (${n.ms}ms)`)
          .join('\n')
        : 'No network requests recorded.'
      }
`.trim();

    try {
      await navigator.clipboard.writeText(report);
      addLog({
        type: 'success',
        message: 'Bug report disalin ke clipboard!',
        source: 'Bug Reporter',
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch {
      // fallback: download as .md
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bug-report-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Toggle panel side and persist preference
  const handleToggleSide = () => {
    const next = panelSide === 'right' ? 'left' : 'right';
    setPanelSide(next);
    localStorage.setItem('senyum-devtools-side', next);
  };

  // Theme toggle (requires ThemeContext to expose setTheme)
  const handleToggleTheme = () => {
    if (typeof setTheme === 'function') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  // Filtered + searched logs
  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      logFilter === 'all' ||
      (logFilter === 'error' && log.type === 'error') ||
      (logFilter === 'warn' && log.type === 'warn') ||
      (logFilter === 'success' && log.type === 'success') ||
      (logFilter === 'info' && log.type === 'info');

    const matchesSearch =
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.source.toLowerCase().includes(logSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // FIX: crash simulator throws in render phase (not useEffect) so ErrorBoundary catches it
  if (triggerCrash) {
    throw new Error('Pemicu Kegagalan Sistem (Simulated Test Crash)');
  }

  if (!isDev) return null;

  // ── Shared card class ──────────────────────────────────────────────────────
  const card =
    'bg-white/80 dark:bg-gray-900/60 border border-gray-200/60 dark:border-white/5 rounded-xl shadow-sm dark:shadow-none hover:border-blue-500/20 transition-all duration-200';
  const cardHeader =
    'flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2 mb-1';
  const cardLabel =
    'font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-[10px]';

  // ── Panel slide direction ──────────────────────────────────────────────────
  const slideClass =
    panelSide === 'right'
      ? 'right-0 border-l animate-in slide-in-from-right'
      : 'left-0 border-r animate-in slide-in-from-left';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Route tracker (no-op if react-router-dom not installed) */}
      <RouteLogger addLog={addLog} />

      {/* ── Floating Action Button ── */}
      <button
        onClick={openPanel}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-2.5 bg-white/90 dark:bg-gray-900/90 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white rounded-full border border-gray-200 dark:border-gray-700 shadow-lg text-xs font-semibold backdrop-blur-md transition-all duration-300 hover:scale-105 group active:scale-95"
      >
        {/* Error badge */}
        {unseenErrors > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-white dark:ring-gray-900">
            {unseenErrors > 9 ? '9+' : unseenErrors}
          </span>
        )}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <Terminal className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
        <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-bold">
          Senyum DevTools
        </span>
      </button>

      {/* ── Slide-out Panel ── */}
      {isOpen && (
        <div
          className={`fixed inset-y-0 ${slideClass} w-full md:w-[500px] z-[99999] bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-800 dark:text-gray-100 shadow-2xl border-gray-200/50 dark:border-white/5 flex flex-col font-mono text-xs backdrop-blur-xl fade-in duration-300`}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-white/5 bg-gray-100/60 dark:bg-gray-900/60 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 tracking-tight">
                  Koperasi Senyum DevTools
                </span>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Diagnostik &amp; Pemantauan Sistem Real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              {/* Theme toggle */}
              {typeof setTheme === 'function' && (
                <button
                  onClick={handleToggleTheme}
                  className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title="Toggle tema (Light/Dark)"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              )}
              {/* Panel side toggle */}
              <button
                onClick={handleToggleSide}
                className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title={`Pindah panel ke ${panelSide === 'right' ? 'kiri' : 'kanan'}`}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                title="Tutup Panel (Ctrl+Shift+D)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Navigation Tabs ── */}
          <div className="flex border-b border-gray-200/50 dark:border-white/5 bg-gray-100/80 dark:bg-gray-950/40 p-1 gap-1 shrink-0">
            {[
              { id: 'performance', label: 'Telemetry', icon: Activity },
              { id: 'network', label: 'Network', icon: Globe },
              { id: 'state', label: 'Actions', icon: Settings },
              { id: 'logs', label: 'Event Logs', icon: ShieldAlert },
              { id: 'system', label: 'System', icon: Info },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-1 flex items-center justify-center gap-1 rounded-lg border font-semibold transition-all duration-200 text-[10px] ${isActive
                      ? 'bg-blue-500/10 dark:bg-blue-600/15 border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-white/5'
                    }`}
                >
                  <Icon
                    className={`w-3 h-3 ${isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400'
                      }`}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

            {/* ═══ TELEMETRY TAB ═══════════════════════════════════════════ */}
            {activeTab === 'performance' && (
              <div className="space-y-4">
                {/* FPS + Network row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* FPS */}
                  <div className={`${card} p-4 flex flex-col gap-2`}>
                    <span className={cardLabel}>Frames Per Second</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span
                        className={`text-3xl font-extrabold tracking-tight ${fps > 45
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : fps > 25
                              ? 'text-amber-500 dark:text-amber-400'
                              : 'text-red-500 dark:text-red-400'
                          }`}
                      >
                        {fps}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                        FPS
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${fps > 45
                            ? 'bg-emerald-500'
                            : fps > 25
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(100, (fps / 60) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Network */}
                  <div className={`${card} p-4 flex flex-col gap-2`}>
                    <span className={cardLabel}>Connection Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`p-1.5 rounded-lg border ${isOnline
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                          }`}
                      >
                        {isOnline ? (
                          <Wifi className="w-4 h-4" />
                        ) : (
                          <WifiOff className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-extrabold tracking-tight ${isOnline
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                          }`}
                      >
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold uppercase">
                      {isOnline ? 'Tersambung ke internet' : 'Koneksi terputus!'}
                    </span>
                  </div>
                </div>

                {/* Memory */}
                {memoryInfo && (
                  <div className={`${card} p-4 space-y-3`}>
                    <div className={cardHeader}>
                      <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span className={cardLabel}>React Memory Allocation</span>
                      <span className="ml-auto text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px]">
                        JS Heap
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-gray-700 dark:text-gray-300">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Used Heap:</span>
                      <span className="font-extrabold text-gray-900 dark:text-gray-100 text-sm">
                        {memoryInfo.used} MB
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-indigo-500 to-red-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (parseFloat(memoryInfo.used) /
                              parseFloat(memoryInfo.total)) *
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                      <span>Allocated: {memoryInfo.total} MB</span>
                      <span>Limit: {memoryInfo.limit} MB</span>
                    </div>
                  </div>
                )}

                {/* Page Load Timings */}
                {perfTimings && (
                  <div className={`${card} p-4 space-y-2`}>
                    <div className={cardHeader}>
                      <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span className={cardLabel}>Page Load Timings</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'DNS Lookup', val: perfTimings.dns },
                        { label: 'Connect', val: perfTimings.connect },
                        { label: 'TTFB', val: perfTimings.ttfb },
                        { label: 'DOM Ready', val: perfTimings.domReady },
                        { label: 'Fully Loaded', val: perfTimings.loaded },
                        { label: 'First Paint (FCP)', val: perfTimings.fcp },
                      ].map(({ label, val }) =>
                        val !== undefined ? (
                          <div
                            key={label}
                            className="bg-gray-50 dark:bg-gray-950/40 p-2 rounded-lg border border-gray-200/50 dark:border-white/5 flex justify-between items-center"
                          >
                            <span className="text-gray-500 dark:text-gray-400 text-[9px]">
                              {label}
                            </span>
                            <span
                              className={`font-bold text-[10px] ${val < 200
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : val < 600
                                    ? 'text-amber-500 dark:text-amber-400'
                                    : 'text-red-500 dark:text-red-400'
                                }`}
                            >
                              {val}ms
                            </span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {/* Viewport */}
                <div className={`${card} p-4 space-y-3`}>
                  <div className={cardHeader}>
                    <Monitor className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <span className={cardLabel}>Viewport Dimensions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-950/40 p-2.5 rounded-lg border border-gray-200/50 dark:border-white/5 flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px]">Width:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200 text-[10px]">
                        {windowSize.width}px
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950/40 p-2.5 rounded-lg border border-gray-200/50 dark:border-white/5 flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px]">Height:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200 text-[10px]">
                        {windowSize.height}px
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-purple-500/5 border border-purple-500/15 p-2.5 rounded-lg">
                    <span className="font-semibold text-[10px] uppercase text-purple-600 dark:text-purple-400">
                      Tailwind Breakpoint:
                    </span>
                    <span className="font-extrabold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400">
                      {getBreakpoint(windowSize.width)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ NETWORK TAB ═════════════════════════════════════════════ */}
            {activeTab === 'network' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">
                    Intercepted Fetch Requests ({networkLogs.length})
                  </span>
                  {networkLogs.length > 0 && (
                    <button
                      onClick={() => setNetworkLogs([])}
                      className="flex items-center gap-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-[9px]">Clear</span>
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-950/90 border border-gray-200/80 dark:border-white/5 rounded-xl overflow-y-auto max-h-[calc(100vh-220px)] space-y-1.5 p-2 custom-scrollbar">
                  {networkLogs.length === 0 ? (
                    <div className="text-gray-400 dark:text-gray-500 text-center py-10 flex flex-col items-center gap-2">
                      <Globe className="w-8 h-8 opacity-30" />
                      <span className="text-[10px]">
                        Belum ada request. Buat fetch API call untuk memulai.
                      </span>
                    </div>
                  ) : (
                    networkLogs.map((req) => (
                      <div
                        key={req.id}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 text-[10px] font-mono ${req.ok
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30'
                          }`}
                      >
                        <span
                          className={`font-bold text-[9px] px-1.5 py-0.5 rounded shrink-0 ${req.method === 'GET'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : req.method === 'POST'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : req.method === 'DELETE'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                        >
                          {req.method}
                        </span>
                        <span
                          className={`font-bold shrink-0 ${req.ok
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                            }`}
                        >
                          {req.status}
                        </span>
                        <span className="truncate text-gray-600 dark:text-gray-300 flex-1">
                          {req.url}
                        </span>
                        <span className="shrink-0 text-gray-400 dark:text-gray-500">
                          {req.ms}ms
                        </span>
                        <span className="shrink-0 text-gray-300 dark:text-gray-600">
                          {req.timestamp}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ═══ ACTIONS TAB ════════════════════════════════════════════ */}
            {activeTab === 'state' && (
              <div className="space-y-4">
                {/* Storage */}
                <div className={`${card} p-4 space-y-3`}>
                  <div className={cardHeader}>
                    <Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className={cardLabel}>Penyimpanan Browser</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-950/30 p-3 rounded-lg border border-gray-200/50 dark:border-white/5 text-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        LocalStorage
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {storageUsage.local}{' '}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          KB
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950/30 p-3 rounded-lg border border-gray-200/50 dark:border-white/5 text-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        SessionStorage
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {storageUsage.session}{' '}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          KB
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 rounded-lg border border-red-500/25 hover:border-red-500/40 transition-all font-semibold uppercase tracking-wider text-[10px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset Storage &amp; Muat Ulang
                  </button>
                </div>

                {/* Bug report + log export */}
                <div className={`${card} p-4 space-y-3`}>
                  <div className={cardHeader}>
                    <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span className={cardLabel}>Laporan &amp; Export</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleGenerateBugReport}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/25 hover:border-emerald-500/40 transition-all font-semibold uppercase tracking-wider text-[9px]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Bug Report
                    </button>
                    <button
                      onClick={handleExportLogs}
                      disabled={logs.length === 0}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/25 hover:border-indigo-500/40 transition-all font-semibold uppercase tracking-wider text-[9px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-relaxed">
                    Bug Report menyalin sistem info + semua error log + 10 network request terakhir ke clipboard (format Markdown siap paste ke GitHub Issues).
                  </p>
                </div>

                {/* Crash Simulator */}
                <div className={`${card} p-4 space-y-3`}>
                  <div className={cardHeader}>
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span className={cardLabel}>Simulator Kegagalan UI</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal font-medium">
                    Picu kegagalan runtime untuk menguji stabilitas React Error Boundary dan pengumpulan log sistem.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setTriggerCrash(true)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/25 hover:border-amber-500/40 transition-all font-semibold uppercase tracking-wider text-[9px]"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Crash React UI
                    </button>
                    <button
                      onClick={handleTriggerPromiseRejection}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-500/10 hover:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-500/25 hover:border-purple-500/40 transition-all font-semibold uppercase tracking-wider text-[9px]"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Promise Error
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ EVENT LOGS TAB ═════════════════════════════════════════ */}
            {activeTab === 'logs' && (
              <div className="flex flex-col gap-3" style={{ height: 'calc(100vh - 220px)' }}>
                {/* Search */}
                <div className="relative shrink-0">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari log berdasarkan teks..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-950/80 border border-gray-300 dark:border-white/5 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* Filter pills */}
                <div className="flex gap-1 p-1 bg-gray-50 dark:bg-gray-950/60 rounded-lg border border-gray-200/80 dark:border-white/5 shrink-0">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'error', label: 'Error' },
                    { id: 'warn', label: 'Warning' },
                    { id: 'info', label: 'Info' },
                    { id: 'success', label: 'Success' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => setLogFilter(pill.id)}
                      className={`flex-1 py-1.5 rounded-md font-bold text-[9px] uppercase transition-all ${logFilter === pill.id
                          ? 'bg-blue-100/60 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm'
                          : 'bg-transparent text-gray-500 dark:text-gray-400 border border-transparent hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Log list */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-950/90 border border-gray-200/80 dark:border-white/5 rounded-xl overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
                  {filteredLogs.length === 0 ? (
                    <div className="text-gray-400 dark:text-gray-500 text-center py-10 flex flex-col items-center justify-center gap-2">
                      <Shield className="w-8 h-8 text-gray-300 dark:text-gray-600 opacity-50" />
                      <span className="text-[10px]">
                        Tidak ada log yang sesuai filter.
                      </span>
                    </div>
                  ) : (
                    // FIX: use stable log.id as key, never array index
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`group p-2.5 rounded-lg border transition-all duration-200 ${log.type === 'error'
                            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 hover:border-red-300 dark:hover:border-red-900/50'
                            : log.type === 'warn'
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 hover:border-amber-300 dark:hover:border-amber-900/50'
                              : log.type === 'success'
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-900/50'
                                : 'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                      >
                        <div className="flex justify-between items-center border-b border-gray-200/40 dark:border-white/5 pb-1.5 mb-1.5">
                          <span className="font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1">
                            {log.type === 'error' && (
                              <AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400 animate-pulse" />
                            )}
                            {log.type === 'warn' && (
                              <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                            )}
                            {log.type === 'success' && (
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {log.type === 'info' && (
                              <Route className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                            )}
                            {log.source}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] opacity-60">{log.timestamp}</span>
                            {/* FIX: use log.id not idx for copy key */}
                            <button
                              onClick={() =>
                                handleCopyToClipboard(log.message, `log-${log.id}`)
                              }
                              className="opacity-0 group-hover:opacity-100 hover:text-gray-900 dark:hover:text-white p-0.5 rounded transition-all text-gray-400 dark:text-gray-500"
                              title="Salin Log"
                            >
                              {copiedKey === `log-${log.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap select-all font-mono break-all leading-normal text-[10px]">
                          {log.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer actions */}
                {logs.length > 0 && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setLogs([]);
                        try { sessionStorage.removeItem('senyum-devtools-logs'); } catch { }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-dashed border-gray-200 dark:border-white/5 transition-all text-[10px] font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Log
                    </button>
                    <button
                      onClick={handleExportLogs}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-dashed border-gray-200 dark:border-white/5 transition-all text-[10px] font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ SYSTEM INFO TAB ════════════════════════════════════════ */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className={`${card} p-4 space-y-3`}>
                  <div className={cardHeader}>
                    <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className={cardLabel}>Spesifikasi Sistem</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {[
                      {
                        label: 'URL Aktif',
                        value: window.location.href,
                        highlight: true,
                        copyKey: 'url',
                      },
                      {
                        label: 'Mode Aplikasi',
                        value: `${import.meta.env.MODE} (${isDev ? 'Development' : 'Production'})`,
                        badge: true,
                      },
                      {
                        label: 'Browser Engine',
                        value: navigator.userAgent.includes('Chrome')
                          ? 'Google Chrome / Blink'
                          : navigator.userAgent.includes('Safari')
                            ? 'Safari / WebKit'
                            : navigator.userAgent.includes('Firefox')
                              ? 'Firefox / Gecko'
                              : 'Lainnya',
                      },
                      {
                        label: 'Sistem Operasi',
                        value: navigator.userAgent.includes('Windows')
                          ? 'Windows OS'
                          : navigator.userAgent.includes('Macintosh')
                            ? 'MacOS'
                            : navigator.userAgent.includes('Linux')
                              ? 'Linux OS'
                              : 'Mobile / Unknown',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0"
                      >
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase">
                          {item.label}:
                        </span>
                        <div className="flex items-center gap-2 max-w-[65%]">
                          {item.badge ? (
                            <span className="font-extrabold bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px]">
                              {item.value}
                            </span>
                          ) : (
                            <span
                              className={`font-semibold text-right truncate select-all text-[10px] ${item.highlight
                                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                                  : 'text-gray-800 dark:text-gray-200'
                                }`}
                            >
                              {item.value}
                            </span>
                          )}
                          {item.copyKey && (
                            <button
                              onClick={() =>
                                handleCopyToClipboard(item.value, item.copyKey)
                              }
                              className="p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors shrink-0"
                              title="Salin Nilai"
                            >
                              {copiedKey === item.copyKey ? (
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Agent */}
                <div className={`${card} p-4 space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">
                      Browser User-Agent String
                    </span>
                    <button
                      onClick={() =>
                        handleCopyToClipboard(navigator.userAgent, 'ua')
                      }
                      className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-0.5 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                      {copiedKey === 'ua' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Tersalin
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin UA</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-950/70 border border-gray-200/50 dark:border-white/5 rounded-lg text-gray-600 dark:text-gray-400 leading-relaxed break-all select-all text-[9.5px]">
                    {navigator.userAgent}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="p-3 border-t border-gray-200/50 dark:border-white/5 text-center text-gray-500 text-[10px] bg-gray-100/80 dark:bg-gray-950/60 shrink-0">
            Tekan{' '}
            <kbd className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-bold shadow-sm select-all">
              Ctrl + Shift + D
            </kbd>{' '}
            untuk menyembunyikan panel ini.
          </div>
        </div>
      )}

      {/* ── Scrollbar styles ── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
      `}</style>
    </>
  );
}

export default SystemDebugger;