import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Modal from '../../common/Modal';
import { importProducts } from '../../../services/productService';
import toast from 'react-hot-toast';

export default function ProductImportModal({ isOpen, onClose, onSuccess }) {
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

                // Basic Validation
                if (jsonData.length === 0) {
                    toast.error('File kosong!');
                    setFile(null);
                    return;
                }

                // Map column headers to object keys if needed
                // Assuming user matches template or we map Indonesian headers
                const mappedData = jsonData.map(row => {
                    const cleanString = (val) => val ? String(val).replace(/^"|"$/g, '').trim() : '';

                    return {
                        name: cleanString(row['Nama Produk'] || row['name']),
                        sku: cleanString(row['SKU'] || row['sku']),
                        barcode: cleanString(row['Barcode'] || row['barcode']),
                        categoryName: row['Kategori'] || row['categoryName'],
                        supplierName: row['Supplier'] || row['supplierName'],
                        unitName: row['Satuan'] || row['unitName'],
                        purchasePrice: row['Harga Beli'] || row['purchasePrice'] || 0,
                        sellingPrice: row['Harga Jual'] || row['sellingPrice'] || 0,
                        stock: row['Stok'] || row['stock'] || 0,
                        minStock: row['Stok Minimum'] || row['minStock'] || 0,
                        description: cleanString(row['Deskripsi'] || row['description']),
                        tags: row['Tags'] || row['tags'] || ''
                    };
                });

                // Filter out empty rows (where name is missing)
                const validData = mappedData.filter(item => item.name);
                setData(validData);
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('Gagal membaca file Excel');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                'Nama Produk': 'Contoh Produk A',
                'SKU': '', // Optional, auto-generated if empty
                'Barcode': '8991234567890',
                'Kategori': 'Makanan',
                'Supplier': 'Toko A',
                'Satuan': 'Pcs',
                'Harga Beli': 5000,
                'Harga Jual': 7000,
                'Stok': 100,
                'Stok Minimum': 10,
                'Tags': 'Populer, Diskon'
            },
            {
                'Nama Produk': 'Contoh Produk B',
                'SKU': '',
                'Barcode': '',
                'Kategori': 'Minuman',
                'Supplier': 'Agen B',
                'Satuan': 'Botol',
                'Harga Beli': 3000,
                'Harga Jual': 5000,
                'Stok': 50,
                'Stok Minimum': 5,
                'Tags': 'Baru'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Import');

        // Manual Download to ensure filename and extension
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        // Use standard Excel MIME type
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'template-import-produk.xlsx');
    };

    const handleImport = async () => {
        if (data.length === 0) return;

        try {
            setLoading(true);
            const res = await importProducts(data);
            setResult(res);

            if (res.results.failed === 0) {
                toast.success(`Berhasil import ${res.results.success} produk!`);
            } else {
                toast.success(`Import selesai. Sukses: ${res.results.success}, Gagal: ${res.results.failed}`);
            }

            // Don't close immediately, show result first
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Gagal melakukan import');
            setResult({ message: 'Terjadi kesalahan sistem' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Produk dari Excel"
            size="lg"
        >
            <div className="space-y-6">

                {/* Step 1: Download Template */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start justify-between">
                    <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">1. Download Template</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Gunakan template ini untuk memastikan format data benar.
                            <br />
                            <span className="font-semibold">Fitur Smart Import:</span> Kategori/Supplier/Unit yang belum ada akan otomatis dibuatkan.
                        </p>
                    </div>
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>

                {/* Step 2: Upload File */}
                <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">2. Upload File Excel</h4>
                    {!result ? (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <FileSpreadsheet className="w-12 h-12 text-green-600 mb-3" />
                                {file ? (
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                        <p className="text-sm text-gray-500">{data.length} baris data ditemukan</p>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                resetState();
                                            }}
                                            className="text-red-500 text-sm mt-2 hover:underline"
                                        >
                                            Hapus / Ganti File
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium text-gray-700 dark:text-gray-300">Klik untuk upload file Excel</p>
                                        <p className="text-xs text-gray-500 mt-1">Format: .xlsx atau .xls</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    ) : (
                        // Result View
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {result.results?.failed === 0 ? (
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-8 h-8 text-orange-500" />
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {result.message}
                                    </h3>
                                </div>
                            </div>

                            {/* Error List */}
                            {result.results?.errors?.length > 0 && (
                                <div className="mt-4 max-h-40 overflow-y-auto">
                                    <p className="text-sm font-medium text-red-600 mb-2">Gagal pada item berikut:</p>
                                    <ul className="list-disc list-inside text-sm text-red-500">
                                        {result.results.errors.map((err, idx) => (
                                            <li key={idx}>
                                                <span className="font-medium">{err.name}</span>: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        disabled={loading}
                    >
                        {result ? 'Tutup' : 'Batal'}
                    </button>

                    {!result && (
                        <button
                            onClick={handleImport}
                            disabled={!file || data.length === 0 || loading}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Mulai Import
                                </>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </Modal>
    );
}
