import { useState, useEffect } from 'react';
import { ScrollText, Filter, RefreshCw, AlertTriangle, Info, AlertCircle, User, Clock } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/apiClient';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ byModule: [], bySeverity: [] });
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        module: '',
        severity: '',
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.module) params.append('module', filters.module);
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            params.append('limit', '100');

            const res = await api.get(`admin/audit-logs?${params.toString()}`);
            if (res) {
                setLogs(res.logs || []);
                setStats(res.stats || { byModule: [], bySeverity: [] });
                setTotal(res.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const getSeverityBadge = (severity) => {
        const styles = {
            info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        const icons = { info: Info, warning: AlertTriangle, critical: AlertCircle };
        const Icon = icons[severity] || Info;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity] || styles.info}`}>
                <Icon className="w-3 h-3" />{severity}
            </span>
        );
    };

    const getModuleBadge = (module) => {
        const colors = {
            auth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            pos: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            product: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            student: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            transaction: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            setting: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[module] || colors.setting}`}>{module}</span>;
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ScrollText className="w-7 h-7 text-blue-600" />Audit Logs
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Riwayat semua aktivitas sistem ({total.toLocaleString()} logs)</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
                            <Filter className="w-4 h-4" />Filter
                        </button>
                        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
                        </button>
                    </div>
                </div>

                {/* Stats - Always show 4 cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Logs */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Logs</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <ScrollText className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{total.toLocaleString()}</p>
                    </div>
                    {/* Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Info</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Info className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {(stats.bySeverity.find(s => s.severity === 'info')?._count || 0).toLocaleString()}
                        </p>
                    </div>
                    {/* Warning */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Warning</span>
                            <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {(stats.bySeverity.find(s => s.severity === 'warning')?._count || 0).toLocaleString()}
                        </p>
                    </div>
                    {/* Critical */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Critical</span>
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {(stats.bySeverity.find(s => s.severity === 'critical')?._count || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <select value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="">Semua Module</option>
                                <option value="auth">Auth</option><option value="pos">POS</option><option value="product">Product</option>
                                <option value="student">Student</option><option value="transaction">Transaction</option><option value="setting">Setting</option>
                            </select>
                            <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="">Semua Severity</option>
                                <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
                            </select>
                            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            <div className="flex gap-2">
                                <button onClick={fetchLogs} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply</button>
                                <button onClick={() => { setFilters({ module: '', severity: '', startDate: '', endDate: '' }); setTimeout(fetchLogs, 0); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Clear</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Waktu</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Module</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500"><ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />Tidak ada log</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.createdAt).toLocaleString('id-ID')}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"><User className="w-4 h-4 text-gray-600 dark:text-gray-300" /></div>
                                                <span className="text-gray-900 dark:text-white font-medium">{log.user?.username || log.userName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{getModuleBadge(log.module)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{log.action}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{log.description || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{getSeverityBadge(log.severity)}</td>
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
