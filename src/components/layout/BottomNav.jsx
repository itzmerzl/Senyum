import { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";
import MasterSheet from "./MasterSheet";

// ─── Haptic helper ────────────────────────────────────────────────────────────
// Vibrate 8ms kalau browser support (Android). iOS punya haptic sendiri via
// CSS active state, tapi vibrate API-nya gak accessible — no-op di sana.
function triggerHaptic() {
  try { navigator.vibrate?.(8); } catch { /* noop */ }
}

// ─── NavItem (route link) ────────────────────────────────────────────────────
function NavItem({ to, icon: IconComp, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-1.5 py-2 px-1 transition-all duration-300
         active:scale-95
         ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`
      }
      onClick={triggerHaptic}
    >
      {({ isActive }) => (
        <>
          {/* Active pill background */}
          <div className={`relative w-12 h-7 rounded-xl flex items-center justify-center transition-all duration-300
              ${isActive
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10'
              : 'bg-transparent text-[var(--color-text-muted)]'}`}
          >
            <IconComp
              className={`w-[18px] h-[18px] transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            {/* Badge */}
            {badge > 0 && (
              <span className="absolute -top-1 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border border-[var(--color-surface)] leading-none">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          <span className={`text-[9.5px] font-black tracking-tight leading-none transition-all duration-300 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

// ─── MenuButton (sheet trigger) ──────────────────────────────────────────────
function MenuButton({ icon: IconComp, label, onClick, active = false, badge }) {
  const handleClick = useCallback(() => {
    triggerHaptic();
    onClick?.();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={`Buka menu ${label}`}
      className={`relative flex flex-col items-center justify-center gap-1.5 py-2 px-1 transition-all duration-300
          active:scale-95
          ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
    >
      <div className={`relative w-12 h-7 rounded-xl flex items-center justify-center transition-all duration-300
          ${active
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10'
          : 'bg-transparent text-[var(--color-text-muted)]'}`}
      >
        <IconComp
          className={`w-[18px] h-[18px] transition-transform duration-300 ${active ? 'scale-105' : ''}`}
          strokeWidth={active ? 2.5 : 2}
        />
        {badge > 0 && (
          <span className="absolute -top-1 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border border-[var(--color-surface)] leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={`text-[9.5px] font-black tracking-tight leading-none transition-all duration-300 ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
        {label}
      </span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BottomNav({ badges = {} }) {
  // badges: { liabilities: 3, transactions: 0, ... }
  // Pass dari parent/store lo, misal: <BottomNav badges={{ liabilities: overdueCount }} />
  const [openSheet, setOpenSheet] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  const open = (section) => setOpenSheet(section);
  const close = () => setOpenSheet(null);

  // ── Hide on Scroll ──
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      const isNearBottom = (windowHeight + currentY) >= (docHeight - 60);
      const isNearTop = currentY < 50;
      const isScrollingUp = currentY < lastY;
      const isScrollingDown = currentY > lastY;

      if (isNearBottom || isNearTop || isScrollingUp) {
        setIsVisible(true);
      } else if (isScrollingDown && currentY > 100) {
        setIsVisible(false);
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[200]
            transition-transform duration-300 ease-in-out
            ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          // Safe area inset — iPhone notch/home indicator
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="mx-auto max-w-lg px-3 pb-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(15,23,42,0.10)] overflow-hidden">
            <div className="grid grid-cols-5">
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/pos" icon={ShoppingCart} label="POS" badge={badges.pos} />
              <NavItem to="/students" icon={Users} label="Santri" />
              <MenuButton
                icon={CreditCard}
                label="Transaksi"
                onClick={() => open('transaksi')}
                active={openSheet === 'transaksi'}
                badge={badges.liabilities}
              />
              <MenuButton
                icon={MoreHorizontal}
                label="Lainnya"
                onClick={() => open(openSheet === 'more' ? null : 'more')}
                active={openSheet === 'more'}
              />
            </div>
          </div>
        </div>
      </nav>

      <MasterSheet isOpen={openSheet !== null} section={openSheet} onClose={close} />
    </>
  );
}