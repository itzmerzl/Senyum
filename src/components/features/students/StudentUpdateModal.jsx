import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import Modal from '../../common/Modal';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function StudentUpdateModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
            toast.error('File harus berformat Excel (.xlsx atau .xls)');
            return;
        }

        setFile(selectedFile);
        parseExcel(selectedFile);
    };

    const parseExcel = (file) => {
        setUploading(true);
        setValidationErrors([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    toast.error('File Excel kosong');
                    setUploading(false);
                    return;
                }

                // Validate and transform data
                const errors = [];
                const transformedData = jsonData.map((row, index) => {
                    const rowNum = index + 2; // Excel row number (1 = header)

                    // Required: ID or No. Registrasi for matching
                    if (!row['ID'] && !row['No. Registrasi']) {
                        errors.push(`Baris ${rowNum}: ID atau No. Registrasi wajib ada untuk update`);
                        return null;
                    }

                    const update = {
                        id: row['ID'],
                        registrationNumber: row['No. Registrasi'],
                        fullName: row['Nama Lengkap'],
                        className: row['Kelas'],
                        program: row['Program'],
                        status: row['Status'],
                        guardianName: row['Nama Wali'],
                        guardianPhone: row['Telp Wali'],
                        address: row['Alamat'],
                        scholarshipPercent: row['Beasiswa %'] || 0,
                        enrollmentDate: row['Tanggal Masuk']
                    };

                    // Remove undefined/null fields
                    Object.keys(update).forEach(key => {
                        if (update[key] === undefined || update[key] === null || update[key] === '') {
                            delete update[key];
                        }
                    });

                    // Validate status if present
                    if (update.status) {
                        const validStatuses = ['Aktif', 'Lulus', 'Tidak Aktif'];
                        if (!validStatuses.includes(update.status)) {
                            errors.push(`Baris ${rowNum}: Status harus salah satu dari: ${validStatuses.join(', ')}`);
                        } else {
                            // Convert to English for DB
                            update.status = update.status === 'Aktif' ? 'active' : update.status === 'Lulus' ? 'graduated' : 'inactive';
                        }
                    }

                    return update;
                }).filter(Boolean);

                setValidationErrors(errors);
                setPreviewData(transformedData);
                setUploading(false);

                if (errors.length > 0) {
                    toast.error(`Ditemukan ${errors.length} error validasi`);
                } else {
                    toast.success(`${transformedData.length} data siap diupdate`);
                }
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('Gagal membaca file Excel');
                setUploading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleSubmit = async () => {
        if (validationErrors.length > 0) {
            toast.error('Perbaiki error validasi terlebih dahulu');
            return;
        }

        if (previewData.length === 0) {
            toast.error('Tidak ada data untuk diupdate');
            return;
        }

        onSuccess(previewData);
    };

    const downloadTemplate = () => {
        const template = [
            {
                'ID': '', // Optional: for direct ID match
                'No. Registrasi': 'REG-2024-0001', // Required if no ID
                'Nama Lengkap': 'Ahmad Fauzi', // Optional
                'Kelas': 'Kelas 10', // Optional
                'Program': 'Boarding', // Optional
                'Status': 'Aktif', // Optional: Aktif / Lulus / Tidak Aktif
                'Nama Wali': 'Bapak Ahmad', // Optional
                'Telp Wali': '081234567890', // Optional
                'Alamat': 'Jl. Example No. 123', // Optional
                'Beasiswa %': 0, // Optional
                'Tanggal Masuk': '2024-01-01' // Optional
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Update');

        // Set column widths
        ws['!cols'] = [
            { wch: 10 },
            { wch: 20 },
            { wch: 25 },
            { wch: 12 },
            { wch: 12 },
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 30 },
            { wch: 12 },
            { wch: 15 }
        ];

        XLSX.writeFile(wb, 'Template_Update_Santri.xlsx');
        toast.success('Template berhasil didownload');
    };

    const resetForm = () => {
        setFile(null);
        setPreviewData([]);
        setValidationErrors([]);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                resetForm();
            }}
            title="Update Massal Data Santri"
            size="lg"
        >
            <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Cara Menggunakan
                    </h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                        <li>Download template Excel atau gunakan file export data santri</li>
                        <li>Isi/Edit kolom yang ingin diupdate (ID atau No. Registrasi wajib ada)</li>
                        <li>Kolom yang dikosongkan tidak akan diupdate</li>
                        <li>Upload file Excel yang sudah diisi</li>
                        <li>Review preview data sebelum menyimpan</li>
                    </ol>
                </div>

                {/* Download Template */}
                <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                    <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Download Template Excel</span>
                </button>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="bulk-update-file"
                    />
                    <label
                        htmlFor="bulk-update-file"
                        className="cursor-pointer flex flex-col items-center gap-3"
                    >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                {file ? file.name : 'Pilih File Excel'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Format: .xlsx atau .xls
                            </p>
                        </div>
                    </label>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Error Validasi ({validationErrors.length})
                        </h4>
                        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                            {validationErrors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Preview Data */}
                {previewData.length > 0 && validationErrors.length === 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Preview Data ({previewData.length} baris)
                        </h4>
                        <div className="max-h-60 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-green-100 dark:bg-green-900/30 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-1 text-left text-green-900 dark:text-green-300">No</th>
                                        <th className="px-2 py-1 text-left text-green-900 dark:text-green-300">ID/Reg</th>
                                        <th className="px-2 py-1 text-left text-green-900 dark:text-green-300">Fields to Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((item, idx) => (
                                        <tr key={idx} className="border-t border-green-200 dark:border-green-800">
                                            <td className="px-2 py-1 text-green-800 dark:text-green-200">{idx + 1}</td>
                                            <td className="px-2 py-1 text-green-800 dark:text-green-200 font-mono text-xs">
                                                {item.id || item.registrationNumber}
                                            </td>
                                            <td className="px-2 py-1 text-green-800 dark:text-green-200 text-xs">
                                                {Object.keys(item).filter(k => k !== 'id' && k !== 'registrationNumber').join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => {
                            onClose();
                            resetForm();
                        }}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={previewData.length === 0 || validationErrors.length > 0 || uploading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Update {previewData.length} Data
                    </button>
                </div>
            </div>
        </Modal>
    );
}
