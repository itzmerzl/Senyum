import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const BillingCheck = () => {
    const [formData, setFormData] = useState({
        registrationNumber: '',
        pin: ''
    });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3001/api/public/check-billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registrationNumber: formData.registrationNumber.toUpperCase().trim(),
                    pin: formData.pin.toUpperCase().trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Terjadi kesalahan');
            }

            setResult(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                        <Search className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Cek Tagihan Siswa
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Koperasi Senyum - Sistem Informasi Tagihan
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nomor Registrasi
                            </label>
                            <input
                                type="text"
                                placeholder="REG-2024-0001"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg"
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                * Nomor registrasi tertera pada Kartu Pelajar
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                6 Digit PIN
                            </label>
                            <input
                                type="password"
                                placeholder="XXXXXX"
                                maxLength={6}
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg tracking-widest"
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                * PIN tertera pada amplop tertutup yang diserahkan saat pendaftaran
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-red-800 font-medium">{error}</p>
                                    <p className="text-red-600 text-sm mt-1">
                                        Pastikan Nomor Registrasi dan PIN yang Anda masukkan benar.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Search className="w-6 h-6" />
                                    Cek Tagihan
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Result */}
                {result && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-fadeIn">
                        {/* Student Info */}
                        <div className="flex items-start gap-4 pb-6 border-b-2 border-gray-100">
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {result.student.name}
                                </h2>
                                <div className="flex gap-4 mt-2 text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <span className="font-medium">Kelas:</span> {result.student.className || '-'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="font-medium">Program:</span> {result.student.program || '-'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {result.student.registrationNumber}
                                </p>
                            </div>
                        </div>

                        {/* Billing Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
                                <p className="text-sm font-medium text-blue-800 mb-1">Total Tagihan</p>
                                <p className="text-3xl font-bold text-blue-900">
                                    {formatCurrency(result.billing.totalLiabilities)}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
                                <p className="text-sm font-medium text-green-800 mb-1">Sudah Dibayar</p>
                                <p className="text-3xl font-bold text-green-900">
                                    {formatCurrency(result.billing.totalPaid)}
                                </p>
                            </div>
                            <div className={`bg-gradient-to-br p-6 rounded-xl border-2 ${result.billing.balance > 0
                                    ? 'from-red-50 to-red-100 border-red-200'
                                    : 'from-gray-50 to-gray-100 border-gray-200'
                                }`}>
                                <p className={`text-sm font-medium mb-1 ${result.billing.balance > 0 ? 'text-red-800' : 'text-gray-800'
                                    }`}>
                                    Sisa Tagihan
                                </p>
                                <p className={`text-3xl font-bold ${result.billing.balance > 0 ? 'text-red-900' : 'text-gray-900'
                                    }`}>
                                    {formatCurrency(result.billing.balance)}
                                </p>
                            </div>
                        </div>

                        {/* Liabilities List */}
                        {result.liabilities && result.liabilities.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-4">Detail Tagihan</h3>
                                <div className="space-y-3">
                                    {result.liabilities.map((liability) => (
                                        <div
                                            key={liability.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{liability.description}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Jatuh tempo: {formatDate(liability.dueDate)}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="font-bold text-gray-900 text-lg">
                                                    {formatCurrency(liability.amount)}
                                                </p>
                                                <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mt-1 ${liability.isPaid
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {liability.isPaid ? '✓ Lunas' : 'Belum Lunas'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Payments */}
                        {result.recentPayments && result.recentPayments.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-4">Riwayat Pembayaran Terakhir</h3>
                                <div className="space-y-2">
                                    {result.recentPayments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {formatDate(payment.paymentDate)}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {payment.method} {payment.note && `• ${payment.note}`}
                                                </p>
                                            </div>
                                            <p className="font-bold text-green-600 text-lg">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {result.liabilities.length === 0 && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <p className="text-xl font-semibold text-gray-900">Tidak Ada Tagihan</p>
                                <p className="text-gray-600 mt-2">Semua tagihan sudah lunas</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingCheck;
