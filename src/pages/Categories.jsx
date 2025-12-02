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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Total Kategori</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Aktif</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Tidak Aktif</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cari nama atau kode kategori..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <ArrowUpDown className="w-3 h-3 inline mr-1" />
                  Urutkan
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name-asc">Nama (A-Z)</option>
                  <option value="name-desc">Nama (Z-A)</option>
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>

              {/* Color Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Warna</label>
                <select
                  value={filters.colorFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, colorFilter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Reset Filter ({activeFilterCount()})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Tag size={48} className="mx-auto mb-2 opacity-50 text-gray-400" />
            <p className="text-gray-500 mb-2">Tidak ada kategori ditemukan</p>
            {(searchQuery || activeFilterCount() > 0) && (
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          filteredCategories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: (category.color || '#3B82F6') + '20',
                      color: category.color || '#3B82F6'
                    }}
                  >
                    <IconComponent size={24} />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{category.code}</p>

                {category.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowDeleteDialog(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Info */}
      {filteredCategories.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
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