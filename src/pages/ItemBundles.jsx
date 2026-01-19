import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Edit2, Trash2, X, Search, Check, AlertCircle, ShoppingBag, ArrowRight, Layers, LayoutGrid, List, Copy, TrendingUp, Tag, Calculator } from 'lucide-react';
import StatsCarousel from '../components/common/StatsCarousel';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';

export default function ItemBundles() {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
    const [searchQuery, setSearchQuery] = useState('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        items: [] // [{ name: '', price: '' }]
    });

    const fetchBundles = async () => {
        setLoading(true);
        try {
            const data = await api.get('item-bundles');
            setBundles(data || []);
        } catch (error) {
            toast.error('Gagal memuat data paket barang');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBundles();
    }, []);

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            items: []
        });
        setEditingBundle(null);
    };

    const openCreateForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (bundle) => {
        setEditingBundle(bundle);
        setForm({
            name: bundle.name,
            description: bundle.description || '',
            items: bundle.items ? [...bundle.items] : []
        });
        setShowForm(true);
    };

    const handleDuplicate = (bundle) => {
        setEditingBundle(null); // Treat as new
        setForm({
            name: `${bundle.name} (Copy)`,
            description: bundle.description || '',
            items: bundle.items ? bundle.items.map(item => ({ ...item })) : []
        });
        setShowForm(true);
        toast.success('Paket diduplikasi. Silakan edit dan simpan.');
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { name: '', price: '' }] });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...form.items];
        newItems[index][field] = value;
        setForm({ ...form, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || form.items.length === 0) {
            toast.error('Nama paket dan minimal satu item wajib diisi');
            return;
        }

        const validItems = form.items.filter(i => i.name.trim());
        if (validItems.length === 0) {
            toast.error('Item tidak boleh kosong');
            return;
        }

        const payload = {
            ...form,
            items: validItems
        };

        try {
            if (editingBundle) {
                await api.put(`item-bundles/${editingBundle.id}`, payload);
                toast.success('Paket berhasil diupdate');
            } else {
                await api.post('item-bundles', payload);
                toast.success('Paket berhasil dibuat');
            }
            setShowForm(false);
            fetchBundles();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan paket');
        }
    };

    const handleDelete = (bundle) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Hapus Paket',
            message: `Yakin ingin menghapus "${bundle.name}"?`,
            confirmText: 'Hapus',
            confirmStyle: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`item-bundles/${bundle.id}`);
                    toast.success('Paket berhasil dihapus');
                    fetchBundles();
                } catch (error) {
                    toast.error('Gagal menghapus paket');
                }
                setConfirmDialog({ isOpen: false });
            },
            onCancel: () => setConfirmDialog({ isOpen: false })
        });
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const filteredBundles = bundles.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate Stats
    const stats = useMemo(() => {
        const totalBundles = bundles.length;
        const totalItems = bundles.reduce((sum, b) => sum + (b.items?.length || 0), 0);

        // Calculate values for each bundle first to find max
        const bundleValues = bundles.map(b =>
            b.totalPrice || b.items?.reduce((s, i) => s + (parseInt(i.price) || 0), 0) || 0
        );

        const totalValue = bundleValues.reduce((sum, val) => sum + val, 0);
        const maxValue = Math.max(...bundleValues, 0);
        const avgValue = totalBundles > 0 ? totalValue / totalBundles : 0;
        const avgItems = totalBundles > 0 ? totalItems / totalBundles : 0;

        return { totalBundles, totalItems, totalValue, maxValue, avgValue, avgItems };
    }, [bundles]);

    return (
        <Layout>
            {/* Stats Cards */}
            {/* Stats Cards */}
            <div className="mb-6">
                <StatsCarousel
                    stats={[
                        {
                            label: 'Total Paket',
                            value: stats.totalBundles,
                            subtitle: 'Paket barang aktif',
                            icon: Layers,
                            iconBg: 'bg-purple-50 dark:bg-purple-900/20',
                            iconColor: 'text-purple-600 dark:text-purple-400',
                            trendIcon: Layers
                        },
                        {
                            label: 'Total Item',
                            value: stats.totalItems,
                            subtitle: 'Total semua barang',
                            icon: Package,
                            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
                            iconColor: 'text-blue-600 dark:text-blue-400',
                            trendIcon: Package
                        },
                        {
                            label: 'Estimasi Nilai',
                            value: formatRupiah(stats.totalValue),
                            subtitle: 'Total valuasi paket',
                            icon: ShoppingBag,
                            iconBg: 'bg-green-50 dark:bg-green-900/20',
                            iconColor: 'text-green-600 dark:text-green-400',
                            trendIcon: TrendingUp
                        },
                        {
                            label: 'Rata-rata Nilai',
                            value: formatRupiah(stats.avgValue),
                            subtitle: 'Per paket barang',
                            icon: Calculator,
                            iconBg: 'bg-orange-50 dark:bg-orange-900/20',
                            iconColor: 'text-orange-600 dark:text-orange-400',
                            trendIcon: Calculator
                        },
                        {
                            label: 'Avg. Item/Paket',
                            value: stats.avgItems.toFixed(1),
                            subtitle: 'Rata-rata item per paket',
                            icon: List,
                            iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
                            iconColor: 'text-indigo-600 dark:text-indigo-400',
                            trendIcon: List
                        },
                        {
                            label: 'Paket Termahal',
                            value: formatRupiah(stats.maxValue),
                            subtitle: 'Nilai paket tertinggi',
                            icon: Tag,
                            iconBg: 'bg-pink-50 dark:bg-pink-900/20',
                            iconColor: 'text-pink-600 dark:text-pink-400',
                            trendIcon: Tag
                        }
                    ]}
                />
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Cari nama paket..."
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Buat Paket Baru</span>
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 h-64 rounded-xl border border-gray-200 dark:border-gray-700"></div>
                    ))}
                </div>
            ) : filteredBundles.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Belum ada paket barang</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Buat paket pertama Anda untuk memulai.</p>
                    <button
                        onClick={openCreateForm}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 mx-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Buat Paket Baru
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBundles.map(bundle => (
                        <div key={bundle.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-bl-full -mr-6 -mt-6 pointer-events-none transition-transform group-hover:scale-110 duration-500"></div>

                            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-start relative z-10">
                                <div className="pr-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{bundle.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{bundle.description || 'Tidak ada deskripsi'}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                                    <Package size={20} />
                                </div>
                            </div>

                            <div className="p-6 flex-1 bg-gray-50/30 dark:bg-gray-800/30">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <List size={12} /> Item Preview
                                </div>
                                <div className="space-y-2">
                                    {bundle.items.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 truncate">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                                                <span className="truncate font-medium">{item.name}</span>
                                            </div>
                                            {item.price && (
                                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                    {formatRupiah(item.price)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {bundle.items.length > 3 && (
                                        <div className="text-xs text-center text-blue-600 dark:text-blue-400 mt-2 font-medium italic">
                                            +{bundle.items.length - 3} item lainnya
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between relative z-10">
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Nilai</div>
                                    <div className="font-bold text-lg text-gray-900 dark:text-white text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                                        {formatRupiah(bundle.totalPrice || bundle.items.reduce((s, i) => s + (parseInt(i.price) || 0), 0))}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleDuplicate(bundle)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        title="Copy"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => openEditForm(bundle)}
                                        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(bundle)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingBundle ? 'Edit Paket Barang' : 'Buat Paket Baru'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nama Paket <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="Contoh: Paket LKS Kelas 7"
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                                placeholder="Keterangan tambahan..."
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Daftar Item</label>
                            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                <Plus size={16} /> Tambah Item
                            </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {form.items.map((item, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={e => updateItem(i, 'name', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Nama Barang"
                                            required
                                        />
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={e => updateItem(i, 'price', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm md:text-right rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Harga"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-gray-400 hover:text-red-500 mt-0.5">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {form.items.length === 0 && (
                                <div className="text-center py-4 text-gray-400 italic text-sm bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    Belum ada item. Klik "Tambah Item" untuk memulai.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium">
                            Batal
                        </button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={confirmDialog.isOpen} {...confirmDialog} />
        </Layout>
    );
}
