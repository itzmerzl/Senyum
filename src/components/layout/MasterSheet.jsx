import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { menuGroups } from "./menuGroups";

// ─── Portal container helper ─────────────────────────────────────────────────
const _portalContainers = {};
function getPortalContainer(id) {
  if (!_portalContainers[id]) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    _portalContainers[id] = el;
  }
  return _portalContainers[id];
}

// ─── NavIcon Helper ──────────────────────────────────────────────────────────
function NavIcon({ icon: Icon, className = "" }) {
  if (!Icon) return null;
  return <Icon className={className || "w-4 h-4"} strokeWidth={2} />;
}

// ─── Section component ───────────────────────────────────────────────────────
function Section({ title, items, onNavigate }) {
  return (
    <>
      <div className="px-4 pt-3 pb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{title}</p>
      </div>
      <div className="px-2 pb-1">
        {items.map((it) => (
          <button
            key={it.path}
            onClick={() => onNavigate(it.path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--color-surface-alt)] active:scale-[0.98] transition-all duration-150"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400">
              <NavIcon icon={it.icon} className="w-4.5 h-4.5" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-[13px] font-bold text-[var(--color-text)] leading-tight">{it.label}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="h-px bg-[var(--color-border)] mx-4 my-1" />;
}

// ─── Swipe-to-dismiss hook ────────────────────────────────────────────────────
function useSwipeDismiss(onClose, enabled = true) {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);
  const currentYRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || startYRef.current === null) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    currentYRef.current = e.touches[0].clientY;

    // Hanya allow swipe DOWN (positif deltaY)
    if (deltaY > 0 && sheetRef.current) {
      // Resistance effect: semakin jauh semakin susah (sqrt easing)
      const resistance = Math.sqrt(deltaY) * 4;
      sheetRef.current.style.transform = `translateY(${Math.min(resistance, 200)}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || startYRef.current === null) return;

    const deltaY = currentYRef.current - startYRef.current;

    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }

    // Threshold 80px ke bawah → dismiss
    if (deltaY > 80) {
      onClose?.();
    }

    startYRef.current = null;
    currentYRef.current = null;
  }, [enabled, onClose]);

  return {
    sheetRef,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
}

// ─── MasterSheet ─────────────────────────────────────────────────────────────
export default function MasterSheet({ isOpen, onClose, section }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin';

  const container = getPortalContainer('portal-sheet');

  const { sheetRef, swipeHandlers } = useSwipeDismiss(onClose, isOpen);

  // ── Body scroll lock ──
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ── Escape key ──
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleNav = (to) => {
    onClose?.();
    navigate(to);
  };

  if (!isOpen) return null;

  // Filter groups
  const transaksiGroup = menuGroups.find(g => g.id === 'transaksi');
  const masterDataGroup = menuGroups.find(g => g.id === 'masterData');
  const laporanGroup = menuGroups.find(g => g.id === 'laporan');
  const manajemenGroup = menuGroups.find(g => g.id === 'manajemen');
  const logsGroup = menuGroups.find(g => g.id === 'logs');

  const show = {
    transaksi: section === 'transaksi' && transaksiGroup,
    masterData: section === 'more' && masterDataGroup,
    laporan: section === 'more' && laporanGroup,
    manajemen: section === 'more' && manajemenGroup,
    logs: section === 'more' && logsGroup && isAdmin,
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] overflow-hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35 animate-in fade-in duration-200" />
      <div
        className="absolute left-0 right-0 bottom-0 px-3 pb-3 animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          contain: 'content',
          touchAction: 'pan-y',  // allow vertical swipe passthrough ke handler
        }}
        {...swipeHandlers}
      >
        <div
          ref={sheetRef}
          className="mx-auto max-w-xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden transition-transform duration-200"
        >
          {/* Grabber — visual indicator untuk swipe */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-300/80 dark:bg-gray-700/80" />
          </div>

          <div className="max-h-[75vh] overflow-y-auto no-scrollbar pb-2">
            {show.transaksi && (
              <Section
                title="Transaksi"
                items={transaksiGroup.items}
                onNavigate={handleNav}
              />
            )}
            {show.masterData && (
              <Section
                title="Master Data"
                items={masterDataGroup.items}
                onNavigate={handleNav}
              />
            )}
            {show.laporan && (
              <>
                {show.masterData && <Divider />}
                <Section
                  title="Laporan"
                  items={laporanGroup.items}
                  onNavigate={handleNav}
                />
              </>
            )}
            {show.manajemen && (
              <>
                {(show.masterData || show.laporan) && <Divider />}
                <Section
                  title="Manajemen"
                  items={manajemenGroup.items}
                  onNavigate={handleNav}
                />
              </>
            )}
            {show.logs && (
              <>
                {(show.masterData || show.laporan || show.manajemen) && <Divider />}
                <Section
                  title="Logs & Audit"
                  items={logsGroup.items}
                  onNavigate={handleNav}
                />
              </>
            )}
          </div>

          {/* Bottom spacer — extra breathing room di atas home indicator iPhone */}
          <div className="h-2" />
        </div>
      </div>
    </div>,
    container
  );
}