import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Download, Search, Building2, Phone, Mail, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SupplierForm from '../components/features/suppliers/SupplierForm';
import { 
  getAllSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  getSupplierStats,
  exportSuppliers
} from '../services/supplierService';
import { formatPhoneNumber } from '../utils/formatters';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enhanced Filters
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'name-asc',
    hasEmail: '',
    hasPhone: '',
    itemsPerPage: 25
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  useEffect(() => {
    loadSuppliers();
    loadStats();
  }, []);
  
  useEffect(() => {
    filterAndSortSuppliers();
  }, [searchQuery, filters, suppliers]);
  
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error('Gagal memuat data supplier');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const data = await getSupplierStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const filterAndSortSuppliers = () => {
    let result = [...suppliers];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.phone && s.phone.toLowerCase().includes(query))
      );
    }
    
    // Status filter
    if (filters.status === 'active') {
      result = result.filter(s => s.isActive);
    } else if (filters.status === 'inactive') {
      result = result.filter(s => !s.isActive);
    }
    
    // Email filter
    if (filters.hasEmail === 'yes') {
      result = result.filter(s => s.email && s.email.trim() !== '');
    } else if (filters.hasEmail === 'no') {
      result = result.filter(s => !s.email || s.email.trim() === '');
    }
    
    // Phone filter
    if (filters.hasPhone === 'yes') {
      result = result.filter(s => s.phone && s.phone.trim() !== '');
    } else if (filters.hasPhone === 'no') {
      result = result.filter(s => !s.phone || s.phone.trim() === '');
    }
    
    // Sort
    switch (filters.sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'code-asc':
        result.sort((a, b) => a.code.localeCompare(b.code));
        break;
      case 'code-desc':
        result.sort((a, b) => b.code.localeCompare(a.code));
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
    
    // Limit items per page
    result = result.slice(0, filters.itemsPerPage);
    
    setFilteredSuppliers(result);
  };
  
  const handleAdd = async (formData) => {
    try {
      setFormLoading(true);
      await createSupplier(formData);
      toast.success('Supplier berhasil ditambahkan');
      setShowAddModal(false);
      loadSuppliers();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal menambahkan supplier');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleEdit = async (formData) => {
    try {
      setFormLoading(true);
      await updateSupplier(selectedSupplier.id, formData);
      toast.success('Data supplier berhasil diperbarui');
      setShowEditModal(false);
      setSelectedSupplier(null);
      loadSuppliers();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal memperbarui data supplier');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setFormLoading(true);
      await deleteSupplier(selectedSupplier.id);
      toast.success('Supplier berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
      loadSuppliers();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus supplier');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      const data = await exportSuppliers({ status: filters.status });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Supplier');
      XLSX.writeFile(wb, `data-supplier-${new Date().toISOString().split('T')[0]}.xlsx`);
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
      hasEmail: '',
      hasPhone: '',
      itemsPerPage: 25
    });
    setSearchQuery('');
  };
  
  const activeFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.hasEmail) count++;
    if (filters.hasPhone) count++;
    if (filters.sortBy !== 'name-asc') count++;
    if (searchQuery) count++;
    return count;
  };
  
  return (
    <Layout>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Supplier</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Aktif</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Tidak Aktif</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
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
              placeholder="Cari nama, kode, email, atau telepon..."
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
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
                  <option value="code-asc">Kode (ASC)</option>
                  <option value="code-desc">Kode (DESC)</option>
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>

              {/* Email Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Mail className="w-3 h-3 inline mr-1" />
                  Email
                </label>
                <select
                  value={filters.hasEmail}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua</option>
                  <option value="yes">Ada Email</option>
                  <option value="no">Belum Ada Email</option>
                </select>
              </div>

              {/* Phone Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Phone className="w-3 h-3 inline mr-1" />
                  Telepon
                </label>
                <select
                  value={filters.hasPhone}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua</option>
                  <option value="yes">Ada Telepon</option>
                  <option value="no">Belum Ada Telepon</option>
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
                  <option value={10}>10 items</option>
                  <option value={25}>25 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                  <option value={1000}>Semua</option>
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
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nama Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Telepon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="spinner"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    <Building2 size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Tidak ada data supplier</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{supplier.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatPhoneNumber(supplier.phone) || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{supplier.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setShowDeleteDialog(true);
                          }}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info */}
        {filteredSuppliers.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredSuppliers.length} dari {suppliers.length} supplier
            </p>
          </div>
        )}
      </div>
      
      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Supplier Baru"
        size="lg"
      >
        <SupplierForm
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
          setSelectedSupplier(null);
        }}
        title="Edit Data Supplier"
        size="lg"
      >
        <SupplierForm
          supplier={selectedSupplier}
          onSubmit={handleEdit}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedSupplier(null);
          }}
          loading={formLoading}
        />
      </Modal>
      
      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSupplier(null);
        }}
        title="Detail Supplier"
        size="md"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Kode Supplier</p>
                <p className="font-medium text-gray-900">{selectedSupplier.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  selectedSupplier.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedSupplier.isActive ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Nama Supplier</p>
                <p className="font-medium text-gray-900">{selectedSupplier.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> No. Telepon
                </p>
                <p className="font-medium text-gray-900">{formatPhoneNumber(selectedSupplier.phone) || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </p>
                <p className="font-medium text-gray-900">{selectedSupplier.email || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedSupplier(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${selectedSupplier?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        loading={formLoading}
      />
    </Layout>
  );
}