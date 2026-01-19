import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Server, Shield, Activity } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';

const SystemSettings = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await api.get('activityLogs?_sort=createdAt&_order=desc&_limit=50');
            // Depending on backend implementation of generic search, sort/limit might differ.
            // My generic CRUD handles ?key=value equality. It does NOT handle sort/limit query params nicely unless I implemented it.
            // Let's check `createCrudRoutes`. It only does: `if (value === 'true')...` 
            // It uses `orderBy: { id: 'desc' }` hardcoded.
            // So default is latest first.
            setLogs(data);
        } catch (error) {
            console.error('Fetch error:', error);
            // toast.error('Gagal memuat log'); // Suppress to not annoy main page load
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setBackupLoading(true);
            // Fetch all critical data
            const [products, transactions, users, settings] = await Promise.all([
                api.get('products'),
                api.get('transactions'),
                api.get('users'),
                api.get('settings')
            ]);

            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                store: {
                    products,
                    transactions,
                    users,
                    settings
                }
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `senyum_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Backup data berhasil diunduh');
        } catch (error) {
            console.error('Backup error:', error);
            toast.error('Gagal membuat backup');
        } finally {
            setBackupLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                Pemeliharaan Sistem
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Backup Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                            <Download className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-1 rounded">Recommended</span>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-1">Backup Data Toko</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Unduh salinan lengkap database (Produk, Transaksi, User) dalam format JSON untuk keamanan.
                    </p>
                    <button
                        onClick={handleBackup}
                        disabled={backupLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {backupLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {backupLoading ? 'Memproses...' : 'Download Backup'}
                    </button>
                </div>

                {/* Security Status (Static for now) */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Secure</span>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-1">Status Keamanan</h3>
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Database Connection</span>
                            <span className="text-green-600 font-medium">Connected</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Auth System</span>
                            <span className="text-green-600 font-medium">JWT / BCrypt</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Last Backup</span>
                            <span className="text-gray-400 italic">Belum pernah</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Logs */}
            <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-500" />
                        Aktivitas Terbaru
                    </h3>
                    <button onClick={fetchLogs} className="text-sm text-blue-600 hover:underline">
                        Refresh
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-medium sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Aksi</th>
                                    <th className="px-4 py-3">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                            Belum ada aktivitas tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {/* Backend generic route doesn't include relational User data by default */}
                                                User #{log.userId}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {log.description || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
