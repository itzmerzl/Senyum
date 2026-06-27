import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, CreditCard, ShoppingBag } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import logoSenyum from '../assets/logo-senyum.png';

/* ─── Highlight singkat di panel kiri ────────────────────── */
const HIGHLIGHTS = [
  { icon: ShoppingBag, text: 'Kelola perlengkapan & seragam santri' },
  { icon: CreditCard, text: 'Pantau tagihan dan cicilan secara transparan' },
  { icon: ShieldCheck, text: 'Laporan keuangan yang amanah & terpercaya' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  // Trigger entrance animation setelah mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        toast.success('Login Berhasil!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Login Gagal! Periksa username atau password.');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#12100a] transition-colors duration-300">

      {/* ════════════════════════════════════════
          PANEL KIRI — Branding (desktop only)
      ════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[44%] relative overflow-hidden
                   bg-gradient-to-br from-blue-600 via-blue-700 to-amber-500"
      >
        {/* Pattern dekoratif: dot-grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* Glow blobs dekoratif */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px]
                        bg-white/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4
                        w-[380px] h-[380px] bg-amber-300/25 rounded-full blur-3xl" />

        <div
          className={`relative z-10 flex flex-col justify-between p-12 w-full
                      transition-all duration-700 ease-out
                      ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
        >
          {/* Logo & nama */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
              <img src={logoSenyum} alt="Koperasi Senyum" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Koperasi Senyum</span>
          </div>

          {/* Tagline */}
          <div className="max-w-sm">
            <h1 className="text-3xl font-black text-white leading-tight mb-4">
              Portal Pengelolaan Koperasi Sekolah
            </h1>
            <p className="text-white/70 text-sm leading-relaxed mb-8">
              Sistem terpadu untuk staff dan pengurus dalam mengelola tagihan, perlengkapan,
              dan administrasi santri MBS Tanggul.
            </p>

            {/* Highlights */}
            <div className="space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, text }, index) => (
                <div
                  key={text}
                  className={`flex items-center gap-3 transition-all duration-500
                    ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                  style={{ transitionDelay: mounted ? `${300 + index * 120}ms` : '0ms' }}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/85 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer kecil */}
          <p className="text-white/50 text-xs">
            © 2025 Koperasi Senyum. Powered by TechSchool.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          PANEL KANAN — Form Login
      ════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-4">

        {/* Dot-grid background (dark only), konsisten dengan LandingPage — hanya tampil saat panel kiri disembunyikan (mobile) atau selalu di kanan */}
        <div
          className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Glow blobs — hanya relevan di mobile, lebih halus karena panel kiri sudah ada di desktop */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px]
                        bg-blue-100/60 dark:bg-blue-500/8 rounded-full blur-3xl pointer-events-none
                        lg:opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px]
                        bg-amber-100/50 dark:bg-amber-400/6 rounded-full blur-3xl pointer-events-none
                        lg:opacity-50" />

        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div
            className={`bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl
                        border border-white/50 dark:border-white/[0.07]
                        rounded-2xl shadow-xl dark:shadow-none p-8 md:p-10
                        transition-all duration-700 ease-out
                        ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'}`}
          >
            {/* Logo & judul — hanya tampil di mobile/tablet, karena desktop sudah ada di panel kiri */}
            <div className="text-center mb-10 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16
                              rounded-2xl mb-6 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10
                              bg-white dark:bg-white/[0.04]
                              border border-gray-100 dark:border-white/[0.08]
                              transform rotate-3 hover:rotate-0 transition-transform duration-300
                              overflow-hidden">
                <img
                  src={logoSenyum}
                  alt="Koperasi Senyum"
                  className="w-11 h-11 object-contain"
                />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Selamat Datang</h2>
              <p className="text-gray-500 dark:text-white/40">Masuk untuk mengelola Koperasi Senyum</p>
            </div>

            {/* Judul untuk desktop — lebih ringkas, karena tagline panjang sudah ada di panel kiri */}
            <div className="hidden lg:block text-left mb-10">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Masuk ke Akun Anda</h2>
              <p className="text-gray-500 dark:text-white/40 text-sm">Silakan masukkan kredensial staff/pengurus.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-white/70 ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-xl leading-5
                               border border-gray-200 dark:border-white/[0.1]
                               bg-gray-50 dark:bg-white/[0.04]
                               text-gray-900 dark:text-white
                               placeholder-gray-400 dark:placeholder-white/30
                               focus:outline-none focus:bg-white dark:focus:bg-white/[0.06]
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-white/70 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 rounded-xl leading-5
                               border border-gray-200 dark:border-white/[0.1]
                               bg-gray-50 dark:bg-white/[0.04]
                               text-gray-900 dark:text-white
                               placeholder-gray-400 dark:placeholder-white/30
                               focus:outline-none focus:bg-white dark:focus:bg-white/[0.06]
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all"
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center
                               text-gray-400 dark:text-white/30
                               hover:text-gray-600 dark:hover:text-white/60
                               transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                           border border-transparent shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10
                           text-sm font-bold text-white
                           bg-blue-600 hover:bg-blue-700
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                           disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0
                           transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Masuk Sistem
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer — hanya tampil di mobile, karena desktop sudah ada di panel kiri */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/[0.07] text-center lg:hidden">
              <p className="text-xs text-gray-400 dark:text-white/30">
                © 2025 Koperasi Senyum. Powered by TechSchool.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}