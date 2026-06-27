import { Link } from 'react-router-dom';
import { ShoppingBag, CreditCard, BookOpen, ChevronRight, ShieldCheck, ArrowRight, LayoutDashboard, UserCheck, Phone, School, Home, Wallet, Package, CheckCircle, LogIn } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import BillingCheckSection from '../components/features/students/BillingCheckSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <ShoppingBag className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Koperasi Senyum</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#info" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Informasi</a>
              <a href="#services" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Layanan</a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Kontak</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30 text-sm md:text-base"
              >
                <LogIn size={18} className="md:hidden" />
                <span className="hidden md:inline">Login Staff</span>
                <span className="md:hidden">Masuk</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-purple-50 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Portal Informasi Koperasi Sekolah
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-tight">
              Mudahkan Wali Murid <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Memantau Kebutuhan</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Sistem informasi terpadu untuk pengecekan tagihan seragam, buku, dan tabungan siswa secara transparan dan akurat.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                onClick={() => document.getElementById('cek-tagihan').scrollIntoView({ behavior: 'smooth' })}
              >
                Cek Tagihan Siswa
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#info"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Informasi Program
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Cek Tagihan Section (Placeholder for Future Feature) */}
      {/* Cek Tagihan Section */}
      <BillingCheckSection />

      {/* Informasi Program Section */}
      <section id="info" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Informasi Program</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Pilihan program pendidikan dan kebutuhan perlengkapan untuk santri.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Program Boarding */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-8 rounded-2xl border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <School className="text-white w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Program Boarding</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Santri tinggal di asrama (pondok) dengan pendidikan 24 jam.
              </p>
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-white">Kebutuhan Perlengkapan:</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>✓ Seragam sekolah (putih-putih, batik, olahraga)</li>
                  <li>✓ Buku paket pelajaran & kitab</li>
                  <li>✓ Perlengkapan mandi & kamar</li>
                  <li>✓ Kasur, bantal, selimut</li>
                  <li>✓ Lemari pakaian (opsional)</li>
                  <li>✓ Alat tulis & perlengkapan belajar</li>
                </ul>
              </div>
              <div className="mt-6 p-4 bg-blue-200/50 dark:bg-blue-800/30 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💡 <strong>Catatan:</strong> Tersedia paket hemat untuk perlengkapan boarding dengan sistem cicilan.
                </p>
              </div>
            </div>

            {/* Program Non-Boarding */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-8 rounded-2xl border-2 border-purple-300 dark:border-purple-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Home className="text-white w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Program Non-Boarding</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Santri pulang ke rumah setelah jam sekolah selesai.
              </p>
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-white">Kebutuhan Perlengkapan:</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>✓ Seragam sekolah (putih-putih, batik, olahraga)</li>
                  <li>✓ Buku paket pelajaran & kitab</li>
                  <li>✓ Tas sekolah</li>
                  <li>✓ Sepatu & kaos kaki</li>
                  <li>✓ Alat tulis & perlengkapan belajar</li>
                </ul>
              </div>
              <div className="mt-6 p-4 bg-purple-200/50 dark:bg-purple-800/30 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💡 <strong>Catatan:</strong> Perlengkapan dapat dibeli satuan atau paket dengan harga lebih terjangkau.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Features/Info Section */}
      <section id="services" className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Layanan Koperasi</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Memenuhi kebutuhan perlengkapan sekolah dengan sistem yang memudahkan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="text-blue-600 dark:text-blue-400 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Perlengkapan Sekolah</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Menyediakan seragam, buku pelajaran, kitab, dan alat tulis dengan harga terjangkau dan kualitas terjamin.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                <CreditCard className="text-purple-600 dark:text-purple-400 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sistem Cicilan Transparan</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Program cicilan untuk seragam dan perlengkapan awal tahun ajaran guna meringankan beban wali murid.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-green-600 dark:text-green-400 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Amanah & Terpercaya</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Laporan keuangan yang transparan dan dapat dipertanggungjawabkan kepada pihak sekolah dan yayasan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gray-900 dark:bg-white p-1.5 rounded-lg">
                  <ShoppingBag className="text-white dark:text-gray-900 w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Koperasi Senyum</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Melayani kebutuhan santri dengan sepenuh hati. Jujur, Amanah, dan Profesional.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone size={16} /> +62 822-4534-4633
                </li>
                <li>Jln. Pemandian No. 88</li>
                <li>senyummu2024@gmail.com</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Jam Operasional</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Senin - Kamis: 07.00 - 14.00</li>
                <li>Jumat: 07.00 - 11.00</li>
                <li>Sabtu: 07.00 - 13.00</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 Koperasi Senyum. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
