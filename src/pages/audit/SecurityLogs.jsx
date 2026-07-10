import { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertTriangle, AlertCircle, User, Clock, Unlock } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/apiClient';
import toast from 'react-hot-toast';

export default function SecurityLogs() {
    const [summary, setSummary] = useState({ totalToday: 0, criticalToday: 0, recentCritical: [] });
    const [lockedUsers, setLockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, usersRes] = await Promise.all([
                api.get('admin/audit-summary'),
                api.get('users')
            ]);
            if (summaryRes) setSummary(summaryRes);
            if (usersRes) {
                const locked = usersRes.filter(u => u.lockedUntil && new Date(u.lockedUntil) > new Date());
                setLockedUsers(locked);
            }
        } catch (error) {
            console.error('Failed to fetch security data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const unlockUser = async (userId, username) => {
        try {
            await api.post(`admin/unlock-user/${userId}`);
            toast.success(`${username} berhasil di-unlock`);
            fetchData();
        } catch (error) {
            toast.error('Gagal unlock user');
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-7 h-7 text-red-600" />Security Logs
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor keamanan sistem dan akun terkunci</p>
                    </div>
                    <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Aktivitas Hari Ini</span>
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{summary.totalToday}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Event Critical Hari Ini</span>
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{summary.criticalToday}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Akun Terkunci</span>
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{lockedUsers.length}</p>
                    </div>
                </div>

                {/* Locked Users */}
                {lockedUsers.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />Akun Terkunci ({lockedUsers.length})
                        </h3>
                        <div className="space-y-2">
                            {lockedUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                            <User className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                                            <p className="text-xs text-gray-500">Terkunci sampai: {new Date(user.lockedUntil).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => unlockUser(user.id, user.username)} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                                        <Unlock className="w-4 h-4" />Unlock
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Critical */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />Recent Critical Events
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {summary.recentCritical.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Tidak ada critical event</div>
                        ) : summary.recentCritical.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{log.description || log.action}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <User className="w-3 h-3" />{log.user?.username || '-'}
                                            <Clock className="w-3 h-3 ml-2" />{new Date(log.createdAt).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">critical</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
