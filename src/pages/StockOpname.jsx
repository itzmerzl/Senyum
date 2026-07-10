import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Package, Plus, Search, Save, ArrowLeft, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../utils/apiClient';
import ConfirmDialog from '../components/common/ConfirmDialog';

const StockOpname = () => {
    const [view, setView] = useState('list');
    const [opnames, setOpnames] = useState([]);
    const [currentOpname, setCurrentOpname] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        if (view === 'list') {
            loadOpnames();
        }
    }, [view]);

    const loadOpnames = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get('stock-opname');
            setOpnames(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setOpnames([]);
        } finally {
            setLoading(false);
        }
    };

    const createOpname = async () => {
        try {
            const newOpname = await apiClient.post('stock-opname', { notes: '', createdById: 1 });
            toast.success('Sesi dimulai');
            openDetail(newOpname.id);
        } catch (error) {
            toast.error('Gagal: ' + error.message);
        }
    };

    const openDetail = async (id) => {
        try {
            setLoading(true);
            const data = await apiClient.get(`stock-opname/${id}`);
            setCurrentOpname(data);
            setItems(Array.isArray(data.items) ? data.items : []);
            setView('detail');
        } catch (error) {
            toast.error('Gagal memuat detail');
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (id, actualStock) => {
        setItems(items.map(item =>
            item.id === id
                ? { ...item, actualStock: parseInt(actualStock) || 0, difference: (parseInt(actualStock) || 0) - item.systemStock }
                : item
        ));
    };

    const saveDraft = async () => {
        try {
            await apiClient.put(`stock-opname/${currentOpname.id}/items`, { items });
            toast.success('Draft tersimpan');
        } catch (error) {
            toast.error('Gagal menyimpan');
        }
    };

    const handleFinalizeClick = () => {
        const varianceCount = items.filter(i => i.difference !== 0 && i.actualStock !== null).length;
        setConfirmDialog({
            isOpen: true,
            title: 'Finalisasi Stock Opname',
            message: `Finalisasi akan menyesuaikan stok produk sesuai perhitungan sistem. ${varianceCount} produk memiliki selisih. Lanjutkan?`,
            type: 'warning',
            onConfirm: finalizeOpname
        });
    };

    const finalizeOpname = async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
            await apiClient.post(`stock-opname/${currentOpname.id}/finalize`);
            toast.success('Selesai! Stok diperbarui.');
            setView('list');
        } catch (error) {
            toast.error('Gagal: ' + error.message);
        }
    };

    const filteredItems = items.filter(item =>
        item.product && (
            item.product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Package className="text-blue-600" />
                            Stock Opname
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Audit stok fisik</p>
                    </div>
                    {view === 'list' && (
                        <button onClick={createOpname} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                            <Plus size={20} /> Mulai Opname
                        </button>
                    )}
                </div>

                {view === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {opnames.length === 0 ? (
                            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-lg">
                                    {loading ? 'Memuat...' : 'Belum ada riwayat stock opname'}
                                </p>
                                <p className="text-gray-400 text-sm mt-2">Klik "Mulai Opname" untuk memulai</p>
                            </div>
                        ) : (
                            opnames.map(op => (
                                <div key={op.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{op.code}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(op.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${op.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                op.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-800'
                                                }`}>
                                                {op.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Dibuat oleh:</span>
                                                <span className="font-medium">{op.creator?.fullName || 'Admin'}</span>
                                            </div>
                                            {op.notes && (
                                                <div className="text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Catatan:</span>
                                                    <p className="text-gray-900 dark:text-white mt-1">{op.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => openDetail(op.id)}
                                            className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-medium"
                                        >
                                            <Eye size={18} />
                                            Lihat Detail
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-full">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold">{currentOpname?.code}</h2>
                                    <span className={`text-xs px-2 py-0.5 rounded ${currentOpname?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {currentOpname?.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {currentOpname?.status === 'PENDING' && (
                                    <>
                                        <button onClick={saveDraft} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 flex items-center gap-2">
                                            <Save size={18} /> Simpan
                                        </button>
                                        <button onClick={handleFinalizeClick} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                            <Package size={18} /> Selesai
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600">Total Produk</p>
                                <p className="text-2xl font-bold">{items.length}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Sudah Diisi</p>
                                <p className="text-2xl font-bold">{items.filter(i => i.actualStock !== null).length}</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                                <p className="text-sm text-orange-600">Selisih</p>
                                <p className="text-2xl font-bold">{items.filter(i => i.difference !== 0 && i.actualStock !== null).length}</p>
                            </div>
                        </div>

                        <div className="mb-4 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3 font-medium">Produk</th>
                                        <th className="p-3 font-medium text-center">Stok Sistem</th>
                                        <th className="p-3 font-medium text-center w-32">Stok Fisik</th>
                                        <th className="p-3 font-medium text-center">Selisih</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                {searchTerm ? 'Produk tidak ditemukan' : 'Tidak ada produk'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map(item => (
                                            <tr key={item.id} className="border-b hover:bg-gray-50 dark:bg-gray-700">
                                                <td className="p-3">
                                                    <p className="font-medium">{item.product?.name || '-'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.product?.sku || '-'}</p>
                                                </td>
                                                <td className="p-3 text-center">{item.systemStock}</td>
                                                <td className="p-3 text-center">
                                                    {currentOpname?.status === 'PENDING' ? (
                                                        <input
                                                            type="number"
                                                            className={`w-full p-1 border rounded text-center focus:outline-blue-500 ${item.actualStock !== null && item.actualStock !== item.systemStock ? 'bg-yellow-50 border-yellow-300' : ''
                                                                }`}
                                                            placeholder="0"
                                                            value={item.actualStock === null ? '' : item.actualStock}
                                                            onChange={(e) => updateItem(item.id, e.target.value)}
                                                        />
                                                    ) : (
                                                        <span className="font-bold">{item.actualStock ?? '-'}</span>
                                                    )}
                                                </td>
                                                <td className={`p-3 text-center font-bold ${item.difference < 0 ? 'text-red-500' : item.difference > 0 ? 'text-green-500' : 'text-gray-400'
                                                    }`}>
                                                    {item.difference > 0 ? `+${item.difference}` : item.difference || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type || 'warning'}
                confirmText="Ya, Lanjutkan"
                cancelText="Batal"
            />
        </Layout>
    );
};

export default StockOpname;
