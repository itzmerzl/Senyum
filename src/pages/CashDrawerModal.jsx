import { useState } from 'react';
import { DollarSign, LogIn, LogOut, Lock, Unlock, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function CashDrawerModal({ 
  isOpen, 
  onClose, 
  mode, // 'open' or 'close'
  currentSession,
  onOpenDrawer,
  onCloseDrawer,
  loading = false 
}) {
  const [formData, setFormData] = useState({
    openingBalance: '',
    actualBalance: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'open') {
      // Validate opening balance
      const openingBalance = parseFloat(formData.openingBalance);
      if (isNaN(openingBalance) || openingBalance < 0) {
        setErrors({ openingBalance: 'Saldo awal tidak valid' });
        return;
      }
      
      onOpenDrawer({
        openingBalance,
        notes: formData.notes
      });
    } else {
      // Validate actual balance
      const actualBalance = parseFloat(formData.actualBalance);
      if (isNaN(actualBalance) || actualBalance < 0) {
        setErrors({ actualBalance: 'Saldo aktual tidak valid' });
        return;
      }
      
      onCloseDrawer({
        actualBalance,
        notes: formData.notes
      });
    }
  };
  
  const difference = currentSession 
    ? parseFloat(formData.actualBalance || 0) - currentSession.expectedBalance 
    : 0;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b ${mode === 'open' ? 'bg-green-50' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${mode === 'open' ? 'bg-green-100' : 'bg-blue-100'}`}>
              {mode === 'open' ? (
                <Unlock className={`w-6 h-6 ${mode === 'open' ? 'text-green-600' : 'text-blue-600'}`} />
              ) : (
                <Lock className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'open' ? 'Buka Kasir' : 'Tutup Kasir'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'open' 
                  ? 'Masukkan saldo awal untuk memulai shift' 
                  : 'Hitung uang tunai untuk menutup shift'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {mode === 'open' ? (
            // OPEN DRAWER FORM
            <div className="space-y-4">
              {/* Opening Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Awal Tunai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border ${errors.openingBalance ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-medium`}
                    placeholder="0"
                    min="0"
                    step="1000"
                    autoFocus
                  />
                </div>
                {errors.openingBalance && (
                  <p className="text-sm text-red-600 mt-1">{errors.openingBalance}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 Masukkan jumlah uang tunai di kasir saat ini
                </p>
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 200000, 500000, 1000000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, openingBalance: amount.toString() }))}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Catatan pembukaan kasir..."
                ></textarea>
              </div>
            </div>
          ) : (
            // CLOSE DRAWER FORM
            <div className="space-y-4">
              {/* Session Info */}
              {currentSession && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Saldo Awal</span>
                    <span className="font-medium">{formatCurrency(currentSession.openingBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Tunai</span>
                    <span className="font-medium text-green-600">{formatCurrency(currentSession.totalCash || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Kartu</span>
                    <span className="font-medium text-blue-600">{formatCurrency(currentSession.totalCard || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total QRIS</span>
                    <span className="font-medium text-purple-600">{formatCurrency(currentSession.totalQris || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600">Transaksi</span>
                    <span className="font-medium">{currentSession.totalTransactions || 0} transaksi</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-700 font-medium">Saldo Yang Diharapkan</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(currentSession.expectedBalance || 0)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Actual Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Aktual (Hitung Tunai) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="actualBalance"
                    value={formData.actualBalance}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border ${errors.actualBalance ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium`}
                    placeholder="0"
                    min="0"
                    step="1000"
                    autoFocus
                  />
                </div>
                {errors.actualBalance && (
                  <p className="text-sm text-red-600 mt-1">{errors.actualBalance}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 Hitung semua uang tunai yang ada di kasir
                </p>
              </div>
              
              {/* Difference Alert */}
              {formData.actualBalance && currentSession && (
                <div className={`p-4 rounded-lg ${
                  Math.abs(difference) < 1000 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Selisih</span>
                    <span className={`text-lg font-bold ${
                      difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {difference > 0 ? '+' : ''}{formatCurrency(Math.abs(difference))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {Math.abs(difference) < 1000 
                      ? '✅ Saldo sesuai!' 
                      : difference > 0 
                        ? '⚠️ Ada kelebihan uang'
                        : '⚠️ Ada kekurangan uang'}
                  </p>
                </div>
              )}
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Penutupan
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Catatan penutupan kasir (opsional)..."
                ></textarea>
              </div>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                mode === 'open' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  {mode === 'open' ? (
                    <>
                      <LogIn className="w-5 h-5" />
                      Buka Kasir
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" />
                      Tutup Kasir
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}