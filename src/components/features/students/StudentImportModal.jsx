import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../../common/Modal';
import { bulkCreateStudents } from '../../../services/studentService';
import toast from 'react-hot-toast';

export default function StudentImportModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const resetState = () => {
        setFile(null);
        setData([]);
        setLoading(false);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            readExcel(selectedFile);
        }
    };

    const readExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (jsonData.length === 0) {
                    toast.error('File kosong!');
                    setFile(null);
                    return;
                }

                const mappedData = jsonData.map((row, index) => {
                    const cleanString = (val) => val ? String(val).replace(/^"|"$/g, '').trim() : '';

                    return {
                        fullName: cleanString(row['Nama Lengkap'] || row['fullName'] || row['Nama'] || row['nama']),
                        className: cleanString(row['Kelas'] || row['className'] || row['class']),
                        program: cleanString(row['Program'] || row['program']),
                        guardianName: cleanString(row['Nama Wali'] || row['guardianName']),
                        guardianPhone: cleanString(row['No. HP Wali'] || row['guardianPhone'] || row['phone']),
                        address: cleanString(row['Alamat'] || row['address']),
                        // Normalize Gender
                        gender: (() => {
                            const val = cleanString(row['Jenis Kelamin'] || row['gender'] || row['jk'] || row['sex']).toLowerCase();
                            if (val === 'laki-laki' || val === 'laki' || val === 'l' || val === 'pria' || val === 'male') return 'L';
                            if (val === 'perempuan' || val === 'wanita' || val === 'p' || val === 'female') return 'P';
                            return 'L'; // Default to Laki-laki
                        })(),
                        // Optional fields if provided, otherwise backend handles defaults
                        registrationNumber: cleanString(row['No. Registrasi'] || row['registrationNumber'])
                    };
                });

                // Validate required fields
                const validData = mappedData.filter(item => item.fullName && item.className);

                if (validData.length === 0) {
                    toast.error('Tidak ada data yang valid (Wajib: Nama Lengkap, Kelas)');
                    setFile(null);
                    return;
                }

                setData(validData);
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('Gagal membaca file Excel');
                setFile(null);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        setLoading(true);

        try {
            // Use bulk import endpoint - much faster!
            const response = await bulkCreateStudents(data);

            const successCount = response.results?.success?.length || 0;
            const failCount = response.results?.failed?.length || 0;

            setResult({ success: successCount, failed: failCount });

            if (successCount > 0) {
                toast.success(`${successCount} santri berhasil diimpor`);
                onSuccess();
            }

            if (failCount > 0) {
                toast.error(`${failCount} gagal diimpor`);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Terjadi kesalahan saat impor');
            setResult({ success: 0, failed: data.length });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                'Nama Lengkap': 'Ahmad Santri',
                'Jenis Kelamin': 'Laki-laki',
                'Kelas': 'Kelas 7',
                'Program': 'Reguler',
                'Nama Wali': 'Bapak Ahmad',
                'No. HP Wali': '081234567890',
                'Alamat': 'Jl. Contoh No. 123'
            },
            {
                'Nama Lengkap': 'Siti Santriwati',
                'Jenis Kelamin': 'Perempuan',
                'Kelas': 'Kelas 10',
                'Program': 'Boarding',
                'Nama Wali': 'Ibu Siti',
                'No. HP Wali': '081234567891',
                'Alamat': 'Jl. Contoh No. 124'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Santri");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "template_import_santri.xlsx");
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Data Santri"
            size="md"
        >
            <div className="space-y-6">
                {!result ? (
                    <>
                        {/* Upload Area */}
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />

                            {file ? (
                                <div className="space-y-4">
                                    <FileSpreadsheet className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <button
                                        onClick={resetState}
                                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                    >
                                        Ganti File
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="file-upload" className="cursor-pointer space-y-4 block">
                                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Klik untuk upload file Excel</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">atau drag & drop file di sini</p>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Format: .xlsx, .xls</p>
                                </label>
                            )}
                        </div>

                        {/* Template Download */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-500" />
                                <div className="text-sm">
                                    <p className="font-medium text-gray-900 dark:text-white">Belum punya formatnya?</p>
                                    <p className="text-gray-500 dark:text-gray-400">Download template Excel untuk import</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadTemplate}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <Download size={14} />
                                Template
                            </button>
                        </div>

                        {data.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Data terdeteksi:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{data.length} santri</span>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <p>Pastikan format kolom sesuai dengan template agar data masuk dengan benar.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || loading || data.length === 0}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Mengimport...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Mulai Import
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Import Selesai!</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Berhasil mengimpor <span className="font-bold text-green-600 dark:text-green-400">{result.success}</span> data.
                            </p>
                            {result.failed > 0 && (
                                <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                                    {result.failed} data gagal diimpor. Sebagian besar karena data tidak lengkap.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
