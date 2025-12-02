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
    adjustmentDate: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  const [stockHistory, setStockHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const stockTypes = [
    { value: 'increase', label: 'Tambah Stok', icon: PackagePlus, color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'decrease', label: 'Kurangi Stok', icon: PackageMinus, color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'adjustment', label: 'Penyesuaian', icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { value: 'initial', label: 'Stok Awal', icon: Box, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    { value: 'purchase', label: 'Pembelian', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { value: 'sale', label: 'Penjualan', icon: DollarSign, color: 'text-orange-600', bgColor: 'bg-orange-50' }
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
        newErrors.quantity = `Jumlah tidak boleh melebihi stok saat ini (${currentStock} ${product?.unit})`;
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
  
  const getHistoryIcon = (type) => {
    const typeInfo = getTypeInfo(type);
    const Icon = typeInfo.icon;
    return <Icon className="w-4 h-4" />;
  };
  
  const getHistoryColor = (type) => {
    const typeInfo = getTypeInfo(type);
    return typeInfo.color;
  };
  
  const newStock = calculateNewStock();
  const currentStock = product?.stock || 0;
  const quantity = parseInt(formData.quantity) || 0;
  const typeInfo = getTypeInfo(formData.type);
  const TypeIcon = typeInfo.icon;
  
  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{product?.name}</h3>
            <p className="text-sm text-gray-600">{product?.sku}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{currentStock}</span>
              <span className="text-gray-500">{product?.unit}</span>
            </div>
            <p className="text-xs text-gray-500">Stok saat ini</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Stok Minimum</p>
            <p className="font-semibold text-yellow-600">{product?.minStock || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Harga Beli</p>
            <p className="font-semibold text-gray-900">{formatCurrency(product?.purchasePrice || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Harga Jual</p>
            <p className="font-semibold text-green-600">{formatCurrency(product?.sellingPrice || 0)}</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Stock Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? `${type.bgColor} border-${type.color.replace('text-', '')}`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${type.color}`} />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full pl-4 pr-12 py-3 border ${errors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium`}
                  placeholder="0"
                />
                <span className="absolute right-4 top-3 text-gray-500">
                  {product?.unit}
                </span>
              </div>
              
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickSet(10)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                >
                  10
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSet(50)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                >
                  50
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSet(100)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                >
                  100
                </button>
              </div>
            </div>
            
            {errors.quantity && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.quantity}
              </p>
            )}
          </div>
        </div>
        
        {/* Stock Preview */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700 font-medium">Perubahan Stok</span>
            <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Stok saat ini</span>
              <span className="font-semibold">{currentStock} {product?.unit}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                {formData.type === 'increase' ? 'Ditambahkan' : 'Dikurangi'}
              </span>
              <span className={`font-semibold ${formData.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {formData.type === 'increase' ? '+' : '-'}{quantity || 0} {product?.unit}
              </span>
            </div>
            
            <div className="h-px bg-blue-200 my-2"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-semibold">Stok baru</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-700">{newStock}</span>
                <span className="text-gray-500">{product?.unit}</span>
              </div>
            </div>
          </div>
          
          {/* Stock Status */}
          {product?.minStock && newStock <= product.minStock && (
            <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
              newStock === 0 
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <div>
                <p className="font-medium">
                  {newStock === 0 
                    ? 'Stok akan Habis!' 
                    : `Stok akan menjadi ${newStock} ${product?.unit} (di bawah minimum ${product.minStock})`}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Adjustment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Tanggal Transaksi
          </label>
          <input
            type="date"
            name="adjustmentDate"
            value={formData.adjustmentDate}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border ${errors.adjustmentDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
          {errors.adjustmentDate && (
            <p className="text-sm text-red-600 mt-1">{errors.adjustmentDate}</p>
          )}
        </div>
        
        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Referensi (No. PO/Invoice)
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contoh: PO/2024/001"
          />
        </div>
        
        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keterangan
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tambahkan catatan mengenai perubahan stok ini..."
          />
        </div>
        
        {/* Stock History Toggle */}
        {stockHistory.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ArrowUpDown className="w-4 h-4" />
              {showHistory ? 'Sembunyikan' : 'Lihat'} Riwayat Stok ({stockHistory.length})
            </button>
            
            {showHistory && (
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-700">Riwayat Perubahan Stok</h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {stockHistory.map((history, index) => (
                    <div 
                      key={history.id || index}
                      className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${getHistoryInfo(history.type).bgColor}`}>
                            {getHistoryIcon(history.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getHistoryInfo(history.type).label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatHistoryDate(history.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            history.type === 'increase' 
                              ? 'text-green-600' 
                              : history.type === 'decrease'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}>
                            {history.type === 'increase' ? '+' : history.type === 'decrease' ? '-' : '±'}{history.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            {history.previousStock} → {history.newStock}
                          </p>
                        </div>
                      </div>
                      {history.note && (
                        <p className="text-xs text-gray-600 mt-2 pl-7">{history.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
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
      
      {/* Helper functions */}
      {(() => {
        const getHistoryInfo = (type) => {
          return stockTypes.find(t => t.value === type) || stockTypes[0];
        };
        
        const getHistoryIcon = (type) => {
          const typeInfo = getHistoryInfo(type);
          const Icon = typeInfo.icon;
          return <Icon className="w-4 h-4" />;
        };
        
        return null;
      })()}
    </div>
  );
}