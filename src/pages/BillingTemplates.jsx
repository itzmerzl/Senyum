import { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Edit2, Trash2, Users, GraduationCap, RefreshCw, X, Check, Settings, Filter, Search, Copy, Package, Download, LayoutList, LayoutGrid, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, CircleDollarSign, AlertCircle, Archive } from 'lucide-react';
import StatsCarousel from '../components/common/StatsCarousel';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import Skeleton from '../components/common/Skeleton';
import DebouncedInput from '../components/common/DebouncedInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';

const CATEGORIES = ['Buku LKS', 'Buku Ismuba', 'Kitab Pondok', 'Seragam', 'Lainnya'];

export default function BillingTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showGenerate, setShowGenerate] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Enhancement State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [availableClasses, setAvailableClasses] = useState([]);
    const [classCounts, setClassCounts] = useState({}); // Map of "ClassName" -> student count

    // Bundle State
    const [bundles, setBundles] = useState([]);
    const [showBundleModal, setShowBundleModal] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'Buku LKS',
        customCategory: '',
        academicYear: '',
        semester: '',
        dueDate: '',
        applyScholarship: false,
        allowInstallment: true,
        minInstallment: '',
        maxInstallments: '',
        isRecurring: false,
        recurringType: 'monthly',

        variants: [{ classNames: '', amount: '' }],
        items: [] // [{ name: '', price: '' }]
    });

    // Generate state
    const [generateData, setGenerateData] = useState({
        selectedClasses: [],
        preview: null,
        loading: false
    });

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState({ loading: false, students: [], templateName: '' });
    const [historyFilters, setHistoryFilters] = useState({ search: '', status: 'all' });
    const [isSearching, setIsSearching] = useState(false);

    const handleHistorySearch = (value) => {
        setIsSearching(true);
        // Simulate network delay for skeleton effect
        setTimeout(() => {
            setHistoryFilters(prev => ({ ...prev, search: value }));
            setIsSearching(false);
        }, 500);
    };

    const handleShowHistory = async (template) => {
        setHistoryData({ loading: true, students: [], templateName: template.name });
        setHistoryFilters({ search: '', status: 'all' });
        setIsSearching(false);
        setShowHistoryModal(true);
        try {
            // Fetch liabilities and students in parallel
            const [liabilitiesResponse, studentsResponse] = await Promise.all([
                api.get(`liabilities?templateId=${template.id}`),
                api.get('students?limit=1000') // Adjust limit as needed
            ]);

            let liabilities = liabilitiesResponse.data || liabilitiesResponse;
            const students = studentsResponse.data || studentsResponse;

            // Create student map for faster lookup
            const studentMap = {};
            if (Array.isArray(students)) {
                students.forEach(s => {
                    // Normalize ID to string for consistency
                    studentMap[String(s.id)] = s;
                });
            }

            // Client-side filtering check (Removed to prevent mismatch if key differs)
            if (!Array.isArray(liabilities)) {
                liabilities = [];
            }

            // Map data
            const history = liabilities.map(l => {
                // Try to find student by ID if not embedded
                const studentId = l.studentId ? String(l.studentId) : null;
                const student = l.student || (studentId ? studentMap[studentId] : null) || {};

                return {
                    ...l,
                    studentName: student.fullName || l.studentName || 'Unknown',
                    className: student.className || l.className || '-',
                    status: l.status
                };
            });

            setHistoryData({
                loading: false,
                students: history,
                templateName: template.name
            });
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat riwayat penagihan');
            setHistoryData(prev => ({ ...prev, loading: false }));
        }
    };

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await api.get('billing-templates');
            setTemplates(data || []);
        } catch (error) {
            toast.error('Gagal memuat data tagihan');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('students?limit=1000');
            const students = response.data || response;

            // Get unique classes
            const classes = [...new Set(students.filter(s => s.className).map(s => s.className))].sort();
            setAvailableClasses(classes);

            // Count students per class for potential revenue calc
            const counts = {};
            students.forEach(s => {
                if (s.className) {
                    counts[s.className] = (counts[s.className] || 0) + 1;
                }
            });
            setClassCounts(counts);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    }


    const fetchBundles = async () => {
        try {
            const data = await api.get('item-bundles');
            setBundles(data || []);
        } catch (error) {
            console.error('Failed to fetch bundles:', error);
        }
    };

    useEffect(() => {
        fetchTemplates();
        fetchClasses();
        fetchBundles();
    }, []);

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    // Calculate Stats
    const stats = useMemo(() => {
        const activeTemplates = templates.filter(t => t.isActive);
        const totalActive = activeTemplates.length;
        const totalBilled = templates.reduce((sum, t) => sum + (t._count?.liabilities || 0), 0);

        let potentialRevenue = 0;
        activeTemplates.forEach(t => {
            t.variants.forEach(v => {
                const amount = parseFloat(v.amount) || 0;
                if (v.classNames === '*') {
                    // All students
                    const totalStudents = Object.values(classCounts).reduce((a, b) => a + b, 0);
                    potentialRevenue += amount * totalStudents;
                } else {
                    // Specific classes
                    const targetClasses = v.classNames.split(',').map(c => c.trim());
                    targetClasses.forEach(cls => {
                        const count = classCounts[cls] || 0;
                        potentialRevenue += amount * count;
                    });
                }
            });
        });

        return { potentialRevenue, totalActive, totalBilled };
    }, [templates, classCounts]);

    const resetForm = () => {
        setForm({
            name: '', description: '', category: 'Buku LKS', customCategory: '', academicYear: '', semester: '', dueDate: '',
            applyScholarship: false, allowInstallment: true, minInstallment: '', maxInstallments: '',
            isRecurring: false, recurringType: 'monthly',

            variants: [{ classNames: '', programs: '', genders: '', amount: '' }],
            items: []
        });
        setEditingTemplate(null);
    };

    const openCreateForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (template) => {
        setEditingTemplate(template);
        setForm({
            name: template.name,
            description: template.description || '',
            category: CATEGORIES.includes(template.category) ? template.category : 'Lainnya',
            customCategory: CATEGORIES.includes(template.category) ? '' : template.category,
            academicYear: template.academicYear || '',
            semester: template.semester || '',
            dueDate: template.dueDate ? template.dueDate.split('T')[0] : '',
            applyScholarship: template.applyScholarship,
            allowInstallment: template.allowInstallment,
            minInstallment: template.minInstallment || '',
            maxInstallments: template.maxInstallments || '',
            isRecurring: template.isRecurring,
            recurringType: template.recurringType || 'monthly',
            variants: template.variants.map(v => ({
                classNames: v.classNames,
                programs: v.programs || '',
                genders: v.genders || '',
                amount: v.amount.toString()
            })),
            items: template.items || []
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalCategory = form.category === 'Lainnya' ? form.customCategory : form.category;
        if (!form.name || !finalCategory) {
            toast.error('Nama dan kategori wajib diisi');
            return;
        }

        const validVariants = form.variants.filter(v => v.classNames && v.amount);
        if (validVariants.length === 0) {
            toast.error('Minimal satu harga kelas diperlukan');
            return;
        }

        const payload = {
            name: form.name,
            description: form.description || null,
            category: finalCategory,
            academicYear: form.academicYear || null,
            semester: form.semester || null,
            dueDate: form.dueDate || null,
            applyScholarship: form.applyScholarship,
            allowInstallment: form.allowInstallment,
            minInstallment: form.minInstallment ? parseFloat(form.minInstallment) : null,
            maxInstallments: form.maxInstallments ? parseInt(form.maxInstallments) : null,
            isRecurring: form.isRecurring,
            recurringType: form.isRecurring ? form.recurringType : null,
            variants: validVariants.map(v => ({
                classNames: v.classNames,
                programs: v.programs || null,
                genders: v.genders || null,
                amount: parseFloat(v.amount)
            })),
            items: form.items.filter(i => i.name.trim()) // Filter empty items
        };

        try {
            if (editingTemplate) {
                await api.put(`billing-templates/${editingTemplate.id}`, payload);
                toast.success('Tagihan berhasil diupdate');
            } else {
                await api.post('billing-templates', payload);
                toast.success('Tagihan berhasil dibuat');
            }
            setShowForm(false);
            resetForm();
            fetchTemplates();
        } catch (error) {
            toast.error(error.message || 'Gagal menyimpan tagihan');
        }
    };

    const handleDelete = (template) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Hapus Tagihan',
            message: `Yakin ingin menghapus "${template.name}"?`,
            confirmText: 'Hapus',
            confirmStyle: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`billing-templates/${template.id}`);
                    toast.success('Tagihan berhasil dihapus');
                    fetchTemplates();
                } catch (error) {
                    toast.error(error.message || 'Gagal menghapus tagihan');
                }
                setConfirmDialog({ isOpen: false });
            },
            onCancel: () => setConfirmDialog({ isOpen: false })
        });
    };

    const handleDuplicate = (template) => {
        setEditingTemplate(null); // Treat as new create
        setForm({
            name: `${template.name} (Copy)`,
            description: template.description || '',
            category: CATEGORIES.includes(template.category) ? template.category : 'Lainnya',
            customCategory: CATEGORIES.includes(template.category) ? '' : template.category,
            academicYear: template.academicYear || '',
            semester: template.semester || '',
            dueDate: template.dueDate ? template.dueDate.split('T')[0] : '',
            applyScholarship: template.applyScholarship,
            allowInstallment: template.allowInstallment,
            minInstallment: template.minInstallment || '',
            maxInstallments: template.maxInstallments || '',
            isRecurring: template.isRecurring,
            recurringType: template.recurringType || 'monthly',
            variants: template.variants.map(v => ({
                classNames: v.classNames,
                programs: v.programs || '',
                genders: v.genders || '',
                amount: v.amount.toString()
            })),
            items: template.items ? template.items.map(i => ({ ...i })) : []
        });
        setShowForm(true);
        toast.success('Template berhasil disalin. Silakan cek dan simpan.');
    };

    const addVariant = () => {
        setForm({ ...form, variants: [...form.variants, { classNames: '', programs: '', genders: '', amount: '' }] });
    };

    const updateVariant = (index, field, value) => {
        const newVariants = [...form.variants];
        newVariants[index][field] = value;
        setForm({ ...form, variants: newVariants });
    };

    const removeVariant = (index) => {
        const newVariants = form.variants.filter((_, i) => i !== index);
        setForm({ ...form, variants: newVariants });
    };

    // Item Checklist Logic
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

    const handleImportBundle = (bundle) => {
        if (!bundle.items || bundle.items.length === 0) return;
        const newItems = [...form.items, ...bundle.items.map(i => ({ ...i }))];
        setForm({ ...form, items: newItems });
        setShowBundleModal(false);
        toast.success(`Berhasil mengimpor ${bundle.items.length} item dari paket "${bundle.name}"`);
    };



    // Generate dialog functions
    const openGenerateDialog = (template) => {
        setSelectedTemplate(template);
        setGenerateData({ selectedClasses: [], preview: null, loading: false });
        setShowGenerate(true);
    };

    const toggleClass = (className) => {
        setGenerateData(prev => ({
            ...prev,
            selectedClasses: prev.selectedClasses.includes(className)
                ? prev.selectedClasses.filter(c => c !== className)
                : [...prev.selectedClasses, className],
            preview: null
        }));
    };

    const handlePreview = async () => {
        if (generateData.selectedClasses.length === 0) {
            toast.error('Pilih minimal satu kelas');
            return;
        }

        setGenerateData(prev => ({ ...prev, loading: true }));
        try {
            const data = await api.post(`billing-templates/${selectedTemplate.id}/preview`, {
                classNames: generateData.selectedClasses
            });
            setGenerateData(prev => ({ ...prev, preview: data, loading: false }));
        } catch (error) {
            toast.error('Gagal memuat preview');
            setGenerateData(prev => ({ ...prev, loading: false }));
        }
    };

    const handleGenerate = async () => {
        setGenerateData(prev => ({ ...prev, loading: true }));
        try {
            const result = await api.post(`billing-templates/${selectedTemplate.id}/generate`, {
                classNames: generateData.selectedClasses
            });
            toast.success(result.message);
            setShowGenerate(false);
            fetchTemplates();
        } catch (error) {
            toast.error(error.message || 'Gagal generate tagihan');
            setGenerateData(prev => ({ ...prev, loading: false }));
        }
    };



    // Filter templates
    const filteredTemplates = templates.filter(t => {
        if (filterCategory && t.category !== filterCategory) return false;
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });



    return (
        <Layout>
            <div className="space-y-6">
                {/* Stats Cards */}
                {/* Stats Dashboard */}
                <div className="mb-8 mt-2">
                    <StatsCarousel
                        stats={[
                            {
                                label: 'Potensi Pendapatan',
                                value: formatRupiah(stats.potentialRevenue),
                                subtitle: 'Estimasi per siklus tagihan',
                                icon: Wallet,
                                iconBg: 'bg-blue-50 dark:bg-blue-900/20',
                                iconColor: 'text-blue-600 dark:text-blue-400',
                                trendIcon: TrendingUp
                            },
                            {
                                label: 'Tagihan Aktif',
                                value: stats.totalActive,
                                subtitle: `Dari total ${templates.length} template`,
                                icon: Check,
                                iconBg: 'bg-green-50 dark:bg-green-900/20',
                                iconColor: 'text-green-600 dark:text-green-400',
                                trendIcon: Check
                            },
                            {
                                label: 'Sudah Ditagih',
                                value: stats.totalBilled,
                                subtitle: 'Total siswa tertagih',
                                icon: Users,
                                iconBg: 'bg-purple-50 dark:bg-purple-900/20',
                                iconColor: 'text-purple-600 dark:text-purple-400',
                                trendIcon: Users
                            },
                            {
                                label: 'Total Template',
                                value: templates.length,
                                subtitle: 'Semua template tagihan',
                                icon: FileText,
                                iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
                                iconColor: 'text-indigo-600 dark:text-indigo-400',
                                trendIcon: FileText
                            },
                            {
                                label: 'Rata-rata Pendapatan',
                                value: formatRupiah(stats.totalActive > 0 ? stats.potentialRevenue / stats.totalActive : 0),
                                subtitle: 'Per template aktif',
                                icon: CircleDollarSign,
                                iconBg: 'bg-orange-50 dark:bg-orange-900/20',
                                iconColor: 'text-orange-600 dark:text-orange-400',
                                trendIcon: TrendingUp
                            },
                            {
                                label: 'Template Non-Aktif',
                                value: templates.length - stats.totalActive,
                                subtitle: 'Template diarsipkan/tidak aktif',
                                icon: Archive,
                                iconBg: 'bg-gray-100 dark:bg-gray-700',
                                iconColor: 'text-gray-600 dark:text-gray-400',
                                trendIcon: AlertCircle
                            }
                        ]}
                    />
                </div>

                {/* Toolbar */}
                <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-all duration-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-2 flex-1 w-full sm:w-auto">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all shadow-sm group-hover:shadow-md"
                                    placeholder="Cari tagihan..."
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <div className="relative min-w-[140px]">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                </div>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <option value="">Semua Kategori</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                    title="List View"
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <button onClick={openCreateForm} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all whitespace-nowrap">
                            <Plus className="w-5 h-5" />
                            Buat Tagihan
                        </button>
                    </div>
                </div>

                {/* Templates List/Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
                            <p className="text-gray-500 animate-pulse font-medium">Memuat data tagihan...</p>
                        </div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum ada template tagihan</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Buat template tagihan pertama Anda untuk memudahkan penagihan biaya pendidikan ke santri.
                        </p>
                        <button onClick={openCreateForm} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium flex items-center gap-2 mx-auto">
                            <Plus className="w-5 h-5" />
                            Buat Tagihan Baru
                        </button>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tidak ditemukan</h3>
                        <p className="text-gray-500">Coba ubah kata kunci atau filter pencarian Anda.</p>
                        <button onClick={() => { setSearchQuery(''); setFilterCategory(''); }} className="mt-4 text-blue-600 font-medium hover:underline">
                            Reset Filter
                        </button>
                    </div>
                ) : viewMode === 'list' ? (
                    /* LIST VIEW */
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Nama Tagihan</th>
                                        <th className="px-6 py-4 font-medium">Periode</th>
                                        <th className="px-6 py-4 font-medium">Target Kelas & Harga</th>
                                        <th className="px-6 py-4 font-medium text-center">Status</th>
                                        <th className="px-6 py-4 font-medium text-center">Tertagih</th>
                                        <th className="px-6 py-4 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredTemplates.map(template => (
                                        <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">{template.name}</h4>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${CATEGORIES.includes(template.category)
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                                            }`}>
                                                            {template.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                {(template.academicYear || template.semester) ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-white">{template.academicYear}</span>
                                                        <span className="text-xs">{template.semester}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {template.variants.slice(0, 2).map((v, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs gap-4">
                                                            <span className="text-gray-500 truncate max-w-[100px]" title={v.classNames}>{v.classNames}</span>
                                                            <span className="font-medium text-green-600 dark:text-green-400">{formatRupiah(v.amount)}</span>
                                                        </div>
                                                    ))}
                                                    {template.variants.length > 2 && (
                                                        <span className="text-[10px] text-gray-400 italic">+{template.variants.length - 2} varian lainnya</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {template.isActive ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {template._count?.liabilities > 0 ? (
                                                    <span
                                                        onClick={() => handleShowHistory(template)}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 cursor-pointer transition-colors"
                                                        title="Lihat Riwayat"
                                                    >
                                                        {template._count.liabilities}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openGenerateDialog(template)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                        title="Generate Tagihan"
                                                    >
                                                        <Users className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(template)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditForm(template)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(template)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* GRID VIEW */
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                className={`group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 flex flex-col h-full overflow-hidden ${!template.isActive ? 'opacity-75 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
                            >
                                {/* Header / Category Strip */}
                                <div className={`h-1.5 w-full ${template.category === 'Buku LKS' ? 'bg-blue-500' :
                                    template.category === 'Seragam' ? 'bg-purple-500' :
                                        template.category === 'Kitab Pondok' ? 'bg-green-500' :
                                            'bg-gray-400'
                                    }`}></div>

                                <div className="p-6 flex flex-col h-full">
                                    {/* Top Section */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    {template.category}
                                                </span>
                                                {!template.isActive && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 uppercase tracking-wide">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                                {template.name}
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg group-hover:scale-105 transition-transform">
                                            {template.category.includes('Buku') ? (
                                                <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                            ) : template.category.includes('Seragam') ? (
                                                <Package className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
                                            ) : (
                                                <Wallet className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta Info */}
                                    {(template.academicYear || template.semester) && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-5 bg-gray-50 dark:bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <GraduationCap className="w-3.5 h-3.5" />
                                            <span className="font-medium">
                                                {template.academicYear && `${template.academicYear}`}
                                                {template.semester && ` • ${template.semester.charAt(0).toUpperCase() + template.semester.slice(1)}`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Price List / Variants (Receipt Style) */}
                                    <div className="flex-1 mb-6">
                                        <div className="bg-gray-50/50 dark:bg-gray-700/20 rounded-xl p-3 border border-dashed border-gray-200 dark:border-gray-600 space-y-2">
                                            {template.variants.slice(0, 3).map(v => (
                                                <div key={v.id} className="flex justify-between items-center text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-700 dark:text-gray-200 text-xs">{v.classNames}</span>
                                                    </div>
                                                    <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                                                        {formatRupiah(v.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                            {template.variants.length > 3 && (
                                                <div className="pt-2 mt-2 border-t border-dashed border-gray-200 dark:border-gray-600 text-center">
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        +{template.variants.length - 3} varian lainnya
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Indicators/Badges */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {template._count?.liabilities > 0 && (
                                            <span onClick={() => handleShowHistory(template)} className="badge badge-info cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" title="Lihat history">
                                                <Users className="w-3 h-3 mr-1" /> {template._count.liabilities} Tertagih
                                            </span>
                                        )}
                                        {template.isRecurring && (
                                            <span className="badge badge-gray flex items-center">
                                                <RefreshCw className="w-3 h-3 mr-1" /> Auto
                                            </span>
                                        )}
                                        {template.allowInstallment && (
                                            <span className="badge badge-warning">Credit</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                        <button
                                            onClick={() => openGenerateDialog(template)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow active:scale-95"
                                        >
                                            <Users className="w-4 h-4" />
                                            Generate
                                        </button>

                                        <div className="flex gap-1 border-l border-gray-100 dark:border-gray-700 pl-2 ml-1">
                                            <button onClick={() => handleDuplicate(template)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Duplicate">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openEditForm(template)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(template)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingTemplate ? 'Edit Tagihan' : 'Buat Tagihan Baru'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Tagihan *</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Buku LKS Semester Ganjil 2025/2026" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori *</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {form.category === 'Lainnya' && (
                                <input type="text" value={form.customCategory} onChange={e => setForm({ ...form, customCategory: e.target.value })} className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Ketik kategori..." />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun Pelajaran</label>
                            <select value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="">Pilih Tahun</option>
                                <option value="2024/2025">2024/2025</option>
                                <option value="2025/2026">2025/2026</option>
                                <option value="2026/2027">2026/2027</option>
                                <option value="2027/2028">2027/2028</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester (Opsional)</label>
                            <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="">-- Semua / Tidak Ada --</option>
                                <option value="ganjil">Ganjil</option>
                                <option value="genap">Genap</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jatuh Tempo</label>
                            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Keterangan tambahan..." />
                        </div>
                    </div>

                    {/* Variants */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harga per Kelas / Varian *</label>
                            <button type="button" onClick={addVariant} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Tambah
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.variants.map((v, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex-1 grid grid-cols-12 gap-2">
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                value={v.classNames}
                                                onChange={e => updateVariant(i, 'classNames', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 transition-all"
                                                placeholder="Kelas (7,8...)"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={v.programs || ''}
                                                onChange={e => updateVariant(i, 'programs', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 transition-all"
                                                placeholder="Program (Semua)"
                                                title="Kosongkan untuk semua program"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={v.genders || ''}
                                                onChange={e => updateVariant(i, 'genders', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 transition-all"
                                                placeholder="Gender (Semua)"
                                                title="Kosongkan untuk semua gender"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                value={v.amount}
                                                onChange={e => updateVariant(i, 'amount', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm font-medium text-right rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 transition-all"
                                                placeholder="Rp 0"
                                            />
                                        </div>
                                    </div>
                                    {form.variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(i)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Hapus baris"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Items Checklist / Rincian Barang */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rincian Barang / Fasilitas</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowBundleModal(true)} className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                                    <Package className="w-4 h-4" /> Import Paket
                                </button>
                                <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                    <Plus className="w-4 h-4" /> Tambah Barang
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {form.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex-1 grid grid-cols-12 gap-2">
                                        <div className="col-span-8">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={e => updateItem(i, 'name', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 transition-all"
                                                placeholder="Nama Barang (Misal: Kain Seragam, Buku Paket)"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={e => updateItem(i, 'price', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm font-medium text-right rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 transition-all"
                                                placeholder="Harga (Opsional)"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Hapus barang"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {form.items.length === 0 && (
                                <div className="text-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500">
                                    Belum ada rincian barang. Klik Tambah Barang jika tagihan ini termasuk barang fisik.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2"><Settings className="w-4 h-4" />Opsi</h4>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.applyScholarship} onChange={e => setForm({ ...form, applyScholarship: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Terapkan potongan beasiswa</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.allowInstallment} onChange={e => setForm({ ...form, allowInstallment: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Boleh cicilan</span>
                        </label>
                        {form.allowInstallment && (
                            <div className="flex gap-6 ml-7 mt-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Min per cicilan</label>
                                    <input type="number" value={form.minInstallment} onChange={e => setForm({ ...form, minInstallment: e.target.value })} className="w-36 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="40000" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Max kali</label>
                                    <input type="number" value={form.maxInstallments} onChange={e => setForm({ ...form, maxInstallments: e.target.value })} className="w-24 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="3" />
                                </div>
                            </div>
                        )}

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({ ...form, isRecurring: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Recurring (berulang)</span>
                        </label>
                        {form.isRecurring && (
                            <div className="ml-7">
                                <select value={form.recurringType} onChange={e => setForm({ ...form, recurringType: e.target.value })} className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                                    <option value="monthly">Bulanan</option>
                                    <option value="semester">Per Semester</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Batal</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Simpan</button>
                    </div>
                </form>
            </Modal>

            {/* Generate Modal */}
            <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title={`Generate: ${selectedTemplate?.name}`} size="lg">
                <div className="space-y-4">

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Kelas Target:</label>
                            <button
                                type="button"
                                onClick={() => {
                                    const allClassNames = availableClasses;
                                    const isAllSelected = allClassNames.every(c => generateData.selectedClasses.includes(c));
                                    setGenerateData(prev => ({
                                        ...prev,
                                        selectedClasses: isAllSelected ? [] : allClassNames,
                                        preview: null
                                    }));
                                }}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                            >
                                {availableClasses.every(c => generateData.selectedClasses.includes(c)) ? 'Batalkan Semua' : 'Pilih Semua'}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                            {availableClasses.map(cls => {
                                const variant = selectedTemplate?.variants.find(v => v.classNames.includes(cls) || v.classNames === '*');
                                const isSelected = generateData.selectedClasses.includes(cls);
                                return (
                                    <button
                                        key={cls}
                                        type="button"
                                        onClick={() => toggleClass(cls)}
                                        className={`
                                            px-3 py-2 rounded-lg text-sm border transition-all duration-200 flex flex-col items-center justify-center gap-1
                                            ${isSelected
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        <span className="font-semibold">{cls}</span>
                                        {variant && (
                                            <span className={`text-[10px] px-1.5 rounded-full ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                                {formatRupiah(variant.amount)}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {availableClasses.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                Belum ada data kelas (santri) yang tersedia.
                            </div>
                        )}
                    </div>

                    {generateData.selectedClasses.length > 0 && !generateData.preview && (
                        <button onClick={handlePreview} disabled={generateData.loading} className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-all">
                            {generateData.loading ? <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> : null}
                            Preview
                        </button>
                    )}

                    {generateData.preview && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Preview</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-600 dark:text-gray-300">Total Santri:</div><div className="font-medium text-gray-900 dark:text-white">{generateData.preview.summary.totalStudents}</div>
                                <div className="text-gray-600 dark:text-gray-300">Dapat Beasiswa:</div><div className="font-medium text-gray-900 dark:text-white">{generateData.preview.summary.studentsWithScholarship}</div>
                                <div className="text-gray-600 dark:text-gray-300">Total Tagihan:</div><div className="font-medium text-blue-600 dark:text-blue-400">{formatRupiah(generateData.preview.summary.totalFinal)}</div>
                                {generateData.preview.summary.totalDiscount > 0 && (
                                    <><div className="text-gray-600 dark:text-gray-300">Total Diskon:</div><div className="font-medium text-green-600 dark:text-green-400">-{formatRupiah(generateData.preview.summary.totalDiscount)}</div></>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={() => setShowGenerate(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Batal</button>
                        <button onClick={handleGenerate} disabled={!generateData.preview || generateData.loading} className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2">
                            {generateData.loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Generate Tagihan
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Bundle UI Modal */}
            <Modal isOpen={showBundleModal} onClose={() => setShowBundleModal(false)} title="Import dari Paket Barang" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pilih paket untuk menambahkan item secara otomatis (tidak menghapus item yang sudah ada).</p>
                    <div className="grid gap-2">
                        {bundles.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">Belum ada paket barang. Silakan buat di menu Master Data {'>'} Paket Barang.</div>
                        ) : (
                            bundles.map(bundle => (
                                <button
                                    key={bundle.id}
                                    onClick={() => handleImportBundle(bundle)}
                                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                                >
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            <Package className="w-4 h-4 text-purple-600" />
                                            {bundle.name}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {bundle.items.length} items • {formatRupiah(bundle.totalPrice || 0)}
                                        </div>
                                    </div>
                                    <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download className="w-5 h-5" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* History Modal */}
            <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Riwayat Penagihan ${historyData.templateName ? `- ${historyData.templateName}` : ''}`} size="2xl">
                <div className="flex flex-col h-full bg-white dark:bg-gray-800">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
                        {/* Search & Filter Controls */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <DebouncedInput
                                    type="text"
                                    placeholder="Cari nama santri..."
                                    value={historyFilters.search}
                                    onChange={handleHistorySearch}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <select
                                value={historyFilters.status}
                                onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                <option value="all">Semua Status</option>
                                <option value="paid">Lunas</option>
                                <option value="unpaid">Belum Lunas</option>
                            </select>
                        </div>
                    </div>

                    {historyData.loading ? (
                        <div className="flex justify-center p-12">
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                                <p className="text-sm text-gray-500">Memuat data penagihan...</p>
                            </div>
                        </div>
                    ) : historyData.students.length === 0 ? (
                        <div className="text-center p-12 text-gray-500 flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                                <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                            <p>Belum ada santri yang ditagih dengan template ini.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="overflow-y-auto max-h-[60vh]">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Nama Santri</th>
                                            <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Kelas</th>
                                            <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {isSearching ? (
                                            /* Skeleton Rows */
                                            Array.from({ length: 5 }).map((_, idx) => (
                                                <tr key={`skel-${idx}`}>
                                                    <td className="px-4 py-3"><Skeleton variant="text" width="60%" height="20px" /></td>
                                                    <td className="px-4 py-3"><Skeleton variant="text" width="30%" height="20px" /></td>
                                                    <td className="px-4 py-3"><Skeleton variant="rectangular" width="80px" height="24px" className="rounded-full" /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            historyData.students
                                                .filter(student => {
                                                    const matchSearch = student.studentName.toLowerCase().includes(historyFilters.search.toLowerCase());
                                                    const matchStatus = historyFilters.status === 'all'
                                                        ? true
                                                        : historyFilters.status === 'paid'
                                                            ? student.status === 'PAID'
                                                            : student.status !== 'PAID';
                                                    return matchSearch && matchStatus;
                                                })
                                                .map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.studentName}</td>
                                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.className}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                item.status === 'partial' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                {item.status === 'paid' ? 'Lunas' : item.status === 'partial' ? 'Cicilan' : 'Belum Lunas'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 p-4">
                        <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} confirmText={confirmDialog.confirmText} confirmStyle={confirmDialog.confirmStyle} onConfirm={confirmDialog.onConfirm} onClose={() => setConfirmDialog({ isOpen: false })} />
        </Layout>
    );
}
