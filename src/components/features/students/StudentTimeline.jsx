import React, { useState, useEffect } from 'react';
import {
    History,
    Calendar,
    CreditCard,
    UserCog,
    GraduationCap,
    AlertCircle,
    Clock,
    ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getStudentHistory } from '../../../services/studentService';
import { formatCurrency } from '../../../utils/formatters';

const StudentTimeline = ({ studentId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, [studentId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await getStudentHistory(studentId);
            setHistory(data);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError(err.message || 'Gagal memuat riwayat');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (action) => {
        switch (action) {
            case 'created': return <UserCog className="w-5 h-5 text-green-500" />;
            case 'pin_reset': return <History className="w-5 h-5 text-orange-500" />;
            case 'student_update':
            case 'info_updated': return <UserCog className="w-5 h-5 text-blue-500" />;
            case 'payment_made': return <CreditCard className="w-5 h-5 text-purple-500" />;
            case 'status_changed': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'class_promoted': return <GraduationCap className="w-5 h-5 text-yellow-500" />;
            default: return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getTitle = (action) => {
        switch (action) {
            case 'created': return 'Siswa Terdaftar';
            case 'pin_reset': return 'PIN Direset';
            case 'info_updated': return 'Data Diperbarui';
            case 'payment_made': return 'Pembayaran Diterima';
            case 'status_changed': return 'Status Berubah';
            case 'class_promoted': return 'Naik Kelas';
            default: return 'Aktivitas';
        }
    };

    const renderActivityDetails = (item) => {
        if (!item.details) return null;

        try {
            const details = JSON.parse(item.details);

            // Hide details for registration/created events (info is redundant)
            if (item.action === 'created' || item.action === 'student_registered') {
                return null;
            }

            if (item.action === 'class_promoted') {
                return (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">Kelas Tujuan</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{details.targetClass}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">Status</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {details.targetStatus === 'active' ? 'Aktif' : details.targetStatus}
                                </p>
                            </div>
                            {details.billed > 0 && (
                                <div className="col-span-2 pt-2 mt-1 border-t border-blue-100 dark:border-blue-800">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">Tagihan Dibuat</span>
                                    <p className="font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(details.billed)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // Default generic renderer for other actions
            const blacklistKeys = ['initialData', 'updatedAt', 'createdAt', 'id', 'studentId'];
            const entries = Object.entries(details).filter(([key]) => !blacklistKeys.includes(key));

            if (entries.length === 0) return null;

            const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

            return (
                <div className="mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                    {entries.map(([key, val]) => (
                        <div key={key} className="flex gap-1">
                            <span className="font-medium text-gray-500">{formatKey(key)}:</span>
                            <span className="break-all">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            return null;
        }
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center text-sm">
            Gagal memuat riwayat: {error}
        </div>
    );

    if (history.length === 0) return (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Belum ada riwayat aktivitas</p>
        </div>
    );

    return (
        <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-700 space-y-8 py-4">
            {history.map((item) => (
                <div key={item.id} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[31px] bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-100 dark:border-gray-700">
                        {getIcon(item.action)}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {getTitle(item.action)}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {item.description}
                        </p>

                        {renderActivityDetails(item)}

                        <div className="mt-2 text-xs text-gray-400">
                            Oleh: {item.performedBy || 'System'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StudentTimeline;
