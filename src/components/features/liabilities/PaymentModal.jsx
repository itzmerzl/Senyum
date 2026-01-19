import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { processLiabilityPayment, getLiabilityPayments, cancelPayment } from '../../../services/liabilityService';
import { getAllPaymentMethods } from '../../../services/paymentMethodService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { X, Save, AlertCircle, Receipt, History, Trash2 } from 'lucide-react';
import Spinner from '../../common/Spinner';
import ConfirmDialog from '../../common/ConfirmDialog';

export default function PaymentModal({
    liability,
    onSuccess,
    onCancel
}) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            amount: '',
            paymentMethod: 'cash',
            message: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [cancelingId, setCancelingId] = useState(null); // Track which payment is being canceled
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, paymentId: null, amount: 0 });

    useEffect(() => {
        if (liability) {
            loadPaymentMethods();
            loadHistory();
            // Default amount to remaining amount
            setValue('amount', liability.remainingAmount);
        }
    }, [liability]);

    const loadPaymentMethods = async () => {
        try {
            const methods = await getAllPaymentMethods(true);
            setPaymentMethods(methods);
        } catch (error) {
            console.error('Failed to load payment methods', error);
        }
    };

    const loadHistory = async () => {
        if (!liability) return;
        try {
            setLoadingHistory(true);
            const data = await getLiabilityPayments(liability.id);
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handlePayment = async (data) => {
        try {
            setLoading(true);
            await processLiabilityPayment({
                liabilityId: liability.id,
                amount: parseInt(data.amount),
                paymentMethod: data.paymentMethod,
                notes: data.notes
            });

            toast.success('Pembayaran berhasil diproses');
            onSuccess();
        } catch (error) {
            toast.error(error.message || 'Gagal memproses pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const openCancelConfirm = (payment) => {
        setConfirmDialog({
            isOpen: true,
            paymentId: payment.id,
            amount: payment.amount
        });
    };

    const handleCancelPayment = async () => {
        const paymentId = confirmDialog.paymentId;
        setConfirmDialog({ isOpen: false, paymentId: null, amount: 0 });

        try {
            setCancelingId(paymentId);
            await cancelPayment(paymentId);
            toast.success('Pembayaran berhasil dibatalkan');
            loadHistory(); // Refresh history
            onSuccess(); // Refresh parent data
        } catch (error) {
            toast.error(error.message || 'Gagal membatalkan pembayaran');
        } finally {
            setCancelingId(null);
        }
    };

    if (!liability) return null;

    return (
        <>
            <div className="space-y-6">
                {/* Header Info Card */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-semibold text-blue-900">{liability.title}</h3>
                            <p className="text-sm text-blue-700">{liability.student.fullName}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${liability.status === 'paid' ? 'bg-green-100 text-green-700' :
                            liability.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {liability.status === 'paid' ? 'LUNAS' :
                                liability.status === 'partial' ? 'CICILAN' : 'BELUM BAYAR'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs uppercase">Total Tagihan</p>
                            <p className="font-semibold text-gray-800">{formatCurrency(liability.totalAmount)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase">Sudah Bayar</p>
                            <p className="font-semibold text-green-600">{formatCurrency(liability.paidAmount)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase">Sisa Tagihan</p>
                            <p className="font-semibold text-red-600">{formatCurrency(liability.remainingAmount)}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs / Toggle History */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!showHistory ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setShowHistory(false)}
                    >
                        Form Pembayaran
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${showHistory ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setShowHistory(true)}
                    >
                        Riwayat Pembayaran
                    </button>
                </div>

                {showHistory ? (
                    // HISTORY VIEW
                    <div className="max-h-60 overflow-y-auto">
                        {loadingHistory ? (
                            <div className="flex justify-center py-8">
                                <Spinner size="md" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <History size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Belum ada riwayat pembayaran</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((payment) => (
                                    <div key={payment.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                                            <span className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {payment.paymentMethod.toUpperCase()}
                                            </span>
                                            <span className="text-gray-500">{payment.receiptNumber}</span>
                                        </div>
                                        {payment.notes && (
                                            <p className="text-xs text-gray-500 mt-1 italic">"{payment.notes}"</p>
                                        )}
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <button
                                                onClick={() => openCancelConfirm(payment)}
                                                disabled={cancelingId === payment.id}
                                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                                            >
                                                {cancelingId === payment.id ? (
                                                    <Spinner size="xs" />
                                                ) : (
                                                    <Trash2 size={12} />
                                                )}
                                                Batalkan Pembayaran
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // PAYMENT FORM VIEW
                    <form onSubmit={handleSubmit(handlePayment)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nominal Pembayaran
                            </label>
                            <input
                                type="number"
                                {...register('amount', {
                                    required: 'Nominal wajib diisi',
                                    min: { value: 1, message: 'Minimal Rp 1' },
                                    max: { value: liability.remainingAmount, message: 'Melebihi sisa tagihan' }
                                })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.amount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.amount && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.amount.message}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Maksimal: {formatCurrency(liability.remainingAmount)}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Metode Pembayaran
                            </label>
                            <select
                                {...register('paymentMethod', { required: true })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="cash">Tunai (Cash)</option>
                                {paymentMethods.filter(m => m.code !== 'cash').map(method => (
                                    <option key={method.id} value={method.code}>
                                        {method.name} ({method.type === 'bank' ? 'Transfer' : 'QRIS'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catatan (Opsional)
                            </label>
                            <textarea
                                rows={2}
                                {...register('notes')}
                                placeholder="Berita acara pembayaran..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            ></textarea>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                disabled={loading}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? <Spinner size="sm" color="white" /> : <Receipt size={18} />}
                                Proses Pembayaran
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Cancel Payment Confirmation */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Batalkan Pembayaran?"
                message={`Yakin batalkan pembayaran sebesar ${formatCurrency(confirmDialog.amount)}? Saldo akan dikembalikan ke tagihan.`}
                confirmText="Ya, Batalkan"
                confirmStyle="danger"
                onConfirm={handleCancelPayment}
                onClose={() => setConfirmDialog({ isOpen: false, paymentId: null, amount: 0 })}
            />
        </>
    );
}
