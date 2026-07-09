import { useState } from 'react';
import { checkPublicBilling } from '../../../services/studentService';
import { Loader2, Search, AlertCircle, CheckCircle, CreditCard, Calendar, BookOpenText, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export default function BillingCheckSection() {
    const [formData, setFormData] = useState({
        registrationNumber: '',
        pin: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [cardHighlight, setCardHighlight] = useState(null);

    const handleAutoFillDemo = () => {
        setFormData({
            registrationNumber: 'REG-2026-0001',
            pin: '123456'
        });
        toast.success('Data demo dimasukkan! Klik "Cek Data"');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        if (!formData.registrationNumber || !formData.pin) {
            setError('Mohon lengkapi No. Registrasi dan PIN');
            return;
        }

        if (formData.pin.length !== 6) {
            setError('PIN harus 6 karakter');
            return;
        }

        try {
            setLoading(true);
            const response = await checkPublicBilling(formData);
            setResult(response);
            toast.success('Data ditemukan!');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Data tidak ditemukan atau PIN salah');
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            id="cek-tagihan"
            className="relative z-10 py-12 lg:py-16
                       bg-blue-50/60 dark:bg-transparent
                       border-y border-blue-100 dark:border-white/[0.05]"
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
                        Layanan Wali Murid
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
                        Cek Status Pembayaran
                    </h2>
                    <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto text-sm leading-relaxed">
                        Pantau tagihan dan riwayat pembayaran santri secara real-time.
                    </p>
                </div>

                <div className="rounded-2xl p-6
                                border border-gray-200 dark:border-white/[0.07]
                                bg-white dark:bg-white/[0.03]
                                shadow-[0_2px_4px_rgba(0,0,0,0.04),0_20px_40px_-14px_rgba(37,99,235,0.15)] dark:shadow-none">

                    <div className={`grid lg:grid-cols-12 gap-6 items-stretch ${result ? '' : 'lg:divide-x lg:divide-gray-100 lg:dark:divide-white/[0.06]'}`}>

                        {/* Form & Results Column */}
                        <div className={`flex flex-col justify-center ${result ? 'lg:col-span-12' : 'lg:col-span-7 pr-0 lg:pr-8'}`}>
                            {/* Trust Badge */}
                            <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-lg
                bg-emerald-50 dark:bg-emerald-500/10
                border border-emerald-100 dark:border-emerald-500/20
                w-fit mx-auto">
                                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    Data Anda Aman &amp; Terenkripsi
                                </span>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 mb-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                                        No. Registrasi
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Contoh: REG-2026-0001"
                                            value={formData.registrationNumber}
                                            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                            onFocus={() => setCardHighlight('reg')}
                                            onBlur={() => setCardHighlight(null)}
                                            onMouseEnter={() => setCardHighlight('reg')}
                                            onMouseLeave={() => setCardHighlight(null)}
                                            className="w-full pl-4 pr-4 py-3 rounded-xl
                                                       border border-gray-200 dark:border-white/[0.1]
                                                       bg-gray-50 dark:bg-white/[0.04]
                                                       text-gray-900 dark:text-white
                                                       placeholder:text-gray-400 dark:placeholder:text-white/30
                                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                                       outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                                        PIN Siswa
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            maxLength={6}
                                            placeholder="6 Digit PIN"
                                            value={formData.pin}
                                            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                            onFocus={() => setCardHighlight('pin')}
                                            onBlur={() => setCardHighlight(null)}
                                            onMouseEnter={() => setCardHighlight('pin')}
                                            onMouseLeave={() => setCardHighlight(null)}
                                            className="w-full pl-4 pr-4 py-3 rounded-xl
                                                       border border-gray-200 dark:border-white/[0.1]
                                                       bg-gray-50 dark:bg-white/[0.04]
                                                       text-gray-900 dark:text-white
                                                       placeholder:text-gray-400 dark:placeholder:text-white/30
                                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                                       outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-8 py-3.5 rounded-xl font-bold text-white
                                               bg-blue-600 hover:bg-blue-700
                                               shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10
                                               hover:-translate-y-px
                                               disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0
                                               transition-all duration-200
                                               flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    {loading ? 'Mengecek...' : 'Cek Data'}
                                </button>
                            </form>

                            {/* Error Display */}
                            {error && (
                                <div className="mb-5 p-4 rounded-xl flex items-center gap-3
                                                bg-red-50 dark:bg-red-500/10
                                                text-red-600 dark:text-red-400
                                                animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="font-medium text-sm">{error}</p>
                                </div>
                            )}

                            {/* Footnote */}
                            {!result && (
                                <p className="text-[11px] text-gray-400 dark:text-white/30 flex items-start gap-1.5 leading-relaxed">
                                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <span>Gunakan nomor registrasi dan PIN yang tertera pada kartu pelajar santri Anda. Klik pada kartu di samping untuk mencoba data demo secara otomatis.</span>
                                </p>
                            )}

                            {/* Contact Help */}
                            {!result && (
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-white/10
                    flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-white/40">
                                    <span>Butuh bantuan?</span>

                                    <a href="https://wa.me/6285183079329"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Hubungi Admin Koperasi
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Card Mockup Column */}
                        {!result && (
                            <div className="lg:col-span-5 flex flex-col items-center justify-center pl-0 lg:pl-8">
                                <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <BookOpenText className="w-3.5 h-3.5 text-amber-500" />
                                    Panduan Struk Koperasi
                                </p>

                                {/* Thermal Receipt Graphic */}
                                <div
                                    onClick={handleAutoFillDemo}
                                    title="Klik untuk mencoba data demo"
                                    className="relative w-full max-w-[270px] bg-[#fafaf9] dark:bg-[#141a27] text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-white/[0.08] shadow-md p-4 font-mono text-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer flex flex-col items-center"
                                    style={{
                                        boxShadow: '0 8px 24px -8px rgba(0,0,0,0.08)',
                                    }}
                                >
                                    {/* Receipt Zig-zag top effect via CSS dashes */}
                                    <div className="absolute bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent bg-[size:8px_4px] bg-repeat-x" />

                                    {/* Header */}
                                    <div className="text-center w-full space-y-0.5 mb-2">
                                        <p className="font-bold text-sm tracking-wider text-gray-905 dark:text-white">KOPERASI SENYUM</p>
                                        <p className="text-[9px] text-gray-400 dark:text-white/40">MBS TANGGUL JEMBER</p>
                                        <p className="text-[9px] text-gray-400 dark:text-white/40">TELP: 0851-8307-9329</p>
                                        <p className="border-t border-dashed border-gray-300 dark:border-white/10 my-1.5"></p>
                                        <p className="text-[10px] font-bold text-gray-800 dark:text-slate-300">BUKTI REGISTRASI AKSES</p>
                                        <p className="border-b border-dashed border-gray-300 dark:border-white/10 my-1.5"></p>
                                    </div>

                                    {/* Body details */}
                                    <div className="w-full space-y-1.5 text-[10px]">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-white/30">TGL:</span>
                                            <span>28-06-2026</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-white/30">NAMA:</span>
                                            <span className="font-bold text-gray-950 dark:text-white truncate max-w-[150px]">AHMAD RAIHAN</span>
                                        </div>

                                        <p className="border-t border-dotted border-gray-200 dark:border-white/5 my-1.5"></p>

                                        {/* Registration Number Field */}
                                        <div
                                            className={`p-1.5 rounded transition-all duration-200 border text-center ${cardHighlight === 'reg'
                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-400 scale-[1.02]'
                                                : 'border-transparent'
                                                }`}
                                        >
                                            <p className="text-[8px] text-gray-400 dark:text-white/30 tracking-wider mb-0.5 font-sans">NO. REGISTRASI (KLIK)</p>
                                            <p className="font-bold text-blue-600 dark:text-blue-400 text-xs">REG-2026-0001</p>
                                        </div>

                                        {/* PIN Field */}
                                        <div
                                            className={`p-1.5 rounded transition-all duration-200 border text-center ${cardHighlight === 'pin'
                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-400 scale-[1.02]'
                                                : 'border-transparent'
                                                }`}
                                        >
                                            <p className="text-[8px] text-gray-400 dark:text-white/30 tracking-wider mb-0.5 font-sans">PIN AKSES (KLIK)</p>
                                            <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">123456</p>
                                        </div>
                                    </div>

                                    {/* Barcode & Footer Strip */}
                                    <div className="w-full text-center mt-2 space-y-1">
                                        <p className="border-t border-dashed border-gray-300 dark:border-white/10 my-1"></p>

                                        {/* Barcode */}
                                        <div className="flex justify-center items-center gap-0.5 opacity-60">
                                            <div className="w-0.5 h-4 bg-black dark:bg-white"></div>
                                            <div className="w-1.5 h-4 bg-black dark:bg-white"></div>
                                            <div className="w-px h-4 bg-black dark:bg-white"></div>
                                            <div className="w-0.5 h-4 bg-black dark:bg-white"></div>
                                            <div className="w-1.5 h-4 bg-black dark:bg-white"></div>
                                            <div className="w-0.5 h-4 bg-black dark:bg-white"></div>
                                            <div className="w-1 h-4 bg-black dark:bg-white"></div>
                                            <div className="w-px h-4 bg-black dark:bg-white"></div>
                                            <div className="w-1.5 h-4 bg-black dark:bg-white"></div>
                                        </div>

                                        <p className="text-[8px] text-gray-400 dark:text-white/30 leading-normal font-sans">
                                            *Simpan bukti cetak ini untuk mengecek status tagihan secara online.
                                        </p>
                                    </div>
                                </div>

                                <p className="text-[10px] text-gray-400 dark:text-white/30 text-center mt-2.5 max-w-[240px]">
                                    Klik struk untuk memasukkan data uji coba otomatis.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                            <div className="h-px bg-gray-100 dark:bg-white/[0.07] my-6"></div>

                            {/* Student Profile Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{result.student.name}</h3>
                                    <div className="flex gap-3 text-sm text-gray-500 dark:text-white/40 mt-1">
                                        <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider
                                                         bg-blue-100 dark:bg-blue-500/10
                                                         text-blue-700 dark:text-blue-400">
                                            {result.student.registrationNumber}
                                        </span>
                                        <span>•</span>
                                        <span>{result.student.className}</span>
                                        <span>•</span>
                                        <span>{result.student.program}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-white/40">Total Tagihan Belum Lunas</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(result.billing.balance)}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl border
                                                bg-gray-50 dark:bg-white/[0.03]
                                                border-gray-100 dark:border-white/[0.07]">
                                    <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1">Total Kewajiban</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(result.billing.totalLiabilities)}</p>
                                </div>
                                <div className="p-4 rounded-xl border
                                                bg-blue-50 dark:bg-blue-500/[0.07]
                                                border-blue-100 dark:border-blue-500/20">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Sudah Dibayar</p>
                                    <p className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(result.billing.totalPaid)}</p>
                                </div>
                                <div className="col-span-2 p-4 rounded-xl border
                                                bg-amber-50 dark:bg-amber-500/[0.07]
                                                border-amber-100 dark:border-amber-500/20">
                                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pembayaran Terakhir</p>
                                    <p className="font-bold text-amber-700 dark:text-amber-400">
                                        {result.billing.lastPaymentDate ? formatDate(result.billing.lastPaymentDate) : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Liabilities List */}
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-blue-500" />
                                        Rincian Tagihan
                                    </h4>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {result.liabilities.length > 0 ? (
                                            result.liabilities.map((item) => (
                                                <div key={item.id} className="p-3 rounded-lg border
                                                                              bg-white dark:bg-white/[0.03]
                                                                              border-gray-100 dark:border-white/[0.07]">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium text-gray-800 dark:text-white/80">{item.description}</span>
                                                        <span className={`text-sm font-bold ${item.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-500 dark:text-white/30">Jatuh Tempo: {formatDate(item.dueDate)}</span>
                                                        {item.isPaid ? (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                                                             text-emerald-600 dark:text-emerald-400
                                                                             bg-emerald-50 dark:bg-emerald-500/10">
                                                                <CheckCircle className="w-3 h-3" /> Lunas
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full
                                                                             text-red-500 dark:text-red-400
                                                                             bg-red-50 dark:bg-red-500/10">Belum Lunas</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 dark:text-white/30 text-sm italic">Tidak ada data tagihan.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Payments */}
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        Riwayat Pembayaran
                                    </h4>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {result.recentPayments.length > 0 ? (
                                            result.recentPayments.map((payment) => (
                                                <div key={payment.id} className="p-3 rounded-lg border
                                                                                  bg-white dark:bg-white/[0.02]
                                                                                  border-gray-100 dark:border-white/[0.07]">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium text-gray-800 dark:text-white/80">{formatCurrency(payment.amount)}</span>
                                                        <span className="text-xs uppercase px-2 py-0.5 rounded
                                                                         text-gray-500 dark:text-white/40
                                                                         bg-gray-100 dark:bg-white/[0.06]">
                                                            {payment.method}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-white/30">
                                                        <span>{formatDate(payment.paymentDate)}</span>
                                                        {payment.note && <span className="max-w-[150px] truncate" title={payment.note}>{payment.note}</span>}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 dark:text-white/30 text-sm italic">Belum ada riwayat pembayaran.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section >
    );
}