import { useState, useEffect } from 'react';
import { 
  Receipt, Search, Download, Eye, X, Calendar, 
  CreditCard, Banknote, Smartphone, Filter, 
  ChevronDown, ChevronUp, ShoppingCart, User,
  TrendingUp, DollarSign, RotateCcw, Printer,
  CircleCheck, CircleX
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import { 
  getAllTransactions, 
  getTransactionStats,
  exportTransactions,
  getTransactionByInvoice,
  cancelTransaction
} from '../services/transactionService';
import { formatCurrency, capitalizeFirst } from '../utils/formatters';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    customerType: '',
    status: 'completed',
    itemsPerPage: 25
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  
  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, []);
  
  useEffect(() => {
    filterTransactions();
  }, [searchQuery, filters, transactions]);
  
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (error) {
      toast.error('Gagal memuat data transaksi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const data = await getTransactionStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const filterTransactions = () => {
    let result = [...transactions];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.invoiceNumber.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query) ||
        (t.cashierName && t.cashierName.toLowerCase().includes(query))
      );
    }
    
    // Date range filter
    if (filters.startDate) {
      result = result.filter(t => 
        new Date(t.transactionDate) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(t => 
        new Date(t.transactionDate) <= endDate
      );
    }
    
    // Payment method filter
    if (filters.paymentMethod) {
      result = result.filter(t => t.paymentMethod === filters.paymentMethod);
    }
    
    // Customer type filter
    if (filters.customerType) {
      result = result.filter(t => t.customerType === filters.customerType);
    }
    
    // Status filter
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    
    // Limit items
    if (filters.itemsPerPage < 1000) {
      result = result.slice(0, filters.itemsPerPage);
    }
    
    setFilteredTransactions(result);
  };

  const handleCancelTransaction = async () => {
    try {
      await cancelTransaction(selectedTransaction.id, cancelReason);
      toast.success('Transaksi berhasil dibatalkan');
      setShowCancelModal(false);
      setCancelReason('');
      loadTransactions(); // Refresh data
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const handleExport = async () => {
    try {
      const data = await exportTransactions({
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod,
        status: filters.status
      });
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
      XLSX.writeFile(wb, `transaksi-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data berhasil diexport');
    } catch (error) {
      toast.error('Gagal export data');
      console.error(error);
    }
  };
  
  const handlePrintReceipt = (transaction) => {
    const printWindow = window.open('', '_blank', 'width=300,height=500');
    
    const itemsHtml = transaction.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px;">
        <div style="flex: 1;">
          <div style="font-weight: 600;">${item.productName}</div>
          <div style="color: #666;">${item.quantity} x ${formatCurrency(item.price)}</div>
        </div>
        <div style="font-weight: 600;">${formatCurrency(item.subtotal)}</div>
      </div>
    `).join('');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk - ${transaction.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              padding: 10px;
              font-size: 12px;
            }
            .receipt {
              width: 280px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h2 {
              font-size: 16px;
              margin-bottom: 5px;
            }
            .info {
              font-size: 11px;
              margin-bottom: 10px;
            }
            .line {
              border-bottom: 1px dashed #000;
              margin: 10px 0;
            }
            .total {
              font-size: 14px;
              font-weight: bold;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px dashed #000;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>KOPERASI SENYUMMU</h2>
              <div>Jember, East Java</div>
              <div>Telp: 082245344633</div>
            </div>
            
            <div class="info">
              <div style="display: flex; justify-content: space-between;">
                <span>No Invoice:</span>
                <strong>${transaction.invoiceNumber}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Tanggal:</span>
                <span>${new Date(transaction.transactionDate).toLocaleString('id-ID')}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Kasir:</span>
                <span>${transaction.cashierName || 'Admin'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Pelanggan:</span>
                <span>${transaction.customerName}</span>
              </div>
            </div>
            
            <div class="line"></div>
            
            <div class="items">
              ${itemsHtml}
            </div>
            
            <div class="line"></div>
            
            <div style="font-size: 12px;">
              <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Subtotal:</span>
                <span>${formatCurrency(transaction.subtotal)}</span>
              </div>
              ${transaction.tax > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                  <span>Pajak:</span>
                  <span>${formatCurrency(transaction.tax)}</span>
                </div>
              ` : ''}
              ${transaction.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                  <span>Diskon:</span>
                  <span>-${formatCurrency(transaction.discount)}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="total">
              <div style="display: flex; justify-content: space-between;">
                <span>TOTAL:</span>
                <span>${formatCurrency(transaction.total)}</span>
              </div>
            </div>
            
            <div style="font-size: 12px; margin-top: 10px;">
              <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Pembayaran:</span>
                <span>${capitalizeFirst(transaction.paymentMethod)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Dibayar:</span>
                <span>${formatCurrency(transaction.paidAmount)}</span>
              </div>
              ${transaction.changeAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                  <span>Kembali:</span>
                  <span>${formatCurrency(transaction.changeAmount)}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <div>Terima kasih atas kunjungan Anda!</div>
              <div style="margin-top: 5px;">Barang yang sudah dibeli tidak dapat dikembalikan</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentMethod: '',
      customerType: '',
      status: 'completed',
      itemsPerPage: 25
    });
    setSearchQuery('');
  };
  
  const activeFilterCount = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.paymentMethod) count++;
    if (filters.customerType) count++;
    if (filters.status !== 'completed') count++;
    if (searchQuery) count++;
    return count;
  };
  
  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'qris': return <Smartphone className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };
  
  const getPaymentColor = (method) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'qris': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (method) => {
    switch (method) {
      case 'completed': return <CircleCheck className="w-4 h-4" />;
      default: return <CircleX className="w-4 h-4" />;
    }
  };
  
  return (
    <Layout>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rata-rata Transaksi</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.averageTransaction)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dibatalkan</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelledTransactions}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
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
              placeholder="Cari no invoice, pelanggan, atau kasir..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount()}
                </span>
              )}
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
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Metode Bayar</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Semua</option>
                  <option value="cash">Tunai</option>
                  <option value="card">Kartu</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Pelanggan</label>
                <select
                  value={filters.customerType}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Semua</option>
                  <option value="general">Umum</option>
                  <option value="student">Santri</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Semua</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tampilkan</label>
                <select
                  value={filters.itemsPerPage}
                  onChange={(e) => setFilters(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={25}>25 item</option>
                  <option value={50}>50 item</option>
                  <option value={100}>100 item</option>
                  <option value={1000}>Semua</option>
                </select>
              </div>
            </div>
            
            {activeFilterCount() > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Reset Filter ({activeFilterCount()})
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">No Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pelanggan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pembayaran</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="spinner"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <Receipt className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Tidak ada transaksi</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const isExpanded = expandedTransaction === transaction.id;
                  
                  return (
                    <>
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-blue-600">{transaction.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.items?.length || 0} item
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {new Date(transaction.transactionDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{transaction.customerName}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.customerType === 'student' ? 'Santri' : 'Umum'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {formatCurrency(transaction.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(transaction.paymentMethod)}`}>
                            {getPaymentIcon(transaction.paymentMethod)}
                            {capitalizeFirst(transaction.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getStatusIcon(transaction.status)}
                            {transaction.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowDetailModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {transaction.status === 'completed' && (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowCancelModal(true);
                                }}
                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                                title="Batalkan"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintReceipt(transaction)}
                              className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                              title="Cetak Struk"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedTransaction(isExpanded ? null : transaction.id)}
                              className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="7" className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 mb-2 font-medium">Items:</p>
                                {transaction.items?.map((item, idx) => (
                                  <div key={idx} className="flex justify-between py-1">
                                    <span>{item.productName} x{item.quantity}</span>
                                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Kasir:</span>
                                  <span className="font-medium">{transaction.cashierName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Dibayar:</span>
                                  <span className="font-medium">{formatCurrency(transaction.paidAmount)}</span>
                                </div>
                                {transaction.changeAmount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Kembalian:</span>
                                    <span className="font-medium text-green-600">{formatCurrency(transaction.changeAmount)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
            </p>
          </div>
          )}
      </div>
      
      {/* Detail Transaction Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Transaksi"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">No Invoice</p>
                  <p className="font-bold text-lg">{selectedTransaction.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-medium">
                    {new Date(selectedTransaction.transactionDate).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pelanggan</p>
                  <p className="font-medium">{selectedTransaction.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {selectedTransaction.customerType === 'student' ? 'Santri' : 'Umum'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kasir</p>
                  <p className="font-medium">{selectedTransaction.cashierName || 'Admin'}</p>
                </div>
              </div>
            </div>
            
            {/* Items Table */}
            <div className="border rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <p className="font-medium text-gray-700">Items</p>
              </div>
              <div className="divide-y">
                {selectedTransaction.items?.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-bold">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.tax)}</span>
                  </div>
                )}
                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-gray-600">Diskon</span>
                    <span className="font-medium">-{formatCurrency(selectedTransaction.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedTransaction.total)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Pembayaran</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(selectedTransaction.paymentMethod)}`}>
                    {getPaymentIcon(selectedTransaction.paymentMethod)}
                    {selectedTransaction.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTransaction.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedTransaction.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                </span>
              </div>
            </div>
            
            {/* Amount Details */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dibayar</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.paidAmount)}</span>
                </div>
                {selectedTransaction.changeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kembalian</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedTransaction.changeAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  handlePrintReceipt(selectedTransaction);
                  setShowDetailModal(false);
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Cetak Ulang Struk
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Transaction Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Batalkan Transaksi"
        size="sm"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Anda akan membatalkan transaksi
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Invoice: <span className="font-medium">{selectedTransaction.invoiceNumber}</span>
                  </p>
                  <p className="text-sm text-red-600">
                    Total: <span className="font-medium">{formatCurrency(selectedTransaction.total)}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Pembatalan *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Masukkan alasan pembatalan transaksi..."
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleCancelTransaction}
                disabled={!cancelReason.trim()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batalkan Transaksi
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}