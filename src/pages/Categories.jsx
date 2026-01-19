import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Download, Search, Tag, X,
  Package, ShoppingCart, Apple, Coffee, Book, Shirt,
  Backpack, Pen, Sparkles, Candy, Pizza, Cookie,
  Beef, Croissant, IceCream, Milk, Utensils, Wine,
  ArrowUpDown, SlidersHorizontal
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CategoryForm from '../components/features/categories/CategoryForm';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  exportCategories
} from '../services/categoryService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Icon mapping helper
const ICON_MAP = {
  Package, ShoppingCart, Apple, Coffee, Book, Shirt,
  Backpack, Pen, Sparkles, Candy, Pizza, Cookie,
  Beef, Croissant, IceCream, Milk, Utensils, Wine
};

const getIconComponent = (iconName) => {
  return ICON_MAP[iconName] || Package;
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced Filters
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'name-asc',
    colorFilter: '',
    itemsPerPage: 12
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadStats();
  }, []);

  useEffect(() => {
    filterAndSortCategories();
  }, [searchQuery, filters, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Gagal memuat data kategori');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getCategoryStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const filterAndSortCategories = () => {
    let result = [...categories];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filters.status === 'active') {
      result = result.filter(c => c.isActive);
    } else if (filters.status === 'inactive') {
      result = result.filter(c => !c.isActive);
    }

    // Color filter
    if (filters.colorFilter) {
      result = result.filter(c => c.color === filters.colorFilter);
    }

    // Sort
    switch (filters.sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }

    // Limit items per page (for display)
    result = result.slice(0, filters.itemsPerPage);

    setFilteredCategories(result);
  };

  const handleAdd = async (formData) => {
    try {
      setFormLoading(true);
      await createCategory(formData);
      toast.success('Kategori berhasil ditambahkan');
      setShowAddModal(false);
      loadCategories();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal menambahkan kategori');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    try {
      setFormLoading(true);
      await updateCategory(selectedCategory.id, formData);
      toast.success('Kategori berhasil diperbarui');
      setShowEditModal(false);
      setSelectedCategory(null);
      loadCategories();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal memperbarui kategori');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setFormLoading(true);
      await deleteCategory(selectedCategory.id);
      toast.success('Kategori berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedCategory(null);
      loadCategories();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus kategori');
    } finally {
      setFormLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportCategories();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kategori');
      XLSX.writeFile(wb, `kategori-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data berhasil diexport');
    } catch (error) {
      toast.error('Gagal export data');
      console.error(error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      sortBy: 'name-asc',
      colorFilter: '',
      itemsPerPage: 12
    });
    setSearchQuery('');
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.colorFilter) count++;
    if (filters.sortBy !== 'name-asc') count++;
    if (searchQuery) count++;
    return count;
  };

  return (
    <Layout>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
          {/* Total Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Kategori</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</h3>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Semua kategori dalam sistem
            </p>
          </div>

          {/* Active Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kategori Aktif</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</h3>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Tag className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-600">
              Kategori yang sedang digunakan
            </p>
          </div>

          {/* Inactive Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kategori Nonaktif</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inactive}</h3>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <Tag className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kategori yang diarsipkan
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-6 py-4 mb-6">
        {/* Search & Actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Cari nama atau kode kategori..."
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

          <div className="flex gap-2 relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors relative whitespace-nowrap ${showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount()}
                </span>
              )}
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Kategori</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Urutkan
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="name-asc">Nama (A-Z)</option>
                  <option value="name-desc">Nama (Z-A)</option>
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>

              {/* Color Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Warna</label>
                <select
                  value={filters.colorFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, colorFilter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Semua Warna</option>
                  <option value="#3B82F6">🔵 Biru</option>
                  <option value="#10B981">🟢 Hijau</option>
                  <option value="#EF4444">🔴 Merah</option>
                  <option value="#F59E0B">🟠 Orange</option>
                  <option value="#8B5CF6">🟣 Purple</option>
                  <option value="#06B6D4">🔵 Cyan</option>
                  <option value="#F59E0B">🟡 Kuning</option>
                  <option value="#EC4899">🩷 Pink</option>
                </select>
              </div>

              {/* Items Per Page */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tampilkan</label>
                <select
                  value={filters.itemsPerPage}
                  onChange={(e) => setFilters(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={8}>8 items</option>
                  <option value={12}>12 items</option>
                  <option value={24}>24 items</option>
                  <option value={48}>48 items</option>
                  <option value={100}>Semua</option>
                </select>
              </div>
            </div>

            {/* Reset Filters */}
            {activeFilterCount() > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Reset Filter ({activeFilterCount()})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-900 dark:text-white font-medium">Memuat data kategori...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag size={40} className="text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak ada kategori ditemukan</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              {searchQuery || activeFilterCount() > 0
                ? 'Coba sesuaikan kata kunci pencarian atau filter Anda.'
                : 'Belum ada kategori. Mulai dengan menambahkan kategori baru.'}
            </p>
            {(searchQuery || activeFilterCount() > 0) ? (
              <button
                onClick={resetFilters}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Reset Filter
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Tambah Kategori
              </button>
            )}
          </div>
        ) : (
          filteredCategories.map((category) => {
            const IconComponent = getIconComponent(category.icon);

            return (
              <div
                key={category.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <IconComponent size={60} color={category.color || '#3B82F6'} />
                </div>

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{
                      backgroundColor: (category.color || '#3B82F6') + '15',
                      color: category.color || '#3B82F6'
                    }}
                  >
                    <IconComponent size={28} strokeWidth={1.5} />
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${category.isActive ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-300'}`} title={category.isActive ? 'Active' : 'Inactive'} />
                </div>

                <div className="relative z-10">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{category.name}</h3>
                  <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mb-3 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded w-fit">{category.code}</p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 h-10">
                    {category.description || <span className="italic text-gray-300 dark:text-gray-600">Tidak ada deskripsi</span>}
                  </p>

                  <div className="flex justify-end gap-1 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowDeleteDialog(true);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Info */}
      {filteredCategories.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Menampilkan <span className="font-semibold">{filteredCategories.length}</span> dari <span className="font-semibold">{categories.length}</span> kategori
          </p>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Kategori Baru"
        size="lg"
      >
        <CategoryForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        title="Edit Kategori"
        size="lg"
      >
        <CategoryForm
          category={selectedCategory}
          onSubmit={handleEdit}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          loading={formLoading}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${selectedCategory?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        loading={formLoading}
      />
    </Layout>
  );
}