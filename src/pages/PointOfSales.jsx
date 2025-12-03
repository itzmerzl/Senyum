import { useState, useEffect, useRef } from 'react';
import { Landmark, Building2, QrCode, Wallet, Search, Plus, Minus, Trash2, ShoppingCart, DollarSign, User, CreditCard, Banknote, Smartphone, Printer, X, Scan, Package } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import { getAllProducts } from '../services/productService';
import { createTransaction } from '../services/transactionService';
import { getAllStudents } from '../services/studentService';
import { getActivePaymentMethods } from '../services/paymentMethodService';
import { formatCurrency } from '../utils/formatters';
import midtransService from '../services/midtransService';
import toast from 'react-hot-toast';

// Helper untuk mendapatkan komponen icon
const getIconComponent = (iconName) => {
  const iconMap = {
    Landmark,
    Building2,
    QrCode,
    Wallet,
    CreditCard,
    Banknote,
    Smartphone,
    DollarSign
  };
  
  const Icon = iconMap[iconName] || DollarSign;
  return <Icon className="w-6 h-6" />;
};

export default function PointOfSales() {
  const [products, setProducts] = useState([]);
  const [students, setStudents] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerType, setCustomerType] = useState('general');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const [midtransTransaction, setMidtransTransaction] = useState(null);
  const [paymentPolling, setPaymentPolling] = useState(null);
  const [showQRISModal, setShowQRISModal] = useState(false);
  
  // States untuk payment details
  const [paymentDetails, setPaymentDetails] = useState({
    bankAccount: '',
    accountName: '',
    proofImage: null,
    phoneNumber: ''
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const paymentInputRef = useRef(null);
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const tax = 0;
  const total = subtotal + tax;
  
  useEffect(() => {
    loadProducts();
    loadStudents();
    loadPaymentMethods();
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

  const loadPaymentMethods = async () => {
    try {
      const data = await getActivePaymentMethods();
      console.log('Payment methods loaded:', data); // Debug log
      if (data && data.length > 0) {
        setPaymentMethods(data);
      } else {
        // Fallback jika database kosong
        setPaymentMethods(getDefaultPaymentMethods());
        toast.warning('Tidak ada metode pembayaran aktif, menggunakan default');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      // Fallback jika service error
      setPaymentMethods(getDefaultPaymentMethods());
      toast.error('Gagal memuat metode pembayaran, menggunakan metode default');
    }
  };

  // Fallback default payment methods
  const getDefaultPaymentMethods = () => {
    return [
      {
        id: 1,
        name: 'Tunai',
        code: 'cash',
        type: 'cash',
        icon: 'Banknote',
        color: 'bg-green-100 text-green-600',
        description: 'Pembayaran dengan uang tunai',
        isActive: true,
        displayOrder: 1
      },
      {
        id: 2,
        name: 'QRIS',
        code: 'qris',
        type: 'digital',
        provider: 'midtrans',
        icon: 'QrCode',
        color: 'bg-blue-100 text-blue-600',
        description: 'Scan QRIS dengan e-wallet apapun',
        isActive: true,
        displayOrder: 2
      },
      {
        id: 3,
        name: 'Transfer Bank',
        code: 'bank',
        type: 'bank',
        icon: 'Building2',
        color: 'bg-purple-100 text-purple-600',
        description: 'Transfer ke rekening bank',
        isActive: true,
        displayOrder: 3
      }
    ];
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

  // Generate category options
  const uniqueCategories = [...new Set(products.map(p => p.categoryId))].filter(Boolean);
  const categoryOptions = uniqueCategories.map(catId => {
    const product = products.find(p => p.categoryId === catId);
    return {
      id: catId,
      name: product?.categoryName || product?.category || `Kategori ${catId}`
    };
  });
  
  // Filtered products based on search and category
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === 'all' || Number(p.categoryId) === Number(selectedCategory);
    return matchSearch && matchCategory;
  });

  // Handle barcode submission
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
  
  // Cart manipulation functions
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

  // Handle payment button click
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
    setSelectedPaymentMethod(null);
    setPaidAmount('');
    setPaymentDetails({
      bankAccount: '',
      accountName: '',
      proofImage: null,
      phoneNumber: ''
    });
  };

  const processPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Pilih metode pembayaran');
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (!method) {
      toast.error('Metode pembayaran tidak valid');
      return;
    }
    
    // Validasi berdasarkan tipe pembayaran
    if (method.type === 'cash') {
      if (!paidAmount || parseFloat(paidAmount) < total) {
        toast.error('Jumlah pembayaran kurang');
        return;
      }
    }
    
    if (method.type === 'bank') {
      if (!paymentDetails.bankAccount || !paymentDetails.accountName) {
        toast.error('Harap lengkapi data transfer');
        return;
      }
    }
    
    if (method.type === 'ewallet') {
      if (!paymentDetails.phoneNumber) {
        toast.error('Harap masukkan nomor HP');
        return;
      }
    }

    try {
      setProcessing(true);
      
      // Jika menggunakan provider digital (Midtrans)
      if (method.provider === 'midtrans' && method.type === 'digital') {
        await processMidtransPayment(method.code);
        return;
      }
      
      // Tentukan status berdasarkan tipe pembayaran
      const transactionStatus = method.type === 'bank' ? 'pending' : 'completed';
      
      // Process normal payment (cash, bank transfer, dll)
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
        paymentMethod: method.code,
        paymentMethodName: method.name,
        paidAmount: method.type === 'cash' ? parseFloat(paidAmount) : total,
        changeAmount: method.type === 'cash' ? parseFloat(paidAmount) - total : 0,
        status: transactionStatus,
        paymentDetails: method.type !== 'cash' ? paymentDetails : null
      };
      
      const result = await createTransaction(transactionData);
      
      if (transactionStatus === 'pending') {
        toast.success('Transaksi dibuat! Menunggu konfirmasi pembayaran', {
          duration: 4000,
        });
        
        // Tampilkan info transaksi pending
        toast.success(`No. Invoice: ${result.invoiceNumber}. Silakan lakukan transfer.`, {
          duration: 6000
        });
        
      } else {
        // Pembayaran completed (cash, card, dll)
        toast.success('Pembayaran berhasil!');
        
        printReceipt(result);
      }
      
      clearCart();
      setShowPaymentModal(false);
      setSelectedPaymentMethod(null);
      setPaidAmount('');
      setPaymentDetails({
        bankAccount: '',
        accountName: '',
        proofImage: null,
        phoneNumber: ''
      });
      
      loadProducts();
      
    } catch (error) {
      toast.error(error.message || 'Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };
  
  // Print invoice untuk transaksi pending
  const printPendingInvoice = (transaction) => {
    const method = paymentMethods.find(m => m.code === transaction.paymentMethod);
    
    const invoiceContent = `
      ================================
      KOPERASI SENYUMMU
      INVOICE PEMBAYARAN
      ================================
      
      No Invoice: ${transaction.invoiceNumber}
      Tanggal: ${new Date(transaction.transactionDate).toLocaleString('id-ID')}
      Status: MENUNGGU PEMBAYARAN
      
      --------------------------------
      CUSTOMER
      --------------------------------
      ${transaction.customerName}
      
      --------------------------------
      ITEM
      --------------------------------
      ${transaction.items.map(item => `
      ${item.productName}
      ${item.quantity} x ${formatCurrency(item.price)}
                        ${formatCurrency(item.subtotal)}
      `).join('')}
      --------------------------------
      
      Total:        ${formatCurrency(transaction.total)}
      
      ================================
      INSTRUKSI PEMBAYARAN
      ================================
      
      Transfer ke:
      ${method?.name || 'Bank Transfer'}
      ${method?.bankAccount || '-'}
      a.n. Koperasi Senyummu
      
      Jumlah: ${formatCurrency(transaction.total)}
      
      ⚠️  Harap konfirmasi setelah transfer
      Hubungi: 085183079329
      
      ================================
    `;
    
    console.log(invoiceContent);
    // In production, integrate with thermal printer
  };

  // Midtrans Payment Handler
  const processMidtransPayment = async (paymentType) => {
    try {
      setProcessing(true);
      
      const orderId = `ORDER${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const items = cart.map(item => ({
        id: item.id.toString(),
        price: item.sellingPrice,
        quantity: item.quantity,
        name: item.name.substring(0, 50)
      }));
      
      const customerName = customerType === 'student' ? 
        selectedStudent?.fullName : 'Umum';
      
      const transaction = await midtransService.createMidtransTransaction({
        orderId,
        amount: total,
        customerName,
        paymentMethod: paymentType,
        items
      });
      
      setMidtransTransaction(transaction);
      
      if (paymentType === 'qris') {
        setShowQRISModal(true);
        startPaymentPolling(orderId);
      } else {
        if (transaction.redirect_url) {
          window.open(transaction.redirect_url, '_blank');
        }
        startPaymentPolling(orderId);
      }
      
      setShowPaymentModal(false);
      
    } catch (error) {
      toast.error(error.message || 'Gagal memproses pembayaran');
      setProcessing(false);
    }
  };

  // Start polling untuk cek status pembayaran Midtrans
  const startPaymentPolling = (orderId) => {
    if (paymentPolling) {
      clearInterval(paymentPolling);
    }
    
    const poll = setInterval(async () => {
      try {
        const status = await midtransService.checkTransactionStatus(orderId);
        
        if (status.transaction_status === 'settlement') {
          clearInterval(poll);
          setPaymentPolling(null);
          
          await completeMidtransTransaction({
            orderId,
            status: status.transaction_status,
            paymentType: status.payment_type
          });
          
        } else if (['cancel', 'deny', 'expire'].includes(status.transaction_status)) {
          clearInterval(poll);
          setPaymentPolling(null);
          toast.error('Pembayaran gagal atau dibatalkan');
        }
        
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
    
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

  const completeMidtransTransaction = async (midtransData) => {
    try {
      const method = paymentMethods.find(m => m.code === midtransTransaction?.payment_method) || 
                     paymentMethods.find(m => m.type === 'digital');
      
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
        paymentMethod: method?.code || 'digital',
        paymentMethodName: method?.name || 'Pembayaran Digital',
        paidAmount: total,
        changeAmount: 0,
        paymentReference: midtransData.orderId,
        notes: `Midtrans - ${midtransData.paymentType}`,
        status: 'completed',
        metadata: {
          provider: 'midtrans',
          transaction_status: midtransData.status,
          payment_type: midtransData.paymentType
        }
      };
      
      const result = await createTransaction(transactionData);
      
      toast.success('Pembayaran berhasil!');
      printReceipt(result);
      
      clearCart();
      setShowQRISModal(false);
      setShowPaymentModal(false);
      setPaidAmount('');
      loadProducts();
      
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan transaksi');
    }
  };

  const printReceipt = (transaction) => {
    // Simulate printing receipt
    const receiptContent = `
      ================================
      KOPERASI SENYUMMU
      Jln. Pemandian No. 88
      Telp: 085183079329
      ================================
      
      No Invoice: ${transaction.invoiceNumber || 'N/A'}
      Tanggal: ${new Date(transaction.transactionDate || new Date()).toLocaleString('id-ID')}
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
                      className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-3 text-left transition-all hover:shadow-md group"
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
                              {student.registrationNumber} • Kelas {student.className || '-'}
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
        title="Pilih Metode Pembayaran"
        size="lg"
      >
        <div className="space-y-6">
          {/* Total */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</p>
          </div>
          
          {/* Payment Methods Grid */}
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const isSelected = selectedPaymentMethod === method.id;
              const IconDisplay = getIconComponent(method.icon);
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`text-3xl mb-2 p-2 rounded-lg ${method.color}`}>
                      {IconDisplay}
                    </div>
                    <span className="font-medium text-gray-900">{method.name}</span>
                    <span className="text-xs text-gray-500 mt-1">{method.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Payment Details */}
          {selectedPaymentMethod && (() => {
            const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
            if (!method) return null;
            
            return (
              <div className="space-y-4 pt-4 border-t">
                {method.type === 'cash' && (
                  <>
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
                  </>
                )}
                
                {method.type === 'bank' && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Transfer ke Rekening:
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>{method.name}</strong> {method.bankAccount}<br />
                        a.n. Koperasi Senyummu
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        *Harap lengkapi data pengirim di bawah
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. Rekening Pengirim
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.bankAccount}
                          onChange={(e) => setPaymentDetails({...paymentDetails, bankAccount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Pemilik
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.accountName}
                          onChange={(e) => setPaymentDetails({...paymentDetails, accountName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Nama lengkap"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bukti Transfer (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentDetails({...paymentDetails, proofImage: e.target.files[0]})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </>
                )}
                
                {method.type === 'ewallet' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor HP {method.name}
                    </label>
                    <input
                      type="tel"
                      value={paymentDetails.phoneNumber}
                      onChange={(e) => setPaymentDetails({...paymentDetails, phoneNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                )}
              </div>
            );
          })()}
          
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
              disabled={processing || !selectedPaymentMethod}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  Proses Pembayaran
                </>
              )}
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
                    <div className="spinner mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">Loading QR Code...</p>
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
            
            {paymentPolling && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="spinner w-5 h-5 border-2 border-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Menunggu pembayaran...</p>
                    <p className="text-xs text-blue-600">QRIS akan expired dalam 15 menit</p>
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
            
            <button
              onClick={() => {
                if (paymentPolling) {
                  clearInterval(paymentPolling);
                  setPaymentPolling(null);
                }
                setShowQRISModal(false);
              }}
              className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Tutup
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}