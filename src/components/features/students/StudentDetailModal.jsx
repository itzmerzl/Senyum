import React, { useState } from 'react';
import {
    X,
    User,
    Calendar,
    Phone,
    MapPin,
    CreditCard,
    Clock,
    Wallet,
    GraduationCap,
    Shield,
    RefreshCw,
    Printer,
    CheckCircle,
    AlertCircle,
    Package,
    CheckSquare,
    Square,
    Banknote,
    CheckCheck
} from 'lucide-react';
import api from '../../../utils/apiClient';
import StudentTimeline from './StudentTimeline';
import ConfirmDialog from '../../common/ConfirmDialog';
import { formatCurrency } from '../../../utils/formatters';
import { resetStudentPin } from '../../../services/studentService';
import { getStoreSettings } from '../../../services/settingService';
import { printThermalReceipt } from '../../../utils/printHelper';
import { getLiabilitiesByStudent } from '../../../services/liabilityService';
import { formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';

const StudentDetailModal = ({ student, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [resetPinResult, setResetPinResult] = useState(null);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Liability State
    const [liabilities, setLiabilities] = useState([]);
    const [loadingLiab, setLoadingLiab] = useState(false);

    // Fetch liabilities when bill tab is active
    React.useEffect(() => {
        if (activeTab === 'bill' && student) {
            fetchLiabilities();
        }
    }, [activeTab, student]);

    const fetchLiabilities = async () => {
        try {
            setLoadingLiab(true);
            const data = await getLiabilitiesByStudent(student.id);
            setLiabilities(data);
        } catch (error) {
            console.error('Error fetching liabilities:', error);
            // toast.error('Gagal memuat detail tagihan'); // Optional, removed to avoid spam
        } finally {
            setLoadingLiab(false);
        }
    };

    const handleToggleItem = async (liabilityId, itemIndex, currentStatus) => {
        // Optimistic update
        const updatedLiabilities = liabilities.map(l => {
            if (l.id === liabilityId) {
                const newItems = [...(l.items || [])];
                const newStatus = currentStatus === 'delivered' ? 'pending' : 'delivered';

                // Update local state
                newItems[itemIndex] = {
                    ...newItems[itemIndex],
                    status: newStatus,
                    // Temporarily set metadata for UI feedback (refresh will give real server data)
                    deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : null,
                    deliveredBy: newStatus === 'delivered' ? 'Admin' : null
                };
                return { ...l, items: newItems };
            }
            return l;
        });

        setLiabilities(updatedLiabilities);

        try {
            const liability = updatedLiabilities.find(l => l.id === liabilityId);
            await api.patch(`liabilities/${liabilityId}/fulfillment`, {
                items: liability.items
            });
            toast.success('Status barang diperbarui');
        } catch (error) {
            console.error('Update item error:', error);
            toast.error('Gagal update status');
            fetchLiabilities(); // Revert
        }
    };

    const handleToggleAllItems = async (liabilityId, items) => {
        // Check if all items are already delivered
        const allDelivered = items.every(item => item.status === 'delivered');
        const newStatus = allDelivered ? 'pending' : 'delivered';

        // Optimistic update
        const updatedLiabilities = liabilities.map(l => {
            if (l.id === liabilityId) {
                const newItems = (l.items || []).map(item => ({
                    ...item,
                    status: newStatus,
                    deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : null,
                    deliveredBy: newStatus === 'delivered' ? 'Admin' : null
                }));
                return { ...l, items: newItems };
            }
            return l;
        });

        setLiabilities(updatedLiabilities);

        try {
            const liability = updatedLiabilities.find(l => l.id === liabilityId);
            await api.patch(`liabilities/${liabilityId}/fulfillment`, {
                items: liability.items
            });
            toast.success(allDelivered ? 'Semua status direset' : 'Semua barang ditandai diterima');
        } catch (error) {
            console.error('Toggle all items error:', error);
            toast.error('Gagal update status');
            fetchLiabilities(); // Revert
        }
    };

    const handlePrintHandover = async (liability) => {
        try {
            const deliveredItems = liability.items?.filter(i => i.status === 'delivered') || [];
            if (deliveredItems.length === 0) {
                toast.error('Belum ada barang yang diterima');
                return;
            }

            const settings = await getStoreSettings();
            printThermalReceipt({
                studentName: student.fullName,
                registrationNumber: student.registrationNumber,
                type: 'HANDOVER',
                items: deliveredItems,
                liabilityTitle: liability.title,
                storeSettings: settings
            });
        } catch (error) {
            console.error('Print handover error:', error);
            toast.error('Gagal mencetak bukti serah terima');
        }
    };

    if (!student) return null;

    const tabs = [
        { id: 'overview', label: 'Ringkasan', icon: User },
        { id: 'bill', label: 'Tagihan', icon: Wallet },
        { id: 'history', label: 'Riwayat Aktivitas', icon: Clock },
    ];

    const handleResetPin = () => {
        setShowResetConfirm(true);
    };

    const executeResetPin = async () => {
        setIsResetting(true);
        try {
            const result = await resetStudentPin(student.id);
            if (result.success) {
                setResetPinResult({
                    pin: result.newPin,
                    registrationNumber: student.registrationNumber
                });
                toast.success('PIN berhasil direset');
                setShowResetConfirm(false);
            }
        } catch (error) {
            console.error('Reset PIN error:', error);
            toast.error('Gagal mereset PIN');
        } finally {
            setIsResetting(false);
        }
    };

    const handlePrintPin = async () => {
        try {
            const settings = await getStoreSettings();
            printThermalReceipt({
                studentName: student.fullName,
                registrationNumber: resetPinResult.registrationNumber,
                pin: resetPinResult.pin,
                type: 'PIN_RESET',
                storeSettings: settings
            });
        } catch (error) {
            console.error('Print error:', error);
            toast.error('Gagal mencetak struk');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl">
                            {student.photoUrl ? (
                                <img src={student.photoUrl} alt={student.fullName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                student.fullName.charAt(0)
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{student.fullName}</h2>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800">
                                    {student.registrationNumber}
                                </span>
                                <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    {student.className}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.status === 'active'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                    {student.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                </span>
                                {student.gender && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.gender === 'L'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                                        }`}>
                                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Informasi Pribadi</h3>
                                        <div className="space-y-4">
                                            <InfoItem icon={User} label="Nama Wali" value={student.guardianName || '-'} />
                                            <InfoItem icon={Phone} label="No. HP / WA" value={student.guardianPhone || student.guardianWhatsapp || '-'} />
                                            <InfoItem icon={MapPin} label="Alamat" value={student.address || '-'} />
                                            <InfoItem icon={Calendar} label="Tanggal Masuk" value={student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('id-ID') : '-'} />
                                        </div>
                                    </div>
                                </div>

                                {/* Financial & Security Info */}
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Status Keuangan</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Sisa Tagihan</p>
                                                        <p className="text-lg font-bold text-orange-700 dark:text-orange-300 mt-1">
                                                            {formatCurrency(student.balance || 0)}
                                                        </p>
                                                    </div>
                                                    <Wallet className="w-5 h-5 text-orange-500 opacity-50" />
                                                </div>
                                            </div>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total Terbayar</p>
                                                        <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                                                            {formatCurrency(student.totalPaid || 0)}
                                                        </p>
                                                    </div>
                                                    <CreditCard className="w-5 h-5 text-green-500 opacity-50" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Section */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Keamanan</h3>
                                        <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                        <Shield className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">PIN Transaksi</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Digunakan untuk validasi pembayaran</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleResetPin}
                                                    disabled={isResetting}
                                                    className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                                                    {isResetting ? 'Memproses...' : 'Reset PIN'}
                                                </button>
                                            </div>

                                            {/* Reset Result Display */}
                                            {resetPinResult && (
                                                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-start gap-3">
                                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-green-900 dark:text-green-300">PIN Berhasil Direset</p>
                                                            <div className="mt-2 text-2xl font-bold font-mono tracking-wider text-green-700 dark:text-green-400">
                                                                {resetPinResult.pin}
                                                            </div>
                                                            <p className="mt-1 text-xs text-green-600 dark:text-green-500">
                                                                Catat PIN diatas sekarang. PIN tidak akan ditampilkan lagi.
                                                            </p>
                                                            <button
                                                                onClick={handlePrintPin}
                                                                className="mt-3 text-sm flex items-center gap-2 text-green-700 dark:text-green-300 hover:underline font-medium"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                                Cetak Kredensial Baru
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bill' && (
                        <div className="space-y-4">
                            {loadingLiab ? (
                                <div className="flex justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : liabilities.length === 0 ? (
                                <div className="text-center p-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Tidak ada tagihan tersedia</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {liabilities.map((liability) => (
                                        <div key={liability.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{liability.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(liability.dueDate)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${liability.status === 'paid' ? 'text-green-600 dark:text-green-400' :
                                                        liability.status === 'partial' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {formatCurrency(liability.remainingAmount)}
                                                    </p>
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium mt-1 ${liability.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                        liability.status === 'partial' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                        {liability.status === 'paid' ? 'Lunas' : liability.status === 'partial' ? 'Dicicil' : 'Belum Lunas'}
                                                    </span>
                                                </div>
                                            </div>

                                            { /* Item Checklist Section */}
                                            {
                                                liability.items && liability.items.length > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                                <Package className="w-3.5 h-3.5" />
                                                                Daftar Barang / Fasilitas
                                                            </h5>
                                                            <button
                                                                onClick={() => handlePrintHandover(liability)}
                                                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                                                                title="Cetak bukti serah terima barang yang sudah diambil"
                                                            >
                                                                <Printer className="w-3 h-3" />
                                                                Cetak Bukti
                                                            </button>
                                                        </div>
                                                        {/* Select All Toggle */}
                                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                                            <button
                                                                onClick={() => handleToggleAllItems(liability.id, liability.items)}
                                                                className="text-xs flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            >
                                                                <CheckCheck className="w-4 h-4" />
                                                                {liability.items.every(i => i.status === 'delivered') ? 'Batalkan Semua' : 'Tandai Semua Diterima'}
                                                            </button>
                                                            <span className="text-[10px] text-gray-400">
                                                                {liability.items.filter(i => i.status === 'delivered').length}/{liability.items.length} diterima
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
                                                            {liability.items.map((item, idx) => (
                                                                <div key={idx} className="flex items-start gap-3">
                                                                    <button
                                                                        onClick={() => handleToggleItem(liability.id, idx, item.status)}
                                                                        className={`mt-0.5 transition-colors ${item.status === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 hover:text-gray-600'}`}
                                                                    >
                                                                        {item.status === 'delivered' ? (
                                                                            <CheckSquare className="w-5 h-5" />
                                                                        ) : (
                                                                            <Square className="w-5 h-5" />
                                                                        )}
                                                                    </button>
                                                                    <div className="flex-1">
                                                                        <p className={`text-sm ${item.status === 'delivered' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200'}`}>
                                                                            {item.name}
                                                                        </p>
                                                                        {item.status === 'delivered' && (
                                                                            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
                                                                                <CheckCircle className="w-3 h-3" />
                                                                                Diterima: {item.deliveredAt ? formatDate(item.deliveredAt) : '-'} {item.deliveredBy ? `oleh ${item.deliveredBy}` : ''}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {item.price > 0 && (
                                                                        <span className="text-xs text-gray-400 font-mono">
                                                                            {item.price.toLocaleString('id-ID')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            < div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center text-xs" >
                                                <span className="text-gray-500">Total Tagihan: {formatCurrency(liability.totalAmount)}</span>
                                                <div className="flex items-center gap-2">
                                                    {
                                                        liability.status !== 'paid' && (
                                                            <>
                                                                <span className="text-red-500 font-medium flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Jatuh Tempo
                                                                </span>
                                                                <button
                                                                    onClick={() => toast('Fitur pembayaran akan segera hadir!', { icon: '💳' })}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                                                                >
                                                                    <Banknote className="w-3.5 h-3.5" />
                                                                    Bayar
                                                                </button>
                                                            </>
                                                        )
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <StudentTimeline studentId={student.id} />
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div >

            {/* Confirmation Dialog */}
            < ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={executeResetPin}
                title="Reset PIN Transaksi"
                message="Apakah Anda yakin ingin mereset PIN santri ini? PIN lama tidak akan bisa digunakan lagi untuk transaksi."
                confirmText="Ya, Reset PIN"
                cancelText="Batal"
                type="warning"
                loading={isResetting}
            />
        </div >
    );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

export default StudentDetailModal;
