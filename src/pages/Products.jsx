import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Eye, Download, Search,
  Package, Filter, X, SlidersHorizontal,
  AlertCircle, Barcode, Boxes, TrendingUp,
  ShoppingBag, PackageOpen, Hash, Tag,
  ArrowUpDown, ChevronDown, ChevronUp,
  Printer, QrCode, PackageCheck, Warehouse,
  TrendingDown, Calendar, BarChart3,
  PackageMinus, PackagePlus, ScanLine, Upload,
  ChevronLeft, ChevronRight, MoreHorizontal, FileSpreadsheet, CheckCircle,
  Box, AlertTriangle
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ProductForm from '../components/features/products/ProductForm';
import StockForm from '../components/features/products/StockForm';
import ProductImportModal from '../components/features/products/ProductImportModal';
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
  quickSearchByBarcode,
  importProducts // Added for bulk import if needed later
} from '../services/productService';
import { getAllCategories } from '../services/categoryService';
import { getAllSuppliers } from '../services/supplierService';
import { formatCurrency, formatStock } from '../utils/formatters';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function Products() {
  // States
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Pagination & Selection States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkActionsDropdown, setShowBulkActionsDropdown] = useState(false);
  const [showExcelDropdown, setShowExcelDropdown] = useState(false);

  // Bulk Action Modals
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkStatusConfirm, setBulkStatusConfirm] = useState({ isOpen: false, status: true });

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
  const [showImportModal, setShowImportModal] = useState(false);
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

    // Limit items per page logic moved to pagination
    // if (filters.itemsPerPage < 1000) {
    //   result = result.slice(0, filters.itemsPerPage);  <-- REMOVED
    // }

    setFilteredProducts(result);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };

  // -- Pagination & Selection Logic --

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all visible on current page (or all filtered? "All filtered" is usually expected for bulk actions but "current page" is safer.
      // Detailed behavior: If "Select All" checked, user usually expects all items in the list to be selected.
      // Let's select all FILTERED products for powerful bulk actions.
      const allIds = filteredProducts.map(p => p.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openBulkStatusConfirm = (status) => {
    setBulkStatusConfirm({ isOpen: true, status });
  };

  const executeBulkStatus = async (status) => {
    try {
      setLoading(true);
      // Loop update (Service doesn't support bulk yet)
      const promises = selectedIds.map(id => updateProduct(id, { isActive: status }));
      await Promise.all(promises);

      toast.success(`Berhasil mengubah status ${selectedIds.length} produk`);
      setSelectedIds([]);
      loadProducts(false); // Refresh
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui status massal');
    } finally {
      setLoading(false);
      setShowBulkActionsDropdown(false);
      setBulkStatusConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const promises = selectedIds.map(id => deleteProduct(id)); // Assuming deleteProduct exists
      await Promise.all(promises);

      toast.success(`${selectedIds.length} produk berhasil dihapus`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      loadProducts(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus beberapa produk (Mungkin ada transaksi)');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBulkActionsDropdown || showExcelDropdown) {
        const target = event.target;
        if (!target.closest('.bulk-actions-container') && !target.closest('.excel-dropdown-container')) {
          setShowBulkActionsDropdown(false);
          setShowExcelDropdown(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBulkActionsDropdown, showExcelDropdown]);

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

      // Manual Download for robustness
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      // Use standard Excel MIME type
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `data-produk-${new Date().toISOString().split('T')[0]}.xlsx`);

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

    let totalAssetValue = 0;
    let totalItems = 0;

    const tableRows = filteredProducts.map((product, index) => {
      const profit = product.sellingPrice - product.purchasePrice;
      const margin = product.purchasePrice > 0 ? ((profit / product.purchasePrice) * 100).toFixed(1) : 0;

      const assetValue = product.stock * product.purchasePrice;
      totalAssetValue += assetValue;
      totalItems++;

      return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>
            <div style="font-weight: 600; font-size: 9px;">${product.name}</div>
            <div style="font-size: 7px; color: #6b7280;">${product.sku || '-'}</div>
          </td>
          <td style="text-align: center; font-size: 8px;">${product.supplier?.name || product.supplierName || '-'}</td>
          <td style="text-align: center; font-size: 8px;">${product.category?.name || product.categoryName || '-'}</td>
          <td style="text-align: center; font-size: 8px;">${product.barcode || '-'}</td>
          <td style="text-align: right; font-size: 9px;">${formatCurrency(product.purchasePrice)}</td>
          <td style="text-align: right; font-size: 9px;">${formatCurrency(product.sellingPrice)}</td>
          <td style="text-align: center; font-weight: 600; font-size: 9px; 
              color: ${product.stock === 0 ? '#dc2626' : product.stock <= product.minStock ? '#f59e0b' : '#059669'}">
            ${product.stock} ${product.unit?.name || product.unitName || ''}
          </td>
          <td style="text-align: right; font-size: 9px; font-weight: bold;">${formatCurrency(assetValue)}</td>
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
              padding: 0;
              font-size: 9px;
              color: #333;
              background: white;
              line-height: 1.2;
            }
            
            .header {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #2563eb;
            }
            
            .header h1 {
              font-size: 18px;
              color: #1e40af;
              margin-bottom: 4px;
              font-weight: 700;
              text-transform: uppercase;
            }
            
            .header-info {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 10px;
              color: #555;
            }
            
            .summary-cards {
              display: flex;
              gap: 10px;
              margin-bottom: 15px;
            }
            
            .card {
              flex: 1;
              border: 1px solid #e5e7eb;
              padding: 8px;
              border-radius: 4px;
              background-color: #f9fafb;
            }
            
            .card-title { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
            .card-value { font-size: 14px; font-weight: bold; color: #111827; margin-top: 2px; }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            th {
              background-color: #f3f4f6;
              color: #1f2937;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 8px;
              padding: 6px 4px;
              border-bottom: 1px solid #e5e7eb;
              border-top: 1px solid #e5e7eb;
            }
            
            td {
              padding: 6px 4px;
              border-bottom: 1px solid #f3f4f6;
              vertical-align: middle;
            }
            
            tr:nth-child(even) { background-color: #fcfcfc; }
            
            .footer {
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
              <div class="stat-value">${stats?.totalValue ? `Rp ${(stats.totalValue / 1000000).toFixed(1)}jt` : 'Rp 0'}</div>
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
                  <th style="width: 70px; text-align: right;">Harga Beli</th>
                  <th style="width: 70px; text-align: right;">Harga Jual</th>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Produk</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.total || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="text-green-600 font-medium">{stats?.active || 0} aktif</span> • {stats?.inactive || 0} nonaktif
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Stok</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalStock || 0}</h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <Box className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-green-600">
            Stok tersedia siap jual
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Stok Menipis</p>
              <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats?.lowStock || 0}</h3>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Perlu restock segera
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Nilai</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(stats?.totalValue || 0)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aset produk tersimpan
          </p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {
        lowStockProducts.length > 0 && (
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
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
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
        )
      }

      {/* Toolbar */}
      {/* Toolbar */}
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-6 py-4 mb-6">
        {/* Single Row Layout */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Left: Search Bars */}
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            {/* Main Search */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Cari produk..."
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Barcode Search */}
            <div className="relative flex-1 min-w-[200px] group hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Barcode className="w-5 h-5 text-gray-400" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch(e)}
                className={`w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${scanning ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                placeholder="Scan Barcode..."
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => setBarcodeInput('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
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
              className={`p-2.5 rounded-lg font-medium transition-colors ${scanning ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
              title={scanning ? "Matikan scanner" : "Nyalakan scanner"}
            >
              <ScanLine className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors relative whitespace-nowrap ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount()}
                </span>
              )}
            </button>

            {/* Bulk Actions Dropdown */}
            {selectedIds.length > 0 && (
              <div className="relative bulk-actions-container">
                <button
                  onClick={() => setShowBulkActionsDropdown(!showBulkActionsDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all shadow-md whitespace-nowrap animate-in fade-in"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>Aksi Massal ({selectedIds.length})</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showBulkActionsDropdown ? 'rotate-90' : ''}`} />
                </button>
                {showBulkActionsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowBulkDeleteConfirm(true);
                        setShowBulkActionsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-left border-b border-gray-100 dark:border-gray-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Hapus {selectedIds.length} Produk</div>
                        <div className="text-xs opacity-75">Hapus produk terpilih</div>
                      </div>
                    </button>
                    <button
                      onClick={() => openBulkStatusConfirm(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors text-left"
                    >
                      <PackageMinus className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Nonaktifkan</div>
                        <div className="text-xs opacity-75">Sembunyikan dari kasir</div>
                      </div>
                    </button>
                    <button
                      onClick={() => openBulkStatusConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors text-left"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Aktifkan</div>
                        <div className="text-xs opacity-75">Tampilkan di kasir</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Excel / Data Dropdown */}
            <div className="relative excel-dropdown-container">
              <button
                onClick={() => setShowExcelDropdown(!showExcelDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel / Data</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showExcelDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showExcelDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      handleExport();
                      setShowExcelDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors text-left border-b border-gray-100 dark:border-gray-700"
                  >
                    <Download className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium">Export Excel</div>
                      <div className="text-xs text-gray-500">Download data produk</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setShowExcelDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors text-left"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Import Excel</div>
                      <div className="text-xs text-gray-500">Upload data produk baru</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { handlePrintTable(); }}
              className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
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
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Tag className="w-3 h-3 inline mr-1" />
                  Kategori
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="select-field"
                >
                  <option value="">Semua Kategori</option>
                  {categories.filter(c => c.isActive).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <ShoppingBag className="w-3 h-3 inline mr-1" />
                  Supplier
                </label>
                <select
                  value={filters.supplierId}
                  onChange={(e) => setFilters(prev => ({ ...prev, supplierId: e.target.value }))}
                  className="select-field"
                >
                  <option value="">Semua Supplier</option>
                  {suppliers.filter(s => s.isActive).map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="select-field"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Boxes className="w-3 h-3 inline mr-1" />
                  Status Stok
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                  className="select-field"
                >
                  <option value="">Semua</option>
                  <option value="safe">Stok Aman</option>
                  <option value="low">Hampir Habis</option>
                  <option value="out">Stok Habis</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <ArrowUpDown className="w-3 h-3 inline mr-1" />
                  Urutkan
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="select-field"
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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tampilkan</label>
                <select
                  value={filters.itemsPerPage}
                  onChange={(e) => setFilters(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))}
                  className="select-field"
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
                <span className="text-sm text-gray-700 dark:text-gray-300">Hanya tampilkan stok rendah</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-4 py-4 text-left w-12 rounded-tl-xl">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 cursor-pointer"
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produk</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipe</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga Jual</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stok</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-tr-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-900 dark:text-white font-medium text-lg">Memuat data produk...</p>
                      <p className="text-gray-500 text-sm">Mohon tunggu sebentar</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <PackageOpen className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tidak ada produk ditemukan</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                      {searchQuery || activeFilterCount() > 0
                        ? 'Coba sesuaikan kata kunci pencarian atau filter Anda untuk menemukan produk yang dicari.'
                        : 'Belum ada data produk di sistem. Mulai dengan menambahkan produk baru.'}
                    </p>
                    {searchQuery || activeFilterCount() > 0 ? (
                      <button
                        onClick={resetFilters}
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                      >
                        Reset Filter
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-5 h-5" />
                        Tambah Produk Baru
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  const isExpanded = expandedProduct === product.id;

                  return (
                    <React.Fragment key={product.id}>
                      <tr className={`group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isExpanded ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 cursor-pointer"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative group/img">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {product.sku && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    SKU: {product.sku}
                                  </span>
                                )}
                                {product.barcode && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    <Barcode className="w-3 h-3 mr-1" />
                                    {product.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.type === 'BUNDLE'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                            : 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                            }`}>
                            {product.type === 'BUNDLE' ? 'Paket' : 'Satuan'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                            {product.categoryName || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(product.sellingPrice)}</span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Margin: {product.purchasePrice > 0 ? Math.round(((product.sellingPrice - product.purchasePrice) / product.purchasePrice) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${stockStatus.color}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${stockStatus.text === 'Aman' ? 'bg-green-500' : stockStatus.text === 'Habis' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                              {product.stock} {product.unit?.name || 'Unit'}
                            </span>
                            {product.stock <= product.minStock && product.stock > 0 && (
                              <span className="text-[10px] text-yellow-600 font-medium ml-1">Stok Menipis</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); /* Add toggle handler later */ }}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${product.isActive ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                            <span className="sr-only">Use setting</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowDetailModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowDeleteDialog(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                              className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600'}`}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                          <td colSpan="8" className="px-4 py-4">
                            <div className="grid grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-300 mb-1">Supplier</p>
                                <p className="font-medium dark:text-gray-200">{product.supplier?.name || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-300 mb-1">Unit</p>
                                <p className="font-medium dark:text-gray-200">{product.unit?.name || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-300 mb-1">Profit</p>
                                <p className="font-medium text-green-600 dark:text-green-400">
                                  {formatCurrency(product.sellingPrice - product.purchasePrice)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-300 mb-1">Dibuat</p>
                                <p className="font-medium dark:text-gray-200">
                                  {new Date(product.createdAt).toLocaleDateString('id-ID')}
                                </p>
                              </div>

                              {/* Tags Display - Moving here as requested */}
                              <div>
                                <p className="text-gray-500 dark:text-gray-300 mb-1">Tags</p>
                                {product.tags && product.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {product.tags.map((tagObj, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                      >
                                        {tagObj.tag || tagObj}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 italic">-</p>
                                )}
                              </div>

                              {product.description && (
                                <div className="col-span-5">
                                  <p className="text-gray-500 dark:text-gray-300 mb-1">Deskripsi</p>
                                  <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
                                </div>
                              )}


                              {/* Variants Display */}
                              {product.variants && product.variants.length > 0 && (
                                <div className="col-span-4">
                                  <p className="text-gray-500 dark:text-gray-300 mb-2">Variants ({product.variants.length})</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {product.variants.map((variant) => (
                                      <div
                                        key={variant.id}
                                        className="p-2 bg-gray-100 dark:bg-gray-600 rounded text-sm"
                                      >
                                        <p className="font-medium dark:text-gray-200">{variant.name}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          Stock: {variant.stock} | SKU: {variant.sku || '-'}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredProducts.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} data
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all shadow-sm ${currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-900'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
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
                  className="w-32 h-32 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProduct.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    SKU: {selectedProduct.sku}
                  </span>
                  {selectedProduct.barcode && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-white text-sm font-medium rounded-full">
                      Barcode: {selectedProduct.barcode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Kategori</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.category?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Supplier</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.supplier?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Unit</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.unit?.name || '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Harga Beli</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedProduct.purchasePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Harga Jual</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedProduct.sellingPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Profit</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(selectedProduct.sellingPrice - selectedProduct.purchasePrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Stok Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProduct.stock}</p>
                <p className="text-xs text-gray-500 dark:text-gray-300">{selectedProduct.unit?.name || '-'}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700 mb-1">Stok Minimum</p>
                <p className="text-2xl font-bold text-yellow-700">{selectedProduct.minStock}</p>
                <p className="text-xs text-yellow-600">{selectedProduct.unit?.name || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedProduct.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800'
                  }`}>
                  {selectedProduct.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {selectedProduct.tags && selectedProduct.tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.tags.map((tagObj, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    >
                      {tagObj.tag || tagObj}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Deskripsi</p>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
        message={`Apakah Anda yakin ingin menghapus produk "${selectedProduct?.name}"?`}
        type="danger"
        confirmText="Hapus"
        loading={formLoading}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Produk Massal"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} produk terpilih?
        
        Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus Semua"
        loading={loading}
      />

      {/* Bulk Status Confirmation */}
      <ConfirmDialog
        isOpen={bulkStatusConfirm.isOpen}
        onClose={() => setBulkStatusConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => executeBulkStatus(bulkStatusConfirm.status)}
        title={bulkStatusConfirm.status ? "Aktifkan Produk" : "Nonaktifkan Produk"}
        message={bulkStatusConfirm.status
          ? `Apakah Anda yakin ingin mengaktifkan ${selectedIds.length} produk terpilih?`
          : `Apakah Anda yakin ingin menonaktifkan ${selectedIds.length} produk terpilih?`
        }
        type={bulkStatusConfirm.status ? "success" : "warning"}
        confirmText={bulkStatusConfirm.status ? "Aktifkan" : "Nonaktifkan"}
        loading={loading}
      />
      {/* Import Modal */}
      <ProductImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadProducts();
          loadStats();
          // Modal stays open to show result, let user close it
        }}
      />
    </Layout >
  );
}