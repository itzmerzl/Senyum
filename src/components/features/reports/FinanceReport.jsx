import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUp, ArrowDown, PieChart } from 'lucide-react';
import api from '../../../utils/apiClient';

const FinanceReport = () => {
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState({
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`reports/finance?period=${period}`);
            setStats(response);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Memuat laporan keuangan...</div>;

    // Calculate margins
    const profitMargin = stats.revenue > 0 ? (stats.grossProfit / stats.revenue) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                {['day', 'month', 'year'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${period === p
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {p === 'day' && 'Hari Ini'}
                        {p === 'month' && 'Bulan Ini'}
                        {p === 'year' && 'Tahun Ini'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Profit Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-8 opacity-10">
                        <Wallet className="w-32 h-32" />
                    </div>

                    <h3 className="text-indigo-100 font-medium mb-1">Keuntungan Bersih (Net Profit)</h3>
                    <div className="text-4xl font-bold mb-6">
                        Rp {stats.netProfit.toLocaleString('id-ID')}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                            <div className="text-xs text-indigo-200 mb-1">Margin Keuntungan</div>
                            <div className="text-lg font-bold">{profitMargin.toFixed(1)}%</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                            <div className="text-xs text-indigo-200 mb-1">Total Omzet</div>
                            <div className="text-lg font-bold">Rp {(stats.revenue / 1000).toFixed(0)}k</div>
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-gray-500" />
                        Rincian Keuangan
                    </h3>

                    <div className="space-y-4">
                        {/* Revenue */}
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full text-green-600">
                                    <ArrowUp className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-700">Pendapatan (Revenue)</span>
                            </div>
                            <span className="font-bold text-gray-900">
                                + Rp {stats.revenue.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {/* COGS */}
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                                    <ArrowDown className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-700">HPP (Modal Barang)</span>
                            </div>
                            <span className="font-bold text-gray-900">
                                - Rp {stats.cogs.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {/* Expenses (Future) */}
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full text-red-600">
                                    <ArrowDown className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-700">Biaya Operasional (Coming Soon)</span>
                            </div>
                            <span className="font-bold text-gray-900">
                                - Rp {stats.expenses.toLocaleString('id-ID')}
                            </span>
                        </div>

                        <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center">
                            <span className="font-bold text-gray-600">Laba Kotor (Gross Profit)</span>
                            <span className="font-bold text-indigo-600 text-lg">
                                Rp {stats.grossProfit.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceReport;
