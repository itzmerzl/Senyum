import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
    ArrowDownLeft, Clock, CheckCircle, AlertTriangle, Users, FileText, UserX, Trash2, Plus, CreditCard, ArrowUpRight,
    ChevronLeft, ChevronRight, Search, Eye, Package
} from 'lucide-react';
import DebouncedInput from '../components/common/DebouncedInput';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import StatsCarousel from '../components/common/StatsCarousel';
import LiabilityForm from '../components/features/liabilities/LiabilityForm';
import PaymentModal from '../components/features/liabilities/PaymentModal';
import BatchLiabilityModal from '../components/features/liabilities/BatchLiabilityModal'; // Import
import { getAllLiabilities, createLiability, getLiabilityStats, deleteLiability, bulkUpdateFulfillment } from '../services/liabilityService';
import { getAllStudents } from '../services/studentService'; // Import
import { formatCurrency, formatDate } from '../utils/formatters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Liabilities() {
    const [liabilities, setLiabilities] = useState([]);
    const [filteredLiabilities, setFilteredLiabilities] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // 'all', 'paid', 'pending', 'partial'

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const [itemsPerPage] = useState(10);
    const [selectedIds, setSelectedIds] = useState([]); // Bulk Selection

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false); // Batch Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedLiability, setSelectedLiability] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Bulk Fulfillment Modal
    const [showBulkFulfillmentModal, setShowBulkFulfillmentModal] = useState(false);
    const [bulkFulfillmentItems, setBulkFulfillmentItems] = useState([]);
    const [selectedItemNames, setSelectedItemNames] = useState([]);

    // Delete Confirmation
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Data for Batch
    const [students, setStudents] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterLiabilities();
        filterLiabilities();
        setCurrentPage(1); // Reset page on filter change
        setSelectedIds([]); // Reset selection on filter change
    }, [liabilities, searchQuery, statusFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredLiabilities.length / itemsPerPage);
    const paginatedLiabilities = filteredLiabilities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional
        }
    };

    // Check for studentId URL param
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const studentId = params.get('studentId');

        if (studentId && students.length > 0) {
            const student = students.find(s => String(s.id) === String(studentId));
            if (student) {
                setSearchQuery(student.fullName);
            }
        }
    }, [location.search, students]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Parallel fetch with error handling for each
            const liabilitiesPromise = getAllLiabilities();
            const statsPromise = getLiabilityStats();
            const studentsPromise = getAllStudents().catch(err => {
                console.warn('Failed to fetch students for batch:', err);
                return { data: [] };
            });

            const [liabilitiesData, statsData, studentsResponse] = await Promise.all([
                liabilitiesPromise,
                statsPromise,
                studentsPromise
            ]);

            setLiabilities(liabilitiesData || []);
            setStats(statsData);
            // Handle paginated response format
            const studentsData = studentsResponse.data || studentsResponse;
            setStudents(Array.isArray(studentsData) ? studentsData : []);

        } catch (error) {
            toast.error('Gagal memuat data utama');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    const filterLiabilities = () => {
        let result = [...liabilities];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.title.toLowerCase().includes(q) ||
                l.student.fullName.toLowerCase().includes(q) ||
                l.student.className.toLowerCase().includes(q)
            );
        }

        if (statusFilter) {
            result = result.filter(l => l.status === statusFilter);
        }

        setFilteredLiabilities(result);
    };

    const handleCreateLiability = async (data) => {
        try {
            setFormLoading(true);
            await createLiability(data);
            toast.success('Tagihan berhasil dibuat');
            setShowAddModal(false);
            loadData();
        } catch (error) {
            toast.error('Gagal membuat tagihan');
            throw error;
        } finally {
            setFormLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedLiability(null);
        loadData();
    };

    const handleDeleteClick = (liability) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Hapus Tagihan',
            message: `Apakah Anda yakin ingin menghapus tagihan "${liability.title}" untuk ${liability.student.fullName}? Data yang dihapus tidak dapat dikembalikan.`,
            confirmText: 'Hapus',
            confirmStyle: 'danger',
            onConfirm: async () => {
                try {
                    await deleteLiability(liability.id);
                    toast.success('Tagihan berhasil dihapus');
                    loadData();
                } catch (error) {
                    toast.error('Gagal menghapus tagihan');
                }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
    };

    // Bulk Actions Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Select only visible items or all filtered? usually visible page is safer for UX, but power users want all.
            // Let's select ALL filtered liabilities for maximum utility
            setSelectedIds(filteredLiabilities.map(l => l.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectLiability = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Hapus Tagihan Massal',
            message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} tagihan yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: `Hapus (${selectedIds.length})`,
            confirmStyle: 'danger',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    // Execute deletes in parallel
                    await Promise.all(selectedIds.map(id => deleteLiability(id)));
                    toast.success(`${selectedIds.length} tagihan berhasil dihapus`);
                    setSelectedIds([]);
                    loadData();
                } catch (error) {
                    toast.error('Gagal menghapus beberapa tagihan');
                    console.error(error);
                } finally {
                    setLoading(false);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    // Bulk Fulfillment Handler
    const handleOpenBulkFulfillment = () => {
        // Get items that are NOT yet delivered across selected liabilities
        const selectedLiabilities = filteredLiabilities.filter(l => selectedIds.includes(l.id));
        const pendingItems = new Map(); // itemName -> count of students who haven't received it

        selectedLiabilities.forEach(l => {
            if (l.items && Array.isArray(l.items)) {
                l.items.forEach(item => {
                    // Only include items that are NOT delivered yet
                    if (item.status !== 'delivered') {
                        pendingItems.set(item.name, (pendingItems.get(item.name) || 0) + 1);
                    }
                });
            }
        });

        setBulkFulfillmentItems(Array.from(pendingItems.keys()));
        setSelectedItemNames([]);
        setShowBulkFulfillmentModal(true);
    };

    const handleBulkFulfillmentSubmit = async () => {
        if (selectedItemNames.length === 0) {
            toast.error('Pilih minimal satu item');
            return;
        }
        try {
            setFormLoading(true);
            await bulkUpdateFulfillment(selectedIds, selectedItemNames);
            toast.success(`${selectedItemNames.length} item ditandai diterima untuk ${selectedIds.length} santri`);
            setShowBulkFulfillmentModal(false);
            setSelectedIds([]);
            loadData();
        } catch (error) {
            toast.error('Gagal update penerimaan barang');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <Layout>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tagihan & Cicilan</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola pembayaran cicilan seragam, buku, dan lainnya</p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button
                                onClick={handleOpenBulkFulfillment}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-sm transition-all animate-in fade-in"
                            >
                                <Package size={20} />
                                Tandai Penerimaan ({selectedIds.length})
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm transition-all animate-in fade-in"
                            >
                                <Trash2 size={20} />
                                Hapus ({selectedIds.length})
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setShowBatchModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all"
                    >
                        <Users size={20} />
                        Buat Tagihan (Batch)
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all"
                    >
                        <Plus size={20} />
                        Buat Tagihan Baru
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="mb-6">
                    <StatsCarousel
                        stats={[
                            {
                                label: 'Total Piutang',
                                value: formatCurrency(stats.totalReceivable),
                                subtitle: 'Total nilai tagihan dicatat',
                                icon: CreditCard,
                                iconBg: 'bg-blue-50 dark:bg-blue-900/20',
                                iconColor: 'text-blue-600 dark:text-blue-400',
                                trendIcon: CreditCard
                            },
                            {
                                label: 'Sudah Diterima',
                                value: formatCurrency(stats.totalCollected),
                                valueColor: 'text-green-600 dark:text-green-400',
                                subtitle: `${stats.paidCount} tagihan lunas`,
                                icon: CheckCircle,
                                iconBg: 'bg-green-50 dark:bg-green-900/20',
                                iconColor: 'text-green-600 dark:text-green-400',
                                trendIcon: CheckCircle
                            },
                            {
                                label: 'Outstanding (Sisa)',
                                value: formatCurrency(stats.totalOutstanding),
                                valueColor: 'text-red-600 dark:text-red-400',
                                subtitle: `${stats.pendingCount} tagihan belum lunas`,
                                icon: Clock,
                                iconBg: 'bg-red-50 dark:bg-red-900/20',
                                iconColor: 'text-red-600 dark:text-red-400',
                                trendIcon: AlertTriangle
                            },
                            {
                                label: 'Tingkat Pelunasan',
                                value: `${stats.totalReceivable > 0 ? ((stats.totalCollected / stats.totalReceivable) * 100).toFixed(1) : 0}%`,
                                valueColor: 'text-indigo-600 dark:text-indigo-400',
                                subtitle: 'Persentase pembayaran masuk',
                                icon: ArrowUpRight,
                                iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
                                iconColor: 'text-indigo-600 dark:text-indigo-400',
                                trendIcon: ArrowUpRight
                            },
                            {
                                label: 'Tagihan Aktif',
                                value: liabilities.length,
                                subtitle: 'Total transaksi tagihan',
                                icon: FileText,
                                iconBg: 'bg-orange-50 dark:bg-orange-900/20',
                                iconColor: 'text-orange-600 dark:text-orange-400',
                                trendIcon: FileText
                            },
                            {
                                label: 'Siswa Menunggak',
                                value: new Set(liabilities.filter(l => l.status !== 'paid').map(l => l.studentId)).size,
                                valueColor: 'text-amber-600 dark:text-amber-400',
                                subtitle: 'Siswa dengan tagihan aktif',
                                icon: UserX,
                                iconBg: 'bg-amber-50 dark:bg-amber-900/20',
                                iconColor: 'text-amber-600 dark:text-amber-400',
                                trendIcon: UserX
                            }
                        ]}
                    />
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <DebouncedInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Cari nama santri, kelas, atau tagihan..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            <option value="">Semua Status</option>
                            <option value="pending">Belum Bayar</option>
                            <option value="partial">Cicilan</option>
                            <option value="paid">Lunas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List / Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredLiabilities.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Santri</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tagihan</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jatuh Tempo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sisa</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center">
                                        <div className="flex justify-center">
                                            <Spinner />
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLiabilities.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Tidak ada data tagihan</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Belum ada tagihan yang sesuai dengan filter ini</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLiabilities.map((liability) => (
                                    <tr key={liability.id} className={`hover:bg-gray-50 dark:bg-gray-700 transition-colors ${selectedIds.includes(liability.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(liability.id)}
                                                onChange={() => handleSelectLiability(liability.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">{liability.student.fullName}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-300">{liability.student.className}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {liability.title}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {formatDate(liability.dueDate)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${liability.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                liability.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {liability.status === 'paid' ? 'Lunas' :
                                                    liability.status === 'partial' ? 'Cicilan' : 'Belum Bayar'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right font-medium">
                                            {formatCurrency(liability.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                                            {formatCurrency(liability.remainingAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLiability(liability);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    className={`p-1.5 rounded transition-colors ${liability.status === 'paid'
                                                        ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                                                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                                                        }`}
                                                    title={liability.status === 'paid' ? 'Lihat Detail' : 'Bayar Tagihan'}
                                                >
                                                    {liability.status === 'paid' ? <Eye size={18} /> : <CreditCard size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(liability)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Hapus Tagihan"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {filteredLiabilities.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLiabilities.length)} dari {filteredLiabilities.length} data
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (totalPages > 5 && currentPage > 3) {
                                pageNum = currentPage - 3 + i;
                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}


            {/* Add Liability Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Buat Tagihan Baru"
                size="lg"
            >
                <LiabilityForm
                    onSubmit={handleCreateLiability}
                    onCancel={() => setShowAddModal(false)}
                    loading={formLoading}
                />
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setSelectedLiability(null);
                }}
                title="Pembayaran Tagihan"
                size="lg"
            >
                <PaymentModal
                    liability={selectedLiability}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => {
                        setShowPaymentModal(false);
                        setSelectedLiability(null);
                    }}
                />
            </Modal>

            <BatchLiabilityModal
                isOpen={showBatchModal}
                onClose={() => setShowBatchModal(false)}
                onSuccess={loadData}
                students={students}
            />

            {/* Bulk Fulfillment Modal */}
            <Modal
                isOpen={showBulkFulfillmentModal}
                onClose={() => setShowBulkFulfillmentModal(false)}
                title={`Tandai Penerimaan Barang (${selectedIds.length} santri)`}
                size="md"
            >
                <div className="space-y-4">
                    {bulkFulfillmentItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Package size={40} className="mx-auto mb-2 text-gray-300" />
                            <p>Tidak ada item barang pada tagihan yang dipilih.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Pilih item yang sudah diberikan kepada {selectedIds.length} santri terpilih:
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {bulkFulfillmentItems.map(itemName => (
                                    <label key={itemName} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedItemNames.includes(itemName)}
                                            onChange={() => {
                                                setSelectedItemNames(prev =>
                                                    prev.includes(itemName)
                                                        ? prev.filter(n => n !== itemName)
                                                        : [...prev, itemName]
                                                );
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{itemName}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setSelectedItemNames(bulkFulfillmentItems)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Pilih Semua
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowBulkFulfillmentModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleBulkFulfillmentSubmit}
                                        disabled={formLoading || selectedItemNames.length === 0}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        {formLoading && <Spinner size="sm" />}
                                        <CheckCircle size={16} />
                                        Tandai Diterima ({selectedItemNames.length})
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                confirmStyle={confirmDialog.confirmStyle}
                onConfirm={confirmDialog.onConfirm}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </Layout>
    );
}

