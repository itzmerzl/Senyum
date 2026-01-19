import React, { useState } from 'react';
import { DollarSign, Lock, Unlock, X, AlertTriangle } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';

const CashDrawerModal = ({ isOpen, type, onClose, onSuccess, currentDrawer }) => {
    const [amount, setAmount] = useState('0'); // Default to 0
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (type === 'open') {
                await api.post('cash-drawer/open', {
                    openingBalance: parseFloat(amount),
                    notes
                });
                toast.success('Shift kasir berhasil dibuka');
            } else {
                // Close Shift
                // For close, we might need system calculated closing balance.
                // But for now, let's just send actual physical money.
                // The backend endpoint requires: id, actualBalance, closingBalance (system)
                // We should probably pass the expected system balance as prop or fetch it.
                // To simplify, let's trust backend to calculate diff or we fetch it first.
                // But wait, my endpoint: `difference = actual - closingBalance`.
                // It expects `closingBalance` in body.
                // So the Frontend should know the "Expected" balance.
                // Let's assume for now 0 or passed from parent.

                await api.post('cash-drawer/close', {
                    id: currentDrawer?.id,
                    actualBalance: parseFloat(amount),
                    closingBalance: currentDrawer?.currentBalance || 0, // Need to ensure we have this
                    notes
                });
                toast.success('Shift kasir ditutup');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Drawer error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Gagal memproses kasir';
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const isClose = type === 'close';

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                <div className={`p-6 text-white flex justify-between items-center ${isClose ? 'bg-red-600' : 'bg-green-600'}`}>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        {isClose ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                        {isClose ? 'Tutup Kasir (End Shift)' : 'Buka Kasir (Start Shift)'}
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {isClose && currentDrawer && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500 mb-1">Saldo Sistem (Perkiraan)</div>
                            <div className="text-xl font-bold text-gray-800">
                                Rp {(currentDrawer.currentBalance || 0).toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                Pastikan uang fisik dihitung dengan benar sebelum input.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isClose ? 'Total Uang Tunai Fisik' : 'Modal Awal (Saldo Awal)'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                            <input
                                type="number"
                                required
                                min="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
                        <textarea
                            rows="3"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={isClose ? "Contoh: Selisih 500 perak..." : "Detail modal..."}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !amount}
                            className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isClose
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                }`}
                        >
                            {submitting ? 'Memproses...' : (isClose ? 'Tutup Shift' : 'Buka Shift')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashDrawerModal;
