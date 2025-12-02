import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Eye, Download, Search, 
  Package, Filter, X, SlidersHorizontal, 
  AlertCircle, Barcode, Boxes, TrendingUp,
  ShoppingBag, PackageOpen, Hash, Tag,
  ArrowUpDown, ChevronDown, ChevronUp,
  Printer, QrCode, PackageCheck, Warehouse,
  TrendingDown, Calendar, BarChart3,
  PackageMinus, PackagePlus, ScanLine
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ProductForm from '../components/features/products/ProductForm';
import StockForm from '../components/features/products/StockForm';
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getProductStats,
  exportProducts,
  getLowStockProducts,
  updateStock,
  getProductById,
  quickSearchByBarcode
} from '../services/productService';
import { getAllCategories } from '../services/categoryService';
import { getAllSuppliers } from '../services/supplierService';
import { formatCurrency, formatStock } from '../utils/formatters';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Products() {
  // States
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanning, setScanning] = useState(false);
  
  // Data for filters
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    categoryId: '',
    supplierId: '',
    status: '',
    stockStatus: '',
    sortBy: 'newest',
    itemsPerPage: 25,
    showLowStock: false
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const barcodeInputRef = useRef(null);
  
  useEffect(() => {
    loadProducts();
    loadStats();
    loadCategories();
    loadSuppliers();
  }, []);
  
  useEffect(() => {
    filterAndSortProducts();
  }, [searchQuery, filters, products]);
  
  useEffect(() => {
    if (scanning && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scanning]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
      
      // Load low stock products
      const lowStock = await getLowStockProducts(10);
      setLowStockProducts(lowStock);
    } catch (error) {
      toast.error('Gagal memuat data produk');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const data = await getProductStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const loadSuppliers = async () => {
    try {
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const filterAndSortProducts = () => {
      let result = [...products];
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
      }
      
      // Category filter - FIX: Convert to Number
      if (filters.categoryId) {
        result = result.filter(p => Number(p.categoryId) === Number(filters.categoryId));
      }
      
      // Supplier filter - FIX: Convert to Number
      if (filters.supplierId) {
        result = result.filter(p => Number(p.supplierId) === Number(filters.supplierId));
      }
      
      // Status filter
      if (filters.status === 'active') {
        result = result.filter(p => p.isActive);
      } else if (filters.status === 'inactive') {
        result = result.filter(p => !p.isActive);
      }
      
      // Stock status filter
      if (filters.stockStatus === 'low') {
        result = result.filter(p => p.stock <= p.minStock && p.stock > 0);
      } else if (filters.stockStatus === 'out') {
        result = result.filter(p => p.stock === 0);
      } else if (filters.stockStatus === 'safe') {
        result = result.filter(p => p.stock > p.minStock);
      }
      
      // Low stock toggle
      if (filters.showLowStock) {
        result = result.filter(p => p.stock <= p.minStock);
      }
      
      // Sort
      switch (filters.sortBy) {
        case 'name-asc':
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          result.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'price-asc':
          result.sort((a, b) => a.sellingPrice - b.sellingPrice);
          break;
        case 'price-desc':
          result.sort((a, b) => b.sellingPrice - a.sellingPrice);
          break;
        case 'stock-asc':
          result.sort((a, b) => a.stock - b.stock);
          break;
        case 'stock-desc':
          result.sort((a, b) => b.stock - a.stock);
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
      if (filters.itemsPerPage < 1000) {
        result = result.slice(0, filters.itemsPerPage);
      }
      
      setFilteredProducts(result);
  };
  
  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    try {
      setLoading(true);
      const product = await quickSearchByBarcode(barcodeInput.trim());
      if (product) {
        setFilteredProducts([product]);
        toast.success(`Produk ditemukan: ${product.name}`);
      }
    } catch (error) {
      toast.error('Produk tidak ditemukan');
      setBarcodeInput('');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleBarcodeScanner = () => {
    setScanning(!scanning);
    if (!scanning) {
      toast('Mode scanner aktif. Fokus ke input barcode', {
        icon: <ScanLine />,
        duration: 2000
      });
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
    }
  };
  
  const handleAdd = async (formData) => {
    try {
      setFormLoading(true);
      await createProduct(formData);
      toast.success('Produk berhasil ditambahkan');
      setShowAddModal(false);
      loadProducts();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal menambahkan produk');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleEdit = async (formData) => {
    try {
      setFormLoading(true);
      await updateProduct(selectedProduct.id, formData);
      toast.success('Data produk berhasil diperbarui');
      setShowEditModal(false);
      setSelectedProduct(null);
      loadProducts();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal memperbarui produk');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setFormLoading(true);
      await deleteProduct(selectedProduct.id);
      toast.success('Produk berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      loadProducts();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus produk');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleStockUpdate = async (stockData) => {
    try {
      setFormLoading(true);
      await updateStock(selectedProduct.id, stockData);
      toast.success('Stok berhasil diperbarui');
      setShowStockModal(false);
      setSelectedProduct(null);
      loadProducts();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal memperbarui stok');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      const data = await exportProducts({
        categoryId: filters.categoryId,
        supplierId: filters.supplierId,
        status: filters.status,
        stockStatus: filters.stockStatus
      });
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');
      XLSX.writeFile(wb, `data-produk-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data berhasil diexport');
    } catch (error) {
      toast.error('Gagal export data');
      console.error(error);
    }
  };
  
  const handlePrintBarcode = (product) => {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${product.name}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .barcode-container {
              text-align: center;
              border: 2px dashed #000;
              padding: 20px;
              background: white;
            }
            .product-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .barcode {
              margin: 10px 0;
            }
            .price {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              margin-top: 10px;
            }
            .sku {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .barcode-number {
              font-family: 'Courier New', monospace;
              letter-spacing: 2px;
              margin-top: 5px;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 0;
              }
              .barcode-container {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${product.name}</div>
            <div class="barcode">
              <svg id="barcode"></svg>
            </div>
            <div class="barcode-number">${product.barcode || product.sku}</div>
            <div class="price">${formatCurrency(product.sellingPrice)}</div>
            <div class="sku">SKU: ${product.sku}</div>
          </div>
          <script>
            window.onload = function() {
              // Generate barcode dengan format EAN13
              JsBarcode("#barcode", "${product.barcode || product.sku}", {
                format: "EAN13",
                width: 2,
                height: 100,
                displayValue: false,
                margin: 10
              });
              
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
  
  const handlePrintTable = () => {
    const printWindow = window.open('', '_blank');
    
    const tableRows = filteredProducts.map((product, index) => {
      const profit = product.sellingPrice - product.purchasePrice;
      const margin = product.purchasePrice > 0 ? ((profit / product.purchasePrice) * 100).toFixed(1) : 0;
      
      return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>
            <div style="font-weight: 600; font-size: 9px;">${product.name}</div>
            <div style="font-size: 7px; color: #6b7280;">${product.sku || '-'}</div>
          </td>
          <td style="text-align: center; font-size: 8px;">${product.supplier || '-'}</td>
          <td style="text-align: center; font-size: 8px;">${product.category || '-'}</td>
          <td style="text-align: center; font-size: 8px;">${product.barcode || '-'}</td>
          <td style="text-align: right; font-size: 9px;">${formatCurrency(product.sellingPrice)}</td>
          <td style="text-align: center; font-weight: 600; font-size: 9px; 
              color: ${product.stock === 0 ? '#dc2626' : product.stock <= product.minStock ? '#f59e0b' : '#059669'}">
            ${product.stock}
          </td>
          <td style="text-align: center; font-size: 8px;">${product.minStock}</td>
          <td style="text-align: right; font-size: 8px; color: #059669;">${margin}%</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Produk - ${new Date().toLocaleDateString('id-ID')}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Arial', sans-serif;
              padding: 10mm;
              font-size: 9px;
              color: #333;
              background: white;
              line-height: 1.2;
            }
            
            .header {
              text-align: center;
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 2px solid #2563eb;
            }
            
            .header h1 {
              font-size: 16px;
              color: #1e40af;
              margin-bottom: 2px;
              font-weight: 700;
            }
            
            .header-info {
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              color: #666;
              margin-top: 4px;
            }
            
            .stats {
              display: flex;
              justify-content: space-between;
              background: #f3f4f6;
              padding: 6px;
              border-radius: 4px;
              margin-bottom: 8px;
              font-size: 8px;
            }
            
            .stat {
              text-align: center;
            }
            
            .stat-value {
              font-weight: 700;
              font-size: 11px;
              color: #1f2937;
            }
            
            .stat-label {
              color: #6b7280;
              margin-top: 1px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
              table-layout: fixed;
            }
            
            th {
              background: #2563eb;
              color: white;
              padding: 5px 3px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #1e40af;
            }
            
            td {
              padding: 4px 3px;
              border: 1px solid #e5e7eb;
              word-wrap: break-word;
            }
            
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 8px;
              color: #666;
              text-align: center;
            }
            
            @page {
              size: A4;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Data Produk</h1>
            <div>Koperasi SenyumMu</div>
            <div class="header-info">
              <span>Tanggal: ${new Date().toLocaleDateString('id-ID')}</span>
              <span>Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>Item: ${filteredProducts.length}</span>
            </div>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${stats?.total || 0}</div>
              <div class="stat-label">Total Produk</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats?.totalValue ? `Rp ${(stats.totalValue/1000000).toFixed(1)}jt` : 'Rp 0'}</div>
              <div class="stat-label">Nilai Stok</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats?.lowStock || 0}</div>
              <div class="stat-label">Stok Rendah</div>
            </div>
            <div class="stat">
              <div class="stat-value">${products.reduce((sum, p) => sum + p.stock, 0)}</div>
              <div class="stat-label">Total Unit</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th style="width: 120px;">Produk</th>
                <th style="width: 70px;">Supplier</th>
                <th style="width: 60px;">Kategori</th>
                <th style="width: 70px;">Barcode</th>
                <th style="width: 70px; text-align: right;">Harga</th>
                <th style="width: 40px; text-align: center;">Stok</th>
                <th style="width: 35px; text-align: center;">Min</th>
                <th style="width: 45px; text-align: right;">Margin</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="footer">
            Dicetak oleh sistem • ${new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          <script>
            setTimeout(() => window.print(), 300);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const resetFilters = () => {
    setFilters({
      categoryId: '',
      supplierId: '',
      status: '',
      stockStatus: '',
      sortBy: 'newest',
      itemsPerPage: 25,
      showLowStock: false
    });
    setSearchQuery('');
    setBarcodeInput('');
  };
  
  const activeFilterCount = () => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.supplierId) count++;
    if (filters.status) count++;
    if (filters.stockStatus) count++;
    if (filters.sortBy !== 'newest') count++;
    if (filters.showLowStock) count++;
    if (searchQuery) count++;
    if (barcodeInput) count++;
    return count;
  };
  
  const getCategoryName = (categoryId) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };
  
  const getSupplierName = (supplierId) => {
    if (!supplierId) return '-';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || '-';
  };
  
  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { text: 'Habis', color: 'bg-red-100 text-red-800' };
    if (stock <= minStock) return { text: 'Hampir Habis', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Aman', color: 'bg-green-100 text-green-800' };
  };
  
  return (
    <Layout>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Produk</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <span className="text-green-600 font-medium">{stats?.active || 0} aktif</span> • 
            <span className="text-gray-500 ml-1">{stats?.inactive || 0} nonaktif</span>
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Nilai Stok</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.totalValue ? formatCurrency(stats.totalValue) : 'Rp 0'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Rata-rata: {stats?.avgPrice ? formatCurrency(stats.avgPrice) : 'Rp 0'}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stok Hampir Habis</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.lowStock || 0}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <span className="text-red-600 font-medium">{stats?.outOfStock || 0} habis</span>
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stok Hari Ini</p>
              <p className="text-2xl font-bold text-green-600">
                {products.reduce((sum, p) => sum + p.stock, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Warehouse className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Unit: {products.reduce((sum, p) => sum + p.stock, 0)} item
          </p>
        </div>
      </div>
      
      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Peringatan Stok Rendah</h3>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              {lowStockProducts.length} produk
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {lowStockProducts.slice(0, 5).map(product => {
              const status = getStockStatus(product.stock, product.minStock);
              return (
                <div 
                  key={product.id}
                  className="p-3 bg-white border border-yellow-100 rounded-lg hover:border-yellow-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowDetailModal(true);
                  }}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {product.stock} {product.unit}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setShowStockModal(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {lowStockProducts.length > 5 && (
            <button className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium">
              Lihat semua {lowStockProducts.length} produk →
            </button>
          )}
        </div>
      )}
      
      {/* Toolbar */}
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        {/* Single Row Layout */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Left: Search Bars */}
          <div className="flex flex-1 gap-2 w-full lg:w-auto">
            {/* Main Search */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cari produk..."
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

            {/* Barcode Search */}
            <div className="relative flex-1 min-w-[180px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Barcode className="w-5 h-5 text-gray-400" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch(e)}
                className={`w-full pl-10 pr-10 py-2.5 border ${scanning ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Barcode..."
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => setBarcodeInput('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-2 flex-wrap lg:flex-nowrap">
            <button
              onClick={toggleBarcodeScanner}
              className={`p-2.5 rounded-lg font-medium transition-colors ${scanning ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              title={scanning ? "Matikan scanner" : "Nyalakan scanner"}
            >
              <ScanLine className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors relative whitespace-nowrap ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
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
              onClick={() => {handlePrintTable();}}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              title="Cetak"
            >
              <Printer className="w-5 h-5" />
            </button>

            {activeFilterCount() > 0 && (
              <button
                onClick={resetFilters}
                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                title="Reset Filter"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 mt-4 border-t border-gray-200 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Tag className="w-3 h-3 inline mr-1" />
                  Kategori
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Kategori</option>
                  {categories.filter(c => c.isActive).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <ShoppingBag className="w-3 h-3 inline mr-1" />
                  Supplier
                </label>
                <select
                  value={filters.supplierId}
                  onChange={(e) => setFilters(prev => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Supplier</option>
                  {suppliers.filter(s => s.isActive).map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

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
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Boxes className="w-3 h-3 inline mr-1" />
                  Status Stok
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua</option>
                  <option value="safe">Stok Aman</option>
                  <option value="low">Hampir Habis</option>
                  <option value="out">Stok Habis</option>
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
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="name-asc">Nama (A-Z)</option>
                  <option value="name-desc">Nama (Z-A)</option>
                  <option value="price-asc">Harga (Rendah-Tinggi)</option>
                  <option value="price-desc">Harga (Tinggi-Rendah)</option>
                  <option value="stock-asc">Stok (Sedikit-Banyak)</option>
                  <option value="stock-desc">Stok (Banyak-Sedikit)</option>
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
                  <option value={10}>10 item</option>
                  <option value={25}>25 item</option>
                  <option value={50}>50 item</option>
                  <option value={100}>100 item</option>
                  <option value={1000}>Semua</option>
                </select>
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showLowStock}
                  onChange={(e) => setFilters(prev => ({ ...prev, showLowStock: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Hanya tampilkan stok rendah</span>
              </label>
            </div>
          </div>
        )}
      </div>
      
      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Harga Jual</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stok</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="spinner w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-gray-500">Memuat data produk...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 font-medium">Tidak ada data produk</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchQuery || activeFilterCount() > 0 
                        ? 'Coba ubah pencarian atau filter' 
                        : 'Klik "Tambah Produk" untuk menambahkan produk pertama'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  const isExpanded = expandedProduct === product.id;
                  
                  return (
                    <>
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  <Hash className="w-3 h-3 inline mr-1" />
                                  {product.sku}
                                </span>
                                {product.barcode && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    <Barcode className="w-3 h-3 inline mr-1" />
                                    {product.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {product.categoryName || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{formatCurrency(product.sellingPrice)}</p>
                          <p className="text-xs text-gray-500">
                            Beli: {formatCurrency(product.purchasePrice)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              {product.stock} {product.unit}
                            </span>
                            {product.stock <= product.minStock && (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          {product.minStock > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Min: {product.minStock} {product.unit}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowDetailModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowStockModal(true);
                              }}
                              className={`p-2 hover:bg-green-50 rounded-lg transition-colors ${
                                product.stock === 0 
                                  ? 'text-red-600' 
                                  : product.stock <= product.minStock 
                                    ? 'text-yellow-600' 
                                    : 'text-green-600'
                              }`}
                              title="Kelola Stok"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowEditModal(true);
                              }}
                              className="p-2 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintBarcode(product)}
                              className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                              title="Cetak Barcode"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowDeleteDialog(true);
                              }}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                              className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                              title="Detail"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="px-4 py-3">
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 mb-1">Supplier</p>
                                <p className="font-medium">{product.supplierName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Unit</p>
                                <p className="font-medium">{product.unit}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Profit</p>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(product.sellingPrice - product.purchasePrice)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Dibuat</p>
                                <p className="font-medium">
                                  {new Date(product.createdAt).toLocaleDateString('id-ID')}
                                </p>
                              </div>
                              {product.description && (
                                <div className="col-span-4">
                                  <p className="text-gray-500 mb-1">Deskripsi</p>
                                  <p className="text-gray-700">{product.description}</p>
                                </div>
                              )}
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
        
        {/* Pagination Info */}
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {filteredProducts.length} dari {products.length} produk
                {filters.showLowStock && ' • Hanya stok rendah'}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                  <span className="text-xs text-gray-600">Stok Aman</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                  <span className="text-xs text-gray-600">Hampir Habis</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 rounded-full"></div>
                  <span className="text-xs text-gray-600">Stok Habis</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Produk Baru"
        size="xl"
      >
        <ProductForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
          loading={formLoading}
        />
      </Modal>
      
      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        title="Edit Produk"
        size="xl"
      >
        <ProductForm
          product={selectedProduct}
          onSubmit={handleEdit}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          loading={formLoading}
        />
      </Modal>
      
      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProduct(null);
        }}
        title="Detail Produk"
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              {selectedProduct.image ? (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-32 h-32 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    SKU: {selectedProduct.sku}
                  </span>
                  {selectedProduct.barcode && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                      Barcode: {selectedProduct.barcode}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Kategori</p>
                  <p className="font-medium text-gray-900">{selectedProduct.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Supplier</p>
                  <p className="font-medium text-gray-900">{selectedProduct.supplier || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Unit</p>
                  <p className="font-medium text-gray-900">{selectedProduct.unit}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Harga Beli</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedProduct.purchasePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Harga Jual</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedProduct.sellingPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Profit</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(selectedProduct.sellingPrice - selectedProduct.purchasePrice)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Stok Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock}</p>
                <p className="text-xs text-gray-500">{selectedProduct.unit}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700 mb-1">Stok Minimum</p>
                <p className="text-2xl font-bold text-yellow-700">{selectedProduct.minStock}</p>
                <p className="text-xs text-yellow-600">{selectedProduct.unit}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedProduct.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedProduct.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
            
            {selectedProduct.description && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Deskripsi</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{selectedProduct.description}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Stock Management Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setSelectedProduct(null);
        }}
        title="Kelola Stok Produk"
        size="md"
      >
        {selectedProduct && (
          <StockForm
            product={selectedProduct}
            onSubmit={handleStockUpdate}
            onCancel={() => {
              setShowStockModal(false);
              setSelectedProduct(null);
            }}
            loading={formLoading}
          />
        )}
      </Modal>
      
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${selectedProduct?.name}"? 
        
        Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait produk ini.`}
        type="danger"
        confirmText="Hapus"
        loading={formLoading}
      />
    </Layout>
  );
}