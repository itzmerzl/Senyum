import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Filter,
    ArrowRight,
    Users,
    CheckSquare,
    Square,
    AlertTriangle,
    CreditCard,
    GraduationCap,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { getAllStudents, bulkPromoteStudents } from '../../../services/studentService';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../common/ConfirmDialog';

const ClassPromotionModal = ({ onClose, onSuccess }) => {
    // Steps: 'select', 'confirm'
    const [step, setStep] = useState('select');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [fetching, setFetching] = useState(true);

    // Filters
    const [sourceClass, setSourceClass] = useState('');
    const [program, setProgram] = useState('');

    // Target
    const [targetClass, setTargetClass] = useState('');
    const [targetProgram, setTargetProgram] = useState(''); // Usually same, but optional change? No, keep simple.

    // Billing
    const [createBill, setCreateBill] = useState(false);
    const [billTitle, setBillTitle] = useState('');
    const [billAmount, setBillAmount] = useState('');

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Confirmation State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: null
    });

    // Standard class list (hardcoded for selector)
    const standardClasses = ['Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12'];

    // Available programs (hardcoded)
    const availablePrograms = ['Reguler', 'Boarding'];

    // Auto-suggest target class when source changes
    useEffect(() => {
        if (sourceClass) {
            const classMap = {
                'Kelas 7': 'Kelas 8',
                'Kelas 8': 'Kelas 9',
                'Kelas 9': 'Kelas 10',
                'Kelas 10': 'Kelas 11',
                'Kelas 11': 'Kelas 12',
                'Kelas 12': 'Lulus'
            };
            setTargetClass(classMap[sourceClass] || '');
        }
    }, [sourceClass]);

    // Fetch students ONLY when source class is selected (lazy loading)
    useEffect(() => {
        if (sourceClass) {
            fetchStudentsByClass(sourceClass, program);
        } else {
            setStudents([]);
            setSelectedIds(new Set());
        }
    }, [sourceClass, program]);

    const fetchStudentsByClass = async (className, programFilter) => {
        try {
            setFetching(true);
            // Server-side filtering - much lighter!
            const params = {
                className,
                status: 'active',
                limit: 500 // Max per class should be reasonable
            };
            if (programFilter) params.program = programFilter;

            const response = await getAllStudents(params);
            const data = response.data || response;
            setStudents(data);
            // Auto-select all
            setSelectedIds(new Set(data.map(s => s.id)));
        } catch (error) {
            console.error('Failed to fetch students:', error);
            toast.error('Gagal memuat data siswa');
        } finally {
            setFetching(false);
        }
    };

    // Filtered Students (already filtered from server, just reference)
    const filteredStudents = students;

    // Stats
    const studentsWithArrears = useMemo(() => {
        return filteredStudents.filter(s => s.balance > 0 && selectedIds.has(s.id));
    }, [filteredStudents, selectedIds]);

    // Handlers
    const handleSelectAll = () => {
        if (selectedIds.size === filteredStudents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const handleToggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSubmit = () => {
        if (selectedIds.size === 0) {
            toast.error('Pilih minimal satu siswa');
            return;
        }
        if (!targetClass) {
            toast.error('Pilih kelas tujuan');
            return;
        }

        const isGraduation = targetClass.toLowerCase() === 'lulus' || targetClass.toLowerCase() === 'alumni';

        // Prepare confirmation logic
        const triggerConfirmation = () => {
            if (studentsWithArrears.length > 0) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Peringatan Tunggakan',
                    message: `PERINGATAN: Ada ${studentsWithArrears.length} siswa yang MASIH MEMILIKI TUNGGAKAN. Yakin ingin melanjutkan kenaikan kelas?`,
                    type: 'danger',
                    onConfirm: () => executePromotion(isGraduation)
                });
            } else {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Konfirmasi Kenaikan Kelas',
                    message: `Yakin ingin memproses kenaikan kelas untuk ${selectedIds.size} siswa? Data yang sudah diproses tidak bisa dikembalikan.`,
                    type: 'warning',
                    onConfirm: () => executePromotion(isGraduation)
                });
            }
        };

        triggerConfirmation();
    };

    const executePromotion = async (isGraduation) => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); // Close dialog
        setLoading(true);
        try {
            const payload = {
                studentIds: Array.from(selectedIds),
                targetClass: targetClass, // If graduation, this might be 'Alumni' or handled by backend if status is passed
                targetStatus: isGraduation ? 'graduated' : 'active',
                newLiability: createBill && billAmount > 0 ? {
                    title: billTitle,
                    amount: parseFloat(billAmount),
                    description: `Tagihan ${isGraduation ? 'Kelulusan' : 'Kenaikan Kelas'} ke ${targetClass}`
                } : null
            };

            const result = await bulkPromoteStudents(payload);

            if (result.success) {
                toast.success(isGraduation ? 'Siswa berhasil diluluskan! 🎓' : 'Kenaikan kelas berhasil! 🚀');
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Promotion error:', error);
            toast.error('Gagal memproses kenaikan kelas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Kenaikan Kelas / Kelulusan</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Promosi siswa secara massal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Sidebar Filters */}
                    <div className="w-full md:w-80 p-6 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">1. Sumber Data</h3>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block uppercase tracking-wider">Kelas Asal</label>
                                    <div className="relative">
                                        <select
                                            value={sourceClass}
                                            onChange={(e) => setSourceClass(e.target.value)}
                                            className="w-full appearance-none rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2.5 pl-4 pr-10 shadow-sm transition-all"
                                        >
                                            <option value="">-- Pilih Kelas --</option>
                                            {standardClasses.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block uppercase tracking-wider">Program (Opsional)</label>
                                    <div className="relative">
                                        <select
                                            value={program}
                                            onChange={(e) => setProgram(e.target.value)}
                                            className="w-full appearance-none rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2.5 pl-4 pr-10 shadow-sm transition-all"
                                        >
                                            <option value="">Semua Program</option>
                                            {availablePrograms.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">2. Tujuan</h3>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block uppercase tracking-wider">Kelas Tujuan / Status</label>
                                    <input
                                        type="text"
                                        list="classOptions"
                                        placeholder="Ketik 'Lulus' atau Nama Kelas Baru"
                                        value={targetClass}
                                        onChange={(e) => setTargetClass(e.target.value)}
                                        className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2.5 px-4 shadow-sm transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                    <datalist id="classOptions">
                                        <option value="Lulus" />
                                        {availableClasses.map(c => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ketik "Lulus" untuk meluluskan siswa (Alumni).
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">3. Tagihan</h3>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            name="toggle"
                                            id="billing-toggle"
                                            checked={createBill}
                                            onChange={(e) => setCreateBill(e.target.checked)}
                                            className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-blue-600"
                                            style={{ right: createBill ? '0' : 'auto' }}
                                        />
                                        <label htmlFor="billing-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${createBill ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                {createBill && (
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2 shadow-sm">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block uppercase tracking-wider">Keterangan Tagihan</label>
                                            <input
                                                type="text"
                                                value={billTitle}
                                                onChange={(e) => setBillTitle(e.target.value)}
                                                className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2.5 px-4 shadow-sm transition-all placeholder-gray-400"
                                                placeholder="Contoh: Paket LKS Semester Ganjil"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block uppercase tracking-wider">Nominal per Siswa (Rp)</label>
                                            <input
                                                type="number"
                                                value={billAmount}
                                                onChange={(e) => setBillAmount(e.target.value)}
                                                className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2.5 px-4 shadow-sm transition-all placeholder-gray-400"
                                                placeholder="0"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                                                *Nominal ini akan ditagihkan ke semua siswa yang dipilih.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Preview List */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Preview Siswa ({selectedIds.size})
                            </h3>
                            <button
                                onClick={handleSelectAll}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {selectedIds.size === filteredStudents.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            {filteredStudents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Filter className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Pilih kelas asal untuk menampilkan siswa</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                                        <tr>
                                            <th className="w-10 p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-4 py-3">Nama Siswa</th>
                                            <th className="px-4 py-3">No. Registrasi</th>
                                            <th className="px-4 py-3 text-right">Tunggakan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredStudents.map((student) => {
                                            const hasArrears = student.balance > 0;
                                            return (
                                                <tr
                                                    key={student.id}
                                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.has(student.id) ? 'bg-blue-50/30' : ''}`}
                                                    onClick={() => handleToggleSelect(student.id)}
                                                >
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(student.id)}
                                                            onChange={() => handleToggleSelect(student.id)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{student.fullName}</div>
                                                        <div className="text-xs text-gray-500">{student.className}</div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-gray-500">{student.registrationNumber}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {hasArrears ? (
                                                            <div className="flex items-center justify-end gap-1.5 text-red-600 font-medium">
                                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                                {formatCurrency(student.balance)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-0.5 rounded-full">Lunas</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Validation Footer */}
                        {studentsWithArrears.length > 0 && selectedIds.size > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/30 p-3 px-6 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-700 dark:text-red-400">Peringatan Tunggakan</p>
                                    <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                                        Terdapat {studentsWithArrears.length} siswa terpilih yang masih memiliki tunggakan.
                                        Disarankan untuk menyelesaikan administrasi sebelum kenaikan kelas.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {selectedIds.size} siswa dipilih
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedIds.size === 0 || !targetClass}
                            className="btn-primary flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Proses {targetClass === 'Lulus' ? 'Kelulusan' : 'Kenaikan Kelas'}
                        </button>
                    </div>
                </div>

            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText="Ya, Proses"
                cancelText="Batal"
            />
        </div>
    );
};

export default ClassPromotionModal;
