
import React, { useState, useEffect } from 'react';
import { Users, X, Filter, Check } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';

const BatchLiabilityModal = ({ isOpen, onClose, onSuccess, students = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        amount: '',
        dueDate: '',
        filters: {
            className: 'all',
            program: 'all'
        }
    });
    const [loading, setLoading] = useState(false);
    const [previewCount, setPreviewCount] = useState(0);

    // Extract unique classes and programs from students prop
    const classes = ['all', ...new Set(students.map(s => s.className).filter(Boolean))].sort();
    const programs = ['all', ...new Set(students.map(s => s.program).filter(Boolean))].sort();

    useEffect(() => {
        // Calculate preview count
        if (!students.length) return;

        const count = students.filter(s => {
            const matchClass = formData.filters.className === 'all' || s.className === formData.filters.className;
            const matchProgram = formData.filters.program === 'all' || s.program === formData.filters.program;
            return matchClass && matchProgram;
        }).length;

        setPreviewCount(count);
    }, [formData.filters, students]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (previewCount === 0) {
                toast.error('Tidak ada santri yang sesuai kriteria');
                return;
            }

            if (!formData.title || !formData.amount) {
                toast.error('Judul dan Nominal harus diisi');
                return;
            }

            const response = await api.post('liabilities/batch', {
                ...formData,
                amount: parseFloat(formData.amount)
            });

            toast.success(`Berhasil membuat ${response.count} tagihan batch!`);
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                title: '',
                description: '',
                amount: '',
                dueDate: '',
                filters: { className: 'all', program: 'all' }
            });

        } catch (error) {
            console.error('Batch error:', error);
            toast.error(error.response?.data?.error || 'Gagal membuat tagihan batch');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Buat Tagihan Massal</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Filters Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Penerima
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.filters.className}
                                onChange={e => setFormData({ ...formData, filters: { ...formData.filters, className: e.target.value } })}
                            >
                                <option value="all">Semua Kelas</option>
                                {classes.filter(c => c !== 'all').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.filters.program}
                                onChange={e => setFormData({ ...formData, filters: { ...formData.filters, program: e.target.value } })}
                            >
                                <option value="all">Semua Program</option>
                                {programs.filter(p => p !== 'all').map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <p className="mt-1 text-xs text-blue-600 font-medium">
                            Akan diterbitkan untuk: {previewCount} Santri
                        </p>
                    </div>

                    {/* Liability Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Tagihan
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: LKS Semester 1, SPP Januari"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keterangan (Opsional)
                        </label>
                        <textarea
                            rows="2"
                            placeholder="Detail tambahan..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nominal (Rp)
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jatuh Tempo
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || previewCount === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memproses...' : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Terbitkan Tagihan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BatchLiabilityModal;
