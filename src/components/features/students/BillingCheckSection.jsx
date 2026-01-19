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
        <section id="cek-tagihan" className="py-16 bg-blue-50 dark:bg-gray-800/50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cek Status Pembayaran</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Pantau tagihan dan riwayat pembayaran santri secara real-time.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="No. Registrasi (Contoh: REG-2024-0001)"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="password"
                                maxLength={6}
                                placeholder="6 Digit PIN Siswa"
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {loading ? 'Mengecek...' : 'Cek Data'}
                        </button>
                    </form>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {/* Footnote */}
                    {!result && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            *Gunakan No. Registrasi dan PIN yang tertera pada Kartu Pelajar untuk mengecek tagihan.
                        </p>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-6"></div>

                            {/* Student Profile Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{result.student.name}</h3>
                                    <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-semibold uppercase tracking-wider">
                                            {result.student.registrationNumber}
                                        </span>
                                        <span>•</span>
                                        <span>{result.student.className}</span>
                                        <span>•</span>
                                        <span>{result.student.program}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Tagihan Belum Lunas</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(result.billing.balance)}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Kewajiban</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(result.billing.totalLiabilities)}</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                    <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Sudah Dibayar</p>
                                    <p className="font-bold text-green-700 dark:text-green-400">{formatCurrency(result.billing.totalPaid)}</p>
                                </div>
                                <div className="col-span-2 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Pembayaran Terakhir</p>
                                    <p className="font-bold text-blue-700 dark:text-blue-400">
                                        {result.billing.lastPaymentDate ? formatDate(result.billing.lastPaymentDate) : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Liabilities List */}
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-gray-400" />
                                        Rincian Tagihan
                                    </h4>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {result.liabilities.length > 0 ? (
                                            result.liabilities.map((item) => (
                                                <div key={item.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.description}</span>
                                                        <span className={`text-sm font-bold ${item.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-500">Jatuh Tempo: {formatDate(item.dueDate)}</span>
                                                        {item.isPaid ? (
                                                            <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                                                <CheckCircle className="w-3 h-3" /> Lunas
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Belum Lunas</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">Tidak ada data tagihan.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Payments */}
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        Riwayat Pembayaran
                                    </h4>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {result.recentPayments.length > 0 ? (
                                            result.recentPayments.map((payment) => (
                                                <div key={payment.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(payment.amount)}</span>
                                                        <span className="text-xs text-gray-500 uppercase bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                            {payment.method}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                        <span>{formatDate(payment.paymentDate)}</span>
                                                        {payment.note && <span className="max-w-[150px] truncate" title={payment.note}>{payment.note}</span>}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">Belum ada riwayat pembayaran.</p>
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
