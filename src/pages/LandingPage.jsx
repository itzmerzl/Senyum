import { Link } from 'react-router-dom';
import {
  CreditCard, ShieldCheck, ArrowRight,
  Phone, School, Home, LogIn, CheckCircle, ShoppingBag,
  MapPin, Clock, Mail, Calendar,
  Eye, HeadphonesIcon, Star, MessageCircle,
  UserPlus, ScanSearch, FileText, Wallet,
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import BillingCheckSection from '../components/features/landing/BillingCheckSection';
import AnnouncementSection from '../components/features/landing/AnnouncementSection';
import FAQSection from '../components/features/landing/FAQSection';
import useScrollReveal from '../hooks/useScrollReveal';
import logoSenyum from '../assets/logo-senyum.png';

/* ─── Stats data ─────────────────────────────────────────── */
const STATS = [
  { number: '300+', label: 'Santri Aktif' },
  { number: '2', label: 'Program Tersedia' },
  { number: '100%', label: 'Transparan' },
  { number: '6 hr', label: 'Buka / Minggu' },
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
    id: 'reguler',
    icon: <Home className="w-5 h-5" />,
    title: 'Program Reguler',
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

/* ─── Layanan & Keunggulan data ──────────────────────────── */
const BENEFITS = [
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: 'Perlengkapan Sekolah',
    desc: 'Seragam, buku pelajaran, kitab, dan alat tulis dengan harga terjangkau dan kualitas terjamin.',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Cicilan Transparan',
    desc: 'Program cicilan untuk seragam dan perlengkapan awal tahun, meringankan beban wali murid.',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Pantauan Real-time',
    desc: 'Rincian tagihan dan riwayat pembayaran dapat dipantau kapan saja, langsung dari genggaman.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Aman & Terpercaya',
    desc: 'Data santri dan transaksi dilindungi enkripsi & PIN pribadi, diawasi langsung Yayasan MBS Tanggul.',
  },
  {
    icon: <HeadphonesIcon className="w-5 h-5" />,
    title: 'Layanan Responsif',
    desc: 'Pertanyaan dan keluhan wali murid dilayani cepat melalui WhatsApp.',
  },
];

/* ─── How it works data ──────────────────────────────────── */
const STEPS = [
  {
    icon: <UserPlus className="w-5 h-5" />,
    title: 'Masukkan Data Santri',
    desc: 'Isi No. Registrasi dan PIN 6 digit yang tertera pada kartu santri.',
  },
  {
    icon: <ScanSearch className="w-5 h-5" />,
    title: 'Verifikasi Otomatis',
    desc: 'Sistem mencocokkan data secara real-time dan aman.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Lihat Rincian Tagihan',
    desc: 'Tagihan, riwayat pembayaran, dan sisa saldo langsung tampil.',
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    title: 'Bayar via Virtual Account',
    desc: 'Transfer ke No. VA yang tertera, tanpa perlu datang ke koperasi.',
  },
];

/* ─── Testimonials data ──────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'S.A',
    role: 'Wali Santri Kelas 8',
    rating: 5,
    quote: 'Cek tagihan jadi lebih praktis, tidak perlu telepon bendahara satu-satu.',
  },
  {
    name: 'R.H',
    role: 'Wali Santri Kelas 10',
    rating: 4,
    quote: 'Rincian pembayaran terlihat jelas, jadi lebih tenang memantau dari rumah.',
  },
  {
    name: 'M.F',
    role: 'Wali Santri Kelas 7',
    rating: 4,
    quote: 'Tampilannya sederhana dan mudah dipahami meski baru pertama kali pakai.',
  },
];

/* ─── Color maps for Program cards ───────────────────────── */
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
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
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
      className={`text-center mb-14 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
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
      className={`transition-all duration-700 ${className} h-full
          ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 scale-95 ${hiddenTransform}`}`}
      style={{ transitionDelay: isVisible ? `${index * 120}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating
            ? 'fill-amber-400 text-amber-400'
            : 'fill-gray-200 text-gray-200 dark:fill-white/10 dark:text-white/10'
            }`}
        />
      ))}
    </div>
  );
}

function StepItem({ step, index, isLast }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });
  return (
    <div
      ref={ref}
      className={`relative flex-1 text-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: isVisible ? `${index * 120}ms` : '0ms' }}
    >
      {!isLast && (
        <div className="hidden sm:block absolute top-6 left-1/2 w-full h-px bg-gray-200 dark:bg-white/10" />
      )}
      <div className="relative inline-flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0a0e1a] border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center mb-3 relative z-10 text-blue-600 dark:text-blue-400">
          {step.icon}
        </div>
        <span className="text-[10px] font-bold text-blue-500 mb-1">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 max-w-[140px]">
          {step.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed max-w-[160px]">
          {step.desc}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0e1a] transition-colors duration-300 overflow-x-hidden">

      {/* ── Grid-line background (dark only) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]"
      />

      {/* ── Navbar ── */}
      <nav className="fixed w-full z-50 border-b border-gray-100 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0e1a]/85 backdrop-blur-md transition-colors duration-300">
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
              {[['#layanan', 'Layanan'], ['#cek-tagihan', 'Cek Tagihan'], ['#pengumuman', 'Pengumuman'], ['#info', 'Program'], ['#faq', 'FAQ'], ['#contact', 'Kontak']].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10 transition-all duration-200 hover:-translate-y-px"
              >
                <LogIn size={15} className="md:hidden" />
                <span className="hidden md:inline">Login Staff</span>
                <span className="md:hidden">Masuk</span>
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 lg:pt-40 lg:pb-24 text-center z-10">

        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-blue-100/60 dark:bg-blue-500/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] rounded-full bg-amber-100/50 dark:bg-amber-400/6 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            Portal Informasi Koperasi Sekolah
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5 text-gray-900 dark:text-white">
            Tagihan Santri,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-amber-400 dark:from-blue-400 dark:to-amber-300 bg-clip-text text-transparent">
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
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/30 dark:shadow-blue-500/15 transition-all duration-200 hover:-translate-y-0.5"
            >
              Cek Tagihan Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#info"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 hover:-translate-y-0.5"
            >
              Informasi Program
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="relative z-10 border-y border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-white/[0.06]">
            {STATS.map(({ number, label }, index) => (
              <StatItem key={label} number={number} label={label} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Layanan & Keunggulan ── */}
      <section id="layanan" className="relative z-10 py-20 lg:py-28 bg-white dark:bg-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Layanan &amp; Keunggulan"
            title="Solusi Lengkap Koperasi Sekolah"
            desc="Memenuhi kebutuhan perlengkapan santri dengan sistem transparan dan terpercaya."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {BENEFITS.map((f, index) => (
              <RevealCard key={f.title} index={index} direction="up">
                <div className="rounded-2xl p-6 border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ── */}
      <section className="relative z-10 py-20 lg:py-28 bg-gray-50 dark:bg-white/[0.015] border-y border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Alur Layanan"
            title="Cara Kerja"
            desc="Empat langkah mudah untuk memantau tagihan santri Anda."
          />
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-4">
            {STEPS.map((step, index) => (
              <StepItem key={step.title} step={step} index={index} isLast={index === STEPS.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Cek Tagihan ── */}
      <div className="relative z-10">
        <BillingCheckSection />
      </div>

      {/* ── Pengumuman ── */}
      <AnnouncementSection />

      {/* ── Testimoni ── */}
      <section className="relative z-10 py-20 lg:py-28 bg-white dark:bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Kata Wali Murid"
            title="Testimoni"
            desc="Pengalaman wali murid menggunakan layanan cek tagihan."
          />
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, index) => (
              <RevealCard key={t.name} index={index} direction="up">
                <div className="rounded-2xl p-6 border border-gray-200 dark:border-white/[0.07]
                            bg-white dark:bg-white/[0.03]
                            shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)]
                            hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.12)]
                            transition-shadow duration-300 h-full">
                  <StarRating rating={t.rating} />
                  <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed mb-4">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{t.name}</span>
                    <span className="text-xs text-gray-400 dark:text-white/30">·</span>
                    <span className="text-xs text-gray-500 dark:text-white/40">{t.role}</span>
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Informasi Program ── */}
      <section id="info" className="relative z-10 py-20 lg:py-28 bg-white dark:bg-transparent">
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
                      group relative rounded-2xl p-7 h-full flex flex-col
                      shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)]
                      hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.12)]
                      border border-t-2 ${c.cardTop}
                      border-gray-200 dark:border-white/[0.07]
                      bg-white dark:bg-white/[0.03]
                      hover:border-gray-300 dark:hover:border-white/[0.12]
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
                    <ul className="space-y-2 mb-6 flex-1">
                      {prog.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/60">
                          <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${c.checkBg} ${c.checkText}`}>
                            <CheckCircle className="w-2.5 h-2.5" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div className={`rounded-xl p-3.5 border text-xs leading-relaxed mt-auto ${c.noteBg} ${c.noteBorder} ${c.noteText}`}>
                      💡 {prog.note}
                    </div>
                  </div>
                </RevealCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA WhatsApp ── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <RevealCard>
            <div className="rounded-2xl p-10 sm:p-12 text-center shadow-sm
                      bg-blue-50 dark:bg-blue-500/10 
                      border border-blue-200 dark:border-blue-500/25">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/15 
                        flex items-center justify-center mx-auto mb-5 
                        text-blue-600 dark:text-blue-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Masih ada pertanyaan?
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50 mb-6 max-w-sm mx-auto">
                Tim kami siap membantu wali murid melalui WhatsApp.
              </p>
              <a href="https://wa.me/6285183079329"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                     shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10
                     transition-all duration-200 hover:-translate-y-0.5"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi via WhatsApp
              </a>
            </div>
          </RevealCard>
        </div>
      </section>



      {/* ── Footer ── */}
      <footer id="contact" className="relative z-10 py-14 bg-white dark:bg-[#0a0e1a] border-t border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid sm:grid-cols-3 gap-8 md:gap-12 mb-10">

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
              <p className="text-xs text-gray-400 dark:text-white/30 leading-relaxed max-w-[240px]">
                Melayani kebutuhan santri dengan sepenuh hati. Jujur, Amanah, dan Profesional.
              </p>
            </div>

            {/* Kontak & Alamat */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">
                Kontak &amp; Alamat
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-white/50">
                  <Phone size={14} className="text-blue-500 flex-shrink-0" />
                  <span>0851-8307-9329</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-white/50 leading-relaxed">
                  <MapPin size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Jl. Pemandian, Krajan II No.88, RT.002/RW.003, Krajan II, Patemon, Kec. Tanggul, Kabupaten Jember, Jawa Timur 68155</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-white/50">
                  <Mail size={14} className="text-blue-500 flex-shrink-0" />
                  <span>senyummu2024@gmail.com</span>
                </li>
              </ul>
            </div>

            {/* Jam Operasional */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">
                Jam Operasional
              </h4>
              <ul className="space-y-3 text-xs text-gray-600 dark:text-white/50">
                <li className="flex items-start gap-2.5 leading-relaxed">
                  <Calendar size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-gray-800 dark:text-white/80">Jadwal Operasional</span>
                    <span>Setiap Hari (Kecuali Kamis)</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 leading-relaxed">
                  <Clock size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-gray-800 dark:text-white/80">Waktu Pelayanan</span>
                    <span>08.00 – 14.00 WIB</span>
                  </div>
                </li>
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