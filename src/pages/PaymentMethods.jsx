// src/pages/PaymentMethods.jsx
import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, X, DollarSign,
  CreditCard, Smartphone, Building2, QrCode,
  Banknote, Wallet, ToggleLeft, ToggleRight,
  Save, TrendingUp, Landmark
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  getAllPaymentMethods,
  getActivePaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodStatus,
  updatePaymentMethodBalance
} from '../services/paymentMethodService';
import { formatCurrency } from '../utils/formatters';
import { INDONESIA_BANKS } from '../config/constants';
import toast from 'react-hot-toast';

const iconOptions = [
  { value: 'Landmark', label: 'Landmark', component: Landmark },
  { value: 'CreditCard', label: 'Credit Card', component: CreditCard },
  { value: 'QrCode', label: 'QR Code', component: QrCode },
  { value: 'Smartphone', label: 'Smartphone', component: Smartphone },
  { value: 'Wallet', label: 'Wallet', component: Wallet },
  { value: 'Building2', label: 'Building', component: Building2 },
  { value: 'DollarSign', label: 'Dollar', component: DollarSign }
];

const colorOptions = [
  { value: 'bg-green-100 text-green-800', label: 'Green' },
  { value: 'bg-blue-100 text-blue-800', label: 'Blue' },
  { value: 'bg-orange-100 text-orange-800', label: 'Orange' },
  { value: 'bg-purple-100 text-purple-800', label: 'Purple' },
  { value: 'bg-indigo-100 text-indigo-800', label: 'Indigo' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
  { value: 'bg-red-100 text-red-800', label: 'Red' }
];

const typeOptions = [
  { value: 'cash', label: 'Tunai' },
  { value: 'digital', label: 'Digital Payment' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'bank', label: 'Transfer Bank' },
  { value: 'card', label: 'Kartu Debit/Kredit' }
];

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [filteredMethods, setFilteredMethods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'cash',
    icon: 'DollarSign',
    color: 'bg-green-100 text-green-800',
    description: '',
    provider: '',
    accountNumber: '',
    accountHolder: '',
    bankCode: '',
    isActive: true,
    displayOrder: 1
  });

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceData, setBalanceData] = useState({
    currentBalance: 0,
    adjustmentAmount: '',
    newBalance: 0,
    notes: '',
    adjustmentType: 'correction'
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    filterMethods();
  }, [searchQuery, filterType, filterStatus, methods]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await getAllPaymentMethods();
      setMethods(data);
    } catch (error) {
      toast.error('Gagal memuat metode pembayaran');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterMethods = () => {
    let result = [...methods];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query)
      );
    }

    if (filterType) {
      result = result.filter(m => m.type === filterType);
    }

    if (filterStatus === 'active') {
      result = result.filter(m => m.isActive);
    } else if (filterStatus === 'inactive') {
      result = result.filter(m => !m.isActive);
    }

    setFilteredMethods(result.sort((a, b) => a.displayOrder - b.displayOrder));
  };

  // Function to open balance adjustment modal
  const handleEditBalance = (method) => {
    setSelectedMethod(method);
    setBalanceData({
      currentBalance: method.balance || 0,
      adjustmentAmount: '',
      newBalance: method.balance || 0,
      notes: '',
      adjustmentType: 'correction'
    });
    setShowBalanceModal(true);
  };

  // Fungtion to save balance adjustment
  const handleSaveBalance = async () => {
    try {
      setFormLoading(true);
      const newBalance = balanceData.adjustmentAmount
        ? balanceData.currentBalance + parseFloat(balanceData.adjustmentAmount)
        : balanceData.currentBalance;

      await updatePaymentMethodBalance(selectedMethod.id, {
        balance: newBalance,
        notes: balanceData.notes,
        adjustmentType: balanceData.adjustmentType,
        amount: parseFloat(balanceData.adjustmentAmount) || 0
      });

      toast.success('Saldo berhasil diperbarui');
      setShowBalanceModal(false);
      loadPaymentMethods();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getIconComponent = (iconName) => {
    const icon = iconOptions.find(opt => opt.value === iconName);
    return icon ? icon.component : Banknote;
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      code: '',
      name: '',
      type: 'cash',
      icon: 'DollarSign',
      color: 'bg-green-100 text-green-800',
      description: '',
      provider: '',
      accountNumber: '',
      accountHolder: '',
      bankCode: '',
      isActive: true,
      displayOrder: methods.length + 1
    });
    setShowModal(true);
  };

  const handleEdit = (method) => {
    setModalMode('edit');
    setSelectedMethod(method);
    setFormData({
      code: method.code,
      name: method.name,
      type: method.type,
      icon: method.icon,
      color: method.color,
      description: method.description,
      provider: method.provider || '',
      accountNumber: method.accountNumber || '',
      accountHolder: method.accountHolder || '',
      bankCode: method.bankCode || '',
      isActive: method.isActive,
      displayOrder: method.displayOrder
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);

      // Validation form
      if (!formData.name.trim()) {
        toast.error('Nama metode pembayaran harus diisi');
        return;
      }

      if (formData.type === 'bank') {
        if (!formData.bankCode) {
          toast.error('Pilih bank terlebih dahulu');
          return;
        }
        if (!formData.accountNumber.trim()) {
          toast.error('No. rekening harus diisi');
          return;
        }
        if (!formData.accountHolder.trim()) {
          toast.error('Nama pemilik rekening harus diisi');
          return;
        }
      }

      if (formData.type === 'ewallet' || formData.type === 'digital') {
        if (!formData.accountNumber.trim()) {
          toast.error('No. HP/ID E-Wallet harus diisi');
          return;
        }
        if (!formData.accountHolder.trim()) {
          toast.error('Nama penerima harus diisi');
          return;
        }
      }

      // Auto-generate code dari name jika kosong
      const finalData = {
        ...formData,
        code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '_')
      };

      if (modalMode === 'add') {
        await createPaymentMethod(finalData);
        toast.success('Metode pembayaran berhasil ditambahkan');
      } else {
        await updatePaymentMethod(selectedMethod.id, finalData);
        toast.success('Metode pembayaran berhasil diperbarui');
      }

      setShowModal(false);
      loadPaymentMethods();
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan metode pembayaran');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setFormLoading(true);
      await deletePaymentMethod(selectedMethod.id);
      toast.success('Metode pembayaran berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedMethod(null);
      loadPaymentMethods();
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus metode pembayaran');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (method) => {
    try {
      await togglePaymentMethodStatus(method.id);
      toast.success(`Metode pembayaran ${method.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      loadPaymentMethods();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const stats = {
    total: methods.length,
    active: methods.filter(m => m.isActive).length,
    totalBalance: methods.reduce((sum, m) => sum + (m.balance || 0), 0),
    cashBalance: methods.find(m => m.code === 'cash')?.balance || 0
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Metode Pembayaran</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola metode pembayaran dan monitor saldo</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Metode</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Aktif</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ToggleRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Saldo</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalBalance)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Saldo Tunai</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.cashBalance)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari metode pembayaran..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tipe</option>
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Metode
          </button>
        </div>
      </div>

      {/* Payment Methods Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMethods.map((method) => {
            const IconComponent = getIconComponent(method.icon);

            return (
              <div
                key={method.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${method.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{method.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{method.code}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(method)}
                    className="p-1 hover:bg-gray-100 dark:bg-gray-700 rounded transition-colors"
                  >
                    {method.isActive ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {method.description}
                </p>

                <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Saldo</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(method.balance || 0)}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                    {method.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {typeOptions.find(t => t.value === method.type)?.label}
                  </span>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleEdit(method)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMethod(method);
                      setShowDeleteDialog(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                  <button
                    onClick={() => handleEditBalance(method)}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit Saldo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredMethods.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-300">Tidak ada metode pembayaran ditemukan</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !formLoading && setShowModal(false)}
        title={`${modalMode === 'add' ? 'Tambah' : 'Edit'} Metode Pembayaran`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Metode
              </label>
              <select
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Auto Generate</option>
                <option value="cash">cash</option>
                <option value="bank">bank</option>
                <option value="gopay">gopay</option>
                <option value="dana">dana</option>
                <option value="ovo">ovo</option>
                <option value="qris">qris</option>
                <option value="custom">Custom</option>
              </select>

              {formData.code === 'custom' && (
                <input
                  type="text"
                  value={formData.customCode}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-2"
                  placeholder="Masukkan kode custom"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tunai, QRIS, GoPay"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi metode pembayaran"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {iconOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warna
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {colorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Fields Based on Type */}
          {formData.type === 'bank' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank *
                </label>
                <select
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Pilih Bank</option>
                  {INDONESIA_BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Rekening *
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="1234567890"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Pemilik *
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Koperasi Senyummu"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === 'digital' || formData.type === 'ewallet' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. HP/ID E-Wallet *
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Penerima *
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nama pemilik akun"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Aktifkan metode pembayaran ini
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={formLoading}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={formLoading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Saldo Modal */}
      <Modal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        title="Edit Saldo Metode Pembayaran"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="font-bold text-lg">{selectedMethod?.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Saldo saat ini: <span className="font-bold">{formatCurrency(balanceData.currentBalance)}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penyesuaian Saldo (Rp)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setBalanceData(prev => ({ ...prev, adjustmentType: 'add' }))}
                className={`px-3 py-2 rounded-lg ${balanceData.adjustmentType === 'add' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                Tambah
              </button>
              <button
                onClick={() => setBalanceData(prev => ({ ...prev, adjustmentType: 'subtract' }))}
                className={`px-3 py-2 rounded-lg ${balanceData.adjustmentType === 'subtract' ? 'bg-red-100 text-red-700' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                Kurangi
              </button>
            </div>

            <input
              type="number"
              value={balanceData.adjustmentAmount}
              onChange={(e) => {
                const amount = parseFloat(e.target.value) || 0;
                const newBalance = balanceData.currentBalance +
                  (balanceData.adjustmentType === 'subtract' ? -amount : amount);
                setBalanceData({
                  ...balanceData,
                  adjustmentAmount: e.target.value,
                  newBalance
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-2"
              placeholder="0"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-1">Saldo Baru:</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(balanceData.newBalance)}</p>
          </div>

          {/* Tombol aksi */}
        </div>
      </Modal>
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedMethod(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Metode Pembayaran"
        message={`Apakah Anda yakin ingin menghapus metode pembayaran "${selectedMethod?.name}"?`}
        type="danger"
        confirmText="Hapus"
        loading={formLoading}
      />
    </Layout>
  );
}