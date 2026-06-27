import { useState } from 'react';
import { checkPublicBilling } from '../../../services/studentService';
import { Loader2, Search, AlertCircle, CheckCircle, CreditCard, Calendar } from 'lucide-react';
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
            className="relative z-10 py-16 lg:py-20
                       bg-blue-50/60 dark:bg-transparent
                       border-y border-blue-100 dark:border-white/[0.05]"
        >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
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

                <div className="rounded-2xl p-8
                                border border-gray-100 dark:border-white/[0.07]
                                bg-white dark:bg-white/[0.03]
                                shadow-lg shadow-blue-500/5 dark:shadow-none">
                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="No. Registrasi (Contoh: REG-2024-0001)"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                className="w-full pl-4 pr-4 py-3 rounded-xl
                                           border border-gray-200 dark:border-white/[0.1]
                                           bg-gray-50 dark:bg-white/[0.04]
                                           text-gray-900 dark:text-white
                                           placeholder:text-gray-400 dark:placeholder:text-white/30
                                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                           outline-none transition-all"
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="password"
                                maxLength={6}
                                placeholder="6 Digit PIN Siswa"
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                className="w-full pl-4 pr-4 py-3 rounded-xl
                                           border border-gray-200 dark:border-white/[0.1]
                                           bg-gray-50 dark:bg-white/[0.04]
                                           text-gray-900 dark:text-white
                                           placeholder:text-gray-400 dark:placeholder:text-white/30
                                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                           outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-8 py-3 rounded-xl font-bold text-white
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
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3
                                        bg-red-50 dark:bg-red-500/10
                                        text-red-600 dark:text-red-400
                                        animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium text-sm">{error}</p>
                        </div>
                    )}

                    {/* Footnote */}
                    {!result && (
                        <p className="text-center text-sm text-gray-500 dark:text-white/40">
                            *Gunakan No. Registrasi dan PIN yang tertera pada Kartu Pelajar untuk mengecek tagihan.
                        </p>
                    )}

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
        </section>
    );
}