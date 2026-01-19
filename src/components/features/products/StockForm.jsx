import { useState, useEffect } from 'react';
import {
  PackagePlus, PackageMinus, RefreshCw, ArrowUpDown,
  Calendar, User, FileText, DollarSign, TrendingUp,
  CheckCircle, XCircle, AlertTriangle, Box
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { updateStock, getStockHistory } from '../../../services/productService';

export default function StockForm({
  product,
  onSubmit,
  onCancel,
  loading = false
}) {
  const [formData, setFormData] = useState({
    type: 'increase', // 'increase' or 'decrease'
    quantity: '',
    note: '',
    reference: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
    expiryDate: '' // New field for stock in
  });

  const [errors, setErrors] = useState({});
  const [stockHistory, setStockHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Expanded stockTypes with Dark Mode colors
  const stockTypes = [
    {
      value: 'increase',
      label: 'Tambah Stok',
      icon: PackagePlus,
      color: 'text-green-600',
      darkColor: 'text-green-400',
      bgColor: 'bg-green-50',
      darkBgColor: 'bg-green-900/20',
      borderColor: 'border-green-200',
      darkBorderColor: 'border-green-800'
    },
    {
      value: 'decrease',
      label: 'Kurangi Stok',
      icon: PackageMinus,
      color: 'text-red-600',
      darkColor: 'text-red-400',
      bgColor: 'bg-red-50',
      darkBgColor: 'bg-red-900/20',
      borderColor: 'border-red-200',
      darkBorderColor: 'border-red-800'
    },
    {
      value: 'adjustment',
      label: 'Penyesuaian',
      icon: RefreshCw,
      color: 'text-blue-600',
      darkColor: 'text-blue-400',
      bgColor: 'bg-blue-50',
      darkBgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-200',
      darkBorderColor: 'border-blue-800'
    },
    {
      value: 'initial',
      label: 'Stok Awal',
      icon: Box,
      color: 'text-gray-600',
      darkColor: 'text-gray-400',
      bgColor: 'bg-gray-50',
      darkBgColor: 'bg-gray-800',
      borderColor: 'border-gray-200',
      darkBorderColor: 'border-gray-700'
    },
    {
      value: 'purchase',
      label: 'Pembelian',
      icon: TrendingUp,
      color: 'text-purple-600',
      darkColor: 'text-purple-400',
      bgColor: 'bg-purple-50',
      darkBgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-200',
      darkBorderColor: 'border-purple-800'
    },
    {
      value: 'sale',
      label: 'Penjualan',
      icon: DollarSign,
      color: 'text-orange-600',
      darkColor: 'text-orange-400',
      bgColor: 'bg-orange-50',
      darkBgColor: 'bg-orange-900/20',
      borderColor: 'border-orange-200',
      darkBorderColor: 'border-orange-800'
    }
  ];

  useEffect(() => {
    if (product) {
      loadStockHistory();
    }
  }, [product]);

  const loadStockHistory = async () => {
    try {
      const history = await getStockHistory(product.id);
      setStockHistory(history);
    } catch (error) {
      console.error('Error loading stock history:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Allow only positive numbers
    if (value === '' || /^[0-9]*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        quantity: value
      }));

      if (errors.quantity) {
        setErrors(prev => ({ ...prev, quantity: '' }));
      }
    }
  };

  const handleQuickSet = (amount) => {
    setFormData(prev => ({
      ...prev,
      quantity: amount.toString()
    }));
  };

  const calculateNewStock = () => {
    const currentStock = product?.stock || 0;
    const quantity = parseInt(formData.quantity) || 0;

    if (formData.type === 'increase') {
      return currentStock + quantity;
    } else if (formData.type === 'decrease') {
      const newStock = currentStock - quantity;
      return newStock < 0 ? 0 : newStock;
    }
    return currentStock;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Jumlah harus lebih dari 0';
    }

    if (formData.type === 'decrease') {
      const currentStock = product?.stock || 0;
      const quantity = parseInt(formData.quantity) || 0;

      if (quantity > currentStock) {
        newErrors.quantity = `Jumlah tidak boleh melebihi stok saat ini (${currentStock} ${product?.unit?.name})`;
      }
    }

    if (!formData.adjustmentDate) {
      newErrors.adjustmentDate = 'Tanggal wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      quantity: parseInt(formData.quantity),
      type: formData.type
    };

    onSubmit(submitData);
  };

  // Helper functions for history display
  const getTypeInfo = (type) => {
    return stockTypes.find(t => t.value === type) || stockTypes[0];
  };

  const formatHistoryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const newStock = calculateNewStock();
  const currentStock = product?.stock || 0;
  const quantity = parseInt(formData.quantity) || 0;
  const typeInfo = getTypeInfo(formData.type);
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{product?.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{product?.sku}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{currentStock}</span>
              <span className="text-gray-500 dark:text-gray-400">{product?.unit?.name}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Stok saat ini</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Stok Minimum</p>
            <p className="font-semibold text-yellow-600 dark:text-yellow-400">{product?.minStock || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Harga Beli</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(product?.purchasePrice || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Harga Jual</p>
            <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(product?.sellingPrice || 0)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Stock Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Jenis Transaksi
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {stockTypes.slice(0, 3).map(type => {
              const Icon = type.icon;
              const isSelected = formData.type === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${isSelected
                    ? `${type.bgColor} dark:${type.darkBgColor} ${type.borderColor} dark:${type.darkBorderColor}`
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? `${type.color} dark:${type.darkColor}` : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Jumlah {typeInfo.label.toLowerCase()}
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleQuantityChange}
                  className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 ${errors.quantity
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="0"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 dark:text-gray-400">
                  {product?.unit?.name}
                </span>
              </div>

              <div className="flex gap-1">
                {[10, 50, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickSet(amt)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm border border-transparent dark:border-gray-600"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {errors.quantity && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.quantity}
              </p>
            )}
          </div>
        </div>

        {/* Stock Preview */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Perubahan Stok</span>
            <TypeIcon className={`w-5 h-5 ${typeInfo.color} dark:${typeInfo.darkColor}`} />
          </div>

          <div className="space-y-2 text-sm md:text-base">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Stok saat ini</span>
              <span className="font-semibold text-gray-900 dark:text-white">{currentStock} {product?.unit?.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {formData.type === 'increase' ? 'Ditambahkan' : 'Dikurangi'}
              </span>
              <span className={`font-semibold ${formData.type === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formData.type === 'increase' ? '+' : '-'}{quantity || 0} {product?.unit?.name}
              </span>
            </div>

            <div className="h-px bg-blue-200 dark:bg-blue-800 my-2"></div>

            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-semibold">Stok baru</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{newStock}</span>
                <span className="text-gray-500 dark:text-gray-400">{product?.unit?.name}</span>
              </div>
            </div>
          </div>

          {/* Stock Status */}
          {product?.minStock && newStock <= product.minStock && (
            <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${newStock === 0
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
              }`}>
              <AlertTriangle className="w-4 h-4" />
              <div>
                <p className="font-medium text-sm">
                  {newStock === 0
                    ? 'Stok akan Habis!'
                    : `Stok akan menjadi ${newStock} ${product?.unit?.name} (di bawah minimum ${product.minStock})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Adjustment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Tanggal Transaksi
          </label>
          <input
            type="date"
            name="adjustmentDate"
            value={formData.adjustmentDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${errors.adjustmentDate
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
              }`}
          />
          {errors.adjustmentDate && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.adjustmentDate}</p>
          )}
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Referensi (No. PO/Invoice)
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Contoh: PO/2024/001"
          />
        </div>

        {/* Expiry Date - Only for Stock In (Increase) */}
        {formData.type === 'increase' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Kadaluwarsa (Opsional)
            </label>
            <div className="relative">
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Isi jika produk memiliki masa berlaku (untuk FIFO)
            </p>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Keterangan
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Tambahkan catatan mengenai perubahan stok ini..."
          />
        </div>

        {/* Stock History Toggle */}
        {stockHistory.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowUpDown className="w-4 h-4" />
              {showHistory ? 'Sembunyikan' : 'Lihat'} Riwayat Stok ({stockHistory.length})
            </button>

            {showHistory && (
              <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-700 dark:text-gray-200">Riwayat Perubahan Stok</h4>
                </div>
                <div className="max-h-60 overflow-y-auto bg-white dark:bg-gray-800">
                  {stockHistory.map((history, index) => {
                    const typeInfo = getTypeInfo(history.type);
                    return (
                      <div
                        key={history.id || index}
                        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${typeInfo.bgColor} dark:${typeInfo.darkBgColor}`}>
                              <typeInfo.icon className={`w-4 h-4 ${typeInfo.color} dark:${typeInfo.darkColor}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {typeInfo.label}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatHistoryDate(history.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${history.type === 'increase'
                              ? 'text-green-600 dark:text-green-400'
                              : history.type === 'decrease'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                              }`}>
                              {history.type === 'increase' ? '+' : history.type === 'decrease' ? '-' : '±'}{history.quantity}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {history.previousStock} → {history.newStock}
                            </p>
                          </div>
                        </div>
                        {history.note && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 pl-7">{history.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !formData.quantity || parseInt(formData.quantity) <= 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
}