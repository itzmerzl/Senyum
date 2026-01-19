import React, { useState, useEffect } from 'react';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';

const SalesReport = () => {
    const [period, setPeriod] = useState('month'); // day, week, month, year
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalTransactions: 0,
        averageBasket: 0,
        topProducts: []
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // In a real app, we would have a dedicated /api/reports/sales endpoint.
            // For now, we fetch transactions and aggregate client-side or use a simple date filter on GET /transactions
            // Let's assume we implement GET /api/transactions with date filters.

            const endDate = new Date();
            const startDate = new Date();

            if (period === 'day') startDate.setHours(0, 0, 0, 0);
            if (period === 'week') startDate.setDate(startDate.getDate() - 7);
            if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
            if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

            // Fetch transactions
            // Note: My backend uses 'createdAt' or 'transactionDate'. Schema says 'transactionDate'.
            // Generic CRUD might not support complex date range filtering easily without custom logic.
            // BUT, let's try to query all and filter client side if dataset is small, OR better, 
            // I should implement the backend endpoint soon. 
            // For "Pro" feel, let's implement the UI assuming the data comes in properly.
            // I will simulate the API call effectively for now or use the generic one.

            // Strategy: Call a new endpoint I WILL build called /api/reports/sales
            const response = await api.get(`reports/sales?period=${period}`);
            setStats(response.stats);
            setTransactions(response.transactions);

        } catch (error) {
            console.error('Report error:', error);
            // Fallback for now if endpoint doesn't exist yet (during dev)
            setStats({
                totalRevenue: 0,
                totalTransactions: 0,
                averageBasket: 0,
                topProducts: []
            });
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (transactions.length === 0) {
            toast.error('Tidak ada data untuk diexport');
            return;
        }

        // Simple CSV Export
        const headers = ['Invoice', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.invoiceNumber,
                new Date(t.transactionDate).toLocaleDateString(),
                t.customerName || 'Umum',
                t.transactionItems?.length || 0,
                t.total,
                t.paymentMethod,
                t.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-12 text-center text-gray-500 max-w-2xl mx-auto">Memuat laporan...</div>;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['day', 'week', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${period === p
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {p === 'day' && 'Hari Ini'}
                            {p === 'week' && 'Minggu Ini'}
                            {p === 'month' && 'Bulan Ini'}
                            {p === 'year' && 'Tahun Ini'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Export Excel/CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-xs font-medium bg-white/20 px-2 py-1 rounded">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> Revenue
                        </span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        Rp {stats.totalRevenue.toLocaleString('id-ID')}
                    </div>
                    <div className="text-blue-100 text-sm">Total Pendapatan</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.totalTransactions}
                    </div>
                    <div className="text-gray-500 text-sm">Total Transaksi</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        Rp {Math.round(stats.averageBasket).toLocaleString('id-ID')}
                    </div>
                    <div className="text-gray-500 text-sm">Rata-rata Transaksi</div>
                </div>
            </div>

            {/* Top Products & Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Produk Terlaris</h3>
                    <div className="space-y-4">
                        {stats.topProducts.map((product, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</div>
                                        <div className="text-xs text-gray-500">{product.qty} terjual</div>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    Rp {product.revenue.toLocaleString('id-ID')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Riwayat Transaksi</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Invoice</th>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.slice(0, 10).map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-blue-600">{t.invoiceNumber}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {new Date(t.transactionDate).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">{t.customerName || 'Umum'}</td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            Rp {t.total.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    t.status === 'refunded' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;
