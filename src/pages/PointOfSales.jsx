import { useState, useEffect, useRef } from 'react';
import { Landmark, Building2, QrCode, Wallet, Search, Plus, Minus, Trash2, ShoppingCart, DollarSign, User, CreditCard, Banknote, Smartphone, Printer, X, Scan, Package } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import { getAllProducts } from '../services/productService';
import { createTransaction } from '../services/transactionService';
import { getAllStudents } from '../services/studentService';
import { formatCurrency } from '../utils/formatters';
import midtransService from '../services/midtransService';
import toast from 'react-hot-toast';

export default function PointOfSales() {
  const [products, setProducts] = useState([]);
  const [students, setStudents] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerType, setCustomerType] = useState('general');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const [midtransTransaction, setMidtransTransaction] = useState(null);
  const [paymentPolling, setPaymentPolling] = useState(null);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankProofImage, setBankProofImage] = useState(null);
  const [showEwalletModal, setShowEwalletModal] = useState(false);
  const [selectedEwallet, setSelectedEwallet] = useState('');

  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const paymentInputRef = useRef(null);
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const tax = 0; // Can be configured from settings
  const total = subtotal + tax;
  
  useEffect(() => {
    loadProducts();
    loadStudents();
  }, []);
  
  const loadProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data.filter(p => p.isActive && p.stock > 0));
    } catch (error) {
      toast.error('Gagal memuat data produk');
      console.error(error);
    }
  };
  
  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const data = await getAllStudents();
      setStudents(data.filter(s => s.status === 'active'));
      setFilteredStudents(data.filter(s => s.status === 'active'));
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data santri');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (students.length > 0) {
      filterStudents();
    }
  }, [studentSearch, students]);

  const filterStudents = () => {
    if (!studentSearch.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const searchTerm = studentSearch.toLowerCase();
    const filtered = students.filter(student => 
      student.fullName.toLowerCase().includes(searchTerm) ||
      student.registrationNumber.toLowerCase().includes(searchTerm) ||
      (student.className && student.className.toLowerCase().includes(searchTerm))
    );
    
    setFilteredStudents(filtered);
  };

  // Get unique categories with names (from products that already have categoryName)
  const uniqueCategories = [...new Set(products.map(p => p.categoryId))].filter(Boolean);
  const categoryOptions = uniqueCategories.map(catId => {
    const product = products.find(p => p.categoryId === catId);
    return {
      id: catId,
      name: product?.categoryName || product?.category || `Kategori ${catId}`
    };
  });
  
  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === 'all' || Number(p.categoryId) === Number(selectedCategory);
    return matchSearch && matchCategory;
  });

  // Midtrans Payment Handler
  const processMidtransPayment = async (paymentType = 'qris') => {
    try {
      setProcessing(true);
      
      // Generate order ID
      const orderId = `ORDER${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Prepare items for Midtrans
      const items = cart.map(item => ({
        id: item.id.toString(),
        price: item.sellingPrice,
        quantity: item.quantity,
        name: item.name.substring(0, 50) // Max 50 chars for Midtrans
      }));
      
      // Customer info
      const customerName = customerType === 'student' ? 
        selectedStudent?.fullName : 'Umum';
      
      // Create Midtrans transaction
      const transaction = await midtransService.createMidtransTransaction({
        orderId,
        amount: total, // <-- total sudah didefinisikan di atas
        customerName,
        paymentMethod: paymentType, // 'qris', 'gopay', 'shopeepay', etc
        items
      });
      
      setMidtransTransaction(transaction);
      
      // Jika QRIS, tampilkan modal dengan QR code
      if (paymentType === 'qris') {
        setShowQRISModal(true);
        
        // Start polling untuk cek status
        startPaymentPolling(orderId);
      } 
      // Jika GoPay, redirect ke URL atau show deeplink
      else if (paymentType === 'gopay') {
        window.open(transaction.redirect_url, '_blank');
        startPaymentPolling(orderId);
      }
      
      setShowPaymentModal(false);
      
    } catch (error) {
      toast.error(error.message || 'Gagal memproses pembayaran');
      setProcessing(false);
    }
  };

  // Fungsi untuk menyelesaikan transaksi Midtrans
  const completeMidtransTransaction = async (transactionData) => {
    try {
      const result = await createTransaction(transactionData);
      
      toast.success('Pembayaran berhasil!');
      printReceipt(result);
      
      // Reset
      clearCart();
      setShowQRISModal(false);
      setShowPaymentModal(false);
      setPaidAmount('');
      loadProducts();
      
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan transaksi');
    }
  };

  // Start polling untuk cek status pembayaran
  const startPaymentPolling = (orderId) => {
    // Clear existing polling
    if (paymentPolling) {
      clearInterval(paymentPolling);
    }
    
    const poll = setInterval(async () => {
      try {
        const status = await midtransService.checkTransactionStatus(orderId);
        
        if (status.transaction_status === 'settlement') {
          // Payment success
          clearInterval(poll);
          setPaymentPolling(null);
          
          await completeMidtransTransaction({
            items: cart.map(item => ({
              productId: item.id,
              productName: item.name,
              quantity: item.quantity,
              price: item.sellingPrice,
              subtotal: item.sellingPrice * item.quantity
            })),
            customerType,
            customerId: customerType === 'student' ? selectedStudent?.id : null,
            customerName: customerType === 'student' ? selectedStudent?.fullName : 'Umum',
            subtotal,
            tax,
            total,
            paymentMethod: midtransTransaction?.payment_method || 'qris',
            paidAmount: total,
            changeAmount: 0,
            paymentReference: orderId,
            notes: `Midtrans - ${midtransTransaction?.payment_method?.toUpperCase()}`,
            metadata: {
              provider: 'midtrans',
              transaction_status: status.transaction_status,
              payment_type: status.payment_type
            }
          });
          
          toast.success('Pembayaran berhasil!');
          
        } else if (['cancel', 'deny', 'expire'].includes(status.transaction_status)) {
          // Payment failed
          clearInterval(poll);
          setPaymentPolling(null);
          toast.error('Pembayaran gagal atau dibatalkan');
        }
        // Jika masih pending, lanjut polling
        
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll setiap 3 detik
    
    setPaymentPolling(poll);
    
    // Auto stop setelah 15 menit
    setTimeout(() => {
      if (poll) {
        clearInterval(poll);
        setPaymentPolling(null);
        toast.error('Waktu pembayaran habis');
      }
    }, 15 * 60 * 1000);
  };
  
  // Handle barcode scan
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      const product = products.find(p => p.barcode === barcodeInput.trim());
      if (product) {
        addToCart(product);
        setBarcodeInput('');
        toast.success(`${product.name} ditambahkan`);
      } else {
        toast.error('Produk tidak ditemukan');
        setBarcodeInput('');
      }
    }
  };
  
  // Add to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Stok tidak mencukupi');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };
  
  // Update quantity
  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (newQuantity > product.stock) {
      toast.error('Stok tidak mencukupi');
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };
  
  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedStudent(null);
    setCustomerType('general');
  };

  // Bank options
  const bankOptions = [
    { id: 'mandiri', name: 'Mandiri' },
    { id: 'bni', name: 'BNI' },
    { id: 'bri', name: 'BRI' },
    { id: 'muamalat', name: 'Muamalat' }
  ];

  // E-wallet options
  const ewalletOptions = [
    { id: 'gopay', name: 'GoPay', color: 'bg-purple-100 text-purple-800', icon: Smartphone },
    { id: 'shopeepay', name: 'ShopeePay', color: 'bg-orange-100 text-orange-800', icon: CreditCard },
    { id: 'dana', name: 'Dana', color: 'bg-blue-100 text-blue-800', icon: Wallet },
    { id: 'ovo', name: 'OVO', color: 'bg-green-100 text-green-800', icon: Smartphone },
    { id: 'linkaja', name: 'LinkAja', color: 'bg-yellow-100 text-yellow-800', icon: CreditCard }
  ];
  
  // Handle payment
  const handlePayment = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    
    if (customerType === 'student' && !selectedStudent) {
      toast.error('Pilih santri terlebih dahulu');
      return;
    }
    
    setShowPaymentModal(true);
    setPaidAmount('');
  };
  
  const processCashPayment = async () => {
    if (!paidAmount || parseFloat(paidAmount) < total) {
      toast.error('Jumlah pembayaran kurang');
      return;
    }
    
    try {
      setProcessing(true);
      
      const transactionData = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.sellingPrice,
          subtotal: item.sellingPrice * item.quantity
        })),
        customerType,
        customerId: customerType === 'student' ? selectedStudent?.id : null,
        customerName: customerType === 'student' ? selectedStudent?.fullName : 'Umum',
        subtotal,
        tax,
        total,
        paymentMethod: 'cash',
        paidAmount: parseFloat(paidAmount),
        changeAmount: parseFloat(paidAmount) - total
      };
      
      const result = await createTransaction(transactionData);
      
      toast.success('Transaksi berhasil!');
      printReceipt(result);
      
      // Reset
      clearCart();
      setShowPaymentModal(false);
      setPaidAmount('');
      loadProducts();
      
    } catch (error) {
      toast.error(error.message || 'Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  const processPayment = async () => {
    if (paymentMethod === 'cash') {
      await processCashPayment();
    } else if (paymentMethod === 'bank_transfer') {
      setShowBankTransferModal(true);
      setShowPaymentModal(false);
    } else if (['gopay', 'shopeepay', 'dana', 'ovo', 'linkaja'].includes(paymentMethod)) {
      // E-wallet via Midtrans
      await processMidtransPayment(paymentMethod);
    } else if (paymentMethod === 'qris') {
      // QRIS via Midtrans
      await processMidtransPayment('qris');
    }
  };

  const processBankTransfer = async () => {
    if (!selectedBank || !bankAccountNumber || !bankAccountName) {
      toast.error('Harap lengkapi data bank');
      return;
    }

    try {
      setProcessing(true);
      
      const transactionData = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.sellingPrice,
          subtotal: item.sellingPrice * item.quantity
        })),
        customerType,
        customerId: customerType === 'student' ? selectedStudent?.id : null,
        customerName: customerType === 'student' ? selectedStudent?.fullName : 'Umum',
        subtotal,
        tax,
        total,
        paymentMethod: 'Transfer',
        paymentDetails: {
          bank: selectedBank,
          accountNumber: bankAccountNumber,
          accountName: bankAccountName,
          proofImage: bankProofImage
        },
        paidAmount: total,
        changeAmount: 0,
        status: 'pending' // Menunggu konfirmasi admin
      };
      
      const result = await createTransaction(transactionData);
      
      toast.success('Transaksi berhasil! Menunggu konfirmasi pembayaran');
      printReceipt(result);
      
      // Reset
      clearCart();
      setShowBankTransferModal(false);
      resetBankForm();
      loadProducts();
      
    } catch (error) {
      toast.error(error.message || 'Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  // Reset bank form
  const resetBankForm = () => {
    setSelectedBank('');
    setBankAccountNumber('');
    setBankAccountName('');
    setBankProofImage(null);
  };
  
  const printReceipt = (transaction) => {
    // Simple receipt print logic
    const receiptContent = `
      ================================
      KOPERASI SENYUMMU
      Jember, East Java
      ================================
      
      No Invoice: ${transaction.invoiceNumber}
      Tanggal: ${new Date(transaction.transactionDate).toLocaleString('id-ID')}
      Kasir: ${transaction.cashierName || 'Admin'}
      
      --------------------------------
      ITEM
      --------------------------------
      ${transaction.items.map(item => `
      ${item.productName}
      ${item.quantity} x ${formatCurrency(item.price)}
                        ${formatCurrency(item.subtotal)}
      `).join('')}
      --------------------------------
      
      Subtotal:     ${formatCurrency(transaction.subtotal)}
      Pajak:        ${formatCurrency(transaction.tax)}
      Total:        ${formatCurrency(transaction.total)}
      
      Bayar:        ${formatCurrency(transaction.paidAmount)}
      Kembali:      ${formatCurrency(transaction.changeAmount)}
      
      ================================
      Terima kasih atas kunjungan Anda!
      ================================
    `;
    
    console.log(receiptContent);
    // In production, integrate with thermal printer
  };
  
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Side - Products */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          {/* Barcode Scanner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode atau ketik kode..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Cari
              </button>
            </form>
          </div>
          
          {/* Search & Category Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex gap-3 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              {categoryOptions.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === String(cat.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Package className="w-16 h-16 mb-2 opacity-50" />
                  <p>Tidak ada produk</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-3 text-left transition-all hover:shadow-md group relative"
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        Stok: {product.stock} {product.unit}
                      </p>
                      <p className="text-blue-600 font-bold">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Side - Cart */}
        <div className="flex flex-col space-y-4">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => {
                  setCustomerType('general');
                  setSelectedStudent(null);
                  setStudentSearch('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                  customerType === 'general'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Umum
              </button>
              <button
                onClick={() => setCustomerType('student')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                  customerType === 'student'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Santri
              </button>
            </div>
            
            {customerType === 'student' && (
              <div className="relative">
                {/* Search Input */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari nama santri..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {studentSearch && (
                    <button
                      onClick={() => {
                        setStudentSearch('');
                        setSelectedStudent(null);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                
                {/* Student List */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {loadingStudents ? (
                      <div className="p-4 text-center">
                        <div className="spinner mx-auto"></div>
                        <p className="text-xs text-gray-500 mt-2">Memuat daftar santri...</p>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {studentSearch ? 'Santri tidak ditemukan' : 'Tidak ada santri aktif'}
                      </div>
                    ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredStudents.map(student => (
                        <button
                          key={student.id}
                          onClick={() => {
                            setSelectedStudent(student);
                            setStudentSearch(student.fullName);
                          }}
                          className={`w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                            selectedStudent?.id === student.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {student.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.registrationNumber} • Kelas {student.className || 'Kelas belum diatur'}
                            </p>
                          </div>
                          {selectedStudent?.id === student.id && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <h2 className="font-bold text-gray-900">Keranjang ({cart.length})</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Hapus Semua
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart className="w-16 h-16 mb-2 opacity-50" />
                  <p>Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm text-gray-900 flex-1 pr-2">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.sellingPrice)} x {item.quantity}
                          </p>
                          <p className="font-bold text-blue-600">
                            {formatCurrency(item.sellingPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Totals */}
            <div className="border-t border-gray-200 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pajak</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
              
              <button
                onClick={handlePayment}
                disabled={cart.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative group"
                title="F1 untuk cepat"
              >
                <DollarSign className="w-5 h-5" />
                Bayar
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  F1
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => !processing && setShowPaymentModal(false)}
        title="Pembayaran"
        size="lg"
      >
        <div className="space-y-6">
          {/* Total */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</p>
          </div>
          
          {/* Payment Method Tabs */}
          <div>
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4" aria-label="Tabs">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Banknote className="inline-block w-4 h-4 mr-2" />
                  Tunai
                </button>
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building2 className="inline-block w-4 h-4 mr-2" />
                  Bank Transfer
                </button>
                <button
                  onClick={() => setPaymentMethod('qris')}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
                    paymentMethod === 'qris'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <QrCode className="inline-block w-4 h-4 mr-2" />
                  QRIS
                </button>
                <button
                  onClick={() => setPaymentMethod('ewallet')}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
                    paymentMethod.startsWith('gopay') || 
                    paymentMethod.startsWith('shopeepay') ||
                    paymentMethod.startsWith('dana') ||
                    paymentMethod.startsWith('ovo') ||
                    paymentMethod.startsWith('linkaja')
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Smartphone className="inline-block w-4 h-4 mr-2" />
                  E-Wallet
                </button>
              </nav>
            </div>

            {/* Cash Payment */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Dibayar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      Rp
                    </span>
                    <input
                      ref={paymentInputRef}
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[10000, 20000, 50000, 100000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setPaidAmount(amount.toString())}
                      className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
                
                {/* Change */}
                {paidAmount && parseFloat(paidAmount) >= total && (
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Kembalian</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(parseFloat(paidAmount) - total)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bank Transfer Info */}
            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-4 pt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Transfer ke Rekening Koperasi:
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      • <strong>BRI:</strong> 1234567890 a.n. Koperasi Senyummu
                    </p>
                    <p className="text-sm text-gray-600">
                      • <strong>BNI:</strong> 1122334455 a.n. Koperasi Senyummu
                    </p>
                    <p className="text-sm text-gray-600">
                      • <strong>Mandiri:</strong> 0987654321 a.n. Koperasi Senyummu
                    </p>
                    <p className="text-sm text-gray-600">
                      • <strong>Muamalat:</strong> 1122334455 a.n. Koperasi Senyummu
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Harap unggah bukti transfer pada langkah berikutnya
                  </p>
                </div>
              </div>
            )}

            {/* QRIS Info */}
            {paymentMethod === 'qris' && (
              <div className="space-y-4 pt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <Scan className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p className="text-lg font-bold text-green-700 text-center">QRIS via Midtrans</p>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Scan QR code dengan e-wallet apapun (GoPay, OVO, Dana, ShopeePay, LinkAja, atau mobile banking)
                  </p>
                </div>
              </div>
            )}

            {/* E-Wallet Selection */}
            {(paymentMethod === 'ewallet' || 
              paymentMethod.startsWith('gopay') || 
              paymentMethod.startsWith('shopeepay') ||
              paymentMethod.startsWith('dana') ||
              paymentMethod.startsWith('ovo') ||
              paymentMethod.startsWith('linkaja')) && (
              <div className="space-y-4 pt-4">
                <p className="text-sm font-medium text-gray-700">Pilih E-Wallet:</p>
                <div className="grid grid-cols-2 gap-3">
                  {ewalletOptions.map(ewallet => {
                    const Icon = ewallet.icon;
                    const isSelected = paymentMethod === ewallet.id;
                    return (
                      <button
                        key={ewallet.id}
                        onClick={() => setPaymentMethod(ewallet.id)}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                          isSelected
                            ? `border-${ewallet.color.split('-')[1]}-500 ${ewallet.color}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-8 h-8 mb-2" />
                        <span className="font-medium">{ewallet.name}</span>
                        <p className="text-xs text-gray-500 mt-1">via Midtrans</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={processing}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={processPayment}
              disabled={
                processing || 
                (paymentMethod === 'cash' && (!paidAmount || parseFloat(paidAmount) < total)) ||
                (paymentMethod === 'ewallet' && !paymentMethod.startsWith('gopay') && 
                 !paymentMethod.startsWith('shopeepay') && !paymentMethod.startsWith('dana') &&
                 !paymentMethod.startsWith('ovo') && !paymentMethod.startsWith('linkaja'))
              }
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  {paymentMethod === 'cash' && <Printer className="w-5 h-5" />}
                  {paymentMethod === 'bank_transfer' && <Building2 className="w-5 h-5" />}
                  {paymentMethod === 'qris' && <QrCode className="w-5 h-5" />}
                  {(paymentMethod.startsWith('gopay') || paymentMethod.startsWith('shopeepay') || 
                    paymentMethod.startsWith('dana') || paymentMethod.startsWith('ovo') || 
                    paymentMethod.startsWith('linkaja')) && <Smartphone className="w-5 h-5" />}
                  
                  {paymentMethod === 'cash' ? 'Bayar & Cetak' : 
                   paymentMethod === 'bank_transfer' ? 'Lanjutkan' :
                   paymentMethod === 'qris' ? 'Buat QR Code' :
                   'Lanjutkan Pembayaran'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bank Transfer Confirmation Modal */}
      <Modal
        isOpen={showBankTransferModal}
        onClose={() => !processing && setShowBankTransferModal(false)}
        title="Konfirmasi Bank Transfer"
        size="md"
      >
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <p className="text-lg font-bold text-blue-700">Bank Transfer</p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(total)}</p>
          </div>
          
          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Pengirim
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Bank</option>
              {bankOptions.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.icon} {bank.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Account Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Rekening
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Contoh: 1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Pemilik
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Nama di rekening"
              />
            </div>
          </div>
          
          {/* Proof Upload (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bukti Transfer (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBankProofImage(e.target.files[0])}
                className="hidden"
                id="proof-upload"
              />
              <label
                htmlFor="proof-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <CreditCard className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {bankProofImage ? bankProofImage.name : 'Unggah bukti transfer'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  JPEG, PNG (maks. 5MB)
                </span>
              </label>
            </div>
          </div>
          
          {/* Koperasi Bank Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Transfer ke:</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <strong>BCA:</strong> 1234567890
                <br />
                <span className="text-xs">a.n. Koperasi Senyummu</span>
              </p>
              <p className="text-sm text-gray-600">
                <strong>Mandiri:</strong> 0987654321
                <br />
                <span className="text-xs">a.n. Koperasi Senyummu</span>
              </p>
              <p className="text-sm text-gray-600">
                <strong>BNI:</strong> 1122334455
                <br />
                <span className="text-xs">a.n. Koperasi Senyummu</span>
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowBankTransferModal(false);
                resetBankForm();
              }}
              disabled={processing}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              onClick={processBankTransfer}
              disabled={processing || !selectedBank || !bankAccountNumber || !bankAccountName}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {processing ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
            </button>
          </div>
        </div>
      </Modal>

      {/* QRIS Payment Modal for Midtrans */}
      <Modal
        isOpen={showQRISModal}
        onClose={() => {
          if (paymentPolling) {
            clearInterval(paymentPolling);
            setPaymentPolling(null);
          }
          setShowQRISModal(false);
        }}
        title="QRIS Payment"
        size="sm"
      >
        {midtransTransaction && (
          <div className="space-y-6 py-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Scan className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <p className="text-lg font-bold text-green-700">Scan QRIS</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(total)}</p>
              <p className="text-sm text-gray-600 mt-1">Order ID: {midtransTransaction.order_id}</p>
            </div>
            
            {/* QR Code Display */}
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center p-4">
                {midtransTransaction.qr_code_url ? (
                  <img 
                    src={midtransTransaction.qr_code_url} 
                    alt="QR Code" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2">[QR CODE]</div>
                    <p className="text-xs text-gray-500">Generating QR Code...</p>
                  </div>
                )}
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm font-medium text-gray-700">Koperasi Senyummu</p>
                <p className="text-xs text-gray-500">
                  Scan dengan GoPay, OVO, Dana, LinkAja, atau bank apapun
                </p>
              </div>
            </div>
            
            {/* Payment Status */}
            {paymentPolling && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="spinner w-5 h-5 border-2 border-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Menunggu pembayaran...</p>
                    <p className="text-xs text-blue-600">
                      QRIS akan expired dalam 15 menit
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Cara Bayar:</p>
              <ol className="text-sm text-gray-600 space-y-1 pl-4">
                <li>1. Buka aplikasi e-wallet atau mobile banking</li>
                <li>2. Pilih menu "Scan QR" atau "QRIS"</li>
                <li>3. Arahkan kamera ke QR code di atas</li>
                <li>4. Konfirmasi pembayaran {formatCurrency(total)}</li>
                <li>5. Transaksi akan dikonfirmasi otomatis</li>
              </ol>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  if (paymentPolling) {
                    clearInterval(paymentPolling);
                    setPaymentPolling(null);
                  }
                  setShowQRISModal(false);
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Tutup
              </button>
              <button
                onClick={() => window.open(midtransTransaction.redirect_url, '_blank')}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Buka di Browser
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}