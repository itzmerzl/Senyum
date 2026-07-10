import { useState, useEffect } from 'react';
import { History, RefreshCw, User, Clock, CheckCircle, XCircle, Lock, MapPin } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/apiClient';

export default function LoginHistory() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/security-logs?limit=100');
            if (res) setLogs(res.logs || []);
        } catch (error) {
            console.error('Failed to fetch login history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const getStatusBadge = (status) => {
        const config = {
            success: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
            failed: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
            blocked: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Lock }
        };
        const { bg, icon: Icon } = config[status] || config.failed;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg}`}>
                <Icon className="w-3 h-3" />{status}
            </span>
        );
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-7 h-7 text-blue-600" />Login History
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Riwayat percobaan login ke sistem</p>
                    </div>
                    <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Waktu</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">IP Address</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-500"><History className="w-8 h-8 mx-auto mb-2 opacity-50" />Tidak ada log</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.createdAt).toLocaleString('id-ID')}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"><User className="w-4 h-4 text-gray-600 dark:text-gray-300" /></div>
                                                <span className="text-gray-900 dark:text-white font-medium">{log.user?.username || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{getStatusBadge(log.status)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{log.ipAddress || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.failReason || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
