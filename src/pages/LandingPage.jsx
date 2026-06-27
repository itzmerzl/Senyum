import { Link } from 'react-router-dom';
import {
  CreditCard, ShieldCheck, ArrowRight,
  Phone, School, Home, LogIn, CheckCircle, ShoppingBag,
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import BillingCheckSection from '../components/features/students/BillingCheckSection';
import AnnouncementSection from '../components/features/students/AnnouncementSection';
import FAQSection from '../components/features/students/FAQSection';
import useScrollReveal from '../hooks/useScrollReveal';
import logoSenyum from '../assets/logo-senyum.png';

/* ─── Stats data ─────────────────────────────────────────── */
const STATS = [
  { number: '300+', label: 'Santri Aktif' },
  { number: '2', label: 'Program Tersedia' },
  { number: '100%', label: 'Transparan' },
  { number: '5 hr', label: 'Buka / Minggu' },
];

/* ─── Program data ───────────────────────────────────────── */
const PROGRAMS = [
  {
    id: 'boarding',
    icon: <School className="w-5 h-5" />,
    title: 'Program Boarding',
    desc: 'Santri tinggal di asrama dengan pendidikan terpadu 24 jam.',
    items: [
      'Seragam sekolah (putih-putih, batik, olahraga)',
      'Buku paket pelajaran & kitab',
      'Perlengkapan mandi & kamar',
      'Kasur, bantal, selimut',
      'Lemari pakaian (opsional)',
      'Alat tulis & perlengkapan belajar',
    ],
    note: 'Tersedia paket hemat untuk perlengkapan boarding dengan sistem cicilan.',
    color: 'blue',
  },
  {
    id: 'non-boarding',
    icon: <Home className="w-5 h-5" />,
    title: 'Program Non-Boarding',
    desc: 'Santri pulang ke rumah setelah jam sekolah selesai.',
    items: [
      'Seragam sekolah (putih-putih, batik, olahraga)',
      'Buku paket pelajaran & kitab',
      'Tas sekolah',
      'Sepatu & kaos kaki',
      'Alat tulis & perlengkapan belajar',
    ],
    note: 'Perlengkapan dapat dibeli satuan atau paket dengan harga lebih terjangkau.',
    color: 'amber',
  },
];

/* ─── Services data ──────────────────────────────────────── */
const SERVICES = [
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: 'Perlengkapan Sekolah',
    desc: 'Seragam, buku pelajaran, kitab, dan alat tulis dengan harga terjangkau dan kualitas terjamin.',
    accent: 'blue',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Cicilan Transparan',
    desc: 'Program cicilan untuk seragam dan perlengkapan awal tahun, meringankan beban wali murid.',
    accent: 'amber',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Amanah & Terpercaya',
    desc: 'Laporan keuangan transparan dan dapat dipertanggungjawabkan kepada pihak sekolah.',
    accent: 'sky',
  },
];

/* ─── Color maps (Tailwind static classes) ───────────────── */
const accentMap = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    cardTop: 'border-t-blue-500 dark:border-t-blue-400',
    checkBg: 'bg-blue-100 dark:bg-blue-500/15',
    checkText: 'text-blue-600 dark:text-blue-400',
    noteBg: 'bg-blue-50 dark:bg-blue-500/10',
    noteBorder: 'border-blue-200 dark:border-blue-500/25',
    noteText: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    cardTop: 'border-t-amber-400 dark:border-t-amber-300',
    checkBg: 'bg-amber-100 dark:bg-amber-500/15',
    checkText: 'text-amber-600 dark:text-amber-400',
    noteBg: 'bg-amber-50 dark:bg-amber-500/10',
    noteBorder: 'border-amber-200 dark:border-amber-500/25',
    noteText: 'text-amber-700 dark:text-amber-300',
  },
  sky: {
    iconBg: 'bg-sky-100 dark:bg-sky-500/15',
    iconText: 'text-sky-600 dark:text-sky-400',
    cardTop: 'border-t-sky-500 dark:border-t-sky-400',
    checkBg: '',
    checkText: '',
    noteBg: '',
    noteBorder: '',
    noteText: '',
  },
};

/* ─── Reusable animated bits ─────────────────────────────── */
function StatItem({ number, label, index }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.4 });
  return (
    <div
      ref={ref}
      className={`py-5 px-4 text-center transition-all duration-500
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
    >
      <div className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-0.5">
        {number}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-widest
                      text-gray-400 dark:text-white/30">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.4 });
  return (
    <div
      ref={ref}
      className={`text-center mb-14 transition-all duration-700
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function RevealCard({ children, index = 0, direction = 'up', className = '' }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });
  const hiddenTransform = {
    up: 'translate-y-10',
    left: '-translate-x-10',
    right: 'translate-x-10',
  }[direction];

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}
        ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 scale-95 ${hiddenTransform}`}`}
      style={{ transitionDelay: isVisible ? `${index * 120}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0e1a] transition-colors duration-300 overflow-x-hidden">

      {/* ── Dot-grid background (dark only) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <nav className="fixed w-full z-50 border-b border-gray-100 dark:border-white/[0.06]
                      bg-white/80 dark:bg-[#0a0e1a]/85 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-15 items-center py-3">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <img
                src={logoSenyum}
                alt="Koperasi Senyum"
                className="w-9 h-9 rounded-lg object-contain"
              />
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                Koperasi Senyum
              </span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-8">
              {[['#info', 'Informasi'], ['#pengumuman', 'Pengumuman'], ['#faq', 'FAQ'], ['#services', 'Layanan'], ['#contact', 'Kontak']].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white
                             font-medium transition-colors duration-200"
                >
                  {label}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                           bg-blue-600 hover:bg-blue-700 text-white
                           shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10
                           transition-all duration-200 hover:-translate-y-px"
              >
                <LogIn size={15} className="md:hidden" />
                <span className="hidden md:inline">Login Staff</span>
                <span className="md:hidden">Masuk</span>
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative pt-28 pb-16 lg:pt-40 lg:pb-24 text-center z-10">

        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[700px] h-[500px] rounded-full
                        bg-blue-100/60 dark:bg-blue-500/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4
                        w-[500px] h-[500px] rounded-full
                        bg-amber-100/50 dark:bg-amber-400/6 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7
                          bg-blue-50 dark:bg-blue-500/10
                          border border-blue-200 dark:border-blue-500/25
                          text-blue-700 dark:text-blue-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            Portal Informasi Koperasi Sekolah
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5
                         text-gray-900 dark:text-white">
            Tagihan Santri,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-amber-400
                             dark:from-blue-400 dark:to-amber-300
                             bg-clip-text text-transparent">
              Transparan &amp; Mudah
            </span>
          </h1>

          {/* Sub */}
          <p className="text-base sm:text-lg text-gray-500 dark:text-white/40 leading-relaxed mb-9 max-w-xl mx-auto">
            Cek tagihan seragam, buku, dan tabungan santri kapan saja — langsung dari genggaman wali murid.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => document.getElementById('cek-tagihan')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                         bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm
                         shadow-xl shadow-blue-500/30 dark:shadow-blue-500/15
                         transition-all duration-200 hover:-translate-y-0.5"
            >
              Cek Tagihan Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#info"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                         text-sm font-semibold border transition-all duration-200
                         bg-white dark:bg-white/5
                         border-gray-200 dark:border-white/10
                         text-gray-700 dark:text-white/70
                         hover:bg-gray-50 dark:hover:bg-white/10
                         hover:-translate-y-0.5"
            >
              Informasi Program
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════ */}
      <div className="relative z-10 border-y border-gray-100 dark:border-white/[0.06]
                      bg-gray-50/70 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0
                          divide-gray-100 dark:divide-white/[0.06]">
            {STATS.map(({ number, label }, index) => (
              <StatItem key={label} number={number} label={label} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          CEK TAGIHAN  (existing component)
      ════════════════════════════════════════ */}
      <div className="relative z-10">
        <BillingCheckSection />
      </div>

      {/* ════════════════════════════════════════
          PENGUMUMAN / INFO TERKINI
      ════════════════════════════════════════ */}
      <AnnouncementSection />

      {/* ════════════════════════════════════════
          INFORMASI PROGRAM
      ════════════════════════════════════════ */}
      <section id="info" className="relative z-10 py-20 lg:py-28
                                     bg-white dark:bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <SectionHeader
            eyebrow="Program"
            title="Informasi Program"
            desc="Pilihan jalur pendidikan dan kebutuhan perlengkapan untuk santri MBS Tanggul."
          />

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-5">
            {PROGRAMS.map((prog, index) => {
              const c = accentMap[prog.color];
              return (
                <RevealCard key={prog.id} index={index} direction={index % 2 === 0 ? 'left' : 'right'}>
                  <div
                    className={`
                      group relative rounded-2xl p-7
                      border border-t-2 ${c.cardTop}
                      border-gray-100 dark:border-white/[0.07]
                      bg-white dark:bg-white/[0.03]
                      hover:border-gray-200 dark:hover:border-white/[0.12]
                      hover:-translate-y-1
                      transition-all duration-300
                    `}
                  >
                    {/* Card icon + title */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg} ${c.iconText}`}>
                        {prog.icon}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {prog.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-white/40 mb-5 leading-relaxed">
                      {prog.desc}
                    </p>

                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-3">
                      Kebutuhan Perlengkapan
                    </p>
                    <ul className="space-y-2 mb-6">
                      {prog.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/60">
                          <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${c.checkBg} ${c.checkText}`}>
                            <CheckCircle className="w-2.5 h-2.5" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div className={`rounded-xl p-3.5 border text-xs leading-relaxed ${c.noteBg} ${c.noteBorder} ${c.noteText}`}>
                      💡 {prog.note}
                    </div>
                  </div>
                </RevealCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <FAQSection />

      {/* ════════════════════════════════════════
          LAYANAN KOPERASI
      ════════════════════════════════════════ */}
      <section id="services" className="relative z-10 py-20 lg:py-28
                                        bg-gray-50 dark:bg-white/[0.015]
                                        border-y border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <SectionHeader
            eyebrow="Layanan"
            title="Layanan Koperasi"
            desc="Memenuhi kebutuhan perlengkapan santri dengan sistem yang memudahkan wali murid."
          />

          <div className="grid sm:grid-cols-3 gap-5">
            {SERVICES.map((svc, index) => {
              const c = accentMap[svc.accent];
              return (
                <RevealCard key={svc.title} index={index} direction="up">
                  <div
                    className="group rounded-2xl p-6
                               border border-gray-100 dark:border-white/[0.07]
                               bg-white dark:bg-white/[0.03]
                               hover:border-gray-200 dark:hover:border-blue-500/30
                               hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5
                               dark:hover:shadow-none
                               transition-all duration-300"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${c.iconBg} ${c.iconText}`}>
                      {svc.icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2.5">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
                      {svc.desc}
                    </p>
                  </div>
                </RevealCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer id="contact" className="relative z-10 py-14 bg-white dark:bg-[#0a0e1a] border-t border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid sm:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img
                  src={logoSenyum}
                  alt="Koperasi Senyum"
                  className="w-7 h-7 rounded-md object-contain"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Koperasi Senyum</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-white/30 leading-relaxed max-w-[200px]">
                Melayani kebutuhan santri dengan sepenuh hati. Jujur, Amanah, dan Profesional.
              </p>
            </div>

            {/* Kontak */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">
                Kontak
              </h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/50">
                  <Phone size={13} className="text-blue-500 flex-shrink-0" />
                  +62 822-4534-4633
                </li>
                <li className="text-xs text-gray-600 dark:text-white/50">Jln. Pemandian No. 88</li>
                <li className="text-xs text-gray-600 dark:text-white/50">senyummu2024@gmail.com</li>
              </ul>
            </div>

            {/* Jam */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">
                Jam Buka
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-600 dark:text-white/50">
                <li>Senin – Kamis: 07.00 – 14.00</li>
                <li>Jumat: 07.00 – 11.00</li>
                <li>Sabtu: 07.00 – 13.00</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/[0.05] pt-7 text-center">
            <p className="text-[11px] text-gray-400 dark:text-white/20">
              © 2025 Koperasi Senyum. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}