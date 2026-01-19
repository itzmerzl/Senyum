import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getAllStudents } from '../../../services/studentService';
import { createLiability } from '../../../services/liabilityService';
import toast from 'react-hot-toast';
import { X, Save, AlertCircle } from 'lucide-react';
import Spinner from '../../common/Spinner';

export default function LiabilityForm({
    onSubmit,
    onCancel,
    loading: parentLoading = false
}) {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const response = await getAllStudents({ status: 'active' });
            // Handle paginated response format
            const data = response.data || response;
            setStudents(data);
        } catch (error) {
            toast.error('Gagal memuat data santri');
            console.error(error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            await onSubmit({
                ...data,
                studentId: parseInt(data.studentId),
                totalAmount: parseInt(data.totalAmount),
                dueDate: new Date(data.dueDate)
            });
        } catch (error) {
            // Error handled by parent
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Student Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Santri
                </label>
                {loadingStudents ? (
                    <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                ) : (
                    <select
                        {...register('studentId', { required: 'Santri harus dipilih' })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.studentId ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">-- Pilih Santri --</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.registrationNumber} - {student.fullName} ({student.className})
                            </option>
                        ))}
                    </select>
                )}
                {errors.studentId && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.studentId.message}
                    </p>
                )}
            </div>

            {/* Liability Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Tagihan
                </label>
                <input
                    type="text"
                    placeholder="Contoh: Seragam Putih Abu, Kitab Fiqih"
                    {...register('title', { required: 'Nama tagihan wajib diisi' })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                />
                {errors.title && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.title.message}
                    </p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan (Opsional)
                </label>
                <textarea
                    rows={2}
                    placeholder="Detail tambahan..."
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        {...register('totalAmount', {
                            required: 'Nominal wajib diisi',
                            min: { value: 1, message: 'Nominal harus lebih dari 0' }
                        })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.totalAmount && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.totalAmount.message}
                        </p>
                    )}
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jatuh Tempo
                    </label>
                    <input
                        type="date"
                        {...register('dueDate', { required: 'Tanggal jatuh tempo wajib diisi' })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.dueDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.dueDate && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.dueDate.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    disabled={parentLoading}
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={parentLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {parentLoading ? <Spinner size="sm" color="white" /> : <Save size={18} />}
                    Simpan Tagihan
                </button>
            </div>
        </form>
    );
}
