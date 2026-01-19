import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowRight, TrendingDown } from 'lucide-react';
import api from '../../../utils/apiClient';

const StockReport = () => {
    const [stats, setStats] = useState({
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        recentMovements: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('reports/stock');
            setStats(response);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Memuat data stok...</div>;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Item Produk</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalItems}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Nilai Aset Stok (COGS)</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                Rp {stats.totalValue.toLocaleString('id-ID')}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Stok Menipis</p>
                            <h3 className="text-2xl font-bold text-red-600">{stats.lowStockCount}</h3>
                        </div>
                    </div>
                    {stats.lowStockCount > 0 && (
                        <div className="mt-4 text-xs text-red-500 bg-red-50 px-2 py-1 rounded inline-block">
                            Perlu Restock Segera
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Movements Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Pergerakan Stok Terakhir</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Waktu</th>
                                <th className="px-4 py-3">Produk</th>
                                <th className="px-4 py-3">Tipe</th>
                                <th className="px-4 py-3">Jumlah</th>
                                <th className="px-4 py-3">Stok Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.recentMovements.map((mov, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(mov.createdAt).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {mov.product?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${mov.type === 'IN' || mov.type === 'REFUND' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {mov.type}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3 font-bold ${mov.type === 'IN' || mov.type === 'REFUND' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {mov.type === 'IN' || mov.type === 'REFUND' ? '+' : '-'}{mov.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {mov.balanceAfter}
                                    </td>
                                </tr>
                            ))}
                            {stats.recentMovements.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-6 text-gray-400">
                                        Belum ada data history stok
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockReport;
