import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, CreditCard, BookOpen, ShieldCheck, ArrowRight,
  School, Home, Phone, LogIn, MessageCircle, Users, Star,
  ChevronDown, ChevronUp, Clock, MapPin, Mail
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import BillingCheckSection from '../components/features/students/BillingCheckSection';

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target, duration = 1500, trigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return count;
}

// ─── Intersection Observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Islamic Geometric Ornament SVG ──────────────────────────────────────────
function IslamicOrnament({ className = '' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g opacity="0.12" fill="currentColor">
        <polygon points="100,10 118,60 170,60 128,90 144,140 100,112 56,140 72,90 30,60 82,60" />
        <polygon points="100,30 112,65 148,65 120,85 130,120 100,100 70,120 80,85 52,65 88,65" opacity="0.5" />
        <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <rect key={i} x="97" y="42" width="6" height="12" rx="3"
            transform={`rotate(${deg} 100 100)`} opacity="0.4" />
        ))}
      </g>
    </svg>
  );
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const faqs = [
  { q: 'Bagaimana cara mengecek tagihan anak saya?', a: 'Gunakan nomor registrasi dan 6-digit PIN yang tertera di Kartu Pelajar. Masukkan di kolom "Cek Status Pembayaran" di atas.' },
  { q: 'Apakah ada cicilan untuk perlengkapan boarding?', a: 'Ya, tersedia paket cicilan untuk perlengkapan boarding dengan tenor 3-6 bulan. Hubungi staf koperasi untuk informasi lebih lanjut.' },
  { q: 'Apa saja yang tersedia di koperasi?', a: 'Seragam, buku pelajaran, kitab, alat tulis, perlengkapan mandi, dan kebutuhan kamar untuk santri boarding.' },
  { q: 'Bagaimana jika tagihan tidak sesuai?', a: 'Segera hubungi staf koperasi melalui WhatsApp atau datang langsung. Kami akan memverifikasi dan menyelesaikan dalam 1x24 jam.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [statsRef, statsInView] = useInView(0.3);

  const siswaCount = useCountUp(847, 1800, statsInView);
  const tahunCount = useCountUp(8, 1200, statsInView);
  const transaksiCount = useCountUp(2400, 2000, statsInView);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--lp-bg, #FDF8F0)', color: 'var(--lp-text, #1C1C1C)' }}>
      <style>{`
        :root {
          --lp-green: #1B6B3A;
          --lp-green-dark: #144f2c;
          --lp-green-light: #e8f5ed;
          --lp-gold: #C9974A;
          --lp-gold-light: #fdf3e3;
          --lp-bg: #FDF8F0;
          --lp-surface: #FFFFFF;
          --lp-text: #1C1C1C;
          --lp-muted: #6B7280;
          --lp-border: #E5E0D8;
        }
        .dark {
          --lp-bg: #111810;
          --lp-surface: #1a2116;
          --lp-text: #F0EDE8;
          --lp-muted: #9CA3AF;
          --lp-border: #2d3a29;
          --lp-green-light: #1a2d1e;
          --lp-gold-light: #2a2010;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .fade-up          { animation: fadeUp .6s ease both; }
        .fade-up-d1       { animation: fadeUp .6s .1s ease both; }
        .fade-up-d2       { animation: fadeUp .6s .2s ease both; }
        .fade-up-d3       { animation: fadeUp .6s .3s ease both; }
        .spin-slow        { animation: spin-slow 24s linear infinite; }
        .ping-dot::before { content:''; position:absolute; inset:0; border-radius:9999px; background:#22c55e; animation: ping 1.5s cubic-bezier(0,0,.2,1) infinite; }

        .gradient-text {
          background: linear-gradient(135deg, var(--lp-green) 0%, var(--lp-gold) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .shimmer-btn {
          background: linear-gradient(90deg, var(--lp-green) 0%, var(--lp-gold) 50%, var(--lp-green) 100%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }

        .card-hover {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px -8px rgba(27,107,58,.18);
        }

        .nav-blur {
          background: rgba(253,248,240,.85);
          backdrop-filter: blur(12px);
        }
        .dark .nav-blur {
          background: rgba(17,24,16,.85);
        }

        .ornament-bg {
          position: absolute;
          pointer-events: none;
          color: var(--lp-green);
        }

        /* Sticky WA button */
        .wa-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 9999px;
          background: #25D366;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 8px 24px rgba(37,211,102,.45);
          cursor: pointer;
          border: none;
          transition: transform .2s ease, box-shadow .2s ease;
          text-decoration: none;
        }
        .wa-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(37,211,102,.55);
        }
        @media (max-width: 640px) {
          .wa-fab span.wa-label { display: none; }
          .wa-fab { padding: 14px; }
        }

        /* Section divider wave */
        .wave-divider svg { display:block; }

        /* Program tabs */
        .prog-tab { transition: all .2s ease; }
        .prog-tab.active {
          background: var(--lp-green);
          color: #fff;
          box-shadow: 0 4px 16px rgba(27,107,58,.3);
        }

        /* Scroll margin for anchor */
        section[id] { scroll-margin-top: 72px; }
      `}</style>

      {/* ── Sticky WhatsApp FAB ── */}
      <a
        href="https://wa.me/6282245344633?text=Halo%20Koperasi%20Senyum%2C%20saya%20ingin%20bertanya%20tentang%20tagihan%20anak%20saya."
        target="_blank" rel="noreferrer"
        className="wa-fab"
        aria-label="Chat via WhatsApp"
      >
        <MessageCircle size={22} />
        <span className="wa-label">WhatsApp Kami</span>
      </a>

      {/* ── Navbar ── */}
      <nav
        className={`fixed w-full z-50 border-b transition-all duration-300 ${scrolled
            ? 'nav-blur shadow-sm border-[var(--lp-border)]'
            : 'bg-transparent border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--lp-green)' }}>
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
              <div className="leading-none">
                <span className="text-base font-extrabold tracking-tight" style={{ color: 'var(--lp-text)' }}>Koperasi</span>
                <span className="text-base font-extrabold tracking-tight" style={{ color: 'var(--lp-gold)' }}> Senyum</span>
              </div>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-8">
              {['info', 'services', 'contact'].map(id => (
                <a key={id} href={`#${id}`}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: 'var(--lp-muted)' }}
                  onMouseEnter={e => e.target.style.color = 'var(--lp-green)'}
                  onMouseLeave={e => e.target.style.color = 'var(--lp-muted)'}
                >
                  {{ info: 'Informasi', services: 'Layanan', contact: 'Kontak' }[id]}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'var(--lp-green)' }}
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">Login Staff</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-16 lg:pt-44 lg:pb-24 overflow-hidden">
        {/* Ornament background */}
        <div className="ornament-bg top-8 right-8 w-72 h-72 opacity-60 spin-slow hidden lg:block">
          <IslamicOrnament className="w-full h-full" />
        </div>
        <div className="ornament-bg bottom-0 left-0 w-48 h-48 opacity-40 hidden md:block" style={{ transform: 'rotate(45deg)' }}>
          <IslamicOrnament className="w-full h-full" />
        </div>
        {/* Soft blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, var(--lp-green-light) 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 fade-up"
            style={{ background: 'var(--lp-green-light)', color: 'var(--lp-green)' }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full opacity-75 animate-ping" style={{ background: 'var(--lp-green)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--lp-green)' }}></span>
            </span>
            Portal Informasi · MBS Tanggul
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1] fade-up-d1"
            style={{ color: 'var(--lp-text)' }}>
            Pantau Kebutuhan Santri<br />
            <span className="gradient-text">dengan Mudah & Transparan</span>
          </h1>

          <p className="text-base sm:text-lg mb-10 leading-relaxed max-w-xl mx-auto fade-up-d2"
            style={{ color: 'var(--lp-muted)' }}>
            Cek tagihan seragam, buku, dan tabungan anak Anda kapan saja.
            Data akurat langsung dari sistem koperasi sekolah.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 fade-up-d3">
            <button
              className="shimmer-btn group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all hover:-translate-y-0.5"
              onClick={() => document.getElementById('cek-tagihan')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Cek Tagihan Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#info"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm border transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)', background: 'var(--lp-surface)' }}>
              Informasi Program
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust Stats ── */}
      <section ref={statsRef} className="py-12 border-y" style={{ borderColor: 'var(--lp-border)', background: 'var(--lp-surface)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { val: siswaCount, suffix: '+', label: 'Siswa Terlayani', icon: Users },
              { val: tahunCount, suffix: ' Tahun', label: 'Melayani MBS Tanggul', icon: Star },
              { val: transaksiCount, suffix: '+', label: 'Transaksi Tercatat', icon: ShieldCheck },
            ].map(({ val, suffix, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: 'var(--lp-green-light)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--lp-green)' }} />
                </div>
                <p className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: 'var(--lp-green)' }}>
                  {val.toLocaleString('id-ID')}{suffix}
                </p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--lp-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cek Tagihan (from existing component) ── */}
      <BillingCheckSection />

      {/* ── Informasi Program ── */}
      <ProgramSection />

      {/* ── Layanan Koperasi ── */}
      <LayananSection />

      {/* ── FAQ ── */}
      <FaqSection faqs={faqs} openFaq={openFaq} setOpenFaq={setOpenFaq} />

      {/* ── Footer ── */}
      <FooterSection />
    </div>
  );
}

// ─── Program Section ──────────────────────────────────────────────────────────
function ProgramSection() {
  const [active, setActive] = useState('boarding');
  const programs = {
    boarding: {
      icon: School,
      color: 'var(--lp-green)',
      colorLight: 'var(--lp-green-light)',
      title: 'Program Boarding',
      desc: 'Santri tinggal di asrama (pondok) dengan pembinaan intensif 24 jam — akademik, tahfidz, dan akhlak.',
      items: ['Seragam sekolah (putih-putih, batik, olahraga)', 'Buku paket pelajaran & kitab kuning', 'Perlengkapan mandi & kamar', 'Kasur, bantal, selimut', 'Lemari pakaian (opsional)', 'Alat tulis & perlengkapan belajar'],
      note: 'Tersedia paket hemat boarding dengan sistem cicilan 3–6 bulan.',
    },
    nonboarding: {
      icon: Home,
      color: 'var(--lp-gold)',
      colorLight: 'var(--lp-gold-light)',
      title: 'Program Non-Boarding',
      desc: 'Santri pulang ke rumah setelah jam sekolah selesai. Fokus pendidikan formal dan kegiatan ekstrakurikuler.',
      items: ['Seragam sekolah (putih-putih, batik, olahraga)', 'Buku paket pelajaran & kitab', 'Tas sekolah', 'Sepatu & kaos kaki', 'Alat tulis & perlengkapan belajar'],
      note: 'Perlengkapan bisa dibeli satuan atau paket dengan harga lebih terjangkau.',
    },
  };
  const prog = programs[active];
  const Icon = prog.icon;

  return (
    <section id="info" className="py-20" style={{ background: 'var(--lp-bg)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--lp-green)' }}>Program Santri</p>
          <h2 className="text-3xl font-black" style={{ color: 'var(--lp-text)' }}>Informasi Program</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-2xl p-1 border" style={{ background: 'var(--lp-surface)', borderColor: 'var(--lp-border)' }}>
            {Object.entries(programs).map(([key, p]) => (
              <button key={key}
                className={`prog-tab px-6 py-2.5 rounded-xl text-sm font-bold ${active === key ? 'active' : ''}`}
                style={active !== key ? { color: 'var(--lp-muted)' } : {}}
                onClick={() => setActive(key)}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-3xl border p-8 md:p-12 transition-all"
          style={{ background: 'var(--lp-surface)', borderColor: 'var(--lp-border)' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: prog.colorLight }}>
              <Icon className="w-7 h-7" style={{ color: prog.color }} />
            </div>
            <div>
              <h3 className="text-xl font-black mb-1" style={{ color: 'var(--lp-text)' }}>{prog.title}</h3>
              <p style={{ color: 'var(--lp-muted)' }}>{prog.desc}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--lp-muted)' }}>Kebutuhan Perlengkapan</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {prog.items.map(item => (
                <div key={item} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ background: 'var(--lp-bg)' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prog.color }}></span>
                  <span className="text-sm" style={{ color: 'var(--lp-text)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: prog.colorLight }}>
            <span className="text-lg">💡</span>
            <p className="text-sm font-medium" style={{ color: 'var(--lp-text)' }}>{prog.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Layanan Section ──────────────────────────────────────────────────────────
function LayananSection() {
  const services = [
    {
      icon: ShoppingBag,
      title: 'Perlengkapan Sekolah',
      desc: 'Seragam, buku pelajaran, kitab, dan alat tulis dengan harga terjangkau dan kualitas terjamin langsung dari koperasi.',
      color: 'var(--lp-green)',
      colorLight: 'var(--lp-green-light)',
    },
    {
      icon: CreditCard,
      title: 'Cicilan Transparan',
      desc: 'Program cicilan untuk seragam dan perlengkapan awal tahun ajaran dengan tenor fleksibel. Tanpa bunga tersembunyi.',
      color: 'var(--lp-gold)',
      colorLight: 'var(--lp-gold-light)',
    },
    {
      icon: ShieldCheck,
      title: 'Amanah & Terpercaya',
      desc: 'Laporan keuangan transparan dan dapat dipertanggungjawabkan. Diaudit rutin oleh pihak sekolah dan yayasan.',
      color: '#6366f1',
      colorLight: '#eef2ff',
    },
    {
      icon: BookOpen,
      title: 'Buku & Kitab Lengkap',
      desc: 'Stok buku pelajaran Kurikulum Merdeka dan kitab pesantren tersedia setiap awal tahun ajaran.',
      color: '#0891b2',
      colorLight: '#ecfeff',
    },
  ];

  return (
    <section id="services" className="py-20" style={{ background: 'var(--lp-surface)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--lp-green)' }}>Yang Kami Sediakan</p>
          <h2 className="text-3xl font-black" style={{ color: 'var(--lp-text)' }}>Layanan Koperasi</h2>
          <p className="mt-3 max-w-xl mx-auto text-sm" style={{ color: 'var(--lp-muted)' }}>
            Memenuhi kebutuhan santri dengan sistem yang memudahkan wali murid.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(({ icon: Icon, title, desc, color, colorLight }) => (
            <div key={title} className="card-hover rounded-2xl border p-6 flex flex-col"
              style={{ background: 'var(--lp-bg)', borderColor: 'var(--lp-border)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: colorLight }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: 'var(--lp-text)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────
function FaqSection({ faqs, openFaq, setOpenFaq }) {
  return (
    <section className="py-20" style={{ background: 'var(--lp-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--lp-green)' }}>FAQ</p>
          <h2 className="text-3xl font-black" style={{ color: 'var(--lp-text)' }}>Pertanyaan Umum</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--lp-border)', background: 'var(--lp-surface)' }}>
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left font-bold text-sm"
                style={{ color: 'var(--lp-text)' }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                {openFaq === i
                  ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--lp-green)' }} />
                  : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--lp-muted)' }} />}
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: 'var(--lp-muted)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer Section ───────────────────────────────────────────────────────────
function FooterSection() {
  return (
    <footer id="contact" className="border-t" style={{ background: 'var(--lp-surface)', borderColor: 'var(--lp-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--lp-green)' }}>
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold" style={{ color: 'var(--lp-text)' }}>Koperasi</span>
                <span className="font-extrabold" style={{ color: 'var(--lp-gold)' }}> Senyum</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-muted)' }}>
              Melayani kebutuhan santri MBS Tanggul dengan sepenuh hati.<br />
              <em>Jujur, Amanah, dan Profesional.</em>
            </p>
            <a
              href="https://wa.me/6282245344633"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={15} /> Chat WhatsApp
            </a>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--lp-text)' }}>Kontak</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--lp-muted)' }}>
              <li className="flex items-center gap-2.5">
                <Phone size={14} style={{ color: 'var(--lp-green)' }} />
                +62 822-4534-4633
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={14} style={{ color: 'var(--lp-green)' }} />
                Jln. Pemandian No. 88, Tanggul, Jember
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} style={{ color: 'var(--lp-green)' }} />
                senyummu2024@gmail.com
              </li>
            </ul>
          </div>

          {/* Jam Operasional */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--lp-text)' }}>Jam Operasional</h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--lp-muted)' }}>
              {[
                { day: 'Senin – Kamis', time: '07.00 – 14.00' },
                { day: "Jum'at", time: '07.00 – 11.00' },
                { day: 'Sabtu', time: '07.00 – 13.00' },
              ].map(({ day, time }) => (
                <li key={day} className="flex justify-between items-center gap-4 py-1 border-b last:border-0" style={{ borderColor: 'var(--lp-border)' }}>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: 'var(--lp-green)' }} />
                    {day}
                  </span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--lp-text)' }}>{time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs"
          style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-muted)' }}>
          <p>© 2025 Koperasi Senyum · MBS Tanggul. All rights reserved.</p>
          <p>Dikembangkan oleh Tim IT MBS Tanggul</p>
        </div>
      </div>
    </footer>
  );
}